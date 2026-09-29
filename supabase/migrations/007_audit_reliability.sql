-- Apply before deploying the corresponding application changes.
ALTER TABLE public.games ADD COLUMN IF NOT EXISTS rec_enabled boolean NOT NULL DEFAULT false;
ALTER TABLE public.progress ADD COLUMN IF NOT EXISTS reset_version integer NOT NULL DEFAULT 0;

-- One outstanding checkout per player/game, including its immutable Stripe payload.
CREATE TABLE public.checkout_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  game_id uuid NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  params jsonb NOT NULL,
  stripe_session_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, game_id)
);
ALTER TABLE public.checkout_attempts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.checkout_attempts FROM anon, authenticated;
GRANT ALL ON public.checkout_attempts TO service_role;

CREATE FUNCTION public.reserve_checkout(p_user_id uuid, p_game_id uuid, p_params jsonb)
RETURNS jsonb LANGUAGE plpgsql SET search_path = public AS $$
DECLARE attempt public.checkout_attempts;
BEGIN
  INSERT INTO public.checkout_attempts (user_id, game_id, params)
    VALUES (p_user_id, p_game_id, p_params) ON CONFLICT (user_id, game_id) DO NOTHING;
  SELECT * INTO attempt FROM public.checkout_attempts
    WHERE user_id = p_user_id AND game_id = p_game_id FOR UPDATE;
  IF EXISTS (SELECT 1 FROM public.purchases WHERE user_id = p_user_id AND game_id = p_game_id AND status = 'completed') THEN
    RETURN jsonb_build_object('error', 'already_purchased');
  END IF;
  RETURN to_jsonb(attempt);
END;
$$;

-- Both writes and resets lock the same row. A reset leaves a versioned tombstone
-- so stale saves cannot recreate deleted progress, even from another device.
CREATE FUNCTION public.save_sector_progress(p_user_id uuid, p_game_id uuid, p_sector integer,
  p_stat jsonb, p_reset_version integer, p_is_admin boolean)
RETURNS jsonb LANGUAGE plpgsql SET search_path = public AS $$
DECLARE saved public.progress;
BEGIN
  INSERT INTO public.progress (user_id, game_id) VALUES (p_user_id, p_game_id)
    ON CONFLICT (user_id, game_id) DO NOTHING;
  SELECT * INTO saved FROM public.progress WHERE user_id = p_user_id AND game_id = p_game_id FOR UPDATE;
  IF saved.reset_version <> p_reset_version THEN
    RETURN jsonb_build_object('error', 'stale_progress', 'resetVersion', saved.reset_version);
  END IF;
  IF p_sector < 1 OR p_sector > 6 THEN RAISE EXCEPTION 'Invalid sector'; END IF;
  IF NOT p_is_admin AND p_sector > 1 AND NOT (p_sector - 1 = ANY(saved.completed_sectors)) THEN
    RETURN jsonb_build_object('error', 'previous_sector_required');
  END IF;
  SELECT ARRAY(SELECT DISTINCT n FROM unnest(saved.completed_sectors || p_sector) n ORDER BY n)
    INTO saved.completed_sectors;
  IF COALESCE((saved.sector_stats -> p_sector::text ->> 'kills')::integer, -1) <= (p_stat ->> 'kills')::integer THEN
    saved.sector_stats := jsonb_set(saved.sector_stats, ARRAY[p_sector::text], p_stat);
  END IF;
  UPDATE public.progress SET completed_sectors = saved.completed_sectors, sector_stats = saved.sector_stats,
    updated_at = now() WHERE user_id = p_user_id AND game_id = p_game_id;
  RETURN jsonb_build_object('completedSectors', saved.completed_sectors, 'sectorStats', saved.sector_stats,
    'resetVersion', saved.reset_version, 'carryMoney', saved.sector_stats -> p_sector::text -> 'moneyEnd',
    'carryBelt', saved.sector_stats -> p_sector::text -> 'belt');
END;
$$;

CREATE FUNCTION public.reset_sector_progress(p_user_id uuid, p_game_id uuid)
RETURNS jsonb LANGUAGE plpgsql SET search_path = public AS $$
DECLARE version integer;
BEGIN
  INSERT INTO public.progress (user_id, game_id, reset_version) VALUES (p_user_id, p_game_id, 1)
  ON CONFLICT (user_id, game_id) DO UPDATE SET completed_sectors = '{}', sector_stats = '{}',
    reset_version = progress.reset_version + 1, updated_at = now()
  RETURNING reset_version INTO version;
  RETURN jsonb_build_object('completedSectors', '[]'::jsonb, 'sectorStats', '{}'::jsonb,
    'resetVersion', version, 'carryMoney', 0, 'carryBelt', '[]'::jsonb);
END;
$$;

REVOKE ALL ON FUNCTION public.reserve_checkout(uuid, uuid, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.save_sector_progress(uuid, uuid, integer, jsonb, integer, boolean) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.reset_sector_progress(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_checkout(uuid, uuid, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.save_sector_progress(uuid, uuid, integer, jsonb, integer, boolean) TO service_role;
GRANT EXECUTE ON FUNCTION public.reset_sector_progress(uuid, uuid) TO service_role;

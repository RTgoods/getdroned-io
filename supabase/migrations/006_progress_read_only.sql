-- Close a gap: the original "users_own_progress" policy let a logged-in user
-- write directly to their own progress row via the anon key, bypassing the
-- /api/progress route's sector-order and stat-sanity checks (they couldn't
-- fake payment/purchases, only their own save data). All real reads/writes
-- already go through /api/progress or /profile using the service role, except
-- middleware's sector-unlock check, which reads via the user's own session —
-- so read access must stay, write access should not.

DROP POLICY IF EXISTS "users_own_progress" ON progress;

CREATE POLICY "read_own_progress"
  ON progress FOR SELECT
  USING (auth.uid() = user_id);

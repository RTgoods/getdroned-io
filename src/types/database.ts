export type Game = {
  id: string
  slug: string
  title: string
  tagline: string | null
  description: string | null
  long_description: string | null
  price_cents: number
  stripe_price_id: string | null
  stripe_product_id: string | null
  thumbnail_url: string | null
  screenshots: string[]
  trailer_url: string | null
  play_url: string | null
  tags: string[]
  genre: string | null
  is_published: boolean
  is_featured: boolean
  release_date: string | null
  created_at: string
  updated_at: string
}

export type Purchase = {
  id: string
  user_id: string
  game_id: string
  stripe_session_id: string | null
  stripe_payment_intent_id: string | null
  amount_paid_cents: number | null
  status: 'pending' | 'completed' | 'refunded'
  created_at: string
}

export type Profile = {
  id: string
  display_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

// Full Supabase Database schema — must include Views/Functions/Enums/CompositeTypes
export type Database = {
  public: {
    Tables: {
      games: {
        Row: Game
        Insert: {
          id?: string
          slug: string
          title: string
          tagline?: string | null
          description?: string | null
          long_description?: string | null
          price_cents?: number
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          thumbnail_url?: string | null
          screenshots?: string[]
          trailer_url?: string | null
          play_url?: string | null
          tags?: string[]
          genre?: string | null
          is_published?: boolean
          is_featured?: boolean
          release_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          slug?: string
          title?: string
          tagline?: string | null
          description?: string | null
          long_description?: string | null
          price_cents?: number
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          thumbnail_url?: string | null
          screenshots?: string[]
          trailer_url?: string | null
          play_url?: string | null
          tags?: string[]
          genre?: string | null
          is_published?: boolean
          is_featured?: boolean
          release_date?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      purchases: {
        Row: Purchase
        Insert: {
          id?: string
          user_id: string
          game_id: string
          stripe_session_id?: string | null
          stripe_payment_intent_id?: string | null
          amount_paid_cents?: number | null
          status?: 'pending' | 'completed' | 'refunded'
          created_at?: string
        }
        Update: {
          stripe_session_id?: string | null
          stripe_payment_intent_id?: string | null
          amount_paid_cents?: number | null
          status?: 'pending' | 'completed' | 'refunded'
        }
        Relationships: []
      }
      profiles: {
        Row: Profile
        Insert: {
          id: string
          display_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          display_name?: string | null
          avatar_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

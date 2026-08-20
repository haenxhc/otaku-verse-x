export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          badge_id: string | null
          category: string
          code: string
          created_at: string
          description: string | null
          id: string
          name: string
          target: number
          xp_reward: number
        }
        Insert: {
          badge_id?: string | null
          category?: string
          code: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          target?: number
          xp_reward?: number
        }
        Update: {
          badge_id?: string | null
          category?: string
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          target?: number
          xp_reward?: number
        }
        Relationships: [
          {
            foreignKeyName: "achievements_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
        ]
      }
      badges: {
        Row: {
          code: string
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          tier: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          tier?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          tier?: string
        }
        Relationships: []
      }
      comments: {
        Row: {
          content: string
          created_at: string
          id: string
          is_hidden: boolean
          likes_count: number
          parent_id: string | null
          post_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_hidden?: boolean
          likes_count?: number
          parent_id?: string | null
          post_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_hidden?: boolean
          likes_count?: number
          parent_id?: string | null
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          cover_image: string | null
          created_at: string
          id: string
          media_id: number
          media_type: Database["public"]["Enums"]["media_kind"]
          title: string | null
          user_id: string
        }
        Insert: {
          cover_image?: string | null
          created_at?: string
          id?: string
          media_id: number
          media_type: Database["public"]["Enums"]["media_kind"]
          title?: string | null
          user_id: string
        }
        Update: {
          cover_image?: string | null
          created_at?: string
          id?: string
          media_id?: number
          media_type?: Database["public"]["Enums"]["media_kind"]
          title?: string | null
          user_id?: string
        }
        Relationships: []
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      kobara_webhook_events: {
        Row: {
          created_at: string
          event_id: string | null
          event_type: string
          id: string
          payload: Json
          payment_id: string | null
          processed: boolean
        }
        Insert: {
          created_at?: string
          event_id?: string | null
          event_type: string
          id?: string
          payload: Json
          payment_id?: string | null
          processed?: boolean
        }
        Update: {
          created_at?: string
          event_id?: string | null
          event_type?: string
          id?: string
          payload?: Json
          payment_id?: string | null
          processed?: boolean
        }
        Relationships: []
      }
      likes: {
        Row: {
          created_at: string
          id: string
          target_id: string
          target_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          target_id: string
          target_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          target_id?: string
          target_type?: string
          user_id?: string
        }
        Relationships: []
      }
      media_views: {
        Row: {
          id: string
          media_id: number
          media_type: Database["public"]["Enums"]["media_kind"]
          user_id: string | null
          viewed_at: string
        }
        Insert: {
          id?: string
          media_id: number
          media_type: Database["public"]["Enums"]["media_kind"]
          user_id?: string | null
          viewed_at?: string
        }
        Update: {
          id?: string
          media_id?: number
          media_type?: Database["public"]["Enums"]["media_kind"]
          user_id?: string | null
          viewed_at?: string
        }
        Relationships: []
      }
      news_articles: {
        Row: {
          body: string | null
          category: string
          created_at: string
          id: string
          image_url: string | null
          published_at: string
          reading_minutes: number
          slug: string
          source_name: string | null
          source_url: string | null
          summary: string
          title: string
        }
        Insert: {
          body?: string | null
          category?: string
          created_at?: string
          id?: string
          image_url?: string | null
          published_at?: string
          reading_minutes?: number
          slug: string
          source_name?: string | null
          source_url?: string | null
          summary: string
          title: string
        }
        Update: {
          body?: string | null
          category?: string
          created_at?: string
          id?: string
          image_url?: string | null
          published_at?: string
          reading_minutes?: number
          slug?: string
          source_name?: string | null
          source_url?: string | null
          summary?: string
          title?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          actor_id: string | null
          body: string | null
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          actor_id?: string | null
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          actor_id?: string | null
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          checkout_url: string | null
          created_at: string
          currency: string
          gateway: string
          id: string
          kobara_payment_id: string | null
          kobara_reference: string | null
          method: Database["public"]["Enums"]["payment_method"]
          paid_at: string | null
          plan_id: string | null
          premium_expires_at: string | null
          provider_transaction_id: string | null
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          checkout_url?: string | null
          created_at?: string
          currency?: string
          gateway?: string
          id?: string
          kobara_payment_id?: string | null
          kobara_reference?: string | null
          method?: Database["public"]["Enums"]["payment_method"]
          paid_at?: string | null
          plan_id?: string | null
          premium_expires_at?: string | null
          provider_transaction_id?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          checkout_url?: string | null
          created_at?: string
          currency?: string
          gateway?: string
          id?: string
          kobara_payment_id?: string | null
          kobara_reference?: string | null
          method?: Database["public"]["Enums"]["payment_method"]
          paid_at?: string | null
          plan_id?: string | null
          premium_expires_at?: string | null
          provider_transaction_id?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "premium_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          comments_count: number
          content: string
          created_at: string
          id: string
          image_url: string | null
          is_hidden: boolean
          likes_count: number
          media_id: number | null
          media_title: string | null
          media_type: Database["public"]["Enums"]["media_kind"] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          comments_count?: number
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_hidden?: boolean
          likes_count?: number
          media_id?: number | null
          media_title?: string | null
          media_type?: Database["public"]["Enums"]["media_kind"] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          comments_count?: number
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_hidden?: boolean
          likes_count?: number
          media_id?: number | null
          media_title?: string | null
          media_type?: Database["public"]["Enums"]["media_kind"] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      premium_plans: {
        Row: {
          amount_htg: number
          code: string
          created_at: string
          description: string | null
          duration_days: number
          id: string
          is_active: boolean
          name: string
          sort_order: number
        }
        Insert: {
          amount_htg: number
          code: string
          created_at?: string
          description?: string | null
          duration_days: number
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number
        }
        Update: {
          amount_htg?: number
          code?: string
          created_at?: string
          description?: string | null
          duration_days?: number
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      premium_subscriptions: {
        Row: {
          created_at: string
          current_period_end: string
          id: string
          last_payment_id: string | null
          plan_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_period_end: string
          id?: string
          last_payment_id?: string | null
          plan_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string
          id?: string
          last_payment_id?: string | null
          plan_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "premium_subscriptions_last_payment_id_fkey"
            columns: ["last_payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "premium_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "premium_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          banner_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          favorite_genres: string[]
          id: string
          is_public: boolean
          updated_at: string
          username: string
          xp: number
        }
        Insert: {
          avatar_url?: string | null
          banner_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          favorite_genres?: string[]
          id: string
          is_public?: boolean
          updated_at?: string
          username: string
          xp?: number
        }
        Update: {
          avatar_url?: string | null
          banner_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          favorite_genres?: string[]
          id?: string
          is_public?: boolean
          updated_at?: string
          username?: string
          xp?: number
        }
        Relationships: []
      }
      ratings: {
        Row: {
          created_at: string
          id: string
          media_id: number
          media_type: Database["public"]["Enums"]["media_kind"]
          score: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          media_id: number
          media_type: Database["public"]["Enums"]["media_kind"]
          score: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          media_id?: number
          media_type?: Database["public"]["Enums"]["media_kind"]
          score?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reading_lists: {
        Row: {
          cover_image: string | null
          created_at: string
          id: string
          manga_id: number
          status: Database["public"]["Enums"]["list_status"]
          title: string | null
          total_chapters: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cover_image?: string | null
          created_at?: string
          id?: string
          manga_id: number
          status?: Database["public"]["Enums"]["list_status"]
          title?: string | null
          total_chapters?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cover_image?: string | null
          created_at?: string
          id?: string
          manga_id?: number
          status?: Database["public"]["Enums"]["list_status"]
          title?: string | null
          total_chapters?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reading_progress: {
        Row: {
          id: string
          last_chapter: number
          manga_id: number
          marked_read: boolean
          total_chapters: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          last_chapter?: number
          manga_id: number
          marked_read?: boolean
          total_chapters?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          last_chapter?: number
          manga_id?: number
          marked_read?: boolean
          total_chapters?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          id: string
          reason: string
          reporter_id: string
          status: string
          target_id: string
          target_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          reason: string
          reporter_id: string
          status?: string
          target_id: string
          target_type: string
        }
        Update: {
          created_at?: string
          id?: string
          reason?: string
          reporter_id?: string
          status?: string
          target_id?: string
          target_type?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          body: string
          created_at: string
          id: string
          media_id: number
          media_type: Database["public"]["Enums"]["media_kind"]
          score: number | null
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          media_id: number
          media_type: Database["public"]["Enums"]["media_kind"]
          score?: number | null
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          media_id?: number
          media_type?: Database["public"]["Enums"]["media_kind"]
          score?: number | null
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_id: string
          id: string
          progress: number
          unlocked_at: string | null
          user_id: string
        }
        Insert: {
          achievement_id: string
          id?: string
          progress?: number
          unlocked_at?: string | null
          user_id: string
        }
        Update: {
          achievement_id?: string
          id?: string
          progress?: number
          unlocked_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      watch_history: {
        Row: {
          anime_id: number
          completed: boolean
          cover_image: string | null
          created_at: string
          duration_seconds: number | null
          episode: number
          id: string
          position_seconds: number
          source_name: string | null
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          anime_id: number
          completed?: boolean
          cover_image?: string | null
          created_at?: string
          duration_seconds?: number | null
          episode: number
          id?: string
          position_seconds?: number
          source_name?: string | null
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          anime_id?: number
          completed?: boolean
          cover_image?: string | null
          created_at?: string
          duration_seconds?: number | null
          episode?: number
          id?: string
          position_seconds?: number
          source_name?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      watch_progress: {
        Row: {
          anime_id: number
          episodes_watched: number
          id: string
          total_episodes: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          anime_id: number
          episodes_watched?: number
          id?: string
          total_episodes?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          anime_id?: number
          episodes_watched?: number
          id?: string
          total_episodes?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      watchlists: {
        Row: {
          anime_id: number
          cover_image: string | null
          created_at: string
          id: string
          status: Database["public"]["Enums"]["list_status"]
          title: string | null
          total_episodes: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          anime_id: number
          cover_image?: string | null
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["list_status"]
          title?: string | null
          total_episodes?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          anime_id?: number
          cover_image?: string | null
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["list_status"]
          title?: string | null
          total_episodes?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      award_xp: { Args: { _amount: number }; Returns: number }
      has_active_premium: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      list_status: "planning" | "current" | "completed" | "dropped" | "paused"
      media_kind: "anime" | "manga" | "character"
      payment_method: "moncash" | "natcash" | "kobara"
      payment_status: "pending" | "paid" | "failed" | "expired" | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
      list_status: ["planning", "current", "completed", "dropped", "paused"],
      media_kind: ["anime", "manga", "character"],
      payment_method: ["moncash", "natcash", "kobara"],
      payment_status: ["pending", "paid", "failed", "expired", "cancelled"],
    },
  },
} as const

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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      game_points: {
        Row: {
          created_at: string
          game_id: string | null
          hint: string | null
          id: string
          latitude: number
          longitude: number
          sequence_number: number
          status: Database["public"]["Enums"]["point_status_type"]
          type: Database["public"]["Enums"]["point_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          game_id?: string | null
          hint?: string | null
          id?: string
          latitude: number
          longitude: number
          sequence_number: number
          status?: Database["public"]["Enums"]["point_status_type"]
          type: Database["public"]["Enums"]["point_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          game_id?: string | null
          hint?: string | null
          id?: string
          latitude?: number
          longitude?: number
          sequence_number?: number
          status?: Database["public"]["Enums"]["point_status_type"]
          type?: Database["public"]["Enums"]["point_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_points_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      games: {
        Row: {
          bounding_box: Json
          created_at: string
          creator_id: string
          difficulty: Database["public"]["Enums"]["game_difficulty_type"]
          duration: number
          ended_at: string | null
          game_code: string | null
          game_master: Database["public"]["Enums"]["game_master_type"]
          game_mode: Database["public"]["Enums"]["game_mode_type"]
          gave_up: boolean | null
          id: string
          is_public: boolean | null
          last_processing_error: string | null
          max_players: number | null
          max_radius: number
          name: string
          password: string
          player_count: number
          processing_attempts: number | null
          processing_started_at: string | null
          selected_role: Database["public"]["Enums"]["game_role_type"] | null
          started_at: string | null
          starting_point: Json | null
          status: Database["public"]["Enums"]["game_status_type"]
        }
        Insert: {
          bounding_box: Json
          created_at?: string
          creator_id: string
          difficulty?: Database["public"]["Enums"]["game_difficulty_type"]
          duration: number
          ended_at?: string | null
          game_code?: string | null
          game_master: Database["public"]["Enums"]["game_master_type"]
          game_mode: Database["public"]["Enums"]["game_mode_type"]
          gave_up?: boolean | null
          id?: string
          is_public?: boolean | null
          last_processing_error?: string | null
          max_players?: number | null
          max_radius: number
          name: string
          password: string
          player_count: number
          processing_attempts?: number | null
          processing_started_at?: string | null
          selected_role?: Database["public"]["Enums"]["game_role_type"] | null
          started_at?: string | null
          starting_point?: Json | null
          status?: Database["public"]["Enums"]["game_status_type"]
        }
        Update: {
          bounding_box?: Json
          created_at?: string
          creator_id?: string
          difficulty?: Database["public"]["Enums"]["game_difficulty_type"]
          duration?: number
          ended_at?: string | null
          game_code?: string | null
          game_master?: Database["public"]["Enums"]["game_master_type"]
          game_mode?: Database["public"]["Enums"]["game_mode_type"]
          gave_up?: boolean | null
          id?: string
          is_public?: boolean | null
          last_processing_error?: string | null
          max_players?: number | null
          max_radius?: number
          name?: string
          password?: string
          player_count?: number
          processing_attempts?: number | null
          processing_started_at?: string | null
          selected_role?: Database["public"]["Enums"]["game_role_type"] | null
          started_at?: string | null
          starting_point?: Json | null
          status?: Database["public"]["Enums"]["game_status_type"]
        }
        Relationships: []
      }
      player_locations: {
        Row: {
          accuracy: number | null
          altitude: number | null
          altitude_accuracy: number | null
          game_id: string
          heading: number | null
          id: string
          latitude: number | null
          longitude: number | null
          player_id: string
          speed: number | null
          timestamp: string
        }
        Insert: {
          accuracy?: number | null
          altitude?: number | null
          altitude_accuracy?: number | null
          game_id: string
          heading?: number | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          player_id: string
          speed?: number | null
          timestamp?: string
        }
        Update: {
          accuracy?: number | null
          altitude?: number | null
          altitude_accuracy?: number | null
          game_id?: string
          heading?: number | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          player_id?: string
          speed?: number | null
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_locations_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_locations_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          created_at: string
          game_id: string
          id: string
          role: Database["public"]["Enums"]["game_role_type"]
          status: Database["public"]["Enums"]["game_player_status_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          game_id: string
          id?: string
          role: Database["public"]["Enums"]["game_role_type"]
          status?: Database["public"]["Enums"]["game_player_status_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          game_id?: string
          id?: string
          role?: Database["public"]["Enums"]["game_role_type"]
          status?: Database["public"]["Enums"]["game_player_status_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "players_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_game_code: { Args: never; Returns: string }
      generate_unique_game_code: { Args: never; Returns: string }
      is_game_creator: {
        Args: { check_game_id: string; check_user_id: string }
        Returns: boolean
      }
      is_player_in_game: {
        Args: { check_game_id: string; check_user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      game_difficulty_type: "easy" | "medium" | "hard"
      game_master_type: "player" | "ai"
      game_mode_type: "single_player" | "two_player" | "multi_player"
      game_player_status_type: "waiting" | "ready" | "playing" | "finished"
      game_role_type: "player_a" | "player_b" | "game_master"
      game_status_type: "setup" | "ready" | "active" | "completed" | "failed"
      point_status_type: "unvisited" | "visited"
      point_type: "start" | "end" | "clue"
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
      game_difficulty_type: ["easy", "medium", "hard"],
      game_master_type: ["player", "ai"],
      game_mode_type: ["single_player", "two_player", "multi_player"],
      game_player_status_type: ["waiting", "ready", "playing", "finished"],
      game_role_type: ["player_a", "player_b", "game_master"],
      game_status_type: ["setup", "ready", "active", "completed", "failed"],
      point_status_type: ["unvisited", "visited"],
      point_type: ["start", "end", "clue"],
    },
  },
} as const

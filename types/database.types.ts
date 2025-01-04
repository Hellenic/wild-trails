export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      game_points: {
        Row: {
          created_at: string | null
          game_id: string | null
          hint: string | null
          id: string
          latitude: number
          longitude: number
          sequence_number: number
          status: Database["public"]["Enums"]["point_status_type"]
          type: Database["public"]["Enums"]["point_type"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          game_id?: string | null
          hint?: string | null
          id?: string
          latitude: number
          longitude: number
          sequence_number: number
          status?: Database["public"]["Enums"]["point_status_type"]
          type: Database["public"]["Enums"]["point_type"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          game_id?: string | null
          hint?: string | null
          id?: string
          latitude?: number
          longitude?: number
          sequence_number?: number
          status?: Database["public"]["Enums"]["point_status_type"]
          type?: Database["public"]["Enums"]["point_type"]
          updated_at?: string | null
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
          duration: number
          game_master: Database["public"]["Enums"]["game_master_type"]
          game_mode: Database["public"]["Enums"]["game_mode_type"]
          id: string
          max_radius: number
          name: string
          password: string
          player_count: number
          selected_role: Database["public"]["Enums"]["game_role_type"]
          started_at: string | null
          starting_point: Json | null
          status: Database["public"]["Enums"]["game_status_type"]
        }
        Insert: {
          bounding_box: Json
          created_at?: string
          creator_id: string
          duration: number
          game_master: Database["public"]["Enums"]["game_master_type"]
          game_mode: Database["public"]["Enums"]["game_mode_type"]
          id?: string
          max_radius: number
          name: string
          password: string
          player_count: number
          selected_role: Database["public"]["Enums"]["game_role_type"]
          started_at?: string | null
          starting_point?: Json | null
          status?: Database["public"]["Enums"]["game_status_type"]
        }
        Update: {
          bounding_box?: Json
          created_at?: string
          creator_id?: string
          duration?: number
          game_master?: Database["public"]["Enums"]["game_master_type"]
          game_mode?: Database["public"]["Enums"]["game_mode_type"]
          id?: string
          max_radius?: number
          name?: string
          password?: string
          player_count?: number
          selected_role?: Database["public"]["Enums"]["game_role_type"]
          started_at?: string | null
          starting_point?: Json | null
          status?: Database["public"]["Enums"]["game_status_type"]
        }
        Relationships: []
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
      [_ in never]: never
    }
    Enums: {
      game_master_type: "player" | "ai"
      game_mode_type: "single_player" | "two_player" | "multi_player"
      game_player_status_type: "waiting" | "ready" | "playing" | "finished"
      game_role_type: "player_a" | "player_b" | "game_master" | "ready"
      game_status_type: "setup" | "ready" | "active" | "completed"
      point_status_type: "unvisited" | "visited"
      point_type: "start" | "end" | "clue"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

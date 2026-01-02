import type { Database, Tables } from "@/types/database.types";

export type Game = Tables<"games"> & {
  starting_point?: {
    lat: number;
    lng: number;
  };
  bounding_box: {
    northWest: {
      lat: number;
      lng: number;
    };
    southEast: {
      lat: number;
      lng: number;
    };
  };
};

export type GameDetails = Game & {
  players: Tables<"players">[];
};

export type GamePoint = Tables<"game_points">;

export type Player = Tables<"players">;

// Enum types derived from database schema (source of truth)
export type GameRole = Database["public"]["Enums"]["game_role_type"];
export type GameMode = Database["public"]["Enums"]["game_mode_type"];
export type GameMaster = Database["public"]["Enums"]["game_master_type"];
export type GameStatus = Database["public"]["Enums"]["game_status_type"];
export type GameDifficulty = Database["public"]["Enums"]["game_difficulty_type"];
export type PlayerStatus = Database["public"]["Enums"]["game_player_status_type"];
export type PointType = Database["public"]["Enums"]["point_type"];
export type PointStatus = Database["public"]["Enums"]["point_status_type"];

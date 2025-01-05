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

export type GameRole = Game["selected_role"];
export type GameMode = Database["public"]["Enums"]["game_mode_type"];
export type GameMaster = Database["public"]["Enums"]["game_master_type"];

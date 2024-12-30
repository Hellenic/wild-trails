import type { Database, Tables } from "@/types/database.types";

export type GameRole = Database["public"]["Enums"]["game_role_type"];
export type GameMode = Database["public"]["Enums"]["game_mode_type"];
export type GameMaster = Database["public"]["Enums"]["game_master_type"];

export type Game = Tables<"games"> & {
  starting_point: {
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

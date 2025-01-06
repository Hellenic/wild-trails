import React from "react";
import { GameContextProvider } from "../components/GameContext";

export default function GameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <GameContextProvider>{children}</GameContextProvider>;
}

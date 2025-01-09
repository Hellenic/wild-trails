import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Wild Trails",
    short_name: "Wild Trails",
    description:
      "Wild Trails is a real-world adventure game that combines orienteering, puzzle-solving, and geocaching, where players navigate through wilderness using clues to find their final destination within a time limit.",
    start_url: "/",
    display: "standalone",
    background_color: "#e8eee7",
    theme_color: "#1a2f25",
    icons: [
      {
        src: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    screenshots: [
      {
        src: "/screenshots/desktop1.png",
        sizes: "2495x1175",
        type: "image/png",
        form_factor: "wide",
      },
      {
        src: "/screenshots/desktop2.png",
        sizes: "2495x1175",
        type: "image/png",
        form_factor: "wide",
      },
      {
        src: "/screenshots/mobile1.png",
        sizes: "412x918",
        type: "image/png",
      },
      {
        src: "/screenshots/mobile2.png",
        sizes: "412x918",
        type: "image/png",
      },
    ],
  };
}

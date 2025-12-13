# Wild Trails

Wild Trails is an outdoor adventure game that transforms traditional orienteering into an engaging treasure hunt.

Player(s) start from point A and must discover the location of their destination (point B) by visiting optional waypoints that provide hints and puzzles along the way. The game can be played solo with AI assistance, with two players working together, or as a more complex experience where one player creates physical clues and challenges for others to solve in a 24-hour wilderness adventure. It combines elements of orienteering, geocaching, and puzzle-solving while testing players' outdoor navigation and survival skills.

> Keywords: orienteering, geocaching, puzzle-solving, outdoor adventure, survival skills, AI assistance, treasure hunt, human vs. wilderness,
> human vs. nature, survival & adventure, AI, gamification

## More details

Read the [synopsis](./synopsis.md) for more details.

## Recent Improvements

- [x] **Landmark-Based Goals**: Final goals snap to distinct landmarks (peaks, towers, historic sites) when 3+ are available, ensuring game variety
- [x] **Progressive Path Generation**: Points now follow a logical forward progression from start to end (no more backtracking!)
- [x] **AI-Powered Hints**: Contextual, progressive hints using Google Gemini with OSM landmark data
- [x] **Enhanced Fallback Hints**: Mathematical hints with directional landmark information
- [x] **OSM-Based Point Placement**: Intelligent point generation avoiding water, buildings, and inaccessible areas

## Upcoming features

> Current focus: Single player game polish & testing

- [ ] **Testing & Refinement**: Extensive testing of progressive path generation with various distances and terrains
- [ ] **Difficulty Settings**: Medium and hard difficulty levels with wider corridors and zig-zag patterns
- [ ] More rich events for points in addition to proximity check (server-sent events)
- [ ] Finalize game creation flow; single player mode player cannot be GM. Without role, if you join game possible.
- [ ] Curated list of games? Similar to "kiintorastit", could use existing orienteering points and/or geocaches
- [ ] Rewards for completing games (e.g. badges, personal records, points, achievements, virtual collectibles)
- [ ] "Feel-good" elements (e.g. "You are the first to complete this game!"), encouraging messages, visual rewards, fun facts, comparisons...

## Future features?
 - Critical line + time to get to the line
 - Penalties for not achieving something, e.g. not reaching the critical line in time
 - Offers: Trade time for more tips, or trade tips for more time
 - S.E.R.E. elements?
 - Integrate Garmin InReach or similar GPS trackers to get location updates without phone
   - GPS tracker + map and compass on multi-player games would be neat

## Technical Considerations

### OpenStreetMap Data (Overpass API)
We currently use the public Overpass API for fetching map data (landmarks, terrain features, etc.):
- ✅ **Current usage**: <1% of daily limits (~100 requests/day vs 10,000 limit)
- ✅ **Perfect for MVP**: Free, reliable, well-documented
- 🔮 **Future consideration (growth)**: Self-hosted Overpass instance
  - Removes rate limits entirely
  - Allows custom data enrichment (add game-specific landmarks, verified waypoints, etc.)
  - Full control over data freshness and availability
  - Consider when reaching 1000+ games/day

See [Overpass API best practices](https://wiki.openstreetmap.org/wiki/Overpass_API) for more details.

### Distance Calculations
We currently use a **simplified Euclidean approximation** for distance calculations, which is fast and perfectly suitable for gameplay:
- ✅ **0.1-0.6% error** at high latitudes (e.g., 16m error over 16km in Finland)
- ✅ **Perfect for gameplay**: Hints are rounded to ±100m anyway, so formula errors are invisible to players
- ✅ **Fast**: Single `cos()` operation vs. Haversine's 6x more trigonometry

**Future consideration**: If we ever need sub-meter accuracy (e.g., for precise fitness tracking or navigation features), we could switch to the Haversine formula. However, for treasure hunt gameplay with hint-based exploration, the current approach is optimal.

See [docs/distance-calculation-explained.md](./docs/distance-calculation-explained.md) for detailed technical explanation.

## Interesting things
 - Trailmap.fi, MapAnt.fi
 - Wandrer
 - 

# Developing the application

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

Read the [instructions](./docs/instructions.md) for more details on how the application works.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).
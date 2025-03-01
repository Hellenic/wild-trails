# Wild Trails

Wild Trails is an outdoor adventure game that transforms traditional orienteering into an engaging treasure hunt.

Player(s) start from point A and must discover the location of their destination (point B) by visiting optional waypoints that provide hints and puzzles along the way. The game can be played solo with AI assistance, with two players working together, or as a more complex experience where one player creates physical clues and challenges for others to solve in a 24-hour wilderness adventure. It combines elements of orienteering, geocaching, and puzzle-solving while testing players' outdoor navigation and survival skills.

> Keywords: orienteering, geocaching, puzzle-solving, outdoor adventure, survival skills, AI assistance, treasure hunt, human vs. wilderness,
> human vs. nature, survival & adventure, AI, gamification

## More details

Read the [synopsis](./synopsis.md) for more details.

## Upcoming features

> Current focus: Single player game

- [ ] Points don't show as visited after refresh
- [ ] Point hints do not make sense, and do not help finding the goal. Currently it's still needle in the haystack.
- [ ]   --[ A lot of actual testing ]--
- [ ]   ....
- [ ] More rich events for points in addition to proximity check (server-sent events)
- [ ] AI game point generation strategy? or AI validation so that each game point is accessible.
- [ ] Finalize game creation flow; single player mode player cannot be GM. Without role, if you join game possible.
- [ ] Curated list of games? Similar to "kiintorastit", could use existing orienteering points and/or geocaches
- [ ] Rewards for completing games (e.g. badges, personal records, points, achievements, virtual collectibles)
- [ ] "Feel-good" elements (e.g. "You are the first to complete this game!"), encouraging messages, visual rewards, fun facts, comparisons...
- [ ] Game master view could be prepopulated with AI-generated points

## Future features?
 - Critical line + time to get to the line
 - Penalties for not achieving something, e.g. not reaching the critical line in time
 - Offers: Trade time for more tips, or trade tips for more time
 - S.E.R.E. elements?
 - Integrate Garmin InReach or similar GPS trackers to get location updates without phone
   - GPS tracker + map and compass on multi-player games would be neat

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
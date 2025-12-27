# Wild Trails

Wild Trails is an outdoor adventure game that transforms traditional orienteering into an engaging treasure hunt.

Player(s) start from point A and must discover the location of their destination (point B) by visiting optional waypoints that provide hints and puzzles along the way. The game can be played solo with AI assistance, with two players working together, or as a more complex experience where one player creates physical clues and challenges for others to solve in a 24-hour wilderness adventure. It combines elements of orienteering, geocaching, and puzzle-solving while testing players' outdoor navigation and survival skills.

> Keywords: orienteering, geocaching, puzzle-solving, outdoor adventure, survival skills, AI assistance, treasure hunt, human vs. wilderness,
> human vs. nature, survival & adventure, AI, gamification

## More details

Read the [synopsis](./synopsis.md) for more details.

## Recent Improvements

- [x] **Modern UI Design System**: Complete redesign with glassmorphism effects, vibrant green branding, and polished components
- [x] **Reusable Component Library**: Button, Input, GlassPanel, Icon, Toast notifications, and Skeleton loaders
- [x] **Enhanced Login/Welcome**: Beautiful hero section with background imagery and glass panel authentication
- [x] **Improved Navigation**: Icon-based navigation with smooth animations and responsive design
- [x] **Accessibility-First**: WCAG AA compliant with keyboard navigation and screen reader support
- [x] **Landmark-Based Goals**: Final goals snap to distinct landmarks (peaks, towers, historic sites) when 3+ are available, ensuring game variety
- [x] **Progressive Path Generation**: Points now follow a logical forward progression from start to end (no more backtracking!)
- [x] **AI-Powered Hints**: Contextual, progressive hints using Google Gemini with OSM landmark data
- [x] **Enhanced Fallback Hints**: Mathematical hints with directional landmark information
- [x] **OSM-Based Point Placement**: Intelligent point generation avoiding water, buildings, and inaccessible areas

## Upcoming features

> Current focus: Single player game polish & testing

- [ ] **Testing & Refinement**: Extensive testing of progressive path generation with various distances and terrains
- [ ] More rich events for points in addition to proximity check (server-sent events)

### Roadmap

- [ ] Multiplayer game - [.cursor/plans/multiplayer_phase_2a+2b_2f97d51f.plan.md]
- [ ] Native mobile app - [.cursor/plans/native_mobile_client_with_expo_7312b0da.plan.md] (Designs exist in Stitch)
- [ ] Crawler for rich, existing game points - [.cursor/plans/content_ingestion_scraper_system_bb341af8.plan.md]
- [ ] Curated & public games - [.cursor/plans/public_templates_&_curated_games_6356b520.plan.md]
- [ ] Social features (e.g. friend list, scoreboards)
- [ ] Rewards for completing games (e.g. badges, personal records, points, achievements, XP, virtual collectibles)

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

## Design System

Modern UI built with Tailwind CSS featuring glassmorphism effects and vibrant green branding (`#13ec13`).

**Components** (`/app/components/ui/`): Button, Input, GlassPanel, Icon, Skeleton, Toast  
**Fonts**: Be Vietnam Pro (display), Noto Sans (body)  
**Icons**: Material Symbols Outlined  
**Utils**: `cn()` helper (clsx + tailwind-merge)

```tsx
import { Button, Icon, cn } from "@/app/components/ui";

<Button variant="primary" size="lg">
  <Icon name="add" className="mr-2" />
  Create Game
</Button>
```

All components are accessible (WCAG AA), mobile-responsive, and tested with React Testing Library.  
See `.cursorrules` for usage guidelines.

## Interesting things
 - Trailmap.fi, MapAnt.fi
 - Wandrer
 - 

# Developing the application

## Initial Setup (First Time)

### Prerequisites
- Node.js 18+ or Bun
- Vercel account
- Supabase account
- Google AI Studio API key (for Gemini)

### 1. Clone and Install

```bash
git clone <repository-url>
cd wild-trails
npm install  # or: bun install
```

### 2. Set Up Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Login and link project
vercel login
vercel link
```

### 3. Set Up Supabase

1. **Create a Supabase project** at https://supabase.com/dashboard

2. **Update project reference** in `package.json`:
   ```json
   {
     "scripts": {
       "db:setup": "supabase link --project-ref YOUR_PROJECT_REF",
       "db:generate-types": "supabase gen types typescript --project-id \"YOUR_PROJECT_REF\" ..."
     }
   }
   ```

3. **Link your local project**:
   ```bash
   npm run db:login     # Login to Supabase
   npm run db:setup     # Link to your project
   ```

4. **Apply database migrations** (includes enabling Realtime):
   ```bash
   npm run db:apply-migrations  # Applies all migrations in supabase/migrations/
   ```
   
   This will:
   - ✅ Create all database tables
   - ✅ Set up row-level security policies
   - ✅ **Enable Realtime for game tables** (critical for waypoints!)
   
### 4. Environment Variables

Create `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Google AI (Gemini)
GEMINI_API_KEY=your-gemini-api-key
```

Get these from:
- **Supabase**: Project Settings → API
- **Gemini**: https://aistudio.google.com/app/apikey

### 5. Verify Setup

```bash
# Test database connection
npm run db:generate-types

# Should generate types/database.types.ts successfully
```

### 6. Run Development Server

```bash
npm run dev  # or: bun dev

# Open http://localhost:3000
```

## Daily Development

Once initial setup is complete:

```bash
npm run dev  # Start dev server
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

Read the [instructions](./docs/instructions.md) for more details on how the application works.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Database Migrations

### Creating a New Migration

```bash
npm run db:create-migration your_migration_name
```

This creates a new file in `supabase/migrations/` where you can write SQL.

### Applying Migrations

```bash
npm run db:apply-migrations
```

This pushes all pending migrations to your Supabase database.

### Generating TypeScript Types

After schema changes:

```bash
npm run db:generate-types
```

This updates `types/database.types.ts` with your current schema.

## Testing

```bash
# Run unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm test -- --coverage

# Run E2E tests (Playwright)
npm run test:e2e
```

## Deployment

### Deploy to Vercel

```bash
# Preview deployment
vercel

# Production deployment
vercel --prod
```

### Pre-Deployment Checklist

1. ✅ All tests passing (`npm test`)
2. ✅ Migrations applied (`npm run db:apply-migrations`)
3. ✅ **Realtime enabled** on `game_points` table (critical!)
4. ✅ Environment variables set in Vercel dashboard
5. ✅ Sound files in `public/sounds/` directory

See [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) for complete list.

## Troubleshooting

### Waypoints Not Triggering?

**Most likely**: Supabase Realtime not enabled on `game_points` table.

**Fix**: See [ENABLE_REALTIME.md](./ENABLE_REALTIME.md)

### Database Type Errors?

Re-generate types after schema changes:

```bash
npm run db:generate-types
```

### Migration Errors?

Check migration history:

```bash
supabase migration list
```

## Learn More

To learn more about the technologies used:

- [Next.js Documentation](https://nextjs.org/docs) - Next.js features and API
- [Supabase Documentation](https://supabase.com/docs) - Database, auth, and realtime
- [Tailwind CSS](https://tailwindcss.com/docs) - Utility-first CSS framework
- [Leaflet](https://leafletjs.com/) - Interactive maps

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).
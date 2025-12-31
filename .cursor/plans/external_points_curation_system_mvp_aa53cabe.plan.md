---
name: External Points Curation System MVP
overview: Build a curation system for external game points with staging (external_game_points), verification/enrichment UI, and production storage (curated_game_points) that integrates with game creation.
todos:
  - id: db-schema
    content: Create migration for external_game_points and curated_game_points tables with indexes and RLS
    status: pending
  - id: admin-auth
    content: Implement admin authorization middleware and helpers
    status: pending
  - id: external-api
    content: Create API endpoints for external points management
    status: pending
  - id: curated-api
    content: Create API endpoints for curated points management
    status: pending
  - id: curation-api
    content: Create curation endpoint to move points from external to curated
    status: pending
    dependencies:
      - external-api
      - curated-api
  - id: admin-layout
    content: Create admin layout with navigation and auth checks
    status: pending
    dependencies:
      - admin-auth
  - id: external-ui
    content: Build external points list UI with filters and actions
    status: pending
    dependencies:
      - admin-layout
      - external-api
  - id: curation-form
    content: Build curation form UI with map preview and enrichment fields
    status: pending
    dependencies:
      - admin-layout
      - curation-api
  - id: curated-ui
    content: Build curated points list UI with management features
    status: pending
    dependencies:
      - admin-layout
      - curated-api
  - id: browse-api
    content: Create public browsing endpoint for curated points in game creation
    status: pending
  - id: game-integration
    content: Integrate curated points browser into game creation flow
    status: pending
    dependencies:
      - browse-api
  - id: seed-script
    content: Create manual data entry script for Espoo kiintorastit points
    status: pending
  - id: testing
    content: Test full curation workflow end-to-end
    status: pending
    dependencies:
      - curation-form
      - game-integration
      - seed-script
---

# External Points Curation System MVP

## Overview

Build infrastructure for ingesting, curating, and using external geographic points (orienteering routes, geocaches) as ready-made game points. The system uses a two-table workflow: staging area for raw/scraped data, and production table for verified points.**Key Discovery**: Espoo kiintorastit data is available in structured geospatial formats (KMZ/GPX) via Routechoices.com (https://rp.routechoices.com/espoo-kiintorastit), eliminating the need for PDF parsing or HTML scraping for the initial data source.

## Data Sources

### Initial Source: Routechoices.com - Espoo Kiintorastit

**URL**: https://rp.routechoices.com (organized by "Rohkea pummi")**Available Data**:

- Multiple orienteering control point routes across Espoo (2024-2025 seasons)
- Structured exports via API: `https://api.routechoices.com/events/{eventId}/kmz-1`
- Formats: KMZ (Google Earth), GPX (GPS Exchange Format), ZIP (all data)
- Each route contains waypoints with precise GPS coordinates

**Known Events** (examples):

- Espoo kiintorastit Pirttimäki-Isosuo (`hSkum6v5uLk`)
- Kvarken-O, Jämin suunnistusmarathon, Vanha satama, etc.
- Archive browsable at https://rp.routechoices.com

**Data Quality**: High - professionally mapped orienteering control points with reflectors, maintained annually

### Future Data Sources

**Geocaching Data**:

- Geocache locations are public but subject to usage guidelines
- Commercial use or system integration requires permission from geocaching platforms
- Terms of service must be reviewed before integration
- Source: [Geocaching.com Guidelines](https://www.geocaching.com/play/guidelines)

**OpenStreetMap POIs**:

- Public domain geographic data via Overpass API
- Can query for hiking trails, viewpoints, natural features
- No usage restrictions for our application type

**Other Orienteering Organizations**:

- Similar data may be available from other Finnish orienteering clubs
- Would require reaching out to organizations individually

## Architecture

### Data Flow

1. **Ingestion** → Raw data enters `external_game_points` (via scraper or manual entry)
2. **Curation** → Admin reviews/enriches points via management UI
3. **Production** → Approved points move to `curated_game_points`
4. **Game Creation** → Users browse/select curated points for their games

### Database Tables

**Staging: `external_game_points`**

- Raw, unverified data from external sources
- Includes source metadata for traceability
- Can contain duplicates or low-quality data

**Production: `curated_game_points`**

- Verified, enriched, ready-to-use points
- Admin-approved with quality guarantees
- Used in game creation interface

## Implementation Steps

### Phase 1: Database Schema

**File:** `supabase/migrations/[timestamp]_external_points_curation.sql`Create two tables:**1. `external_game_points` (staging)**

```sql
- id (uuid, pk)
- latitude (double precision, not null)
- longitude (double precision, not null)
- source_tag (text, not null) -- e.g., 'espoo_kiintorastit_2024', 'manual_entry'
- point_name (text, nullable)
- description (text, nullable)
- difficulty (integer, 1-5, nullable)
- metadata (jsonb, nullable) -- source-specific data
- created_at (timestamptz)
- updated_at (timestamptz)
- is_processed (boolean, default false) -- flag for curation status

Indexes:
- idx_external_points_source on source_tag
- idx_external_points_location on (latitude, longitude)
- idx_external_points_processed on is_processed

RLS:
- Read: Authenticated users (for admin UI)
- Insert: Service role only (for scrapers)
- Update: Authenticated users with admin role
- Delete: Authenticated users with admin role
```

**2. `curated_game_points` (production)**

```sql
- id (uuid, pk)
- external_point_id (uuid, references external_game_points, nullable)
- latitude (double precision, not null)
- longitude (double precision, not null)
- source_tag (text, not null)
- point_name (text, not null) -- required for curated points
- description (text, not null) -- enriched description
- difficulty (integer, 1-5, not null)
- terrain_type (text, nullable) -- 'forest', 'urban', 'mixed', etc.
- tags (text[], nullable) -- ['orienteering', 'beginner-friendly', etc.]
- metadata (jsonb, nullable)
- curated_by (uuid, references auth.users)
- curated_at (timestamptz)
- created_at (timestamptz)
- updated_at (timestamptz)

Indexes:
- idx_curated_points_location on (latitude, longitude)
- idx_curated_points_terrain on terrain_type
- idx_curated_points_difficulty on difficulty
- idx_curated_points_tags on tags using GIN

RLS:
- Read: All authenticated users (for game creation)
- Insert: Authenticated users with admin role
- Update: Authenticated users with admin role
- Delete: Authenticated users with admin role
```

**3. User roles table** (if not exists)

```sql
- Add 'is_admin' column to profiles table or create separate admin_users table
```

After migration, run: `npm run db:generate-types`

### Phase 2: Admin Management UI

**2.1 Create admin route structure**Files:

- [`app/admin/points/page.tsx`](app/admin/points/page.tsx) - Main points management page
- [`app/admin/points/external/page.tsx`](app/admin/points/external/page.tsx) - External points staging list
- [`app/admin/points/curated/page.tsx`](app/admin/points/curated/page.tsx) - Curated points list
- [`app/admin/points/curate/[id]/page.tsx`](app/admin/points/curate/[id]/page.tsx) - Curation form for single point

**2.2 External points list** (`app/admin/points/external/page.tsx`)Features:

- Table showing all external points with filters (source, processed status)
- Columns: Name, Source, Location, Difficulty, Status
- Actions: View on map, Edit/Curate, Delete, Bulk actions
- Pagination for large datasets

**2.3 Curation form** (`app/admin/points/curate/[id]/page.tsx`)Features:

- Map preview showing point location
- Editable fields: name, description, difficulty, terrain_type, tags
- Source metadata display (read-only)
- "Approve & Move to Curated" button
- "Reject/Delete" button
- Save as draft (update external point without moving)

**2.4 Curated points list** (`app/admin/points/curated/page.tsx`)Features:

- Similar to external list but shows production-ready points
- Additional filters: terrain type, tags, difficulty
- Actions: Edit, Delete, View on map
- Export functionality (future: bulk export as JSON/CSV)

**2.5 Admin layout** (`app/admin/layout.tsx`)

- Verify user has admin permissions (redirect if not)
- Navigation sidebar: Dashboard, External Points, Curated Points
- Breadcrumb navigation

### Phase 3: API Endpoints for Admin UI

**3.1 External points endpoints**[`app/api/admin/points/external/route.ts`](app/api/admin/points/external/route.ts)

```typescript
GET  - List external points (with filters, pagination)
POST - Create external point manually
```

[`app/api/admin/points/external/[id]/route.ts`](app/api/admin/points/external/[id]/route.ts)

```typescript
GET    - Get single external point
PUT    - Update external point (for draft edits)
DELETE - Delete external point
```

**3.2 Curation endpoint**[`app/api/admin/points/curate/route.ts`](app/api/admin/points/curate/route.ts)

```typescript
POST - Move external point to curated (with enriched data)
Body: { external_point_id, enriched_data: {...} }
Flow:
    1. Validate admin permissions
    2. Insert into curated_game_points
    3. Mark external point as processed
    4. Return curated point
```

**3.3 Curated points endpoints**[`app/api/admin/points/curated/route.ts`](app/api/admin/points/curated/route.ts)

```typescript
GET - List curated points (with filters, search, pagination)
```

[`app/api/admin/points/curated/[id]/route.ts`](app/api/admin/points/curated/[id]/route.ts)

```typescript
GET    - Get single curated point
PUT    - Update curated point
DELETE - Delete curated point
```

**3.4 Authorization middleware**[`lib/api/admin-auth.ts`](lib/api/admin-auth.ts)

```typescript
- requireAdmin() - Check user has admin role, throw 403 if not
- isAdmin(userId) - Helper to check admin status
```



### Phase 4: Integration with Game Creation

**4.1 Update game creation flow**Modify [`app/game/create/page.tsx`](app/game/create/page.tsx):

- Add "Use Curated Points" option/tab
- Browse/search curated points interface
- Filter by location, difficulty, terrain type
- Select points to include in game
- Preview selected points on map

**4.2 Curated points browser component**[`app/game/create/components/CuratedPointsBrowser.tsx`](app/game/create/components/CuratedPointsBrowser.tsx)

- Search/filter UI
- Point cards with preview info
- Map showing point locations
- Selection mechanism (checkboxes)
- "Add Selected to Game" action

**4.3 API endpoint for browsing**[`app/api/points/curated/browse/route.ts`](app/api/points/curated/browse/route.ts)

```typescript
GET - Public endpoint for browsing curated points
Query params: lat, lng, radius, difficulty, terrain_type, tags
Returns: Filtered list of curated points within area
```



### Phase 5: Data Import from Routechoices.com

**Important Discovery**: Espoo kiintorastit data is available in structured formats (KMZ/GPX) via Routechoices.com API at https://rp.routechoices.com**5.1 Install geospatial parsing dependencies**Add to [`package.json`](package.json):

```bash
npm install jszip @tmcw/togeojson
npm install -D @types/geojson
```



- `jszip` - Parse KMZ files (which are zipped KML)
- `@tmcw/togeojson` - Convert KML/GPX to GeoJSON

**5.2 Create KMZ/GPX parser utility**[`lib/scraper/geospatial-parser.ts`](lib/scraper/geospatial-parser.ts)

```typescript
// Functions to parse KMZ/GPX files and extract waypoints
// - parseKMZ(buffer: Buffer): Promise<GeoJSON>
// - parseGPX(xmlString: string): GeoJSON
// - extractWaypoints(geojson: GeoJSON): ExternalPoint[]
```

**5.3 Create Routechoices data fetcher**[`lib/scraper/routechoices-fetcher.ts`](lib/scraper/routechoices-fetcher.ts)

```typescript
// Fetch data from Routechoices API
// API pattern: https://api.routechoices.com/events/{eventId}/kmz-1
// Known Espoo events: See https://rp.routechoices.com for event IDs
const espooEvents = [
  { id: 'hSkum6v5uLk', name: 'Espoo kiintorastit Pirttimäki-Isosuo' },
  // ... more events from the archive
];
```

**5.4 Create import script**[`scripts/import-espoo-points.ts`](scripts/import-espoo-points.ts)

```typescript
// Script to download KMZ files from Routechoices and import points
// 1. Fetch KMZ for each Espoo event
// 2. Parse waypoints/control points
// 3. Insert into external_game_points table
// 4. Tag with source: 'routechoices_espoo_kiintorastit_2025'
```

Run with: `npx tsx scripts/import-espoo-points.ts`**5.5 Add npm scripts**Update [`package.json`](package.json):

```json
"scripts": {
  "import:espoo": "tsx scripts/import-espoo-points.ts",
  "import:routechoices": "tsx scripts/import-espoo-points.ts"
}
```



### Phase 6: Testing

**6.1 Test database operations**[`__tests__/admin/points-curation.test.ts`](tests/admin/points-curation.test.ts)

- Test external point creation
- Test curation flow (external → curated)
- Test admin authorization
- Test point queries/filters

**6.2 Manual testing checklist**

1. Insert test external points via seed script
2. Access admin UI, verify points appear
3. Curate a point (enrich, approve, move to curated)
4. Verify point appears in curated list
5. Access game creation, browse curated points
6. Filter by location/difficulty
7. Select points and verify they work in game setup

## File Structure

```javascript
app/
  admin/
    layout.tsx              # Admin layout with auth check
    points/
      page.tsx              # Admin points dashboard
      external/
        page.tsx            # External points list
      curated/
        page.tsx            # Curated points list
      curate/
        [id]/
          page.tsx          # Curation form
  api/
    admin/
      points/
        external/
          route.ts          # List/create external points
          [id]/
            route.ts        # Get/update/delete external point
        curate/
          route.ts          # Move external → curated
        curated/
          route.ts          # List curated points
          [id]/
            route.ts        # Get/update/delete curated point
    points/
      curated/
        browse/
          route.ts          # Public browsing endpoint
  game/
    create/
      components/
        CuratedPointsBrowser.tsx  # Browse/select curated points

lib/
  api/
    admin-auth.ts           # Admin authorization helpers
  scraper/
    geospatial-parser.ts    # KMZ/GPX parsing utilities
    routechoices-fetcher.ts # Routechoices API client
    types.ts                # TypeScript types for scraper

scripts/
  import-espoo-points.ts    # Import script for Routechoices data

supabase/
  migrations/
    [timestamp]_external_points_curation.sql

__tests__/
  admin/
    points-curation.test.ts
```



## Key Design Decisions

1. **Two-table workflow** - Separates raw/unverified data from production-ready points
2. **Admin-only curation** - Quality control via manual review before points go live
3. **Direct DB writes** - No API layer for scraper (uses service role), simplifies architecture
4. **Structured data import** - Use KMZ/GPX parsing instead of PDF extraction for Routechoices data
5. **Standard geospatial formats** - Leverage existing libraries (`jszip`, `@tmcw/togeojson`) instead of custom parsers
6. **Future-ready** - Structure supports other data sources (OpenStreetMap, geocaching APIs) later without refactoring

## Dependencies

Already installed:

- `zod` (validation) ✓
- `@supabase/supabase-js` (database) ✓
- `@ai-sdk/google` (future: Gemini for extraction) ✓

New dependencies for MVP:

- `jszip` - Parse KMZ files (zipped KML)
- `@tmcw/togeojson` - Convert KML/GPX to GeoJSON
- `@types/geojson` (dev) - TypeScript types for GeoJSON

## Environment Variables

None required for MVP (using direct DB access via service role in server components).

## Future Enhancements (Post-MVP)

1. **Automated scraper** - Fetch data from Espoo website, other sources
2. **AI extraction** - Use Gemini to extract structured data from HTML/PDFs
3. **Bulk operations** - Approve/reject multiple points at once
4. **Point quality scoring** - Automatic quality assessment
5. **User submissions** - Allow regular users to suggest points for curation
6. **Cron automation** - Schedule regular scraping runs
7. Add more data sources (geocaching.com API, OpenStreetMap POIs, etc.)

## Success Criteria

- ✅ Can manually insert external points via seed script
- ✅ Admin UI allows browsing/filtering external points
- ✅ Can curate point (enrich + move to curated table)
- ✅ Curated points appear in game creation flow
- ✅ Can create game using curated points
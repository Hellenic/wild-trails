---
name: Content Ingestion Scraper System
overview: Implement a scheduled scraper system that fetches geographic data from external sources (geocaches, orienteering routes, etc.), normalizes it using AI extraction, and securely submits it to the Core API ingestion endpoint for use as ready-made game points.
todos:
  - id: db-schema
    content: Create database migration for `external_game_points` table with proper indexes and RLS policies
    status: pending
  - id: data-sources
    content: Create data source configuration system in `lib/scraper/data-sources.ts` with initial source definitions
    status: pending
  - id: ai-extractor
    content: Implement AI extraction service using chosen provider (Firecrawl/OpenAI/Gemini) with structured output support
    status: pending
    dependencies:
      - data-sources
  - id: extraction-schemas
    content: Create Zod schemas for different point types (orienteering, geocache, generic) in `lib/scraper/extraction-schemas.ts`
    status: pending
  - id: validation
    content: Implement validation utilities for coordinates, data normalization, and deduplication
    status: pending
    dependencies:
      - extraction-schemas
  - id: fetcher
    content: Create HTTP fetching utilities with authentication, rate limiting, and retry logic
    status: pending
  - id: api-client
    content: Implement Core API client for submitting points to ingestion endpoint with error handling
    status: pending
    dependencies:
      - validation
  - id: scraper-function
    content: Create main scraper function in `app/api/cron/scrape-external-points/route.ts` that orchestrates the entire scraping flow
    status: pending
    dependencies:
      - ai-extractor
      - fetcher
      - api-client
  - id: vercel-cron
    content: Configure Vercel Cron job in `vercel.json` to trigger scraper daily
    status: pending
    dependencies:
      - scraper-function
  - id: error-handling
    content: Implement comprehensive error handling and logging for scraper operations
    status: pending
    dependencies:
      - scraper-function
  - id: testing
    content: Create test suite for scraper components and manual testing endpoint
    status: pending
    dependencies:
      - scraper-function
---

# Content Ingestion Scraper System Implementation Plan

## Overview

This plan implements a scheduled scraper system that fetches unstructured/semi-structured geographic data from external sources, normalizes it using AI-powered extraction, and securely delivers it to the Core API Layer via the ingestion endpoint. The scraper runs as a Vercel Cron Job triggering a serverless function.

## Architecture Components

### 1. Scheduler

- **Technology**: Vercel Cron Jobs
- **Location**: `vercel.json` cron configuration
- **Frequency**: Daily (configurable)

### 2. Scraper Function

- **Technology**: Vercel Serverless Function (Node.js/TypeScript)
- **Location**: `app/api/cron/scrape-external-points/route.ts`
- **Trigger**: Vercel Cron Job

### 3. Data Sources Configuration

- **Location**: `lib/scraper/data-sources.ts` or Supabase config table
- **Format**: Array of source definitions with URLs, source tags, and extraction schemas

### 4. AI Extraction Service

- **Technology**: AI Web Scraper API (Firecrawl, OpenAI, or Gemini with structured outputs)
- **Location**: `lib/scraper/ai-extractor.ts`
- **Purpose**: Extract structured data from HTML/JSON content

### 5. Data Validation

- **Technology**: Zod schemas
- **Location**: `lib/scraper/validation.ts`
- **Purpose**: Validate extracted data before submission

### 6. Core API Integration

- **Endpoint**: `/api/ingestion/external-points` (from refactoring #1)
- **Authentication**: `INGESTION_API_SECRET` Bearer token
- **Location**: `lib/scraper/api-client.ts`

## Implementation Steps

### Phase 1: Database Schema for External Points

**1.1 Create `external_game_points` table migration**

- File: `supabase/migrations/[timestamp]_external_game_points.sql`
- Fields:
  - `id` (uuid, primary key)
  - `latitude` (double precision, not null)
  - `longitude` (double precision, not null)
  - `source_tag` (text, not null) - e.g., 'fi_orienteering_portal', 'geocaching_regional'
  - `point_name` (text, nullable) - name from source
  - `description` (text, nullable) - description from source
  - `difficulty` (integer, nullable) - 1-5 rating if available
  - `metadata` (jsonb, nullable) - additional source-specific data
  - `created_at` (timestamp with time zone)
  - `updated_at` (timestamp with time zone)
- Indexes:
  - `idx_external_points_source` on `source_tag`
  - `idx_external_points_location` on `(latitude, longitude)` for geospatial queries
  - `idx_external_points_created` on `created_at`
- RLS Policies:
  - Read: Authenticated users can read all external points
  - Insert: Only via API key (service role or ingestion secret)
  - Update/Delete: Service role only

**1.2 Update database types**

- Regenerate TypeScript types: `npm run db:generate-types`
- Update `types/database.types.ts` will include new table

### Phase 2: Data Source Configuration

**2.1 Create data source definitions**

- File: `lib/scraper/data-sources.ts`
- Define array of source configurations:
  ```typescript
  type DataSource = {
    name: string;
    url: string;
    source_tag: string;
    extraction_schema: ZodSchema; // Schema for AI extraction
    fetch_method: 'html' | 'api' | 'rss';
    api_auth?: { type: 'bearer' | 'basic'; token: string };
  }
  ```

- Initial sources (examples):
  - Finnish Orienteering Routes
  - Regional Geocaching Lists
  - (More sources can be added later)

**2.2 Optional: Supabase config table for dynamic sources**

- Alternative: Store sources in Supabase `scraper_sources` table
- Allows adding/removing sources without code deployment
- Migration: `supabase/migrations/[timestamp]_scraper_sources.sql`

### Phase 3: AI Extraction Service

**3.1 Install AI dependencies**

- Add to `package.json`:
  - `zod` (if not present) - for schema validation
  - `@google/generative-ai` OR `openai` OR `@mendable/firecrawl-js` (choose one)
  - `axios` or use native `fetch`

**3.2 Create AI extractor service**

- File: `lib/scraper/ai-extractor.ts`
- Function: `extractStructuredData(content: string, schema: ZodSchema, sourceType: 'html' | 'json'): Promise<ExtractedPoint[]>`
- Implementation options:
  - **Option A (Firecrawl)**: Use Firecrawl API for web scraping + structured extraction
  - **Option B (OpenAI)**: Use GPT-4 with structured outputs (JSON mode + Zod schema)
  - **Option C (Gemini)**: Use Gemini API with structured outputs
- Prompt engineering: Create prompts that extract POI names, coordinates, difficulty ratings, descriptions
- Error handling: Handle API rate limits, timeouts, invalid responses

**3.3 Create extraction schemas**

- File: `lib/scraper/extraction-schemas.ts`
- Define Zod schemas for different source types:
  - `OrienteeringPointSchema`
  - `GeocachePointSchema`
  - `GenericPointSchema`
- Each schema defines: `name`, `latitude`, `longitude`, `difficulty?`, `description?`, `metadata?`

### Phase 4: Data Validation & Normalization

**4.1 Create validation utilities**

- File: `lib/scraper/validation.ts`
- Functions:
  - `validateCoordinates(lat: number, lng: number): boolean` - Check valid lat/lng ranges
  - `normalizePoint(raw: any, sourceTag: string): ExternalPoint` - Convert to database format
  - `deduplicatePoints(points: ExternalPoint[]): ExternalPoint[]` - Remove duplicates based on location proximity

**4.2 Create normalization logic**

- File: `lib/scraper/normalizer.ts`
- Functions:
  - `normalizeSourceData(extracted: any[], sourceTag: string): ExternalPoint[]`
  - Handle coordinate format conversion (DMS to decimal, etc.)
  - Assign source tags
  - Generate default values for missing fields

### Phase 5: Core Scraper Function

**5.1 Create scraper route handler**

- File: `app/api/cron/scrape-external-points/route.ts`
- HTTP Method: GET (Vercel Cron triggers GET requests)
- Authentication: Check for Vercel Cron secret or internal trigger
- Flow:

  1. Load data sources from config
  2. Iterate through each source
  3. Fetch raw content (HTML/JSON)
  4. Extract structured data using AI
  5. Validate and normalize data
  6. Submit to Core API ingestion endpoint
  7. Log results

**5.2 Implement fetch logic**

- File: `lib/scraper/fetcher.ts`
- Functions:
  - `fetchHTML(url: string, options?: FetchOptions): Promise<string>`
  - `fetchJSON(url: string, options?: FetchOptions): Promise<any>`
  - Handle authentication (Bearer tokens, API keys)
  - Handle rate limiting and retries
  - User-Agent headers for web scraping

**5.3 Implement submission logic**

- File: `lib/scraper/api-client.ts`
- Function: `submitToCoreAPI(points: ExternalPoint[]): Promise<SubmissionResult>`
- Implementation:
  - POST to `${process.env.CORE_API_URL}/api/ingestion/external-points`
  - Headers: `Authorization: Bearer ${process.env.INGESTION_API_SECRET}`
  - Body: JSON array of normalized points
  - Handle errors: 401 (auth failure), 429 (rate limit), 5xx (server error)
  - Retry logic for transient failures

### Phase 6: Vercel Cron Configuration

**6.1 Configure cron job**

- File: `vercel.json`
- Add cron configuration:
  ```json
  {
    "crons": [{
      "path": "/api/cron/scrape-external-points",
      "schedule": "0 2 * * *"  // Daily at 2 AM UTC
    }]
  }
  ```


**6.2 Add environment variables**

- Document in `.env.example` (if exists):
  - `INGESTION_API_SECRET` - Secret for authenticating with Core API
  - `CORE_API_URL` - Base URL of the application (e.g., `https://wild-trails.vercel.app`)
  - `AI_SCRAPER_API_KEY` - API key for AI extraction service (Firecrawl/OpenAI/Gemini)
  - `VERCEL_CRON_SECRET` (optional) - Secret to verify cron requests

### Phase 7: Error Handling & Logging

**7.1 Implement error handling**

- File: `lib/scraper/error-handler.ts`
- Functions:
  - `handleScrapingError(error: Error, source: DataSource): void`
  - `handleAPIError(error: Error, endpoint: string): void`
  - Log to console (Vercel logs) or external service
  - Don't fail entire job if one source fails

**7.2 Add logging**

- Use structured logging
- Log: source name, number of points extracted, number of points submitted, errors
- Consider adding a `scraper_runs` table to track execution history (optional)

### Phase 8: Testing & Validation

**8.1 Create test utilities**

- File: `__tests__/scraper/` directory
- Test files:
  - `ai-extractor.test.ts` - Test AI extraction logic
  - `validation.test.ts` - Test data validation
  - `normalizer.test.ts` - Test normalization
  - `api-client.test.ts` - Mock API submission

**8.2 Manual testing**

- Create manual trigger endpoint: `app/api/cron/scrape-external-points/manual/route.ts` (dev only)
- Test with sample sources
- Verify data appears in `external_game_points` table
- Test error scenarios (invalid API key, network failure, etc.)

## File Structure

```
app/
  api/
    cron/
      scrape-external-points/
        route.ts              # Main scraper function (Vercel Cron trigger)
        manual/
          route.ts            # Manual trigger endpoint (dev/testing)

lib/
  scraper/
    data-sources.ts           # Data source configurations
    ai-extractor.ts           # AI-powered extraction logic
    extraction-schemas.ts      # Zod schemas for extraction
    validation.ts             # Data validation utilities
    normalizer.ts             # Data normalization logic
    fetcher.ts                # HTTP fetching utilities
    api-client.ts             # Core API submission client
    error-handler.ts          # Error handling and logging
    types.ts                  # TypeScript types for scraper

supabase/
  migrations/
    [timestamp]_external_game_points.sql
    [timestamp]_scraper_sources.sql (optional)

__tests__/
  scraper/
    ai-extractor.test.ts
    validation.test.ts
    normalizer.test.ts
    api-client.test.ts
```

## Key Design Decisions

1. **AI Service Choice**: Start with one service (recommend Firecrawl for web scraping, or OpenAI/Gemini for structured extraction). Can be made configurable later.

2. **Data Source Storage**: Initially hardcode in `data-sources.ts`. Can migrate to Supabase table later for dynamic management.

3. **Error Resilience**: Scraper should continue processing other sources if one fails. Log errors but don't crash.

4. **Deduplication**: Check for existing points by location proximity (e.g., within 10m) to avoid duplicates.

5. **Rate Limiting**: Implement delays between source fetches to respect external API rate limits.

6. **Batch Processing**: Submit points in batches (e.g., 100 at a time) to avoid overwhelming the ingestion endpoint.

## Integration with Refactoring #1

- The scraper depends on the ingestion endpoint from refactoring #1: `/api/ingestion/external-points`
- If refactoring #1 is not complete, the scraper can be built to work with a temporary endpoint that will be replaced later
- The `external_game_points` table will be used by game masters to browse and select ready-made points

## Environment Variables Required

| Variable | Purpose | Example |

|----------|---------|---------|

| `INGESTION_API_SECRET` | Authenticate with Core API | `sk_live_...` |

| `CORE_API_URL` | Base URL for API calls | `https://wild-trails.vercel.app` |

| `AI_SCRAPER_API_KEY` | AI extraction service key | `fc-...` or `sk-...` |

| `VERCEL_CRON_SECRET` | Verify cron requests (optional) | `cron_secret_...` |

## Security Considerations

1. **API Secret**: Store `INGESTION_API_SECRET` securely in Vercel environment variables
2. **Cron Protection**: Verify requests are from Vercel Cron (check headers or use secret)
3. **Source Authentication**: Store API keys for external sources securely
4. **Input Validation**: Validate all extracted data before submission
5. **Rate Limiting**: Respect external API rate limits to avoid being blocked

## Future Enhancements

- Add more data sources (geocaching.com API, OpenStreetMap POIs, etc.)
- Implement incremental scraping (only fetch new/updated points)
- Add webhook notifications when new points are ingested
- Create admin UI to manage data sources
- Add geographic filtering (only scrape points in specific regions)
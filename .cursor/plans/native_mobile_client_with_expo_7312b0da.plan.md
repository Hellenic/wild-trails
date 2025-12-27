---
name: Native Mobile Client with Expo
overview: Build a separate native mobile client using Expo and React Native for Wild Trails, optimized for battery efficiency, background location tracking, and native user experience. The mobile app will share business logic and API integration with the web codebase while providing a fully native mobile experience.
todos:
  - id: setup_monorepo
    content: Set up monorepo structure with Turborepo and move existing Next.js app to apps/web/
    status: pending
  - id: create_shared_packages
    content: Create packages/shared/ and packages/api-client/ with TypeScript setup
    status: pending
    dependencies:
      - setup_monorepo
  - id: initialize_expo
    content: Initialize Expo app in apps/mobile/ with TypeScript template
    status: pending
    dependencies:
      - setup_monorepo
  - id: extract_shared_types
    content: Move types/game.ts and database types to packages/shared/src/types/
    status: pending
    dependencies:
      - create_shared_packages
  - id: extract_shared_utils
    content: Move utility functions (map calculations, distance) to packages/shared/src/utils/
    status: pending
    dependencies:
      - create_shared_packages
  - id: create_api_client
    content: Create packages/api-client/ with typed API functions for game, points, location operations
    status: pending
    dependencies:
      - create_shared_packages
  - id: install_expo_plugins
    content: Install expo-location, expo-notifications, expo-task-manager, react-native-maps in mobile app
    status: pending
    dependencies:
      - initialize_expo
  - id: configure_permissions
    content: Configure location and notification permissions in app.json/app.config.js
    status: pending
    dependencies:
      - install_expo_plugins
  - id: create_background_location_service
    content: Create services/background-location.ts with Expo TaskManager for background location tracking
    status: pending
    dependencies:
      - install_expo_plugins
      - configure_permissions
  - id: create_notifications_service
    content: Create services/notifications.ts for native notification handling
    status: pending
    dependencies:
      - install_expo_plugins
      - configure_permissions
  - id: setup_navigation
    content: Set up React Navigation with stack navigator for game screens
    status: pending
    dependencies:
      - initialize_expo
  - id: implement_native_map
    content: Create components/GameMap.tsx using react-native-maps to replace Leaflet
    status: pending
    dependencies:
      - install_expo_plugins
  - id: implement_game_play_screen
    content: Rebuild game play screen with React Native components (map, time display, menu, popups)
    status: pending
    dependencies:
      - setup_navigation
      - implement_native_map
  - id: implement_location_tracking_hooks
    content: Create hooks/useNativeLocationTracking.ts and useBackgroundLocation.ts using Expo Location
    status: pending
    dependencies:
      - create_background_location_service
      - create_api_client
  - id: integrate_supabase_realtime
    content: Create hooks/useGameEvents.ts to listen for server-side proximity events and trigger notifications
    status: pending
    dependencies:
      - create_notifications_service
  - id: implement_game_setup_screens
    content: Rebuild game setup screens (game master view, player view) with React Native components
    status: pending
    dependencies:
      - setup_navigation
      - implement_native_map
  - id: implement_auth_screens
    content: Create authentication screens using Supabase Auth with React Native components
    status: pending
    dependencies:
      - setup_navigation
  - id: configure_ios
    content: Configure iOS permissions, background modes, and test on iOS device
    status: pending
    dependencies:
      - create_background_location_service
  - id: configure_android
    content: Configure Android permissions, notification channels, and test on Android device
    status: pending
    dependencies:
      - create_background_location_service
  - id: test_background_location
    content: Test background location tracking extensively on physical devices
    status: pending
    dependencies:
      - configure_ios
      - configure_android
  - id: setup_eas_build
    content: Configure EAS Build for iOS and Android app store builds
    status: pending
    dependencies:
      - configure_ios
      - configure_android
---

# Native Mobile Client with Expo Implementation Plan

## Overview

This plan implements a separate native mobile application using Expo and React Native, designed specifically for optimal battery efficiency and native user experience. The mobile client will share business logic and API integration code with the existing Next.js web application while providing a fully native mobile interface.

## Architecture

### Project Structure

**Option A: Monorepo (Recommended)**

```
wild-trails/
├── apps/
│   ├── web/              # Existing Next.js app
│   └── mobile/           # New Expo/React Native app
├── packages/
│   ├── shared/           # Shared business logic, types, utilities
│   └── api-client/       # Shared API client code
└── package.json          # Root package.json with workspaces
```

**Option B: Separate Repository**

- Keep mobile app in separate repo
- Share code via npm packages or git submodules
- More decoupled but harder to maintain consistency

### Technology Stack

- **Expo SDK**: Latest stable version
- **React Native**: Via Expo
- **TypeScript**: Same as web
- **React Navigation**: For navigation
- **Expo Location**: Native location tracking with background support
- **Expo Notifications**: Native push notifications
- **react-native-maps**: Native map component (via Expo)
- **Supabase JS**: Same SDK as web
- **Turborepo or Nx** (if monorepo): Build orchestration

## Implementation Steps

### Phase 1: Project Structure Setup

**1.1 Initialize monorepo structure**

- Decide on monorepo tool: Turborepo (recommended) or Nx
- Set up workspace configuration
- Move existing Next.js app to `apps/web/`
- Create `apps/mobile/` directory
- Create `packages/shared/` for shared code

**1.2 Create shared packages**

- Set up `packages/shared/`:
  - Type definitions (game types, database types)
  - Utility functions (map calculations, distance, etc.)
  - Constants and configuration
- Set up `packages/api-client/`:
  - API client utilities (can be shared between web and mobile)
  - Request/response types
  - Authentication helpers

**1.3 Initialize Expo project**

- Run `npx create-expo-app@latest apps/mobile`
- Choose TypeScript template
- Configure Expo app.json/app.config.js:
  - App name: "Wild Trails"
  - Bundle identifier: `com.wildtrails.app`
  - Configure icons and splash screens
  - Set up deep linking

### Phase 2: Core Native Features Setup

**2.1 Install Expo location and notification plugins**

- Install `expo-location` for location tracking
- Install `expo-notifications` for native notifications
- Install `expo-task-manager` for background tasks
- Install `react-native-maps` (via expo install)

**2.2 Configure permissions**

- Configure location permissions in `app.json`:
  - `NSLocationWhenInUseUsageDescription` (iOS)
  - `NSLocationAlwaysAndWhenInUseUsageDescription` (iOS)
  - Android permissions (handled via Expo config)
- Configure notification permissions

**2.3 Setup background location service**

- Create `services/background-location.ts`:
  - Define background task using Expo TaskManager
  - Configure location tracking parameters:
    - High accuracy mode
    - Distance filter (e.g., 10 meters)
    - Background location updates
  - Implement location update handler that calls API
- Configure task in `app.json` for background mode

**2.4 Setup native notifications**

- Create `services/notifications.ts`:
  - Request notification permissions
  - Configure notification channels (Android)
  - Setup notification handlers for foreground/background
  - Implement notification scheduling and display

### Phase 3: Shared Code Extraction

**3.1 Extract types and interfaces**

- Move `types/game.ts` → `packages/shared/src/types/game.ts`
- Move database types → `packages/shared/src/types/database.ts`
- Ensure types work in both web and mobile contexts

**3.2 Extract business logic**

- Move utility functions from `utils/map.ts` → `packages/shared/src/utils/map.ts`
- Extract distance calculations, geofencing logic
- Make sure no web-specific dependencies (DOM, etc.)

**3.3 Create shared API client**

- Extract API client logic → `packages/api-client/`
- Use fetch API (works in both environments)
- Create typed API functions:
  - Game operations (create, join, status)
  - Location updates
  - Points operations
- Handle authentication (Supabase tokens)

**3.4 Setup Supabase client**

- Create shared Supabase client initialization
- Use `@supabase/supabase-js` (works in React Native)
- Handle Realtime subscriptions (same API as web)

### Phase 4: Mobile UI Implementation

**4.1 Setup navigation**

- Install `@react-navigation/native` and required packages
- Create navigation structure:
  - Stack Navigator (game screens)
  - Tab Navigator (if needed for main menu)
- Define routes:
  - `/` - Game list/home
  - `/game/:id/setup` - Game setup
  - `/game/:id/play` - Active game play

**4.2 Implement map component**

- Create `components/GameMap.tsx` using `react-native-maps`:
  - Display game bounds
  - Show game points with markers
  - Display player location
  - Handle map interactions
- Replace Leaflet-specific logic with react-native-maps equivalents
- Use MapKit on iOS, Google Maps on Android

**4.3 Rebuild game play screen**

- Create `screens/GamePlay.tsx`:
  - Map view (using native map component)
  - Time display component
  - Menu/drawer for stats
  - Goal found popup/modal
- Use React Native components:
  - `View`, `Text`, `TouchableOpacity` instead of HTML elements
  - React Native StyleSheet or styled-components instead of Tailwind

**4.4 Implement game setup screens**

- Create `screens/GameSetup.tsx`:
  - Game master view
  - Player view
  - Map selection (using react-native-maps)
- Rebuild UI components with native equivalents

**4.5 Implement game creation flow**

- Create `screens/CreateGame.tsx`:
  - Form inputs using React Native TextInput
  - Map selection
  - Settings configuration

**4.6 Implement authentication screens**

- Create `screens/Login.tsx`:
  - Use Supabase Auth (same as web)
  - Native form inputs
  - Handle deep linking for auth callbacks

### Phase 5: Integration with Existing Systems

**5.1 Implement location tracking hook**

- Create `hooks/useNativeLocationTracking.ts`:
  - Use Expo Location for foreground tracking
- Create `hooks/useBackgroundLocation.ts`:
  - Start/stop background location task
  - Handle location updates
  - Send to `/api/game/location-update` endpoint
- Integrate with existing game flow

**5.2 Setup Supabase Realtime**

- Create `hooks/useGameEvents.ts`:
  - Listen for proximity events from server
  - Trigger native notifications on point reached
  - Update game state based on events
- Reuse same Supabase Realtime subscription logic as web

**5.3 Implement API integration**

- Use shared API client from `packages/api-client`
- Replace server actions with API calls:
  - Game creation → POST `/api/game/setup`
  - Join game → POST `/api/game/[id]/join`
  - Location updates → POST `/api/game/location-update`
  - Game status → GET/POST `/api/game/[id]/status`

**5.4 Handle offline scenarios**

- Implement offline queue for location updates
- Cache game data locally (AsyncStorage or Expo SecureStore)
- Show offline indicators in UI

### Phase 6: Platform-Specific Configuration

**6.1 iOS configuration**

- Configure `ios/` native project (via Expo config or eject if needed):
  - Background modes: location updates
  - Location permissions usage descriptions
  - App icons and splash screens
- Test on iOS simulator and device

**6.2 Android configuration**

- Configure Android permissions in `app.json`:
  - `ACCESS_FINE_LOCATION`
  - `ACCESS_BACKGROUND_LOCATION` (Android 10+)
  - `FOREGROUND_SERVICE`
  - `FOREGROUND_SERVICE_LOCATION`
- Configure notification channels
- Handle battery optimization exemptions
- Test on Android emulator and device

**6.3 Background task configuration**

- Configure `expo-task-manager` tasks:
  - Background location task
  - Ensure proper task registration
- Handle task lifecycle (start, stop, restart)
- Test background behavior thoroughly

### Phase 7: Testing and Optimization

**7.1 Battery optimization**

- Profile battery usage during gameplay
- Optimize location update frequency
- Implement adaptive update intervals based on movement
- Test battery drain over extended periods

**7.2 Performance testing**

- Test map rendering performance with many points
- Test location update frequency impact
- Optimize re-renders in game play screen
- Profile memory usage

**7.3 End-to-end testing**

- Test full game flow: create → setup → play → complete
- Test background location tracking
- Test notifications on point discovery
- Test offline scenarios
- Test on both iOS and Android devices

### Phase 8: Build and Deployment

**8.1 Configure build process**

- Setup EAS Build (Expo Application Services):
  - Configure build profiles (development, preview, production)
  - Setup signing certificates (iOS/Android)
- Configure app stores:
  - App Store Connect (iOS)
  - Google Play Console (Android)

**8.2 Setup CI/CD**

- Configure GitHub Actions or similar:
  - Build mobile app on commits
  - Run tests
  - Deploy to TestFlight/Internal Testing
- Automate builds for releases

**8.3 Documentation**

- Document mobile-specific setup
- Document shared code usage
- Document build and deployment process
- Create mobile-specific README

## Key Design Decisions

1. **Monorepo Structure**: Allows code sharing while maintaining separation
2. **Shared Business Logic**: Extract reusable code to packages
3. **Native-First**: Prioritize native components over web compatibility
4. **API-First**: Mobile uses same API as web (from refactoring plan)
5. **Background Location**: Use Expo's built-in background location capabilities
6. **Event-Driven**: Use Supabase Realtime for server-to-client events

## File Structure (Monorepo)

```
wild-trails/
├── apps/
│   ├── web/                    # Existing Next.js app
│   │   ├── app/
│   │   ├── hooks/
│   │   └── ...
│   └── mobile/                 # New Expo app
│       ├── app/                # Expo Router or screens/
│       ├── components/
│       ├── hooks/
│       ├── services/
│       │   ├── background-location.ts
│       │   └── notifications.ts
│       ├── app.json
│       └── package.json
├── packages/
│   ├── shared/
│   │   ├── src/
│   │   │   ├── types/
│   │   │   ├── utils/
│   │   │   └── constants.ts
│   │   └── package.json
│   └── api-client/
│       ├── src/
│       │   ├── client.ts
│       │   ├── game.ts
│       │   ├── points.ts
│       │   └── location.ts
│       └── package.json
├── package.json                # Root with workspaces
└── turbo.json                  # Turborepo config
```

## Dependencies

**Mobile App:**

- `expo`: ^latest
- `expo-location`: ^latest
- `expo-notifications`: ^latest
- `expo-task-manager`: ^latest
- `react-native-maps`: ^latest
- `@react-navigation/native`: ^latest
- `@react-navigation/stack`: ^latest
- `@supabase/supabase-js`: ^latest

**Shared Packages:**

- `typescript`: ^5
- Shared dependencies only (no React, no DOM-specific code)

## Migration Notes

- This is a parallel implementation - web app continues to work independently
- Mobile app shares business logic but has separate UI implementation
- API endpoints from refactoring plan must be available
- Types and utilities can be gradually moved to shared packages
- Web app can optionally use shared packages too for consistency
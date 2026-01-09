# Game Modes & Visibility Rules

This document describes the different game modes and what each role can see during gameplay.

## Game Mode Configurations

| Game Mode | Players | GM Type | Description |
|-----------|---------|---------|-------------|
| **Single Player** | Player A only | AI (automated) | Solo adventure, AI generates waypoints and hints |
| **Two Player (AI GM)** | Player A + Player B | AI (automated) | Cooperative play with AI-generated content |
| **Two Player (Human GM)** | Player A + Game Master | Human player | Human GM creates and controls the game |
| **Multi Player** | Player A + Player B + Game Master | Human player | Full experience with all roles |

## Role Descriptions

### Player A (Seeker)
- Starts at Point A
- Must find their way to the goal (Point B)
- Discovers waypoints by physically approaching them
- Receives proximity alerts when near waypoints
- Cannot see the goal until discovered

### Player B (Guide)
- Can see all waypoints from the start
- Receives hints and clues when Player A discovers waypoints
- Guides Player A via external communication (calls, messages)
- Cannot see the goal location (must guide based on waypoint hints)

### Game Master
- Full visibility of all game elements
- Can start/end the game
- Can edit game points (in setup)
- Oversees the game progress

## Visibility Matrix

| Element | Player A (Seeker) | Player B (Guide) | Game Master |
|---------|-------------------|------------------|-------------|
| Own location | ✅ Yes | ✅ Yes | ✅ Yes |
| Other players' locations | ✅ Yes | ✅ Yes | ✅ Yes |
| Goal (Point B) location | ❌ No* | ❌ No | ✅ Yes |
| All waypoints | Conditional** | ✅ Yes | ✅ Yes |
| Hints from waypoints | Via Player B*** | ✅ Direct | ✅ Direct |
| Proximity alerts | ✅ Yes | ❌ No | ❌ No |

### Notes

\* Player A discovers the goal when they physically reach it (proximity trigger)

\** Waypoint visibility for Player A depends on game composition:
- **With Player B present**: Only sees visited waypoints (progressive discovery)
- **Without Player B** (solo or GM-only): Sees all waypoints from the start

\*** In games with Player B, hints are meant to be relayed from Player B to Player A via external communication. This adds a cooperative element where Player B must interpret and communicate the clues effectively.

## Gameplay Flow by Mode

### Single Player
1. Player A sees all waypoints on the map
2. Player A navigates to waypoints independently
3. Each waypoint reveals a hint about the goal location
4. Player A uses hints to deduce and find the goal

### Two Player (with Player B)
1. Player A sees only the starting point (no waypoints visible)
2. Player B sees all waypoints and guides Player A
3. When Player A reaches a waypoint, Player B receives the hint
4. Player B communicates hints to Player A (1-minute calls recommended)
5. Together they work to find the goal

### With Game Master
1. Game Master has full oversight
2. Can provide additional hints or guidance
3. Can end the game if needed
4. Monitors progress of all players

## Future Considerations

- **Player B as Goal**: Option to make Player B's location the actual goal, hiding their position from Player A
- **Configurable visibility**: Per-game settings for what each role can see
- **Hint relay system**: In-app communication between Player A and Player B


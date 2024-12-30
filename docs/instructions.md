# Project overview

Use this guide to build a web app, where the users can play this game. For now, we will focus on implementing only the single player mode, where the application will act as a game master, and we will expand to other modes later on.

# Feature requirements

- User should be able to create a new game, or join into an existing game (will be implemented later)
- When creating a new game, the user can (setup stage)
  - set the name, and password for the game
  - choose the area from the map where the game will take place
  - optionally also choose the starting location (point A)
  - Set the duration and/or estimated distance travelled during the game
  - Set how many players will participate, and whether a player or the application should act as a game master
  - Select the role for themselves, in which they will play the game
  - Start the game, when the game will go to “preparation stage”
- When joining a game, the user can
  - Input the password, and join the game
  - Select the role for themselves, in which they will play the game
- Preparation stage
  - Game master will create point B, and possibly point A if it was not given earlier, as well as all the points in between
  - Game master will also plan and write down the tips given from each point, which will ultimate narrow down the location of point B
  - It should be possible to deduce the location of point B from 50% of the received tips. This way the player A does not have to visit each point, or if feeling lucky, could get by with only visiting 25% of them.
  - In the first phase, we will implement the single player mode only, so this step has to be done by the application
- Once the game is started (dispatch stage) [to be implemented later]
  - Application will display map and guide the user to get to their designated locations, and/or do other preparative tasks
  - Player A will be guided to go to point A, from which they can move the game to it’s next stage
- When the game is in progress
  - Player A see a map and the points, as written in the synopsis
  - Player A will get notifications once they are close enough to the points
  - Once player A is very close to point B, and time has not run out, application will congratulate the player and game will end
  - If the time runs out, players will be notified and game will end in loss
- When the game ends,
  - User will see a simple score screen where they can see the time spent, total distance travelled

## Terminology

Point A
- Starting point for the player A

Point B
  - Goal and/or Command Center. When played with player B, the player will be is "held captive" here and will the one guiding the player A.
  - In single player mode, this is simply the goal for the player A to reach

# Technical specifications

Here's a breakdown of how you can structure a platform to handle player location, point logic, and event triggering:

**1. Backend Platform (Server-Side):**

*   **Technology:** Supabase
*   **Key Components:**
    *   **Real-time Location Tracking:** This is crucial. Use Supabase Realtime to receive and process player location updates.
    *   **Game State Management:** Store the game state (active games, players in each game, point locations, player progress, etc.) in your database.
    *   **Point Logic Engine:** Implement the logic for each point on the server. This could involve:
        *   Defining triggers for when a player is near a point (using geofencing calculations).
        *   Handling interactions with points (e.g., solving puzzles, scanning QR codes).
        *   Awarding points or triggering other game events.
    *   **Event Dispatcher:** A component that sends events to connected clients (e.g., "Player reached point X," "Puzzle solved," "Game over").
    *   **API Endpoints:** Create API endpoints for the client to:
        *   Start a new game.
        *   Join a game.
        *   Send location updates.
        *   Retrieve game data (points, current score, etc.).

**2. Client-Side (React):**

*   **Technology:** Next.js, React, TypeScript, TailwindCSS, Leaflet
*   **Responsibilities:**
    *   Displaying the map and player locations.
    *   Sending location updates to the backend.
    *   Handling UI updates based on events received from the backend.
    *   Handling user input and sending requests to the backend API.
*   **Key Interactions:**
    *   Use the Geolocation API to get the user's location and send it to the backend via an API call (e.g., every few seconds).
    *   Establish a real-time connection (using Supabase Realtime or WebSockets) to receive events from the backend.
    *   Update the UI based on these events (e.g., display a notification when a player reaches a point).

**Example Workflow:**

1.  A player starts a new game on the client.
2.  The client sends a "start game" request to the backend API.
3.  The backend creates a new game record in the database and generates the map and points.
4.  Players join the game via the client, which sends a "join game" request to the backend.
5.  Each player's client starts sending location updates to the backend.
6.  The backend's location tracking component receives the location updates.
7.  The backend's point logic engine checks if any players are near a point.
8.  If a player is near a point, the backend triggers an event (e.g., "Player reached point X").
9.  The backend's event dispatcher sends this event to all connected clients in the game.
10. The clients receive the event and update their UI accordingly (e.g., display a notification, update the score).

**Benefits of this Approach:**

*   **Improved Scalability:** The backend can handle a large number of players and games.
*   **Enhanced Security:** Game logic is protected on the server.
*   **Easier Maintenance:** Logic is centralized on the server, making it easier to update and debug.
*   **Real-time Experience:** Real-time communication enables a more engaging and interactive experience.
*   **Reduced Client Complexity:** The client becomes a "thin client," focusing on UI and user interaction.

By implementing this architecture, we'll have a robust and scalable platform for your orienteering game, capable of handling complex game logic and providing a real-time multiplayer experience.

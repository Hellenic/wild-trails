create table player_locations (
  id uuid default gen_random_uuid() primary key,
  game_id uuid references games(id) not null,
  player_id uuid references players(id) not null,
  latitude float,
  longitude float,
  altitude float,
  altitude_accuracy float,
  accuracy float,
  speed float,
  heading float,
  timestamp timestamptz default now() not null
);

-- Index for efficient queries
create index player_locations_game_id_timestamp_idx on player_locations(game_id, timestamp);

-- Enable row level security
alter table player_locations enable row level security;

-- Players can insert their own location
create policy "Players can insert their own location"
  on player_locations
  for insert
  with check (
    auth.uid() in (
      select user_id 
      from players 
      where players.id = player_locations.player_id
    )
  );

-- Players can read locations of players in the same game
create policy "Players can read locations from their game"
  on player_locations
  for select
  using (
    exists (
      select 1 
      from players 
      where players.game_id = player_locations.game_id 
      and players.user_id = auth.uid()
    )
  );

-- Enable realtime for the table
alter publication supabase_realtime add table player_locations;
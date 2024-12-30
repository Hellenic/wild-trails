create type game_master_type as enum ('player', 'ai');
create type game_mode_type as enum ('single_player', 'two_player', 'multi_player');
create type game_status_type as enum ('setup', 'ready', 'active', 'completed');
create type game_role_type as enum ('player_a', 'player_b', 'game_master');
create type game_player_status_type as enum ('waiting', 'ready', 'playing', 'finished');

create table public.games (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  started_at timestamp with time zone,
  creator_id uuid references auth.users(id) not null,
  name text not null,
  password text not null,
  duration integer not null, --in minutes
  max_radius numeric not null,
  player_count integer not null,
  game_mode game_mode_type not null,
  game_master game_master_type not null,
  selected_role game_role_type not null,
  starting_point jsonb,
  bounding_box jsonb not null,
  status game_status_type not null default 'setup'
);

-- Add RLS policies
alter table public.games enable row level security;

create policy "Users can read their own games"
  on public.games for select
  using (auth.uid() = creator_id);

create policy "Users can insert their own games"
  on public.games for insert
  with check (auth.uid() = creator_id);

create policy "Users can update their own games"
  on public.games for update
  using (auth.uid() = creator_id); 



create table public.players (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  game_id uuid references public.games(id) on delete cascade not null,
  user_id uuid references auth.users(id) not null,
  role game_role_type not null, -- 'game_master' or 'player'
  status game_player_status_type not null default 'waiting', -- 'waiting', 'ready', 'playing', 'finished'
  
  -- Ensure unique user per game
  unique(game_id, user_id)
);

-- Add RLS policies
alter table public.players enable row level security;

-- Users can read players in games they're part of
create policy "Users can read players in their games"
  on public.players for select
  using (
    exists (
      select 1 from public.games
      where games.id = players.game_id
      and (games.creator_id = auth.uid() or players.user_id = auth.uid())
    )
  );

-- Users can join games (insert)
create policy "Users can join games"
  on public.players for insert
  with check (auth.uid() = user_id);

-- Users can update their own player status
create policy "Users can update their own player record"
  on public.players for update
  using (auth.uid() = user_id); 



create type point_type as enum ('start', 'end', 'clue');

create table game_points (
  id uuid default uuid_generate_v4() primary key,
  game_id uuid references games(id) on delete cascade,
  latitude double precision not null,
  longitude double precision not null,
  sequence_number integer not null,
  hint text,
  type point_type not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create index for faster queries
create index game_points_game_id_idx on game_points(game_id);

-- Add RLS policies
alter table game_points enable row level security;

create policy "Game points are viewable by game participants"
  on game_points for select
  using (
    exists (
      select 1 from games
      where games.id = game_points.game_id
      and (
        games.creator_id = auth.uid() or
        games.id in (
          select game_id from players
          where user_id = auth.uid()
        )
      )
    )
  ); 

create policy "Game points are insertable by game master"
  on game_points for insert
  with check (
    exists (
      select 1 from games
      where games.id = game_points.game_id
      and games.creator_id = auth.uid()
    )
  ); 
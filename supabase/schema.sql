-- ============================================
-- RPG PORTAL — SUPABASE INITIAL SCHEMA
-- ============================================

create extension if not exists pgcrypto;

-- --------------------------------------------
-- PROFILES
-- --------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  display_name text not null default 'Jogador',
  avatar_url text,
  country text,
  bio text,
  role text not null default 'player'
    check (role in ('player', 'moderator', 'admin')),
  created_at timestamptz not null default now()
);

-- --------------------------------------------
-- CLANS
-- --------------------------------------------

create table if not exists public.clans (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  emblem_url text,
  leader_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- --------------------------------------------
-- CHARACTERS
-- --------------------------------------------

create table if not exists public.characters (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  nickname text,
  description text,
  portrait_url text,
  level integer not null default 1,
  notoriety integer not null default 0,
  reputation integer not null default 0,
  clan_id uuid references public.clans(id) on delete set null,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

-- --------------------------------------------
-- BADGES
-- --------------------------------------------

create table if not exists public.badges (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  icon text,
  rarity text default 'Comum',
  category text default 'Participação',
  created_at timestamptz not null default now()
);

create table if not exists public.player_badges (
  player_id uuid not null references public.profiles(id) on delete cascade,
  badge_id uuid not null references public.badges(id) on delete cascade,
  awarded_at timestamptz not null default now(),
  awarded_by uuid references public.profiles(id) on delete set null,
  primary key (player_id, badge_id)
);

-- --------------------------------------------
-- MATCHES
-- --------------------------------------------

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  player_a uuid not null references public.profiles(id) on delete cascade,
  player_b uuid not null references public.profiles(id) on delete cascade,
  winner_id uuid references public.profiles(id) on delete set null,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'completed', 'cancelled')),
  result text,
  created_at timestamptz not null default now(),
  check (player_a <> player_b)
);

-- --------------------------------------------
-- RANKING VIEW
-- --------------------------------------------

create or replace view public.ranking as
select
  p.id as player_id,
  p.display_name,
  p.username,
  coalesce(stats.wins, 0)::integer as wins,
  coalesce(stats.losses, 0)::integer as losses,
  coalesce(stats.draws, 0)::integer as draws,
  (
    coalesce(stats.wins, 0) * 3 +
    coalesce(stats.draws, 0)
  )::integer as points
from public.profiles p
left join (
  select
    player_id,
    sum(wins)::integer as wins,
    sum(losses)::integer as losses,
    sum(draws)::integer as draws
  from (
    select
      m.winner_id as player_id,
      count(*) filter (where m.winner_id is not null)::integer as wins,
      0::integer as losses,
      0::integer as draws
    from public.matches m
    where m.status = 'completed'
    group by m.winner_id

    union all

    select
      case
        when m.winner_id = m.player_a then m.player_b
        else m.player_a
      end as player_id,
      0::integer as wins,
      count(*) filter (where m.winner_id is not null)::integer as losses,
      0::integer as draws
    from public.matches m
    where m.status = 'completed'
      and m.winner_id is not null
    group by
      case
        when m.winner_id = m.player_a then m.player_b
        else m.player_a
      end
  ) result
  group by player_id
) stats on stats.player_id = p.id;

-- --------------------------------------------
-- PROFILE CREATION TRIGGER
-- --------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    display_name,
    country
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', 'Jogador'),
    new.raw_user_meta_data ->> 'country'
  );

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- --------------------------------------------
-- RLS
-- --------------------------------------------

alter table public.profiles enable row level security;
alter table public.clans enable row level security;
alter table public.characters enable row level security;
alter table public.badges enable row level security;
alter table public.player_badges enable row level security;
alter table public.matches enable row level security;

-- Profiles: public read, own update
drop policy if exists "profiles_public_read" on public.profiles;
create policy "profiles_public_read"
on public.profiles
for select
using (true);

drop policy if exists "profiles_own_update" on public.profiles;
create policy "profiles_own_update"
on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

-- Clans: public read
drop policy if exists "clans_public_read" on public.clans;
create policy "clans_public_read"
on public.clans
for select
using (true);

-- Characters: public read approved, owner can manage own
drop policy if exists "characters_public_read" on public.characters;
create policy "characters_public_read"
on public.characters
for select
using (status = 'approved' or owner_id = auth.uid());

drop policy if exists "characters_owner_insert" on public.characters;
create policy "characters_owner_insert"
on public.characters
for insert
with check (owner_id = auth.uid());

drop policy if exists "characters_owner_update" on public.characters;
create policy "characters_owner_update"
on public.characters
for update
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

-- Badges: public read
drop policy if exists "badges_public_read" on public.badges;
create policy "badges_public_read"
on public.badges
for select
using (true);

-- Player badges: public read
drop policy if exists "player_badges_public_read" on public.player_badges;
create policy "player_badges_public_read"
on public.player_badges
for select
using (true);

-- Matches: public read
drop policy if exists "matches_public_read" on public.matches;
create policy "matches_public_read"
on public.matches
for select
using (true);

-- --------------------------------------------
-- ADMIN CHECK
-- --------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

-- Admin policies
drop policy if exists "admin_manage_badges" on public.badges;
create policy "admin_manage_badges"
on public.badges
for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "admin_manage_clans" on public.clans;
create policy "admin_manage_clans"
on public.clans
for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "admin_manage_matches" on public.matches;
create policy "admin_manage_matches"
on public.matches
for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "admin_manage_player_badges" on public.player_badges;
create policy "admin_manage_player_badges"
on public.player_badges
for all
using (public.is_admin())
with check (public.is_admin());

-- --------------------------------------------
-- INDEXES
-- --------------------------------------------

create index if not exists idx_profiles_display_name
on public.profiles(display_name);

create index if not exists idx_characters_owner
on public.characters(owner_id);

create index if not exists idx_characters_clan
on public.characters(clan_id);

create index if not exists idx_characters_status
on public.characters(status);

create index if not exists idx_matches_winner
on public.matches(winner_id);

create index if not exists idx_player_badges_player
on public.player_badges(player_id);

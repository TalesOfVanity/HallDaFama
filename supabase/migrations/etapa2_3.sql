-- Tales of Vanity — Etapa 2.3
-- Execute uma vez no SQL Editor do Supabase.

-- Jogadores podem ser removidos do Hall da Fama sem apagar auth.users.
alter table public.profiles
add column if not exists active boolean not null default true;

-- Cada brasão passa a ter valor próprio no ranking.
alter table public.badges
add column if not exists points integer not null default 10;

-- Leitura pública necessária aos novos rankings.
grant select on table public.profiles to anon, authenticated;
grant select on table public.characters to anon, authenticated;
grant select on table public.clans to anon, authenticated;
grant select on table public.badges to anon, authenticated;
grant select on table public.player_badges to anon, authenticated;

-- Escrita técnica para o painel administrativo.
-- O RLS continua sendo a camada que decide quem realmente pode alterar.
grant update on table public.profiles to authenticated;

-- O jogador continua podendo editar apenas o próprio perfil pelas policies existentes.
-- Administradores podem alterar perfis (usado para ativar/desativar jogadores).
drop policy if exists "profiles_admin_update" on public.profiles;
create policy "profiles_admin_update"
on public.profiles
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Garante leitura pública dos dados exibidos.
drop policy if exists "profiles_public_read" on public.profiles;
create policy "profiles_public_read"
on public.profiles
for select
using (true);

drop policy if exists "badges_public_read" on public.badges;
create policy "badges_public_read"
on public.badges
for select
using (true);

drop policy if exists "player_badges_public_read" on public.player_badges;
create policy "player_badges_public_read"
on public.player_badges
for select
using (true);

drop policy if exists "clans_public_read" on public.clans;
create policy "clans_public_read"
on public.clans
for select
using (true);

-- A view antiga public.ranking deixa de ser usada pelo site.
-- Ela é mantida para não apagar nada que possa ser útil futuramente.

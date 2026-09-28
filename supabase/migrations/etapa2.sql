-- Tales of Vanity — Etapa 2
-- Execute uma vez no SQL Editor do Supabase.

-- Corrige o erro "permission denied for table clans" e garante leitura pública necessária ao acervo.
grant select on table public.clans to anon, authenticated;
grant select on table public.profiles to anon, authenticated;
grant select on table public.characters to anon, authenticated;
grant select on table public.badges to anon, authenticated;
grant select on table public.player_badges to anon, authenticated;

-- Pontuação individual do personagem; o ranking da Party soma este campo.
alter table public.characters add column if not exists points integer not null default 0;

-- Operações administrativas continuam protegidas pelas políticas RLS/is_admin existentes.
grant insert, update, delete on table public.characters to authenticated;
grant insert, update, delete on table public.badges to authenticated;
grant insert, update, delete on table public.player_badges to authenticated;
grant insert, update, delete on table public.clans to authenticated;

-- Leitura pública das partys.
drop policy if exists "clans_public_read" on public.clans;
create policy "clans_public_read" on public.clans for select using (true);

-- Leitura pública dos brasões e atribuições.
drop policy if exists "badges_public_read" on public.badges;
create policy "badges_public_read" on public.badges for select using (true);
drop policy if exists "player_badges_public_read" on public.player_badges;
create policy "player_badges_public_read" on public.player_badges for select using (true);

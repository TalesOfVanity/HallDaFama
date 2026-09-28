-- Tales of Vanity — Etapa 2.1: cadastro administrativo de Partys
-- Execute uma vez no SQL Editor do Supabase.

alter table public.clans
  add column if not exists acronym text,
  add column if not exists status text not null default 'active';

-- O navegador precisa da permissão técnica; o RLS abaixo restringe escrita aos admins.
grant select on table public.clans to anon, authenticated;
grant insert, update, delete on table public.clans to authenticated;

alter table public.clans enable row level security;

drop policy if exists "clans_public_read" on public.clans;
create policy "clans_public_read"
on public.clans
for select
using (true);

drop policy if exists "admin_manage_clans" on public.clans;
create policy "admin_manage_clans"
on public.clans
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

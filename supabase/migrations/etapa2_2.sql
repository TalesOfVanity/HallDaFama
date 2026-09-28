-- Tales of Vanity — Etapa 2.2: edição do próprio perfil
-- Execute uma vez no SQL Editor do Supabase.

-- O perfil continua público para leitura.
grant select on table public.profiles to anon, authenticated;

-- Remove uma eventual permissão ampla de UPDATE e libera somente os campos
-- que o próprio Player pode editar. `role` NÃO fica disponível para alteração.
revoke update on table public.profiles from authenticated;
grant update (display_name, avatar_url, country, bio)
on table public.profiles
to authenticated;

alter table public.profiles enable row level security;

-- Cada usuário autenticado só pode atualizar a própria linha.
drop policy if exists "profiles_own_update" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_own_update"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

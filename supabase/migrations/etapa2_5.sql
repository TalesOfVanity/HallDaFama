-- Permite ao admin excluir Partys; RLS continua protegendo a operação.
grant delete on table public.clans to authenticated;
drop policy if exists "clans_admin_delete" on public.clans;
create policy "clans_admin_delete" on public.clans for delete to authenticated using (public.is_admin());

alter table public.profiles add column if not exists participation_type text not null default 'interpreter';
alter table public.profiles drop constraint if exists profiles_participation_type_check;
alter table public.profiles add constraint profiles_participation_type_check check (participation_type in ('interpreter','narrator','both'));

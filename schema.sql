-- WISA TOVOVA — schema inicial Supabase
-- Executar no SQL Editor do projecto Supabase.
create extension if not exists pgcrypto;

create table if not exists public.suggestions (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 5 and 100),
  category text not null,
  description text not null default '' check (char_length(description) <= 700),
  is_anonymous boolean not null default true,
  author_name text,
  author_email text,
  status text not null default 'pending' check (status in ('pending','approved','selected','rejected')),
  votes integer not null default 0,
  created_at timestamptz not null default now(),
  constraint anonymous_has_no_identity check (is_anonymous = false or (author_name is null and author_email is null))
);

create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.votes (
  id uuid primary key default gen_random_uuid(),
  suggestion_id uuid not null references public.suggestions(id) on delete cascade,
  voter_token uuid not null,
  created_at timestamptz not null default now(),
  unique (suggestion_id, voter_token)
);

create or replace function public.is_wisa_admin()
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.admins where user_id = auth.uid()); $$;

alter table public.suggestions enable row level security;
alter table public.admins enable row level security;
alter table public.votes enable row level security;

-- Qualquer visitante pode enviar uma proposta. A proposta fica pendente e não é pública.
create policy "public can submit suggestions" on public.suggestions
for insert to anon, authenticated
with check (
  status = 'pending'
  and (is_anonymous = false or (author_name is null and author_email is null))
);

-- Visitantes só vêem propostas aprovadas/escolhidas; a equipa autenticada vê todas.
create policy "public reads published suggestions" on public.suggestions
for select to anon, authenticated
using (status in ('approved','selected') or public.is_wisa_admin());

create policy "admins update suggestions" on public.suggestions
for update to authenticated
using (public.is_wisa_admin())
with check (public.is_wisa_admin());

create policy "admins read admin list" on public.admins
for select to authenticated using (public.is_wisa_admin());

-- Votos apenas em sugestões publicadas. O token local impede votos repetidos no mesmo browser,
-- e a constraint unique evita duplicação para o mesmo token/sugestão.
create policy "public can vote on published suggestions" on public.votes
for insert to anon, authenticated
with check (exists (
  select 1 from public.suggestions s
  where s.id = suggestion_id and s.status in ('approved','selected')
));

create policy "public reads vote counts" on public.votes
for select to anon, authenticated using (true);

create or replace function public.increment_suggestion_votes()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  update public.suggestions set votes = votes + 1 where id = new.suggestion_id;
  return new;
end;
$$;
drop trigger if exists vote_increment on public.votes;
create trigger vote_increment after insert on public.votes
for each row execute function public.increment_suggestion_votes();

grant usage on schema public to anon, authenticated;
grant select, insert on public.suggestions to anon, authenticated;
grant update on public.suggestions to authenticated;
grant select, insert on public.votes to anon, authenticated;
grant select on public.admins to authenticated;

-- IMPORTANTE: criar o utilizador da equipa em Authentication > Users.
-- Depois copiar o UUID desse utilizador e executar:
-- insert into public.admins (user_id) values ('UUID-DO-UTILIZADOR');
-- Nunca colocar a service_role key no frontend.

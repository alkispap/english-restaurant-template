create table if not exists public.saved_listings (
  user_id uuid not null references auth.users(id) on delete cascade,
  listing_slug text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, listing_slug)
);

create table if not exists public.listing_notes (
  user_id uuid not null references auth.users(id) on delete cascade,
  listing_slug text not null,
  note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, listing_slug),
  constraint listing_notes_note_length check (char_length(note) <= 600)
);

alter table public.saved_listings enable row level security;
alter table public.listing_notes enable row level security;

drop policy if exists "Users can read their saved listings" on public.saved_listings;
create policy "Users can read their saved listings"
on public.saved_listings
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert their saved listings" on public.saved_listings;
create policy "Users can insert their saved listings"
on public.saved_listings
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their saved listings" on public.saved_listings;
create policy "Users can delete their saved listings"
on public.saved_listings
for delete
using (auth.uid() = user_id);

drop policy if exists "Users can read their listing notes" on public.listing_notes;
create policy "Users can read their listing notes"
on public.listing_notes
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert their listing notes" on public.listing_notes;
create policy "Users can insert their listing notes"
on public.listing_notes
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update their listing notes" on public.listing_notes;
create policy "Users can update their listing notes"
on public.listing_notes
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their listing notes" on public.listing_notes;
create policy "Users can delete their listing notes"
on public.listing_notes
for delete
using (auth.uid() = user_id);

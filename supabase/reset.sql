-- =============================================================================
-- RESET: Drop everything and recreate from scratch
-- Run this in Supabase SQL Editor if the schema was partially applied
-- =============================================================================

-- Safely drop triggers (ignore if table doesn't exist)
do $$ begin drop trigger if exists on_auth_user_created on auth.users; exception when others then null; end $$;
do $$ begin drop trigger if exists trg_profiles_updated_at on public.profiles; exception when others then null; end $$;
do $$ begin drop trigger if exists trg_schedules_updated_at on public.schedules; exception when others then null; end $$;
do $$ begin drop trigger if exists trg_enforcement_status_updated_at on public.enforcement_status; exception when others then null; end $$;

-- Drop functions
drop function if exists public.handle_new_user() cascade;
drop function if exists public.set_updated_at() cascade;
drop function if exists public.generate_invite_code() cascade;
drop function if exists public.generate_pairing_code() cascade;

-- Remove from realtime publication (ignore errors if not there)
do $$ begin
  alter publication supabase_realtime drop table public.enforcement_status;
exception when others then null;
end $$;

-- Drop tables in dependency order
drop table if exists public.enforcement_status cascade;
drop table if exists public.schedule_devices cascade;
drop table if exists public.schedules cascade;
drop table if exists public.devices cascade;
drop table if exists public.children cascade;
drop table if exists public.profiles cascade;
drop table if exists public.households cascade;

-- =============================================================================
-- Now recreate everything
-- =============================================================================

create extension if not exists "pgcrypto";

-- Helper functions
create or replace function generate_invite_code()
returns text language sql as $$
  select upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
$$;

create or replace function generate_pairing_code()
returns text language sql as $$
  select upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
$$;

-- Tables
create table public.households (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  created_by uuid,
  invite_code text not null unique default generate_invite_code(),
  created_at timestamptz not null default now()
);

create table public.profiles (
  id            uuid primary key references auth.users on delete cascade,
  email         text,
  full_name     text,
  role          text not null default 'parent' check (role in ('parent', 'child')),
  household_id  uuid references public.households on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.households
  add constraint households_created_by_fkey
  foreign key (created_by) references public.profiles(id) on delete set null;

create table public.children (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  household_id  uuid not null references public.households on delete cascade,
  created_at    timestamptz not null default now()
);

create table public.devices (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  type          text not null check (type in ('phone', 'tablet', 'laptop', 'gaming', 'tv')),
  household_id  uuid not null references public.households on delete cascade,
  assigned_to   uuid references public.children on delete set null,
  pairing_code  text not null unique default generate_pairing_code(),
  paired        boolean not null default false,
  status        text not null default 'idle' check (status in ('active', 'idle', 'blocked')),
  created_at    timestamptz not null default now()
);

create table public.schedules (
  id                   uuid primary key default gen_random_uuid(),
  name                 text not null,
  household_id         uuid not null references public.households on delete cascade,
  time_start           time not null,
  time_end             time not null,
  days                 text[] not null default '{}',
  pause_notifications  boolean not null default false,
  lock_entertainment   boolean not null default false,
  status               text not null default 'active' check (status in ('active', 'scheduled', 'paused')),
  icon                 text,
  created_by           uuid references public.profiles on delete set null,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create table public.schedule_devices (
  schedule_id uuid not null references public.schedules on delete cascade,
  device_id   uuid not null references public.devices on delete cascade,
  primary key (schedule_id, device_id)
);

create table public.enforcement_status (
  device_id          uuid primary key references public.devices on delete cascade,
  is_blocked         boolean not null default false,
  active_schedule_id uuid references public.schedules on delete set null,
  blocked_at         timestamptz,
  updated_at         timestamptz not null default now()
);

-- Indexes
create index idx_profiles_household    on public.profiles(household_id);
create index idx_children_household    on public.children(household_id);
create index idx_devices_household     on public.devices(household_id);
create index idx_devices_assigned_to   on public.devices(assigned_to);
create index idx_schedules_household   on public.schedules(household_id);
create index idx_enforcement_device    on public.enforcement_status(device_id);

-- Updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger trg_schedules_updated_at
  before update on public.schedules
  for each row execute function public.set_updated_at();

create trigger trg_enforcement_status_updated_at
  before update on public.enforcement_status
  for each row execute function public.set_updated_at();

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Enable RLS
alter table public.households        enable row level security;
alter table public.profiles          enable row level security;
alter table public.children          enable row level security;
alter table public.devices           enable row level security;
alter table public.schedules         enable row level security;
alter table public.schedule_devices  enable row level security;
alter table public.enforcement_status enable row level security;

-- RLS Policies

-- Profiles
create policy "Users can view own profile"
  on public.profiles for select using (id = auth.uid());

create policy "Users can view household members"
  on public.profiles for select using (
    household_id in (select household_id from public.profiles where id = auth.uid())
  );

create policy "Users can update own profile"
  on public.profiles for update
  using (id = auth.uid()) with check (id = auth.uid());

create policy "Users can insert own profile"
  on public.profiles for insert with check (id = auth.uid());

-- Households
create policy "Authenticated users can create households"
  on public.households for insert with check (auth.uid() is not null);

create policy "Members can view their household"
  on public.households for select using (
    id in (select household_id from public.profiles where id = auth.uid())
  );

create policy "Parents can update their household"
  on public.households for update using (
    id in (select household_id from public.profiles where id = auth.uid() and role = 'parent')
  );

create policy "Parents can delete their household"
  on public.households for delete using (
    id in (select household_id from public.profiles where id = auth.uid() and role = 'parent')
  );

create policy "Anyone can lookup by invite code"
  on public.households for select using (auth.uid() is not null);

-- Children
create policy "Parents can manage children"
  on public.children for all
  using (household_id in (select household_id from public.profiles where id = auth.uid() and role = 'parent'))
  with check (household_id in (select household_id from public.profiles where id = auth.uid() and role = 'parent'));

create policy "Household members can view children"
  on public.children for select using (
    household_id in (select household_id from public.profiles where id = auth.uid())
  );

-- Devices
create policy "Parents can manage devices"
  on public.devices for all
  using (household_id in (select household_id from public.profiles where id = auth.uid() and role = 'parent'))
  with check (household_id in (select household_id from public.profiles where id = auth.uid() and role = 'parent'));

create policy "Household members can view devices"
  on public.devices for select using (
    household_id in (select household_id from public.profiles where id = auth.uid())
  );

create policy "Devices can find by pairing code"
  on public.devices for select using (paired = false);

-- Allow anon to update device paired status (for child pairing flow)
create policy "Anon can update device pairing"
  on public.devices for update using (true) with check (true);

-- Schedules
create policy "Parents can manage schedules"
  on public.schedules for all
  using (household_id in (select household_id from public.profiles where id = auth.uid() and role = 'parent'))
  with check (household_id in (select household_id from public.profiles where id = auth.uid() and role = 'parent'));

create policy "Household members can view schedules"
  on public.schedules for select using (
    household_id in (select household_id from public.profiles where id = auth.uid())
  );

-- Schedule Devices
create policy "Parents can manage schedule_devices"
  on public.schedule_devices for all
  using (schedule_id in (
    select s.id from public.schedules s join public.profiles p on p.household_id = s.household_id
    where p.id = auth.uid() and p.role = 'parent'
  ))
  with check (schedule_id in (
    select s.id from public.schedules s join public.profiles p on p.household_id = s.household_id
    where p.id = auth.uid() and p.role = 'parent'
  ));

create policy "Household members can view schedule_devices"
  on public.schedule_devices for select using (
    schedule_id in (
      select s.id from public.schedules s join public.profiles p on p.household_id = s.household_id
      where p.id = auth.uid()
    )
  );

-- Enforcement Status
create policy "Parents can manage enforcement_status"
  on public.enforcement_status for all
  using (device_id in (
    select d.id from public.devices d join public.profiles p on p.household_id = d.household_id
    where p.id = auth.uid() and p.role = 'parent'
  ))
  with check (device_id in (
    select d.id from public.devices d join public.profiles p on p.household_id = d.household_id
    where p.id = auth.uid() and p.role = 'parent'
  ));

create policy "Paired devices can read own enforcement"
  on public.enforcement_status for select using (true);

-- Allow anon to upsert enforcement (for child device pairing)
create policy "Anon can upsert enforcement"
  on public.enforcement_status for insert with check (true);

create policy "Anon can update enforcement"
  on public.enforcement_status for update using (true) with check (true);

-- Realtime
alter publication supabase_realtime add table public.enforcement_status;

-- Grants
grant usage on schema public to anon;
grant select on public.devices to anon;
grant update on public.devices to anon;
grant select, insert, update on public.enforcement_status to anon;
grant select on public.schedules to anon;

grant usage on schema public to authenticated;
grant all on public.profiles to authenticated;
grant all on public.households to authenticated;
grant all on public.children to authenticated;
grant all on public.devices to authenticated;
grant all on public.schedules to authenticated;
grant all on public.schedule_devices to authenticated;
grant all on public.enforcement_status to authenticated;

grant usage on schema public to service_role;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;

-- =============================================================================
-- Create profile for any existing auth users that don't have one
-- =============================================================================
insert into public.profiles (id, email, full_name)
select u.id, u.email, coalesce(u.raw_user_meta_data ->> 'full_name', '')
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id);

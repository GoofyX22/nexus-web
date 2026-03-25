-- Fix infinite recursion in profiles RLS policy
-- The "Users can view household members" policy queries profiles to check household_id,
-- which triggers the same policy again → infinite loop.

-- Drop the problematic policy
drop policy if exists "Users can view household members" on public.profiles;

-- Replace with a non-recursive version that allows viewing all profiles
-- in the same household by checking household_id directly
-- (uses a security definer function to avoid recursion)

create or replace function public.get_my_household_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select household_id from public.profiles where id = auth.uid();
$$;

create policy "Users can view household members"
  on public.profiles for select using (
    household_id = public.get_my_household_id()
  );

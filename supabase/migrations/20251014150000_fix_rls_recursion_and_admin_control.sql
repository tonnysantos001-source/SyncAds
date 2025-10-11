/*
# [Structural] Fix RLS Recursion and Add Admin Control Type
This migration fixes a critical infinite recursion bug in the 'profiles' table RLS policies and adds a new 'Admin Control' type to the 'ai_models' table.

## Query Description: This operation is a structural fix and enhancement.
1.  **Fix RLS Recursion**: It drops the old, faulty RLS policies on the `profiles` table that were causing an "infinite recursion" error. It then creates a secure helper function (`get_my_role`) and reinstates the policies correctly, ensuring administrators can manage users without causing a database error. This is a critical fix for application stability.
2.  **Add Admin Control AI Type**: It modifies the `model_type` in the `ai_models` table to include a new 'Admin Control' option. This enables the new "IA Admin" feature, allowing administrators to use a dedicated AI for system management tasks.

This migration is safe to run and is essential for the correct functioning of user roles and the new administrative AI features.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Medium"
- Requires-Backup: false
- Reversible: false

## Structure Details:
- **Tables Modified**: `profiles`, `ai_models`
- **Functions Created**: `get_my_role()`
- **Policies Recreated**: `SELECT`, `INSERT`, `UPDATE`, `DELETE` on `public.profiles`
- **Types Altered**: `model_type` enum

## Security Implications:
- RLS Status: Enabled
- Policy Changes: Yes. Fixes a critical RLS bug, making security policies robust and functional.
- Auth Requirements: Policies correctly use `auth.uid()` and the new helper function.

## Performance Impact:
- Indexes: None
- Triggers: None
- Estimated Impact: Low. The new function is highly efficient. The overall impact is a significant improvement in stability.
*/

-- Step 1: Drop existing policies on profiles to prevent errors during function/trigger recreation.
-- It's safe to drop them as we will recreate them correctly.
DROP POLICY IF EXISTS "Allow individual read access" ON public.profiles;
DROP POLICY IF EXISTS "Allow individual insert access" ON public.profiles;
DROP POLICY IF EXISTS "Allow individual update access" ON public.profiles;
DROP POLICY IF EXISTS "Allow admin full access" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for admins" ON public.profiles;
DROP POLICY IF EXISTS "Allow admin to read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by users who created them." ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;


-- Step 2: Create a secure function to get the user's role without causing recursion.
-- The `SECURITY DEFINER` is crucial here. It runs the function with the permissions of the
-- function owner, bypassing the RLS policy of the calling user for this specific query,
-- thus breaking the infinite loop.
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT role FROM profiles WHERE id = auth.uid();
$$;


-- Step 3: Re-enable RLS on the profiles table if it's not already enabled.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;


-- Step 4: Create the corrected RLS policies using the new helper function.
-- This set of policies is robust and covers all necessary cases.
CREATE POLICY "Allow individual read access"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Allow individual insert access"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow individual update access"
ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow admin full access"
ON public.profiles FOR ALL
USING (public.get_my_role() = 'admin')
WITH CHECK (public.get_my_role() = 'admin');


-- Step 5: Add the 'Admin Control' type to the ai_models table.
-- This uses a safe method to add a new value to an existing enum type.
ALTER TYPE public.model_type ADD VALUE IF NOT EXISTS 'Admin Control';

/*
# [Schema Upgrade] Add User Roles
This migration adds a 'role' column to the 'profiles' table and sets up a trigger to automatically assign 'admin' to the first user and 'user' to all subsequent users.

## Query Description: [This operation modifies the 'profiles' table to include user roles. It drops the old user creation trigger and function to replace them with a new, role-aware version. This is a structural change and is safe to run on existing schemas, as it will default all current users to the 'user' role.]

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Medium"
- Requires-Backup: false
- Reversible: true

## Structure Details:
- Tables affected: 'profiles'
- Columns added: 'role' (TEXT)
- Functions dropped: 'handle_new_user'
- Triggers dropped: 'on_auth_user_created'
- Functions created: 'handle_new_user_and_set_role'
- Triggers created: 'on_auth_user_created_set_role'

## Security Implications:
- RLS Status: Unchanged
- Policy Changes: No
- Auth Requirements: This enables role-based access control in the application logic.

## Performance Impact:
- Indexes: None
- Triggers: Replaces an existing trigger with a new one. Negligible performance impact.
- Estimated Impact: Low
*/

-- Step 1: Drop the old trigger and function if they exist to prevent conflicts.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Step 2: Add the 'role' column to the profiles table.
-- All existing users will default to 'user'. This is non-destructive.
ALTER TABLE public.profiles
ADD COLUMN role TEXT NOT NULL DEFAULT 'user';

-- Step 3: Create a new function to handle new user creation and role assignment.
CREATE OR REPLACE FUNCTION public.handle_new_user_and_set_role()
RETURNS TRIGGER AS $$
DECLARE
  admin_count INTEGER;
BEGIN
  -- Insert a new profile for the new user.
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.email);

  -- Check if any admin user already exists.
  SELECT count(*) INTO admin_count FROM public.profiles WHERE role = 'admin';

  -- If no admin exists, promote the new user to admin.
  IF admin_count = 0 THEN
    UPDATE public.profiles
    SET role = 'admin'
    WHERE id = new.id;
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Create the trigger to call the new function after a user signs up.
CREATE TRIGGER on_auth_user_created_set_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_and_set_role();

-- Step 5: Comment on the new function and trigger for clarity.
COMMENT ON FUNCTION public.handle_new_user_and_set_role() IS 'Handles new user creation by creating a profile and assigning the admin role to the first user.';
COMMENT ON TRIGGER on_auth_user_created_set_role ON auth.users IS 'Trigger to create a profile and assign a role upon new user registration.';

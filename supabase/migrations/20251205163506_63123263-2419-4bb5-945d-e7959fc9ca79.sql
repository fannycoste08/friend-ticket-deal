-- Drop the vulnerable view since it's no longer needed
-- Admin.tsx now uses the secure get_profiles_with_friend_count_admin() function
DROP VIEW IF EXISTS public.profiles_with_friend_count;
-- Move pg_net extension from public schema to extensions schema
-- This follows Supabase best practices to avoid namespace pollution

-- Create extensions schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS extensions;

-- Drop the extension from public schema
DROP EXTENSION IF EXISTS pg_net;

-- Install the extension in the extensions schema
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Grant usage on the extensions schema to required roles
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;
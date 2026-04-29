---
name: profiles-public-view
description: Public-safe view profiles_public excludes email; clients must use it for any non-self profile reads
type: feature
---
The `profiles` table SELECT is restricted to `auth.uid() = id` (owner only). All cross-user reads (friend lists, suggestions, requests, profile pages) MUST query `public.profiles_public` (id, name, created_at, updated_at — no email). Edge functions with service role still read `profiles.email` server-side for notifications. Updated frontend files: UserProfile.tsx, Profile.tsx, FriendRequestsDialog.tsx, FriendshipRequests.tsx, InvitationManager.tsx.



# Plan: Hide Admin Portal from Public View

## Problem
The landing page publicly displays a "Staff Portal" section with a direct link to `/staff-login`, making the admin entry point visible to everyone. While the admin routes are already protected by `AdminGuard` (role-based access), the login page itself is openly discoverable.

## Changes

### 1. Remove "Staff Portal" section from the Landing page
**File: `src/pages/Landing.tsx`** (lines ~346-358)
- Delete the entire "Staff Login" section that shows the Briefcase icon, "Staff Portal" heading, and the "Staff Login" button linking to `/staff-login`.
- This removes the only public-facing pointer to the admin area.

### 2. Make `/staff-login` route accessible only via direct URL
The route stays in the router (staff still need it), but with no visible link anywhere on the public site, only people who know the URL can reach it. This is "security through obscurity" layered on top of the existing role-based guards.

### 3. Optional: Rename the staff login route to something less guessable
Change the route from `/staff-login` to something like `/team-access` or a random path (e.g., `/portal-9x2k`). This makes it harder for someone to guess the URL. Updates needed:
- `src/App.tsx` — route definition
- `src/pages/StaffLogin.tsx` — any internal references
- `src/pages/Auth.tsx` — the comment referencing `/staff-login`

### Summary
- The admin dashboard is already fully protected by `AdminGuard` (redirects unauthorized users).
- The main change is removing the public "Staff Portal" link from the landing page so customers don't see it.
- Optionally obscure the URL path for extra protection.


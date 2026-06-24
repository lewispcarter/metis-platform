# V41 Authentication Foundation

This version builds from the working V40 sanity-fixed baseline.

## Added

- Demo session abstraction
- Role model
- Permission model
- Protected route policy
- Auth page at `/auth`
- Access denied page at `/access-denied`
- Local-safe auth mode environment value

## Important

This does not require Clerk or any external authentication service to run locally.

Current mode:
`NEXT_PUBLIC_AUTH_MODE=DEMO`

Future production path:
- replace demo session with Clerk/Auth.js/session provider
- enforce middleware route protection
- connect users to organizations

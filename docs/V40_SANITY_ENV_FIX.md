# V40 Sanity Env Fix

The previous v40 install fix passed `pnpm install` but failed `pnpm ci:local` because the workspace sanity check requires these keys in `.env.example`:

- DATABASE_URL
- REDIS_URL
- CLERK_SECRET_KEY
- WEBHOOK_PUBLIC_BASE_URL
- TWILIO_AUTH_TOKEN

This package adds safe local placeholders so local CI can continue.

These are not production secrets.
Replace them before deployment.

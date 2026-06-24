# V39 Deployment Readiness

V39 prepares Metis Systems for a public preview deployment.

## Added

- Vercel deployment configuration
- Standalone Next.js output configuration
- Deployment Control page at `/deployment`
- Deployment readiness checklist
- Domain guidance for `app.metissystems.com` or `ops.metissystems.com`
- Deployment scripts in root `package.json`

## Recommended deployment path

1. Push repository to GitHub.
2. Import GitHub repository into Vercel.
3. Use the repository root as the Vercel project root.
4. Build command: `pnpm --filter @metis/web build`
5. Connect domain:
   - `app.metissystems.com`
   - `ops.metissystems.com`

## Important limitation

This build is public-preview ready for demo visibility, not production customer data.

The active data layer is still browser-local. V40 should implement production PostgreSQL persistence before serious external use.

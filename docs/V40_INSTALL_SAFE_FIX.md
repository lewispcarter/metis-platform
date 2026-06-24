# V40 Install-Safe Fix

This package fixes the v40 install failure by removing generated dependency/build artifacts from the ZIP.

The error shown by pnpm:

`ERR_PNPM_LINKING_FAILED Cannot read properties of undefined (reading 'ino')`

is a dependency-linking/install-artifact issue, not a Metis application feature issue.

## What changed

- Removed `node_modules`
- Removed `.next`
- Removed `.turbo`
- Removed generated build artifacts
- Added `.npmrc` with stable isolated pnpm linker settings
- Kept PostgreSQL foundation as safe config-only code
- Local browser persistence remains the active runtime mode

## Test

Run:

```powershell
pnpm install
pnpm ci:local
pnpm dev
```

Then open:

```text
http://localhost:3000/database
```

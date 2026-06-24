/**
 * WORKSPACE SANITY CHECK
 * Purpose: Performs dependency-free validation of the Metis monorepo shape before a full install/build.
 * Role: Gives a fast, deterministic preflight check for required files, package scripts, migrations, and environment templates.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const failures = [];

const requiredPaths = [
  'package.json',
  'pnpm-workspace.yaml',
  'turbo.json',
  'tsconfig.base.json',
  '.env.example',
  'apps/api/package.json',
  'apps/api/src/main.ts',
  'apps/api/src/app.module.ts',
  'apps/api/prisma/schema.prisma',
  'apps/web/package.json',
  'apps/web/app/page.tsx',
  'packages/shared-types/src/index.ts',
  'packages/shared-events/src/index.ts',
  'packages/shared-auth/src/index.ts',
  'infrastructure/docker/docker-compose.yml',
  '.github/workflows/ci.yml',
];

function assertPath(path) {
  if (!existsSync(join(root, path))) {
    failures.push(`Missing required path: ${path}`);
  }
}

function readJson(path) {
  try {
    return JSON.parse(readFileSync(join(root, path), 'utf8'));
  } catch (error) {
    failures.push(`Invalid JSON: ${path} (${error.message})`);
    return {};
  }
}

for (const path of requiredPaths) {
  assertPath(path);
}

const rootPackage = readJson('package.json');
const apiPackage = readJson('apps/api/package.json');
const webPackage = readJson('apps/web/package.json');

const requiredRootScripts = ['dev', 'build', 'test', 'typecheck', 'db:migrate', 'db:generate', 'readiness:check', 'sanity:check'];
const requiredApiScripts = ['dev', 'build', 'test', 'typecheck', 'prisma:generate', 'prisma:migrate', 'readiness:check'];
const requiredWebScripts = ['dev', 'build', 'typecheck'];

for (const script of requiredRootScripts) {
  if (!rootPackage.scripts?.[script]) failures.push(`Root package missing script: ${script}`);
}
for (const script of requiredApiScripts) {
  if (!apiPackage.scripts?.[script]) failures.push(`API package missing script: ${script}`);
}
for (const script of requiredWebScripts) {
  if (!webPackage.scripts?.[script]) failures.push(`Web package missing script: ${script}`);
}

const migrationsDir = join(root, 'apps/api/prisma/migrations');
if (existsSync(migrationsDir)) {
  const migrations = readdirSync(migrationsDir).filter((entry) => !entry.startsWith('.'));
  if (migrations.length < 5) failures.push(`Expected at least 5 Prisma migrations, found ${migrations.length}`);
} else {
  failures.push('Missing Prisma migrations directory');
}

const envExample = existsSync(join(root, '.env.example')) ? readFileSync(join(root, '.env.example'), 'utf8') : '';
// V40 local-safe placeholders in .env.example are valid for install/local CI.
const requiredEnvKeys = [
  'DATABASE_URL',
  'REDIS_URL',
  'CLERK_SECRET_KEY',
  'WEBHOOK_PUBLIC_BASE_URL',
  'TWILIO_AUTH_TOKEN',
];
for (const key of requiredEnvKeys) {
  if (!envExample.includes(`${key}=`)) failures.push(`.env.example missing key: ${key}`);
}

if (failures.length > 0) {
  console.error('\nMetis workspace sanity check failed:\n');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Metis workspace sanity check passed. Repository shape is valid before dependency install.');

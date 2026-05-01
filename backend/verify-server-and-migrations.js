import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_PORT = process.env.PORT || process.env.BACKEND_PORT || '5000';
const BASE_URL = process.env.API_BASE_URL || process.env.RENDER_EXTERNAL_URL || `http://localhost:${DEFAULT_PORT}`;
const HEALTH_URL = `${BASE_URL.replace(/\/$/, '')}/api/health`;
const RUN_TESTS = process.argv.includes('--run-tests');
const TEST_SCRIPT = path.join(__dirname, 'COMPREHENSIVE_ERP_SYSTEM_TEST.js');
const MIGRATIONS_DIR = path.join(__dirname, 'prisma', 'migrations');

function formatList(values) {
  if (values.length === 0) {
    return 'none';
  }

  return values.map((value) => `- ${value}`).join('\n');
}

async function checkServerHealth() {
  const fetchFn = globalThis.fetch ?? (await import('node-fetch')).default;
  const response = await fetchFn(HEALTH_URL);

  if (!response.ok) {
    throw new Error(`Health check failed with status ${response.status}`);
  }

  const payload = await response.json();
  console.log(`✅ Server health check passed: ${payload.status || 'OK'}`);
}

async function checkDatabaseMigrations() {
  await prisma.$connect();

  const expectedTables = Prisma.dmmf.datamodel.models
    .map((model) => model.dbName ?? model.name)
    .sort((left, right) => left.localeCompare(right));

  const tableRows = await prisma.$queryRawUnsafe(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
  `);

  const liveTables = new Set(tableRows.map((row) => row.table_name));
  const missingTables = expectedTables.filter((tableName) => !liveTables.has(tableName));

  const migrationRows = fs.existsSync(MIGRATIONS_DIR)
    ? fs.readdirSync(MIGRATIONS_DIR, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .sort((left, right) => left.localeCompare(right))
    : [];

  let appliedMigrations = [];
  let migrationTableAvailable = true;

  try {
    appliedMigrations = await prisma.$queryRawUnsafe(`
      SELECT migration_name
      FROM "_prisma_migrations"
      ORDER BY finished_at ASC NULLS LAST, started_at ASC
    `);
  } catch (error) {
    migrationTableAvailable = false;
    console.log('⚠️  Could not read _prisma_migrations table. Prisma migrate may not have been run yet.');
  }

  const appliedMigrationNames = appliedMigrations.map((row) => row.migration_name);
  const pendingMigrations = migrationRows.filter((migrationName) => !appliedMigrationNames.includes(migrationName));

  console.log('');
  console.log('Database table verification:');
  console.log(`- Expected tables: ${expectedTables.length}`);
  console.log(`- Live tables: ${liveTables.size}`);
  console.log(`- Missing tables: ${missingTables.length}`);
  console.log(`- Local migrations: ${migrationRows.length}`);
  console.log(`- Applied migrations: ${appliedMigrationNames.length}`);
  console.log(`- Pending migrations: ${pendingMigrations.length}`);

  if (missingTables.length > 0) {
    console.log('');
    console.log('Missing tables:');
    console.log(formatList(missingTables));
  }

  if (pendingMigrations.length > 0) {
    console.log('');
    console.log('Pending migrations:');
    console.log(formatList(pendingMigrations));
  }

  if (missingTables.length > 0 || pendingMigrations.length > 0 || !migrationTableAvailable) {
    throw new Error('Database migration verification failed');
  }

  console.log('✅ Database migrations are up to date and all Prisma tables exist.');
}

function runComprehensiveTests() {
  if (!RUN_TESTS) {
    return;
  }

  if (!fs.existsSync(TEST_SCRIPT)) {
    throw new Error('COMPREHENSIVE_ERP_SYSTEM_TEST.js not found');
  }

  console.log('');
  console.log('🚀 Running comprehensive module test suite...');

  const result = spawnSync(process.execPath, [TEST_SCRIPT], {
    cwd: __dirname,
    stdio: 'inherit',
    shell: false
  });

  if (result.status !== 0) {
    throw new Error('Comprehensive test suite failed');
  }
}

async function main() {
  console.log('🧪 Backend verification starting...');
  console.log(`- Health URL: ${HEALTH_URL}`);
  console.log(`- Run tests: ${RUN_TESTS ? 'yes' : 'no'}`);

  await checkServerHealth();
  await checkDatabaseMigrations();
  runComprehensiveTests();

  console.log('');
  console.log('✅ Backend verification completed successfully.');
}

main()
  .catch((error) => {
    console.error('');
    console.error(`❌ ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
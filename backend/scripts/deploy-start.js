import { spawnSync } from 'node:child_process';

const maxSeedRetries = Number(process.env.SEED_RETRY_COUNT || 3);
const seedRetryDelayMs = Number(process.env.SEED_RETRY_DELAY_MS || 10000);

const runCommand = (command, args) => {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: process.env
  });

  return result.status ?? 1;
};

const sleep = (ms) => new Promise((resolve) => {
  setTimeout(resolve, ms);
});

const runMigrations = () => {
  console.log('Running Prisma migrations...');
  const code = runCommand('npx', ['prisma', 'migrate', 'deploy']);
  if (code !== 0) {
    process.exit(code);
  }
};

const runSeedWithRetry = async () => {
  if (process.env.RUN_SEED_ON_DEPLOY !== 'true') {
    console.log('RUN_SEED_ON_DEPLOY is not true. Skipping seed step.');
    return;
  }

  console.log('RUN_SEED_ON_DEPLOY=true. Running seed...');
  for (let attempt = 1; attempt <= maxSeedRetries; attempt += 1) {
    console.log(`Seed attempt ${attempt}/${maxSeedRetries}`);
    const code = runCommand('node', ['prisma/seed.js']);

    if (code === 0) {
      console.log('Seed completed successfully.');
      return;
    }

    if (attempt < maxSeedRetries) {
      console.warn(`Seed failed. Retrying in ${seedRetryDelayMs}ms...`);
      await sleep(seedRetryDelayMs);
    }
  }

  console.error('Seed failed after all retry attempts.');
  process.exit(1);
};

const startServer = () => {
  console.log('Starting backend server...');
  const code = runCommand('node', ['src/server.js']);
  process.exit(code);
};

const main = async () => {
  runMigrations();
  await runSeedWithRetry();
  startServer();
};

main().catch((error) => {
  console.error('Deployment start failed:', error);
  process.exit(1);
});

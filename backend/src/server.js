import { createServer } from 'http';
import app from './app.js';
import { env } from './config/env.js';
import prisma from './config/db.js';
import { realTimeServer } from './core/realtime.js';

import { seedPermissions } from './core/rbac/permissions.seed.js';
import { seedRoles } from './core/rbac/roles.seed.js';
import { assignPermissions } from './core/rbac/rolePermission.seed.js';

import { seedInventoryWorkflow, seedFinanceExpenseWorkflow } from './core/workflow/workflow.seed.js';



await seedInventoryWorkflow(
  '6c48be82-3c9e-4f57-b807-c1521010c5de'
);

await seedFinanceExpenseWorkflow('2ffb2a5f-6cb9-40d3-a76e-e4d62d7af033');
const startServer = async () => {
  // 1️⃣ Seed permissions (safe upsert)
  await seedPermissions();

  // 2️⃣ Seed roles + permissions per tenant
  const tenants = await prisma.tenant.findMany();

  if (tenants.length === 0) {
    console.log('⚠️ No tenants found. Skipping role seeding.');
  } else {
    for (const tenant of tenants) {
      await seedRoles(tenant.id);
      await assignPermissions(tenant.id);
    }
  }

  // 3️⃣ Create HTTP server and initialize WebSocket
  const server = createServer(app);
  realTimeServer.initialize(server);

  // 4️⃣ Start server
  server.listen(env.port, () => {
    console.log(`🚀 Server running on port ${env.port}`);
    console.log(`🔌 WebSocket server available at ws://localhost:${env.port}/ws`);
  });
};

startServer();

import { createServer } from 'http';
import app from './app.js';
import { env } from './config/env.js';
import prisma from './config/db.js';
import { realTimeServer } from './core/realtime.js';
import { initializeScheduledJobs } from './core/scheduler.js';
import emailQueueService from './services/emailQueue.service.js';

import { seedPermissions } from './core/rbac/permissions.seed.js';
import { seedRoles } from './core/rbac/roles.seed.js';
import { assignPermissions } from './core/rbac/rolePermission.seed.js';

import { seedInventoryWorkflow, seedFinanceExpenseWorkflow } from './core/workflow/workflow.seed.js';

const startServer = async () => {
  try {
    // Seed workflows if needed (commented out - run manually with specific tenant IDs)
    // await seedInventoryWorkflow('YOUR_TENANT_ID');
    // await seedFinanceExpenseWorkflow('YOUR_TENANT_ID');
    

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
    
    // Start server first
    await new Promise((resolve, reject) => {
      server.listen(env.port, '0.0.0.0', () => {
        console.log(`🚀 Server running on port ${env.port}`);
        resolve();
      });
      
      server.on('error', (error) => {
        console.error('❌ Server error:', error);
        reject(error);
      });
    });
    
    // Initialize WebSocket after server is listening
    realTimeServer.initialize(server);
    console.log(`🔌 WebSocket server available at ws://localhost:${env.port}/ws`);

    // 4️⃣ Initialize scheduled jobs (cron tasks)
    initializeScheduledJobs();

    // 5️⃣ Initialize email queue processor
    emailQueueService.initialize();
  } catch (error) {
    console.error('❌ Fatal error starting server:', error);
    process.exit(1);
  }
};

startServer().catch((error) => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});

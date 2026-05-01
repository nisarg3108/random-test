import { createServer } from 'http';
import https from 'https';
import http from 'http';
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

// KeepAlive: Prevent Render free tier from sleeping (pings every 10 min)
if (process.env.NODE_ENV === 'production' && process.env.RENDER_EXTERNAL_URL) {
  const PING_URL = `${process.env.RENDER_EXTERNAL_URL}/api/health`;
  const INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

  const pingServer = () => {
    const url = new URL(PING_URL);
    const requester = url.protocol === 'https:' ? https : http;
    requester.get(url.toString(), (res) => {
      console.log(`[KeepAlive] Pinged ${PING_URL} → ${res.statusCode}`);
    }).on('error', (err) => {
      console.warn('[KeepAlive] Ping failed:', err.message);
    });
  };

  // Start pinging after 1 minute delay (let server fully boot first)
  setTimeout(() => {
    pingServer();
    setInterval(pingServer, INTERVAL_MS);
    console.log('[KeepAlive] Self-ping started every 10 min (Render free tier)');
  }, 60 * 1000);
}

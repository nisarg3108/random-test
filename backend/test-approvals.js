import prisma from './src/config/db.js';
import { seedInventoryWorkflows } from './src/core/workflow/workflow.seed.js';

async function testApprovalSystem() {
  try {
    console.log('🧪 Testing Approval System...');
    
    // Get first tenant
    const tenant = await prisma.tenant.findFirst();
    if (!tenant) {
      console.log('❌ No tenant found. Please create a tenant first.');
      return;
    }
    
    console.log(`✅ Using tenant: ${tenant.name} (${tenant.id})`);
    
    // Check existing workflows
    const existingWorkflows = await prisma.workflow.findMany({
      where: { tenantId: tenant.id },
      include: { steps: true }
    });
    
    console.log(`📋 Found ${existingWorkflows.length} existing workflows`);
    
    // Seed workflows if none exist
    if (existingWorkflows.length === 0) {
      console.log('🌱 Seeding inventory workflows...');
      const workflows = await seedInventoryWorkflows(tenant.id);
      console.log(`✅ Created ${workflows.length} workflows`);
    }
    
    // Get admin user
    const adminUser = await prisma.user.findFirst({
      where: { 
        tenantId: tenant.id,
        role: { in: ['ADMIN', 'MANAGER'] }
      }
    });
    
    if (!adminUser) {
      console.log('❌ No admin/manager user found. Please create one first.');
      return;
    }
    
    console.log(`👤 Using user: ${adminUser.email} (${adminUser.role})`);
    
    // Create test approval
    const workflow = await prisma.workflow.findFirst({
      where: {
        tenantId: tenant.id,
        module: 'INVENTORY',
        action: 'CREATE'
      },
      include: { steps: true }
    });
    
    if (!workflow) {
      console.log('❌ No CREATE workflow found');
      return;
    }
    
    console.log(`🔄 Using workflow: ${workflow.id}`);
    
    // Create workflow request
    const request = await prisma.workflowRequest.create({
      data: {
        tenantId: tenant.id,
        workflowId: workflow.id,
        module: 'INVENTORY',
        action: 'CREATE',
        status: 'PENDING',
        createdBy: adminUser.id,
        payload: {
          name: 'Test Item via Script',
          sku: `TEST-SCRIPT-${Date.now()}`,
          price: 199.99,
          quantity: 5,
          description: 'Test item created via approval script'
        }
      }
    });
    
    console.log(`📝 Created request: ${request.id}`);
    
    // Create approval
    const approval = await prisma.approval.create({
      data: {
        workflowId: workflow.id,
        workflowStepId: workflow.steps[0].id,
        stepOrder: 1,
        permission: 'inventory.approve',
        tenantId: tenant.id,
        status: 'PENDING',
        data: {
          action: 'CREATE',
          data: request.payload
        }
      }
    });
    
    console.log(`✅ Created approval: ${approval.id}`);
    
    // Check pending approvals
    const pendingApprovals = await prisma.approval.findMany({
      where: {
        tenantId: tenant.id,
        status: 'PENDING'
      },
      include: {
        workflow: true
      }
    });
    
    console.log(`📋 Total pending approvals: ${pendingApprovals.length}`);
    
    console.log('🎉 Test completed successfully!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Start the backend server: npm run dev');
    console.log('2. Start the frontend server: npm run dev');
    console.log('3. Login as admin/manager');
    console.log('4. Go to Approval Dashboard');
    console.log('5. You should see the pending approval');
    
  } catch (error) {
    console.error('❌ Error testing approval system:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testApprovalSystem();
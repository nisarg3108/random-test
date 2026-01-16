import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearWorkflowData() {
  try {
    await prisma.approval.deleteMany({});
    console.log('✓ Deleted all Approvals');
    
    await prisma.workflowStep.deleteMany({});
    console.log('✓ Deleted all WorkflowSteps');
    
    await prisma.workflow.deleteMany({});
    console.log('✓ Deleted all Workflows');
    
    console.log('\n✅ Successfully cleared all workflow data');
  } catch (error) {
    console.error('❌ Error clearing workflow data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearWorkflowData();

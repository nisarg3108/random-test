/**
 * Seed Default Sales Pipeline
 * Run: node seed-pipeline.js
 */

import prisma from './src/config/db.js';

async function seedPipeline() {
  console.log('🌱 Seeding default sales pipeline...\n');

  try {
    // Get all tenants
    const tenants = await prisma.tenant.findMany();
    
    if (tenants.length === 0) {
      console.log('❌ No tenants found. Please create a tenant first.');
      return;
    }

    for (const tenant of tenants) {
      console.log(`📊 Processing tenant: ${tenant.name} (${tenant.id})`);

      // Check if pipeline already exists
      const existingPipeline = await prisma.pipeline.findFirst({
        where: { tenantId: tenant.id }
      });

      if (existingPipeline) {
        console.log('   ⚠️  Pipeline already exists, skipping...\n');
        continue;
      }

      // Create default pipeline
      const pipeline = await prisma.pipeline.create({
        data: {
          tenantId: tenant.id,
          name: 'Sales Pipeline',
          description: 'Default sales pipeline for tracking deals',
          isDefault: true,
          isActive: true
        }
      });

      console.log(`   ✅ Created pipeline: ${pipeline.name}`);

      // Create pipeline stages
      const stages = [
        { name: 'PROSPECTING', order: 1, probability: 10, description: 'Initial contact and qualification' },
        { name: 'QUALIFICATION', order: 2, probability: 25, description: 'Qualifying the opportunity' },
        { name: 'PROPOSAL', order: 3, probability: 50, description: 'Proposal sent to customer' },
        { name: 'NEGOTIATION', order: 4, probability: 75, description: 'Negotiating terms and pricing' },
        { name: 'CLOSED_WON', order: 5, probability: 100, description: 'Deal won!', isClosedWon: true },
        { name: 'CLOSED_LOST', order: 6, probability: 0, description: 'Deal lost', isClosedLost: true }
      ];

      for (const stage of stages) {
        await prisma.pipelineStage.create({
          data: {
            tenantId: tenant.id,
            pipelineId: pipeline.id,
            name: stage.name,
            order: stage.order,
            probability: stage.probability,
            description: stage.description,
            isClosedWon: stage.isClosedWon || false,
            isClosedLost: stage.isClosedLost || false
          }
        });
        console.log(`      ✓ Stage: ${stage.name} (${stage.probability}%)`);
      }

      console.log('   ✅ All stages created\n');
    }

    console.log('🎉 Pipeline seeding completed!\n');
  } catch (error) {
    console.error('❌ Error seeding pipeline:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedPipeline();

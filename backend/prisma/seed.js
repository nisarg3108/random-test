import { seedPermissions } from '../src/core/rbac/permissions.seed.js';
import prisma from '../src/config/db.js';

const seedSampleCRM = async () => {
  if (process.env.SEED_SAMPLE_CRM !== 'true') {
    return;
  }

  const tenant = await prisma.tenant.findFirst();
  if (!tenant) {
    console.warn('No tenant found. Skipping sample CRM data.');
    return;
  }

  const customer = await prisma.customer.create({
    data: {
      tenantId: tenant.id,
      name: 'Sample Customer',
      industry: 'Software',
      website: 'https://example.com',
      status: 'ACTIVE',
      notes: 'Seeded customer for CRM testing.'
    }
  });

  await prisma.contact.create({
    data: {
      tenantId: tenant.id,
      customerId: customer.id,
      name: 'Alex Morgan',
      email: 'alex@example.com',
      phone: '+1-555-0100',
      title: 'Operations Manager',
      status: 'ACTIVE'
    }
  });

  const lead = await prisma.lead.create({
    data: {
      tenantId: tenant.id,
      name: 'Taylor Lead',
      email: 'taylor.lead@example.com',
      phone: '+1-555-0199',
      company: 'Sample Customer',
      source: 'Website',
      status: 'NEW',
      notes: 'Seeded lead for CRM testing.'
    }
  });

  await prisma.deal.create({
    data: {
      tenantId: tenant.id,
      customerId: customer.id,
      name: 'Sample Deal',
      stage: 'PROSPECTING',
      value: 25000,
      expectedCloseDate: new Date(),
      status: 'OPEN',
      notes: 'Seeded deal for CRM testing.'
    }
  });

  await prisma.communication.create({
    data: {
      tenantId: tenant.id,
      type: 'NOTE',
      subject: 'Seeded CRM note',
      notes: 'Initial outreach logged for seeded CRM data.',
      occurredAt: new Date(),
      leadId: lead.id
    }
  });

  console.log('Sample CRM data seeded.');
};

const seedDefaultPipeline = async () => {
  const tenants = await prisma.tenant.findMany();
  
  for (const tenant of tenants) {
    const existingPipeline = await prisma.pipeline.findFirst({
      where: {
        tenantId: tenant.id,
        isDefault: true
      }
    });
    
    if (existingPipeline) {
      console.log(`Default pipeline already exists for tenant ${tenant.id}`);
      continue;
    }
    
    const pipeline = await prisma.pipeline.create({
      data: {
        tenantId: tenant.id,
        name: 'Sales Pipeline',
        description: 'Default sales opportunity pipeline',
        isDefault: true,
        isActive: true,
        stages: {
          create: [
            {
              tenantId: tenant.id,
              name: 'Prospecting',
              order: 1,
              probability: 10,
              color: '#6B7280',
              isClosedWon: false,
              isClosedLost: false,
              daysInStage: 30
            },
            {
              tenantId: tenant.id,
              name: 'Qualification',
              order: 2,
              probability: 25,
              color: '#3B82F6',
              isClosedWon: false,
              isClosedLost: false,
              daysInStage: 21
            },
            {
              tenantId: tenant.id,
              name: 'Proposal',
              order: 3,
              probability: 50,
              color: '#8B5CF6',
              isClosedWon: false,
              isClosedLost: false,
              daysInStage: 14
            },
            {
              tenantId: tenant.id,
              name: 'Negotiation',
              order: 4,
              probability: 75,
              color: '#F59E0B',
              isClosedWon: false,
              isClosedLost: false,
              daysInStage: 7
            },
            {
              tenantId: tenant.id,
              name: 'Closed Won',
              order: 5,
              probability: 100,
              color: '#10B981',
              isClosedWon: true,
              isClosedLost: false,
              daysInStage: null
            },
            {
              tenantId: tenant.id,
              name: 'Closed Lost',
              order: 6,
              probability: 0,
              color: '#EF4444',
              isClosedWon: false,
              isClosedLost: true,
              daysInStage: null
            }
          ]
        }
      },
      include: {
        stages: true
      }
    });
    
    console.log(`Default pipeline created for tenant ${tenant.id} with ${pipeline.stages.length} stages`);
  }
  
  console.log('Default pipeline seeding complete.');
};

async function main() {
  console.log('Seeding dynamic system options...');
  
  await seedPermissions();
  await seedSampleCRM();
  await seedDefaultPipeline();
  
  console.log('Dynamic system options seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding:', e);
    process.exit(1);
  });

import prisma from './src/config/db.js';

async function seedLeaveTypes() {
  console.log('🚀 Seeding leave types...\n');
  
  try {
    // Get all tenants
    const tenants = await prisma.tenant.findMany();
    
    if (tenants.length === 0) {
      console.log('⚠️  No tenants found. Please create a tenant first.');
      return;
    }

    console.log(`Found ${tenants.length} tenant(s)\n`);

    const defaultLeaveTypes = [
      {
        name: 'Annual Leave',
        code: 'ANNUAL',
        maxDays: 20,
        paid: true,
        requiresApproval: true
      },
      {
        name: 'Sick Leave',
        code: 'SICK',
        maxDays: 10,
        paid: true,
        requiresApproval: false
      },
      {
        name: 'Casual Leave',
        code: 'CASUAL',
        maxDays: 5,
        paid: true,
        requiresApproval: true
      },
      {
        name: 'Maternity Leave',
        code: 'MATERNITY',
        maxDays: 90,
        paid: true,
        requiresApproval: true
      },
      {
        name: 'Paternity Leave',
        code: 'PATERNITY',
        maxDays: 15,
        paid: true,
        requiresApproval: true
      },
      {
        name: 'Unpaid Leave',
        code: 'UNPAID',
        maxDays: 30,
        paid: false,
        requiresApproval: true
      }
    ];

    for (const tenant of tenants) {
      console.log(`Processing tenant: ${tenant.name} (${tenant.id})`);
      
      for (const leaveType of defaultLeaveTypes) {
        // Check if leave type already exists
        const existing = await prisma.leaveType.findFirst({
          where: {
            tenantId: tenant.id,
            code: leaveType.code
          }
        });

        if (existing) {
          console.log(`  ✓ ${leaveType.name} already exists`);
          continue;
        }

        // Create leave type
        await prisma.leaveType.create({
          data: {
            ...leaveType,
            tenantId: tenant.id
          }
        });

        console.log(`  ✅ Created ${leaveType.name}`);
      }
      console.log('');
    }

    console.log('✅ Leave types seeding completed!\n');

    // Show summary
    const totalLeaveTypes = await prisma.leaveType.count();
    console.log(`📊 Total leave types in database: ${totalLeaveTypes}`);

  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedLeaveTypes();

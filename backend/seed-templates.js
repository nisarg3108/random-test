import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const workflowTemplates = [
  {
    name: 'Retail Inventory Workflow',
    description: 'Standard inventory approval for retail businesses',
    industry: 'RETAIL',
    module: 'INVENTORY',
    steps: [
      { permission: 'inventory.request', role: 'USER' },
      { permission: 'inventory.approve', role: 'MANAGER' }
    ],
    isDefault: true
  },
  {
    name: 'Retail Finance Workflow',
    description: 'Expense approval for retail businesses',
    industry: 'RETAIL',
    module: 'FINANCE',
    steps: [
      { permission: 'finance.request', role: 'USER' },
      { permission: 'finance.approve', role: 'MANAGER' }
    ],
    isDefault: true
  }
];

async function seedTemplates() {
  try {
    console.log('Seeding workflow templates...');
    
    for (const template of workflowTemplates) {
      // Check if template exists
      const existing = await prisma.workflowTemplate.findFirst({
        where: { name: template.name }
      });
      
      if (!existing) {
        await prisma.workflowTemplate.create({
          data: template
        });
        console.log(`Created template: ${template.name}`);
      } else {
        console.log(`Template already exists: ${template.name}`);
      }
    }
    
    console.log('Templates seeded successfully');
  } catch (error) {
    console.error('Error seeding templates:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedTemplates();
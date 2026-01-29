const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const workflowTemplates = [
  {
    name: 'Manufacturing Inventory Workflow',
    description: 'Standard inventory approval process for manufacturing companies',
    industry: 'MANUFACTURING',
    module: 'INVENTORY',
    steps: [
      { permission: 'inventory.request', role: 'USER' },
      { permission: 'inventory.approve', role: 'MANAGER' },
      { permission: 'inventory.final_approve', role: 'ADMIN' }
    ],
    isDefault: true
  },
  {
    name: 'IT Company Leave Workflow',
    description: 'Simple leave approval for IT companies',
    industry: 'IT',
    module: 'HR',
    steps: [
      { permission: 'leave.request', role: 'USER' },
      { permission: 'leave.approve', role: 'MANAGER' }
    ],
    isDefault: true
  },
  {
    name: 'Retail Expense Workflow',
    description: 'Multi-level expense approval for retail businesses',
    industry: 'RETAIL',
    module: 'FINANCE',
    steps: [
      { permission: 'expense.request', role: 'USER' },
      { permission: 'expense.review', role: 'MANAGER' },
      { permission: 'expense.approve', role: 'FINANCE_HEAD' }
    ],
    isDefault: true
  },
  {
    name: 'Healthcare HR Workflow',
    description: 'Comprehensive HR workflow for healthcare organizations',
    industry: 'HEALTHCARE',
    module: 'HR',
    steps: [
      { permission: 'hr.request', role: 'USER' },
      { permission: 'hr.medical_review', role: 'MEDICAL_HEAD' },
      { permission: 'hr.admin_approve', role: 'HR_ADMIN' }
    ],
    isDefault: true
  }
];

const seedWorkflowTemplates = async () => {
  try {
    console.log('Seeding workflow templates...');
    
    for (const template of workflowTemplates) {
      await prisma.workflowTemplate.upsert({
        where: {
          name: template.name
        },
        update: template,
        create: template
      });
    }
    
    console.log('Workflow templates seeded successfully');
  } catch (error) {
    console.error('Error seeding workflow templates:', error);
  }
};

module.exports = { seedWorkflowTemplates };
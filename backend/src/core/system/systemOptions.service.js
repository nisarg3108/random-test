import prisma from '../../config/db.js';

export class SystemOptionsService {
  static async getOptions(category, tenantId = null) {
    return await prisma.systemOption.findMany({
      where: {
        category,
        tenantId: tenantId || null,
        isActive: true
      },
      orderBy: { label: 'asc' }
    });
  }

  static async createOption(data) {
    return await prisma.systemOption.create({
      data
    });
  }

  static async updateOption(id, data) {
    return await prisma.systemOption.update({
      where: { id },
      data
    });
  }

  static async deleteOption(id) {
    return await prisma.systemOption.update({
      where: { id },
      data: { isActive: false }
    });
  }

  static async seedDefaultOptions() {
    const defaultOptions = [
      // Industry Types
      { category: 'INDUSTRY', key: 'SOFTWARE', value: 'SOFTWARE', label: 'Software' },
      { category: 'INDUSTRY', key: 'MANUFACTURING', value: 'MANUFACTURING', label: 'Manufacturing' },
      { category: 'INDUSTRY', key: 'SERVICE', value: 'SERVICE', label: 'Service' },
      { category: 'INDUSTRY', key: 'LOGISTICS', value: 'LOGISTICS', label: 'Logistics' },
      { category: 'INDUSTRY', key: 'HYBRID', value: 'HYBRID', label: 'Hybrid' },
      
      // Company Sizes
      { category: 'COMPANY_SIZE', key: 'STARTUP', value: 'STARTUP', label: 'Startup (1-10 employees)' },
      { category: 'COMPANY_SIZE', key: 'SME', value: 'SME', label: 'SME (11-250 employees)' },
      { category: 'COMPANY_SIZE', key: 'ENTERPRISE', value: 'ENTERPRISE', label: 'Enterprise (250+ employees)' },
      
      // Currencies
      { category: 'CURRENCY', key: 'USD', value: 'USD', label: 'US Dollar (USD)' },
      { category: 'CURRENCY', key: 'EUR', value: 'EUR', label: 'Euro (EUR)' },
      { category: 'CURRENCY', key: 'GBP', value: 'GBP', label: 'British Pound (GBP)' },
      { category: 'CURRENCY', key: 'INR', value: 'INR', label: 'Indian Rupee (INR)' },
      { category: 'CURRENCY', key: 'CAD', value: 'CAD', label: 'Canadian Dollar (CAD)' },
      
      // User Status
      { category: 'USER_STATUS', key: 'ACTIVE', value: 'ACTIVE', label: 'Active' },
      { category: 'USER_STATUS', key: 'INACTIVE', value: 'INACTIVE', label: 'Inactive' },
      { category: 'USER_STATUS', key: 'SUSPENDED', value: 'SUSPENDED', label: 'Suspended' },
      
      // User Roles
      { category: 'USER_ROLE', key: 'ADMIN', value: 'ADMIN', label: 'Administrator' },
      { category: 'USER_ROLE', key: 'MANAGER', value: 'MANAGER', label: 'Manager' },
      { category: 'USER_ROLE', key: 'USER', value: 'USER', label: 'User' }
    ];

    for (const option of defaultOptions) {
      await prisma.systemOption.upsert({
        where: {
          id: `${option.category}_${option.key}_global`
        },
        update: {},
        create: { 
          id: `${option.category}_${option.key}_global`,
          ...option, 
          tenantId: null 
        }
      });
    }
  }
}
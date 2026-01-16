import prisma from '../../config/db.js';
import { SystemOptionsService } from '../system/systemOptions.service.js';

export const seedPermissions = async () => {
  // Seed system options first
  await SystemOptionsService.seedDefaultOptions();
  
  const permissions = [
    // Inventory
    { code: 'inventory.create', label: 'Create inventory item' },
    { code: 'inventory.view', label: 'View inventory' },
    { code: 'inventory.update', label: 'Update inventory' },

    // Users
    { code: 'user.invite', label: 'Invite users' },
    { code: 'user.manage', label: 'Manage users' },
    // Departments
    { code: 'department.create', label: 'Create department' },
    { code: 'department.view', label: 'View departments' },
    { code: 'audit.view', label: 'View audit logs' },
    
    // System Options
    { code: 'system.options.manage', label: 'Manage system options' },
    { code: 'inventory.approve', label: 'Approve inventory actions' },
    { code: 'employee.create', label: 'Create employee' },
    { code: 'employee.view', label: 'View employees' },
    { code: 'leaveType.create', label: 'Create leave type' },
    { code: 'leaveType.view', label: 'View leave types' },
    { code: 'leave.request', label: 'Request leave' },
    { code: 'leave.view', label: 'View leave requests' },
    { code: 'leave.approve', label: 'Approve leave requests' },
    { code: 'employee.manage', label: 'Manage employee hierarchy' },
    { code: 'manager.dashboard', label: 'View manager dashboard' },
    { code: 'hr.dashboard', label: 'View HR dashboard' },
    //{ code: 'payroll.manage', label: 'Manage payroll' },
    //{ code: 'payroll.view', label: 'View payroll' },
  ];

  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: { code: perm.code },
      update: {},
      create: perm,
    });
  }
};

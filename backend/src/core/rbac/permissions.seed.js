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
    { code: 'expenseCategory.create', label: 'Create expense category' },
    { code: 'expenseCategory.view', label: 'View expense categories' },
{ code: 'expense.claim', label: 'Submit expense claim' },
{ code: 'expense.view', label: 'View expense claims' },
{ code: 'expense.approve', label: 'Approve expense claims' },
{ code: 'finance.dashboard', label: 'View finance dashboard' },
{ code: 'role.assign.finance', label: 'Assign FINANCE role' },
{ code: 'role.assign.admin', label: 'Assign ADMIN role' },

  // CRM
  { code: 'crm.customer.create', label: 'Create customers' },
  { code: 'crm.customer.view', label: 'View customers' },
  { code: 'crm.customer.update', label: 'Update customers' },
  { code: 'crm.customer.delete', label: 'Delete customers' },
  { code: 'crm.contact.create', label: 'Create contacts' },
  { code: 'crm.contact.view', label: 'View contacts' },
  { code: 'crm.contact.update', label: 'Update contacts' },
  { code: 'crm.contact.delete', label: 'Delete contacts' },
  { code: 'crm.lead.create', label: 'Create leads' },
  { code: 'crm.lead.view', label: 'View leads' },
  { code: 'crm.lead.update', label: 'Update leads' },
  { code: 'crm.lead.convert', label: 'Convert leads' },
  { code: 'crm.deal.create', label: 'Create deals' },
  { code: 'crm.deal.view', label: 'View deals' },
  { code: 'crm.deal.update', label: 'Update deals' },
  { code: 'crm.deal.delete', label: 'Delete deals' },
  { code: 'crm.communication.create', label: 'Create communications' },
  { code: 'crm.communication.view', label: 'View communications' },

  // Reports & Analytics
  { code: 'reports.view', label: 'View reports' },
  { code: 'reports.export', label: 'Export reports' },
  { code: 'reports.financial.view', label: 'View financial reports' },
  { code: 'reports.hr.view', label: 'View HR analytics reports' },
  { code: 'reports.inventory.view', label: 'View inventory reports' },
  { code: 'reports.custom.create', label: 'Create custom reports' },
  { code: 'reports.templates.create', label: 'Create report templates' },
  { code: 'reports.templates.view', label: 'View report templates' },

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

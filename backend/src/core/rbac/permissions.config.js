/**
 * Complete RBAC Permission and Role Definitions
 * This file defines all permissions and roles for the ERP system
 */

export const PERMISSIONS = {
  // ========== ADMIN & SYSTEM ==========
  SYSTEM: {
    MANAGE_SETTINGS: 'system.manage',
    VIEW_AUDIT: 'audit.view',
    MANAGE_OPTIONS: 'system.options.manage',
    MANAGE_TENANTS: 'tenant.manage',
  },

  // ========== USER MANAGEMENT ==========
  USER: {
    CREATE: 'user.create',
    VIEW: 'user.view',
    UPDATE: 'user.update',
    DELETE: 'user.delete',
    INVITE: 'user.invite',
    MANAGE: 'user.manage',
    ASSIGN_ROLES: 'user.assign.roles',
  },

  // ========== DEPARTMENT ==========
  DEPARTMENT: {
    CREATE: 'department.create',
    VIEW: 'department.view',
    UPDATE: 'department.update',
    DELETE: 'department.delete',
  },

  // ========== EMPLOYEE & HR ==========
  EMPLOYEE: {
    CREATE: 'employee.create',
    VIEW: 'employee.view',
    VIEW_ALL: 'employee.view.all',
    VIEW_OWN: 'employee.view.own',
    UPDATE: 'employee.update',
    DELETE: 'employee.delete',
    MANAGE: 'employee.manage',
    VIEW_SALARY: 'employee.salary.view',
    MANAGE_SALARY: 'employee.salary.manage',
  },

  // ========== ATTENDANCE ==========
  ATTENDANCE: {
    MARK_OWN: 'attendance.mark.own',
    VIEW_OWN: 'attendance.view.own',
    VIEW_ALL: 'attendance.view.all',
    MANAGE: 'attendance.manage',
    APPROVE: 'attendance.approve',
  },

  // ========== LEAVE MANAGEMENT ==========
  LEAVE: {
    REQUEST: 'leave.request',
    VIEW_OWN: 'leave.view.own',
    VIEW_ALL: 'leave.view.all',
    APPROVE: 'leave.approve',
    CANCEL: 'leave.cancel',
    MANAGE_TYPES: 'leave.types.manage',
  },

  // ========== PAYROLL ==========
  PAYROLL: {
    VIEW_OWN: 'payroll.view.own',
    VIEW_ALL: 'payroll.view.all',
    MANAGE: 'payroll.manage',
    PROCESS: 'payroll.process',
    APPROVE: 'payroll.approve',
  },

  // ========== FINANCE & ACCOUNTING ==========
  FINANCE: {
    DASHBOARD: 'finance.dashboard',
    VIEW_REPORTS: 'finance.reports.view',
    MANAGE_ACCOUNTS: 'finance.accounts.manage',
  },

  EXPENSE: {
    CLAIM: 'expense.claim',
    VIEW_OWN: 'expense.view.own',
    VIEW_ALL: 'expense.view.all',
    APPROVE: 'expense.approve',
    MANAGE_CATEGORIES: 'expenseCategory.create',
    VIEW_CATEGORIES: 'expenseCategory.view',
  },

  ACCOUNTING: {
    VIEW: 'accounting.view',
    CREATE_ENTRY: 'accounting.entry.create',
    APPROVE_ENTRY: 'accounting.entry.approve',
    VIEW_REPORTS: 'accounting.reports.view',
  },

  // ========== INVENTORY ==========
  INVENTORY: {
    CREATE: 'inventory.create',
    VIEW: 'inventory.view',
    UPDATE: 'inventory.update',
    DELETE: 'inventory.delete',
    APPROVE: 'inventory.approve',
    MANAGE_WAREHOUSE: 'warehouse.manage',
    VIEW_STOCK: 'stock.view',
    MANAGE_STOCK: 'stock.manage',
  },

  // ========== ASSETS ==========
  ASSET: {
    CREATE: 'asset.create',
    VIEW: 'asset.view',
    UPDATE: 'asset.update',
    DELETE: 'asset.delete',
    ALLOCATE: 'asset.allocate',
    MANAGE_MAINTENANCE: 'asset.maintenance.manage',
    VIEW_DEPRECIATION: 'asset.depreciation.view',
  },

  // ========== PURCHASE ==========
  PURCHASE: {
    CREATE: 'purchase.create',
    VIEW: 'purchase.view',
    UPDATE: 'purchase.update',
    APPROVE: 'purchase.approve',
    MANAGE_VENDORS: 'purchase.vendors.manage',
  },

  // ========== SALES ==========
  SALES: {
    CREATE: 'sales.create',
    VIEW: 'sales.view',
    UPDATE: 'sales.update',
    DELETE: 'sales.delete',
    APPROVE: 'sales.approve',
    MANAGE_CUSTOMERS: 'sales.customers.manage',
  },

  // ========== CRM ==========
  CRM: {
    CUSTOMER_CREATE: 'crm.customer.create',
    CUSTOMER_VIEW: 'crm.customer.view',
    CUSTOMER_UPDATE: 'crm.customer.update',
    CUSTOMER_DELETE: 'crm.customer.delete',
    LEAD_CREATE: 'crm.lead.create',
    LEAD_VIEW: 'crm.lead.view',
    LEAD_UPDATE: 'crm.lead.update',
    LEAD_CONVERT: 'crm.lead.convert',
    DEAL_CREATE: 'crm.deal.create',
    DEAL_VIEW: 'crm.deal.view',
    DEAL_UPDATE: 'crm.deal.update',
    CONTACT_CREATE: 'crm.contact.create',
    CONTACT_VIEW: 'crm.contact.view',
    COMMUNICATION_CREATE: 'crm.communication.create',
    COMMUNICATION_VIEW: 'crm.communication.view',
  },

  // ========== PROJECT MANAGEMENT ==========
  PROJECT: {
    CREATE: 'project.create',
    VIEW: 'project.view',
    UPDATE: 'project.update',
    DELETE: 'project.delete',
    ASSIGN_TASKS: 'project.tasks.assign',
    VIEW_TASKS: 'project.tasks.view',
    UPDATE_TASKS: 'project.tasks.update',
  },

  // ========== DOCUMENTS ==========
  DOCUMENT: {
    CREATE: 'document.create',
    VIEW: 'document.view',
    UPDATE: 'document.update',
    DELETE: 'document.delete',
    SHARE: 'document.share',
  },

  // ========== COMMUNICATION ==========
  COMMUNICATION: {
    SEND: 'communication.send',
    VIEW: 'communication.view',
    MANAGE_TEMPLATES: 'communication.templates.manage',
  },

  // ========== REPORTS ==========
  REPORTS: {
    VIEW: 'reports.view',
    EXPORT: 'reports.export',
    FINANCIAL_VIEW: 'reports.financial.view',
    HR_VIEW: 'reports.hr.view',
    INVENTORY_VIEW: 'reports.inventory.view',
    CUSTOM_CREATE: 'reports.custom.create',
  },

  // ========== WORKFLOW & APPROVALS ==========
  WORKFLOW: {
    CREATE: 'workflow.create',
    VIEW: 'workflow.view',
    MANAGE: 'workflow.manage',
    APPROVE: 'workflow.approve',
  },

  // ========== MANUFACTURING ==========
  MANUFACTURING: {
    CREATE: 'manufacturing.create',
    VIEW: 'manufacturing.view',
    UPDATE: 'manufacturing.update',
    MANAGE_BOM: 'manufacturing.bom.manage',
  },
};

// ========== ROLE DEFINITIONS ==========
export const ROLE_PERMISSIONS = {
  ADMIN: {
    name: 'ADMIN',
    label: 'Administrator',
    description: 'Full system access with all permissions',
    permissions: Object.values(PERMISSIONS).flatMap(module => Object.values(module)),
  },

  HR_MANAGER: {
    name: 'HR_MANAGER',
    label: 'HR Manager',
    description: 'Manages all HR operations, employee records, and payroll',
    permissions: [
      // Employee Management
      ...Object.values(PERMISSIONS.EMPLOYEE),
      // Attendance
      ...Object.values(PERMISSIONS.ATTENDANCE),
      // Leave Management
      ...Object.values(PERMISSIONS.LEAVE),
      // Payroll
      ...Object.values(PERMISSIONS.PAYROLL),
      // Department
      PERMISSIONS.DEPARTMENT.VIEW,
      PERMISSIONS.DEPARTMENT.CREATE,
      PERMISSIONS.DEPARTMENT.UPDATE,
      // Users
      PERMISSIONS.USER.VIEW,
      PERMISSIONS.USER.INVITE,
      // Reports
      PERMISSIONS.REPORTS.VIEW,
      PERMISSIONS.REPORTS.HR_VIEW,
      PERMISSIONS.REPORTS.EXPORT,
      // Documents
      PERMISSIONS.DOCUMENT.VIEW,
      PERMISSIONS.DOCUMENT.CREATE,
      // Workflow
      PERMISSIONS.WORKFLOW.VIEW,
      PERMISSIONS.WORKFLOW.APPROVE,
    ],
  },

  HR_STAFF: {
    name: 'HR_STAFF',
    label: 'HR Staff',
    description: 'HR operations without payroll and approval rights',
    permissions: [
      PERMISSIONS.EMPLOYEE.CREATE,
      PERMISSIONS.EMPLOYEE.VIEW,
      PERMISSIONS.EMPLOYEE.VIEW_ALL,
      PERMISSIONS.EMPLOYEE.UPDATE,
      PERMISSIONS.ATTENDANCE.VIEW_ALL,
      PERMISSIONS.ATTENDANCE.MANAGE,
      PERMISSIONS.LEAVE.VIEW_ALL,
      PERMISSIONS.DEPARTMENT.VIEW,
      PERMISSIONS.USER.VIEW,
      PERMISSIONS.REPORTS.VIEW,
      PERMISSIONS.REPORTS.HR_VIEW,
      PERMISSIONS.DOCUMENT.VIEW,
      PERMISSIONS.DOCUMENT.CREATE,
    ],
  },

  FINANCE_MANAGER: {
    name: 'FINANCE_MANAGER',
    label: 'Finance Manager',
    description: 'Manages all finance and accounting operations',
    permissions: [
      // Finance
      ...Object.values(PERMISSIONS.FINANCE),
      // Expense
      ...Object.values(PERMISSIONS.EXPENSE),
      // Accounting
      ...Object.values(PERMISSIONS.ACCOUNTING),
      // Payroll (view only)
      PERMISSIONS.PAYROLL.VIEW_ALL,
      PERMISSIONS.PAYROLL.APPROVE,
      // Assets
      PERMISSIONS.ASSET.VIEW,
      PERMISSIONS.ASSET.VIEW_DEPRECIATION,
      // Purchase (approval)
      PERMISSIONS.PURCHASE.VIEW,
      PERMISSIONS.PURCHASE.APPROVE,
      // Reports
      PERMISSIONS.REPORTS.VIEW,
      PERMISSIONS.REPORTS.EXPORT,
      PERMISSIONS.REPORTS.FINANCIAL_VIEW,
      // Documents
      PERMISSIONS.DOCUMENT.VIEW,
      PERMISSIONS.DOCUMENT.CREATE,
      // Workflow
      PERMISSIONS.WORKFLOW.VIEW,
      PERMISSIONS.WORKFLOW.APPROVE,
    ],
  },

  ACCOUNTANT: {
    name: 'ACCOUNTANT',
    label: 'Accountant',
    description: 'Handles accounting entries and financial records',
    permissions: [
      PERMISSIONS.FINANCE.VIEW_REPORTS,
      PERMISSIONS.EXPENSE.VIEW_ALL,
      PERMISSIONS.EXPENSE.VIEW_CATEGORIES,
      PERMISSIONS.ACCOUNTING.VIEW,
      PERMISSIONS.ACCOUNTING.CREATE_ENTRY,
      PERMISSIONS.ACCOUNTING.VIEW_REPORTS,
      PERMISSIONS.REPORTS.VIEW,
      PERMISSIONS.REPORTS.FINANCIAL_VIEW,
      PERMISSIONS.DOCUMENT.VIEW,
      PERMISSIONS.DOCUMENT.CREATE,
    ],
  },

  INVENTORY_MANAGER: {
    name: 'INVENTORY_MANAGER',
    label: 'Inventory Manager',
    description: 'Manages inventory, warehouses, and stock movements',
    permissions: [
      ...Object.values(PERMISSIONS.INVENTORY),
      PERMISSIONS.PURCHASE.CREATE,
      PERMISSIONS.PURCHASE.VIEW,
      PERMISSIONS.PURCHASE.UPDATE,
      PERMISSIONS.ASSET.VIEW,
      PERMISSIONS.REPORTS.VIEW,
      PERMISSIONS.REPORTS.INVENTORY_VIEW,
      PERMISSIONS.DOCUMENT.VIEW,
      PERMISSIONS.DOCUMENT.CREATE,
      PERMISSIONS.WORKFLOW.VIEW,
      PERMISSIONS.WORKFLOW.APPROVE,
    ],
  },

  WAREHOUSE_STAFF: {
    name: 'WAREHOUSE_STAFF',
    label: 'Warehouse Staff',
    description: 'Handles daily warehouse and inventory operations',
    permissions: [
      PERMISSIONS.INVENTORY.VIEW,
      PERMISSIONS.INVENTORY.UPDATE,
      PERMISSIONS.INVENTORY.VIEW_STOCK,
      PERMISSIONS.INVENTORY.MANAGE_STOCK,
      PERMISSIONS.PURCHASE.VIEW,
      PERMISSIONS.DOCUMENT.VIEW,
    ],
  },

  SALES_MANAGER: {
    name: 'SALES_MANAGER',
    label: 'Sales Manager',
    description: 'Manages sales operations and customer relationships',
    permissions: [
      ...Object.values(PERMISSIONS.SALES),
      ...Object.values(PERMISSIONS.CRM),
      PERMISSIONS.INVENTORY.VIEW,
      PERMISSIONS.REPORTS.VIEW,
      PERMISSIONS.REPORTS.EXPORT,
      PERMISSIONS.DOCUMENT.VIEW,
      PERMISSIONS.DOCUMENT.CREATE,
      PERMISSIONS.COMMUNICATION.SEND,
      PERMISSIONS.COMMUNICATION.VIEW,
      PERMISSIONS.WORKFLOW.VIEW,
      PERMISSIONS.WORKFLOW.APPROVE,
    ],
  },

  SALES_STAFF: {
    name: 'SALES_STAFF',
    label: 'Sales Staff',
    description: 'Handles sales orders and customer interactions',
    permissions: [
      PERMISSIONS.SALES.CREATE,
      PERMISSIONS.SALES.VIEW,
      PERMISSIONS.SALES.UPDATE,
      PERMISSIONS.CRM.CUSTOMER_VIEW,
      PERMISSIONS.CRM.CUSTOMER_UPDATE,
      PERMISSIONS.CRM.LEAD_CREATE,
      PERMISSIONS.CRM.LEAD_VIEW,
      PERMISSIONS.CRM.LEAD_UPDATE,
      PERMISSIONS.CRM.DEAL_CREATE,
      PERMISSIONS.CRM.DEAL_VIEW,
      PERMISSIONS.CRM.DEAL_UPDATE,
      PERMISSIONS.CRM.CONTACT_VIEW,
      PERMISSIONS.CRM.COMMUNICATION_CREATE,
      PERMISSIONS.CRM.COMMUNICATION_VIEW,
      PERMISSIONS.INVENTORY.VIEW,
      PERMISSIONS.DOCUMENT.VIEW,
      PERMISSIONS.COMMUNICATION.SEND,
    ],
  },

  PURCHASE_MANAGER: {
    name: 'PURCHASE_MANAGER',
    label: 'Purchase Manager',
    description: 'Manages procurement and vendor relationships',
    permissions: [
      ...Object.values(PERMISSIONS.PURCHASE),
      PERMISSIONS.INVENTORY.VIEW,
      PERMISSIONS.INVENTORY.CREATE,
      PERMISSIONS.EXPENSE.VIEW_ALL,
      PERMISSIONS.REPORTS.VIEW,
      PERMISSIONS.DOCUMENT.VIEW,
      PERMISSIONS.DOCUMENT.CREATE,
      PERMISSIONS.WORKFLOW.VIEW,
      PERMISSIONS.WORKFLOW.APPROVE,
    ],
  },

  PROJECT_MANAGER: {
    name: 'PROJECT_MANAGER',
    label: 'Project Manager',
    description: 'Manages projects and team tasks',
    permissions: [
      ...Object.values(PERMISSIONS.PROJECT),
      PERMISSIONS.EMPLOYEE.VIEW,
      PERMISSIONS.REPORTS.VIEW,
      PERMISSIONS.DOCUMENT.VIEW,
      PERMISSIONS.DOCUMENT.CREATE,
      PERMISSIONS.DOCUMENT.SHARE,
      PERMISSIONS.COMMUNICATION.SEND,
      PERMISSIONS.COMMUNICATION.VIEW,
    ],
  },

  MANAGER: {
    name: 'MANAGER',
    label: 'Manager',
    description: 'Department/team manager with approval rights',
    permissions: [
      PERMISSIONS.EMPLOYEE.VIEW,
      PERMISSIONS.ATTENDANCE.VIEW_ALL,
      PERMISSIONS.ATTENDANCE.APPROVE,
      PERMISSIONS.LEAVE.VIEW_ALL,
      PERMISSIONS.LEAVE.APPROVE,
      PERMISSIONS.EXPENSE.VIEW_ALL,
      PERMISSIONS.EXPENSE.APPROVE,
      PERMISSIONS.PROJECT.VIEW,
      PERMISSIONS.PROJECT.ASSIGN_TASKS,
      PERMISSIONS.REPORTS.VIEW,
      PERMISSIONS.DOCUMENT.VIEW,
      PERMISSIONS.DOCUMENT.CREATE,
      PERMISSIONS.WORKFLOW.VIEW,
      PERMISSIONS.WORKFLOW.APPROVE,
      PERMISSIONS.COMMUNICATION.SEND,
      PERMISSIONS.COMMUNICATION.VIEW,
    ],
  },

  EMPLOYEE: {
    name: 'EMPLOYEE',
    label: 'Employee',
    description: 'Standard employee with basic self-service access',
    permissions: [
      PERMISSIONS.EMPLOYEE.VIEW_OWN,
      PERMISSIONS.ATTENDANCE.MARK_OWN,
      PERMISSIONS.ATTENDANCE.VIEW_OWN,
      PERMISSIONS.LEAVE.REQUEST,
      PERMISSIONS.LEAVE.VIEW_OWN,
      PERMISSIONS.EXPENSE.CLAIM,
      PERMISSIONS.EXPENSE.VIEW_OWN,
      PERMISSIONS.PAYROLL.VIEW_OWN,
      PERMISSIONS.PROJECT.VIEW_TASKS,
      PERMISSIONS.PROJECT.UPDATE_TASKS,
      PERMISSIONS.DOCUMENT.VIEW,
      PERMISSIONS.COMMUNICATION.VIEW,
    ],
  },

  USER: {
    name: 'USER',
    label: 'Basic User',
    description: 'Minimal access for basic users',
    permissions: [
      PERMISSIONS.EMPLOYEE.VIEW_OWN,
      PERMISSIONS.DOCUMENT.VIEW,
    ],
  },
};

// Helper function to get all permissions as flat array
export const getAllPermissions = () => {
  return Object.values(PERMISSIONS).flatMap(module => Object.values(module));
};

// Helper to get permissions for a specific role
export const getRolePermissions = (roleName) => {
  return ROLE_PERMISSIONS[roleName]?.permissions || [];
};

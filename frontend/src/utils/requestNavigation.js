export const getRequestTargetPath = (request) => {
  const moduleKey = String(request?.workflow?.module || request?.module || '').toUpperCase();
  const actionKey = String(request?.workflow?.action || request?.action || '').toUpperCase();
  const permissionKey = String(request?.permission || '').toLowerCase();

  // Route leave requests directly to the leave request page.
  if (moduleKey === 'HR' || permissionKey.includes('leave') || actionKey.includes('LEAVE')) {
    return '/hr/leave-requests';
  }

  // Inventory item requests should land on inventory pages.
  if (moduleKey === 'INVENTORY' || actionKey.includes('ITEM') || permissionKey.includes('inventory')) {
    return '/inventory';
  }

  if (moduleKey === 'PURCHASE' || actionKey.includes('REQUISITION')) {
    return '/purchase/requisitions';
  }

  if (moduleKey === 'FINANCE') {
    if (permissionKey.includes('expense') || actionKey.includes('EXPENSE')) {
      return '/finance/expense-claims';
    }
    return '/finance/approvals';
  }

  if (moduleKey === 'PROJECTS') {
    if (actionKey.includes('TIMESHEET') || permissionKey.includes('timesheet')) {
      return '/projects/timesheet/approvals';
    }
    return '/projects';
  }

  if (moduleKey === 'ASSETS') return '/assets';
  if (moduleKey === 'SALES') return '/sales/orders';
  if (moduleKey === 'CRM') return '/crm';
  if (moduleKey === 'DOCUMENTS') return '/documents';
  if (moduleKey === 'COMMUNICATION') return '/communication/messages';

  return '/approval-dashboard';
};

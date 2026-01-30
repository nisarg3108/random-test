import prisma from '../../config/db.js';
import notificationService from '../notifications/notification.service.js';

export const createExpenseClaim = async (data, tenantId, userId) => {
  const { expenseDate, ...rest } = data;
  
  // Get employee record for the user
  const employee = await prisma.employee.findUnique({
    where: { userId },
    include: { user: true }
  });
  
  if (!employee) {
    throw new Error('Employee record not found for user');
  }
  
  const expenseClaim = await prisma.expenseClaim.create({
    data: {
      ...rest,
      expenseDate: new Date(expenseDate),
      tenantId,
      employeeId: employee.id,
      status: 'PENDING',
    },
    include: {
      category: true
    }
  });

  // Notify managers/admins about new expense claim
  try {
    const managers = await prisma.employee.findMany({
      where: {
        tenantId,
        user: { role: { in: ['MANAGER', 'ADMIN'] } }
      }
    });

    for (const manager of managers) {
      await notificationService.createNotification({
        tenantId,
        employeeId: manager.id,
        type: 'EXPENSE_CLAIM',
        title: 'New Expense Claim',
        message: `${employee.name} has submitted an expense claim for ${expenseClaim.category?.name || 'expense'} - $${expenseClaim.amount}`
      });
    }
  } catch (error) {
    console.error('Failed to create expense claim notifications:', error);
  }

  return expenseClaim;
};

export const listExpenseClaims = async (tenantId) => {
  return prisma.expenseClaim.findMany({
    where: { tenantId },
    include: {
      employee: true,
      category: true,
    },
  });
};
export const getEmployeeExpenses = async (employeeId, tenantId) => {
  return prisma.expenseClaim.findMany({
    where: { employeeId, tenantId },
    include: { category: true },
    orderBy: { createdAt: 'desc' },
  });
};

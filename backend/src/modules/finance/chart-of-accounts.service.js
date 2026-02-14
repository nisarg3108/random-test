import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

class ChartOfAccountsService {
  /**
   * Create a new account
   */
  async createAccount(data, tenantId) {
    // Validate required accountCode
    if (!data.accountCode) {
      throw new Error('Account code is required');
    }

    // Check for duplicate account code
    const existing = await prisma.chartOfAccounts.findUnique({
      where: {
        tenantId_accountCode: {
          tenantId,
          accountCode: data.accountCode
        }
      }
    });

    if (existing) {
      throw new Error('Account code already exists');
    }

    // Validate parent account if provided
    if (data.parentId) {
      const parent = await prisma.chartOfAccounts.findFirst({
        where: { id: data.parentId, tenantId }
      });
      
      if (!parent) {
        throw new Error('Parent account not found');
      }
    }

    return await prisma.chartOfAccounts.create({
      data: {
        ...data,
        tenantId
      },
      include: {
        parent: true,
        children: true
      }
    });
  }

  /**
   * Get all accounts with hierarchical structure
   */
  async getAllAccounts(tenantId, filters = {}) {
    const where = { tenantId };

    if (filters.accountType) {
      where.accountType = filters.accountType;
    }

    if (filters.category) {
      where.category = filters.category;
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.search) {
      where.OR = [
        { accountCode: { contains: filters.search, mode: 'insensitive' } },
        { accountName: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    const accounts = await prisma.chartOfAccounts.findMany({
      where,
      include: {
        parent: true,
        children: true,
        _count: {
          select: {
            journalEntries: true,
            ledgerEntries: true
          }
        }
      },
      orderBy: { accountCode: 'asc' }
    });

    return accounts;
  }

  /**
   * Get account by ID
   */
  async getAccountById(id, tenantId) {
    const account = await prisma.chartOfAccounts.findFirst({
      where: { id, tenantId },
      include: {
        parent: true,
        children: true,
        _count: {
          select: {
            journalEntries: true,
            ledgerEntries: true
          }
        }
      }
    });

    if (!account) {
      throw new Error('Account not found');
    }

    return account;
  }

  /**
   * Update account
   */
  async updateAccount(id, data, tenantId) {
    const account = await prisma.chartOfAccounts.findFirst({
      where: { id, tenantId }
    });

    if (!account) {
      throw new Error('Account not found');
    }

    // Check for duplicate code if code is being updated
    if (data.accountCode && data.accountCode !== account.accountCode) {
      const existing = await prisma.chartOfAccounts.findUnique({
        where: {
          tenantId_accountCode: {
            tenantId,
            accountCode: data.accountCode
          }
        }
      });

      if (existing) {
        throw new Error('Account code already exists');
      }
    }

    // Validate parent account if being updated
    if (data.parentId && data.parentId !== account.parentId) {
      // Prevent circular reference
      if (data.parentId === id) {
        throw new Error('Cannot set account as its own parent');
      }

      const parent = await prisma.chartOfAccounts.findFirst({
        where: { id: data.parentId, tenantId }
      });

      if (!parent) {
        throw new Error('Parent account not found');
      }
    }

    return await prisma.chartOfAccounts.update({
      where: { id },
      data,
      include: {
        parent: true,
        children: true
      }
    });
  }

  /**
   * Delete account
   */
  async deleteAccount(id, tenantId) {
    const account = await prisma.chartOfAccounts.findFirst({
      where: { id, tenantId },
      include: {
        children: true,
        _count: {
          select: {
            journalEntries: true,
            ledgerEntries: true
          }
        }
      }
    });

    if (!account) {
      throw new Error('Account not found');
    }

    // Check if account has children
    if (account.children.length > 0) {
      throw new Error('Cannot delete account with sub-accounts');
    }

    // Check if account has transactions
    if (account._count.journalEntries > 0 || account._count.ledgerEntries > 0) {
      throw new Error('Cannot delete account with transactions');
    }

    // Prevent deletion of system accounts
    if (account.isSystem) {
      throw new Error('Cannot delete system accounts');
    }

    return await prisma.chartOfAccounts.delete({
      where: { id }
    });
  }

  /**
   * Get account balance
   */
  async getAccountBalance(accountId, tenantId, filters = {}) {
    const where = {
      accountId,
      tenantId
    };

    if (filters.dateFrom || filters.dateTo) {
      where.date = {};
      if (filters.dateFrom) {
        where.date.gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        where.date.lte = new Date(filters.dateTo);
      }
    }

    const entries = await prisma.ledgerEntry.findMany({
      where,
      orderBy: { date: 'asc' }
    });

    // Calculate running balance
    let balance = 0;
    const entriesWithBalance = entries.map(entry => {
      balance = entry.balance;
      return {
        ...entry,
        runningBalance: balance
      };
    });

    // Get latest balance
    const latestEntry = entriesWithBalance[entriesWithBalance.length - 1];
    const currentBalance = latestEntry ? latestEntry.balance : 0;

    // Get totals
    const totals = await prisma.ledgerEntry.aggregate({
      where,
      _sum: {
        debit: true,
        credit: true
      }
    });

    return {
      accountId,
      currentBalance,
      totalDebits: totals._sum.debit || 0,
      totalCredits: totals._sum.credit || 0,
      entries: entriesWithBalance
    };
  }

  /**
   * Get hierarchical account structure
   */
  async getAccountHierarchy(tenantId) {
    // Get all accounts
    const accounts = await prisma.chartOfAccounts.findMany({
      where: { tenantId, isActive: true },
      orderBy: { accountCode: 'asc' }
    });

    // Build hierarchy
    const accountMap = new Map();
    accounts.forEach(account => {
      accountMap.set(account.id, { ...account, children: [] });
    });

    const rootAccounts = [];
    accountMap.forEach(account => {
      if (account.parentId) {
        const parent = accountMap.get(account.parentId);
        if (parent) {
          parent.children.push(account);
        }
      } else {
        rootAccounts.push(account);
      }
    });

    return rootAccounts;
  }

  /**
   * Initialize default chart of accounts
   */
  async initializeDefaultAccounts(tenantId) {
    const defaultAccounts = [
      // Assets
      { accountCode: '1000', accountName: 'Assets', accountType: 'ASSET', category: 'CURRENT_ASSET', normalBalance: 'DEBIT', isSystem: true },
      { accountCode: '1100', accountName: 'Cash and Cash Equivalents', accountType: 'ASSET', category: 'CURRENT_ASSET', normalBalance: 'DEBIT', parentCode: '1000' },
      { accountCode: '1200', accountName: 'Accounts Receivable', accountType: 'ASSET', category: 'CURRENT_ASSET', normalBalance: 'DEBIT', parentCode: '1000' },
      { accountCode: '1300', accountName: 'Inventory', accountType: 'ASSET', category: 'CURRENT_ASSET', normalBalance: 'DEBIT', parentCode: '1000' },
      { accountCode: '1500', accountName: 'Fixed Assets', accountType: 'ASSET', category: 'FIXED_ASSET', normalBalance: 'DEBIT', parentCode: '1000' },
      
      // Liabilities
      { accountCode: '2000', accountName: 'Liabilities', accountType: 'LIABILITY', category: 'CURRENT_LIABILITY', normalBalance: 'CREDIT', isSystem: true },
      { accountCode: '2100', accountName: 'Accounts Payable', accountType: 'LIABILITY', category: 'CURRENT_LIABILITY', normalBalance: 'CREDIT', parentCode: '2000' },
      { accountCode: '2200', accountName: 'Accrued Expenses', accountType: 'LIABILITY', category: 'CURRENT_LIABILITY', normalBalance: 'CREDIT', parentCode: '2000' },
      
      // Equity
      { accountCode: '3000', accountName: 'Equity', accountType: 'EQUITY', normalBalance: 'CREDIT', isSystem: true },
      { accountCode: '3100', accountName: 'Retained Earnings', accountType: 'EQUITY', normalBalance: 'CREDIT', parentCode: '3000' },
      
      // Revenue
      { accountCode: '4000', accountName: 'Revenue', accountType: 'REVENUE', normalBalance: 'CREDIT', isSystem: true },
      { accountCode: '4100', accountName: 'Sales Revenue', accountType: 'REVENUE', normalBalance: 'CREDIT', parentCode: '4000' },
      
      // Expenses
      { accountCode: '5000', accountName: 'Expenses', accountType: 'EXPENSE', normalBalance: 'DEBIT', isSystem: true },
      { accountCode: '5100', accountName: 'Cost of Goods Sold', accountType: 'EXPENSE', normalBalance: 'DEBIT', parentCode: '5000' },
      { accountCode: '5200', accountName: 'Operating Expenses', accountType: 'EXPENSE', normalBalance: 'DEBIT', parentCode: '5000' },
      { accountCode: '5300', accountName: 'Salaries and Wages', accountType: 'EXPENSE', normalBalance: 'DEBIT', parentCode: '5000' }
    ];

    // Create accounts in order (parents first)
    const createdAccounts = new Map();
    
    for (const accountData of defaultAccounts) {
      const { parentCode, ...data } = accountData;
      
      const createData = {
        ...data,
        tenantId
      };

      // Set parentId if parentCode exists
      if (parentCode) {
        const parent = createdAccounts.get(parentCode);
        if (parent) {
          createData.parentId = parent.id;
        }
      }

      try {
        const account = await prisma.chartOfAccounts.create({ data: createData });
        createdAccounts.set(account.accountCode, account);
      } catch (error) {
        // Skip if account already exists
        if (!error.message.includes('Unique constraint')) {
          throw error;
        }
      }
    }

    return Array.from(createdAccounts.values());
  }
}

export default new ChartOfAccountsService();

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

class JournalEntryService {
  /**
   * Create a new journal entry
   */
  async createJournalEntry(data, tenantId, createdBy) {
    // Generate entry number
    const count = await prisma.journalEntry.count({ where: { tenantId } });
    const entryNumber = `JE-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    // Validate journal entry
    this.validateJournalEntry(data);

    // Calculate totals
    const totalDebit = data.lines.reduce((sum, line) => sum + (line.debit || 0), 0);
    const totalCredit = data.lines.reduce((sum, line) => sum + (line.credit || 0), 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new Error('Journal entry must be balanced (total debits must equal total credits)');
    }

    // Create journal entry with lines
    const journalEntry = await prisma.journalEntry.create({
      data: {
        ...data,
        entryNumber,
        tenantId,
        createdBy,
        totalDebit,
        totalCredit,
        status: 'DRAFT',
        lines: {
          create: data.lines.map((line, index) => ({
            ...line,
            lineNumber: index + 1
          }))
        }
      },
      include: {
        lines: {
          include: {
            account: true
          }
        }
      }
    });

    return journalEntry;
  }

  /**
   * Validate journal entry data
   */
  validateJournalEntry(data) {
    if (!data.lines || data.lines.length < 2) {
      throw new Error('Journal entry must have at least two lines');
    }

    // Validate each line
    for (const line of data.lines) {
      if (!line.accountId) {
        throw new Error('Each line must have an account');
      }

      const hasDebit = line.debit && line.debit > 0;
      const hasCredit = line.credit && line.credit > 0;

      if (hasDebit && hasCredit) {
        throw new Error('A line cannot have both debit and credit amounts');
      }

      if (!hasDebit && !hasCredit) {
        throw new Error('Each line must have either a debit or credit amount');
      }
    }
  }

  /**
   * Get all journal entries
   */
  async getAllJournalEntries(tenantId, filters = {}) {
    const where = { tenantId };

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.referenceType) {
      where.referenceType = filters.referenceType;
    }

    if (filters.dateFrom || filters.dateTo) {
      where.entryDate = {};
      if (filters.dateFrom) {
        where.entryDate.gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        where.entryDate.lte = new Date(filters.dateTo);
      }
    }

    if (filters.search) {
      where.OR = [
        { entryNumber: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    const entries = await prisma.journalEntry.findMany({
      where,
      include: {
        lines: {
          include: {
            account: true
          }
        }
      },
      orderBy: { entryDate: 'desc' }
    });

    return entries;
  }

  /**
   * Get journal entry by ID
   */
  async getJournalEntryById(id, tenantId) {
    const entry = await prisma.journalEntry.findFirst({
      where: { id, tenantId },
      include: {
        lines: {
          include: {
            account: true
          },
          orderBy: { lineNumber: 'asc' }
        }
      }
    });

    if (!entry) {
      throw new Error('Journal entry not found');
    }

    return entry;
  }

  /**
   * Update journal entry
   */
  async updateJournalEntry(id, data, tenantId) {
    const entry = await prisma.journalEntry.findFirst({
      where: { id, tenantId }
    });

    if (!entry) {
      throw new Error('Journal entry not found');
    }

    if (entry.status === 'POSTED') {
      throw new Error('Cannot update posted journal entry');
    }

    // If lines are being updated, validate and recalculate totals
    if (data.lines) {
      this.validateJournalEntry(data);
      
      const totalDebit = data.lines.reduce((sum, line) => sum + (line.debit || 0), 0);
      const totalCredit = data.lines.reduce((sum, line) => sum + (line.credit || 0), 0);

      if (Math.abs(totalDebit - totalCredit) > 0.01) {
        throw new Error('Journal entry must be balanced');
      }

      data.totalDebit = totalDebit;
      data.totalCredit = totalCredit;

      // Delete existing lines and create new ones
      await prisma.journalEntryLine.deleteMany({
        where: { journalEntryId: id }
      });

      data.lines = {
        create: data.lines.map((line, index) => ({
          ...line,
          lineNumber: index + 1
        }))
      };
    }

    return await prisma.journalEntry.update({
      where: { id },
      data,
      include: {
        lines: {
          include: {
            account: true
          }
        }
      }
    });
  }

  /**
   * Post journal entry (approve and post to ledger)
   */
  async postJournalEntry(id, tenantId, postedBy) {
    const entry = await prisma.journalEntry.findFirst({
      where: { id, tenantId },
      include: {
        lines: {
          include: {
            account: true
          }
        }
      }
    });

    if (!entry) {
      throw new Error('Journal entry not found');
    }

    if (entry.status === 'POSTED') {
      throw new Error('Journal entry is already posted');
    }

    if (entry.status === 'REVERSED') {
      throw new Error('Cannot post reversed journal entry');
    }

    return await prisma.$transaction(async (tx) => {
      // Update journal entry status
      const postedEntry = await tx.journalEntry.update({
        where: { id },
        data: {
          status: 'POSTED',
          postedBy,
          postedAt: new Date()
        }
      });

      // Post to ledger
      for (const line of entry.lines) {
        const account = line.account;
        
        // Get current balance
        const lastEntry = await tx.ledgerEntry.findFirst({
          where: {
            accountId: line.accountId,
            tenantId
          },
          orderBy: { date: 'desc' }
        });

        const currentBalance = lastEntry ? lastEntry.balance : 0;
        
        // Calculate new balance based on normal balance
        let newBalance = currentBalance;
        if (account.normalBalance === 'DEBIT') {
          newBalance += (line.debit || 0) - (line.credit || 0);
        } else {
          newBalance += (line.credit || 0) - (line.debit || 0);
        }

        // Create ledger entry
        await tx.ledgerEntry.create({
          data: {
            tenantId,
            accountId: line.accountId,
            date: entry.entryDate,
            description: `${entry.description} (${entry.entryNumber})`,
            debit: line.debit || 0,
            credit: line.credit || 0,
            balance: newBalance,
            referenceType: 'JOURNAL_ENTRY',
            referenceId: entry.id,
            journalEntryId: entry.id
          }
        });
      }

      return postedEntry;
    });
  }

  /**
   * Reverse journal entry
   */
  async reverseJournalEntry(id, tenantId, reversedBy, reason) {
    const entry = await prisma.journalEntry.findFirst({
      where: { id, tenantId },
      include: {
        lines: {
          include: {
            account: true
          }
        }
      }
    });

    if (!entry) {
      throw new Error('Journal entry not found');
    }

    if (entry.status !== 'POSTED') {
      throw new Error('Can only reverse posted journal entries');
    }

    if (entry.reversedBy) {
      throw new Error('Journal entry is already reversed');
    }

    return await prisma.$transaction(async (tx) => {
      // Create reversing entry
      const reversingLines = entry.lines.map(line => ({
        accountId: line.accountId,
        description: `Reversal of ${line.description || entry.description}`,
        debit: line.credit || 0,
        credit: line.debit || 0,
        departmentId: line.departmentId,
        projectId: line.projectId,
        costCenter: line.costCenter
      }));

      const count = await tx.journalEntry.count({ where: { tenantId } });
      const entryNumber = `JE-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

      const reversingEntry = await tx.journalEntry.create({
        data: {
          tenantId,
          entryNumber,
          entryDate: new Date(),
          type: 'ADJUSTING',
          description: `Reversal of ${entry.entryNumber}: ${reason || 'Manual reversal'}`,
          referenceType: entry.referenceType,
          referenceId: entry.referenceId,
          status: 'POSTED',
          totalDebit: entry.totalCredit,
          totalCredit: entry.totalDebit,
          createdBy: reversedBy,
          postedBy: reversedBy,
          postedAt: new Date(),
          lines: {
            create: reversingLines.map((line, index) => ({
              ...line,
              lineNumber: index + 1
            }))
          }
        },
        include: {
          lines: {
            include: {
              account: true
            }
          }
        }
      });

      // Post reversing entry to ledger
      for (const line of reversingEntry.lines) {
        const account = line.account;
        
        const lastEntry = await tx.ledgerEntry.findFirst({
          where: {
            accountId: line.accountId,
            tenantId
          },
          orderBy: { date: 'desc' }
        });

        const currentBalance = lastEntry ? lastEntry.balance : 0;
        let newBalance = currentBalance;
        
        if (account.normalBalance === 'DEBIT') {
          newBalance += (line.debit || 0) - (line.credit || 0);
        } else {
          newBalance += (line.credit || 0) - (line.debit || 0);
        }

        await tx.ledgerEntry.create({
          data: {
            tenantId,
            accountId: line.accountId,
            date: reversingEntry.entryDate,
            description: line.description,
            debit: line.debit || 0,
            credit: line.credit || 0,
            balance: newBalance,
            referenceType: 'JOURNAL_ENTRY',
            referenceId: reversingEntry.id,
            journalEntryId: reversingEntry.id
          }
        });
      }

      // Update original entry
      await tx.journalEntry.update({
        where: { id },
        data: {
          status: 'REVERSED',
          reversedBy,
          reversedAt: new Date(),
          reversingEntryId: reversingEntry.id
        }
      });

      return reversingEntry;
    });
  }

  /**
   * Delete draft journal entry
   */
  async deleteJournalEntry(id, tenantId) {
    const entry = await prisma.journalEntry.findFirst({
      where: { id, tenantId }
    });

    if (!entry) {
      throw new Error('Journal entry not found');
    }

    if (entry.status !== 'DRAFT') {
      throw new Error('Can only delete draft journal entries');
    }

    return await prisma.journalEntry.delete({
      where: { id }
    });
  }

  /**
   * Get journal entry statistics
   */
  async getJournalStatistics(tenantId, filters = {}) {
    const where = { tenantId };

    if (filters.dateFrom || filters.dateTo) {
      where.entryDate = {};
      if (filters.dateFrom) {
        where.entryDate.gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        where.entryDate.lte = new Date(filters.dateTo);
      }
    }

    const stats = await prisma.journalEntry.groupBy({
      by: ['status', 'type'],
      where,
      _count: true,
      _sum: {
        totalDebit: true,
        totalCredit: true
      }
    });

    return stats;
  }
}

export default new JournalEntryService();

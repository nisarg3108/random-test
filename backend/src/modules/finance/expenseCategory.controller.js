import {
  createExpenseCategory,
  listExpenseCategories,
} from './expenseCategory.service.js';
import { logAudit } from '../../core/audit/audit.service.js';

export const createExpenseCategoryController = async (req, res, next) => {
  try {
    const category = await createExpenseCategory(
      req.body,
      req.user.tenantId
    );

    await logAudit({
      userId: req.user.userId,
      tenantId: req.user.tenantId,
      action: 'CREATE',
      entity: 'EXPENSE_CATEGORY',
      entityId: category.id,
    });

    res.status(201).json(category);
  } catch (err) {
    next(err);
  }
};

export const listExpenseCategoriesController = async (req, res, next) => {
  try {
    const categories = await listExpenseCategories(req.user.tenantId);
    res.json(categories);
  } catch (err) {
    next(err);
  }
};

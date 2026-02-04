import {
  createExpenseClaim,
  listExpenseClaims,
} from './expenseClaim.service.js';
import {
  getWorkflowForAction,
  createApprovalChain,
} from '../../core/workflow/workflow.engine.js';
import prisma from '../../config/db.js';
import { logAudit } from '../../core/audit/audit.service.js';

export const createExpenseClaimController = async (req, res, next) => {
  try {
    const claim = await createExpenseClaim(req.body, req.user.tenantId, req.user.userId);

    const workflow = await getWorkflowForAction(
      req.user.tenantId,
      'FINANCE',
      'EXPENSE_CLAIM'
    );

    if (workflow) {
      const workflowRequest = await prisma.workflowRequest.create({
        data: {
          tenantId: req.user.tenantId,
          module: 'FINANCE',
          action: 'EXPENSE_CLAIM',
          payload: { expenseClaimId: claim.id },
          status: 'PENDING',
          createdBy: req.user.userId,
          workflowId: workflow.id, // Link to the workflow
        },
      });

      await createApprovalChain(workflow.id, workflow.steps, {
        payload: { expenseClaimId: claim.id },
        action: 'EXPENSE_CLAIM',
        data: req.body
      });

      return res.status(202).json({
        message: 'Expense claim sent for approval',
        expenseClaimId: claim.id,
        workflowRequestId: workflowRequest.id,
      });
    }

    await logAudit({
      userId: req.user.userId,
      tenantId: req.user.tenantId,
      action: 'CREATE',
      entity: 'EXPENSE_CLAIM',
      entityId: claim.id,
    });

    res.status(201).json(claim);
  } catch (err) {
    next(err);
  }
};

export const listExpenseClaimsController = async (req, res, next) => {
  try {
    const claims = await listExpenseClaims(req.user.tenantId);
    res.json(claims);
  } catch (err) {
    next(err);
  }
};

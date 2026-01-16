import { createLeaveRequest, listLeaveRequests } from './leaveRequest.service.js';
import { getWorkflowForAction, createApprovalChain } from '../../core/workflow/workflow.engine.js';
import { logAudit } from '../../core/audit/audit.service.js';
import prisma from '../../config/db.js';

export const createLeaveRequestController = async (req, res, next) => {
  try {
    // 1️⃣ Create leave request
    const leave = await createLeaveRequest(req.body, req.user.tenantId);

    // 2️⃣ Check workflow
    const workflow = await getWorkflowForAction(
      req.user.tenantId,
      'HR',
      'LEAVE_REQUEST'
    );

    if (workflow) {
      // Save workflow request (reuse Phase 4.4 pattern)
      await prisma.workflowRequest.create({
        data: {
          tenantId: req.user.tenantId,
          module: 'HR',
          action: 'LEAVE_REQUEST',
          payload: { leaveRequestId: leave.id },
          status: 'PENDING',
          createdBy: req.user.userId,
        },
      });

      await createApprovalChain(workflow.id, workflow.steps);

      return res.status(202).json({
        message: 'Leave request sent for approval',
        leaveRequestId: leave.id,
      });
    }

    // No workflow → auto approve
    res.status(201).json(leave);
  } catch (err) {
    next(err);
  }
};

export const listLeaveRequestsController = async (req, res, next) => {
  try {
    const requests = await listLeaveRequests(req.user.tenantId);
    res.json(requests);
  } catch (err) {
    next(err);
  }
};

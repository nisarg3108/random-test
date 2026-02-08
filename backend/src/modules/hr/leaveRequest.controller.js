import { createLeaveRequest, listLeaveRequests, updateLeaveRequestStatus } from './leaveRequest.service.js';
import { getWorkflowForAction, createApprovalChain } from '../../core/workflow/workflow.engine.js';
import { logAudit } from '../../core/audit/audit.service.js';
import prisma from '../../config/db.js';

export const createLeaveRequestController = async (req, res, next) => {
  try {
    const { tenantId, userId, role } = req.user;
    
    // Log for debugging
    console.log('Creating leave request - User:', { userId, tenantId, role });
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('leaveTypeId type:', typeof req.body.leaveTypeId);
    console.log('leaveTypeId value:', req.body.leaveTypeId);
    
    // 1️⃣ Create leave request
    const leave = await createLeaveRequest(req.body, tenantId, userId);

    // 2️⃣ Check workflow
    const workflow = await getWorkflowForAction(
      tenantId,
      'HR',
      'LEAVE_REQUEST'
    );

    if (workflow) {
      // Save workflow request (reuse Phase 4.4 pattern)
      const workflowRequest = await prisma.workflowRequest.create({
        data: {
          tenantId,
          workflowId: workflow.id,
          module: 'HR',
          action: 'LEAVE_REQUEST',
          payload: { leaveRequestId: leave.id },
          status: 'PENDING',
          createdBy: userId,
        },
      });

      await createApprovalChain(workflow.id, workflow.steps, {
        leaveRequestId: leave.id
      }, workflowRequest.id);

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
    const { tenantId, userId, role } = req.user;
    const requests = await listLeaveRequests(tenantId, role === 'EMPLOYEE' ? userId : null);
    res.json(requests);
  } catch (err) {
    next(err);
  }
};

export const updateLeaveRequestController = async (req, res, next) => {
  try {
    const { tenantId } = req.user;
    const { id } = req.params;
    const { status, comment } = req.body;
    
    const leaveRequest = await updateLeaveRequestStatus(id, status, tenantId, comment);
    res.json(leaveRequest);
  } catch (err) {
    next(err);
  }
};

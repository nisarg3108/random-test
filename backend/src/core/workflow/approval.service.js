import prisma from '../../config/db.js';
import { createItem, updateItem, deleteItem } from '../../modules/inventory/inventory.service.js';

/**
 * GET PENDING APPROVALS FOR USER
 */
export const getPendingApprovals = async (tenantId, userId) => {
  // Get user permissions
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { rolePermissions: { include: { permission: true } } }
  });

  const userPermissions = user.rolePermissions.map(rp => rp.permission.code);

  return prisma.approval.findMany({
    where: {
      tenantId,
      status: 'PENDING',
      permission: { in: userPermissions }
    },
    include: {
      workflow: true,
      workflowStep: true
    },
    orderBy: { createdAt: 'desc' }
  });
};

/**
 * APPROVE REQUEST
 */
export const approveRequest = async (approvalId, userId) => {
  const approval = await prisma.approval.findUnique({
    where: { id: approvalId },
    include: {
      workflow: { include: { steps: { orderBy: { stepOrder: 'asc' } } } },
      workflowStep: true
    }
  });

  if (!approval || approval.status !== 'PENDING') {
    throw new Error('Approval not found or already processed');
  }

  // Update approval status
  await prisma.approval.update({
    where: { id: approvalId },
    data: {
      status: 'APPROVED',
      approvedBy: userId,
      approvedAt: new Date()
    }
  });

  // Check if all approvals are completed
  const pending = await prisma.approval.findMany({
    where: {
      workflowId: approval.workflowId,
      status: 'PENDING',
    },
  });

  if (pending.length === 0) {
    const request = await prisma.workflowRequest.findFirst({
      where: {
        workflowId: approval.workflowId,
        status: 'PENDING',
      },
    });

    if (request) {
      await createItem(request.payload, request.tenantId);

      await prisma.workflowRequest.update({
        where: { id: request.id },
        data: { status: 'COMPLETED' },
      });
    }

    return { message: 'Request approved and executed', executed: true };
  }

  return { message: 'Approved, waiting for next approval', executed: false };
};

/**
 * REJECT REQUEST
 */
export const rejectRequest = async (approvalId, userId, reason) => {
  const approval = await prisma.approval.findUnique({
    where: { id: approvalId },
    include: { workflow: true }
  });

  if (!approval || approval.status !== 'PENDING') {
    throw new Error('Approval not found or already processed');
  }

  // Update approval status
  await prisma.approval.update({
    where: { id: approvalId },
    data: {
      status: 'REJECTED',
      approvedBy: userId,
      approvedAt: new Date(),
      rejectionReason: reason
    }
  });

  // Mark workflow as rejected
  await prisma.workflow.update({
    where: { id: approval.workflowId },
    data: { status: 'REJECTED' }
  });

  return { message: 'Request rejected', executed: false };
};

/**
 * EXECUTE WORKFLOW ACTION
 */
const executeWorkflowAction = async (workflow, data) => {
  const { action, itemId, data: actionData } = data;

  switch (action) {
    case 'CREATE':
      await createItem(actionData, workflow.tenantId);
      break;
    case 'UPDATE':
      await updateItem(itemId, actionData, workflow.tenantId);
      break;
    case 'DELETE':
      await deleteItem(itemId, workflow.tenantId);
      break;
    default:
      throw new Error(`Unknown action: ${action}`);
  }
};
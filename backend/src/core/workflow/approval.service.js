import prisma from '../../config/db.js';
import { createItem, updateItem, deleteItem } from '../../modules/inventory/inventory.service.js';

/**
 * GET PENDING APPROVALS FOR USER
 */
export const getPendingApprovals = async (tenantId, userId) => {
  try {
    // For now, just return all pending approvals for the tenant
    // We'll add proper permission checking later
    return await prisma.approval.findMany({
      where: {
        tenantId,
        status: 'PENDING'
      },
      include: {
        workflow: true,
        workflowStep: true
      },
      orderBy: { createdAt: 'desc' }
    });
  } catch (error) {
    console.error('Error in getPendingApprovals:', error);
    return [];
  }
};

/**
 * GET USER'S OWN REQUESTS
 */
export const getUserRequests = async (tenantId, userId) => {
  try {
    return await prisma.workflowRequest.findMany({
      where: {
        tenantId,
        createdBy: userId
      },
      orderBy: { createdAt: 'desc' }
    });
  } catch (error) {
    console.error('Error in getUserRequests:', error);
    return [];
  }
};

/**
 * APPROVE REQUEST
 */
export const approveRequest = async (approvalId, userId, comment = '') => {
  try {
    const approval = await prisma.approval.findUnique({
      where: { id: approvalId },
      include: {
        workflow: true,
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
        approvedAt: new Date(),
        comment
      }
    });

    // Check if all approvals for this workflow are completed
    const pendingApprovals = await prisma.approval.findMany({
      where: {
        workflowId: approval.workflowId,
        status: 'PENDING',
      },
    });

    // If no more pending approvals, execute the workflow
    if (pendingApprovals.length === 0) {
      const request = await prisma.workflowRequest.findFirst({
        where: {
          workflowId: approval.workflowId,
          status: 'PENDING',
        },
      });

      if (request) {
        console.log('Executing workflow request:', request);
        
        // Execute the action based on the workflow
        if (request.module === 'INVENTORY' && request.action === 'CREATE') {
          try {
            const createdItem = await createItem(request.payload, request.tenantId);
            console.log('Item created successfully:', createdItem);
            
            // Mark request as completed
            await prisma.workflowRequest.update({
              where: { id: request.id },
              data: { status: 'COMPLETED' },
            });
            
            return { 
              message: 'Request approved and item created successfully', 
              executed: true,
              item: createdItem
            };
          } catch (error) {
            console.error('Error creating item:', error);
            
            // Mark request as failed
            await prisma.workflowRequest.update({
              where: { id: request.id },
              data: { status: 'FAILED' },
            });
            
            throw new Error(`Failed to create item: ${error.message}`);
          }
        }
      }
    }

    return { message: 'Approved, waiting for additional approvals', executed: false };
  } catch (error) {
    console.error('Error in approveRequest:', error);
    throw error;
  }
};

/**
 * REJECT REQUEST
 */
export const rejectRequest = async (approvalId, userId, reason) => {
  try {
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

    // Mark any related workflow request as rejected
    await prisma.workflowRequest.updateMany({
      where: {
        workflowId: approval.workflowId,
        status: 'PENDING'
      },
      data: { status: 'REJECTED' }
    });

    return { message: 'Request rejected successfully', executed: false };
  } catch (error) {
    console.error('Error in rejectRequest:', error);
    throw error;
  }
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
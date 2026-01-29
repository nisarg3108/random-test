import prisma from '../../config/db.js';
import { createItem, updateItem, deleteItem } from '../../modules/inventory/inventory.service.js';

/**
 * GET PENDING APPROVALS FOR USER
 */
export const getPendingApprovals = async (tenantId, userId) => {
  try {
    // Get user's role to determine what they can approve
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Only ADMIN and MANAGER can approve inventory items
    const canApprove = ['ADMIN', 'MANAGER'].includes(user.role);
    
    if (!canApprove) {
      return [];
    }
    
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

    // Check user permissions
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });
    
    if (!user || !['ADMIN', 'MANAGER'].includes(user.role)) {
      throw new Error('Insufficient permissions to approve');
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
      // Find the workflow request - try by workflowId first, then by matching criteria
      let request = await prisma.workflowRequest.findFirst({
        where: {
          workflowId: approval.workflowId,
          status: 'PENDING',
        },
      });

      // If not found by workflowId, try to find by module/action/tenant
      if (!request) {
        request = await prisma.workflowRequest.findFirst({
          where: {
            tenantId: approval.tenantId,
            module: approval.workflow.module,
            action: approval.workflow.action,
            status: 'PENDING',
          },
          orderBy: { createdAt: 'desc' }
        });
      }

      if (request) {
        console.log('Executing workflow request:', request.id);
        
        // Execute the action based on the workflow
        if (request.module === 'INVENTORY' && request.action === 'CREATE') {
          try {
            const createdItem = await createItem(request.payload, request.tenantId, userId);
            console.log('Item created successfully:', createdItem.id);
            
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
        
        if (request.module === 'INVENTORY' && request.action === 'UPDATE') {
          try {
            const { itemId, ...updateData } = request.payload;
            const updatedItem = await updateItem(itemId, updateData, request.tenantId, userId);
            console.log('Item updated successfully:', updatedItem.id);
            
            // Mark request as completed
            await prisma.workflowRequest.update({
              where: { id: request.id },
              data: { status: 'COMPLETED' },
            });
            
            return { 
              message: 'Request approved and item updated successfully', 
              executed: true,
              item: updatedItem
            };
          } catch (error) {
            console.error('Error updating item:', error);
            
            // Mark request as failed
            await prisma.workflowRequest.update({
              where: { id: request.id },
              data: { status: 'FAILED' },
            });
            
            throw new Error(`Failed to update item: ${error.message}`);
          }
        }
        
        if (request.module === 'INVENTORY' && request.action === 'DELETE') {
          try {
            const { itemId } = request.payload;
            const deletedItem = await deleteItem(itemId, request.tenantId, userId);
            console.log('Item deleted successfully:', itemId);
            
            // Mark request as completed
            await prisma.workflowRequest.update({
              where: { id: request.id },
              data: { status: 'COMPLETED' },
            });
            
            return { 
              message: 'Request approved and item deleted successfully', 
              executed: true,
              item: { id: itemId }
            };
          } catch (error) {
            console.error('Error deleting item:', error);
            
            // Mark request as failed
            await prisma.workflowRequest.update({
              where: { id: request.id },
              data: { status: 'FAILED' },
            });
            
            throw new Error(`Failed to delete item: ${error.message}`);
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
const executeWorkflowAction = async (workflow, data, userId = null) => {
  const { action, itemId, data: actionData } = data;

  switch (action) {
    case 'CREATE':
      await createItem(actionData, workflow.tenantId, userId);
      break;
    case 'UPDATE':
      await updateItem(itemId, actionData, workflow.tenantId, userId);
      break;
    case 'DELETE':
      await deleteItem(itemId, workflow.tenantId, userId);
      break;
    default:
      throw new Error(`Unknown action: ${action}`);
  }
};
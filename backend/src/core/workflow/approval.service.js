import prisma from '../../config/db.js';
import { createItem, updateItem, deleteItem } from '../../modules/inventory/inventory.service.js';
import notificationService from '../../modules/notifications/notification.service.js';

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
  console.log('=== APPROVE REQUEST START ===');
  console.log('Approval ID:', approvalId);
  console.log('User ID:', userId);
  console.log('Comment:', comment);
  
  try {
    // Step 1: Find approval
    console.log('Step 1: Finding approval...');
    const approval = await prisma.approval.findUnique({
      where: { id: approvalId },
      include: {
        workflow: true,
        workflowStep: true
      }
    });
    console.log('Approval found:', approval ? 'YES' : 'NO');
    console.log('Approval status:', approval?.status);

    if (!approval || approval.status !== 'PENDING') {
      throw new Error('Approval not found or already processed');
    }

    // Step 2: Check user permissions
    console.log('Step 2: Checking user permissions...');
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });
    console.log('User role:', user?.role);
    
    if (!user || !['ADMIN', 'MANAGER'].includes(user.role)) {
      throw new Error('Insufficient permissions to approve');
    }

    // Step 3: Update approval status
    console.log('Step 3: Updating approval status...');
    await prisma.approval.update({
      where: { id: approvalId },
      data: {
        status: 'APPROVED',
        approvedBy: userId,
        approvedAt: new Date(),
        comment: comment || null
      }
    });
    console.log('Approval updated successfully');

    // Step 4: Check pending approvals
    console.log('Step 4: Checking for other pending approvals...');
    const pendingApprovals = await prisma.approval.findMany({
      where: {
        workflowId: approval.workflowId,
        status: 'PENDING',
      },
    });
    console.log('Pending approvals count:', pendingApprovals.length);

    // Step 5: Execute if all approved
    if (pendingApprovals.length === 0) {
      console.log('Step 5: All approvals complete, executing workflow...');
      
      await prisma.workflow.update({
        where: { id: approval.workflowId },
        data: { status: 'COMPLETED' }
      });
      console.log('Workflow marked as COMPLETED');
      
      // Find workflow request
      console.log('Finding workflow request...');
      let request = await prisma.workflowRequest.findFirst({
        where: {
          workflowId: approval.workflowId,
          status: 'PENDING',
        },
      });
      console.log('Request found by workflowId:', request ? 'YES' : 'NO');

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
        console.log('Request found by module/action:', request ? 'YES' : 'NO');
      }

      if (request) {
        console.log('Executing action:', request.module, request.action);
        console.log('Payload:', JSON.stringify(request.payload));
        
        if (request.module === 'INVENTORY' && request.action === 'CREATE') {
          try {
            const createdItem = await createItem(request.payload, request.tenantId, userId);
            console.log('Item created:', createdItem.id);
            
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
            console.error('CREATE failed:', error.message);
            
            // Check if it's a duplicate SKU error
            if (error.message.includes('already exists')) {
              await prisma.workflowRequest.update({
                where: { id: request.id },
                data: { status: 'COMPLETED' },
              });
              
              return {
                message: 'Request approved but item already exists',
                executed: true,
                warning: error.message
              };
            }
            
            await prisma.workflowRequest.update({
              where: { id: request.id },
              data: { status: 'FAILED' },
            });
            throw new Error(`Failed to create item: ${error.message}`);
          }
        } else if (request.module === 'HR' && request.action === 'LEAVE_REQUEST') {
          try {
            const { leaveRequestId } = request.payload;
            const leaveRequest = await prisma.leaveRequest.update({
              where: { id: leaveRequestId },
              data: { status: 'APPROVED' },
              include: {
                employee: true,
                leaveType: true
              }
            });
            
            // Notify employee
            try {
              await notificationService.createNotification({
                tenantId: request.tenantId,
                employeeId: leaveRequest.employeeId,
                type: 'LEAVE_APPROVED',
                title: 'Leave Request Approved',
                message: `Your ${leaveRequest.leaveType.name} leave request has been approved`
              });
            } catch (error) {
              console.error('Failed to create leave approval notification:', error);
            }
            
            await prisma.workflowRequest.update({
              where: { id: request.id },
              data: { status: 'COMPLETED' },
            });
            
            return { 
              message: 'Leave request approved successfully', 
              executed: true
            };
          } catch (error) {
            console.error('LEAVE_REQUEST approval failed:', error.message);
            await prisma.workflowRequest.update({
              where: { id: request.id },
              data: { status: 'FAILED' },
            });
            throw new Error(`Failed to approve leave request: ${error.message}`);
          }
        } else if (request.module === 'FINANCE' && request.action === 'EXPENSE_CLAIM') {
          try {
            const { expenseClaimId } = request.payload;
            const expenseClaim = await prisma.expenseClaim.update({
              where: { id: expenseClaimId },
              data: { status: 'APPROVED' },
              include: {
                employee: true,
                category: true
              }
            });
            
            // Notify employee
            try {
              await notificationService.createNotification({
                tenantId: request.tenantId,
                employeeId: expenseClaim.employeeId,
                type: 'EXPENSE_APPROVED',
                title: 'Expense Claim Approved',
                message: `Your expense claim for ${expenseClaim.category?.name || 'expense'} ($${expenseClaim.amount}) has been approved`
              });
            } catch (error) {
              console.error('Failed to create expense approval notification:', error);
            }
            
            await prisma.workflowRequest.update({
              where: { id: request.id },
              data: { status: 'COMPLETED' },
            });
            
            return { 
              message: 'Expense claim approved successfully', 
              executed: true
            };
          } catch (error) {
            console.error('EXPENSE_CLAIM approval failed:', error.message);
            await prisma.workflowRequest.update({
              where: { id: request.id },
              data: { status: 'FAILED' },
            });
            throw new Error(`Failed to approve expense claim: ${error.message}`);
          }
        }
      } else {
        console.log('No workflow request found to execute');
      }
    }

    console.log('=== APPROVE REQUEST SUCCESS ===');
    return { message: 'Approved, waiting for additional approvals', executed: false };
  } catch (error) {
    console.error('=== APPROVE REQUEST ERROR ===');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
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
    const updateData = {
      status: 'REJECTED'
    };
    
    if (reason) updateData.rejectionReason = reason;
    
    try {
      updateData.approvedBy = userId;
      updateData.approvedAt = new Date();
    } catch (e) {
      console.log('approvedBy/approvedAt fields may not exist in schema');
    }
    
    await prisma.approval.update({
      where: { id: approvalId },
      data: updateData
    });

    // Mark workflow as rejected
    await prisma.workflow.update({
      where: { id: approval.workflowId },
      data: { status: 'REJECTED' }
    });

    // Mark any related workflow request as rejected
    const workflowRequests = await prisma.workflowRequest.findMany({
      where: {
        workflowId: approval.workflowId,
        status: 'PENDING'
      }
    });

    for (const req of workflowRequests) {
      await prisma.workflowRequest.update({
        where: { id: req.id },
        data: { status: 'REJECTED' }
      });

      // If it's a leave request, update the leave request status
      if (req.module === 'HR' && req.action === 'LEAVE_REQUEST') {
        const { leaveRequestId } = req.payload;
        const leaveRequest = await prisma.leaveRequest.update({
          where: { id: leaveRequestId },
          data: { status: 'REJECTED' },
          include: {
            employee: true,
            leaveType: true
          }
        });
        
        // Notify employee
        try {
          await notificationService.createNotification({
            tenantId: req.tenantId,
            employeeId: leaveRequest.employeeId,
            type: 'LEAVE_REJECTED',
            title: 'Leave Request Rejected',
            message: `Your ${leaveRequest.leaveType.name} leave request has been rejected${reason ? `: ${reason}` : ''}`
          });
        } catch (error) {
          console.error('Failed to create leave rejection notification:', error);
        }
      }
      
      // If it's an expense claim, update the expense claim status
      if (req.module === 'FINANCE' && req.action === 'EXPENSE_CLAIM') {
        const { expenseClaimId } = req.payload;
        const expenseClaim = await prisma.expenseClaim.update({
          where: { id: expenseClaimId },
          data: { status: 'REJECTED' },
          include: {
            employee: true,
            category: true
          }
        });
        
        // Notify employee
        try {
          await notificationService.createNotification({
            tenantId: req.tenantId,
            employeeId: expenseClaim.employeeId,
            type: 'EXPENSE_REJECTED',
            title: 'Expense Claim Rejected',
            message: `Your expense claim for ${expenseClaim.category?.name || 'expense'} ($${expenseClaim.amount}) has been rejected${reason ? `: ${reason}` : ''}`
          });
        } catch (error) {
          console.error('Failed to create expense rejection notification:', error);
        }
      }
    }

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
      throw new Error(`Unknown workflow action: ${action}`);
  }
};
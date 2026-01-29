const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class DynamicWorkflowEngine {
  
  // Process request based on company's workflow configuration
  async processRequest(tenantId, module, action, payload, userId) {
    try {
      // Get company configuration
      const config = await prisma.companyConfig.findUnique({
        where: { tenantId }
      });

      if (!config) {
        throw new Error('Company configuration not found');
      }

      // Check if module is enabled
      if (!config.enabledModules.includes(module)) {
        throw new Error(`Module ${module} is not enabled for this company`);
      }

      // Get workflow for this module and action
      const workflow = await prisma.workflow.findFirst({
        where: {
          tenantId,
          module,
          action,
          status: 'ACTIVE'
        },
        include: {
          steps: {
            orderBy: { stepOrder: 'asc' }
          }
        }
      });

      if (!workflow) {
        // No workflow defined, process directly
        return await this.processDirectly(tenantId, module, action, payload, userId);
      }

      // Create workflow request
      const workflowRequest = await prisma.workflowRequest.create({
        data: {
          tenantId,
          workflowId: workflow.id,
          module,
          action,
          payload,
          status: 'PENDING',
          createdBy: userId,
          requestedBy: userId
        }
      });

      // Create approval records for each step
      for (const step of workflow.steps) {
        await prisma.approval.create({
          data: {
            workflowId: workflow.id,
            workflowStepId: step.id,
            stepOrder: step.stepOrder,
            permission: step.permission,
            data: payload,
            tenantId,
            status: 'PENDING'
          }
        });
      }

      return {
        success: true,
        message: 'Request submitted for approval',
        workflowRequestId: workflowRequest.id,
        requiresApproval: true
      };

    } catch (error) {
      throw error;
    }
  }

  // Process request directly without workflow
  async processDirectly(tenantId, module, action, payload, userId) {
    try {
      let result;

      switch (module) {
        case 'INVENTORY':
          result = await this.processInventoryAction(tenantId, action, payload, userId);
          break;
        case 'HR':
          result = await this.processHRAction(tenantId, action, payload, userId);
          break;
        case 'FINANCE':
          result = await this.processFinanceAction(tenantId, action, payload, userId);
          break;
        default:
          throw new Error(`Unknown module: ${module}`);
      }

      return {
        success: true,
        message: 'Request processed successfully',
        data: result,
        requiresApproval: false
      };

    } catch (error) {
      throw error;
    }
  }

  // Process inventory actions
  async processInventoryAction(tenantId, action, payload, userId) {
    switch (action) {
      case 'CREATE':
        return await prisma.item.create({
          data: {
            ...payload,
            tenantId
          }
        });
      case 'UPDATE':
        return await prisma.item.update({
          where: { id: payload.id },
          data: payload
        });
      default:
        throw new Error(`Unknown inventory action: ${action}`);
    }
  }

  // Process HR actions
  async processHRAction(tenantId, action, payload, userId) {
    switch (action) {
      case 'LEAVE_REQUEST':
        return await prisma.leaveRequest.create({
          data: {
            ...payload,
            tenantId,
            status: 'APPROVED' // Direct approval
          }
        });
      case 'EXPENSE_CLAIM':
        return await prisma.expenseClaim.create({
          data: {
            ...payload,
            tenantId,
            status: 'APPROVED'
          }
        });
      default:
        throw new Error(`Unknown HR action: ${action}`);
    }
  }

  // Process finance actions
  async processFinanceAction(tenantId, action, payload, userId) {
    switch (action) {
      case 'EXPENSE_APPROVE':
        return await prisma.expenseClaim.update({
          where: { id: payload.id },
          data: { status: 'APPROVED' }
        });
      default:
        throw new Error(`Unknown finance action: ${action}`);
    }
  }

  // Approve workflow step
  async approveStep(approvalId, userId, comment) {
    try {
      const approval = await prisma.approval.findUnique({
        where: { id: approvalId },
        include: {
          workflow: {
            include: {
              steps: {
                orderBy: { stepOrder: 'asc' }
              }
            }
          }
        }
      });

      if (!approval) {
        throw new Error('Approval not found');
      }

      // Update approval
      await prisma.approval.update({
        where: { id: approvalId },
        data: {
          status: 'APPROVED',
          approvedBy: userId,
          approvedAt: new Date(),
          comment
        }
      });

      // Check if this is the last step
      const isLastStep = approval.stepOrder === approval.workflow.steps.length;

      if (isLastStep) {
        // Process the original request
        await this.processDirectly(
          approval.tenantId,
          approval.workflow.module,
          approval.workflow.action,
          approval.data,
          approval.workflow.createdBy
        );

        // Update workflow request status
        await prisma.workflowRequest.updateMany({
          where: { workflowId: approval.workflowId },
          data: { status: 'COMPLETED' }
        });
      }

      return {
        success: true,
        message: isLastStep ? 'Request completed successfully' : 'Step approved, waiting for next approval',
        completed: isLastStep
      };

    } catch (error) {
      throw error;
    }
  }

  // Reject workflow step
  async rejectStep(approvalId, userId, reason) {
    try {
      await prisma.approval.update({
        where: { id: approvalId },
        data: {
          status: 'REJECTED',
          approvedBy: userId,
          approvedAt: new Date(),
          rejectionReason: reason
        }
      });

      // Update workflow request status
      const approval = await prisma.approval.findUnique({
        where: { id: approvalId }
      });

      await prisma.workflowRequest.updateMany({
        where: { workflowId: approval.workflowId },
        data: { status: 'REJECTED' }
      });

      return {
        success: true,
        message: 'Request rejected',
        completed: true
      };

    } catch (error) {
      throw error;
    }
  }

  // Get pending approvals for user
  async getPendingApprovals(tenantId, userId) {
    try {
      // Get user roles and permissions
      const userRoles = await prisma.userRole.findMany({
        where: { userId },
        include: {
          role: {
            include: {
              permissions: {
                include: {
                  permission: true
                }
              }
            }
          }
        }
      });

      const userPermissions = userRoles.flatMap(ur => 
        ur.role.permissions.map(rp => rp.permission.code)
      );

      // Get pending approvals that match user permissions
      const approvals = await prisma.approval.findMany({
        where: {
          tenantId,
          status: 'PENDING',
          permission: {
            in: userPermissions
          }
        },
        include: {
          workflow: true,
          workflowStep: true
        },
        orderBy: { createdAt: 'desc' }
      });

      return approvals;

    } catch (error) {
      throw error;
    }
  }
}

module.exports = new DynamicWorkflowEngine();
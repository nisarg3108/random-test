import {
  createItem,
  listItems,
  updateItem,
  deleteItem,
} from './inventory.service.js';
import prisma from '../../config/db.js';

import {
  getWorkflowForAction,
  createApprovalChain,
} from '../../core/workflow/workflow.engine.js';

/**
 * CREATE INVENTORY ITEM
 * Workflow-aware
 */
export const createItemController = async (req, res, next) => {
  try {
    console.log('DEBUG → tenantId:', req.user.tenantId);
console.log('DEBUG → module:', 'INVENTORY');
console.log('DEBUG → action:', 'CREATE');

    // 1️⃣ Check if workflow exists
    const workflow = await getWorkflowForAction(
      req.user.tenantId,
      'INVENTORY',
      'CREATE'
    );

    console.log('WORKFLOW FOUND:', workflow?.id);

    // 2️⃣ If workflow exists → pause creation
    if (workflow) {
      if (!workflow.steps || workflow.steps.length === 0) {
        throw new Error('Workflow has no steps configured');
      }

      const request = await prisma.workflowRequest.create({
        data: {
          tenantId: req.user.tenantId,
          module: 'INVENTORY',
          action: 'CREATE',
          payload: req.body,
          status: 'PENDING',
          createdBy: req.user.userId,
        },
      });

      await createApprovalChain(workflow.id, workflow.steps, {
        action: 'CREATE',
        data: req.body
      });

      return res.status(202).json({
        message: 'Approval required',
        requestId: request.id,
      });
    }

    // 3️⃣ No workflow → create immediately
    const item = await createItem(req.body, req.user.tenantId);
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
};

/**
 * LIST INVENTORY ITEMS
 */
export const listItemsController = async (req, res, next) => {
  try {
    const items = await listItems(req.user.tenantId);
    res.json(items);
  } catch (err) {
    next(err);
  }
};

/**
 * UPDATE INVENTORY ITEM
 * Workflow-aware
 */
export const updateItemController = async (req, res, next) => {
  try {
    const workflow = await getWorkflowForAction(
      req.user.tenantId,
      'INVENTORY',
      'UPDATE'
    );

    if (workflow) {
      if (!workflow.steps || workflow.steps.length === 0) {
        throw new Error('Workflow has no steps configured');
      }

      await createApprovalChain(workflow.id, workflow.steps, {
        action: 'UPDATE',
        itemId: req.params.id,
        data: req.body
      });

      return res.status(202).json({
        message: 'Update approval required',
        workflowId: workflow.id,
      });
    }

    const { id } = req.params;
    const item = await updateItem(id, req.body, req.user.tenantId);
    res.json(item);
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE INVENTORY ITEM
 * Workflow-aware
 */
export const deleteItemController = async (req, res, next) => {
  try {
    const workflow = await getWorkflowForAction(
      req.user.tenantId,
      'INVENTORY',
      'DELETE'
    );

    if (workflow) {
      if (!workflow.steps || workflow.steps.length === 0) {
        throw new Error('Workflow has no steps configured');
      }

      await createApprovalChain(workflow.id, workflow.steps, {
        action: 'DELETE',
        itemId: req.params.id
      });

      return res.status(202).json({
        message: 'Delete approval required',
        workflowId: workflow.id,
      });
    }

    const { id } = req.params;
    await deleteItem(id, req.user.tenantId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

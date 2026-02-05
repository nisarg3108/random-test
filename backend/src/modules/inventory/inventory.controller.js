import {
  createItem,
  listItems,
  getItem,
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
    console.log('DEBUG → Creating inventory item:', req.body);
    console.log('DEBUG → tenantId:', req.user.tenantId);
    console.log('DEBUG → userId:', req.user.userId);

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
        console.log('Workflow has no steps, proceeding with direct creation');
        // If workflow exists but has no steps, create directly
        const item = await createItem(req.body, req.user.tenantId, req.user.userId);
        return res.status(201).json(item);
      }

      console.log('Creating workflow request for approval');
      const request = await prisma.workflowRequest.create({
        data: {
          tenantId: req.user.tenantId,
          workflowId: workflow.id, // Link to workflow
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
      }, request.id);

      return res.status(202).json({
        message: 'Approval required',
        requestId: request.id,
      });
    }

    // 3️⃣ No workflow → create immediately
    console.log('No workflow found, creating item directly');
    const item = await createItem(req.body, req.user.tenantId, req.user.userId);
    console.log('Item created successfully:', item.id);
    res.status(201).json(item);
  } catch (err) {
    console.error('Error creating inventory item:', err);
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
 * GET SINGLE INVENTORY ITEM
 */
export const getItemController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const item = await getItem(id, req.user.tenantId);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    res.json(item);
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
    console.log('DEBUG → Updating inventory item:', req.params.id, req.body);
    
    const workflow = await getWorkflowForAction(
      req.user.tenantId,
      'INVENTORY',
      'UPDATE'
    );

    if (workflow) {
      if (!workflow.steps || workflow.steps.length === 0) {
        console.log('Workflow has no steps, proceeding with direct update');
        // If workflow exists but has no steps, update directly
        const { id } = req.params;
        const item = await updateItem(id, req.body, req.user.tenantId, req.user.userId);
        return res.json(item);
      }

      const request = await prisma.workflowRequest.create({
        data: {
          tenantId: req.user.tenantId,
          workflowId: workflow.id,
          module: 'INVENTORY',
          action: 'UPDATE',
          payload: { itemId: req.params.id, data: req.body },
          status: 'PENDING',
          createdBy: req.user.userId,
        },
      });

      await createApprovalChain(workflow.id, workflow.steps, {
        action: 'UPDATE',
        itemId: req.params.id,
        data: req.body
      }, request.id);

      return res.status(202).json({
        message: 'Update approval required',
        requestId: request.id,
      });
    }

    const { id } = req.params;
    const item = await updateItem(id, req.body, req.user.tenantId, req.user.userId);
    console.log('Item updated successfully:', item.id);
    res.json(item);
  } catch (err) {
    console.error('Error updating inventory item:', err);
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

      const request = await prisma.workflowRequest.create({
        data: {
          tenantId: req.user.tenantId,
          workflowId: workflow.id,
          module: 'INVENTORY',
          action: 'DELETE',
          payload: { itemId: req.params.id },
          status: 'PENDING',
          createdBy: req.user.userId,
        },
      });

      await createApprovalChain(workflow.id, workflow.steps, {
        action: 'DELETE',
        itemId: req.params.id
      }, request.id);

      return res.status(202).json({
        message: 'Delete approval required',
        requestId: request.id,
      });
    }

    const { id } = req.params;
    await deleteItem(id, req.user.tenantId, req.user.userId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

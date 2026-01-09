import { createItem, listItems, updateItem, deleteItem } from './inventory.service.js';
import { getWorkflowForAction } from '../../core/workflow/workflow.service.js';

export const createItemController = async (req, res, next) => {
  try {
    const workflow = await getWorkflowForAction(
      req.user.tenantId,
      'INVENTORY',
      'CREATE'
    );

    if (workflow) {
      return res.status(202).json({
        message: 'Approval required',
        workflowId: workflow.id,
      });
    }

    const item = await createItem(req.body, req.user.tenantId);
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
};

export const listItemsController = async (req, res, next) => {
  try {
    const items = await listItems(req.user.tenantId);
    res.json(items);
  } catch (err) {
    next(err);
  }
};

export const updateItemController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const item = await updateItem(id, req.body, req.user.tenantId);
    res.json(item);
  } catch (err) {
    next(err);
  }
};

export const deleteItemController = async (req, res, next) => {
  try {
    const { id } = req.params;
    await deleteItem(id, req.user.tenantId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

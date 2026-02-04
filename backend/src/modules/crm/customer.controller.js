import {
  createCustomer,
  listCustomers,
  getCustomer,
  updateCustomer,
  deleteCustomer
} from './customer.service.js';
import { logAudit } from '../../core/audit/audit.service.js';

export const createCustomerController = async (req, res, next) => {
  try {
    const customer = await createCustomer(req.body, req.user.tenantId);

    await logAudit({
      userId: req.user.userId,
      tenantId: req.user.tenantId,
      action: 'CREATE',
      entity: 'CUSTOMER',
      entityId: customer.id
    });

    res.status(201).json(customer);
  } catch (err) {
    next(err);
  }
};

export const listCustomersController = async (req, res, next) => {
  try {
    const customers = await listCustomers(req.user.tenantId);
    res.json(customers);
  } catch (err) {
    next(err);
  }
};

export const getCustomerController = async (req, res, next) => {
  try {
    const customer = await getCustomer(req.params.id, req.user.tenantId);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    res.json(customer);
  } catch (err) {
    next(err);
  }
};

export const updateCustomerController = async (req, res, next) => {
  try {
    const customer = await updateCustomer(req.params.id, req.body, req.user.tenantId);

    await logAudit({
      userId: req.user.userId,
      tenantId: req.user.tenantId,
      action: 'UPDATE',
      entity: 'CUSTOMER',
      entityId: customer.id
    });

    res.json(customer);
  } catch (err) {
    next(err);
  }
};

export const deleteCustomerController = async (req, res, next) => {
  try {
    await deleteCustomer(req.params.id, req.user.tenantId);

    await logAudit({
      userId: req.user.userId,
      tenantId: req.user.tenantId,
      action: 'DELETE',
      entity: 'CUSTOMER',
      entityId: req.params.id
    });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

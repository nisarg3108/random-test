import { createEmployee, listEmployees, assignManager } from './employee.service.js';
import { logAudit } from '../../core/audit/audit.service.js';

export const createEmployeeController = async (req, res, next) => {
  try {
    const employee = await createEmployee(req.body, req.user.tenantId);

    await logAudit({
      userId: req.user.userId,
      tenantId: req.user.tenantId,
      action: 'CREATE',
      entity: 'EMPLOYEE',
      entityId: employee.id,
    });

    res.status(201).json(employee);
  } catch (err) {
    next(err);
  }
};

export const listEmployeesController = async (req, res, next) => {
  try {
    const employees = await listEmployees(req.user.tenantId);
    res.json(employees);
  } catch (err) {
    next(err);
  }
};
export const assignManagerController = async (req, res, next) => {
  try {
    const { employeeId, managerId } = req.body;

    const employee = await assignManager(
      employeeId,
      managerId,
      req.user.tenantId
    );

    await logAudit({
      userId: req.user.userId,
      tenantId: req.user.tenantId,
      action: 'ASSIGN_MANAGER',
      entity: 'EMPLOYEE',
      entityId: employee.id,
      meta: { managerId },
    });

    res.json(employee);
  } catch (err) {
    next(err);
  }
};

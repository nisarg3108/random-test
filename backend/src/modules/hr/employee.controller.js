import { createEmployee, listEmployees, assignManager, getEmployeeByUserId } from './employee.service.js';
import { logAudit } from '../../core/audit/audit.service.js';

export const createEmployeeController = async (req, res, next) => {
  try {
    const result = await createEmployee(req.body, req.user.tenantId);

    await logAudit({
      userId: req.user.userId,
      tenantId: req.user.tenantId,
      action: 'CREATE',
      entity: 'EMPLOYEE',
      entityId: result.employee.id,
    });

    res.status(201).json({
      employee: result.employee,
      message: `Employee created successfully. Default password: ${result.defaultPassword}`
    });
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

export const getMyProfileController = async (req, res, next) => {
  try {
    const { userId, tenantId, role } = req.user;
    
    if (role !== 'EMPLOYEE') {
      return res.status(403).json({ error: 'Access denied. Employee role required.' });
    }

    const employee = await getEmployeeByUserId(userId, tenantId);
    if (!employee) {
      return res.status(404).json({ error: 'Employee profile not found' });
    }

    res.json(employee);
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

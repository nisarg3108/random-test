import { createEmployee, listEmployees, assignManager, getEmployeeByUserId } from './employee.service.js';
import { logAudit } from '../../core/audit/audit.service.js';
import prisma from '../../config/db.js';

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
    const { userId, tenantId } = req.user;

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

export const updateEmployeeController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const employee = await prisma.employee.update({
      where: { id, tenantId: req.user.tenantId },
      data: req.body
    });

    await logAudit({
      userId: req.user.userId,
      tenantId: req.user.tenantId,
      action: 'UPDATE',
      entity: 'EMPLOYEE',
      entityId: employee.id,
    });

    res.json(employee);
  } catch (err) {
    next(err);
  }
};

export const deleteEmployeeController = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    await logAudit({
      userId: req.user.userId,
      tenantId: req.user.tenantId,
      action: 'DELETE',
      entity: 'EMPLOYEE',
      entityId: id,
    });

    await prisma.employee.delete({
      where: { id, tenantId: req.user.tenantId }
    });
    
    res.json({ message: 'Employee deleted successfully' });
  } catch (err) {
    next(err);
  }
};


import {
  createDepartment,
  listDepartments,
  updateDepartment,
  deleteDepartment,
} from './department.service.js';
import { logCreate, logUpdate, logDelete } from '../audit/audit.helper.js';



export const listDepartmentsController = async (req, res, next) => {
  try {
    const depts = await listDepartments(req.user.tenantId);
    res.json(depts);
  } catch (err) {
    next(err);
  }
};

export const createDepartmentController = async (req, res, next) => {
  try {
    console.log('Creating department with user:', req.user);
    const dept = await createDepartment(req.body, req.user.tenantId);
    console.log('Department created:', dept);
    
    // Log audit using helper
    console.log('Calling audit log...');
    const auditResult = await logCreate(req, 'DEPARTMENT', dept);
    console.log('Audit log result:', auditResult);

    res.status(201).json(dept);
  } catch (err) {
    console.error('Error in createDepartmentController:', err);
    next(err);
  }
};

export const updateDepartmentController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const dept = await updateDepartment(id, req.body, req.user.tenantId);
    
    await logUpdate(req, 'DEPARTMENT', dept);
    res.json(dept);
  } catch (err) {
    console.error('Error in updateDepartmentController:', err);
    next(err);
  }
};

export const deleteDepartmentController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const dept = await deleteDepartment(id, req.user.tenantId);
    
    await logDelete(req, 'DEPARTMENT', { id });
    res.json({ message: 'Department deleted successfully' });
  } catch (err) {
    console.error('Error in deleteDepartmentController:', err);
    next(err);
  }
};
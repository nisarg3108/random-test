import {
  createDepartment,
  listDepartments,
} from './department.service.js';
import { logAudit } from '../audit/audit.service.js';



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
    const dept = await createDepartment(req.body, req.user.tenantId);
    console.log('Department created:', dept);

    try {
      await logAudit({
        userId: req.user.userId,
        tenantId: req.user.tenantId,
        action: 'CREATE',
        entity: 'DEPARTMENT',
        entityId: dept.id,
        meta: { name: dept.name },
      });
      console.log('Audit log created successfully');
    } catch (auditError) {
      console.error('Audit log error:', auditError);
    }

    res.status(201).json(dept);
  } catch (err) {
    next(err);
  }
};
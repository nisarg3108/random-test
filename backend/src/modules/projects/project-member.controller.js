import {
  addProjectMember,
  listProjectMembers,
  getProjectMember,
  updateProjectMember,
  removeProjectMember,
  checkMemberAvailability,
  getEmployeeProjects,
  getProjectTeamCapacity,
  bulkAddProjectMembers,
} from './project-member.service.js';
import { logAudit } from '../../core/audit/audit.service.js';

// ============================================
// PROJECT MEMBER CONTROLLERS
// ============================================

export const addProjectMemberController = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const member = await addProjectMember(projectId, req.body, req.user.tenantId);

    await logAudit({
      userId: req.user.userId,
      tenantId: req.user.tenantId,
      action: 'CREATE',
      entity: 'PROJECT_MEMBER',
      entityId: member.id,
    });

    res.status(201).json(member);
  } catch (err) {
    next(err);
  }
};

export const listProjectMembersController = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const filters = {
      status: req.query.status,
      role: req.query.role,
    };

    const members = await listProjectMembers(projectId, req.user.tenantId, filters);
    res.json(members);
  } catch (err) {
    next(err);
  }
};

export const getProjectMemberController = async (req, res, next) => {
  try {
    const { memberId } = req.params;
    const member = await getProjectMember(memberId, req.user.tenantId);
    res.json(member);
  } catch (err) {
    next(err);
  }
};

export const updateProjectMemberController = async (req, res, next) => {
  try {
    const { memberId } = req.params;
    const member = await updateProjectMember(memberId, req.body, req.user.tenantId);

    await logAudit({
      userId: req.user.userId,
      tenantId: req.user.tenantId,
      action: 'UPDATE',
      entity: 'PROJECT_MEMBER',
      entityId: member.id,
    });

    res.json(member);
  } catch (err) {
    next(err);
  }
};

export const removeProjectMemberController = async (req, res, next) => {
  try {
    const { memberId } = req.params;
    const member = await removeProjectMember(memberId, req.user.tenantId);

    await logAudit({
      userId: req.user.userId,
      tenantId: req.user.tenantId,
      action: 'DELETE',
      entity: 'PROJECT_MEMBER',
      entityId: memberId,
    });

    res.json(member);
  } catch (err) {
    next(err);
  }
};

export const checkMemberAvailabilityController = async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    const { startDate, endDate } = req.query;

    if (!startDate) {
      return res.status(400).json({ error: 'startDate is required' });
    }

    const availability = await checkMemberAvailability(
      employeeId,
      startDate,
      endDate,
      req.user.tenantId
    );

    res.json(availability);
  } catch (err) {
    next(err);
  }
};

export const getEmployeeProjectsController = async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    const filters = {
      status: req.query.status,
    };

    const projects = await getEmployeeProjects(employeeId, req.user.tenantId, filters);
    res.json(projects);
  } catch (err) {
    next(err);
  }
};

export const getProjectTeamCapacityController = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const capacity = await getProjectTeamCapacity(projectId, req.user.tenantId);
    res.json(capacity);
  } catch (err) {
    next(err);
  }
};

export const bulkAddProjectMembersController = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { members } = req.body;

    if (!Array.isArray(members) || members.length === 0) {
      return res.status(400).json({ error: 'members array is required' });
    }

    const results = await bulkAddProjectMembers(projectId, members, req.user.tenantId);

    await logAudit({
      userId: req.user.userId,
      tenantId: req.user.tenantId,
      action: 'BULK_CREATE',
      entity: 'PROJECT_MEMBER',
      entityId: projectId,
      details: { successful: results.successful.length, failed: results.failed.length },
    });

    res.status(201).json(results);
  } catch (err) {
    next(err);
  }
};

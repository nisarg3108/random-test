import prisma from '../../config/db.js';

// ============================================
// PROJECT MEMBER MANAGEMENT
// ============================================

/**
 * Add a member to a project
 */
export const addProjectMember = async (projectId, memberData, tenantId) => {
  // Verify project exists
  const project = await prisma.project.findFirst({
    where: { id: projectId, tenantId },
  });

  if (!project) {
    throw new Error('Project not found');
  }

  // Check if member already exists
  const existing = await prisma.projectMember.findFirst({
    where: {
      projectId,
      employeeId: memberData.employeeId,
      tenantId,
      status: { not: 'INACTIVE' },
    },
  });

  if (existing) {
    throw new Error('Employee is already a member of this project');
  }

  // Check allocation capacity
  const allocationCheck = await checkMemberAvailability(
    memberData.employeeId,
    memberData.startDate,
    memberData.endDate,
    tenantId
  );

  if (!allocationCheck.available && memberData.allocationPercent > allocationCheck.availablePercent) {
    throw new Error(
      `Employee is overallocated. Current utilization: ${allocationCheck.currentUtilization}%. ` +
      `Available capacity: ${allocationCheck.availablePercent}%`
    );
  }

  // Create project member
  const member = await prisma.projectMember.create({
    data: {
      projectId,
      employeeId: memberData.employeeId,
      userId: memberData.userId,
      role: memberData.role || 'TEAM_MEMBER',
      allocationPercent: memberData.allocationPercent || 100,
      startDate: new Date(memberData.startDate),
      endDate: memberData.endDate ? new Date(memberData.endDate) : null,
      hourlyRate: memberData.hourlyRate,
      permissions: memberData.permissions,
      notes: memberData.notes,
      tenantId,
    },
  });

  return member;
};

/**
 * List all project members
 */
export const listProjectMembers = async (projectId, tenantId, filters = {}) => {
  const where = { projectId, tenantId };

  if (filters.status) {
    where.status = filters.status;
  }
  if (filters.role) {
    where.role = filters.role;
  }

  return prisma.projectMember.findMany({
    where,
    orderBy: [
      { role: 'asc' },
      { createdAt: 'asc' },
    ],
  });
};

/**
 * Get a single project member
 */
export const getProjectMember = async (memberId, tenantId) => {
  const member = await prisma.projectMember.findFirst({
    where: { id: memberId, tenantId },
    include: {
      project: {
        select: {
          projectName: true,
          projectCode: true,
          status: true,
        },
      },
    },
  });

  if (!member) {
    throw new Error('Project member not found');
  }

  return member;
};

/**
 * Update a project member
 */
export const updateProjectMember = async (memberId, data, tenantId) => {
  const member = await prisma.projectMember.findFirst({
    where: { id: memberId, tenantId },
  });

  if (!member) {
    throw new Error('Project member not found');
  }

  // If allocation is being changed, check capacity
  if (data.allocationPercent !== undefined && data.allocationPercent !== member.allocationPercent) {
    const allocationCheck = await checkMemberAvailability(
      member.employeeId,
      data.startDate || member.startDate,
      data.endDate || member.endDate,
      tenantId,
      memberId // Exclude current allocation from check
    );

    const newAllocation = data.allocationPercent;
    if (!allocationCheck.available && newAllocation > allocationCheck.availablePercent) {
      throw new Error(
        `Employee is overallocated. Current utilization: ${allocationCheck.currentUtilization}%. ` +
        `Available capacity: ${allocationCheck.availablePercent}%`
      );
    }
  }

  const updateData = {};
  
  if (data.role !== undefined) updateData.role = data.role;
  if (data.allocationPercent !== undefined) updateData.allocationPercent = data.allocationPercent;
  if (data.startDate !== undefined) updateData.startDate = new Date(data.startDate);
  if (data.endDate !== undefined) updateData.endDate = data.endDate ? new Date(data.endDate) : null;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.hourlyRate !== undefined) updateData.hourlyRate = data.hourlyRate;
  if (data.permissions !== undefined) updateData.permissions = data.permissions;
  if (data.notes !== undefined) updateData.notes = data.notes;

  return prisma.projectMember.update({
    where: { id: memberId },
    data: updateData,
  });
};

/**
 * Remove a project member (soft delete by setting status to INACTIVE)
 */
export const removeProjectMember = async (memberId, tenantId) => {
  const member = await prisma.projectMember.findFirst({
    where: { id: memberId, tenantId },
  });

  if (!member) {
    throw new Error('Project member not found');
  }

  return prisma.projectMember.update({
    where: { id: memberId },
    data: {
      status: 'INACTIVE',
      endDate: new Date(),
    },
  });
};

/**
 * Check if an employee is available for allocation
 */
export const checkMemberAvailability = async (
  employeeId,
  startDate,
  endDate,
  tenantId,
  excludeMemberId = null
) => {
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : null;

  // Get all active allocations for this employee in the given period
  const where = {
    employeeId,
    tenantId,
    status: 'ACTIVE',
    startDate: { lte: end || new Date('2099-12-31') },
    OR: [
      { endDate: null },
      { endDate: { gte: start } },
    ],
  };

  if (excludeMemberId) {
    where.id = { not: excludeMemberId };
  }

  const allocations = await prisma.projectMember.findMany({
    where,
    select: {
      allocationPercent: true,
      startDate: true,
      endDate: true,
      project: {
        select: {
          projectName: true,
          projectCode: true,
        },
      },
    },
  });

  // Calculate current utilization
  const currentUtilization = allocations.reduce((sum, alloc) => sum + alloc.allocationPercent, 0);
  const availablePercent = Math.max(0, 100 - currentUtilization);

  return {
    available: currentUtilization < 100,
    currentUtilization,
    availablePercent,
    allocations: allocations.map(a => ({
      project: a.project.projectName,
      projectCode: a.project.projectCode,
      allocation: a.allocationPercent,
      startDate: a.startDate,
      endDate: a.endDate,
    })),
  };
};

/**
 * Get all projects for an employee
 */
export const getEmployeeProjects = async (employeeId, tenantId, filters = {}) => {
  const where = {
    employeeId,
    tenantId,
  };

  if (filters.status) {
    where.status = filters.status;
  }

  return prisma.projectMember.findMany({
    where,
    include: {
      project: {
        select: {
          id: true,
          projectCode: true,
          projectName: true,
          status: true,
          priority: true,
          startDate: true,
          endDate: true,
          progressPercent: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
};

/**
 * Get team capacity summary for a project
 */
export const getProjectTeamCapacity = async (projectId, tenantId) => {
  const members = await prisma.projectMember.findMany({
    where: {
      projectId,
      tenantId,
      status: 'ACTIVE',
    },
  });

  const totalAllocation = members.reduce((sum, member) => sum + member.allocationPercent, 0);
  const avgAllocation = members.length > 0 ? totalAllocation / members.length : 0;

  return {
    totalMembers: members.length,
    totalAllocation,
    avgAllocation,
    members: members.map(m => ({
      employeeId: m.employeeId,
      role: m.role,
      allocation: m.allocationPercent,
      startDate: m.startDate,
      endDate: m.endDate,
    })),
  };
};

/**
 * Bulk add members to a project
 */
export const bulkAddProjectMembers = async (projectId, membersData, tenantId) => {
  const project = await prisma.project.findFirst({
    where: { id: projectId, tenantId },
  });

  if (!project) {
    throw new Error('Project not found');
  }

  const results = {
    successful: [],
    failed: [],
  };

  for (const memberData of membersData) {
    try {
      const member = await addProjectMember(projectId, memberData, tenantId);
      results.successful.push({
        employeeId: memberData.employeeId,
        member,
      });
    } catch (error) {
      results.failed.push({
        employeeId: memberData.employeeId,
        error: error.message,
      });
    }
  }

  return results;
};

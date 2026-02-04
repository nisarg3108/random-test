import prisma from '../../config/db.js';

// ============================================
// PROJECT CRUD OPERATIONS
// ============================================

export const createProject = async (data, tenantId, userId) => {
  // Generate project code
  const projectCode = `PRJ${Date.now()}`;

  const project = await prisma.project.create({
    data: {
      projectCode,
      projectName: data.projectName,
      description: data.description,
      clientName: data.clientName,
      projectManager: data.projectManager,
      status: data.status || 'PLANNING',
      priority: data.priority || 'MEDIUM',
      type: data.type,
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
      estimatedBudget: data.estimatedBudget || 0,
      departmentId: data.departmentId,
      teamMembers: data.teamMembers || [],
      customFields: data.customFields,
      notes: data.notes,
      tenantId,
      createdBy: userId,
    },
    include: {
      department: true,
    },
  });

  return project;
};

export const listProjects = async (tenantId, filters = {}) => {
  const where = { tenantId };

  if (filters.status) {
    where.status = filters.status;
  }
  if (filters.priority) {
    where.priority = filters.priority;
  }
  if (filters.projectManager) {
    where.projectManager = filters.projectManager;
  }
  if (filters.departmentId) {
    where.departmentId = filters.departmentId;
  }

  return prisma.project.findMany({
    where,
    include: {
      department: true,
      _count: {
        select: {
          milestones: true,
          timeLogs: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
};

export const getProjectById = async (id, tenantId) => {
  const project = await prisma.project.findFirst({
    where: { id, tenantId },
    include: {
      department: true,
      milestones: {
        orderBy: { dueDate: 'asc' },
      },
      resources: true,
      budgets: true,
      timeLogs: {
        take: 10,
        orderBy: { logDate: 'desc' },
      },
    },
  });

  if (!project) {
    throw new Error('Project not found');
  }

  return project;
};

export const updateProject = async (id, data, tenantId) => {
  const project = await prisma.project.findFirst({
    where: { id, tenantId },
  });

  if (!project) {
    throw new Error('Project not found');
  }

  const updateData = {};
  
  if (data.projectName !== undefined) updateData.projectName = data.projectName;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.clientName !== undefined) updateData.clientName = data.clientName;
  if (data.projectManager !== undefined) updateData.projectManager = data.projectManager;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.priority !== undefined) updateData.priority = data.priority;
  if (data.type !== undefined) updateData.type = data.type;
  if (data.startDate !== undefined) updateData.startDate = data.startDate ? new Date(data.startDate) : null;
  if (data.endDate !== undefined) updateData.endDate = data.endDate ? new Date(data.endDate) : null;
  if (data.actualStartDate !== undefined) updateData.actualStartDate = data.actualStartDate ? new Date(data.actualStartDate) : null;
  if (data.actualEndDate !== undefined) updateData.actualEndDate = data.actualEndDate ? new Date(data.actualEndDate) : null;
  if (data.estimatedBudget !== undefined) updateData.estimatedBudget = data.estimatedBudget;
  if (data.actualCost !== undefined) updateData.actualCost = data.actualCost;
  if (data.progressPercent !== undefined) updateData.progressPercent = data.progressPercent;
  if (data.departmentId !== undefined) updateData.departmentId = data.departmentId;
  if (data.teamMembers !== undefined) updateData.teamMembers = data.teamMembers;
  if (data.notes !== undefined) updateData.notes = data.notes;
  if (data.attachments !== undefined) updateData.attachments = data.attachments;

  return prisma.project.update({
    where: { id },
    data: updateData,
    include: {
      department: true,
    },
  });
};

export const deleteProject = async (id, tenantId) => {
  const project = await prisma.project.findFirst({
    where: { id, tenantId },
  });

  if (!project) {
    throw new Error('Project not found');
  }

  await prisma.project.delete({
    where: { id },
  });

  return { message: 'Project deleted successfully' };
};

// ============================================
// MILESTONE OPERATIONS
// ============================================

export const createMilestone = async (data, tenantId, userId) => {
  const project = await prisma.project.findFirst({
    where: { id: data.projectId, tenantId },
  });

  if (!project) {
    throw new Error('Project not found');
  }

  const milestone = await prisma.projectMilestone.create({
    data: {
      milestoneName: data.milestoneName,
      description: data.description,
      status: data.status || 'NOT_STARTED',
      startDate: data.startDate ? new Date(data.startDate) : null,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      progressPercent: data.progressPercent || 0,
      assignedTo: data.assignedTo,
      deliverables: data.deliverables || [],
      notes: data.notes,
      projectId: data.projectId,
      tenantId,
      createdBy: userId,
    },
  });

  return milestone;
};

export const listMilestones = async (projectId, tenantId) => {
  return prisma.projectMilestone.findMany({
    where: { projectId, tenantId },
    orderBy: { dueDate: 'asc' },
  });
};

export const updateMilestone = async (id, data, tenantId) => {
  const milestone = await prisma.projectMilestone.findFirst({
    where: { id, tenantId },
  });

  if (!milestone) {
    throw new Error('Milestone not found');
  }

  const updateData = {};
  
  if (data.milestoneName !== undefined) updateData.milestoneName = data.milestoneName;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.startDate !== undefined) updateData.startDate = data.startDate ? new Date(data.startDate) : null;
  if (data.dueDate !== undefined) updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
  if (data.completedDate !== undefined) updateData.completedDate = data.completedDate ? new Date(data.completedDate) : null;
  if (data.progressPercent !== undefined) updateData.progressPercent = data.progressPercent;
  if (data.assignedTo !== undefined) updateData.assignedTo = data.assignedTo;
  if (data.deliverables !== undefined) updateData.deliverables = data.deliverables;
  if (data.notes !== undefined) updateData.notes = data.notes;

  return prisma.projectMilestone.update({
    where: { id },
    data: updateData,
  });
};

export const deleteMilestone = async (id, tenantId) => {
  const milestone = await prisma.projectMilestone.findFirst({
    where: { id, tenantId },
  });

  if (!milestone) {
    throw new Error('Milestone not found');
  }

  await prisma.projectMilestone.delete({
    where: { id },
  });

  return { message: 'Milestone deleted successfully' };
};

// ============================================
// RESOURCE ALLOCATION OPERATIONS
// ============================================

export const allocateResource = async (data, tenantId) => {
  const project = await prisma.project.findFirst({
    where: { id: data.projectId, tenantId },
  });

  if (!project) {
    throw new Error('Project not found');
  }

  const totalCost = (data.costPerUnit || 0) * (data.units || 1);

  const resource = await prisma.projectResource.create({
    data: {
      resourceType: data.resourceType,
      resourceName: data.resourceName,
      employeeId: data.employeeId,
      allocationPercent: data.allocationPercent || 100,
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
      costPerUnit: data.costPerUnit || 0,
      units: data.units || 1,
      totalCost,
      status: data.status || 'ALLOCATED',
      notes: data.notes,
      projectId: data.projectId,
      tenantId,
    },
  });

  return resource;
};

export const listResources = async (projectId, tenantId) => {
  return prisma.projectResource.findMany({
    where: { projectId, tenantId },
    orderBy: { createdAt: 'desc' },
  });
};

export const updateResource = async (id, data, tenantId) => {
  const resource = await prisma.projectResource.findFirst({
    where: { id, tenantId },
  });

  if (!resource) {
    throw new Error('Resource not found');
  }

  const updateData = {};
  
  if (data.resourceType !== undefined) updateData.resourceType = data.resourceType;
  if (data.resourceName !== undefined) updateData.resourceName = data.resourceName;
  if (data.employeeId !== undefined) updateData.employeeId = data.employeeId;
  if (data.allocationPercent !== undefined) updateData.allocationPercent = data.allocationPercent;
  if (data.startDate !== undefined) updateData.startDate = data.startDate ? new Date(data.startDate) : null;
  if (data.endDate !== undefined) updateData.endDate = data.endDate ? new Date(data.endDate) : null;
  if (data.costPerUnit !== undefined) updateData.costPerUnit = data.costPerUnit;
  if (data.units !== undefined) updateData.units = data.units;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.notes !== undefined) updateData.notes = data.notes;

  // Recalculate total cost
  if (data.costPerUnit !== undefined || data.units !== undefined) {
    const costPerUnit = data.costPerUnit !== undefined ? data.costPerUnit : resource.costPerUnit;
    const units = data.units !== undefined ? data.units : resource.units;
    updateData.totalCost = costPerUnit * units;
  }

  return prisma.projectResource.update({
    where: { id },
    data: updateData,
  });
};

export const deleteResource = async (id, tenantId) => {
  const resource = await prisma.projectResource.findFirst({
    where: { id, tenantId },
  });

  if (!resource) {
    throw new Error('Resource not found');
  }

  await prisma.projectResource.delete({
    where: { id },
  });

  return { message: 'Resource deleted successfully' };
};

// ============================================
// BUDGET OPERATIONS
// ============================================

export const createBudgetEntry = async (data, tenantId, userId) => {
  const project = await prisma.project.findFirst({
    where: { id: data.projectId, tenantId },
  });

  if (!project) {
    throw new Error('Project not found');
  }

  const variance = (data.plannedAmount || 0) - (data.actualAmount || 0);

  const budget = await prisma.projectBudget.create({
    data: {
      category: data.category,
      description: data.description,
      plannedAmount: data.plannedAmount || 0,
      actualAmount: data.actualAmount || 0,
      variance,
      budgetPeriod: data.budgetPeriod,
      transactionDate: data.transactionDate ? new Date(data.transactionDate) : new Date(),
      notes: data.notes,
      attachments: data.attachments,
      projectId: data.projectId,
      tenantId,
      createdBy: userId,
    },
  });

  return budget;
};

export const listBudgets = async (projectId, tenantId) => {
  return prisma.projectBudget.findMany({
    where: { projectId, tenantId },
    orderBy: { transactionDate: 'desc' },
  });
};

export const updateBudgetEntry = async (id, data, tenantId) => {
  const budget = await prisma.projectBudget.findFirst({
    where: { id, tenantId },
  });

  if (!budget) {
    throw new Error('Budget entry not found');
  }

  const updateData = {};
  
  if (data.category !== undefined) updateData.category = data.category;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.plannedAmount !== undefined) updateData.plannedAmount = data.plannedAmount;
  if (data.actualAmount !== undefined) updateData.actualAmount = data.actualAmount;
  if (data.budgetPeriod !== undefined) updateData.budgetPeriod = data.budgetPeriod;
  if (data.transactionDate !== undefined) updateData.transactionDate = data.transactionDate ? new Date(data.transactionDate) : null;
  if (data.notes !== undefined) updateData.notes = data.notes;
  if (data.attachments !== undefined) updateData.attachments = data.attachments;

  // Recalculate variance
  if (data.plannedAmount !== undefined || data.actualAmount !== undefined) {
    const plannedAmount = data.plannedAmount !== undefined ? data.plannedAmount : budget.plannedAmount;
    const actualAmount = data.actualAmount !== undefined ? data.actualAmount : budget.actualAmount;
    updateData.variance = plannedAmount - actualAmount;
  }

  return prisma.projectBudget.update({
    where: { id },
    data: updateData,
  });
};

export const deleteBudgetEntry = async (id, tenantId) => {
  const budget = await prisma.projectBudget.findFirst({
    where: { id, tenantId },
  });

  if (!budget) {
    throw new Error('Budget entry not found');
  }

  await prisma.projectBudget.delete({
    where: { id },
  });

  return { message: 'Budget entry deleted successfully' };
};

// ============================================
// TIME TRACKING OPERATIONS
// ============================================

export const logTime = async (data, tenantId, employeeId) => {
  const project = await prisma.project.findFirst({
    where: { id: data.projectId, tenantId },
  });

  if (!project) {
    throw new Error('Project not found');
  }

  const totalCost = data.hourlyRate ? data.hoursWorked * data.hourlyRate : null;

  const timeLog = await prisma.projectTimeLog.create({
    data: {
      logDate: data.logDate ? new Date(data.logDate) : new Date(),
      hoursWorked: data.hoursWorked,
      taskDescription: data.taskDescription,
      milestoneId: data.milestoneId,
      billable: data.billable !== undefined ? data.billable : true,
      hourlyRate: data.hourlyRate,
      totalCost,
      status: data.status || 'LOGGED',
      notes: data.notes,
      projectId: data.projectId,
      employeeId: employeeId || data.employeeId,
      tenantId,
    },
  });

  return timeLog;
};

export const listTimeLogs = async (projectId, tenantId, filters = {}) => {
  const where = { projectId, tenantId };

  if (filters.employeeId) {
    where.employeeId = filters.employeeId;
  }
  if (filters.status) {
    where.status = filters.status;
  }
  if (filters.startDate && filters.endDate) {
    where.logDate = {
      gte: new Date(filters.startDate),
      lte: new Date(filters.endDate),
    };
  }

  return prisma.projectTimeLog.findMany({
    where,
    orderBy: { logDate: 'desc' },
  });
};

export const updateTimeLog = async (id, data, tenantId) => {
  const timeLog = await prisma.projectTimeLog.findFirst({
    where: { id, tenantId },
  });

  if (!timeLog) {
    throw new Error('Time log not found');
  }

  const updateData = {};
  
  if (data.logDate !== undefined) updateData.logDate = data.logDate ? new Date(data.logDate) : null;
  if (data.hoursWorked !== undefined) updateData.hoursWorked = data.hoursWorked;
  if (data.taskDescription !== undefined) updateData.taskDescription = data.taskDescription;
  if (data.milestoneId !== undefined) updateData.milestoneId = data.milestoneId;
  if (data.billable !== undefined) updateData.billable = data.billable;
  if (data.hourlyRate !== undefined) updateData.hourlyRate = data.hourlyRate;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.notes !== undefined) updateData.notes = data.notes;

  // Recalculate total cost
  if (data.hoursWorked !== undefined || data.hourlyRate !== undefined) {
    const hoursWorked = data.hoursWorked !== undefined ? data.hoursWorked : timeLog.hoursWorked;
    const hourlyRate = data.hourlyRate !== undefined ? data.hourlyRate : timeLog.hourlyRate;
    updateData.totalCost = hourlyRate ? hoursWorked * hourlyRate : null;
  }

  return prisma.projectTimeLog.update({
    where: { id },
    data: updateData,
  });
};

export const deleteTimeLog = async (id, tenantId) => {
  const timeLog = await prisma.projectTimeLog.findFirst({
    where: { id, tenantId },
  });

  if (!timeLog) {
    throw new Error('Time log not found');
  }

  await prisma.projectTimeLog.delete({
    where: { id },
  });

  return { message: 'Time log deleted successfully' };
};

// ============================================
// DASHBOARD & ANALYTICS
// ============================================

export const getProjectDashboard = async (tenantId, userId) => {
  const projects = await prisma.project.findMany({
    where: { tenantId },
    include: {
      _count: {
        select: {
          milestones: true,
          timeLogs: true,
        },
      },
    },
  });

  const stats = {
    totalProjects: projects.length,
    activeProjects: projects.filter(p => p.status === 'IN_PROGRESS').length,
    completedProjects: projects.filter(p => p.status === 'COMPLETED').length,
    onHoldProjects: projects.filter(p => p.status === 'ON_HOLD').length,
    totalBudget: projects.reduce((sum, p) => sum + p.estimatedBudget, 0),
    totalActualCost: projects.reduce((sum, p) => sum + p.actualCost, 0),
  };

  // Get upcoming milestones
  const upcomingMilestones = await prisma.projectMilestone.findMany({
    where: {
      tenantId,
      status: { not: 'COMPLETED' },
      dueDate: { gte: new Date() },
    },
    take: 5,
    orderBy: { dueDate: 'asc' },
    include: {
      project: {
        select: {
          projectName: true,
        },
      },
    },
  });

  // Get recent time logs
  const recentTimeLogs = await prisma.projectTimeLog.findMany({
    where: { tenantId },
    take: 10,
    orderBy: { logDate: 'desc' },
    include: {
      project: {
        select: {
          projectName: true,
        },
      },
    },
  });

  return {
    stats,
    upcomingMilestones,
    recentTimeLogs,
  };
};

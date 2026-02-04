import prisma from '../../config/db.js';

// Get all shifts for a tenant
export const getAllShifts = async (tenantId) => {
  return prisma.shift.findMany({
    where: { tenantId },
    include: {
      shiftAssignments: {
        where: { status: 'ACTIVE' },
        include: {
          employee: {
            include: { user: true }
          }
        }
      },
      overtimePolicies: true
    }
  });
};

// Get shift by ID
export const getShiftById = async (shiftId, tenantId) => {
  return prisma.shift.findFirst({
    where: { id: shiftId, tenantId },
    include: {
      shiftAssignments: {
        include: {
          employee: {
            include: { user: true, department: true }
          }
        }
      },
      overtimePolicies: true
    }
  });
};

// Update shift
export const updateShift = async (shiftId, tenantId, data) => {
  const shift = await prisma.shift.findFirst({
    where: { id: shiftId, tenantId }
  });

  if (!shift) throw new Error('Shift not found');

  return prisma.shift.update({
    where: { id: shiftId },
    data: {
      name: data.name || shift.name,
      code: data.code || shift.code,
      startTime: data.startTime || shift.startTime,
      endTime: data.endTime || shift.endTime,
      breakDuration: data.breakDuration || shift.breakDuration,
      workingDays: data.workingDays || shift.workingDays,
      description: data.description || shift.description,
      isActive: data.isActive !== undefined ? data.isActive : shift.isActive
    }
  });
};

// Delete shift
export const deleteShift = async (shiftId, tenantId) => {
  const shift = await prisma.shift.findFirst({
    where: { id: shiftId, tenantId }
  });

  if (!shift) throw new Error('Shift not found');

  // Check if there are active assignments
  const activeAssignments = await prisma.shiftAssignment.count({
    where: {
      shiftId,
      status: 'ACTIVE'
    }
  });

  if (activeAssignments > 0) {
    throw new Error('Cannot delete shift with active assignments. End all assignments first.');
  }

  return prisma.shift.delete({
    where: { id: shiftId }
  });
};

// Get shift assignments for a shift
export const getShiftAssignments = async (shiftId, tenantId) => {
  return prisma.shiftAssignment.findMany({
    where: { shiftId, tenantId },
    include: {
      employee: {
        include: { 
          user: true,
          department: true 
        }
      },
      shift: true
    },
    orderBy: { assignedFrom: 'desc' }
  });
};

// Get employee shift history
export const getEmployeeShiftHistory = async (employeeId, tenantId, limit = 10) => {
  return prisma.shiftAssignment.findMany({
    where: { employeeId, tenantId },
    include: {
      shift: true
    },
    orderBy: { assignedFrom: 'desc' },
    take: limit
  });
};

// End shift assignment
export const endShiftAssignment = async (assignmentId, tenantId) => {
  const assignment = await prisma.shiftAssignment.findFirst({
    where: { id: assignmentId, tenantId }
  });

  if (!assignment) throw new Error('Shift assignment not found');

  return prisma.shiftAssignment.update({
    where: { id: assignmentId },
    data: {
      assignedTo: new Date(),
      status: 'ENDED'
    },
    include: {
      employee: {
        include: { user: true }
      },
      shift: true
    }
  });
};

// Get shift statistics
export const getShiftStatistics = async (tenantId) => {
  const shifts = await prisma.shift.findMany({
    where: { tenantId },
    include: {
      shiftAssignments: {
        where: { status: 'ACTIVE' }
      }
    }
  });

  return {
    totalShifts: shifts.length,
    activeShifts: shifts.filter(s => s.isActive).length,
    totalEmployeesAssigned: shifts.reduce((sum, s) => sum + s.shiftAssignments.length, 0),
    shiftDetails: shifts.map(s => ({
      id: s.id,
      name: s.name,
      code: s.code,
      startTime: s.startTime,
      endTime: s.endTime,
      assignedEmployees: s.shiftAssignments.length
    }))
  };
};

export default {
  getAllShifts,
  getShiftById,
  updateShift,
  deleteShift,
  getShiftAssignments,
  getEmployeeShiftHistory,
  endShiftAssignment,
  getShiftStatistics
};

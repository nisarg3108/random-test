import prisma from '../../config/db.js';
import notificationService from '../notifications/notification.service.js';

// ============================================
// CLOCK IN/OUT FUNCTIONS
// ============================================

export const clockIn = async (employeeId, tenantId, location = null, isWorkFromHome = false) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check if employee already clocked in today
  const existingClockIn = await prisma.timeTracking.findFirst({
    where: {
      employeeId,
      tenantId,
      date: today,
      checkOutTime: null
    }
  });

  if (existingClockIn) {
    throw new Error('Already clocked in today');
  }

  // Check if on leave
  const leaveIntegration = await prisma.leaveIntegration.findFirst({
    where: {
      employeeId,
      tenantId,
      leaveDate: {
        gte: today,
        lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      },
      status: 'APPROVED'
    }
  });

  if (leaveIntegration) {
    throw new Error('Cannot clock in on an approved leave day');
  }

  // Get employee's shift to check for late clock-in
  const shiftAssignment = await prisma.shiftAssignment.findFirst({
    where: {
      employeeId,
      tenantId,
      status: 'ACTIVE',
      assignedFrom: { lte: today },
      OR: [
        { assignedTo: null },
        { assignedTo: { gte: today } }
      ]
    },
    include: {
      shift: true
    }
  });

  const now = new Date();
  let isLate = false;
  let lateMinutes = 0;
  let lateWarningMessage = null;

  // Check if employee is late (grace period: 15 minutes)
  if (shiftAssignment) {
    const shift = shiftAssignment.shift;
    const [startHour, startMin] = shift.startTime.split(':').map(Number);
    
    // Create shift start time for today
    const shiftStartTime = new Date(today);
    shiftStartTime.setHours(startHour, startMin, 0, 0);
    
    // Add 15-minute grace period
    const gracePeriodEnd = new Date(shiftStartTime.getTime() + 15 * 60 * 1000);
    
    if (now > gracePeriodEnd) {
      isLate = true;
      lateMinutes = Math.floor((now - gracePeriodEnd) / (60 * 1000));
      
      // Count late clock-ins in current month
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      monthStart.setHours(0, 0, 0, 0);
      
      const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      monthEnd.setHours(23, 59, 59, 999);
      
      const lateCount = await prisma.timeTracking.count({
        where: {
          employeeId,
          tenantId,
          date: {
            gte: monthStart,
            lte: monthEnd
          },
          isLate: true
        }
      });
      
      // lateCount is previous late entries, this will be the (lateCount + 1)th time
      const currentLateCount = lateCount + 1;
      
      if (currentLateCount <= 3) {
        lateWarningMessage = `Warning ${currentLateCount}/3: You are ${lateMinutes} minutes late. Next late clock-in will result in half day.`;
      }
    }
  }

  // Determine attendance status
  let attendanceStatus = isWorkFromHome ? 'WORK_FROM_HOME' : 'PRESENT';
  
  // If late for 4th time or more in the month, mark as HALF_DAY
  if (isLate) {
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    monthStart.setHours(0, 0, 0, 0);
    
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    monthEnd.setHours(23, 59, 59, 999);
    
    const lateCount = await prisma.timeTracking.count({
      where: {
        employeeId,
        tenantId,
        date: {
          gte: monthStart,
          lte: monthEnd
        },
        isLate: true
      }
    });
    
    // This is the (lateCount + 1)th late entry
    if (lateCount + 1 >= 4) {
      attendanceStatus = 'HALF_DAY';
      lateWarningMessage = `You are ${lateMinutes} minutes late. This is your ${lateCount + 1}${lateCount + 1 === 4 ? 'th' : 'th'} late clock-in this month. Marked as HALF DAY.`;
    }
  }

  // Create time tracking record
  const timeTracking = await prisma.timeTracking.create({
    data: {
      employeeId,
      tenantId,
      date: today,
      checkInTime: new Date(),
      checkInLocation: location ? JSON.stringify(location) : null,
      status: 'CHECKED_IN',
      isLate: isLate
    },
    include: {
      employee: {
        include: {
          user: true
        }
      }
    }
  });

  // Create or update attendance record
  await prisma.attendance.upsert({
    where: {
      tenantId_employeeId_date: {
        tenantId,
        employeeId,
        date: today
      }
    },
    update: {
      checkIn: timeTracking.checkInTime,
      status: attendanceStatus
    },
    create: {
      employeeId,
      tenantId,
      date: today,
      checkIn: timeTracking.checkInTime,
      status: attendanceStatus
    }
  });

  // Return with late warning if applicable
  return {
    ...timeTracking,
    lateWarning: lateWarningMessage
  };
};

export const clockOut = async (employeeId, tenantId, location = null) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Find active clock-in record
  const timeTracking = await prisma.timeTracking.findFirst({
    where: {
      employeeId,
      tenantId,
      date: today,
      checkOutTime: null
    }
  });

  if (!timeTracking) {
    throw new Error('No active clock-in found for today');
  }

  const checkOutTime = new Date();
  const workHours = (checkOutTime - timeTracking.checkInTime) / (1000 * 60 * 60);

  // Get employee's shift to calculate overtime
  const shiftAssignment = await prisma.shiftAssignment.findFirst({
    where: {
      employeeId,
      tenantId,
      status: 'ACTIVE',
      assignedFrom: { lte: today },
      OR: [
        { assignedTo: null },
        { assignedTo: { gte: today } }
      ]
    },
    include: {
      shift: true
    }
  });

  let overtimeHours = 0;
  if (shiftAssignment) {
    const shift = shiftAssignment.shift;
    const [startHour, startMin] = shift.startTime.split(':').map(Number);
    const [endHour, endMin] = shift.endTime.split(':').map(Number);
    const shiftDuration = (endHour + endMin / 60) - (startHour + startMin / 60) - shift.breakDuration / 60;
    overtimeHours = Math.max(0, workHours - shiftDuration);
  }

  // Update time tracking record
  const updatedTracking = await prisma.timeTracking.update({
    where: { id: timeTracking.id },
    data: {
      checkOutTime,
      checkOutLocation: location ? JSON.stringify(location) : null,
      workHours: parseFloat(workHours.toFixed(2)),
      status: 'CHECKED_OUT'
    }
  });

  // Get current attendance record to preserve WFH status
  const currentAttendance = await prisma.attendance.findUnique({
    where: {
      tenantId_employeeId_date: {
        tenantId,
        employeeId,
        date: today
      }
    }
  });

  // Determine final attendance status based on work hours
  let attendanceStatus = currentAttendance?.status || 'PRESENT';
  
  // Only change to HALF_DAY if currently PRESENT and worked less than 75% of shift
  if (shiftAssignment && attendanceStatus === 'PRESENT') {
    const shift = shiftAssignment.shift;
    const [startHour, startMin] = shift.startTime.split(':').map(Number);
    const [endHour, endMin] = shift.endTime.split(':').map(Number);
    const shiftDuration = (endHour + endMin / 60) - (startHour + startMin / 60) - shift.breakDuration / 60;
    
    if (workHours < shiftDuration * 0.75) {
      attendanceStatus = 'HALF_DAY';
    }
  }
  // Preserve WORK_FROM_HOME, LEAVE, and other statuses as they were set during clock-in

  // Update attendance record
  await prisma.attendance.update({
    where: {
      tenantId_employeeId_date: {
        tenantId,
        employeeId,
        date: today
      }
    },
    data: {
      checkOut: checkOutTime,
      workHours: parseFloat(workHours.toFixed(2)),
      overtimeHours: parseFloat(overtimeHours.toFixed(2)),
      status: attendanceStatus
    }
  });

  return updatedTracking;
};

export const getClockStatus = async (employeeId, tenantId) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Get today's active clock-in (not clocked out yet)
  const timeTracking = await prisma.timeTracking.findFirst({
    where: {
      employeeId,
      tenantId,
      date: today,
      checkOutTime: null
    }
  });

  // Get all today's time tracking records (including completed ones)
  const todayTimeRecords = await prisma.timeTracking.findMany({
    where: {
      employeeId,
      tenantId,
      date: {
        gte: today,
        lt: tomorrow
      }
    },
    orderBy: {
      checkInTime: 'desc'
    }
  });

  // Get today's attendance record for overtime and status info
  const todayAttendance = await prisma.attendance.findUnique({
    where: {
      tenantId_employeeId_date: {
        tenantId,
        employeeId,
        date: today
      }
    }
  });

  // Enrich time records with attendance data
  const enrichedRecords = todayTimeRecords.map(record => ({
    ...record,
    overtimeHours: todayAttendance?.overtimeHours || 0,
    attendanceStatus: todayAttendance?.status || 'PRESENT'
  }));

  if (!timeTracking) {
    return {
      isClockedIn: false,
      clockInTime: null,
      elapsedHours: 0,
      todayRecords: enrichedRecords,
      todayAttendance
    };
  }

  const now = new Date();
  const elapsedHours = (now - timeTracking.checkInTime) / (1000 * 60 * 60);

  return {
    isClockedIn: true,
    clockInTime: timeTracking.checkInTime,
    elapsedHours: parseFloat(elapsedHours.toFixed(2)),
    todayRecords: enrichedRecords,
    todayAttendance
  };
};

// ============================================
// SHIFT MANAGEMENT FUNCTIONS
// ============================================

export const createShift = async (data, tenantId) => {
  const shift = await prisma.shift.create({
    data: {
      tenantId,
      name: data.name,
      code: data.code || `SHIFT-${Date.now()}`,
      startTime: data.startTime,
      endTime: data.endTime,
      breakDuration: data.breakDuration || 60,
      workingDays: data.workingDays || '1,2,3,4,5',
      description: data.description,
      isActive: true
    }
  });

  return shift;
};

export const getAllShifts = async (tenantId) => {
  const shifts = await prisma.shift.findMany({
    where: { tenantId },
    include: {
      shiftAssignments: {
        where: { status: 'ACTIVE' },
        include: {
          employee: {
            select: {
              id: true,
              name: true,
              employeeCode: true
            }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return shifts;
};

export const assignShift = async (data, tenantId) => {
  const { employeeId, shiftId, assignedFrom } = data;

  // End any existing active assignments for this employee
  await prisma.shiftAssignment.updateMany({
    where: {
      employeeId,
      tenantId,
      status: 'ACTIVE'
    },
    data: {
      status: 'ENDED',
      assignedTo: new Date()
    }
  });

  // Create new assignment
  const assignment = await prisma.shiftAssignment.create({
    data: {
      employeeId,
      shiftId,
      tenantId,
      assignedFrom: new Date(assignedFrom),
      status: 'ACTIVE'
    },
    include: {
      employee: {
        select: {
          id: true,
          name: true,
          employeeCode: true
        }
      },
      shift: true
    }
  });

  // Notify employee about shift assignment
  try {
    await notificationService.createNotification({
      tenantId,
      employeeId,
      type: 'SHIFT_ASSIGNMENT',
      title: 'New Shift Assigned',
      message: `You have been assigned to ${assignment.shift.name}`
    });
  } catch (error) {
    console.error('Failed to create shift assignment notification:', error);
  }

  return assignment;
};

export const getEmployeeShift = async (employeeId, tenantId) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const assignment = await prisma.shiftAssignment.findFirst({
    where: {
      employeeId,
      tenantId,
      status: 'ACTIVE',
      assignedFrom: { lte: today },
      OR: [
        { assignedTo: null },
        { assignedTo: { gte: today } }
      ]
    },
    include: {
      shift: true
    }
  });

  return assignment?.shift || null;
};

export const getShiftHistory = async (employeeId, tenantId, limit = 10) => {
  const history = await prisma.shiftAssignment.findMany({
    where: {
      employeeId,
      tenantId
    },
    include: {
      shift: true
    },
    orderBy: { assignedFrom: 'desc' },
    take: limit
  });

  return history;
};

// ============================================
// OVERTIME FUNCTIONS
// ============================================

export const createOvertimePolicy = async (data, tenantId) => {
  const policy = await prisma.overtimePolicy.create({
    data: {
      tenantId,
      shiftId: data.shiftId || null,
      name: data.name,
      code: data.code,
      dailyThreshold: data.dailyThreshold || 8,
      weeklyThreshold: data.weeklyThreshold || 40,
      monthlyThreshold: data.monthlyThreshold || null,
      overtimeRate: data.overtimeRate || 1.5,
      weekendRate: data.weekendRate || 2,
      holidayRate: data.holidayRate || 2.5,
      description: data.description,
      isActive: true
    }
  });

  return policy;
};

export const calculateOvertimeHours = async (employeeId, tenantId, date) => {
  const dateObj = new Date(date);
  dateObj.setHours(0, 0, 0, 0);

  // Get all time tracking records for the day
  const timeRecords = await prisma.timeTracking.findMany({
    where: {
      employeeId,
      tenantId,
      date: dateObj,
      status: 'CHECKED_OUT'
    }
  });

  if (timeRecords.length === 0) {
    return {
      totalWorkHours: 0,
      shiftDuration: 0,
      overtimeHours: 0
    };
  }

  const totalWorkHours = timeRecords.reduce((sum, record) => sum + record.workHours, 0);

  // Get employee's shift
  const shiftAssignment = await prisma.shiftAssignment.findFirst({
    where: {
      employeeId,
      tenantId,
      status: 'ACTIVE',
      assignedFrom: { lte: dateObj },
      OR: [
        { assignedTo: null },
        { assignedTo: { gte: dateObj } }
      ]
    },
    include: {
      shift: true
    }
  });

  let shiftDuration = 8; // Default 8 hours
  if (shiftAssignment) {
    const shift = shiftAssignment.shift;
    const [startHour, startMin] = shift.startTime.split(':').map(Number);
    const [endHour, endMin] = shift.endTime.split(':').map(Number);
    shiftDuration = (endHour + endMin / 60) - (startHour + startMin / 60) - shift.breakDuration / 60;
  }

  const overtimeHours = Math.max(0, totalWorkHours - shiftDuration);

  return {
    totalWorkHours: parseFloat(totalWorkHours.toFixed(2)),
    shiftDuration: parseFloat(shiftDuration.toFixed(2)),
    overtimeHours: parseFloat(overtimeHours.toFixed(2))
  };
};

export const recordOvertime = async (employeeId, tenantId, data) => {
  const { overtimePolicyId, overtimeHours, date, dailyRate, reason } = data;

  // Get overtime policy
  const policy = await prisma.overtimePolicy.findFirst({
    where: { id: overtimePolicyId, tenantId }
  });

  if (!policy) {
    throw new Error('Overtime policy not found');
  }

  // Determine rate based on day type
  const dateObj = new Date(date);
  const dayOfWeek = dateObj.getDay();
  let rate = policy.overtimeRate;

  if (dayOfWeek === 0 || dayOfWeek === 6) {
    rate = policy.weekendRate;
  }

  const overtimeAmount = overtimeHours * (dailyRate / 8) * rate;

  const record = await prisma.overtimeRecord.create({
    data: {
      employeeId,
      overtimePolicyId,
      tenantId,
      date: dateObj,
      overtimeHours: parseFloat(overtimeHours),
      overtimeRate: rate,
      overtimeAmount: parseFloat(overtimeAmount.toFixed(2)),
      reason,
      approvalStatus: 'PENDING'
    },
    include: {
      employee: {
        select: {
          id: true,
          name: true,
          employeeCode: true
        }
      },
      overtimePolicy: true
    }
  });

  // Notify HR/managers
  try {
    const managers = await prisma.employee.findMany({
      where: {
        tenantId,
        user: { role: { in: ['MANAGER', 'ADMIN', 'HR'] } }
      }
    });

    for (const manager of managers) {
      await notificationService.createNotification({
        tenantId,
        employeeId: manager.id,
        type: 'OVERTIME_REQUEST',
        title: 'New Overtime Request',
        message: `${record.employee.name} has requested ${overtimeHours} hours of overtime`
      });
    }
  } catch (error) {
    console.error('Failed to create overtime request notifications:', error);
  }

  return record;
};

export const approveOvertime = async (overtimeRecordId, tenantId, approvedBy) => {
  const record = await prisma.overtimeRecord.update({
    where: { id: overtimeRecordId, tenantId },
    data: {
      approvalStatus: 'APPROVED',
      approvedBy,
      approvedAt: new Date()
    },
    include: {
      employee: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });

  // Update attendance record with approved overtime
  await prisma.attendance.updateMany({
    where: {
      tenantId,
      employeeId: record.employeeId,
      date: record.date
    },
    data: {
      overtimeHours: record.overtimeHours
    }
  });

  // Notify employee
  try {
    await notificationService.createNotification({
      tenantId,
      employeeId: record.employeeId,
      type: 'OVERTIME_APPROVED',
      title: 'Overtime Approved',
      message: `Your overtime request for ${record.overtimeHours} hours has been approved`
    });
  } catch (error) {
    console.error('Failed to create overtime approval notification:', error);
  }

  return record;
};

// ============================================
// ATTENDANCE REPORT FUNCTIONS
// ============================================

export const generateAttendanceReport = async (employeeId, tenantId, month, year) => {
  // Get all attendance records for the month
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  const attendanceRecords = await prisma.attendance.findMany({
    where: {
      employeeId,
      tenantId,
      date: {
        gte: startDate,
        lte: endDate
      }
    }
  });

  // Calculate statistics
  const totalWorkingDays = endDate.getDate();
  let presentDays = 0;
  let absentDays = 0;
  let leaveDays = 0;
  let halfDays = 0;
  let workFromHomeDays = 0;
  let totalWorkHours = 0;
  let totalOvertimeHours = 0;

  attendanceRecords.forEach(record => {
    switch (record.status) {
      case 'PRESENT':
        presentDays++;
        break;
      case 'ABSENT':
        absentDays++;
        break;
      case 'LEAVE':
        leaveDays++;
        break;
      case 'HALF_DAY':
        halfDays++;
        break;
      case 'WORK_FROM_HOME':
        workFromHomeDays++;
        break;
    }
    totalWorkHours += record.workHours;
    totalOvertimeHours += record.overtimeHours;
  });

  // Calculate attendance percentage
  const attendancePercentage = totalWorkingDays > 0
    ? ((presentDays + halfDays * 0.5 + workFromHomeDays) / totalWorkingDays) * 100
    : 0;

  // Create or update report
  const report = await prisma.attendanceReport.upsert({
    where: {
      tenantId_employeeId_month_year: {
        tenantId,
        employeeId,
        month,
        year
      }
    },
    update: {
      reportDate: new Date(),
      totalWorkingDays,
      presentDays,
      absentDays,
      leaveDays,
      halfDays,
      workFromHomeDays,
      totalWorkHours: parseFloat(totalWorkHours.toFixed(2)),
      totalOvertimeHours: parseFloat(totalOvertimeHours.toFixed(2)),
      attendancePercentage: parseFloat(attendancePercentage.toFixed(2)),
      status: 'GENERATED'
    },
    create: {
      employeeId,
      tenantId,
      reportDate: new Date(),
      month,
      year,
      totalWorkingDays,
      presentDays,
      absentDays,
      leaveDays,
      halfDays,
      workFromHomeDays,
      totalWorkHours: parseFloat(totalWorkHours.toFixed(2)),
      totalOvertimeHours: parseFloat(totalOvertimeHours.toFixed(2)),
      attendancePercentage: parseFloat(attendancePercentage.toFixed(2)),
      status: 'GENERATED'
    },
    include: {
      employee: {
        select: {
          id: true,
          name: true,
          employeeCode: true,
          department: {
            select: {
              id: true,
              name: true
            }
          }
        }
      }
    }
  });

  return report;
};

export const getAttendanceReport = async (employeeId, tenantId, month, year) => {
  const report = await prisma.attendanceReport.findUnique({
    where: {
      tenantId_employeeId_month_year: {
        tenantId,
        employeeId,
        month,
        year
      }
    },
    include: {
      employee: {
        select: {
          id: true,
          name: true,
          employeeCode: true,
          email: true,
          department: {
            select: {
              id: true,
              name: true
            }
          }
        }
      }
    }
  });

  return report;
};

export const getDepartmentReport = async (departmentId, tenantId, month, year) => {
  // Get all employees in department
  const employees = await prisma.employee.findMany({
    where: {
      departmentId,
      tenantId
    },
    select: {
      id: true,
      name: true,
      employeeCode: true
    }
  });

  // Get reports for all employees
  const reports = await prisma.attendanceReport.findMany({
    where: {
      tenantId,
      month,
      year,
      employeeId: {
        in: employees.map(e => e.id)
      }
    },
    include: {
      employee: {
        select: {
          id: true,
          name: true,
          employeeCode: true
        }
      }
    }
  });

  // Calculate summary
  const totalEmployees = employees.length;
  const totalPresentDays = reports.reduce((sum, r) => sum + r.presentDays, 0);
  const totalAbsentDays = reports.reduce((sum, r) => sum + r.absentDays, 0);
  const totalWorkHours = reports.reduce((sum, r) => sum + r.totalWorkHours, 0);
  const totalOvertimeHours = reports.reduce((sum, r) => sum + r.totalOvertimeHours, 0);
  const averageAttendance = reports.length > 0
    ? reports.reduce((sum, r) => sum + r.attendancePercentage, 0) / reports.length
    : 0;

  return {
    department: departmentId,
    month,
    year,
    summary: {
      totalEmployees,
      averageAttendance: parseFloat(averageAttendance.toFixed(2)),
      totalWorkHours: parseFloat(totalWorkHours.toFixed(2)),
      totalOvertimeHours: parseFloat(totalOvertimeHours.toFixed(2))
    },
    reports
  };
};

// ============================================
// LEAVE INTEGRATION FUNCTIONS
// ============================================

export const integrateLeaveWithAttendance = async (leaveRequestId, tenantId) => {
  // Get leave request details
  const leaveRequest = await prisma.leaveRequest.findFirst({
    where: { id: leaveRequestId, tenantId }
  });

  if (!leaveRequest) {
    throw new Error('Leave request not found');
  }

  if (leaveRequest.status !== 'APPROVED') {
    throw new Error('Leave request is not approved');
  }

  const integrations = [];
  const startDate = new Date(leaveRequest.startDate);
  const endDate = new Date(leaveRequest.endDate);

  // Create integration record for each day
  let currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const integration = await prisma.leaveIntegration.create({
      data: {
        leaveRequestId,
        employeeId: leaveRequest.employeeId,
        tenantId,
        leaveDate: new Date(currentDate),
        status: 'APPROVED',
        attendanceStatus: 'ON_LEAVE'
      }
    });

    // Create/update attendance record
    await prisma.attendance.upsert({
      where: {
        tenantId_employeeId_date: {
          tenantId,
          employeeId: leaveRequest.employeeId,
          date: new Date(currentDate)
        }
      },
      update: {
        status: 'LEAVE'
      },
      create: {
        employeeId: leaveRequest.employeeId,
        tenantId,
        date: new Date(currentDate),
        status: 'LEAVE'
      }
    });

    integrations.push(integration);
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return integrations;
};

export default {
  clockIn,
  clockOut,
  getClockStatus,
  createShift,
  getAllShifts,
  assignShift,
  getEmployeeShift,
  getShiftHistory,
  createOvertimePolicy,
  calculateOvertimeHours,
  recordOvertime,
  approveOvertime,
  generateAttendanceReport,
  getAttendanceReport,
  getDepartmentReport,
  integrateLeaveWithAttendance
};

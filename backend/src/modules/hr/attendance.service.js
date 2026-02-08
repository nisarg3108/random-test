import prisma from '../../config/db.js';
import notificationService from '../notifications/notification.service.js';

// ==========================================
// CLOCK IN/OUT OPERATIONS
// ==========================================

export const clockIn = async (employeeId, tenantId, location = null) => {
  const employee = await prisma.employee.findFirst({
    where: { id: employeeId, tenantId }
  });
  
  if (!employee) throw new Error('Employee not found');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check if already clocked in today
  const existingRecord = await prisma.timeTracking.findFirst({
    where: {
      employeeId,
      tenantId,
      date: today,
      status: 'CHECKED_IN'
    }
  });

  if (existingRecord) {
    throw new Error('Employee is already clocked in for today');
  }

  const checkInTime = new Date();
  
  // Check if employee is late (after 9:00 AM by default)
  const deadlineHour = 9; // 9:00 AM
  const deadlineMinute = 0;
  const deadline = new Date(checkInTime);
  deadline.setHours(deadlineHour, deadlineMinute, 0, 0);
  
  const isLate = checkInTime > deadline;
  
  const timeTracking = await prisma.timeTracking.create({
    data: {
      tenantId,
      employeeId,
      date: today,
      checkInTime,
      checkInLocation: location,
      status: 'CHECKED_IN',
      isLate: isLate
    },
    include: {
      employee: {
        include: { user: true }
      }
    }
  });

  // Send notification
  const lateWarning = isLate ? ' ⚠️ You are marked as late.' : '';
  await notificationService.createNotification({
    tenantId,
    employeeId,
    type: 'CLOCK_IN',
    title: isLate ? 'Clock In - Late Arrival' : 'Clock In Successful',
    message: `You have clocked in at ${checkInTime.toLocaleTimeString()}.${lateWarning}`
  });

  return timeTracking;
};

export const clockOut = async (employeeId, tenantId, location = null) => {
  const employee = await prisma.employee.findFirst({
    where: { id: employeeId, tenantId }
  });
  
  if (!employee) throw new Error('Employee not found');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const timeTracking = await prisma.timeTracking.findFirst({
    where: {
      employeeId,
      tenantId,
      date: today,
      status: 'CHECKED_IN'
    }
  });

  if (!timeTracking) {
    throw new Error('No active clock-in record found for today');
  }

  const checkOutTime = new Date();
  
  // Calculate work hours
  const workHoursMs = checkOutTime - timeTracking.checkInTime;
  const workHours = workHoursMs / (1000 * 60 * 60);

  const updated = await prisma.timeTracking.update({
    where: { id: timeTracking.id },
    data: {
      checkOutTime,
      checkOutLocation: location,
      workHours: parseFloat(workHours.toFixed(2)),
      status: 'CHECKED_OUT'
    },
    include: {
      employee: {
        include: { user: true }
      }
    }
  });

  // Update attendance record for today
  await updateAttendanceRecord(employeeId, tenantId, today);

  // Send notification
  await notificationService.createNotification({
    tenantId,
    employeeId,
    type: 'CLOCK_OUT',
    title: 'Clock Out Successful',
    message: `You have clocked out at ${checkOutTime.toLocaleTimeString()}. Work hours: ${workHours.toFixed(2)}`
  });

  return updated;
};

export const getCurrentClockInStatus = async (employeeId, tenantId) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const activeRecord = await prisma.timeTracking.findFirst({
    where: {
      employeeId,
      tenantId,
      date: today,
      status: 'CHECKED_IN'
    }
  });

  return {
    isClocked: !!activeRecord,
    clockedIn: activeRecord?.checkInTime || null,
    isLate: activeRecord?.isLate || false,
    deadlineTime: '09:00', // Clock-in deadline time (9:00 AM)
    elapsedHours: activeRecord
      ? (new Date() - activeRecord.checkInTime) / (1000 * 60 * 60)
      : 0
  };
};

// ==========================================
// SHIFT MANAGEMENT
// ==========================================

export const createShift = async (data, tenantId) => {
  const existingShift = await prisma.shift.findFirst({
    where: {
      tenantId,
      code: data.code
    }
  });

  if (existingShift) {
    throw new Error('Shift with this code already exists');
  }

  const shift = await prisma.shift.create({
    data: {
      tenantId,
      name: data.name,
      code: data.code,
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

export const assignShift = async (employeeId, shiftId, tenantId, assignedFrom = null) => {
  const employee = await prisma.employee.findFirst({
    where: { id: employeeId, tenantId }
  });

  if (!employee) throw new Error('Employee not found');

  const shift = await prisma.shift.findFirst({
    where: { id: shiftId, tenantId }
  });

  if (!shift) throw new Error('Shift not found');

  // End any existing active shift assignments
  await prisma.shiftAssignment.updateMany({
    where: {
      employeeId,
      tenantId,
      status: 'ACTIVE',
      assignedTo: null
    },
    data: {
      assignedTo: new Date(),
      status: 'ENDED'
    }
  });

  const assignment = await prisma.shiftAssignment.create({
    data: {
      tenantId,
      employeeId,
      shiftId,
      assignedFrom: assignedFrom || new Date(),
      status: 'ACTIVE'
    },
    include: {
      shift: true,
      employee: {
        include: { user: true }
      }
    }
  });

  return assignment;
};

export const getEmployeeShift = async (employeeId, tenantId, date = null) => {
  const checkDate = date || new Date();
  
  const assignment = await prisma.shiftAssignment.findFirst({
    where: {
      employeeId,
      tenantId,
      status: 'ACTIVE',
      assignedFrom: { lte: checkDate },
      OR: [
        { assignedTo: null },
        { assignedTo: { gte: checkDate } }
      ]
    },
    include: {
      shift: true
    }
  });

  return assignment?.shift || null;
};

export const getShiftsByTenant = async (tenantId) => {
  return prisma.shift.findMany({
    where: { tenantId, isActive: true },
    include: {
      shiftAssignments: {
        where: { status: 'ACTIVE' },
        include: {
          employee: {
            include: { user: true }
          }
        }
      }
    }
  });
};

// ==========================================
// OVERTIME TRACKING
// ==========================================

export const createOvertimePolicy = async (data, tenantId) => {
  const existingPolicy = await prisma.overtimePolicy.findFirst({
    where: {
      tenantId,
      code: data.code
    }
  });

  if (existingPolicy) {
    throw new Error('Overtime policy with this code already exists');
  }

  const policy = await prisma.overtimePolicy.create({
    data: {
      tenantId,
      shiftId: data.shiftId,
      name: data.name,
      code: data.code,
      dailyThreshold: data.dailyThreshold || 8,
      weeklyThreshold: data.weeklyThreshold || 40,
      monthlyThreshold: data.monthlyThreshold,
      overtimeRate: data.overtimeRate || 1.5,
      weekendRate: data.weekendRate || 2,
      holidayRate: data.holidayRate || 2.5,
      description: data.description
    }
  });

  return policy;
};

export const calculateOvertimeHours = async (employeeId, tenantId, date) => {
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  const dayRecords = await prisma.timeTracking.findMany({
    where: {
      employeeId,
      tenantId,
      date: {
        gte: dayStart,
        lte: dayEnd
      }
    }
  });

  let totalWorkHours = 0;
  dayRecords.forEach(record => {
    if (record.workHours) {
      totalWorkHours += record.workHours;
    }
  });

  const shift = await getEmployeeShift(employeeId, tenantId, date);
  let shiftDuration = 8;
  
  if (shift) {
    const [startHour, startMin] = shift.startTime.split(':').map(Number);
    const [endHour, endMin] = shift.endTime.split(':').map(Number);
    const breakHours = shift.breakDuration / 60;
    shiftDuration = (endHour + endMin / 60) - (startHour + startMin / 60) - breakHours;
  }

  const overtimeHours = Math.max(0, totalWorkHours - shiftDuration);
  
  return {
    totalWorkHours: parseFloat(totalWorkHours.toFixed(2)),
    shiftDuration: parseFloat(shiftDuration.toFixed(2)),
    overtimeHours: parseFloat(overtimeHours.toFixed(2))
  };
};

export const recordOvertime = async (employeeId, tenantId, data) => {
  const employee = await prisma.employee.findFirst({
    where: { id: employeeId, tenantId }
  });

  if (!employee) throw new Error('Employee not found');

  const policy = await prisma.overtimePolicy.findFirst({
    where: { id: data.overtimePolicyId, tenantId }
  });

  if (!policy) throw new Error('Overtime policy not found');

  const overtimeRecord = await prisma.overtimeRecord.create({
    data: {
      tenantId,
      employeeId,
      overtimePolicyId: data.overtimePolicyId,
      date: new Date(data.date),
      overtimeHours: data.overtimeHours,
      overtimeRate: policy.overtimeRate,
      overtimeAmount: data.overtimeHours * (data.dailyRate || 0),
      reason: data.reason,
      approvalStatus: 'PENDING'
    },
    include: {
      employee: {
        include: { user: true }
      },
      overtimePolicy: true
    }
  });

  // Notify manager
  if (employee.managerId) {
    await notificationService.createNotification({
      tenantId,
      employeeId: employee.managerId,
      type: 'OVERTIME_RECORDED',
      title: 'New Overtime Record',
      message: `${employee.name} has ${data.overtimeHours} hours of overtime on ${data.date}`
    });
  }

  return overtimeRecord;
};

export const approveOvertime = async (overtimeRecordId, tenantId, approvedBy) => {
  const record = await prisma.overtimeRecord.findFirst({
    where: { id: overtimeRecordId, tenantId }
  });

  if (!record) throw new Error('Overtime record not found');

  const updated = await prisma.overtimeRecord.update({
    where: { id: overtimeRecordId },
    data: {
      approvalStatus: 'APPROVED',
      approvedBy,
      approvedAt: new Date()
    },
    include: {
      employee: {
        include: { user: true }
      }
    }
  });

  // Notify employee
  await notificationService.createNotification({
    tenantId,
    employeeId: record.employeeId,
    type: 'OVERTIME_APPROVED',
    title: 'Overtime Approved',
    message: `Your overtime record for ${record.date.toDateString()} has been approved`
  });

  return updated;
};

// ==========================================
// ATTENDANCE REPORTING
// ==========================================

export const generateAttendanceReport = async (employeeId, tenantId, month, year) => {
  const employee = await prisma.employee.findFirst({
    where: { id: employeeId, tenantId }
  });

  if (!employee) throw new Error('Employee not found');

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  // Get all attendance records for the month
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
  let presentDays = 0;
  let absentDays = 0;
  let leaveDays = 0;
  let halfDays = 0;
  let workFromHomeDays = 0;
  let totalWorkHours = 0;
  let totalOvertimeHours = 0;

  attendanceRecords.forEach(record => {
    if (record.status === 'PRESENT') presentDays++;
    if (record.status === 'ABSENT') absentDays++;
    if (record.status === 'LEAVE') leaveDays++;
    if (record.status === 'HALF_DAY') halfDays++;
    if (record.status === 'WORK_FROM_HOME') workFromHomeDays++;
    totalWorkHours += record.workHours || 0;
    totalOvertimeHours += record.overtimeHours || 0;
  });

  // Calculate working days (typically exclude weekends and holidays)
  const workingDays = calculateWorkingDays(startDate, endDate);
  const attendancePercentage = workingDays > 0 
    ? ((presentDays + halfDays * 0.5) / workingDays) * 100 
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
    create: {
      tenantId,
      employeeId,
      reportDate: new Date(),
      month,
      year,
      totalWorkingDays: workingDays,
      presentDays,
      absentDays,
      leaveDays,
      halfDays,
      workFromHomeDays,
      totalWorkHours: parseFloat(totalWorkHours.toFixed(2)),
      totalOvertimeHours: parseFloat(totalOvertimeHours.toFixed(2)),
      attendancePercentage: parseFloat(attendancePercentage.toFixed(2))
    },
    update: {
      reportDate: new Date(),
      totalWorkingDays: workingDays,
      presentDays,
      absentDays,
      leaveDays,
      halfDays,
      workFromHomeDays,
      totalWorkHours: parseFloat(totalWorkHours.toFixed(2)),
      totalOvertimeHours: parseFloat(totalOvertimeHours.toFixed(2)),
      attendancePercentage: parseFloat(attendancePercentage.toFixed(2))
    },
    include: {
      employee: {
        include: { user: true }
      }
    }
  });

  return report;
};

export const getAttendanceReport = async (employeeId, tenantId, month, year) => {
  return prisma.attendanceReport.findFirst({
    where: {
      employeeId,
      tenantId,
      month,
      year
    },
    include: {
      employee: {
        include: {
          user: true,
          department: true
        }
      }
    }
  });
};

export const getTeamAttendanceReport = async (departmentId, tenantId, month, year) => {
  const employees = await prisma.employee.findMany({
    where: {
      departmentId,
      tenantId
    }
  });

  const reports = await Promise.all(
    employees.map(emp => generateAttendanceReport(emp.id, tenantId, month, year))
  );

  return {
    department: departmentId,
    month,
    year,
    reports,
    summary: {
      totalEmployees: employees.length,
      averageAttendance: (reports.reduce((sum, r) => sum + r.attendancePercentage, 0) / reports.length).toFixed(2),
      totalWorkHours: reports.reduce((sum, r) => sum + r.totalWorkHours, 0).toFixed(2),
      totalOvertimeHours: reports.reduce((sum, r) => sum + r.totalOvertimeHours, 0).toFixed(2)
    }
  };
};

// ==========================================
// LEAVE INTEGRATION
// ==========================================

export const integrateLeaveWithAttendance = async (leaveRequestId, tenantId) => {
  const leaveRequest = await prisma.leaveRequest.findFirst({
    where: { id: leaveRequestId, tenantId }
  });

  if (!leaveRequest || leaveRequest.status !== 'APPROVED') {
    throw new Error('Invalid or unapproved leave request');
  }

  const currentDate = new Date(leaveRequest.startDate);
  const endDate = new Date(leaveRequest.endDate);

  const integrations = [];

  // Create leave integration entries for each day of leave
  while (currentDate <= endDate) {
    const existingIntegration = await prisma.leaveIntegration.findFirst({
      where: {
        tenantId,
        leaveRequestId,
        leaveDate: {
          gte: new Date(currentDate.setHours(0, 0, 0, 0)),
          lt: new Date(currentDate.getTime() + 24 * 60 * 60 * 1000)
        }
      }
    });

    if (!existingIntegration) {
      const integration = await prisma.leaveIntegration.create({
        data: {
          tenantId,
          leaveRequestId,
          employeeId: leaveRequest.employeeId,
          leaveDate: new Date(currentDate),
          status: 'APPROVED',
          attendanceStatus: 'ON_LEAVE'
        }
      });
      integrations.push(integration);
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Update attendance records for leave days
  await updateAttendanceForLeave(leaveRequest.employeeId, tenantId, leaveRequest.startDate, leaveRequest.endDate);

  return integrations;
};

// ==========================================
// HELPER FUNCTIONS
// ==========================================

export const updateAttendanceRecord = async (employeeId, tenantId, date) => {
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  // Check if there's a leave for this day
  const leaveIntegration = await prisma.leaveIntegration.findFirst({
    where: {
      employeeId,
      tenantId,
      leaveDate: {
        gte: dayStart,
        lte: dayEnd
      },
      status: 'APPROVED'
    }
  });

  if (leaveIntegration) {
    // Update with leave status
    return prisma.attendance.upsert({
      where: {
        tenantId_employeeId_date: {
          tenantId,
          employeeId,
          date
        }
      },
      create: {
        tenantId,
        employeeId,
        date,
        status: leaveIntegration.attendanceStatus
      },
      update: {
        status: leaveIntegration.attendanceStatus
      }
    });
  }

  // Get today's time tracking records
  const timeRecords = await prisma.timeTracking.findMany({
    where: {
      employeeId,
      tenantId,
      date: {
        gte: dayStart,
        lte: dayEnd
      }
    }
  });

  if (timeRecords.length === 0) {
    // No clock in/out records - mark as ABSENT
    return prisma.attendance.upsert({
      where: {
        tenantId_employeeId_date: {
          tenantId,
          employeeId,
          date
        }
      },
      create: {
        tenantId,
        employeeId,
        date,
        status: 'ABSENT'
      },
      update: {
        status: 'ABSENT'
      }
    });
  }

  // Calculate total work hours
  let totalWorkHours = 0;
  timeRecords.forEach(record => {
    if (record.workHours) totalWorkHours += record.workHours;
  });

  const shift = await getEmployeeShift(employeeId, tenantId, date);
  let shiftDuration = 8;
  
  if (shift) {
    const [startHour, startMin] = shift.startTime.split(':').map(Number);
    const [endHour, endMin] = shift.endTime.split(':').map(Number);
    const breakHours = shift.breakDuration / 60;
    shiftDuration = (endHour + endMin / 60) - (startHour + startMin / 60) - breakHours;
  }

  const status = totalWorkHours >= shiftDuration * 0.75 ? 'PRESENT' : 'HALF_DAY';
  const overtimeHours = Math.max(0, totalWorkHours - shiftDuration);

  return prisma.attendance.upsert({
    where: {
      tenantId_employeeId_date: {
        tenantId,
        employeeId,
        date
      }
    },
    create: {
      tenantId,
      employeeId,
      date,
      status,
      workHours: parseFloat(totalWorkHours.toFixed(2)),
      overtimeHours: parseFloat(overtimeHours.toFixed(2))
    },
    update: {
      status,
      workHours: parseFloat(totalWorkHours.toFixed(2)),
      overtimeHours: parseFloat(overtimeHours.toFixed(2))
    }
  });
};

export const updateAttendanceForLeave = async (employeeId, tenantId, startDate, endDate) => {
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    const date = new Date(currentDate);
    date.setHours(0, 0, 0, 0);
    
    await prisma.attendance.upsert({
      where: {
        tenantId_employeeId_date: {
          tenantId,
          employeeId,
          date
        }
      },
      create: {
        tenantId,
        employeeId,
        date,
        status: 'LEAVE'
      },
      update: {
        status: 'LEAVE'
      }
    });

    currentDate.setDate(currentDate.getDate() + 1);
  }
};

const calculateWorkingDays = (startDate, endDate) => {
  let count = 0;
  const current = new Date(startDate);
  
  while (current <= endDate) {
    const dayOfWeek = current.getDay();
    // Exclude Saturdays (6) and Sundays (0)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return count;
};

// ==========================================
// DASHBOARD STATISTICS
// ==========================================

export const getDashboardStatistics = async (tenantId) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get total employees count
  const totalEmployees = await prisma.employee.count({
    where: { tenantId, status: 'ACTIVE' }
  });

  // Get today's attendance records
  const todayAttendance = await prisma.timeTracking.findMany({
    where: {
      tenantId,
      date: today
    }
  });

  // Count present (checked in or checked out today)
  const presentToday = todayAttendance.length;

  // Count currently clocked in
  const clockedIn = todayAttendance.filter(
    record => record.status === 'CHECKED_IN'
  ).length;

  // Calculate absent (total employees - present today)
  const absentToday = totalEmployees - presentToday;

  // Calculate average attendance for last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  const last30DaysAttendance = await prisma.timeTracking.groupBy({
    by: ['date'],
    where: {
      tenantId,
      date: {
        gte: thirtyDaysAgo,
        lte: today
      }
    },
    _count: {
      id: true
    }
  });

  const avgAttendanceCount = last30DaysAttendance.length > 0
    ? last30DaysAttendance.reduce((sum, day) => sum + day._count.id, 0) / last30DaysAttendance.length
    : 0;

  const averageAttendance = totalEmployees > 0
    ? ((avgAttendanceCount / totalEmployees) * 100).toFixed(1)
    : 0;

  return {
    totalEmployees,
    presentToday,
    absentToday,
    clockedIn,
    averageAttendance: parseFloat(averageAttendance)
  };
};

export default {
  clockIn,
  clockOut,
  getCurrentClockInStatus,
  createShift,
  assignShift,
  getEmployeeShift,
  getShiftsByTenant,
  createOvertimePolicy,
  calculateOvertimeHours,
  recordOvertime,
  approveOvertime,
  generateAttendanceReport,
  getAttendanceReport,
  getTeamAttendanceReport,
  integrateLeaveWithAttendance,
  updateAttendanceRecord,
  updateAttendanceForLeave,
  getDashboardStatistics
};

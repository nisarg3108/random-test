import attendanceService from './attendance.service.js';
import { getEmployeeByUserId } from './employee.service.js';

// ==========================================
// CLOCK IN/OUT ENDPOINTS
// ==========================================

export const clockIn = async (req, res) => {
  try {
    let { employeeId, location } = req.body;
    const tenantId = req.user.tenantId;
    const userId = req.user.userId;

    // If employeeId not provided, get it from current user
    if (!employeeId) {
      const employee = await getEmployeeByUserId(userId, tenantId);
      if (!employee) {
        return res.status(404).json({
          success: false,
          message: 'Employee profile not found for current user'
        });
      }
      employeeId = employee.id;
    }

    const result = await attendanceService.clockIn(employeeId, tenantId, location);
    
    res.status(200).json({
      success: true,
      message: 'Clock in successful',
      data: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

export const clockOut = async (req, res) => {
  try {
    let { employeeId, location } = req.body;
    const tenantId = req.user.tenantId;
    const userId = req.user.userId;

    // If employeeId not provided, get it from current user
    if (!employeeId) {
      const employee = await getEmployeeByUserId(userId, tenantId);
      if (!employee) {
        return res.status(404).json({
          success: false,
          message: 'Employee profile not found for current user'
        });
      }
      employeeId = employee.id;
    }

    const result = await attendanceService.clockOut(employeeId, tenantId, location);
    
    res.status(200).json({
      success: true,
      message: 'Clock out successful',
      data: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

export const getClockStatus = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const tenantId = req.user.tenantId;

    const status = await attendanceService.getCurrentClockInStatus(employeeId, tenantId);
    
    res.status(200).json({
      success: true,
      data: status
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// ==========================================
// SHIFT MANAGEMENT ENDPOINTS
// ==========================================

export const createShift = async (req, res) => {
  try {
    const data = req.body;
    const tenantId = req.user.tenantId;

    const result = await attendanceService.createShift(data, tenantId);
    
    res.status(201).json({
      success: true,
      message: 'Shift created successfully',
      data: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

export const assignShift = async (req, res) => {
  try {
    const { employeeId, shiftId, assignedFrom } = req.body;
    const tenantId = req.user.tenantId;

    const result = await attendanceService.assignShift(employeeId, shiftId, tenantId, assignedFrom);
    
    res.status(200).json({
      success: true,
      message: 'Shift assigned successfully',
      data: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

export const getEmployeeShift = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { date } = req.query;
    const tenantId = req.user.tenantId;

    const shift = await attendanceService.getEmployeeShift(
      employeeId,
      tenantId,
      date ? new Date(date) : null
    );
    
    res.status(200).json({
      success: true,
      data: shift
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

export const getShifts = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;

    const shifts = await attendanceService.getShiftsByTenant(tenantId);
    
    res.status(200).json({
      success: true,
      data: shifts
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// ==========================================
// OVERTIME MANAGEMENT ENDPOINTS
// ==========================================

export const createOvertimePolicy = async (req, res) => {
  try {
    const data = req.body;
    const tenantId = req.user.tenantId;

    const result = await attendanceService.createOvertimePolicy(data, tenantId);
    
    res.status(201).json({
      success: true,
      message: 'Overtime policy created successfully',
      data: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

export const getOvertimeHours = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { date } = req.query;
    const tenantId = req.user.tenantId;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date parameter is required'
      });
    }

    const result = await attendanceService.calculateOvertimeHours(employeeId, tenantId, new Date(date));
    
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

export const recordOvertimeManual = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const data = req.body;
    const tenantId = req.user.tenantId;

    const result = await attendanceService.recordOvertime(employeeId, tenantId, data);
    
    res.status(201).json({
      success: true,
      message: 'Overtime recorded successfully',
      data: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

export const approveOvertimeRecord = async (req, res) => {
  try {
    const { overtimeRecordId } = req.params;
    const { approvedBy } = req.body;
    const tenantId = req.user.tenantId;

    const result = await attendanceService.approveOvertime(overtimeRecordId, tenantId, approvedBy);
    
    res.status(200).json({
      success: true,
      message: 'Overtime approved successfully',
      data: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// ==========================================
// ATTENDANCE REPORTING ENDPOINTS
// ==========================================

export const generateMonthlyReport = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { month, year } = req.query;
    const tenantId = req.user.tenantId;

    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: 'Month and year are required'
      });
    }

    const report = await attendanceService.generateAttendanceReport(
      employeeId,
      tenantId,
      parseInt(month),
      parseInt(year)
    );
    
    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

export const getMonthlyReport = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { month, year } = req.query;
    const tenantId = req.user.tenantId;

    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: 'Month and year are required'
      });
    }

    const report = await attendanceService.getAttendanceReport(
      employeeId,
      tenantId,
      parseInt(month),
      parseInt(year)
    );
    
    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

export const getTeamReport = async (req, res) => {
  try {
    const { departmentId } = req.params;
    const { month, year } = req.query;
    const tenantId = req.user.tenantId;

    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: 'Month and year are required'
      });
    }

    const report = await attendanceService.getTeamAttendanceReport(
      departmentId,
      tenantId,
      parseInt(month),
      parseInt(year)
    );
    
    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// ==========================================
// LEAVE INTEGRATION ENDPOINTS
// ==========================================

export const integrateLeave = async (req, res) => {
  try {
    const { leaveRequestId } = req.body;
    const tenantId = req.user.tenantId;

    const result = await attendanceService.integrateLeaveWithAttendance(leaveRequestId, tenantId);
    
    res.status(200).json({
      success: true,
      message: 'Leave integrated with attendance successfully',
      data: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// ==========================================
// DASHBOARD STATISTICS ENDPOINT
// ==========================================

export const getDashboardStats = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;

    const stats = await attendanceService.getDashboardStatistics(tenantId);
    
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

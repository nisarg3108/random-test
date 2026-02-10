import attendanceService from './attendance.service.js';

// ============================================
// CLOCK IN/OUT CONTROLLERS
// ============================================

export const clockIn = async (req, res) => {
  try {
    const { employeeId, location, isWorkFromHome } = req.body;
    const tenantId = req.user.tenantId;

    const timeTracking = await attendanceService.clockIn(employeeId, tenantId, location, isWorkFromHome);

    res.status(200).json({
      success: true,
      message: 'Clock in successful',
      data: timeTracking
    });
  } catch (error) {
    console.error('Clock in error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to clock in'
    });
  }
};

export const clockOut = async (req, res) => {
  try {
    const { employeeId, location } = req.body;
    const tenantId = req.user.tenantId;

    const timeTracking = await attendanceService.clockOut(employeeId, tenantId, location);

    res.status(200).json({
      success: true,
      message: 'Clock out successful',
      data: timeTracking
    });
  } catch (error) {
    console.error('Clock out error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to clock out'
    });
  }
};

export const getClockStatus = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const tenantId = req.user.tenantId;

    const status = await attendanceService.getClockStatus(employeeId, tenantId);

    res.status(200).json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Get clock status error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get clock status'
    });
  }
};

// ============================================
// SHIFT MANAGEMENT CONTROLLERS
// ============================================

export const createShift = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const shiftData = {
      ...req.body,
      code: req.body.code || `SHIFT-${Date.now()}`
    };
    const shift = await attendanceService.createShift(shiftData, tenantId);

    res.status(201).json({
      success: true,
      message: 'Shift created successfully',
      data: shift
    });
  } catch (error) {
    console.error('Create shift error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create shift'
    });
  }
};

export const getAllShifts = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const shifts = await attendanceService.getAllShifts(tenantId);

    res.status(200).json({
      success: true,
      data: shifts
    });
  } catch (error) {
    console.error('Get shifts error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get shifts'
    });
  }
};

export const assignShift = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const assignment = await attendanceService.assignShift(req.body, tenantId);

    res.status(201).json({
      success: true,
      message: 'Shift assigned successfully',
      data: assignment
    });
  } catch (error) {
    console.error('Assign shift error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to assign shift'
    });
  }
};

export const getEmployeeShift = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const tenantId = req.user.tenantId;

    const shift = await attendanceService.getEmployeeShift(employeeId, tenantId);

    res.status(200).json({
      success: true,
      data: shift
    });
  } catch (error) {
    console.error('Get employee shift error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get employee shift'
    });
  }
};

export const getShiftHistory = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { limit } = req.query;
    const tenantId = req.user.tenantId;

    const history = await attendanceService.getShiftHistory(
      employeeId,
      tenantId,
      limit ? parseInt(limit) : 10
    );

    res.status(200).json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('Get shift history error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get shift history'
    });
  }
};

// ============================================
// OVERTIME CONTROLLERS
// ============================================

export const createOvertimePolicy = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const policy = await attendanceService.createOvertimePolicy(req.body, tenantId);

    res.status(201).json({
      success: true,
      message: 'Overtime policy created successfully',
      data: policy
    });
  } catch (error) {
    console.error('Create overtime policy error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create overtime policy'
    });
  }
};

export const calculateOvertimeHours = async (req, res) => {
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

    const overtime = await attendanceService.calculateOvertimeHours(employeeId, tenantId, date);

    res.status(200).json({
      success: true,
      data: overtime
    });
  } catch (error) {
    console.error('Calculate overtime error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to calculate overtime'
    });
  }
};

export const recordOvertime = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const tenantId = req.user.tenantId;

    const record = await attendanceService.recordOvertime(employeeId, tenantId, req.body);

    res.status(201).json({
      success: true,
      message: 'Overtime recorded successfully',
      data: record
    });
  } catch (error) {
    console.error('Record overtime error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to record overtime'
    });
  }
};

export const approveOvertime = async (req, res) => {
  try {
    const { overtimeRecordId } = req.params;
    const { approvedBy } = req.body;
    const tenantId = req.user.tenantId;

    const record = await attendanceService.approveOvertime(overtimeRecordId, tenantId, approvedBy);

    res.status(200).json({
      success: true,
      message: 'Overtime approved successfully',
      data: record
    });
  } catch (error) {
    console.error('Approve overtime error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to approve overtime'
    });
  }
};

// ============================================
// ATTENDANCE REPORT CONTROLLERS
// ============================================

export const generateAttendanceReport = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { month, year } = req.query;
    const tenantId = req.user.tenantId;

    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: 'Month and year parameters are required'
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
      message: 'Report generated successfully',
      data: report
    });
  } catch (error) {
    console.error('Generate report error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate report'
    });
  }
};

export const getAttendanceReport = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { month, year } = req.query;
    const tenantId = req.user.tenantId;

    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: 'Month and year parameters are required'
      });
    }

    const report = await attendanceService.getAttendanceReport(
      employeeId,
      tenantId,
      parseInt(month),
      parseInt(year)
    );

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Get report error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get report'
    });
  }
};

export const getDepartmentReport = async (req, res) => {
  try {
    const { departmentId } = req.params;
    const { month, year } = req.query;
    const tenantId = req.user.tenantId;

    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: 'Month and year parameters are required'
      });
    }

    const report = await attendanceService.getDepartmentReport(
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
    console.error('Get department report error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get department report'
    });
  }
};

// ============================================
// LEAVE INTEGRATION CONTROLLER
// ============================================

export const integrateLeaveWithAttendance = async (req, res) => {
  try {
    const { leaveRequestId } = req.body;
    const tenantId = req.user.tenantId;

    const integrations = await attendanceService.integrateLeaveWithAttendance(leaveRequestId, tenantId);

    res.status(200).json({
      success: true,
      message: 'Leave integrated with attendance successfully',
      data: integrations
    });
  } catch (error) {
    console.error('Leave integration error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to integrate leave with attendance'
    });
  }
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

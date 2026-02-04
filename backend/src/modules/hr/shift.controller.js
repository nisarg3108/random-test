import shiftService from './shift.service.js';

// Get all shifts
export const getAllShifts = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;

    const shifts = await shiftService.getAllShifts(tenantId);
    
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

// Get shift by ID
export const getShiftById = async (req, res) => {
  try {
    const { shiftId } = req.params;
    const tenantId = req.user.tenantId;

    const shift = await shiftService.getShiftById(shiftId, tenantId);
    
    if (!shift) {
      return res.status(404).json({
        success: false,
        message: 'Shift not found'
      });
    }

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

// Update shift
export const updateShift = async (req, res) => {
  try {
    const { shiftId } = req.params;
    const data = req.body;
    const tenantId = req.user.tenantId;

    const updated = await shiftService.updateShift(shiftId, tenantId, data);
    
    res.status(200).json({
      success: true,
      message: 'Shift updated successfully',
      data: updated
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Delete shift
export const deleteShift = async (req, res) => {
  try {
    const { shiftId } = req.params;
    const tenantId = req.user.tenantId;

    await shiftService.deleteShift(shiftId, tenantId);
    
    res.status(200).json({
      success: true,
      message: 'Shift deleted successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get shift assignments
export const getShiftAssignments = async (req, res) => {
  try {
    const { shiftId } = req.params;
    const tenantId = req.user.tenantId;

    const assignments = await shiftService.getShiftAssignments(shiftId, tenantId);
    
    res.status(200).json({
      success: true,
      data: assignments
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get employee shift history
export const getEmployeeShiftHistory = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { limit } = req.query;
    const tenantId = req.user.tenantId;

    const history = await shiftService.getEmployeeShiftHistory(
      employeeId,
      tenantId,
      limit ? parseInt(limit) : 10
    );
    
    res.status(200).json({
      success: true,
      data: history
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// End shift assignment
export const endShiftAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const tenantId = req.user.tenantId;

    const result = await shiftService.endShiftAssignment(assignmentId, tenantId);
    
    res.status(200).json({
      success: true,
      message: 'Shift assignment ended successfully',
      data: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get shift statistics
export const getShiftStatistics = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;

    const stats = await shiftService.getShiftStatistics(tenantId);
    
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
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

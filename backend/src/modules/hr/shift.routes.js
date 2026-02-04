import express from 'express';
import { requireAuth } from '../../core/auth/auth.middleware.js';
import { 
  getAllShifts,
  getShiftById,
  updateShift,
  deleteShift,
  getShiftAssignments,
  getEmployeeShiftHistory
} from './shift.controller.js';

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

// Shift CRUD routes
router.get('/', getAllShifts);
router.get('/:shiftId', getShiftById);
router.put('/:shiftId', updateShift);
router.delete('/:shiftId', deleteShift);

// Shift assignment routes
router.get('/:shiftId/assignments', getShiftAssignments);

// Employee shift routes
router.get('/employee/:employeeId', getEmployeeShiftHistory);

export default router;

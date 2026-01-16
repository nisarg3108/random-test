import {
  getPendingApprovals,
  approveRequest,
  rejectRequest,
} from '../../core/workflow/approval.service.js';

/**
 * GET PENDING APPROVALS
 */
export const getPendingApprovalsController = async (req, res, next) => {
  try {
    const approvals = await getPendingApprovals(req.user.tenantId, req.user.userId);
    res.json(approvals);
  } catch (err) {
    next(err);
  }
};

/**
 * APPROVE REQUEST
 */
export const approveController = async (req, res, next) => {
  try {
    const { approvalId } = req.params;
    const result = await approveRequest(approvalId, req.user.userId);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

/**
 * REJECT REQUEST
 */
export const rejectController = async (req, res, next) => {
  try {
    const { approvalId } = req.params;
    const { reason } = req.body;
    const result = await rejectRequest(approvalId, req.user.userId, reason);
    res.json(result);
  } catch (err) {
    next(err);
  }
};
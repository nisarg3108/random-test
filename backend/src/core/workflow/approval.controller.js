import {
  getPendingApprovals,
  approveRequest,
  rejectRequest,
  getUserRequests,
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
 * GET USER'S OWN REQUESTS
 */
export const getMyRequestsController = async (req, res, next) => {
  try {
    const requests = await getUserRequests(req.user.tenantId, req.user.userId);
    res.json(requests);
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
    const { comment } = req.body;
    const result = await approveRequest(approvalId, req.user.userId, comment);
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
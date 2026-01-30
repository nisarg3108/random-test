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
  console.log('\n=== APPROVE CONTROLLER CALLED ===');
  console.log('Params:', req.params);
  console.log('Body:', req.body);
  console.log('User:', req.user);
  
  try {
    const { approvalId } = req.params;
    const { comment } = req.body;
    
    if (!approvalId) {
      console.log('ERROR: No approval ID');
      return res.status(400).json({ success: false, message: 'Approval ID is required' });
    }
    
    if (!req.user || !req.user.userId) {
      console.log('ERROR: No user in request');
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }
    
    console.log('Calling approveRequest service...');
    const result = await approveRequest(approvalId, req.user.userId, comment);
    console.log('Service returned:', result);
    
    // Return 200 even if there's a warning (item already exists)
    if (result.warning) {
      return res.status(200).json({ 
        success: true, 
        ...result,
        message: result.message || 'Approved with warnings'
      });
    }
    
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('\n=== APPROVE CONTROLLER ERROR ===');
    console.error('Error message:', err.message);
    
    // Don't expose full stack trace to client in production
    res.status(500).json({ 
      success: false, 
      message: err.message || 'Failed to approve request'
    });
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
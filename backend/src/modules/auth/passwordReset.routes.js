import express from 'express';
import passwordResetController from './passwordReset.controller.js';

const router = express.Router();

router.post('/forgot-password', passwordResetController.requestReset);
router.post('/verify-otp', passwordResetController.verifyOTP);
router.post('/reset-password', passwordResetController.resetPassword);

export default router;
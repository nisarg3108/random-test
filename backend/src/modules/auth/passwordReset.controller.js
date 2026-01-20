import passwordResetService from '../../services/passwordReset.service.js';

class PasswordResetController {
  async requestReset(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }

      const result = await passwordResetService.requestPasswordReset(email);
      res.json(result);
    } catch (error) {
      console.error('Password reset request error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  async verifyOTP(req, res) {
    try {
      const { email, otp } = req.body;

      if (!email || !otp) {
        return res.status(400).json({ error: 'Email and OTP are required' });
      }

      const result = await passwordResetService.verifyOTP(email, otp);
      res.json(result);
    } catch (error) {
      console.error('OTP verification error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  async resetPassword(req, res) {
    try {
      const { email, otp, newPassword } = req.body;

      if (!email || !otp || !newPassword) {
        return res.status(400).json({ error: 'Email, OTP, and new password are required' });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long' });
      }

      const result = await passwordResetService.resetPassword(email, otp, newPassword);
      res.json(result);
    } catch (error) {
      console.error('Password reset error:', error);
      res.status(400).json({ error: error.message });
    }
  }
}

export default new PasswordResetController();
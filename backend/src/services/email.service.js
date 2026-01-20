import nodemailer from 'nodemailer';

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  async sendWelcomeEmail(employeeData, defaultPassword) {
    const { email, name, employeeCode } = employeeData;
    
    const mailOptions = {
      from: process.env.SMTP_FROM || 'noreply@company.com',
      to: email,
      subject: 'Welcome to the Team - Your Account Details',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Welcome to the Team, ${name}!</h2>
          <p>Your employee account has been created successfully.</p>
          
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Your Account Details:</h3>
            <p><strong>Employee Code:</strong> ${employeeCode}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Temporary Password:</strong> ${defaultPassword}</p>
          </div>
          
          <p style="color: #e74c3c;"><strong>Important:</strong> Please change your password after your first login for security.</p>
          
          <p>You can access the system at: <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}">${process.env.FRONTEND_URL || 'http://localhost:5173'}</a></p>
          
          <p>If you have any questions, please contact your manager or HR department.</p>
          
          <p>Best regards,<br>HR Team</p>
        </div>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Welcome email sent to ${email}`);
    } catch (error) {
      console.error('Failed to send welcome email:', error);
    }
  }

  async sendPasswordResetOTP(email, otp, name) {
    const mailOptions = {
      from: process.env.SMTP_FROM || 'noreply@company.com',
      to: email,
      subject: 'Password Reset OTP',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p>Hello ${name || 'User'},</p>
          
          <p>You have requested to reset your password. Please use the following OTP to proceed:</p>
          
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <h1 style="color: #2c3e50; font-size: 32px; letter-spacing: 4px; margin: 0;">${otp}</h1>
          </div>
          
          <p><strong>This OTP is valid for 10 minutes only.</strong></p>
          
          <p>If you didn't request this password reset, please ignore this email or contact support.</p>
          
          <p>Best regards,<br>Security Team</p>
        </div>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Password reset OTP sent to ${email}`);
    } catch (error) {
      console.error('Failed to send password reset OTP:', error);
      throw error;
    }
  }

  generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}

export default new EmailService();
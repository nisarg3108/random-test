import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import emailService from './email.service.js';

const prisma = new PrismaClient();

class PasswordResetService {
  async requestPasswordReset(email) {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        employee: {
          select: { name: true }
        }
      }
    });

    if (!user) {
      throw new Error('User with this email does not exist');
    }

    // Generate OTP
    const otp = emailService.generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save OTP to database
    await prisma.passwordReset.create({
      data: {
        email,
        otp,
        expiresAt
      }
    });

    // Send OTP via email
    await emailService.sendPasswordResetOTP(email, otp, user.employee?.name);

    return { success: true, message: 'OTP sent to your email' };
  }

  async verifyOTP(email, otp) {
    const resetRecord = await prisma.passwordReset.findFirst({
      where: {
        email,
        otp,
        used: false,
        expiresAt: {
          gt: new Date()
        }
      }
    });

    if (!resetRecord) {
      throw new Error('Invalid or expired OTP');
    }

    return { valid: true, resetId: resetRecord.id };
  }

  async resetPassword(email, otp, newPassword) {
    // Verify OTP first
    const resetRecord = await prisma.passwordReset.findFirst({
      where: {
        email,
        otp,
        used: false,
        expiresAt: {
          gt: new Date()
        }
      }
    });

    if (!resetRecord) {
      throw new Error('Invalid or expired OTP');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password
    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword }
    });

    // Mark OTP as used
    await prisma.passwordReset.update({
      where: { id: resetRecord.id },
      data: { used: true }
    });

    return { success: true, message: 'Password reset successfully' };
  }

  async cleanupExpiredOTPs() {
    await prisma.passwordReset.deleteMany({
      where: {
        expiresAt: {
          lt: new Date()
        }
      }
    });
  }
}

export default new PasswordResetService();
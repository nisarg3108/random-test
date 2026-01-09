import bcrypt from 'bcrypt';
import prisma from '../config/db.js';
import { createInvite, acceptInvite } from './invite.service.js';
import { signToken } from '../shared/utils/jwt.js';

export const inviteUserController = async (req, res, next) => {
  try {
    const { email, role } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const invite = await createInvite({ email, role }, req.user.tenantId);

    res.status(201).json({
      message: 'Invite created successfully',
      inviteLink: `http://localhost:5173/accept-invite?token=${invite.token}`,
    });
  } catch (err) {
    console.error('Invite creation error:', err);
    res.status(400).json({ message: err.message || 'Failed to create invite' });
  }
};

export const acceptInviteController = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    if (!token) {
      return res.status(400).json({ message: 'Token is required' });
    }

    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }

    const invite = await acceptInvite({ token, password });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email: invite.email,
        password: hashedPassword,
        role: invite.role,
        tenantId: invite.tenantId,
      },
    });

    await prisma.userInvite.update({
      where: { id: invite.id },
      data: { used: true },
    });

    const jwt = signToken({
      userId: user.id,
      tenantId: user.tenantId,
      role: user.role,
    });

    res.json({
      message: 'Invite accepted successfully',
      token: jwt,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Accept invite error:', err);
    res.status(400).json({ message: err.message || 'Failed to accept invite' });
  }
};

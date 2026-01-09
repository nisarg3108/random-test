import { Router } from 'express';
import { requireAuth } from '../core/auth/auth.middleware.js';

const router = Router();

router.get('/', requireAuth, (req, res) => {
  res.json({
    message: 'You have accessed a protected route',
    user: req.user,
  });
});

export default router;

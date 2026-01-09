import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Backend is running',
    timestamp: new Date(),
  });
});

export default router;

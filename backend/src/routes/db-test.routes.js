import { Router } from 'express';
import prisma from '../config/db.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const tenants = await prisma.tenant.findMany();
    res.status(200).json({
      success: true,
      tenants
    });
  } catch (error) {
    next(error);
  }
});


export default router;

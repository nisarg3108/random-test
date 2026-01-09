import express from 'express';
import { RBACController } from './rbac.controller.js';

const router = express.Router();

router.get('/roles', RBACController.getRoles);
router.get('/permissions', RBACController.getPermissions);

export default router;
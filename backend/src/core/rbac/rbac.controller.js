import { SystemOptionsService } from '../system/systemOptions.service.js';
import prisma from '../../config/db.js';

export class RBACController {
  static async getRoles(req, res) {
    try {
      const roles = await SystemOptionsService.getOptions('USER_ROLE');
      res.json({ success: true, data: roles });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async getPermissions(req, res) {
    try {
      const permissions = await prisma.permission.findMany({
        orderBy: { label: 'asc' }
      });
      res.json({ success: true, data: permissions });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}
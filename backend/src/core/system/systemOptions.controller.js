import { SystemOptionsService } from './systemOptions.service.js';

export class SystemOptionsController {
  static async getOptions(req, res) {
    try {
      const { category } = req.params;
      const tenantId = req.user?.tenantId;
      
      const options = await SystemOptionsService.getOptions(category, tenantId);
      res.json({ success: true, data: options });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async createOption(req, res) {
    try {
      const tenantId = req.user?.tenantId;
      const data = { ...req.body, tenantId };
      
      const option = await SystemOptionsService.createOption(data);
      res.status(201).json({ success: true, data: option });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async updateOption(req, res) {
    try {
      const { id } = req.params;
      const option = await SystemOptionsService.updateOption(id, req.body);
      res.json({ success: true, data: option });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async deleteOption(req, res) {
    try {
      const { id } = req.params;
      await SystemOptionsService.deleteOption(id);
      res.json({ success: true, message: 'Option deleted successfully' });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}
import express from 'express';
import { SystemOptionsController } from './systemOptions.controller.js';

const router = express.Router();

router.get('/:category', SystemOptionsController.getOptions);
router.post('/', SystemOptionsController.createOption);
router.put('/:id', SystemOptionsController.updateOption);
router.delete('/:id', SystemOptionsController.deleteOption);

export default router;
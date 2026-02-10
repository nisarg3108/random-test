import {
  createPipeline,
  listPipelines,
  getPipeline,
  updatePipeline,
  deletePipeline,
  createPipelineStage,
  updatePipelineStage,
  deletePipelineStage,
  reorderPipelineStages,
  getDefaultPipeline
} from './pipeline.service.js';
import { logAudit } from '../../core/audit/audit.service.js';

export const createPipelineController = async (req, res, next) => {
  try {
    const pipeline = await createPipeline(req.body, req.user.tenantId);

    await logAudit({
      userId: req.user.userId,
      tenantId: req.user.tenantId,
      action: 'CREATE',
      entity: 'PIPELINE',
      entityId: pipeline.id
    });

    res.status(201).json(pipeline);
  } catch (err) {
    next(err);
  }
};

export const listPipelinesController = async (req, res, next) => {
  try {
    const filters = {
      active: req.query.active === 'true'
    };
    const pipelines = await listPipelines(req.user.tenantId, filters);
    res.json(pipelines);
  } catch (err) {
    next(err);
  }
};

export const getPipelineController = async (req, res, next) => {
  try {
    const pipeline = await getPipeline(req.params.id, req.user.tenantId);
    if (!pipeline) {
      return res.status(404).json({ message: 'Pipeline not found' });
    }
    res.json(pipeline);
  } catch (err) {
    next(err);
  }
};

export const getDefaultPipelineController = async (req, res, next) => {
  try {
    const pipeline = await getDefaultPipeline(req.user.tenantId);
    if (!pipeline) {
      return res.status(404).json({ message: 'No default pipeline found' });
    }
    res.json(pipeline);
  } catch (err) {
    next(err);
  }
};

export const updatePipelineController = async (req, res, next) => {
  try {
    const pipeline = await updatePipeline(req.params.id, req.body, req.user.tenantId);

    await logAudit({
      userId: req.user.userId,
      tenantId: req.user.tenantId,
      action: 'UPDATE',
      entity: 'PIPELINE',
      entityId: pipeline.id
    });

    res.json(pipeline);
  } catch (err) {
    next(err);
  }
};

export const deletePipelineController = async (req, res, next) => {
  try {
    await deletePipeline(req.params.id, req.user.tenantId);

    await logAudit({
      userId: req.user.userId,
      tenantId: req.user.tenantId,
      action: 'DELETE',
      entity: 'PIPELINE',
      entityId: req.params.id
    });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

// Pipeline Stage operations

export const createPipelineStageController = async (req, res, next) => {
  try {
    const stage = await createPipelineStage(req.params.pipelineId, req.body, req.user.tenantId);
    
    await logAudit({
      userId: req.user.userId,
      tenantId: req.user.tenantId,
      action: 'CREATE',
      entity: 'PIPELINE_STAGE',
      entityId: stage.id
    });

    res.status(201).json(stage);
  } catch (err) {
    next(err);
  }
};

export const updatePipelineStageController = async (req, res, next) => {
  try {
    const stage = await updatePipelineStage(req.params.stageId, req.body, req.user.tenantId);
    
    await logAudit({
      userId: req.user.userId,
      tenantId: req.user.tenantId,
      action: 'UPDATE',
      entity: 'PIPELINE_STAGE',
      entityId: stage.id
    });

    res.json(stage);
  } catch (err) {
    next(err);
  }
};

export const deletePipelineStageController = async (req, res, next) => {
  try {
    await deletePipelineStage(req.params.stageId, req.user.tenantId);
    
    await logAudit({
      userId: req.user.userId,
      tenantId: req.user.tenantId,
      action: 'DELETE',
      entity: 'PIPELINE_STAGE',
      entityId: req.params.stageId
    });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

export const reorderPipelineStagesController = async (req, res, next) => {
  try {
    const { stageOrders } = req.body; // Array of { id, order }
    if (!Array.isArray(stageOrders)) {
      return res.status(400).json({ message: 'stageOrders must be an array' });
    }

    const updatedStages = await reorderPipelineStages(req.params.pipelineId, stageOrders, req.user.tenantId);
    
    await logAudit({
      userId: req.user.userId,
      tenantId: req.user.tenantId,
      action: 'UPDATE',
      entity: 'PIPELINE',
      entityId: req.params.pipelineId,
      details: 'Reordered stages'
    });

    res.json(updatedStages);
  } catch (err) {
    next(err);
  }
};

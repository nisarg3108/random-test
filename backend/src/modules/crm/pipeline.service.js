import prisma from '../../config/db.js';

/**
 * Pipeline Service - Manages sales pipelines and stages
 */

export const createPipeline = async (data, tenantId) => {
  // Validation
  if (!data.name || data.name.trim().length === 0) {
    throw new Error('Pipeline name is required');
  }
  
  // Check if pipeline name already exists for tenant
  const existing = await prisma.pipeline.findFirst({
    where: {
      tenantId,
      name: data.name.trim()
    }
  });
  
  if (existing) {
    throw new Error('Pipeline with this name already exists');
  }
  
  return prisma.pipeline.create({
    data: {
      tenantId,
      name: data.name.trim(),
      description: data.description || null,
      isDefault: data.isDefault || false,
      isActive: data.isActive !== undefined ? data.isActive : true
    },
    include: {
      stages: { orderBy: { order: 'asc' } }
    }
  });
};

export const listPipelines = async (tenantId, includeInactive = false) => {
  const where = {
    tenantId,
    ...(includeInactive ? {} : { isActive: true })
  };
  
  return prisma.pipeline.findMany({
    where,
    include: {
      stages: { orderBy: { order: 'asc' } },
      _count: {
        select: { deals: true }
      }
    },
    orderBy: [
      { isDefault: 'desc' },
      { name: 'asc' }
    ]
  });
};

export const getPipeline = async (id, tenantId) => {
  return prisma.pipeline.findFirst({
    where: { id, tenantId },
    include: {
      stages: { orderBy: { order: 'asc' } },
      deals: {
        include: {
          customer: { select: { id: true, name: true } },
          owner: { select: { id: true, email: true } }
        },
        orderBy: { stageOrder: 'asc' }
      }
    }
  });
};

export const updatePipeline = async (id, data, tenantId) => {
  // Verify ownership
  const existing = await prisma.pipeline.findFirst({
    where: { id, tenantId }
  });
  
  if (!existing) {
    throw new Error('Pipeline not found or access denied');
  }
  
  return prisma.pipeline.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name.trim() }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.isDefault !== undefined && { isDefault: data.isDefault }),
      ...(data.isActive !== undefined && { isActive: data.isActive })
    },
    include: {
      stages: { orderBy: { order: 'asc' } }
    }
  });
};

export const deletePipeline = async (id, tenantId) => {
  // Verify ownership
  const existing = await prisma.pipeline.findFirst({
    where: { id, tenantId },
    include: {
      _count: { select: { deals: true } }
    }
  });
  
  if (!existing) {
    throw new Error('Pipeline not found or access denied');
  }
  
  if (existing._count.deals > 0) {
    throw new Error('Cannot delete pipeline with existing deals. Move or delete deals first.');
  }
  
  return prisma.pipeline.delete({
    where: { id }
  });
};

// Pipeline Stage Operations

export const createPipelineStage = async (pipelineId, data, tenantId) => {
  // Validation
  if (!data.name || data.name.trim().length === 0) {
    throw new Error('Stage name is required');
  }
  
  // Verify pipeline ownership
  const pipeline = await prisma.pipeline.findFirst({
    where: { id: pipelineId, tenantId }
  });
  
  if (!pipeline) {
    throw new Error('Pipeline not found or access denied');
  }
  
  // Get next order number
  const maxOrder = await prisma.pipelineStage.findFirst({
    where: { pipelineId },
    orderBy: { order: 'desc' },
    select: { order: true }
  });
  
  const order = data.order !== undefined ? data.order : (maxOrder?.order || 0) + 1;
  
  return prisma.pipelineStage.create({
    data: {
      tenantId,
      pipelineId,
      name: data.name.trim(),
      order,
      probability: data.probability !== undefined ? data.probability : 0,
      color: data.color || null,
      isClosedWon: data.isClosedWon || false,
      isClosedLost: data.isClosedLost || false,
      daysInStage: data.daysInStage || null
    }
  });
};

export const updatePipelineStage = async (stageId, data, tenantId) => {
  // Verify ownership via pipeline
  const existing = await prisma.pipelineStage.findFirst({
    where: { id: stageId, tenantId }
  });
  
  if (!existing) {
    throw new Error('Pipeline stage not found or access denied');
  }
  
  return prisma.pipelineStage.update({
    where: { id: stageId },
    data: {
      ...(data.name !== undefined && { name: data.name.trim() }),
      ...(data.order !== undefined && { order: data.order }),
      ...(data.probability !== undefined && { probability: data.probability }),
      ...(data.color !== undefined && { color: data.color }),
      ...(data.isClosedWon !== undefined && { isClosedWon: data.isClosedWon }),
      ...(data.isClosedLost !== undefined && { isClosedLost: data.isClosedLost }),
      ...(data.daysInStage !== undefined && { daysInStage: data.daysInStage })
    }
  });
};

export const deletePipelineStage = async (stageId, tenantId) => {
  // Verify ownership
  const existing = await prisma.pipelineStage.findFirst({
    where: { id: stageId, tenantId }
  });
  
  if (!existing) {
    throw new Error('Pipeline stage not found or access denied');
  }
  
  return prisma.pipelineStage.delete({
    where: { id: stageId }
  });
};

export const reorderPipelineStages = async (pipelineId, stageOrders, tenantId) => {
  // Verify pipeline ownership
  const pipeline = await prisma.pipeline.findFirst({
    where: { id: pipelineId, tenantId }
  });
  
  if (!pipeline) {
    throw new Error('Pipeline not found or access denied');
  }
  
  // stageOrders should be an array of { stageId, order }
  const updates = stageOrders.map(({ stageId, order }) =>
    prisma.pipelineStage.update({
      where: { id: stageId },
      data: { order }
    })
  );
  
  await prisma.$transaction(updates);
  
  return prisma.pipelineStage.findMany({
    where: { pipelineId },
    orderBy: { order: 'asc' }
  });
};

export const getDefaultPipeline = async (tenantId) => {
  const pipeline = await prisma.pipeline.findFirst({
    where: { tenantId, isDefault: true, isActive: true },
    include: {
      stages: { orderBy: { order: 'asc' } }
    }
  });
  
  if (!pipeline) {
    // Return first active pipeline as fallback
    return prisma.pipeline.findFirst({
      where: { tenantId, isActive: true },
      include: {
        stages: { orderBy: { order: 'asc' } }
      },
      orderBy: { createdAt: 'asc' }
    });
  }
  
  return pipeline;
};

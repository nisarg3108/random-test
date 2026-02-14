import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Get workflow templates by industry
export const getWorkflowTemplates = async (req, res) => {
  try {
    const { industry } = req.query;
    
    // First check if WorkflowTemplate table exists and has data
    const templates = await prisma.workflowTemplate.findMany({
      where: industry ? { industry } : {},
      orderBy: { isDefault: 'desc' }
    }).catch(async (error) => {
      // If table doesn't exist or is empty, return empty array
      console.log('WorkflowTemplate table issue:', error.message);
      return [];
    });
    
    res.json(templates || []);
  } catch (error) {
    console.error('Error fetching workflow templates:', error);
    res.json([]); // Return empty array instead of error
  }
};

// Setup company configuration during registration
export const setupCompanyConfig = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const {
      companyName,
      industry,
      size,
      enabledModules,
      workflowConfig,
      approvalLevels,
      customFields,
      businessRules
    } = req.body;

    // Check if config already exists
    const existingConfig = await prisma.companyConfig.findUnique({
      where: { tenantId }
    });

    let config;
    if (existingConfig) {
      // Update existing config
      config = await prisma.companyConfig.update({
        where: { tenantId },
        data: {
          companyName,
          industry,
          size,
          enabledModules,
          workflowConfig,
          approvalLevels,
          customFields: customFields || {},
          businessRules: businessRules || {}
        }
      });
    } else {
      // Create new config
      config = await prisma.companyConfig.create({
        data: {
          tenantId,
          companyName,
          industry,
          size,
          enabledModules,
          workflowConfig,
          approvalLevels,
          customFields: customFields || {},
          businessRules: businessRules || {}
        }
      });
    }

    // Create workflows based on configuration
    if (workflowConfig && Object.keys(workflowConfig).length > 0) {
      await createWorkflowsFromConfig(tenantId, workflowConfig);
    }

    res.json({ message: 'Company configuration setup successfully', config });
  } catch (error) {
    console.error('Setup company config error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Create workflows from configuration
const createWorkflowsFromConfig = async (tenantId, workflowConfig) => {
  try {
    for (const [module, config] of Object.entries(workflowConfig)) {
      for (const [action, steps] of Object.entries(config)) {
        // Check if workflow already exists
        const existingWorkflow = await prisma.workflow.findFirst({
          where: {
            tenantId,
            module: module.toUpperCase(),
            action: action.toUpperCase()
          }
        });

        let workflow;
        if (existingWorkflow) {
          // Update existing workflow
          workflow = await prisma.workflow.update({
            where: { id: existingWorkflow.id },
            data: { status: 'ACTIVE' }
          });
          
          // Delete existing steps
          await prisma.workflowStep.deleteMany({
            where: { workflowId: workflow.id }
          });
        } else {
          // Create new workflow
          workflow = await prisma.workflow.create({
            data: {
              tenantId,
              module: module.toUpperCase(),
              action: action.toUpperCase(),
              status: 'ACTIVE'
            }
          });
        }

        // Create workflow steps
        if (Array.isArray(steps)) {
          for (let i = 0; i < steps.length; i++) {
            await prisma.workflowStep.create({
              data: {
                workflowId: workflow.id,
                stepOrder: i + 1,
                permission: steps[i].permission || `${module.toLowerCase()}.approve`
              }
            });
          }
        }
      }
    }
  } catch (error) {
    console.error('Error creating workflows from config:', error);
    // Don't throw error, just log it
  }
};

// Update company configuration
export const updateCompanyConfig = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const updates = req.body;

    const config = await prisma.companyConfig.update({
      where: { tenantId },
      data: updates
    });

    res.json({ message: 'Configuration updated successfully', config });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get company configuration
export const getCompanyConfig = async (req, res) => {
  try {
    const { tenantId } = req.user;

    const config = await prisma.companyConfig.findUnique({
      where: { tenantId }
    });

    if (!config) {
      // Return default config instead of 404
      return res.json({
        tenantId,
        companyName: '',
        industry: '',
        size: 'SMALL',
        enabledModules: [],
        workflowConfig: {},
        approvalLevels: {},
        customFields: {},
        businessRules: {}
      });
    }

    res.json(config);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create custom approval matrix
export const createApprovalMatrix = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { module, conditions, approvers } = req.body;

    const matrix = await prisma.approvalMatrix.create({
      data: {
        tenantId,
        module,
        conditions,
        approvers
      }
    });

    res.json({ message: 'Approval matrix created successfully', matrix });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Add custom fields
export const addCustomField = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { module, fieldName, fieldType, options, required } = req.body;

    const customField = await prisma.customField.create({
      data: {
        tenantId,
        module,
        fieldName,
        fieldType,
        options,
        required
      }
    });

    res.json({ message: 'Custom field added successfully', customField });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


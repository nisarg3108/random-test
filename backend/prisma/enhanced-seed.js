import prisma from '../src/config/db.js';
import bcrypt from 'bcrypt';

const DAY_MS = 24 * 60 * 60 * 1000;
const addDays = (days) => new Date(Date.now() + (days * DAY_MS));
const addHours = (hours) => new Date(Date.now() + (hours * 60 * 60 * 1000));
const DEMO_PASSWORD = 'Demo@12345';

const upsertFirst = async (delegate, where, create, update = create) => {
  const existing = await delegate.findFirst({ where });
  if (existing) {
    return delegate.update({
      where: { id: existing.id },
      data: update
    });
  }
  return delegate.create({ data: create });
};

/**
 * Add more employees to each department (3-5 additional per department)
 * Expands from 5 total employees to 20+ employees with realistic distribution
 */
export const seedAdditionalEmployees = async (tenantId, departments, employees) => {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const additionalEmployeesData = [
    // Operations Department (5 total)
    {
      department: departments.operations,
      employees: [
        { name: 'Rajesh Gupta', code: 'EMP-0006', designation: 'Operations Manager', email: 'bhavsarnisarg0+rajesh@gmail.com', phone: '+91-90000-00006', joinDate: -240 },
        { name: 'Deepti Sharma', code: 'EMP-0007', designation: 'HR Specialist', email: 'bhavsarnisarg0+deepti@gmail.com', phone: '+91-90000-00007', joinDate: -180 },
        { name: 'Arjun Patel', code: 'EMP-0008', designation: 'Admin Coordinator', email: 'bhavsarnisarg0+arjun@gmail.com', phone: '+91-90000-00008', joinDate: -120 }
      ]
    },
    // Finance Department (5 total)
    {
      department: departments.finance,
      employees: [
        { name: 'Ananya Verma', code: 'EMP-0009', designation: 'Senior Accountant', email: 'bhavsarnisarg0+ananya@gmail.com', phone: '+91-90000-00009', joinDate: -210 },
        { name: 'Vikram Singh', code: 'EMP-0010', designation: 'Finance Analyst', email: 'bhavsarnisarg0+vikram@gmail.com', phone: '+91-90000-00010', joinDate: -150 },
        { name: 'Priya Desai', code: 'EMP-0011', designation: 'Accounts Receivable', email: 'bhavsarnisarg0+priya@gmail.com', phone: '+91-90000-00011', joinDate: -90 }
      ]
    },
    // Sales Department (5 total)
    {
      department: departments.sales,
      employees: [
        { name: 'Amit Kumar', code: 'EMP-0012', designation: 'Sales Manager', email: 'bhavsarnisarg0+amit@gmail.com', phone: '+91-90000-00012', joinDate: -200 },
        { name: 'Neha Joshi', code: 'EMP-0013', designation: 'Sales Executive', email: 'bhavsarnisarg0+neha@gmail.com', phone: '+91-90000-00013', joinDate: -160 },
        { name: 'Rahul Bhat', code: 'EMP-0014', designation: 'Customer Success Lead', email: 'bhavsarnisarg0+rahul@gmail.com', phone: '+91-90000-00014', joinDate: -100 }
      ]
    },
    // Engineering Department (6 total)
    {
      department: departments.engineering,
      employees: [
        { name: 'Shreya Iyer', code: 'EMP-0015', designation: 'Senior Engineer', email: 'bhavsarnisarg0+shreya@gmail.com', phone: '+91-90000-00015', joinDate: -220 },
        { name: 'Nikhil Reddy', code: 'EMP-0016', designation: 'DevOps Engineer', email: 'bhavsarnisarg0+nikhil@gmail.com', phone: '+91-90000-00016', joinDate: -170 },
        { name: 'Sanjana Kapoor', code: 'EMP-0017', designation: 'QA Engineer', email: 'bhavsarnisarg0+sanjana@gmail.com', phone: '+91-90000-00017', joinDate: -130 },
        { name: 'Roshan Nair', code: 'EMP-0018', designation: 'Junior Developer', email: 'bhavsarnisarg0+roshan@gmail.com', phone: '+91-90000-00018', joinDate: -80 }
      ]
    }
  ];

  const allNewEmployees = [];

  for (const deptGroup of additionalEmployeesData) {
    for (const empData of deptGroup.employees) {
      // Create user first
      const user = await upsertFirst(
        prisma.user,
        { email: empData.email },
        {
          email: empData.email,
          password: passwordHash,
          role: 'USER',
          status: 'ACTIVE',
          tenantId,
          departmentId: deptGroup.department.id,
          managerId: employees.manager.userId
        }
      );

      // Create employee record
      const employee = await upsertFirst(
        prisma.employee,
        { userId: user.id },
        {
          tenantId,
          userId: user.id,
          departmentId: deptGroup.department.id,
          managerId: employees.manager.id,
          employeeCode: empData.code,
          name: empData.name,
          email: empData.email,
          phone: empData.phone,
          designation: empData.designation,
          joiningDate: addDays(empData.joinDate),
          status: 'ACTIVE'
        }
      );

      // Create salary structure for each employee
      await upsertFirst(
        prisma.salaryStructure,
        { employeeId: employee.id },
        {
          tenantId,
          employeeId: employee.id,
          basicSalary: 55000 + Math.random() * 30000, // Random salary range
          allowances: {
            hra: (55000 + Math.random() * 30000) * 0.25,
            transport: 3000,
            medical: 2500
          },
          deductions: {
            pf: (55000 + Math.random() * 30000) * 0.12,
            tax: (55000 + Math.random() * 30000) * 0.08,
            insurance: 1000
          },
          netSalary: 65000 + Math.random() * 35000,
          effectiveFrom: addDays(-90)
        }
      );

      allNewEmployees.push(employee);
    }
  }

  return allNewEmployees;
};

/**
 * Add additional goods receipts with detail and warehouse allocations
 */
export const seedAdditionalGoodsReceipts = async (tenantId, users, warehouse, items, purchaseOrder) => {
  const goodsReceiptData = [
    {
      number: 'GRN-2026-0002',
      poId: purchaseOrder.id,
      receivedDate: -1,
      item: items.laptop,
      orderedQty: 24,
      receivedQty: 24,
      status: 'ACCEPTED'
    },
    {
      number: 'GRN-2026-0003',
      poId: purchaseOrder.id,
      receivedDate: 0,
      item: items.chair,
      orderedQty: 40,
      receivedQty: 40,
      status: 'INSPECTED'
    }
  ];

  const grList = [];

  for (const grData of goodsReceiptData) {
    const gr = await upsertFirst(
      prisma.goodsReceipt,
      { receiptNumber: grData.number },
      {
        tenantId,
        receiptNumber: grData.number,
        purchaseOrderId: grData.poId,
        receivedDate: addDays(grData.receivedDate),
        receivedBy: users.admin.id,
        items: [
          {
            itemName: grData.item.name,
            orderedQty: grData.orderedQty,
            receivedQty: grData.receivedQty,
            rejectedQty: 0,
            condition: 'GOOD',
            notes: 'Quality check passed'
          }
        ],
        status: grData.status,
        qualityStatus: 'PASSED',
        warehouseLocation: warehouse.name,
        notes: `Goods receipt for ${grData.item.name}`
      }
    );

    grList.push(gr);
  }

  return grList;
};

/**
 * Add warehouse stock movements (dispatch-like operations)
 */
export const seedWarehouseDispatchAndMovements = async (tenantId, users, warehouse, items) => {
  const dispatchData = [
    {
      movementNumber: 'SM-2026-0003',
      type: 'OUT',
      reason: 'TRANSFER',
      item: items.laptop,
      quantity: 5,
      reference: 'REQ-2026-001'
    },
    {
      movementNumber: 'SM-2026-0004',
      type: 'OUT',
      reason: 'SALES',
      item: items.chair,
      quantity: 8,
      reference: 'SO-2026-0002'
    },
    {
      movementNumber: 'SM-2026-0005',
      type: 'OUT',
      reason: 'MANUFACTURING',
      item: items.steelSheet,
      quantity: 50,
      reference: 'WO-2026-0002'
    }
  ];

  const movementList = [];

  for (const movData of dispatchData) {
    const movement = await upsertFirst(
      prisma.stockMovement,
      { tenantId, movementNumber: movData.movementNumber },
      {
        tenantId,
        movementNumber: movData.movementNumber,
        type: movData.type,
        reason: movData.reason,
        itemId: movData.item.id,
        warehouseId: warehouse.id,
        quantity: movData.quantity,
        referenceType: 'SALES_ORDER',
        referenceId: movData.reference,
        unitCost: movData.item.price,
        totalCost: movData.item.price * movData.quantity,
        status: 'COMPLETED',
        approvedBy: users.admin.id,
        approvedAt: addDays(-1),
        notes: `Warehouse dispatch for ${movData.item.name}`,
        createdBy: users.admin.id
      }
    );

    movementList.push(movement);
  }

  return movementList;
};

/**
 * Add finance approvals for various workflows
 */
export const seedFinanceApprovals = async (tenantId, users, employees) => {
  const approvalsData = [
    {
      type: 'PO_APPROVAL',
      referenceId: 'PO-2026-0001',
      amount: 492200,
      requestedBy: employees.manager.id,
      approvers: [{ userId: users.finance.id, level: 1 }, { userId: users.admin.id, level: 2 }]
    },
    {
      type: 'EXPENSE_CLAIM',
      referenceId: 'EC-2026-001',
      amount: 15000,
      requestedBy: employees.sales.id,
      approvers: [{ userId: users.manager.id, level: 1 }]
    },
    {
      type: 'BILL_PAYMENT',
      referenceId: 'BILL-2026-0001',
      amount: 200000,
      requestedBy: employees.finance.id,
      approvers: [{ userId: users.finance.id, level: 1 }, { userId: users.admin.id, level: 2 }]
    }
  ];

  const approvalsList = [];

  for (const appData of approvalsData) {
    const workflow = await upsertFirst(
      prisma.workflow,
      { tenantId, module: 'FINANCE', action: appData.type },
      { tenantId, module: 'FINANCE', action: appData.type, status: 'ACTIVE' }
    );

    const workflowRequest = await upsertFirst(
      prisma.workflowRequest,
      { tenantId, module: 'FINANCE', action: appData.type, createdBy: users.admin.id },
      { tenantId, workflowId: workflow.id, module: 'FINANCE', action: appData.type, payload: { referenceId: appData.referenceId, amount: appData.amount }, status: 'COMPLETED', createdBy: users.admin.id, requestedBy: appData.requestedBy }
    );

    for (let i = 0; i < appData.approvers.length; i++) {
      const approver = appData.approvers[i];
      const approval = await upsertFirst(
        prisma.approval,
        {
          tenantId,
          workflowId: workflow.id,
          workflowRequestId: workflowRequest.id,
          stepOrder: approver.level
        },
        {
          tenantId,
          workflowId: workflow.id,
          workflowRequestId: workflowRequest.id,
          stepOrder: approver.level,
          permission: `finance.approve.level${approver.level}`,
          data: {
            amount: appData.amount,
            referenceId: appData.referenceId,
            notes: `Demo approval for ${appData.type}`,
            attachments: ['/uploads/approvals/supporting-docs.pdf']
          },
          approvedBy: approver.userId,
          approvedAt: addDays(-i),
          status: 'APPROVED',
          comment: `Demo approval for ${appData.type}`
        }
      );

      approvalsList.push(approval);
    }
  }

  return approvalsList;
};

/**
 * Add comprehensive documents with folder structure and multiple files
 */
export const seedEnhancedDocuments = async (tenantId, users, employees) => {
  const folderStructure = [
    {
      name: 'Contracts',
      type: 'FOLDER',
      parent: null,
      documents: [
        { name: 'Customer Agreement - Acme.pdf', type: 'application/pdf', size: 248000, createdDate: -60 },
        { name: 'NDA - Confidentiality.pdf', type: 'application/pdf', size: 125000, createdDate: -45 },
        { name: 'Service Terms.docx', type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', size: 95000, createdDate: -30 }
      ]
    },
    {
      name: 'Financial Reports',
      type: 'FOLDER',
      parent: null,
      documents: [
        { name: 'Q1 2026 Financial Summary.xlsx', type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', size: 350000, createdDate: -14 },
        { name: 'Profit & Loss Statement.pdf', type: 'application/pdf', size: 180000, createdDate: -10 },
        { name: 'Balance Sheet March 2026.xlsx', type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', size: 240000, createdDate: -7 }
      ]
    },
    {
      name: 'HR & Compliance',
      type: 'FOLDER',
      parent: null,
      documents: [
        { name: 'Employee Handbook 2026.pdf', type: 'application/pdf', size: 512000, createdDate: -120 },
        { name: 'Code of Conduct.docx', type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', size: 285000, createdDate: -100 },
        { name: 'Leave Policy Guidelines.xlsx', type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', size: 95000, createdDate: -80 }
      ]
    },
    {
      name: 'Project Documentation',
      type: 'FOLDER',
      parent: null,
      documents: [
        { name: 'Factory Digitization Scope.pdf', type: 'application/pdf', size: 425000, createdDate: -30 },
        { name: 'Implementation Timeline.docx', type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', size: 175000, createdDate: -25 },
        { name: 'Risk Register.xlsx', type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', size: 145000, createdDate: -20 }
      ]
    },
    {
      name: 'Operations Manuals',
      type: 'FOLDER',
      parent: null,
      documents: [
        { name: 'Warehouse Operations Manual.pdf', type: 'application/pdf', size: 1024000, createdDate: -60 },
        { name: 'Quality Procedures.docx', type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', size: 445000, createdDate: -50 },
        { name: 'Safety Checklist.xlsx', type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', size: 125000, createdDate: -40 }
      ]
    }
  ];

  const documentsList = [];
  const folderMap = {};

  // Create folders first
  for (const folderData of folderStructure) {
    const folder = await upsertFirst(
      prisma.documentFolder,
      { tenantId, name: folderData.name },
      {
        tenantId,
        name: folderData.name,
        path: `/${folderData.name}`,
        createdBy: users.admin.id,
        createdAt: addDays(-90)
      }
    );
    folderMap[folderData.name] = folder.id;
    documentsList.push(folder);
  }

  // Create documents in each folder
  for (const folderData of folderStructure) {
    const folderId = folderMap[folderData.name];

    for (const docData of folderData.documents) {
      const document = await upsertFirst(
        prisma.document,
        { tenantId, name: docData.name, folderId },
        {
          tenantId,
          name: docData.name,
          fileName: docData.name,
          mimeType: docData.type,
          fileSize: docData.size,
          storagePath: `/uploads/documents/${folderData.name}/${docData.name.replace(/\s+/g, '-').toLowerCase()}`,
          folderId: folderId,
          isPublic: false,
          createdBy: users.admin.id,
          createdAt: addDays(docData.createdDate),
          description: `Sample ${docData.type} document for ${folderData.name}`
        }
      );

      documentsList.push(document);
    }
  }

  return documentsList;
};

/**
 * Add more vendors with comprehensive data
 */
export const seedAdditionalVendors = async (tenantId, users) => {
  const vendorsData = [
    {
      code: 'VEND-0002',
      name: 'Global Tech Supplies',
      contact: 'Alice Wong',
      email: 'alice@globaltech.example.com',
      phone: '+1-415-800-2222',
      city: 'San Francisco',
      category: 'IT_EQUIPMENT'
    },
    {
      code: 'VEND-0003',
      name: 'Premium Logistics Partners',
      contact: 'Carlos Martinez',
      email: 'carlos@premiumlogistics.example.com',
      phone: '+55-11-3000-3333',
      city: 'São Paulo',
      category: 'LOGISTICS'
    },
    {
      code: 'VEND-0004',
      name: 'Chemicals & Solvents Ltd',
      contact: 'Dr. Tanaka',
      email: 'procurement@chemsolv.example.com',
      phone: '+81-3-6000-4444',
      city: 'Tokyo',
      category: 'RAW_MATERIALS'
    }
  ];

  const vendorsList = [];

  for (const vendorData of vendorsData) {
    const vendor = await upsertFirst(
      prisma.vendor,
      { vendorCode: vendorData.code },
      {
        tenantId,
        vendorCode: vendorData.code,
        name: vendorData.name,
        contactPerson: vendorData.contact,
        email: vendorData.email,
        phone: vendorData.phone,
        city: vendorData.city,
        country: 'International',
        status: 'ACTIVE',
        category: vendorData.category,
        rating: 3.8 + Math.random() * 1.2,
        paymentTerms: 'NET45',
        creditLimit: 500000 + Math.random() * 1000000,
        currency: 'USD',
        notes: `Seed vendor for ${vendorData.category}`
      }
    );

    // Add evaluation record
    await upsertFirst(
      prisma.supplierEvaluation,
      { tenantId, vendorId: vendor.id, evaluationPeriod: 'Q1-2026-V' + vendorData.code },
      {
        tenantId,
        vendorId: vendor.id,
        evaluatedBy: users.finance.id,
        evaluationDate: addDays(-5),
        evaluationPeriod: 'Q1-2026-' + vendorData.code,
        qualityRating: 3.8 + Math.random() * 1.2,
        deliveryRating: 3.7 + Math.random() * 1.3,
        priceRating: 3.9 + Math.random() * 1.1,
        serviceRating: 3.8 + Math.random() * 1.2,
        communicationRating: 4 + Math.random() * 1,
        overallRating: 3.8 + Math.random() * 1.1,
        status: 'COMPLETED'
      }
    );

    vendorsList.push(vendor);
  }

  return vendorsList;
};

export default {
  seedAdditionalEmployees,
  seedAdditionalGoodsReceipts,
  seedWarehouseDispatchAndMovements,
  seedFinanceApprovals,
  seedEnhancedDocuments,
  seedAdditionalVendors
};

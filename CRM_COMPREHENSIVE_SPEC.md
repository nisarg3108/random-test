# CRM Module - Comprehensive Specification & Implementation Guide

**Document Version:** 1.0  
**Date:** February 8, 2026  
**Status:** Design Complete, Implementation Pending

---

## Executive Summary

This document specifies the complete Customer Relationship Management (CRM) system for the ERP platform, addressing current gaps and defining a production-ready implementation roadmap.

### Current State
- Basic CRUD operations for Customers, Contacts, Leads, Deals, Communications
- Frontend dashboard and list pages
- No customer 360 view, no sales linkage, security gaps in tenant scoping

### Target State
- Complete CRM with Customer 360, Sales Pipeline Management, Activity Tracking
- Full integration with Sales, Projects, Finance modules
- Advanced features: lead scoring, pipeline configuration, segmentation, reporting

---

## 1. Data Model Specification

### 1.1 Core Entity Enhancements

#### **Customer** (Enhancement)
```prisma
model Customer {
  id        String   @id @default(uuid())
  tenantId  String
  name      String
  
  // EXISTING FIELDS
  industry  String?
  website   String?
  status    String   @default("ACTIVE")
  notes     String?
  
  // NEW FIELDS
  type              String?  @default("BUSINESS") // BUSINESS | INDIVIDUAL
  companySize       String?  // SMALL | MEDIUM | LARGE | ENTERPRISE
  annualRevenue     Float?
  currencyCode      String?  @default("USD")
  
  // Contact Information
  primaryEmail      String?
  primaryPhone      String?
  billingAddress    Json?    // {street, city, state, zip, country}
  shippingAddress   Json?    // {street, city, state, zip, country}
  
  // Relationship Management
  ownerId           String?  // User responsible
  accountManager    String?  // User ID
  category          String?  // CUSTOMER | PARTNER | PROSPECT
  source            String?  // WEB | REFERRAL | EVENT | CAMPAIGN
  
  // Engagement
  firstContactDate  DateTime?
  lastContactDate   DateTime?
  preferredChannel  String?  // EMAIL | PHONE | SMS | IN_PERSON
  timezone          String?
  
  // Metadata
  tags              String[] // Array of tag strings
  customFields      Json?
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // RELATIONS
  contacts          Contact[]
  deals             Deal[]
  communications    Communication[]
  leads             Lead[]
  activities        Activity[]
  notes             CustomerNote[]
  attachments       Attachment[]
  
  // Sales Integration (NEW)
  salesQuotations   SalesQuotation[]
  salesOrders       SalesOrder[]
  salesInvoices     SalesInvoice[]
  
  // Project Integration (optional)
  projects          Project[]
  
  owner             User?    @relation("CustomerOwner", fields: [ownerId], references: [id])
  
  @@index([tenantId, status])
  @@index([tenantId, ownerId])
  @@index([tenantId, category])
}
```

#### **Contact** (Enhancement)
```prisma
model Contact {
  id         String   @id @default(uuid())
  tenantId   String
  customerId String
  
  // EXISTING
  name   String
  email  String?
  phone  String?
  title  String?
  status String   @default("ACTIVE")
  
  // NEW FIELDS
  firstName         String?
  lastName          String?
  jobTitle          String?
  department        String?
  role              String?  // DECISION_MAKER | INFLUENCER | USER | GATEKEEPER
  
  // Contact Details
  mobilePhone       String?
  workPhone         String?
  linkedinUrl       String?
  twitterHandle     String?
  
  // Relationship
  isPrimary         Boolean  @default(false)
  ownerId           String?  // User responsible
  preferredChannel  String?  // EMAIL | PHONE | SMS
  
  // Engagement
  lastContactDate   DateTime?
  birthday          DateTime?
  anniversary       DateTime?
  
  // Preferences
  emailOptIn        Boolean  @default(true)
  smsOptIn          Boolean  @default(false)
  doNotCall         Boolean  @default(false)
  
  // Metadata
  tags              String[]
  customFields      Json?
  notes             String?
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // RELATIONS
  customer          Customer       @relation(fields: [customerId], references: [id], onDelete: Cascade)
  communications    Communication[]
  leads             Lead[]
  activities        Activity[]
  
  owner             User?          @relation("ContactOwner", fields: [ownerId], references: [id])
  
  @@index([tenantId, customerId])
  @@index([tenantId, email])
  @@index([tenantId, ownerId])
}
```

#### **Lead** (Enhancement)
```prisma
model Lead {
  id        String   @id @default(uuid())
  tenantId  String
  
  // EXISTING
  name     String
  email    String?
  phone    String?
  company  String?
  source   String?
  status   String   @default("NEW") // NEW | QUALIFIED | CONVERTED | LOST | DISQUALIFIED
  notes    String?
  customerId String?
  contactId  String?
  
  // NEW FIELDS
  firstName         String?
  lastName          String?
  jobTitle          String?
  
  // Lead Classification
  leadScore         Int      @default(0) // 0-100
  rating            String?  // HOT | WARM | COLD
  priority          String?  @default("MEDIUM") // LOW | MEDIUM | HIGH
  
  // Source Tracking
  campaign          String?
  medium            String?  // ORGANIC | PAID | SOCIAL | REFERRAL | DIRECT
  referrer          String?
  
  // Qualification
  budget            Float?
  timeline          String?  // IMMEDIATE | 1_3_MONTHS | 3_6_MONTHS | 6_12_MONTHS | 12_PLUS_MONTHS
  authority         String?  // YES | NO | UNKNOWN
  need              String?  // EXPLICIT | IMPLIED
  
  // Assignment
  ownerId           String?  // User responsible
  assignedAt        DateTime?
  
  // Conversion
  convertedAt       DateTime?
  conversionSource  String?  // MANUAL | AUTOMATED
  dealId            String?  // Deal created from conversion
  
  // Engagement
  firstContactDate  DateTime?
  lastContactDate   DateTime?
  lastActivityDate  DateTime?
  
  // Disqualification
  disqualifiedAt    DateTime?
  disqualifiedBy    String?
  disqualifiedReason String?
  
  // Metadata
  tags              String[]
  customFields      Json?
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // RELATIONS
  customer          Customer?       @relation(fields: [customerId], references: [id])
  contact           Contact?        @relation(fields: [contactId], references: [id])
  communications    Communication[]
  activities        Activity[]
  deal              Deal?           @relation("LeadDeal", fields: [dealId], references: [id])
  
  owner             User?           @relation("LeadOwner", fields: [ownerId], references: [id])
  
  @@index([tenantId, status])
  @@index([tenantId, ownerId])
  @@index([tenantId, leadScore])
  @@index([tenantId, source])
}
```

#### **Deal/Opportunity** (Enhancement)
```prisma
model Deal {
  id        String   @id @default(uuid())
  tenantId  String
  customerId String
  
  // EXISTING
  name      String
  stage     String   @default("PROSPECTING")
  value     Float    @default(0)
  expectedCloseDate DateTime?
  status    String   @default("OPEN") // OPEN | WON | LOST
  notes     String?
  
  // NEW FIELDS
  dealNumber        String?  @unique
  
  // Pipeline
  pipelineId        String?  @default("default")
  stageOrder        Int?     @default(0)
  probability       Int?     @default(0) // 0-100
  
  // Financial
  amount            Float    @default(0)
  currencyCode      String?  @default("USD")
  discount          Float?   @default(0)
  tax               Float?   @default(0)
  total             Float?   @default(0)
  
  // Products/Services
  products          Json?    // [{productId, name, quantity, price, total}]
  
  // Assignment
  ownerId           String?  // User responsible
  teamMembers       String[] // Array of User IDs
  
  // Dates
  createdDate       DateTime @default(now())
  closedDate        DateTime?
  firstContactDate  DateTime?
  lastActivityDate  DateTime?
  
  // Competition
  competitors       String[] // Array of competitor names
  
  // Closure
  wonReason         String?
  lostReason        String?  // PRICE | COMPETITION | NO_BUDGET | TIMING | PRODUCT_FIT | OTHER
  lostToCompetitor  String?
  
  // Source
  leadId            String?  // Converted from lead
  source            String?  // INBOUND | OUTBOUND | REFERRAL | PARTNER
  
  // Metadata
  tags              String[]
  customFields      Json?
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // RELATIONS
  customer          Customer         @relation(fields: [customerId], references: [id], onDelete: Cascade)
  communications    Communication[]
  activities        Activity[]
  attachments       Attachment[]
  
  // Sales Integration (NEW)
  salesQuotations   SalesQuotation[]
  salesOrders       SalesOrder[]
  
  // Lead back-reference
  leadConverted     Lead[]          @relation("LeadDeal")
  
  owner             User?           @relation("DealOwner", fields: [ownerId], references: [id])
  pipeline          Pipeline?       @relation(fields: [pipelineId], references: [id])
  
  @@index([tenantId, customerId])
  @@index([tenantId, stage])
  @@index([tenantId, status])
  @@index([tenantId, ownerId])
  @@index([tenantId, expectedCloseDate])
}
```

#### **Communication** (Enhancement)
```prisma
model Communication {
  id        String   @id @default(uuid())
  tenantId  String
  
  // EXISTING
  type      String   // CALL | EMAIL | MEETING | NOTE | SMS | CHAT
  subject   String?
  notes     String
  occurredAt DateTime
  createdBy String?
  customerId String?
  contactId  String?
  leadId     String?
  
  // NEW FIELDS
  direction         String?  // INBOUND | OUTBOUND
  duration          Int?     // Minutes for calls/meetings
  outcome           String?  // SUCCESSFUL | NO_ANSWER | LEFT_MESSAGE | FOLLOW_UP_REQUIRED
  
  // Email specific
  emailFrom         String?
  emailTo           String?
  emailCc           String?
  
  // Meeting specific
  meetingLocation   String?
  meetingAttendees  String[] // Array of contact/user names
  
  // Integration
  dealId            String?
  activityId        String?  // Related activity/task
  
  // Attachments
  hasAttachments    Boolean  @default(false)
  attachmentCount   Int      @default(0)
  
  // Metadata
  tags              String[]
  customFields      Json?
  
  createdAt DateTime @default(now())
  
  // RELATIONS
  customer          Customer?   @relation(fields: [customerId], references: [id])
  contact           Contact?    @relation(fields: [contactId], references: [id])
  lead              Lead?       @relation(fields: [leadId], references: [id])
  deal              Deal?       @relation(fields: [dealId], references: [id])
  activity          Activity?   @relation(fields: [activityId], references: [id])
  attachments       Attachment[]
  
  creator           User?       @relation("CommCreator", fields: [createdBy], references: [id])
  
  @@index([tenantId, customerId])
  @@index([tenantId, contactId])
  @@index([tenantId, leadId])
  @@index([tenantId, dealId])
  @@index([tenantId, occurredAt])
}
```

### 1.2 New Supporting Entities

#### **Pipeline**
```prisma
model Pipeline {
  id          String   @id @default(uuid())
  tenantId    String
  name        String   // "Sales Pipeline", "Consulting Pipeline"
  description String?
  isDefault   Boolean  @default(false)
  isActive    Boolean  @default(true)
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  stages      PipelineStage[]
  deals       Deal[]
  
  @@unique([tenantId, name])
  @@index([tenantId, isDefault])
}
```

#### **PipelineStage**
```prisma
model PipelineStage {
  id          String   @id @default(uuid())
  tenantId    String
  pipelineId  String
  
  name        String   // "Prospecting", "Qualification", "Proposal"
  order       Int      // Display order
  probability Int      @default(0) // Default win probability 0-100
  color       String?  // Hex color for UI
  
  // Stage behavior
  isClosedWon Boolean  @default(false)
  isClosedLost Boolean @default(false)
  
  // Automation
  daysInStage Int?     // Alert if deal stays too long
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  pipeline    Pipeline @relation(fields: [pipelineId], references: [id], onDelete: Cascade)
  
  @@unique([pipelineId, name])
  @@unique([pipelineId, order])
  @@index([tenantId, pipelineId])
}
```

#### **Activity/Task**
```prisma
model Activity {
  id          String   @id @default(uuid())
  tenantId    String
  
  type        String   // TASK | CALL | EMAIL | MEETING | TODO
  subject     String
  description String?
  
  // Status
  status      String   @default("PENDING") // PENDING | IN_PROGRESS | COMPLETED | CANCELLED
  priority    String   @default("MEDIUM") // LOW | MEDIUM | HIGH | URGENT
  
  // Scheduling
  dueDate     DateTime?
  dueTime     String?  // HH:MM
  reminderAt  DateTime?
  
  // Completion
  completedAt DateTime?
  completedBy String?
  
  // Assignment
  assignedTo  String?  // User ID
  createdBy   String
  
  // Entity Relations
  customerId  String?
  contactId   String?
  leadId      String?
  dealId      String?
  
  // Result
  outcome     String?
  notes       String?
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // RELATIONS
  customer        Customer?       @relation(fields: [customerId], references: [id])
  contact         Contact?        @relation(fields: [contactId], references: [id])
  lead            Lead?           @relation(fields: [leadId], references: [id])
  deal            Deal?           @relation(fields: [dealId], references: [id])
  communications  Communication[]
  
  assignee        User?           @relation("ActivityAssignee", fields: [assignedTo], references: [id])
  creator         User            @relation("ActivityCreator", fields: [createdBy], references: [id])
  
  @@index([tenantId, assignedTo])
  @@index([tenantId, status])
  @@index([tenantId, dueDate])
  @@index([tenantId, customerId])
  @@index([tenantId, dealId])
}
```

#### **CustomerNote**
```prisma
model CustomerNote {
  id          String   @id @default(uuid())
  tenantId    String
  customerId  String
  
  title       String?
  content     String
  isPinned    Boolean  @default(false)
  
  createdBy   String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  customer    Customer @relation(fields: [customerId], references: [id], onDelete: Cascade)
  creator     User     @relation(fields: [createdBy], references: [id])
  
  @@index([tenantId, customerId])
}
```

#### **Attachment**
```prisma
model Attachment {
  id          String   @id @default(uuid())
  tenantId    String
  
  fileName    String
  fileSize    Int      // Bytes
  mimeType    String
  fileUrl     String   // S3/storage URL
  
  // Entity Relations (polymorphic)
  customerId      String?
  dealId          String?
  communicationId String?
  
  uploadedBy  String
  createdAt   DateTime @default(now())
  
  customer        Customer?      @relation(fields: [customerId], references: [id])
  deal            Deal?          @relation(fields: [dealId], references: [id])
  communication   Communication? @relation(fields: [communicationId], references: [id])
  
  uploader    User     @relation(fields: [uploadedBy], references: [id])
  
  @@index([tenantId, customerId])
  @@index([tenantId, dealId])
}
```

#### **Tag** (Optional - can use string arrays instead)
```prisma
model Tag {
  id          String   @id @default(uuid())
  tenantId    String
  name        String
  color       String?
  category    String?  // CUSTOMER | LEAD | DEAL | GENERAL
  
  usageCount  Int      @default(0)
  
  createdAt   DateTime @default(now())
  
  @@unique([tenantId, name, category])
  @@index([tenantId, category])
}
```

### 1.3 Sales Module Integration

**Update existing Sales models** in [backend/prisma/schema.prisma](backend/prisma/schema.prisma):

```prisma
model SalesQuotation {
  // ... existing fields ...
  
  // ADD THESE
  customerId    String?
  dealId        String?
  
  customer      Customer? @relation(fields: [customerId], references: [id])
  deal          Deal?     @relation(fields: [dealId], references: [id])
  
  @@index([tenantId, customerId])
  @@index([tenantId, dealId])
}

model SalesOrder {
  // ... existing fields ...
  
  // ADD THESE
  customerId    String?
  dealId        String?
  
  customer      Customer? @relation(fields: [customerId], references: [id])
  deal          Deal?     @relation(fields: [dealId], references: [id])
  
  @@index([tenantId, customerId])
  @@index([tenantId, dealId])
}

model SalesInvoice {
  // ... existing fields ...
  
  // ADD THESE
  customerId    String?
  
  customer      Customer? @relation(fields: [customerId], references: [id])
  
  @@index([tenantId, customerId])
}
```

---

## 2. API Specification

### 2.1 Customer Endpoints

#### **GET /api/crm/customers**
List customers with filtering, sorting, pagination.

**Query Parameters:**
- `status` - Filter by status (ACTIVE, INACTIVE)
- `category` - Filter by category
- `ownerId` - Filter by owner
- `tags` - Filter by tags (comma-separated)
- `search` - Search name, email, phone
- `page`, `limit` - Pagination
- `sortBy`, `sortOrder` - Sorting

**Response:**
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

#### **GET /api/crm/customers/:id**
Get customer details with related data.

**Query Parameters:**
- `include` - Comma-separated: `contacts,deals,communications,activities,notes,sales`

**Response:**
```json
{
  "id": "uuid",
  "name": "Acme Corp",
  // ... all customer fields ...
  "contacts": [...],
  "deals": [...],
  "communications": [...],
  "activities": [...],
  "notes": [...],
  "salesQuotations": [...],
  "salesOrders": [...],
  "salesInvoices": [...]
}
```

#### **POST /api/crm/customers**
Create customer.

**Request Body:**
```json
{
  "name": "Acme Corp",
  "type": "BUSINESS",
  "industry": "Technology",
  "website": "https://acme.com",
  "primaryEmail": "info@acme.com",
  "primaryPhone": "+1234567890",
  "billingAddress": {...},
  "ownerId": "user-uuid",
  "category": "CUSTOMER",
  "source": "WEB",
  "tags": ["enterprise", "tech"]
}
```

#### **PUT /api/crm/customers/:id**
Update customer (with tenant scoping).

#### **DELETE /api/crm/customers/:id**
Delete customer (with tenant scoping, cascade considerations).

#### **POST /api/crm/customers/:id/notes**
Add note to customer.

#### **GET /api/crm/customers/:id/timeline**
Get customer timeline (all communications, activities, deals in chronological order).

#### **POST /api/crm/customers/:id/merge**
Merge duplicate customers.

### 2.2 Contact Endpoints

#### **GET /api/crm/contacts**
List contacts with filtering.

**Query Parameters:**
- `customerId` - Filter by customer
- `role` - Filter by role
- `ownerId` - Filter by owner
- `search` - Search name, email, phone
- Pagination/sorting

#### **GET /api/crm/contacts/:id**
Get contact details.

#### **POST /api/crm/contacts**
Create contact.

#### **PUT /api/crm/contacts/:id**
Update contact (with tenant scoping).

#### **DELETE /api/crm/contacts/:id**
Delete contact (with tenant scoping).

#### **PUT /api/crm/contacts/:id/set-primary**
Set as primary contact for customer.

### 2.3 Lead Endpoints

#### **GET /api/crm/leads**
List leads with filtering.

**Query Parameters:**
- `status` - NEW, QUALIFIED, CONVERTED, LOST
- `ownerId` - Assigned user
- `source` - Lead source
- `rating` - HOT, WARM, COLD
- `minScore`, `maxScore` - Lead score range
- Pagination/sorting

#### **GET /api/crm/leads/:id**
Get lead details.

#### **POST /api/crm/leads**
Create lead.

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "company": "Example Inc",
  "jobTitle": "CTO",
  "source": "Website Form",
  "campaign": "Q1 2026 Campaign",
  "ownerId": "user-uuid",
  "tags": ["high-value"]
}
```

#### **PUT /api/crm/leads/:id**
Update lead (with tenant scoping).

#### **POST /api/crm/leads/:id/convert**
Convert lead to customer/contact/deal.

**Request Body:**
```json
{
  "createCustomer": true,
  "createContact": true,
  "createDeal": true,
  "dealName": "Example Inc - Implementation",
  "dealValue": 50000,
  "dealStage": "QUALIFICATION"
}
```

**Response:**
```json
{
  "lead": {...},
  "customer": {...},
  "contact": {...},
  "deal": {...}
}
```

#### **PUT /api/crm/leads/:id/score**
Update lead score (can be automated or manual).

#### **POST /api/crm/leads/:id/disqualify**
Disqualify lead with reason.

### 2.4 Deal/Pipeline Endpoints

#### **GET /api/crm/pipelines**
List pipelines for tenant.

#### **GET /api/crm/pipelines/:id**
Get pipeline with stages.

#### **POST /api/crm/pipelines**
Create pipeline.

#### **PUT /api/crm/pipelines/:id**
Update pipeline.

#### **DELETE /api/crm/pipelines/:id**
Delete pipeline (if no deals).

#### **GET /api/crm/deals**
List deals with filtering.

**Query Parameters:**
- `pipelineId` - Filter by pipeline
- `stage` - Filter by stage
- `status` - OPEN, WON, LOST
- `customerId` - Filter by customer
- `ownerId` - Filter by owner
- `minValue`, `maxValue` - Deal value range
- `expectedCloseDateFrom`, `expectedCloseDateTo` - Date range
- Pagination/sorting

#### **GET /api/crm/deals/:id**
Get deal details with all relations.

#### **POST /api/crm/deals**
Create deal.

**Request Body:**
```json
{
  "name": "Acme Corp - Enterprise License",
  "customerId": "customer-uuid",
  "pipelineId": "pipeline-uuid",
  "stage": "PROSPECTING",
  "amount": 100000,
  "currencyCode": "USD",
  "expectedCloseDate": "2026-06-30",
  "probability": 25,
  "ownerId": "user-uuid",
  "products": [
    {"productId": "prod-1", "name": "License", "quantity": 10, "price": 10000}
  ],
  "tags": ["enterprise", "annual"]
}
```

#### **PUT /api/crm/deals/:id**
Update deal (with tenant scoping).

#### **PUT /api/crm/deals/:id/stage**
Move deal to new stage.

**Request Body:**
```json
{
  "stage": "PROPOSAL",
  "notes": "Sent proposal document",
  "updateProbability": true
}
```

#### **POST /api/crm/deals/:id/win**
Mark deal as won.

**Request Body:**
```json
{
  "closedDate": "2026-02-08",
  "wonReason": "Best value proposition",
  "createSalesOrder": true
}
```

#### **POST /api/crm/deals/:id/lose**
Mark deal as lost.

**Request Body:**
```json
{
  "closedDate": "2026-02-08",
  "lostReason": "PRICE",
  "lostToCompetitor": "Competitor X",
  "notes": "They offered 20% lower price"
}
```

#### **DELETE /api/crm/deals/:id**
Delete deal (with tenant scoping).

### 2.5 Communication Endpoints

#### **GET /api/crm/communications**
List communications with filtering.

**Query Parameters:**
- `customerId`, `contactId`, `leadId`, `dealId` - Filter by entity
- `type` - CALL, EMAIL, MEETING, NOTE
- `dateFrom`, `dateTo` - Date range
- `createdBy` - Filter by creator
- Pagination/sorting

#### **GET /api/crm/communications/:id**
Get communication details.

#### **POST /api/crm/communications**
Create communication log.

**Request Body:**
```json
{
  "type": "CALL",
  "subject": "Follow-up call",
  "notes": "Discussed implementation timeline",
  "occurredAt": "2026-02-08T14:30:00Z",
  "direction": "OUTBOUND",
  "duration": 30,
  "outcome": "SUCCESSFUL",
  "customerId": "customer-uuid",
  "contactId": "contact-uuid",
  "dealId": "deal-uuid"
}
```

#### **PUT /api/crm/communications/:id**
Update communication.

#### **DELETE /api/crm/communications/:id**
Delete communication.

### 2.6 Activity/Task Endpoints

#### **GET /api/crm/activities**
List activities/tasks.

**Query Parameters:**
- `assignedTo` - Filter by assignee
- `status` - PENDING, IN_PROGRESS, COMPLETED
- `priority` - LOW, MEDIUM, HIGH, URGENT
- `type` - TASK, CALL, EMAIL, MEETING
- `dueDate` - Filter by due date
- `customerId`, `dealId`, `leadId` - Filter by entity
- `overdue` - Boolean: show only overdue
- Pagination/sorting

#### **GET /api/crm/activities/:id**
Get activity details.

#### **POST /api/crm/activities**
Create activity/task.

**Request Body:**
```json
{
  "type": "CALL",
  "subject": "Follow-up with John Doe",
  "description": "Discuss pricing and close deal",
  "status": "PENDING",
  "priority": "HIGH",
  "dueDate": "2026-02-10",
  "dueTime": "14:00",
  "reminderAt": "2026-02-10T13:30:00Z",
  "assignedTo": "user-uuid",
  "customerId": "customer-uuid",
  "dealId": "deal-uuid"
}
```

#### **PUT /api/crm/activities/:id**
Update activity.

#### **PUT /api/crm/activities/:id/complete**
Mark activity as completed.

**Request Body:**
```json
{
  "outcome": "Customer agreed to proposal",
  "notes": "Moving to next stage",
  "completedAt": "2026-02-08T16:00:00Z"
}
```

#### **DELETE /api/crm/activities/:id**
Delete activity.

### 2.7 Reporting & Analytics Endpoints

#### **GET /api/crm/dashboard/stats**
Get dashboard statistics.

**Response:**
```json
{
  "customers": {
    "total": 250,
    "active": 230,
    "newThisMonth": 12
  },
  "leads": {
    "total": 180,
    "new": 45,
    "qualified": 28,
    "converted": 15
  },
  "deals": {
    "total": 65,
    "open": 42,
    "value": 2500000,
    "wonThisMonth": 8,
    "wonValue": 450000
  },
  "activities": {
    "pending": 28,
    "overdue": 5,
    "completedToday": 12
  }
}
```

#### **GET /api/crm/reports/sales-funnel**
Get sales funnel metrics.

#### **GET /api/crm/reports/conversion-rates**
Get lead-to-customer conversion rates.

#### **GET /api/crm/reports/deal-forecast**
Get pipeline forecast by stage/month.

#### **GET /api/crm/reports/activity-summary**
Get activity summary by user/type/date.

### 2.8 Utility Endpoints

#### **GET /api/crm/search**
Global CRM search (customers, contacts, leads, deals).

**Query Parameters:**
- `q` - Search term
- `types` - Comma-separated: customer,contact,lead,deal
- `limit` - Results per type

#### **POST /api/crm/import**
Bulk import (CSV/Excel).

#### **GET /api/crm/export**
Export data (CSV/Excel/PDF).

#### **POST /api/crm/dedupe/scan**
Scan for duplicates.

#### **POST /api/crm/dedupe/merge**
Merge duplicate records.

---

## 3. Frontend UI Specification

### 3.1 Page Map

```
/crm
├── /crm                           (CRM Dashboard)
├── /crm/customers                 (Customer List)
├── /crm/customers/:id             (Customer 360 Detail) ⭐ NEW
├── /crm/contacts                  (Contact List)
├── /crm/contacts/:id              (Contact Detail) ⭐ NEW
├── /crm/leads                     (Lead List)
├── /crm/leads/:id                 (Lead Detail) ⭐ NEW
├── /crm/pipeline                  (Pipeline Kanban View)
├── /crm/pipeline/config           (Pipeline Configuration) ⭐ NEW
├── /crm/deals                     (Deal List) ⭐ NEW
├── /crm/deals/:id                 (Deal Detail) ⭐ NEW
├── /crm/communications            (Communication History)
├── /crm/activities                (Activity/Task Management) ⭐ NEW
├── /crm/reports                   (CRM Reports Dashboard) ⭐ NEW
└── /crm/settings                  (CRM Settings) ⭐ NEW
```

### 3.2 CRM Dashboard Enhancements

**Current Issues:**
- Shows 0 for all stats (API response parsing bug)
- Limited metrics
- No charts

**Redesign:**

**Layout:**
```
+--------------------------------------------------+
|  CRM Dashboard                        [Date Range]|
+--------------------------------------------------+
|  [Total Customers] [Active Leads] [Open Deals]   |
|  [Pipeline Value]  [Won This Month] [Conversion] |
+--------------------------------------------------+
|  Sales Funnel Chart      |   Deal Forecast Chart |
+--------------------------------------------------+
|  Recent Activities       |   Upcoming Tasks      |
+--------------------------------------------------+
|  Top Customers           |   Hot Leads           |
+--------------------------------------------------+
```

**Components:**
- Stat cards with trends (↑ ↓)
- Sales funnel visualization
- Deal forecast by month
- Activity feed
- Task list with overdue highlighting
- Top customers by revenue
- Hot leads requiring action

### 3.3 Customer 360 Page ⭐ NEW

**Route:** `/crm/customers/:id`

**Layout:**
```
+------------------------------------------------------------------+
|  ← Back to Customers    Acme Corp                    [Actions ▼] |
+------------------------------------------------------------------+
|  Overview | Contacts | Deals | Communications | Sales | Projects  |
|           |          |       | Activities       | Docs  | Notes    |
+------------------------------------------------------------------+
|  HEADER SECTION                                                   |
|  ┌─────────────────────────────────────────────────────────────┐ |
|  │ [Logo]  Acme Corp                           Status: Active   │ |
|  │         Technology | Enterprise              Owner: John Smith│ |
|  │         info@acme.com | +1-555-1234                          │ |
|  │         [Edit] [Email] [Call] [Schedule] [More ▼]           │ |
|  └─────────────────────────────────────────────────────────────┘ |
|                                                                   |
|  [TAB CONTENT AREA]                                              |
|                                                                   |
|  OVERVIEW TAB:                                                   |
|  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────┐|
|  │ Quick Stats      │  │ Recent Activity  │  │ Key Metrics    │|
|  │ • 5 Contacts     │  │ • Call yesterday │  │ • Total Value  │|
|  │ • 3 Active Deals │  │ • Meeting today  │  │ • 12 Orders    │|
|  │ • $250K Pipeline │  │ • Email sent     │  │ • 90 Day Rev   │|
|  └──────────────────┘  └──────────────────┘  └────────────────┘|
|                                                                   |
|  Details:                                                         |
|  Industry: Technology          Company Size: Enterprise          |
|  Website: acme.com             Annual Revenue: $10M              |
|  Billing Address: ...          Shipping Address: ...             |
|  Tags: [enterprise] [tech] [high-value]                          |
|                                                                   |
|  CONTACTS TAB:                                                   |
|  [+ Add Contact]                                        [Search] |
|  ┌─────────────────────────────────────────────────────────────┐|
|  │ Name          │ Title         │ Email         │ Phone        │|
|  │ John Doe ⭐   │ CEO           │ john@...      │ +1-555-1000 │|
|  │ Jane Smith    │ CTO           │ jane@...      │ +1-555-1001 │|
|  └─────────────────────────────────────────────────────────────┘|
|                                                                   |
|  DEALS TAB:                                                      |
|  [+ Add Deal]                                                    |
|  ┌─────────────────────────────────────────────────────────────┐|
|  │ Deal Name            │ Stage      │ Value    │ Close Date   │|
|  │ Enterprise License   │ Proposal   │ $100K    │ Mar 31, 2026 │|
|  │ Support Contract     │ Negotiation│ $50K     │ Feb 28, 2026 │|
|  └─────────────────────────────────────────────────────────────┘|
|                                                                   |
|  COMMUNICATIONS TAB:                                             |
|  [+ Log Communication]                            [Filter ▼]     |
|  Timeline of all interactions (calls, emails, meetings, notes)   |
|                                                                   |
|  SALES TAB:                                                      |
|  Shows all Quotations, Orders, Invoices linked to this customer  |
|                                                                   |
|  NOTES TAB:                                                      |
|  [+ Add Note]                                                    |
|  Pinned and regular notes                                        |
+------------------------------------------------------------------+
```

**Actions Dropdown:**
- Edit Customer
- Add Contact
- Create Deal
- Log Communication
- Schedule Activity
- Send Email
- Make Call
- View Sales Documents
- Export Data
- Delete Customer

### 3.4 Lead Detail Page ⭐ NEW

**Route:** `/crm/leads/:id`

**Layout:**
```
+------------------------------------------------------------------+
|  ← Back to Leads    John Doe - Example Inc       [Convert Lead]  |
+------------------------------------------------------------------+
|  Overview | Activities | Communications | Timeline                |
+------------------------------------------------------------------+
|  HEADER                                                           |
|  ┌─────────────────────────────────────────────────────────────┐ |
|  │ 🔥 HOT Lead                          Score: 85/100           │ |
|  │ John Doe                             Status: Qualified       │ |
|  │ CTO @ Example Inc                    Owner: Sales Rep        │ |
|  │ john@example.com | +1-555-5678                               │ |
|  │                                                               │ |
|  │ Lead Score Breakdown:                                        │ |
|  │ ████████████████░░░░ Engagement: 80%                        │ |
|  │ ███████████████░░░░░ Demographics: 75%                      │ |
|  │ ████████████████████ Budget: 100%                           │ |
|  │                                                               │ |
|  │ [Call] [Email] [Schedule Meeting] [Convert] [Disqualify]    │ |
|  └─────────────────────────────────────────────────────────────┘ |
|                                                                   |
|  OVERVIEW:                                                       |
|  Source: Website Form → Q1 2026 Campaign                         |
|  Timeline: Immediate                Budget: $50K-$100K           |
|  Authority: Yes                     Need: High                   |
|  Tags: [enterprise] [hot-lead] [decision-maker]                  |
|                                                                   |
|  Next Steps:                                                     |
|  ☑ Initial contact made                                          |
|  ☑ Qualification call completed                                  |
|  ☐ Send proposal (Due: Feb 12)                                   |
|  ☐ Follow-up meeting (Due: Feb 15)                               |
|                                                                   |
|  CONVERT LEAD MODAL:                                             |
|  ┌─────────────────────────────────────────────────────────────┐|
|  │ Convert Lead to Customer                                     │|
|  │                                                               │|
|  │ ☑ Create Customer: Example Inc                               │|
|  │ ☑ Create Contact: John Doe                                   │|
|  │ ☑ Create Deal:                                               │|
|  │   Deal Name: [Example Inc - Implementation________]          │|
|  │   Pipeline: [Sales Pipeline ▼]                               │|
|  │   Stage: [Qualification ▼]                                   │|
|  │   Value: [$75,000___________]                                │|
|  │                                                               │|
|  │ [Cancel] [Convert Lead]                                      │|
|  └─────────────────────────────────────────────────────────────┘|
+------------------------------------------------------------------+
```

### 3.5 Pipeline Kanban View Enhancement

**Current:** Basic stage columns with deals
**Improved:** Drag-and-drop, filters, pipeline switcher

**Layout:**
```
+------------------------------------------------------------------+
|  Sales Pipeline                  [Pipeline: Sales ▼] [Config]    |
+------------------------------------------------------------------+
|  Filters: [Owner ▼] [Date Range ▼] [Value Range ▼] [Search...]  |
+------------------------------------------------------------------+
|  Pipeline Value: $2.5M    |  Weighted Value: $1.8M  |  45 Deals  |
+------------------------------------------------------------------+
|  Prospecting    Qualification   Proposal      Negotiation   Won  |
|     (25%)           (50%)          (75%)          (90%)     (100%)|
|  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌─┐|
|  │ Deal A   │   │ Deal D   │   │ Deal G   │   │ Deal J   │   │ │|
|  │ $50K     │   │ $100K    │   │ $75K     │   │ $125K    │   └─┘|
|  │ Acme ⌚  │   │ TechCo   │   │ StartUp  │   │ BigCorp  │      |
|  └──────────┘   └──────────┘   └──────────┘   └──────────┘      |
|  ┌──────────┐   ┌──────────┐   ┌──────────┐                     |
|  │ Deal B   │   │ Deal E   │   │ Deal H   │                     |
|  │ $25K     │   │ $80K     │   │ $60K     │                     |
|  │ Corp 🔥  │   │ Inc      │   │ LLC      │                     |
|  └──────────┘   └──────────┘   └──────────┘                     |
|  ┌──────────┐   ┌──────────┐                                    |
|  │ Deal C   │   │ Deal F   │                                    |
|  │ $35K     │   │ $90K     │                                    |
|  │ Ltd      │   │ Group    │                                    |
|  └──────────┘   └──────────┘                                    |
|                                                                   |
|  Total: 3    Total: 3      Total: 2       Total: 1     Total: 0 |
|  $110K       $270K         $135K          $125K         $0       |
+------------------------------------------------------------------+
```

**Features:**
- Drag-and-drop to move deals between stages
- Click deal card to open detail modal/page
- Visual indicators: 🔥 hot deal, ⌚ overdue, 🎯 high value
- Stage probabilities shown
- Totals per stage
- Pipeline switcher to view different pipelines

### 3.6 Deal Detail Page ⭐ NEW

**Route:** `/crm/deals/:id`

Similar to Customer 360, with tabs for:
- Overview (deal info, products, timeline)
- Activities & Tasks
- Communications
- Sales Documents (linked quotes/orders)
- Team (assigned users)
- Files & Attachments

### 3.7 Activity/Task Management Page ⭐ NEW

**Route:** `/crm/activities`

**Layout:**
```
+------------------------------------------------------------------+
|  Activities & Tasks                         [+ New Activity]     |
+------------------------------------------------------------------+
|  My Tasks | Team Tasks | All                                     |
+------------------------------------------------------------------+
|  Filters: [Type ▼] [Status ▼] [Priority ▼] [Due Date ▼]        |
|  [Show Overdue Only] [Show Completed]                           |
+------------------------------------------------------------------+
|  Overdue (3)                                                     |
|  ┌─────────────────────────────────────────────────────────────┐|
|  │ 🔴 HIGH  Call John Doe           Overdue 2 days   [Complete]│|
|  │         Deal: Example Inc - Impl  Customer: Example Inc     │|
|  └─────────────────────────────────────────────────────────────┘|
|                                                                   |
|  Today (5)                                                       |
|  ┌─────────────────────────────────────────────────────────────┐|
|  │ 🟠 MED   Send proposal           Due: Today 3PM   [Complete]│|
|  │         Deal: Acme Corp License   Customer: Acme Corp       │|
|  └─────────────────────────────────────────────────────────────┘|
|                                                                   |
|  This Week (7)                                                   |
|  ...                                                             |
|                                                                   |
|  Later (15)                                                      |
|  ...                                                             |
+------------------------------------------------------------------+
```

### 3.8 CRM Reports Dashboard ⭐ NEW

**Route:** `/crm/reports`

**Reports:**
- Sales Funnel Conversion
- Pipeline Forecast
- Won/Lost Analysis
- Lead Source Performance
- User Activity Report
- Customer Lifetime Value
- Revenue by Customer Segment
- Activity Completion Rate

Each report with filters, date ranges, export options.

---

## 4. Implementation Phases

### Phase 1: Critical Fixes & Foundation (Week 1)
**Priority:** CRITICAL - Security & Data Issues

**Tasks:**
1. ✅ Add tenant scoping to all CRM update/delete operations
2. ✅ Fix CRM dashboard API response parsing
3. ✅ Add Customer/Deal foreign keys to Sales module
4. ✅ Create Prisma migration for sales-CRM linkage
5. ✅ Update sales API to accept `customerId` and `dealId`
6. ✅ Add basic validation and error handling

**Deliverables:**
- Secure CRM operations
- Working dashboard stats
- Sales-CRM data linkage

**Files to Modify:**
- `backend/src/modules/crm/*.service.js` (add tenant scoping)
- `backend/prisma/schema.prisma` (sales FK additions)
- `frontend/src/pages/crm/CRMDashboard.jsx` (fix data access)
- `frontend/src/api/crm.api.js` (ensure consistency)

---

### Phase 2: Enhanced Data Model (Week 2)
**Priority:** HIGH - Core Features

**Tasks:**
1. ✅ Add Pipeline and PipelineStage models
2. ✅ Add Activity/Task model
3. ✅ Add Attachment model
4. ✅ Enhance Customer model (all new fields)
5. ✅ Enhance Contact model (all new fields)
6. ✅ Enhance Lead model (scoring, qualification fields)
7. ✅ Enhance Deal model (pipeline linkage, products)
8. ✅ Enhance Communication model (improved tracking)
9. ✅ Add CustomerNote model
10. ✅ Create comprehensive migration
11. ✅ Update all CRM services to use new fields
12. ✅ Add seed data for default pipeline

**Deliverables:**
- Complete CRM data model
- Database migration applied
- Default pipeline configured

**Files:**
- `backend/prisma/schema.prisma`
- `backend/prisma/migrations/`
- `backend/src/modules/crm/*.service.js`

---

### Phase 3: Customer 360 & Detail Pages (Week 3)
**Priority:** HIGH - User Experience

**Tasks:**
1. ✅ Build Customer 360 page component
2. ✅ Add customer detail API endpoint with relations
3. ✅ Create tabs: Overview, Contacts, Deals, Communications, Sales, Notes
4. ✅ Build contact detail page
5. ✅ Build lead detail page with conversion UI
6. ✅ Add customer timeline/activity feed
7. ✅ Implement customer notes functionality
8. ✅ Add related sales documents view
9. ✅ Create action buttons and modals
10. ✅ Add routing and navigation

**Deliverables:**
- Customer 360 page fully functional
- Contact and lead detail pages
- Enhanced navigation

**Files:**
- `frontend/src/pages/crm/CustomerDetail.jsx` (new)
- `frontend/src/pages/crm/ContactDetail.jsx` (new)
- `frontend/src/pages/crm/LeadDetail.jsx` (new)
- `frontend/src/components/crm/*` (new components)
- `frontend/src/App.jsx` (add routes)
- `backend/src/modules/crm/customer.controller.js`
- `backend/src/modules/crm/customer.service.js`

---

### Phase 4: Pipeline & Deal Management (Week 4)
**Priority:** HIGH - Core CRM Feature

**Tasks:**
1. ✅ Build pipeline configuration page
2. ✅ Add pipeline management API endpoints
3. ✅ Enhance pipeline Kanban view with drag-and-drop
4. ✅ Build deal detail page
5. ✅ Add deal stage transition with automation
6. ✅ Implement win/loss tracking
7. ✅ Add deal products/services management
8. ✅ Create deal list view (alternative to Kanban)
9. ✅ Add deal filters and search
10. ✅ Integrate with sales order creation

**Deliverables:**
- Configurable pipelines
- Enhanced deal management
- Drag-and-drop Kanban

**Files:**
- `frontend/src/pages/crm/PipelineConfig.jsx` (new)
- `frontend/src/pages/crm/DealDetail.jsx` (new)
- `frontend/src/pages/crm/DealList.jsx` (new)
- `frontend/src/pages/crm/SalesPipeline.jsx` (enhance)
- `backend/src/modules/crm/pipeline.controller.js` (new)
- `backend/src/modules/crm/pipeline.service.js` (new)
- `backend/src/modules/crm/deal.controller.js` (enhance)
- `backend/src/modules/crm/deal.service.js` (enhance)

---

### Phase 5: Activity & Task Management (Week 5)
**Priority:** MEDIUM - Productivity

**Tasks:**
1. ✅ Build activity/task management page
2. ✅ Add activity API endpoints
3. ✅ Create activity creation modal
4. ✅ Add activity completion workflow
5. ✅ Implement reminders and notifications
6. ✅ Add activity filters (overdue, priority, assigned)
7. ✅ Create activity timeline component
8. ✅ Link activities to all CRM entities
9. ✅ Add calendar integration hooks
10. ✅ Build activity widgets for dashboard

**Deliverables:**
- Complete task management system
- Activity tracking across CRM

**Files:**
- `frontend/src/pages/crm/Activities.jsx` (new)
- `frontend/src/components/crm/ActivityModal.jsx` (new)
- `frontend/src/components/crm/ActivityTimeline.jsx` (new)
- `backend/src/modules/crm/activity.controller.js` (new)
- `backend/src/modules/crm/activity.service.js` (new)

---

### Phase 6: Lead Scoring & Conversion (Week 6)
**Priority:** MEDIUM - Sales Automation

**Tasks:**
1. ✅ Implement lead scoring algorithm
2. ✅ Add lead score calculation endpoint
3. ✅ Build lead scoring configuration UI
4. ✅ Enhance lead conversion workflow
5. ✅ Add duplicate detection on conversion
6. ✅ Implement lead nurturing workflows
7. ✅ Add lead source tracking and analytics
8. ✅ Create lead qualification form
9. ✅ Build lead assignment rules
10. ✅ Add bulk lead operations

**Deliverables:**
- Automated lead scoring
- Smart lead conversion
- Lead management workflows

**Files:**
- `backend/src/modules/crm/lead.service.js` (enhance)
- `backend/src/modules/crm/lead-scoring.service.js` (new)
- `frontend/src/pages/crm/Leads.jsx` (enhance)
- `frontend/src/pages/crm/LeadDetail.jsx` (enhance)

---

### Phase 7: Enhanced Dashboard & Reporting (Week 7)
**Priority:** MEDIUM - Analytics

**Tasks:**
1. ✅ Redesign CRM dashboard with charts
2. ✅ Add sales funnel visualization
3. ✅ Create pipeline forecast charts
4. ✅ Build CRM reports page
5. ✅ Add report: Conversion rates
6. ✅ Add report: Won/Lost analysis
7. ✅ Add report: Lead source performance
8. ✅ Add report: User activity
9. ✅ Implement report filters and export
10. ✅ Add real-time dashboard updates

**Deliverables:**
- Enhanced dashboard with charts
- Comprehensive reporting suite

**Files:**
- `frontend/src/pages/crm/CRMDashboard.jsx` (major enhancement)
- `frontend/src/pages/crm/Reports.jsx` (new)
- `frontend/src/components/crm/charts/*` (new)
- `backend/src/modules/crm/reports.controller.js` (new)
- `backend/src/modules/crm/reports.service.js` (new)

---

### Phase 8: Advanced Features (Week 8-9)
**Priority:** LOW - Nice-to-Have

**Tasks:**
1. ⬜ Implement customer segmentation
2. ⬜ Add email integration (send from CRM)
3. ⬜ Build communication templates
4. ⬜ Add file attachments to entities
5. ⬜ Implement CSV/Excel import
6. ⬜ Add bulk operations (import, export, update)
7. ⬜ Create duplicate detection and merge UI
8. ⬜ Add custom fields per tenant
9. ⬜ Implement tagging system
10. ⬜ Add search across all CRM entities
11. ⬜ Create activity automation rules
12. ⬜ Add integration webhooks
13. ⬜ Build mobile-responsive views
14. ⬜ Add CRM settings page
15. ⬜ Implement role-based field visibility

**Deliverables:**
- Production-ready CRM system
- Advanced automation
- Full integration capabilities

---

## 5. Integration Specifications

### 5.1 Sales Module Integration

**Changes Required:**

1. **Database Schema** (✅ Already migrated)
   - Add `customerId` to `SalesQuotation`, `SalesOrder`, `SalesInvoice`
   - Add `dealId` to `SalesQuotation`, `SalesOrder`

2. **Sales API Updates**
   - Accept `customerId` and `dealId` in create/update endpoints
   - Pre-fill customer info when creating from CRM
   - Auto-populate customer address, email, phone from CRM customer

3. **Deal Stage Automation**
   - When quotation is sent → update deal to "PROPOSAL"
   - When quotation is accepted/converted to order → "NEGOTIATION"
   - When order is fulfilled → "WON"
   - When invoice is fully paid → "WON" (if not already)

4. **UI Integration**
   - Add "Create Quote" button in Customer 360 page
   - Show related quotes/orders/invoices in Customer 360 "Sales" tab
   - Allow linking existing orders to deals
   - Show deal name/number on sales documents

### 5.2 Project Module Integration (Optional)

- Link projects to customers
- Show related projects in Customer 360
- Create project from deal (when won)

### 5.3 Finance Module Integration

- Link invoices to customers via sales orders
- Show customer payment history
- Calculate customer lifetime value from paid invoices

### 5.4 Communication Module Integration

**Options:**
1. **Separate Systems:** Keep CRM communications and general messaging separate
2. **Unified System:** Use single communication module with entity linking

**Recommendation:** Keep separate but allow cross-referencing

---

## 6. RBAC Permissions

Add to `permissions.config.js`:

```javascript
CRM: {
  // Existing
  CUSTOMER_CREATE: 'crm.customer.create',
  CUSTOMER_VIEW: 'crm.customer.view',
  CUSTOMER_UPDATE: 'crm.customer.update',
  CUSTOMER_DELETE: 'crm.customer.delete',
  
  CONTACT_CREATE: 'crm.contact.create',
  CONTACT_VIEW: 'crm.contact.view',
  CONTACT_UPDATE: 'crm.contact.update',
  CONTACT_DELETE: 'crm.contact.delete',
  
  LEAD_CREATE: 'crm.lead.create',
  LEAD_VIEW: 'crm.lead.view',
  LEAD_UPDATE: 'crm.lead.update',
  LEAD_CONVERT: 'crm.lead.convert',
  LEAD_DELETE: 'crm.lead.delete',
  
  DEAL_CREATE: 'crm.deal.create',
  DEAL_VIEW: 'crm.deal.view',
  DEAL_UPDATE: 'crm.deal.update',
  DEAL_DELETE: 'crm.deal.delete',
  
  COMMUNICATION_CREATE: 'crm.communication.create',
  COMMUNICATION_VIEW: 'crm.communication.view',
  COMMUNICATION_UPDATE: 'crm.communication.update',
  COMMUNICATION_DELETE: 'crm.communication.delete',
  
  // NEW
  PIPELINE_CREATE: 'crm.pipeline.create',
  PIPELINE_VIEW: 'crm.pipeline.view',
  PIPELINE_UPDATE: 'crm.pipeline.update',
  PIPELINE_DELETE: 'crm.pipeline.delete',
  
  ACTIVITY_CREATE: 'crm.activity.create',
  ACTIVITY_VIEW: 'crm.activity.view',
  ACTIVITY_UPDATE: 'crm.activity.update',
  ACTIVITY_DELETE: 'crm.activity.delete',
  ACTIVITY_ASSIGN: 'crm.activity.assign',
  
  DEAL_WIN: 'crm.deal.win',
  DEAL_LOSE: 'crm.deal.lose',
  DEAL_STAGE_CHANGE: 'crm.deal.stage_change',
  
  LEAD_SCORE: 'crm.lead.score',
  LEAD_ASSIGN: 'crm.lead.assign',
  LEAD_DISQUALIFY: 'crm.lead.disqualify',
  
  CUSTOMER_MERGE: 'crm.customer.merge',
  CUSTOMER_EXPORT: 'crm.customer.export',
  
  REPORTS_VIEW: 'crm.reports.view',
  REPORTS_EXPORT: 'crm.reports.export',
  
  SETTINGS_MANAGE: 'crm.settings.manage',
}
```

**Role Mappings:**
- **ADMIN:** All permissions
- **MANAGER:** All except delete, merge, settings
- **SALES_REP:** View all, CRUD on own records, activities, communications
- **USER:** View customers/contacts, create communications/activities

---

## 7. Testing Strategy

### 7.1 Unit Tests
- Service layer functions
- Lead scoring algorithm
- Pipeline stage transitions
- Duplicate detection

### 7.2 Integration Tests
- API endpoints with authentication
- Tenant isolation verification
- Sales-CRM linkage
- Activity reminders

### 7.3 E2E Tests
- Complete lead-to-customer-to-deal-to-won flow
- Customer 360 page interactions
- Pipeline drag-and-drop
- Activity creation and completion

---

## 8. Performance Considerations

1. **Database Indexes**
   - Customer: tenantId, status, ownerId, category
   - Lead: tenantId, status, ownerId, leadScore, source
   - Deal: tenantId, customerId, stage, status, ownerId, expectedCloseDate
   - Activity: tenantId, assignedTo, status, dueDate, customerId, dealId
   - Communication: tenantId, entity IDs, occurredAt

2. **Caching**
   - Dashboard stats (5-minute cache)
   - Pipeline configurations (1-hour cache)
   - User's activity list (1-minute cache)

3. **Pagination**
   - All list endpoints with default limit 20-50
   - Cursor-based pagination for large datasets

4. **Query Optimization**
   - Use `include` selectively to avoid over-fetching
   - Implement field selection in GET endpoints
   - Use aggregation for stats/reports

---

## 9. Security Considerations

1. **Tenant Isolation** ✅
   - All queries MUST include tenantId in WHERE
   - Verify tenant ownership on all updates/deletes
   - Audit all CRM operations

2. **Data Access Control**
   - Record-level permissions (owner-based)
   - Field-level visibility by role
   - Sensitive data masking

3. **Input Validation**
   - Sanitize all user inputs
   - Validate email/phone formats
   - Check business rule constraints

4. **API Rate Limiting**
   - Per-user limits on lead imports
   - Bulk operation throttling

---

## 10. Migration & Deployment Plan

### 10.1 Database Migration Steps

1. **Backup existing data**
2. **Run Phase 1 migration** (sales-CRM linkage)
3. **Run Phase 2 migration** (enhanced models)
4. **Seed default pipeline**
5. **Migrate existing string customer names to FK** (data script)
6. **Verify data integrity**
7. **Deploy backend**
8. **Deploy frontend**
9. **Monitor for issues**

### 10.2 Rollback Plan

- Keep migration backups
- Feature flags for new UI components
- Database rollback scripts prepared

---

## 11. Documentation Requirements

1. **User Guides**
   - CRM quick start guide
   - Customer 360 usage
   - Pipeline management
   - Activity/task management
   - Lead conversion workflow

2. **Admin Guides**
   - Pipeline configuration
   - User permissions
   - Data import/export
   - Integration setup

3. **Developer Guides**
   - API documentation
   - Data model reference
   - Integration examples
   - Webhook setup

---

## 12. Success Metrics

**Key Performance Indicators:**
- Lead conversion rate increase
- Time to close deals reduction
- User adoption rate (% using CRM)
- Data completeness (% records with full info)
- Activity completion rate
- Customer satisfaction scores

**Technical Metrics:**
- API response times < 200ms
- Dashboard load time < 2s
- Zero tenant data leaks
- 99.9% uptime

---

## Appendix A: API Contract Examples

### Create Deal Request
```json
POST /api/crm/deals
{
  "name": "Acme Corp - Enterprise License",
  "customerId": "customer-uuid",
  "pipelineId": "pipeline-uuid",
  "stage": "PROSPECTING",
  "amount": 100000,
  "currencyCode": "USD",
  "expectedCloseDate": "2026-06-30",
  "probability": 25,
  "ownerId": "user-uuid",
  "products": [
    {
      "productId": "prod-1",
      "name": "Enterprise License",
      "quantity": 10,
      "price": 10000,
      "total": 100000
    }
  ],
  "tags": ["enterprise", "annual"]
}
```

### Customer 360 Response
```json
GET /api/crm/customers/:id?include=contacts,deals,communications,sales
{
  "id": "customer-uuid",
  "name": "Acme Corp",
  "type": "BUSINESS",
  "industry": "Technology",
  // ... customer fields ...
  "contacts": [
    {
      "id": "contact-uuid",
      "name": "John Doe",
      "email": "john@acme.com",
      "isPrimary": true,
      // ... contact fields ...
    }
  ],
  "deals": [
    {
      "id": "deal-uuid",
      "name": "Enterprise License",
      "stage": "PROPOSAL",
      "amount": 100000,
      // ... deal fields ...
    }
  ],
  "communications": [...],
  "activities": [...],
  "salesOrders": [...],
  "salesInvoices": [...]
}
```

---

## Appendix B: UI Component Library

**New Components Needed:**
- `CustomerCard` - Summary card
- `DealCard` - Kanban card
- `ActivityCard` - Task card
- `Timeline` - Activity timeline
- `LeadScoreMeter` - Score visualization
- `PipelineFunnel` - Funnel chart
- `DealForecastChart` - Forecast visualization
- `EntityRelationshipGraph` - Network view
- `ConversionWizard` - Multi-step lead conversion
- `QuickContactModal` - Fast contact creation
- `EmailComposer` - Send email from CRM
- `CallLogger` - Log call details
- `MeetingScheduler` - Schedule meetings

---

**END OF SPECIFICATION**

This specification is now ready for phased implementation. Each phase builds on the previous, ensuring a stable, incremental rollout of the complete CRM system.

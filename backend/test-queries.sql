-- Project Management Enhancement - Database Verification Queries
-- Run these queries to check the new tables and seed test data

-- ============================================
-- VERIFY NEW TABLES EXIST
-- ============================================

-- Check ProjectMember table
SELECT COUNT(*) as project_member_count FROM "ProjectMember";

-- Check ProjectTimesheet table
SELECT COUNT(*) as timesheet_count FROM "ProjectTimesheet";

-- Check ProjectMilestoneDependency table
SELECT COUNT(*) as dependency_count FROM "ProjectMilestoneDependency";

-- ============================================
-- CHECK EXISTING DATA
-- ============================================

-- Check existing projects
SELECT 
  id, 
  name, 
  status, 
  "tenantId",
  "createdAt"
FROM "Project" 
ORDER BY "createdAt" DESC 
LIMIT 5;

-- Check existing employees
SELECT 
  id, 
  "firstName", 
  "lastName", 
  email, 
  status,
  "tenantId"
FROM "Employee" 
WHERE status = 'ACTIVE'
ORDER BY "createdAt" DESC 
LIMIT 5;

-- Check existing users
SELECT 
  id,
  email,
  role,
  "tenantId",
  "isActive"
FROM "User"
WHERE "isActive" = true
ORDER BY "createdAt" DESC
LIMIT 5;

-- ============================================
-- GET TEST DATA IDS (Use these in API tests)
-- ============================================

-- Get first active project ID
SELECT 
  id as project_id,
  name as project_name,
  "tenantId"
FROM "Project"
WHERE status = 'ACTIVE' OR status = 'IN_PROGRESS'
LIMIT 1;

-- Get first active employee ID
SELECT 
  id as employee_id,
  CONCAT("firstName", ' ', "lastName") as employee_name,
  email,
  "tenantId"
FROM "Employee"
WHERE status = 'ACTIVE'
LIMIT 1;

-- Get user ID for testing (admin or manager)
SELECT 
  id as user_id,
  email,
  role,
  "tenantId"
FROM "User"
WHERE "isActive" = true 
  AND (role = 'ADMIN' OR role = 'MANAGER')
LIMIT 1;

-- ============================================
-- SEED TEST DATA (If no projects/employees exist)
-- ============================================

-- Note: Replace {tenantId} with actual tenant ID from your system
-- Get tenant ID first:
SELECT id as tenant_id, name as tenant_name FROM "Tenant" LIMIT 1;

-- Create test project (if needed)
/*
INSERT INTO "Project" (
  "id",
  "name",
  "code",
  "description",
  "status",
  "priority",
  "startDate",
  "targetEndDate",
  "tenantId",
  "createdAt",
  "updatedAt"
) VALUES (
  gen_random_uuid(),
  'Test Project - API Testing',
  'TEST-001',
  'Project for testing Project Management APIs',
  'ACTIVE',
  'MEDIUM',
  NOW(),
  NOW() + INTERVAL '90 days',
  '{tenantId}', -- Replace with actual tenant ID
  NOW(),
  NOW()
);
*/

-- ============================================
-- VERIFY PERMISSIONS EXIST
-- ============================================

-- Check project-related permissions
SELECT code, name, category
FROM "Permission"
WHERE code LIKE 'PROJECT%'
ORDER BY code;

-- Check timesheet-related permissions
SELECT code, name, category
FROM "Permission"
WHERE code LIKE 'TIMESHEET%'
ORDER BY code;

-- Check role assignments for Project Manager role
SELECT 
  r.name as role_name,
  p.code as permission_code,
  p.name as permission_name
FROM "Role" r
JOIN "RolePermission" rp ON r.id = rp."roleId"
JOIN "Permission" p ON rp."permissionId" = p.id
WHERE r.name = 'Project Manager'
  AND (p.code LIKE 'PROJECT%' OR p.code LIKE 'TIMESHEET%')
ORDER BY p.code;

-- ============================================
-- CHECK USER PERMISSIONS
-- ============================================

-- Get all permissions for a specific user (replace {userId})
/*
SELECT DISTINCT
  u.email,
  u.role as basic_role,
  r.name as assigned_role,
  p.code as permission_code,
  p.name as permission_name
FROM "User" u
JOIN "UserRole" ur ON u.id = ur."userId"
JOIN "Role" r ON ur."roleId" = r.id
JOIN "RolePermission" rp ON r.id = rp."roleId"
JOIN "Permission" p ON rp."permissionId" = p.id
WHERE u.id = '{userId}' -- Replace with actual user ID
  AND (p.code LIKE 'PROJECT%' OR p.code LIKE 'TIMESHEET%')
ORDER BY p.code;
*/

-- ============================================
-- TEST DATA VERIFICATION AFTER API CALLS
-- ============================================

-- Check project members created
SELECT 
  pm.id,
  pm.role,
  pm."allocationPercent",
  pm.status,
  e."firstName" || ' ' || e."lastName" as employee_name,
  p.name as project_name,
  pm."startDate",
  pm."endDate"
FROM "ProjectMember" pm
JOIN "Employee" e ON pm."employeeId" = e.id
JOIN "Project" p ON pm."projectId" = p.id
ORDER BY pm."createdAt" DESC
LIMIT 10;

-- Check timesheets created
SELECT 
  ts.id,
  ts.status,
  ts."weekStartDate",
  ts."weekEndDate",
  ts."totalHours",
  ts."totalBillableHours",
  e."firstName" || ' ' || e."lastName" as employee_name,
  ts."submittedAt",
  ts."approvedAt"
FROM "ProjectTimesheet" ts
JOIN "Employee" e ON ts."employeeId" = e.id
ORDER BY ts."createdAt" DESC
LIMIT 10;

-- Check employee capacity utilization
SELECT 
  e.id,
  e."firstName" || ' ' || e."lastName" as employee_name,
  COUNT(pm.id) as project_count,
  SUM(pm."allocationPercent") as total_allocation,
  100 - COALESCE(SUM(pm."allocationPercent"), 0) as available_capacity
FROM "Employee" e
LEFT JOIN "ProjectMember" pm ON e.id = pm."employeeId" 
  AND pm.status = 'ACTIVE'
  AND (pm."endDate" IS NULL OR pm."endDate" >= NOW())
WHERE e.status = 'ACTIVE'
GROUP BY e.id, e."firstName", e."lastName"
ORDER BY total_allocation DESC
LIMIT 10;

-- Check audit logs for project member operations
SELECT 
  al.action,
  al.entity,
  al."entityId",
  u.email as performed_by,
  al."createdAt",
  al.details
FROM "AuditLog" al
JOIN "User" u ON al."userId" = u.id
WHERE al.entity = 'PROJECT_MEMBER'
ORDER BY al."createdAt" DESC
LIMIT 10;

-- Check audit logs for timesheet operations
SELECT 
  al.action,
  al.entity,
  al."entityId",
  u.email as performed_by,
  al."createdAt",
  al.details
FROM "AuditLog" al
JOIN "User" u ON al."userId" = u.id
WHERE al.entity = 'PROJECT_TIMESHEET'
ORDER BY al."createdAt" DESC
LIMIT 10;

-- ============================================
-- CLEANUP TEST DATA (Use with caution!)
-- ============================================

-- Delete test project members
-- DELETE FROM "ProjectMember" WHERE "projectId" IN (SELECT id FROM "Project" WHERE code = 'TEST-001');

-- Delete test timesheets
-- DELETE FROM "ProjectTimesheet" WHERE "employeeId" IN (SELECT id FROM "Employee" WHERE email LIKE '%test%');

-- Delete test projects
-- DELETE FROM "Project" WHERE code = 'TEST-001';

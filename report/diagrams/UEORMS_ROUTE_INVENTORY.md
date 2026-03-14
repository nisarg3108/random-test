# UEORMS Route Inventory (from codebase)

Generated on: 2026-03-03 17:18:25

## backend\src\core\audit\audit.routes.js
Endpoints: 3

- `POST /test`
- `GET /`
- `GET /:id`

## backend\src\core\auth\auth.routes.js
Endpoints: 4

- `POST /register`
- `POST /register/checkout`
- `POST /login`
- `GET /me`

## backend\src\core\department\department.routes.js
Endpoints: 4

- `POST /`
- `GET /`
- `PUT /:id`
- `DELETE /:id`

## backend\src\core\rbac\rbac.routes.js
Endpoints: 8

- `GET /roles`
- `GET /permissions`
- `GET /users/:userId/permissions`
- `GET /my-permissions`
- `GET /users`
- `POST /assign-role`
- `POST /remove-role`
- `POST /initialize`

## backend\src\core\system\systemOptions.routes.js
Endpoints: 4

- `GET /:category`
- `POST /`
- `PUT /:id`
- `DELETE /:id`

## backend\src\core\workflow\approval.routes.js
Endpoints: 7

- `GET /debug`
- `POST /seed-workflows`
- `POST /create-test-workflow`
- `GET /`
- `GET /my-requests`
- `POST /:approvalId/approve`
- `POST /:approvalId/reject`

## backend\src\core\workflow\workflow.routes.js
Endpoints: 1

- `POST /approve`

## backend\src\invites\invite.routes.js
Endpoints: 2

- `POST /`
- `POST /accept`

## backend\src\modules\ap\ap.routes.js
Endpoints: 21

- `GET /bills`
- `GET /bills/:id`
- `POST /bills`
- `PUT /bills/:id`
- `DELETE /bills/:id`
- `POST /bills/:id/approve`
- `POST /bills/:id/reject`
- `POST /bills/:id/match`
- `POST /bills/:id/attachments`
- `DELETE /bills/:id/attachments/:attachmentId`
- `GET /payments`
- `GET /payments/:id`
- `POST /payments`
- `PUT /payments/:id`
- `DELETE /payments/:id`
- `POST /payments/:id/attachments`
- `DELETE /payments/:id/attachments/:attachmentId`
- `GET /analytics`
- `GET /aging`
- `GET /aging/export`
- `GET /vendors/:vendorId/statement`

## backend\src\modules\assets\allocation.routes.js
Endpoints: 8

- `POST /`
- `GET /`
- `GET /my-allocations`
- `GET /overdue`
- `POST /mark-overdue`
- `GET /:id`
- `PUT /:id`
- `POST /:id/return`

## backend\src\modules\assets\asset.routes.js
Endpoints: 11

- `POST /categories`
- `GET /categories`
- `GET /categories/:id`
- `PUT /categories/:id`
- `DELETE /categories/:id`
- `POST /`
- `GET /`
- `GET /statistics`
- `GET /:id`
- `PUT /:id`
- `DELETE /:id`

## backend\src\modules\assets\depreciation.routes.js
Endpoints: 5

- `POST /calculate/:assetId`
- `POST /calculate-all`
- `GET /history/:assetId`
- `GET /summary`
- `GET /report`

## backend\src\modules\assets\maintenance.routes.js
Endpoints: 9

- `POST /`
- `GET /`
- `GET /upcoming`
- `GET /overdue`
- `GET /:id`
- `PUT /:id`
- `POST /:id/start`
- `POST /:id/complete`
- `DELETE /:id`

## backend\src\modules\auth\passwordReset.routes.js
Endpoints: 3

- `POST /forgot-password`
- `POST /verify-otp`
- `POST /reset-password`

## backend\src\modules\communication\communication.routes.js
Endpoints: 47

- `GET /conversations`
- `GET /conversations/:id`
- `POST /conversations`
- `PUT /conversations/:id`
- `DELETE /conversations/:id`
- `POST /conversations/:id/participants`
- `DELETE /conversations/:id/participants/:participantId`
- `PUT /conversations/:conversationId/read`
- `GET /users`
- `GET /conversations/:conversationId/messages`
- `POST /conversations/:conversationId/messages`
- `PUT /messages/:messageId`
- `DELETE /messages/:messageId`
- `POST /messages/:messageId/reactions`
- `DELETE /messages/:messageId/reactions`
- `PUT /messages/:messageId/read`
- `POST /conversations/:conversationId/typing`
- `GET /online-users`
- `GET /announcements`
- `GET /announcements/:id`
- `POST /announcements`
- `PUT /announcements/:id`
- `DELETE /announcements/:id`
- `PUT /announcements/:id/read`
- `GET /channels`
- `GET /channels/:id`
- `POST /channels`
- `PUT /channels/:id`
- `POST /channels/:id/join`
- `POST /channels/:id/leave`
- `GET /email-templates`
- `POST /email-templates`
- `PUT /email-templates/:id`
- `POST /emails/send`
- `GET /email-logs`
- `GET /search/messages`
- `POST /files/upload`
- `GET /files/:filename`
- `DELETE /files/:filename`
- `GET /files/:filename/stats`
- `GET /email/health`
- `GET /email/queue/stats`
- `GET /email/queue`
- `POST /email/queue`
- `POST /email/queue/retry-failed`
- `POST /email/queue/:emailId/retry`
- `POST /email/queue/:emailId/cancel`

## backend\src\modules\company\branch.routes.js
Endpoints: 10

- `POST /`
- `GET /`
- `GET /main`
- `GET /:id`
- `GET /code/:code`
- `PUT /:id`
- `DELETE /:id`
- `POST /:id/set-main`
- `GET /:id/statistics`
- `POST /transfer`

## backend\src\modules\crm\crm.routes.js
Endpoints: 49

- `POST /customers`
- `GET /customers`
- `GET /customers/:id`
- `PUT /customers/:id`
- `DELETE /customers/:id`
- `POST /contacts`
- `GET /contacts`
- `GET /contacts/:id`
- `PUT /contacts/:id`
- `DELETE /contacts/:id`
- `POST /leads`
- `GET /leads`
- `GET /leads/:id`
- `PUT /leads/:id`
- `POST /leads/:id/convert`
- `POST /deals`
- `GET /deals`
- `GET /deals/:id`
- `PUT /deals/:id`
- `DELETE /deals/:id`
- `POST /communications`
- `GET /communications`
- `POST /pipelines`
- `GET /pipelines`
- `GET /pipelines/default`
- `GET /pipelines/:id`
- `PUT /pipelines/:id`
- `DELETE /pipelines/:id`
- `POST /pipelines/:pipelineId/stages`
- `PUT /stages/:stageId`
- `DELETE /stages/:stageId`
- `POST /pipelines/:pipelineId/stages/reorder`
- `POST /activities`
- `GET /activities`
- `GET /activities/my`
- `GET /activities/overdue`
- `GET /activities/upcoming`
- `GET /activities/:id`
- `PUT /activities/:id`
- `POST /activities/:id/complete`
- `DELETE /activities/:id`
- `POST /attachments`
- `POST /attachments/bulk`
- `GET /attachments`
- `GET /attachments/stats`
- `GET /attachments/:entityType/:entityId`
- `GET /attachments/:id`
- `PUT /attachments/:id`
- `DELETE /attachments/:id`

## backend\src\modules\documents\document.routes.js
Endpoints: 27

- `GET /statistics`
- `POST /upload`
- `POST /folders`
- `GET /folders`
- `GET /folders/:id`
- `PUT /folders/:id`
- `DELETE /folders/:id`
- `POST /folders/:id/permissions`
- `POST /templates`
- `GET /templates`
- `POST /templates/:id/generate`
- `DELETE /shares/:shareId`
- `POST /`
- `GET /`
- `GET /:id`
- `PUT /:id`
- `DELETE /:id`
- `POST /:id/restore`
- `GET /:id/download`
- `POST /:id/versions`
- `GET /:id/versions`
- `POST /:id/versions/:versionNumber/revert`
- `GET /:id/versions/:versionNumber/download`
- `GET /:id/activities`
- `POST /:id/shares`
- `GET /:id/shares`
- `POST /:id/permissions`

## backend\src\modules\finance\accounting.routes.js
Endpoints: 25

- `POST /chart-of-accounts`
- `GET /chart-of-accounts`
- `GET /chart-of-accounts/hierarchy`
- `POST /chart-of-accounts/initialize`
- `GET /chart-of-accounts/:id`
- `PUT /chart-of-accounts/:id`
- `DELETE /chart-of-accounts/:id`
- `GET /chart-of-accounts/:id/balance`
- `POST /accounts`
- `GET /accounts`
- `GET /accounts/hierarchy`
- `POST /accounts/initialize`
- `GET /accounts/:id`
- `PUT /accounts/:id`
- `DELETE /accounts/:id`
- `GET /accounts/:id/balance`
- `GET /general-ledger`
- `POST /journal-entries`
- `GET /journal-entries`
- `GET /journal-entries/statistics`
- `GET /journal-entries/:id`
- `PUT /journal-entries/:id`
- `POST /journal-entries/:id/post`
- `POST /journal-entries/:id/reverse`
- `DELETE /journal-entries/:id`

## backend\src\modules\finance\expenseCategory.routes.js
Endpoints: 2

- `POST /`
- `GET /`

## backend\src\modules\finance\expenseClaim.routes.js
Endpoints: 2

- `POST /`
- `GET /`

## backend\src\modules\finance\finance.routes.js
Endpoints: 5

- `GET /dashboard`
- `GET /expense-categories`
- `POST /expense-categories`
- `GET /expense-claims`
- `POST /expense-claims`

## backend\src\modules\hr\attendance.routes.js
Endpoints: 16

- `POST /clock-in`
- `POST /clock-out`
- `GET /clock-status/:employeeId`
- `POST /shifts`
- `GET /shifts`
- `POST /shifts/assign`
- `GET /shifts/employee/:employeeId`
- `GET /shifts/history/:employeeId`
- `POST /overtime-policies`
- `GET /overtime-hours/:employeeId`
- `POST /overtime-records/:employeeId`
- `PUT /overtime-records/:overtimeRecordId/approve`
- `POST /reports/:employeeId/generate`
- `GET /reports/:employeeId`
- `GET /reports/department/:departmentId`
- `POST /leave-integration`

## backend\src\modules\hr\disbursement.routes.js
Endpoints: 7

- `POST /`
- `GET /`
- `GET /stats`
- `PATCH /:id/status`
- `PATCH /bulk-status`
- `POST /generate-payment-file`
- `POST /reconcile`

## backend\src\modules\hr\employee.dashboard.routes.js
Endpoints: 1

- `GET /dashboard`

## backend\src\modules\hr\employee.routes.js
Endpoints: 17

- `POST /`
- `PUT /:id`
- `DELETE /:id`
- `POST /assign-manager`
- `GET /`
- `GET /my-profile`
- `GET /dashboard`
- `GET /tasks`
- `PUT /tasks/:taskId/status`
- `GET /salary`
- `POST /work-reports`
- `GET /work-reports`
- `PUT /notifications/:notificationId/read`
- `POST /tasks`
- `GET /manager/tasks`
- `GET /team/tasks`
- `POST /salary-structure`

## backend\src\modules\hr\leaveRequest.routes.js
Endpoints: 3

- `POST /`
- `GET /`
- `PUT /:id`

## backend\src\modules\hr\leaveType.routes.js
Endpoints: 5

- `POST /`
- `GET /`
- `GET /:id`
- `PUT /:id`
- `DELETE /:id`

## backend\src\modules\hr\payroll.routes.js
Endpoints: 19

- `POST /components`
- `GET /components`
- `PUT /components/:id`
- `POST /tax-config`
- `GET /tax-config`
- `POST /tax-config/calculate`
- `POST /cycles`
- `GET /cycles`
- `GET /cycles/:id`
- `POST /cycles/:cycleId/generate-payslips`
- `POST /cycles/:cycleId/disbursements`
- `GET /payslips`
- `GET /payslips/:id`
- `POST /payslips/:id/approve`
- `GET /disbursements`
- `PUT /disbursements/:id/status`
- `GET /config`
- `PUT /config`
- `GET /reports/summary`

## backend\src\modules\hr\task.routes.js
Endpoints: 5

- `POST /`
- `GET /`
- `GET /manager`
- `GET /team`
- `POST /salary-structure`

## backend\src\modules\integration\integration.routes.js
Endpoints: 10

- `POST /sync-inventory/:movementId`
- `POST /sync-sales/:orderId`
- `POST /sync-payroll/:cycleId`
- `POST /sync-manufacturing/:workOrderId`
- `POST /sync-purchase/:poId`
- `POST /batch-sync`
- `POST /sync-all/:moduleName`
- `GET /status/:moduleName`
- `GET /config`
- `POST /test`

## backend\src\modules\inventory\inventory.routes.js
Endpoints: 6

- `GET /debug/workflow`
- `POST /`
- `GET /`
- `GET /:id`
- `PUT /:id`
- `DELETE /:id`

## backend\src\modules\inventory\stock-movement.routes.js
Endpoints: 7

- `POST /`
- `GET /`
- `GET /statistics`
- `GET /:id`
- `PUT /:id`
- `POST /:id/approve`
- `POST /:id/cancel`

## backend\src\modules\inventory\warehouse.routes.js
Endpoints: 10

- `POST /`
- `GET /`
- `GET /:id`
- `PUT /:id`
- `DELETE /:id`
- `GET /:id/statistics`
- `GET /:id/stock`
- `PUT /:warehouseId/stock/:itemId`
- `POST /transfer`
- `POST /transfer/:id/complete`

## backend\src\modules\manufacturing\manufacturing.routes.js
Endpoints: 27

- `POST /bom`
- `GET /bom`
- `GET /bom/:id`
- `GET /bom/product/:productId`
- `PUT /bom/:id`
- `POST /bom/:id/set-default`
- `POST /bom/:id/activate`
- `POST /bom/:id/archive`
- `POST /bom/:id/clone`
- `DELETE /bom/:id`
- `POST /work-orders`
- `GET /work-orders`
- `GET /work-orders/dashboard`
- `GET /work-orders/statistics`
- `GET /work-orders/:id`
- `PUT /work-orders/:id`
- `POST /work-orders/:id/plan`
- `POST /work-orders/:id/start`
- `POST /work-orders/:id/complete`
- `POST /work-orders/:id/cancel`
- `POST /work-orders/:workOrderId/operations`
- `PUT /operations/:operationId`
- `POST /operations/:operationId/start`
- `POST /operations/:operationId/complete`
- `POST /work-orders/:workOrderId/materials`
- `POST /materials/:materialId/issue`
- `POST /materials/:materialId/consume`

## backend\src\modules\notifications\notification.routes.js
Endpoints: 3

- `GET /`
- `PUT /:id/read`
- `PUT /mark-all-read`

## backend\src\modules\projects\project.routes.js
Endpoints: 23

- `GET /dashboard`
- `GET /tasks`
- `POST /`
- `GET /`
- `GET /:id`
- `PUT /:id`
- `DELETE /:id`
- `POST /milestones`
- `GET /:projectId/milestones`
- `PUT /milestones/:id`
- `DELETE /milestones/:id`
- `POST /resources`
- `GET /:projectId/resources`
- `PUT /resources/:id`
- `DELETE /resources/:id`
- `POST /budgets`
- `GET /:projectId/budgets`
- `PUT /budgets/:id`
- `DELETE /budgets/:id`
- `POST /time-logs`
- `GET /:projectId/time-logs`
- `PUT /time-logs/:id`
- `DELETE /time-logs/:id`

## backend\src\modules\projects\project-member.routes.js
Endpoints: 9

- `POST /:projectId/members`
- `POST /:projectId/members/bulk`
- `GET /:projectId/members`
- `GET /:projectId/members/capacity`
- `GET /members/:memberId`
- `PUT /members/:memberId`
- `DELETE /members/:memberId`
- `GET /employees/:employeeId/availability`
- `GET /employees/:employeeId/projects`

## backend\src\modules\projects\timesheet.routes.js
Endpoints: 14

- `GET /get-or-create`
- `POST /`
- `GET /`
- `GET /summary`
- `GET /pending-approvals`
- `GET /my/summary`
- `GET /my`
- `GET /employees/:employeeId`
- `GET /:id`
- `PUT /:id`
- `POST /:id/submit`
- `POST /:id/approve`
- `POST /:id/reject`
- `DELETE /:id`

## backend\src\modules\purchase\purchase.routes.js
Endpoints: 33

- `GET /vendors`
- `GET /vendors/:id`
- `POST /vendors`
- `PUT /vendors/:id`
- `DELETE /vendors/:id`
- `GET /requisitions`
- `GET /requisitions/:id`
- `POST /requisitions`
- `PUT /requisitions/:id`
- `DELETE /requisitions/:id`
- `POST /requisitions/:id/approve`
- `POST /requisitions/:id/reject`
- `POST /requisitions/:id/convert-to-po`
- `GET /orders`
- `GET /orders/:id`
- `POST /orders`
- `PUT /orders/:id`
- `DELETE /orders/:id`
- `POST /orders/:id/approve`
- `PATCH /orders/:id/status`
- `PATCH /orders/:id/payment`
- `GET /receipts`
- `GET /receipts/:id`
- `POST /receipts`
- `PUT /receipts/:id`
- `DELETE /receipts/:id`
- `GET /evaluations`
- `GET /evaluations/:id`
- `POST /evaluations`
- `PUT /evaluations/:id`
- `DELETE /evaluations/:id`
- `GET /analytics`
- `GET /vendor-performance`

## backend\src\modules\reports\report.routes.js
Endpoints: 13

- `GET /financial/profit-loss`
- `GET /financial/balance-sheet`
- `GET /hr/analytics`
- `GET /inventory`
- `POST /custom/execute`
- `POST /templates`
- `GET /templates`
- `GET /templates/:id`
- `POST /saved`
- `GET /saved`
- `GET /saved/:id`
- `GET /export`
- `POST /export`

## backend\src\modules\reports\reporting.routes.js
Endpoints: 10

- `GET /dashboard-summary`
- `GET /income-statement`
- `GET /balance-sheet`
- `GET /inventory-summary`
- `GET /stock-movement`
- `GET /production`
- `GET /bom-analysis`
- `GET /sales`
- `POST /schedule`
- `GET /scheduled`

## backend\src\modules\sales\sales.routes.js
Endpoints: 32

- `GET /quotations`
- `POST /quotations`
- `PUT /quotations/:id`
- `DELETE /quotations/:id`
- `POST /quotations/:id/convert-to-order`
- `GET /orders`
- `POST /orders`
- `PUT /orders/:id`
- `DELETE /orders/:id`
- `POST /orders/:id/convert-to-invoice`
- `GET /invoices`
- `POST /invoices`
- `PUT /invoices/:id`
- `DELETE /invoices/:id`
- `GET /trackings`
- `POST /trackings`
- `PUT /trackings/:id`
- `DELETE /trackings/:id`
- `GET /invoices/:invoiceId/payments`
- `POST /invoices/:invoiceId/payments`
- `PUT /payments/:id`
- `DELETE /payments/:id`
- `GET /analytics`
- `GET /analytics/revenue`
- `GET /analytics/payments`
- `GET /analytics/export/pdf`
- `GET /analytics/export/csv`
- `GET /analytics/export/excel`
- `POST /analytics/email`
- `POST /analytics/schedule`
- `DELETE /analytics/schedule/:schedule`
- `GET /analytics/forecast`

## backend\src\modules\subscription\billing.routes.js
Endpoints: 17

- `GET /public/plans`
- `GET /subscription`
- `GET /plans`
- `POST /subscription/change-plan`
- `POST /subscription/cancel`
- `GET /payments`
- `GET /events`
- `GET /metrics`
- `GET /invoices`
- `GET /invoices/:paymentId`
- `GET /invoices/:paymentId/preview`
- `GET /invoices/:paymentId/download`
- `POST /invoices/:paymentId/resend`
- `POST /webhooks/stripe`
- `POST /webhooks/razorpay`
- `POST /webhooks/stripe/test`
- `POST /webhooks/razorpay/test`

## backend\src\modules\utils\data-import-export.routes.js
Endpoints: 10

- `POST /import/items`
- `POST /import/warehouses`
- `POST /import/journal-entries`
- `GET /export/items`
- `GET /export/warehouses`
- `GET /export/warehouse-stock`
- `GET /export/chart-of-accounts`
- `GET /export/general-ledger`
- `GET /export/stock-movements`
- `GET /templates/:type`

## backend\src\routes\admin.routes.js
Endpoints: 1

- `GET /`

## backend\src\routes\dashboard.routes.js
Endpoints: 7

- `GET /stats`
- `GET /activities`
- `GET /user`
- `GET /manager`
- `GET /admin`
- `GET /hr`
- `GET /finance`

## backend\src\routes\db-test.routes.js
Endpoints: 1

- `GET /`

## backend\src\routes\finance-dashboard.routes.js
Endpoints: 1

- `GET /`

## backend\src\routes\health.routes.js
Endpoints: 1

- `GET /`

## backend\src\routes\protected.routes.js
Endpoints: 1

- `GET /`

## backend\src\routes\realtime.routes.js
Endpoints: 2

- `POST /test/dashboard-stats`
- `POST /test/activity`

## backend\src\routes\seed.routes.js
Endpoints: 1

- `POST /seed`

## backend\src\users\user.routes.js
Endpoints: 5

- `POST /`
- `GET /`
- `PUT /:id`
- `DELETE /:id`
- `POST /invite`

Total parsed endpoints in route files: 574

# Asset Management Module Implementation

## Overview
This document describes the comprehensive Asset Management module implementation for the ERP system. The module provides complete functionality for tracking company assets, managing allocations to employees, scheduling maintenance, and calculating depreciation.

## Features Implemented

### 1. Asset Management
- **Asset Tracking**: Complete tracking of company assets with detailed information
- **Asset Categories**: Organize assets into categories with custom depreciation settings
- **Asset Lifecycle**: Track assets from purchase through retirement/disposal
- **Asset Search & Filtering**: Powerful search and filtering capabilities
- **Asset Statistics**: Real-time dashboard with asset metrics

### 2. Asset Allocation
- **Employee Assignment**: Allocate assets to employees with purpose and location tracking
- **Allocation History**: Complete history of asset allocations
- **Return Management**: Track asset returns with condition assessment
- **Overdue Tracking**: Automatic detection of overdue returns
- **My Allocations**: Employee self-service to view their assigned assets

### 3. Maintenance Management
- **Maintenance Scheduling**: Schedule preventive and corrective maintenance
- **Maintenance Types**: Support for PREVENTIVE, CORRECTIVE, INSPECTION, and CALIBRATION
- **Maintenance Tracking**: Track maintenance status and completion
- **Upcoming Alerts**: View upcoming maintenance schedules
- **Overdue Detection**: Automatic detection of overdue maintenance
- **Cost Tracking**: Track maintenance costs per asset

### 4. Depreciation Tracking
- **Multiple Methods**: Support for Straight Line, Declining Balance, and Units of Production
- **Automatic Calculation**: Calculate depreciation for individual or all assets
- **Depreciation History**: View historical depreciation records
- **Depreciation Reports**: Generate comprehensive depreciation reports
- **Current Value Tracking**: Automatically update asset current values

## Database Schema

### Tables Created

1. **AssetCategory**
   - Category management with default depreciation settings
   - Fields: name, code, description, defaultDepreciationMethod, defaultDepreciationRate, defaultUsefulLife

2. **Asset**
   - Complete asset information
   - Fields: assetCode, name, description, categoryId, purchaseDate, purchasePrice, vendor, invoiceNumber, serialNumber, model, manufacturer, location, status, condition, depreciation details, warranty, insurance

3. **AssetAllocation**
   - Track asset assignments to employees
   - Fields: assetId, employeeId, allocatedDate, returnDate, expectedReturnDate, status, purpose, location, returnCondition, returnNotes

4. **AssetMaintenance**
   - Maintenance scheduling and tracking
   - Fields: assetId, maintenanceType, scheduledDate, completedDate, status, description, performedBy, cost, conditionBefore, conditionAfter, nextMaintenanceDate

5. **AssetDepreciation**
   - Monthly depreciation records
   - Fields: assetId, period, year, month, openingValue, depreciationAmount, closingValue, accumulatedDepreciation, method, rate

## Backend API Endpoints

### Asset Categories
- `POST /api/assets/categories` - Create new category
- `GET /api/assets/categories` - List all categories
- `GET /api/assets/categories/:id` - Get category details
- `PUT /api/assets/categories/:id` - Update category
- `DELETE /api/assets/categories/:id` - Delete category

### Assets
- `POST /api/assets` - Create new asset
- `GET /api/assets` - List assets (with filters: status, categoryId, search)
- `GET /api/assets/statistics` - Get asset statistics
- `GET /api/assets/:id` - Get asset details
- `PUT /api/assets/:id` - Update asset
- `DELETE /api/assets/:id` - Delete asset

### Asset Allocations
- `POST /api/asset-allocations` - Allocate asset to employee
- `GET /api/asset-allocations` - List allocations (with filters: status, employeeId, assetId)
- `GET /api/asset-allocations/my-allocations` - Get my allocated assets
- `GET /api/asset-allocations/:id` - Get allocation details
- `PUT /api/asset-allocations/:id` - Update allocation
- `POST /api/asset-allocations/:id/return` - Return asset

### Maintenance
- `POST /api/asset-maintenance` - Create maintenance schedule
- `GET /api/asset-maintenance` - List maintenance schedules (with filters)
- `GET /api/asset-maintenance/upcoming` - Get upcoming maintenance
- `GET /api/asset-maintenance/overdue` - Get overdue maintenance
- `GET /api/asset-maintenance/:id` - Get maintenance details
- `PUT /api/asset-maintenance/:id` - Update maintenance
- `POST /api/asset-maintenance/:id/complete` - Complete maintenance
- `DELETE /api/asset-maintenance/:id` - Delete maintenance

### Depreciation
- `POST /api/asset-depreciation/calculate/:assetId` - Calculate depreciation for one asset
- `POST /api/asset-depreciation/calculate-all` - Calculate depreciation for all assets
- `GET /api/asset-depreciation/history/:assetId` - Get depreciation history
- `GET /api/asset-depreciation/summary` - Get depreciation summary
- `GET /api/asset-depreciation/report` - Get depreciation report

## Frontend Pages

### 1. Asset Dashboard (`/assets`)
- Overview statistics (total, available, allocated, maintenance)
- Asset value summary (purchase value, current value, depreciation)
- Category breakdown
- Quick actions

### 2. Asset List (`/assets/list`)
- Searchable and filterable asset list
- Status and condition badges
- Quick actions (view, edit, delete)
- Allocated employee information

### 3. Asset Form (`/assets/new`, `/assets/:id/edit`)
- Comprehensive asset creation/editing form
- Sections: Basic Info, Purchase Info, Physical Details, Depreciation, Warranty & Insurance
- Category selection with dropdown
- Condition and status management

### 4. Asset Allocations (`/assets/allocations`)
- List of all asset allocations
- Filter by status (Active, Returned, Overdue)
- Allocate asset modal
- Return asset functionality with condition assessment

## Asset Status Flow

```
AVAILABLE → ALLOCATED → AVAILABLE (when returned)
         → MAINTENANCE → AVAILABLE
         → RETIRED
         → DISPOSED
```

## Depreciation Methods

### 1. Straight Line
- Formula: (Purchase Price - Salvage Value) / Useful Life
- Even distribution over asset life

### 2. Declining Balance
- Formula: Book Value × (Depreciation Rate / 12)
- Accelerated depreciation method

### 3. Units of Production
- Based on actual usage
- Requires tracking of production units

## Usage Examples

### Creating an Asset
```javascript
POST /api/assets
{
  "assetCode": "LAP-001",
  "name": "Dell Laptop XPS 15",
  "categoryId": "category-uuid",
  "purchaseDate": "2024-01-15",
  "purchasePrice": 1500,
  "depreciationMethod": "STRAIGHT_LINE",
  "usefulLife": 36,
  "salvageValue": 100
}
```

### Allocating an Asset
```javascript
POST /api/asset-allocations
{
  "assetId": "asset-uuid",
  "employeeId": "employee-uuid",
  "purpose": "Work laptop for development",
  "expectedReturnDate": "2025-01-15"
}
```

### Calculating Depreciation
```javascript
POST /api/asset-depreciation/calculate-all
{
  "year": 2024,
  "month": 2
}
```

## Security & Permissions
- All endpoints require authentication
- Asset operations require appropriate user role
- Employee self-service for viewing own allocations
- Audit logging for all asset operations

## Future Enhancements

### Potential additions:
1. **Barcode/QR Code scanning** for quick asset lookup
2. **Asset transfer** between locations/departments
3. **Asset images** upload and gallery
4. **Maintenance reminders** via notifications/email
5. **Custom fields** per category
6. **Asset disposal workflow** with approval
7. **Insurance claim** tracking
8. **Asset reservation** system
9. **Mobile app** for asset scanning
10. **Integration** with accounting systems

## Testing Checklist

- [ ] Create asset categories
- [ ] Create assets with different depreciation methods
- [ ] Allocate assets to employees
- [ ] Return assets and verify status changes
- [ ] Schedule maintenance
- [ ] Complete maintenance and verify condition updates
- [ ] Calculate depreciation for single asset
- [ ] Calculate depreciation for all assets
- [ ] Verify depreciation history
- [ ] Test asset search and filters
- [ ] Verify statistics and dashboard data
- [ ] Test employee self-service allocations view

## Maintenance Notes

### Regular Tasks:
1. **Monthly**: Run depreciation calculation for all assets
2. **Weekly**: Review overdue maintenance and allocations
3. **Quarterly**: Audit asset locations and conditions
4. **Annually**: Review and update depreciation rates

### Database Maintenance:
- Archive old depreciation records (> 5 years)
- Clean up deleted asset references
- Optimize asset search indexes

## Troubleshooting

### Common Issues:

1. **Depreciation not calculating**
   - Verify asset has depreciation method set
   - Check useful life is configured
   - Ensure salvage value is less than purchase price

2. **Cannot allocate asset**
   - Verify asset status is AVAILABLE
   - Check employee exists and is active
   - Ensure no active allocation exists

3. **Maintenance overdue not showing**
   - Check scheduled date is in the past
   - Verify status is not COMPLETED or CANCELLED

## Support
For issues or questions, contact the development team or refer to the main ERP documentation.

---
**Last Updated**: February 2, 2026
**Version**: 1.0.0
**Module**: Asset Management

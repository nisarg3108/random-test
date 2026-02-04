# Asset Management Module - Quick Start Guide

## 🚀 Getting Started

### 1. Database Setup (Already Done ✅)
The migration has been created and applied:
```bash
cd backend
npx prisma migrate dev --name add_asset_management
```

### 2. Seed Asset Categories (Optional but Recommended)
```bash
cd backend
node seed-asset-categories.js
```

This will create 10 default asset categories:
- Computer Equipment
- Office Furniture
- Vehicles
- Mobile Devices
- Office Equipment
- Networking Equipment
- Software Licenses
- Manufacturing Equipment
- Tools & Equipment
- Audio/Visual Equipment

### 3. Access the Module

Navigate to the following URLs in your application:

#### Main Pages:
- **Dashboard**: `/assets` - Overview and statistics
- **Assets List**: `/assets/list` - View all assets
- **Add Asset**: `/assets/new` - Create new asset
- **Allocations**: `/assets/allocations` - Manage asset allocations

#### Navigation:
The Asset Management menu items are now available in the sidebar:
- Asset Management
- Assets List
- Asset Allocations

## 📋 Quick Workflow Examples

### Creating Your First Asset

1. Go to `/assets` (Dashboard)
2. Click "Add New Asset" or navigate to `/assets/new`
3. Fill in the form:
   - **Asset Code**: Unique identifier (e.g., LAP-001)
   - **Name**: Asset name (e.g., Dell Laptop XPS 15)
   - **Category**: Select from dropdown
   - **Purchase Date** & **Price**: Required
   - **Depreciation** (Optional): Method, Rate, Useful Life
4. Click "Create Asset"

### Allocating an Asset to an Employee

1. Go to `/assets/allocations`
2. Click "Allocate Asset"
3. Select:
   - Asset (only AVAILABLE assets shown)
   - Employee
   - Purpose and location
   - Expected return date (optional)
4. Click "Allocate"

### Returning an Asset

1. Go to `/assets/allocations`
2. Find the active allocation
3. Click "Return"
4. Enter condition (EXCELLENT/GOOD/FAIR/POOR)
5. Add return notes (optional)
6. Confirm

### Calculating Depreciation

#### For All Assets (Recommended Monthly):
```bash
# Using API
POST /api/asset-depreciation/calculate-all
{
  "year": 2024,
  "month": 2
}
```

#### For Single Asset:
```bash
POST /api/asset-depreciation/calculate/:assetId
{
  "year": 2024,
  "month": 2
}
```

## 🎯 Key Features

### ✅ Implemented Features:
- [x] Asset CRUD operations
- [x] Asset categories management
- [x] Asset allocation to employees
- [x] Asset return with condition tracking
- [x] Maintenance scheduling
- [x] Depreciation calculation (3 methods)
- [x] Asset statistics dashboard
- [x] Search and filtering
- [x] Status tracking (Available/Allocated/Maintenance/Retired/Disposed)
- [x] Condition tracking (Excellent/Good/Fair/Poor)
- [x] Audit logging
- [x] Employee self-service (view my allocations)

## 🔑 API Endpoints Summary

### Assets
- `GET /api/assets` - List assets
- `POST /api/assets` - Create asset
- `GET /api/assets/:id` - Get asset details
- `PUT /api/assets/:id` - Update asset
- `DELETE /api/assets/:id` - Delete asset
- `GET /api/assets/statistics` - Get statistics

### Allocations
- `GET /api/asset-allocations` - List allocations
- `POST /api/asset-allocations` - Allocate asset
- `POST /api/asset-allocations/:id/return` - Return asset
- `GET /api/asset-allocations/my-allocations` - My allocations

### Categories
- `GET /api/assets/categories` - List categories
- `POST /api/assets/categories` - Create category
- `PUT /api/assets/categories/:id` - Update category
- `DELETE /api/assets/categories/:id` - Delete category

### Maintenance
- `GET /api/asset-maintenance` - List maintenance
- `POST /api/asset-maintenance` - Create maintenance
- `POST /api/asset-maintenance/:id/complete` - Complete maintenance
- `GET /api/asset-maintenance/upcoming` - Upcoming maintenance
- `GET /api/asset-maintenance/overdue` - Overdue maintenance

### Depreciation
- `POST /api/asset-depreciation/calculate-all` - Calculate all
- `POST /api/asset-depreciation/calculate/:assetId` - Calculate one
- `GET /api/asset-depreciation/history/:assetId` - Get history
- `GET /api/asset-depreciation/summary` - Get summary

## 📊 Data Models

### Asset Statuses
- `AVAILABLE` - Ready for allocation
- `ALLOCATED` - Assigned to employee
- `MAINTENANCE` - Under maintenance
- `RETIRED` - No longer in use
- `DISPOSED` - Disposed/sold

### Allocation Statuses
- `ACTIVE` - Currently allocated
- `RETURNED` - Asset returned
- `OVERDUE` - Past expected return date

### Depreciation Methods
- `STRAIGHT_LINE` - Even distribution
- `DECLINING_BALANCE` - Accelerated
- `UNITS_OF_PRODUCTION` - Usage-based

## 🛠️ Maintenance Schedule

### Monthly Tasks:
- Run depreciation calculation for all assets
- Review asset allocations

### Weekly Tasks:
- Check overdue maintenance
- Review overdue allocations

### Quarterly Tasks:
- Physical asset audit
- Update asset locations
- Review asset conditions

## 📁 File Structure

```
backend/
├── prisma/
│   └── migrations/
│       └── 20260202032023_add_asset_management/
├── src/modules/assets/
│   ├── asset.service.js
│   ├── asset.controller.js
│   ├── asset.routes.js
│   ├── allocation.service.js
│   ├── allocation.controller.js
│   ├── allocation.routes.js
│   ├── maintenance.service.js
│   ├── maintenance.controller.js
│   ├── maintenance.routes.js
│   ├── depreciation.service.js
│   ├── depreciation.controller.js
│   └── depreciation.routes.js
└── seed-asset-categories.js

frontend/
├── src/
│   ├── api/
│   │   └── asset.api.js
│   └── pages/assets/
│       ├── AssetDashboard.jsx
│       ├── AssetList.jsx
│       ├── AssetForm.jsx
│       └── AssetAllocations.jsx
```

## 🐛 Troubleshooting

### Issue: Cannot see Asset Management in menu
- **Solution**: Refresh the page or clear browser cache

### Issue: No categories available when creating asset
- **Solution**: Run the seed script: `node backend/seed-asset-categories.js`

### Issue: Cannot allocate asset
- **Solution**: Ensure asset status is AVAILABLE and employee exists

### Issue: Depreciation not calculating
- **Solution**: Verify asset has depreciation method and useful life set

## 📖 Additional Resources

- Full Documentation: `ASSET_MANAGEMENT_IMPLEMENTATION.md`
- API Tests: Use tools like Postman or Thunder Client
- Database Schema: Check `backend/prisma/schema.prisma`

## 🎉 Success!

Your Asset Management module is now fully implemented and ready to use!

**Next Steps:**
1. Seed asset categories
2. Create your first asset
3. Allocate assets to employees
4. Set up maintenance schedules
5. Calculate monthly depreciation

---
**Need Help?** Refer to ASSET_MANAGEMENT_IMPLEMENTATION.md for detailed documentation.

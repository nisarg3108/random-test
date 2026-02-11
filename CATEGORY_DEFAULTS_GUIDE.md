# Category Defaults in Asset Creation - Implementation Guide

## ✅ Priority 5 Complete

The system now automatically applies category depreciation defaults when creating new assets, streamlining asset setup and ensuring consistent depreciation policies across asset categories.

## 📦 What Was Implemented

### 1. Backend Service Enhancement
**File**: `backend/src/modules/assets/asset.service.js`

**Modified Function**: `createAsset()`

**Logic**:
1. Fetches the asset category before creating the asset
2. Applies category defaults for depreciation fields if not specified:
   - `depreciationMethod` → uses `defaultDepreciationMethod`
   - `depreciationRate` → uses `defaultDepreciationRate`
   - `usefulLife` → uses `defaultUsefulLife`
3. User-provided values always override category defaults
4. Creates asset with merged data

**Code Behavior**:
```javascript
// If asset data doesn't specify these fields, category defaults are used:
depreciationMethod: data.depreciationMethod || category.defaultDepreciationMethod
depreciationRate: data.depreciationRate ?? category.defaultDepreciationRate
usefulLife: data.usefulLife ?? category.defaultUsefulLife
```

### 2. Frontend Form Enhancement
**File**: `frontend/src/pages/assets/AssetForm.jsx`

**New Features**:
- **Category Default Display**: Shows blue info box when category has defaults
- **Visual Indicators**: Labels show "(Using category default)" when applicable
- **Placeholder Text**: Input fields show default values as placeholders
- **Auto-Population**: Fields auto-fill with defaults when category is selected
- **Override Capability**: Users can override any default by typing new value

**UI Enhancements**:
```jsx
┌─────────────────────────────────────────────────┐
│ Depreciation Information                        │
├─────────────────────────────────────────────────┤
│ ℹ️ Category Defaults Applied:                   │
│   • Method: STRAIGHT LINE                       │
│   • Rate: 20% per year                          │
│   • Useful Life: 60 months (5 years)           │
│   You can override these values below if needed │
├─────────────────────────────────────────────────┤
│ Depreciation Method (Using category default)    │
│ [STRAIGHT_LINE ▼]                               │
│                                                  │
│ Depreciation Rate (%) (Using category default)  │
│ [20] Default: 20%                               │
│                                                  │
│ Useful Life (Months) (Using category default)   │
│ [60] Default: 60 months                         │
└─────────────────────────────────────────────────┘
```

### 3. Test Script
**File**: `test-category-defaults.js`

**Test Coverage**:
- Creates category with depreciation defaults
- Creates asset WITHOUT specifying depreciation (inherits defaults)
- Creates asset WITH specific depreciation (overrides defaults)
- Verifies both scenarios work correctly
- Automatic cleanup of test data

## 🎯 How It Works

### Scenario 1: Asset Inherits Category Defaults

**Category Setup**:
```javascript
{
  name: "IT Equipment",
  defaultDepreciationMethod: "STRAIGHT_LINE",
  defaultDepreciationRate: 20.0,  // 20% per year
  defaultUsefulLife: 60            // 5 years
}
```

**Asset Creation (WITHOUT depreciation values)**:
```javascript
{
  categoryId: "category-id",
  assetCode: "LAP001",
  name: "Laptop",
  purchasePrice: 1500,
  // No depreciation fields specified
}
```

**Result** (Backend automatically applies):
```javascript
{
  ...asset data,
  depreciationMethod: "STRAIGHT_LINE",    // From category
  depreciationRate: 20.0,                  // From category
  usefulLife: 60                           // From category
}
```

### Scenario 2: Asset Overrides Category Defaults

**Category Setup** (same as above):
```javascript
{
  defaultDepreciationMethod: "STRAIGHT_LINE",
  defaultDepreciationRate: 20.0,
  defaultUsefulLife: 60
}
```

**Asset Creation (WITH custom depreciation)**:
```javascript
{
  categoryId: "category-id",
  assetCode: "SRV001",
  name: "Server",
  purchasePrice: 5000,
  depreciationMethod: "DECLINING_BALANCE",  // Custom
  depreciationRate: 25.0,                    // Custom
  usefulLife: 84                             // Custom (7 years)
}
```

**Result** (User values used, not category defaults):
```javascript
{
  ...asset data,
  depreciationMethod: "DECLINING_BALANCE",  // User's value
  depreciationRate: 25.0,                    // User's value
  usefulLife: 84                             // User's value
}
```

## 🚀 Usage Guide

### For Administrators

#### Step 1: Set Up Category Defaults

1. Navigate to **Assets → Categories**
2. Create or edit a category
3. Set the depreciation defaults:
   - **Default Depreciation Method**: Choose from Straight Line, Declining Balance, or Units of Production
   - **Default Depreciation Rate**: Enter percentage (e.g., 20 for 20%)
   - **Default Useful Life**: Enter months (e.g., 60 for 5 years)
4. Save the category

**Example Categories**:
```
IT Equipment:
  - Method: STRAIGHT_LINE
  - Rate: 20% per year
  - Life: 60 months (5 years)

Furniture:
  - Method: STRAIGHT_LINE
  - Rate: 10% per year
  - Life: 120 months (10 years)

Vehicles:
  - Method: DECLINING_BALANCE
  - Rate: 25% per year
  - Life: 48 months (4 years)

Manufacturing Equipment:
  - Method: UNITS_OF_PRODUCTION
  - Rate: N/A (based on units)
  - Life: 84 months (7 years)
```

#### Step 2: Create Asset with Category Defaults

1. Navigate to **Assets → Add New Asset**
2. Select a **Category** that has defaults configured
3. Notice the blue info box showing category defaults
4. Leave depreciation fields empty or use pre-filled values
5. Complete other required fields
6. Save the asset

**What Happens**:
- Asset automatically gets category's depreciation settings
- No need to manually enter same values repeatedly
- Ensures consistency across similar assets

#### Step 3: Override Defaults (Optional)

1. If asset needs different depreciation:
2. Change the values in depreciation fields
3. Your custom values will be used instead of category defaults
4. Save the asset

### For Users

**Creating New Asset**:

1. **Fill Basic Information**:
   - Asset Code
   - Asset Name
   - Category ← **Important: Select this first**

2. **Category Defaults Applied**:
   - Blue box appears showing what defaults will be used
   - Depreciation fields show placeholders with default values
   - Labels indicate "(Using category default)"

3. **Choose Your Path**:
   - **Option A**: Leave fields empty → Category defaults are used
   - **Option B**: Fill in custom values → Your values override defaults

4. **Complete Other Fields**:
   - Purchase information
   - Physical details
   - Warranty/Insurance

5. **Save**: Asset is created with appropriate depreciation settings

## 🧪 Testing

### Manual Testing

#### Test 1: Verify Category Defaults Work

1. **Create Category**:
   ```
   Name: Test IT Equipment
   Code: TEST-IT
   Default Method: STRAIGHT_LINE
   Default Rate: 20
   Default Life: 60
   ```

2. **Create Asset WITHOUT Depreciation**:
   ```
   Category: Test IT Equipment
   Asset Code: TEST-001
   Name: Test Laptop
   Purchase Price: 1500
   (Leave depreciation fields empty)
   ```

3. **Verify Asset**:
   - View asset details
   - Check depreciation fields have category defaults:
     - Method: STRAIGHT_LINE
     - Rate: 20%
     - Life: 60 months

#### Test 2: Verify Override Works

1. **Create Asset WITH Custom Depreciation**:
   ```
   Category: Test IT Equipment (has defaults)
   Asset Code: TEST-002
   Name: Test Server
   Purchase Price: 5000
   Method: DECLINING_BALANCE
   Rate: 25
   Life: 84
   ```

2. **Verify Asset**:
   - View asset details
   - Check depreciation fields have YOUR values:
     - Method: DECLINING_BALANCE (not category default)
     - Rate: 25% (not 20%)
     - Life: 84 months (not 60)

### Automated Testing

**Run Test Script**:
```bash
# Ensure backend server is NOT running
node test-category-defaults.js
```

**What It Tests**:
- ✅ Category creation with defaults
- ✅ Asset inherits category defaults correctly
- ✅ Asset overrides category defaults correctly
- ✅ Each field (method, rate, life) verified independently
- ✅ Automatic cleanup of test data

**Expected Output**:
```
╔════════════════════════════════════════════════════════════════╗
║      Testing Category Defaults in Asset Creation              ║
╚════════════════════════════════════════════════════════════════╝

🧪 Test 1: Creating category with depreciation defaults...
✅ Category created:
   Default Method: STRAIGHT_LINE
   Default Rate: 20%
   Default Useful Life: 60 months

🧪 Test 2: Creating asset WITHOUT depreciation values...
✅ Asset 1 created:
   Depreciation Method: STRAIGHT_LINE
   Depreciation Rate: 20%
   Useful Life: 60 months

🧪 Test 3: Creating asset WITH specific depreciation values...
✅ Asset 2 created:
   Depreciation Method: DECLINING_BALANCE
   Depreciation Rate: 25%
   Useful Life: 48 months

╔════════════════════════════════════════════════════════════════╗
║                     VERIFICATION RESULTS                       ║
╚════════════════════════════════════════════════════════════════╝

📊 Asset 1 (Should inherit category defaults):
   ✅ Method inherited correctly: STRAIGHT_LINE
   ✅ Rate inherited correctly: 20%
   ✅ Useful Life inherited correctly: 60 months

📊 Asset 2 (Should use custom values):
   ✅ Method uses custom value: DECLINING_BALANCE
   ✅ Rate uses custom value: 25%
   ✅ Useful Life uses custom value: 48 months

╔════════════════════════════════════════════════════════════════╗
║                     FINAL RESULT                               ║
╚════════════════════════════════════════════════════════════════╝

✅ ALL TESTS PASSED!
   Category defaults are correctly applied to assets.
```

## 📊 Database Schema

### AssetCategory Table
```prisma
model AssetCategory {
  id                         String   @id
  tenantId                   String
  name                       String
  code                       String
  
  // Depreciation Defaults
  defaultDepreciationMethod  String?  // "STRAIGHT_LINE" | "DECLINING_BALANCE" | "UNITS_OF_PRODUCTION"
  defaultDepreciationRate    Float?   // Percentage (e.g., 20.0)
  defaultUsefulLife          Int?     // Months (e.g., 60)
  
  assets                     Asset[]
}
```

### Asset Table
```prisma
model Asset {
  id                    String   @id
  categoryId            String
  
  // Depreciation (can be from category defaults or custom)
  depreciationMethod    String?
  depreciationRate      Float?
  usefulLife            Int?
  
  category              AssetCategory @relation(fields: [categoryId])
}
```

## 🎯 Benefits

### For Organizations
- ✅ **Consistency**: All assets in same category use same depreciation policy
- ✅ **Efficiency**: No need to enter same values repeatedly
- ✅ **Standardization**: Enforces accounting policies across asset types
- ✅ **Compliance**: Easier to maintain consistent depreciation methods

### For Users
- ✅ **Faster data entry**: Less typing, fewer errors
- ✅ **Visual feedback**: Clear indication of what defaults are applied
- ✅ **Flexibility**: Can override defaults when needed
- ✅ **Clarity**: Know exactly what values will be used

### For Accountants
- ✅ **Audit trail**: Clear source of depreciation values
- ✅ **Policy enforcement**: Category defaults ensure compliance
- ✅ **Reporting accuracy**: Consistent methods across similar assets
- ✅ **Year-end processing**: Simplified depreciation calculations

## 🔧 Technical Details

### Backend Logic
```javascript
export const createAsset = async (data, tenantId) => {
  // 1. Fetch category to get defaults
  const category = await prisma.assetCategory.findFirst({
    where: { id: data.categoryId, tenantId }
  });

  if (!category) {
    throw new Error('Asset category not found');
  }

  // 2. Merge asset data with category defaults
  const assetData = {
    ...data,
    tenantId,
    currentValue: data.purchasePrice,
    
    // Apply defaults only if not provided
    depreciationMethod: data.depreciationMethod || category.defaultDepreciationMethod,
    depreciationRate: data.depreciationRate ?? category.defaultDepreciationRate,
    usefulLife: data.usefulLife ?? category.defaultUsefulLife,
  };

  // 3. Create asset with merged data
  const asset = await prisma.asset.create({
    data: assetData,
    include: { category: true },
  });
  
  return asset;
};
```

### Frontend Logic
```javascript
const handleChange = (e) => {
  const { name, value } = e.target;
  
  // When category changes
  if (name === 'categoryId' && value) {
    const category = categories.find(cat => cat.id === value);
    setSelectedCategory(category);
    
    // Auto-populate with defaults if fields are empty
    setFormData(prev => ({
      ...prev,
      categoryId: value,
      depreciationMethod: prev.depreciationMethod || category?.defaultDepreciationMethod || '',
      depreciationRate: prev.depreciationRate || category?.defaultDepreciationRate?.toString() || '',
      usefulLife: prev.usefulLife || category?.defaultUsefulLife?.toString() || '',
    }));
  }
};
```

## 🐛 Troubleshooting

### Issue: Defaults Not Applied
**Symptoms**: Asset created without depreciation values, but category has defaults

**Solutions**:
1. Check category has defaults set (not null/empty)
2. Verify backend service properly fetches category
3. Check browser console for API errors
4. Ensure categoryId is valid and exists

### Issue: Cannot Override Defaults
**Symptoms**: Custom values ignored, always uses category defaults

**Solutions**:
1. Check backend logic uses `||` operator (not `&&`)
2. Verify frontend sends custom values in API request
3. Check network tab to see what data is sent
4. Ensure form validation allows custom values

### Issue: UI Not Showing Defaults
**Symptoms**: Blue info box doesn't appear, no placeholders

**Solutions**:
1. Check category loaded successfully
2. Verify `selectedCategory` state is set
3. Check category has default values (not null)
4. Inspect React component state in dev tools

## 📈 Future Enhancements

### Potential Features
- 🔔 **Validation**: Warn if custom values deviate significantly from category defaults
- 📊 **Analytics**: Report on which assets use defaults vs custom values
- 📝 **Audit**: Log when defaults are overridden and why
- 🎨 **Templates**: Multiple default sets per category (conservative vs aggressive)
- 🔄 **Bulk Update**: Apply category defaults to existing assets
- 📧 **Notifications**: Alert when category defaults change
- 🏷️ **Inheritance**: Multi-level categories with cascading defaults

## ✅ Implementation Checklist

- [x] Backend service modified to fetch and apply category defaults
- [x] Frontend form enhanced with visual indicators
- [x] Category selection triggers default population
- [x] Override capability maintained
- [x] Test script created and passing
- [x] Documentation complete
- [x] Database schema supports defaults
- [x] UI shows clear feedback to users
- [x] Error handling for missing categories
- [x] Works in both create and edit modes

## 📖 Related Documentation

- **Asset Management**: [ASSET_MANAGEMENT_QUICK_START.md](ASSET_MANAGEMENT_QUICK_START.md)
- **Depreciation Guide**: [DEPRECIATION_IMPROVEMENTS_COMPLETE.md](DEPRECIATION_IMPROVEMENTS_COMPLETE.md)
- **Units of Production**: [UNITS_OF_PRODUCTION_GUIDE.md](UNITS_OF_PRODUCTION_GUIDE.md)

## 🎉 Summary

**Feature**: Category Defaults in Asset Creation  
**Priority**: 5 (from original gap analysis)  
**Status**: ✅ Complete  
**Impact**: Streamlines asset creation, ensures consistency  
**Files Modified**: 2 (backend service, frontend form)  
**Files Created**: 2 (test script, documentation)

---

**Version**: 1.0  
**Date**: February 2026  
**Author**: Asset Management Team

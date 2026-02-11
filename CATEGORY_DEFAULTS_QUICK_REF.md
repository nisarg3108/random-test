# Category Defaults - Quick Reference

## ✅ What Was Implemented

**Backend**: Assets automatically inherit depreciation defaults from their category  
**Frontend**: UI shows category defaults and allows override

## 🎯 How It Works

### As Admin: Set Category Defaults

1. Go to **Assets → Categories**
2. Create/Edit category
3. Set defaults:
   - Depreciation Method (Straight Line, Declining Balance, or Units of Production)
   - Depreciation Rate (percentage, e.g., 20)
   - Useful Life (months, e.g., 60 for 5 years)
4. Save

### As User: Create Asset

1. **Select Category** → Defaults auto-apply
2. **See Blue Box** → Shows what defaults will be used
3. **Leave Empty** → Uses category defaults
4. **OR Enter Value** → Overrides category default

## 📊 Example

**Category "IT Equipment"**:
- Method: STRAIGHT_LINE
- Rate: 20%
- Life: 60 months

**Create Asset**:
- Select "IT Equipment" category
- Leave depreciation fields empty
- Asset gets: Method=STRAIGHT_LINE, Rate=20%, Life=60

**OR Override**:
- Select "IT Equipment" category
- Enter: Method=DECLINING_BALANCE, Rate=25%, Life=48
- Asset gets: YOUR values (not category defaults)

## 🧪 Quick Test

```bash
node test-category-defaults.js
```

**Expected**: 
- ✅ Asset without values inherits category defaults
- ✅ Asset with values uses custom values

## 🎨 UI Features

- **Blue Info Box**: Shows category defaults applied
- **Labels**: "(Using category default)" indicators
- **Placeholders**: "Default: 20%" in input fields
- **Auto-fill**: Fields populate when category selected

## 📡 API Behavior

**Create asset WITHOUT depreciation**:
```json
{
  "categoryId": "cat-123",
  "assetCode": "LAP001",
  "purchasePrice": 1500
  // No depreciationMethod, depreciationRate, usefulLife
}
```

**Backend response**:
```json
{
  "depreciationMethod": "STRAIGHT_LINE",  // From category
  "depreciationRate": 20.0,                // From category
  "usefulLife": 60                         // From category
}
```

## 🐛 Troubleshooting

| Issue | Fix |
|-------|-----|
| Defaults not applied | Check category has defaults set |
| Cannot override | Enter value in form field |
| UI not showing info | Reload page, select category again |
| Test script fails | Stop backend server first |

## ✨ Benefits

- ⚡ Faster asset creation
- 📋 Consistent depreciation policies
- 🎯 Less manual data entry
- ✅ Fewer errors
- 🔄 Easy to override when needed

## 📖 Full Documentation

See [CATEGORY_DEFAULTS_GUIDE.md](CATEGORY_DEFAULTS_GUIDE.md)

---

**Status**: ✅ Complete (Priority 5)  
**Version**: 1.0

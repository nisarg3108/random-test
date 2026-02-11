# Units of Production Depreciation - Quick Start Guide

## What is Units of Production Depreciation?

Units of Production is a depreciation method where an asset's depreciation is based on actual usage rather than time. Perfect for assets like:
- Manufacturing machinery (by units produced)
- Vehicles (by miles driven)
- Printers/copiers (by pages printed)
- Mining equipment (by tons extracted)

## Formula

```
Depreciation per Unit = (Purchase Price - Salvage Value) / Total Expected Units
Period Depreciation = Depreciation per Unit × Units Produced in Period
```

## Quick Setup

### 1. Create Asset with Units of Production

Navigate to **Assets → Add New Asset**

**Basic Information:**
- Asset Code: `MACHINE-001`
- Name: `CNC Milling Machine`
- Category: `Manufacturing Equipment`

**Purchase Information:**
- Purchase Price: `$50,000`
- Purchase Date: `2024-01-01`

**Depreciation Information:**
- Method: **Units of Production** ✨
- Salvage Value: `$5,000`
- Total Expected Units: `100,000` (units the machine will produce over lifetime)

### 2. Calculate Monthly Depreciation

When the month ends, calculate depreciation based on actual production:

**API Request:**
```http
POST /api/asset-depreciation/calculate/ASSET-ID
Content-Type: application/json

{
  "year": 2024,
  "month": 1,
  "unitsProduced": 5000
}
```

**Calculation:**
```
Depreciation per unit = ($50,000 - $5,000) / 100,000 = $0.45
January depreciation = $0.45 × 5,000 = $2,250
```

**Result:**
- Opening Value: $50,000
- Depreciation: $2,250
- Closing Value: $47,750
- Units Produced to Date: 5,000

### 3. Track Over Time

**February** - Produced 7,000 units:
```
Depreciation = $0.45 × 7,000 = $3,150
Closing Value = $47,750 - $3,150 = $44,600
Units Produced to Date = 12,000
```

**March** - Produced 3,500 units:
```
Depreciation = $0.45 × 3,500 = $1,575
Closing Value = $44,600 - $1,575 = $43,025
Units Produced to Date = 15,500
```

## Real-World Examples

### Example 1: Delivery Vehicle by Mileage

**Asset Details:**
- Purchase Price: $30,000
- Salvage Value: $5,000
- Total Expected Miles: 200,000 miles

**Monthly Tracking:**
```javascript
// January: Drove 3,500 miles
depreciationPerMile = ($30,000 - $5,000) / 200,000 = $0.125
januaryDepreciation = $0.125 × 3,500 = $437.50
```

### Example 2: Industrial Printer by Pages

**Asset Details:**
- Purchase Price: $15,000
- Salvage Value: $1,000
- Total Expected Pages: 10,000,000 pages

**Monthly Tracking:**
```javascript
// January: Printed 250,000 pages
depreciationPerPage = ($15,000 - $1,000) / 10,000,000 = $0.0014
januaryDepreciation = $0.0014 × 250,000 = $350
```

### Example 3: Mining Equipment by Tons

**Asset Details:**
- Purchase Price: $500,000
- Salvage Value: $50,000
- Total Expected Tons: 1,000,000 tons

**Monthly Tracking:**
```javascript
// January: Extracted 25,000 tons
depreciationPerTon = ($500,000 - $50,000) / 1,000,000 = $0.45
januaryDepreciation = $0.45 × 25,000 = $11,250
```

## Benefits

✅ **Accurate Cost Allocation**: Matches depreciation to actual usage
✅ **Fair Valuation**: Idle assets don't depreciate
✅ **Production Insights**: Track asset utilization
✅ **Maintenance Planning**: Correlate usage with maintenance needs
✅ **Cost Per Unit**: Calculate true production costs

## When to Use Units of Production

### ✅ Good For:
- Manufacturing equipment
- Vehicles (by mileage)
- Mining/extraction equipment
- Industrial machinery
- Production tools

### ❌ Not Ideal For:
- Office furniture (use Straight Line)
- Buildings (use Straight Line)
- Technology/computers (use Declining Balance)
- Intangible assets

## Comparison with Other Methods

### Straight Line
- **Fixed** depreciation each period
- Based on **time**, not usage
- Simple and predictable

### Declining Balance
- **Higher** depreciation early on
- Based on **time**, not usage
- Good for tech that loses value quickly

### Units of Production
- **Variable** depreciation each period
- Based on **actual usage**
- Most accurate for usage-based assets

## Common Mistakes to Avoid

### ❌ Mistake 1: Underestimating Total Units
```
Problem: Set 50,000 units but asset produces 100,000
Result: Fully depreciated too early, salvage value reached prematurely
```

**Solution**: Research typical asset lifespan and be conservative with estimates

### ❌ Mistake 2: Not Tracking Units Accurately
```
Problem: Estimating monthly units instead of measuring
Result: Inaccurate depreciation, poor cost allocation
```

**Solution**: Integrate with production systems, use automated tracking

### ❌ Mistake 3: Using for Time-Based Assets
```
Problem: Using Units of Production for office chairs
Result: Unnecessary complexity, better with Straight Line
```

**Solution**: Only use for assets where usage varies significantly

## Integration Tips

### With Manufacturing Module:
```javascript
// Auto-track production output
const monthlyProduction = await getMonthlyProductionByMachine(machineId);
await calculateAssetDepreciation(assetId, year, month, tenantId, monthlyProduction);
```

### With Fleet Management:
```javascript
// Track mileage from vehicle logs
const monthlyMileage = await getVehicleMileage(vehicleId, year, month);
await calculateAssetDepreciation(assetId, year, month, tenantId, monthlyMileage);
```

### With Production Analytics:
```javascript
// Generate depreciation reports with production correlation
const report = {
  unitsProduced: 5000,
  depreciationAmount: 2250,
  costPerUnit: 2250 / 5000 // $0.45 per unit
};
```

## Reporting

### Cost Per Unit Report
```javascript
const asset = await getAssetById(assetId);
const totalUnitsProduced = asset.unitsProducedToDate;
const totalDepreciation = asset.accumulatedDepreciation;
const costPerUnit = totalDepreciation / totalUnitsProduced;

console.log(`Cost per unit: $${costPerUnit.toFixed(2)}`);
```

### Remaining Life Report
```javascript
const remainingUnits = asset.totalExpectedUnits - asset.unitsProducedToDate;
const percentUsed = (asset.unitsProducedToDate / asset.totalExpectedUnits) * 100;

console.log(`Remaining capacity: ${remainingUnits} units (${100 - percentUsed}%)`);
```

## API Reference

### Calculate Depreciation
```http
POST /api/asset-depreciation/calculate/:assetId
```

**Request Body:**
```json
{
  "year": 2024,
  "month": 2,
  "unitsProduced": 5000
}
```

**Response:**
```json
{
  "id": "uuid",
  "assetId": "uuid",
  "period": "2024-02-29T00:00:00.000Z",
  "year": 2024,
  "month": 2,
  "openingValue": 50000,
  "depreciationAmount": 2250,
  "closingValue": 47750,
  "accumulatedDepreciation": 2250,
  "method": "UNITS_OF_PRODUCTION",
  "unitsProduced": 5000
}
```

### Get Depreciation History
```http
GET /api/asset-depreciation/history/:assetId?limit=12
```

Shows up to 12 months of depreciation records including units produced each period.

## Best Practices

1. **Set Realistic Estimates**: Research industry standards for total expected units
2. **Track Accurately**: Use automated systems when possible
3. **Review Regularly**: Adjust estimates if actual usage differs significantly
4. **Document Assumptions**: Record how you calculated total expected units
5. **Integrate Systems**: Connect with production/operations for automatic tracking
6. **Monitor Utilization**: Use depreciation data to identify under-utilized assets
7. **Plan Maintenance**: Schedule based on units produced, not just time
8. **Update Records Promptly**: Calculate depreciation monthly for accuracy

## Troubleshooting

### Error: "Total expected units must be configured"
**Solution**: Edit the asset and set "Total Expected Units" field

### Error: "Units produced must be provided"
**Solution**: Include `unitsProduced` in the API request body

### Depreciation seems too high/low
**Solution**: Verify:
- Total Expected Units is realistic
- Units Produced for the period is accurate
- Purchase Price and Salvage Value are correct

### Asset reached salvage value too early
**Solution**: 
- Increase Total Expected Units estimate
- Consider if asset can continue beyond original estimate
- Review if usage tracking is accurate

---

**Need Help?** 
- Check [DEPRECIATION_IMPROVEMENTS_COMPLETE.md](DEPRECIATION_IMPROVEMENTS_COMPLETE.md) for technical details
- Review [ASSET_MANAGEMENT_IMPLEMENTATION.md](ASSET_MANAGEMENT_IMPLEMENTATION.md) for overall system

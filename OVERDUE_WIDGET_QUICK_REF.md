# Overdue Dashboard Widget - Quick Reference

## ✅ What Was Created

**Widget Component**: `frontend/src/components/assets/OverdueAllocationWidget.jsx`

**Integrated Into**:
- ✅ Admin Dashboard (shows 4 items)
- ✅ Manager Dashboard (shows 5 items)

## 🎯 Features

- 📊 Total overdue count
- ⏱️ Average days overdue
- 📋 List of overdue allocations with:
  - Asset name & code
  - Employee name
  - Expected return date
  - Days overdue (color-coded)
  - Purpose
- 🔄 Refresh button
- 🔗 Click-through to allocations page
- ✨ Loading & empty states

## 🎨 Color Coding

- 🔴 **Red**: > 7 days overdue (critical)
- 🟠 **Orange**: 4-7 days overdue (warning)
- 🟡 **Yellow**: 1-3 days overdue (attention)

## 📦 Usage

```jsx
import OverdueAllocationWidget from '../../components/assets/OverdueAllocationWidget';

<OverdueAllocationWidget 
  maxItems={5}         // Max items to show (default: 5)
  showDetails={true}   // Show employee/dates (default: true)
/>
```

## 🚀 Quick Test

1. **View Widget**:
   - Log in as Admin or Manager
   - Go to Dashboard
   - See "Overdue Allocations" widget

2. **Create Test Overdue**:
   ```javascript
   // In browser console
   fetch('http://localhost:5000/api/allocations', {
     method: 'POST',
     headers: {
       'Authorization': 'Bearer ' + localStorage.getItem('token'),
       'Content-Type': 'application/json'
     },
     body: JSON.stringify({
       assetId: 'asset-id-here',
       employeeId: 'employee-id-here',
       allocatedDate: '2024-01-01',
       expectedReturnDate: '2024-01-10', // Past date
       purpose: 'Test widget'
     })
   }).then(r => r.json()).then(console.log);
   
   // Mark as overdue
   fetch('http://localhost:5000/api/allocations/mark-overdue', {
     method: 'POST',
     headers: {
       'Authorization': 'Bearer ' + localStorage.getItem('token')
     }
   }).then(r => r.json()).then(console.log);
   ```

3. **Refresh Dashboard**: Click refresh button on widget

## 📊 Widget Layout

```
┌──────────────────────────────────┐
│ [!] Overdue Allocations    [↻]  │
├──────────────────────────────────┤
│ Total: 3    │    Avg: 5 days    │
├──────────────────────────────────┤
│ 📦 Laptop HP ProBook      [5]   │
│    👤 John Doe            days   │
│    🕐 Jan 10, 2024               │
├──────────────────────────────────┤
│ [View All Overdue Allocations]   │
└──────────────────────────────────┘
```

## 🔧 Integration

**Add to any dashboard**:

1. Import component
2. Add to layout:
   ```jsx
   <div className="lg:col-span-1">
     <OverdueAllocationWidget maxItems={5} />
   </div>
   ```

## 🐛 Quick Fixes

| Issue | Fix |
|-------|-----|
| Widget not showing | Check Admin/Manager role |
| No data | Run overdue check endpoint |
| Wrong days count | Check server timezone |
| Styling broken | Clear cache, reload |

## 📡 API Used

- **Endpoint**: `GET /api/asset-allocations/overdue`
- **Method**: `assetAPI.getOverdueAllocations()`
- **File**: `frontend/src/api/asset.api.js`

## 📖 Full Documentation

See [OVERDUE_DASHBOARD_WIDGET_GUIDE.md](OVERDUE_DASHBOARD_WIDGET_GUIDE.md)

## ✨ Key Benefits

- ✅ Real-time visibility
- ✅ Color-coded priorities
- ✅ One-click navigation
- ✅ Mobile responsive
- ✅ Auto-refresh capable
- ✅ Production ready

---

**Status**: ✅ Live on Admin & Manager Dashboards  
**Version**: 1.0

# Overdue Allocation Dashboard Widget - Implementation Guide

## ✅ Feature Complete

A comprehensive dashboard widget has been created to display overdue asset allocation statistics and details, providing real-time visibility into assets that have not been returned by their expected return date.

## 📊 What Was Implemented

### 1. Overdue Allocation Widget Component
**File**: `frontend/src/components/assets/OverdueAllocationWidget.jsx`

**Features**:
- 📊 **Statistics Summary Cards**:
  - Total overdue allocations count
  - Average days overdue across all allocations
  
- 📋 **Detailed List View**:
  - Asset name and code
  - Employee name (assignee)
  - Expected return date
  - Days overdue with color-coded severity badges
  - Allocation purpose (if provided)
  
- 🎨 **Visual Indicators**:
  - Red badges for > 7 days overdue (critical)
  - Orange badges for 4-7 days overdue (warning)
  - Yellow badges for 1-3 days overdue (attention)
  
- 🔄 **Interactive Features**:
  - Refresh button to reload data
  - Click-through to full allocations page
  - "View All" button with count indicator
  - Configurable max items display
  
- ✨ **User Experience**:
  - Loading states with skeleton screens
  - Empty state with positive messaging
  - Error handling with user-friendly messages
  - Responsive design for all screen sizes
  - Smooth hover transitions

### 2. Dashboard Integration
**Files Modified**:
- `frontend/src/pages/dashboards/AdminDashboard.jsx`
- `frontend/src/pages/dashboards/ManagerDashboard.jsx`

**Integration Points**:
- Added to Admin Dashboard (shows 4 items max)
- Added to Manager Dashboard (shows 5 items max)
- Positioned alongside Approval Widget in grid layout
- Maintains consistent styling with other dashboard components

## 🎨 Widget Design

### Layout Structure
```
┌─────────────────────────────────────────┐
│ [!] Overdue Allocations      [Refresh] │
│     Assets past return date            │
├─────────────────────────────────────────┤
│  [Total: X]    [Avg Days: Y]           │
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │ 📦 Laptop HP ProBook        [5]    │ │
│ │    Code: LAP001              days   │ │
│ │    👤 John Doe                      │ │
│ │    🕐 Expected: Jan 10, 2024        │ │
│ │    Purpose: Development work        │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ [MORE ITEMS...]                         │
│                                         │
│ [ View All Overdue Allocations → ]     │
│ X more overdue allocations              │
└─────────────────────────────────────────┘
```

### Color-Coded Severity System
- 🔴 **Critical (>7 days)**: `bg-red-100, text-red-700`
- 🟠 **Warning (4-7 days)**: `bg-orange-100, text-orange-700`
- 🟡 **Attention (1-3 days)**: `bg-yellow-100, text-yellow-700`

## 🚀 Usage

### Component Props

```jsx
<OverdueAllocationWidget 
  maxItems={5}          // Maximum items to display (default: 5)
  showDetails={true}    // Show employee and date details (default: true)
/>
```

### Props Details

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `maxItems` | number | 5 | Maximum number of overdue allocations to display in the list |
| `showDetails` | boolean | true | Whether to show employee name and expected return date details |

### Example Usage in Dashboards

**Admin Dashboard**:
```jsx
<OverdueAllocationWidget maxItems={4} showDetails={true} />
```

**Manager Dashboard**:
```jsx
<OverdueAllocationWidget maxItems={5} showDetails={true} />
```

**Custom Implementation**:
```jsx
// Compact version (just counts, no details)
<OverdueAllocationWidget maxItems={3} showDetails={false} />

// Extended version
<OverdueAllocationWidget maxItems={10} showDetails={true} />
```

## 📡 API Integration

### Endpoint Used
```
GET /api/asset-allocations/overdue
```

**Response Structure**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "status": "OVERDUE",
      "allocatedDate": "2024-01-01T00:00:00.000Z",
      "expectedReturnDate": "2024-01-10T00:00:00.000Z",
      "purpose": "Development work",
      "asset": {
        "id": "uuid",
        "name": "Laptop HP ProBook",
        "assetCode": "LAP001"
      },
      "employee": {
        "id": "uuid",
        "name": "John Doe",
        "email": "john@example.com"
      }
    }
  ]
}
```

### API Method
Already exists in `frontend/src/api/asset.api.js`:
```javascript
getOverdueAllocations: () => apiClient.get('/asset-allocations/overdue')
```

## 🎯 Features in Detail

### 1. Statistics Cards
- **Total Overdue**: Shows count of all overdue allocations
- **Average Days**: Calculates and displays average days overdue across all items
- Auto-updates when data refreshes

### 2. Allocation List Items
Each item displays:
- 📦 Asset icon with name
- Asset code (LAP001, MON005, etc.)
- 👤 Employee name who has the asset
- 🕐 Expected return date (formatted: "Jan 10, 2024")
- 📝 Purpose/reason for allocation (if provided)
- 🏷️ Days overdue badge (large, prominent, color-coded)

### 3. Refresh Functionality
- Manual refresh button in header
- Spinning icon animation during refresh
- Preserves current scroll position
- Shows loading state briefly

### 4. Navigation
- Click any allocation card → navigates to `/assets/allocations`
- "View All" button → navigates to `/assets/allocations` with overdue filter active
- Shows count of additional items not displayed

### 5. Empty State
When no overdue allocations:
- ✅ Green success icon
- "All Clear!" message
- Encouraging text
- Clean, positive design

### 6. Error Handling
- Red error banner if API fails
- User-friendly error message
- Doesn't break widget layout
- Retry via refresh button

## 🎨 Styling

### Design System
- Uses `modern-card-elevated` class for consistent elevation
- Rounded corners: `rounded-lg`, `rounded-xl`, `rounded-2xl`
- Color palette: Red for alerts, gray for neutral, green for success
- Spacing: Consistent padding and gaps throughout

### Responsive Behavior
- Mobile: Single column, cards stack vertically
- Tablet: Stats side-by-side, list items stack
- Desktop: Full grid layout with all features visible

### Hover Effects
- Cards: `hover:shadow-md transition-shadow`
- Buttons: Color transitions on hover
- Cursor changes to pointer on clickable elements

## 📱 Responsive Design

### Breakpoints
- **Mobile (< 768px)**: Stacked layout, 1 column
- **Tablet (768px - 1024px)**: 2 columns for stats, 1 for list
- **Desktop (> 1024px)**: Full 3-column grid in dashboards

### Grid Layout in Dashboards
```jsx
// 3-column grid on large screens
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  <div className="lg:col-span-1">
    <ApprovalWidget />
  </div>
  <div className="lg:col-span-1">
    <OverdueAllocationWidget />
  </div>
  <div className="lg:col-span-1">
    {/* Other widget */}
  </div>
</div>
```

## 🔍 How It Works

### Data Flow
1. **Component Mount**: Calls `loadOverdueAllocations()` via `useEffect`
2. **API Request**: Fetches data from `/api/asset-allocations/overdue`
3. **Data Processing**: Calculates days overdue for each allocation
4. **Rendering**: Displays stats cards and list items
5. **User Interaction**: Handle clicks, refresh, navigation

### Days Overdue Calculation
```javascript
const calculateDaysOverdue = (expectedReturnDate) => {
  const today = new Date();
  const returnDate = new Date(expectedReturnDate);
  const diffTime = today - returnDate;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};
```

### Severity Determination
```javascript
const severityColor = 
  daysOverdue > 7 ? 'red' :      // Critical
  daysOverdue > 3 ? 'orange' :    // Warning
  'yellow';                        // Attention
```

## 🧪 Testing

### Manual Testing Steps

1. **View Widget in Dashboard**
   ```
   1. Log in as Admin or Manager
   2. Navigate to Dashboard (home page)
   3. Locate "Overdue Allocations" widget
   4. Verify stats cards display correctly
   ```

2. **Test With No Overdue Items**
   ```
   1. Ensure all allocations are returned or not overdue
   2. Verify "All Clear!" empty state shows
   3. Check green success icon displays
   ```

3. **Test With Overdue Items**
   ```
   1. Create allocation with past expectedReturnDate
   2. Run overdue check (see EMAIL_NOTIFICATION_GUIDE.md)
   3. Refresh dashboard
   4. Verify allocation appears in widget
   5. Check days overdue badge shows correct number
   6. Verify color coding matches severity
   ```

4. **Test Refresh Functionality**
   ```
   1. Click refresh button in widget header
   2. Verify spinning icon animation
   3. Confirm data reloads
   4. Check no errors occur
   ```

5. **Test Navigation**
   ```
   1. Click any allocation card
   2. Verify redirects to /assets/allocations
   3. Click "View All" button
   4. Confirm same redirect behavior
   ```

6. **Test Responsive Design**
   ```
   1. View on desktop (full grid)
   2. Resize to tablet (adjusted layout)
   3. Resize to mobile (stacked cards)
   4. Verify all elements visible at each size
   ```

### Browser Console Testing

```javascript
// Test API endpoint
fetch('http://localhost:5000/api/asset-allocations/overdue', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  }
})
.then(r => r.json())
.then(data => {
  console.log('Overdue Allocations:', data);
  console.log('Count:', data.data.length);
});

// Check if widget component loaded
console.log('OverdueWidget loaded:', 
  document.querySelector('.modern-card-elevated') !== null
);
```

## 🐛 Troubleshooting

### Widget Not Showing
**Issue**: Widget doesn't appear on dashboard
**Solutions**:
1. Check browser console for errors
2. Verify import statement in dashboard file
3. Ensure component is in grid layout
4. Check user has Admin or Manager role

### No Data Displayed
**Issue**: Widget shows "All Clear!" but should have overdue items
**Solutions**:
1. Run overdue check: `POST /api/allocations/mark-overdue`
2. Verify allocations exist with past expectedReturnDate
3. Check allocation status is "ACTIVE" (not already marked OVERDUE)
4. Look at Network tab for API response

### Days Overdue Incorrect
**Issue**: Badge shows wrong number of days
**Solutions**:
1. Check server time zone settings
2. Verify expectedReturnDate in database
3. Ensure dates are stored as UTC
4. Check calculation logic in component

### Styling Issues
**Issue**: Widget looks broken or misaligned
**Solutions**:
1. Clear browser cache
2. Verify Tailwind CSS is loaded
3. Check for CSS conflicts
4. Inspect element for applied classes

### Performance Issues
**Issue**: Widget loads slowly
**Solutions**:
1. Check API response time
2. Reduce maxItems prop value
3. Optimize backend query performance
4. Consider pagination for large datasets

## 🎯 Integration Checklist

To add this widget to other dashboards or pages:

- [ ] Import component: `import OverdueAllocationWidget from '../../components/assets/OverdueAllocationWidget';`
- [ ] Add to JSX layout: `<OverdueAllocationWidget maxItems={5} showDetails={true} />`
- [ ] Wrap in grid column div: `<div className="lg:col-span-1">...</div>`
- [ ] Test on desktop, tablet, and mobile
- [ ] Verify API endpoint is accessible
- [ ] Check user permissions if needed
- [ ] Test refresh functionality
- [ ] Verify navigation works
- [ ] Check error states

## 📊 Dashboard Locations

### Current Implementations

✅ **Admin Dashboard**
- Location: `frontend/src/pages/dashboards/AdminDashboard.jsx`
- Position: Left side of 3-column grid
- Props: `maxItems={4}, showDetails={true}`
- Layout: Next to Approval Widget

✅ **Manager Dashboard**
- Location: `frontend/src/pages/dashboards/ManagerDashboard.jsx`
- Position: Center of 3-column grid
- Props: `maxItems={5}, showDetails={true}`
- Layout: Between Approval Widget and Departments widget

### Future Integration Options

💡 **User Dashboard**
- Show only user's own overdue allocations
- Modify API call to filter by current user
- Useful for personal accountability

💡 **Asset Dashboard**
- Dedicated asset management overview
- Show alongside other asset metrics
- Larger maxItems value (e.g., 10)

💡 **Reports Page**
- Historical overdue trends
- Analytics and charts
- Integration with other reports

## 🚦 Best Practices

### When to Use This Widget
- ✅ Admin/Manager dashboards for oversight
- ✅ Asset management pages
- ✅ Reports and analytics views
- ✅ Department manager dashboards
- ❌ Public-facing pages
- ❌ Login/logout pages

### Configuration Recommendations
- **High-level dashboards**: `maxItems={3-5}` for overview
- **Detailed views**: `maxItems={8-10}` with pagination
- **Mobile dashboards**: `maxItems={3}`, `showDetails={false}`
- **Desktop only**: Full details, larger max items

### Performance Tips
- Don't exceed `maxItems={15}` without pagination
- Consider caching API responses (1-2 minutes)
- Use `showDetails={false}` for compact views
- Lazy load on large dashboards

## 🔄 Future Enhancements

### Potential Features
- 🔔 Real-time updates via WebSocket
- 📊 Chart visualization of overdue trends
- 🔍 Search/filter within widget
- 📱 Push notifications for new overdue items
- 📧 Quick email reminder button
- 📅 Calendar view of return dates
- 🏷️ Category/department filtering
- 📤 Export overdue list to CSV
- 🎨 Customizable severity thresholds
- 📝 Inline notes/comments on allocations

### Extension Ideas
- **OverdueMaintenanceWidget**: Similar widget for maintenance
- **UpcomingReturnsWidget**: Assets due soon (preventive)
- **AllocationHistoryWidget**: Recent allocation activity
- **AssetHealthWidget**: Overall asset system health

## 📖 Related Documentation

- **Overdue System**: [OVERDUE_ALLOCATION_TESTING_GUIDE.md](OVERDUE_ALLOCATION_TESTING_GUIDE.md)
- **Email Notifications**: [EMAIL_NOTIFICATION_GUIDE.md](EMAIL_NOTIFICATION_GUIDE.md)
- **Implementation Summary**: [EMAIL_NOTIFICATION_IMPLEMENTATION.md](EMAIL_NOTIFICATION_IMPLEMENTATION.md)
- **Quick Reference**: [EMAIL_NOTIFICATION_QUICK_REF.md](EMAIL_NOTIFICATION_QUICK_REF.md)
- **Asset Management**: [ASSET_MANAGEMENT_QUICK_START.md](ASSET_MANAGEMENT_QUICK_START.md)

## ✨ Summary

The Overdue Allocation Dashboard Widget provides:
- 📊 Real-time overdue statistics
- 📋 Detailed allocation information
- 🎨 Color-coded severity indicators
- 🔄 Interactive refresh functionality
- 📱 Fully responsive design
- 🚀 Easy integration into any dashboard
- ✅ Production-ready component

**Status**: ✅ Complete and Integrated  
**Version**: 1.0  
**Date**: February 2026  
**Integration**: Admin & Manager Dashboards

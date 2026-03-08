# Attendance System - Dashboard & UI Locations Guide

## 🎯 Quick Access - Where to Find Everything

### For Employees (Regular Users)

#### 1. **My Attendance Page**
- **URL:** `http://localhost:3000/attendance`
- **Navigation:** Dashboard → Attendance (sidebar)
- **Features:**
  - ✅ Check-In button (with GPS permission)
  - ✅ Check-Out button
  - ✅ Current status (Checked In / Checked Out)
  - ✅ Today's work hours
  - ✅ Break timer
  - 📊 This month summary (present days, late days, etc.)

#### 2. **Daily Check-In/Out Page**
- **URL:** `http://localhost:3000/attendance/daily`
- **Features:**
  - Large Check-In/Out buttons
  - Real-time clock
  - GPS location status
  - Today's shift timings
  - Break management

#### 3. **My Attendance History**
- **URL:** `http://localhost:3000/attendance/history`
- **Features:**
  - Calendar view of past attendance
  - Filter by date range
  - Status badges (Present, Late, Absent)
  - Work hours per day
  - Export to Excel

#### 4. **My Reports**
- **URL:** `http://localhost:3000/attendance/reports`
- **Features:**
  - Monthly attendance summary
  - Attendance percentage
  - Punctuality percentage
  - Work hours chart
  - Overtime summary

#### 5. **My Leaves**
- **URL:** `http://localhost:3000/leaves`
- **Features:**
  - Apply for leave button
  - Leave balance cards (Casual, Sick, Earned)
  - Pending leaves
  - Leave history
  - Cancel leave option

#### 6. **Apply Leave**
- **URL:** `http://localhost:3000/leaves/new`
- **Features:**
  - Leave type selector
  - Date range picker
  - Reason text area
  - Half-day option
  - Emergency leave checkbox

#### 7. **Leave Balance**
- **URL:** `http://localhost:3000/leaves/balance`
- **Features:**
  - Visual balance cards
  - Total vs Used vs Available
  - Carry forward leaves
  - Year selector

#### 8. **Request Regularization**
- **URL:** `http://localhost:3000/attendance/regularization`
- **Features:**
  - Forgot check-in/out form
  - Wrong location correction
  - Late arrival explanation
  - Upload supporting documents
  - Pending regularization status

---

### For Managers

#### 9. **Team Attendance**
- **URL:** `http://localhost:3000/admin/attendance/team`
- **Navigation:** Admin → Attendance → Team View
- **Features:**
  - Team members list
  - Today's status (Present/Absent/Late)
  - Real-time updates
  - Who's checked in right now
  - Late arrivals alert
  - Missing check-outs

#### 10. **Leave Approvals**
- **URL:** `http://localhost:3000/admin/attendance/leaves/approvals`
- **Navigation:** Admin → Attendance → Leave Approvals
- **Features:**
  - Pending leave requests queue
  - Employee details
  - Leave balance verification
  - Approve/Reject buttons
  - Add approval notes
  - Filter by date/employee

#### 11. **Regularization Approvals**
- **URL:** `http://localhost:3000/admin/attendance/regularizations`
- **Features:**
  - Pending regularization requests
  - Original vs Requested times
  - Employee reason
  - Approve/Reject with notes
  - History of past regularizations

#### 12. **Team Reports**
- **URL:** `http://localhost:3000/admin/attendance/reports`
- **Features:**
  - Team attendance summary
  - Department-wise breakdown
  - Attendance trends
  - Top performers
  - Attendance issues (late, absent)

---

### For Admins (HR/Admin)

#### 13. **Real-Time Attendance Dashboard**
- **URL:** `http://localhost:3000/admin/attendance/dashboard`
- **Navigation:** Admin → Attendance → Dashboard
- **Features:**
  - 📊 **Live Stats Cards:**
    - Total Employees
    - Present Today
    - Late Arrivals
    - On Leave
    - Absent
    - Remote Workers
  - 📍 **Recent Check-Ins:** Live feed of who just checked in
  - ⚠️ **Alerts Section:**
    - Late arrivals
    - Missing check-outs
    - GPS spoofing alerts
  - 📈 **Charts:**
    - Attendance trend (last 7 days)
    - Present vs Absent pie chart
    - Office vs Remote breakdown
  - 🔔 **Real-time WebSocket Updates**

#### 14. **Daily Attendance View**
- **URL:** `http://localhost:3000/admin/attendance/daily`
- **Features:**
  - Date picker
  - Employee-wise attendance table
  - Check-in/out times
  - Work hours
  - Status filters
  - Export to Excel
  - Mark manual attendance

#### 15. **Shift Management**
- **URL:** `http://localhost:3000/admin/attendance/shifts`
- **Navigation:** Admin → Settings → Shifts
- **Features:**
  - ➕ Create new shift
  - 📋 List all shifts
  - ✏️ Edit shift timings
  - 🗑️ Delete shift
  - 👥 Assign shift to employees
  - Set default shift
  - Configure:
    - Start/End time
    - Grace period
    - Break times
    - Overtime rules
    - Working days

#### 16. **Office Locations**
- **URL:** `http://localhost:3000/admin/attendance/locations`
- **Navigation:** Admin → Settings → Office Locations
- **Features:**
  - ➕ Add new office location
  - 📍 GPS coordinates setup
  - 🗺️ Geofence radius
  - Enforce geofence toggle
  - Active/Inactive status
  - Map view (if integrated)

#### 17. **Holiday Calendar**
- **URL:** `http://localhost:3000/admin/settings/holidays`
- **Navigation:** Admin → Settings → Holidays
- **Features:**
  - 📅 Calendar view
  - ➕ Add holiday
  - Year selector
  - Holiday type (National/Regional/Optional)
  - Bulk import holidays
  - Edit/Delete holidays

#### 18. **Bulk Operations**
- **URL:** `http://localhost:3000/admin/attendance/bulk`
- **Features:**
  - Bulk shift assignment
  - Select multiple employees
  - Assign shift + location
  - Effective date
  - Success/Failure report

#### 19. **Attendance Reports**
- **URL:** `http://localhost:3000/admin/attendance/reports`
- **Features:**
  - 📊 **Monthly Reports:**
    - Select employee
    - Month/Year picker
    - Detailed breakdown
    - Performance rating
  - 📈 **Analytics:**
    - Department-wise attendance
    - Trend analysis
    - Late arrival patterns
    - Overtime analysis
  - 📥 **Export Options:**
    - Export to Excel
    - Export to PDF
    - Email report

#### 20. **Attendance Settings**
- **URL:** `http://localhost:3000/admin/attendance/settings`
- **Features:**
  - GPS accuracy threshold
  - Geofence enforcement
  - Auto check-out time
  - Break limits
  - Overtime approval
  - Notification settings
  - Regularization days limit

---

## 🎨 UI Components Available

### Frontend Pages Created (21 files)

```
frontend/app/
├── attendance/
│   ├── page.tsx              ← My Attendance Dashboard
│   ├── daily/page.tsx        ← Daily Check-In/Out
│   ├── history/page.tsx      ← My History
│   ├── reports/page.tsx      ← My Reports
│   └── regularization/
│       ├── page.tsx          ← Request Regularization
│       └── [id]/page.tsx     ← Regularization Details
│
├── leaves/
│   ├── page.tsx              ← My Leaves Dashboard
│   ├── new/page.tsx          ← Apply Leave Form
│   ├── [id]/page.tsx         ← Leave Details
│   └── balance/page.tsx      ← Leave Balance
│
└── admin/
    └── attendance/
        ├── dashboard/page.tsx       ← Real-Time Dashboard ⭐
        ├── daily/page.tsx           ← Daily View
        ├── team/page.tsx            ← Team Attendance
        ├── reports/
        │   ├── page.tsx             ← Reports List
        │   └── [type]/page.tsx      ← Report Details
        ├── leaves/
        │   ├── approvals/page.tsx   ← Leave Approvals
        │   └── [id]/page.tsx        ← Leave Detail
        ├── shifts/
        │   ├── page.tsx             ← Shift Management
        │   └── [id]/page.tsx        ← Shift Details
        ├── locations/
        │   ├── page.tsx             ← Office Locations
        │   └── [id]/page.tsx        ← Location Details
        └── settings/
            └── holidays/page.tsx    ← Holiday Management
```

---

## 🚀 Quick Start Testing

### Step 1: Start Frontend
```bash
cd /Users/pankajthakur/IdeaProjects/CRM/frontend
npm run dev
```

### Step 2: Login
```
URL: http://localhost:3000/login
```

### Step 3: Employee Flow
1. Go to: `http://localhost:3000/attendance`
2. Click **"Check In"** button
3. Allow GPS permission when prompted
4. See your status change to "Checked In"
5. Take a break → Click **"Start Break"**
6. Come back → Click **"End Break"**
7. End of day → Click **"Check Out"**

### Step 4: Check Your Attendance
1. Go to: `http://localhost:3000/attendance/history`
2. See calendar with your attendance
3. Click on any date to see details

### Step 5: Apply for Leave
1. Go to: `http://localhost:3000/leaves`
2. Check your balance cards
3. Click **"Apply for Leave"**
4. Fill form and submit
5. Wait for manager approval

### Step 6: Manager - Approve Leave
1. Login as manager
2. Go to: `http://localhost:3000/admin/attendance/leaves/approvals`
3. See pending requests
4. Click **"Approve"** or **"Reject"**

### Step 7: Admin - View Dashboard
1. Login as admin
2. Go to: `http://localhost:3000/admin/attendance/dashboard`
3. See real-time stats:
   - Who's present today
   - Who's late
   - Who's on leave
   - Recent check-ins
4. Alerts show up automatically

---

## 📱 Navigation Menu Structure

Update your `frontend/components/Navigation.tsx` to include:

```tsx
// Employee Menu
{
  name: 'My Attendance',
  icon: ClockIcon,
  href: '/attendance',
  children: [
    { name: 'Check In/Out', href: '/attendance/daily' },
    { name: 'History', href: '/attendance/history' },
    { name: 'Reports', href: '/attendance/reports' },
    { name: 'Regularization', href: '/attendance/regularization' }
  ]
},
{
  name: 'My Leaves',
  icon: CalendarIcon,
  href: '/leaves',
  children: [
    { name: 'Apply Leave', href: '/leaves/new' },
    { name: 'My Leaves', href: '/leaves' },
    { name: 'Balance', href: '/leaves/balance' }
  ]
}

// Admin Menu
{
  name: 'Attendance Management',
  icon: ChartBarIcon,
  href: '/admin/attendance',
  roles: ['ADMIN', 'MANAGER'],
  children: [
    { name: 'Dashboard', href: '/admin/attendance/dashboard' },  // ⭐ Start here
    { name: 'Daily View', href: '/admin/attendance/daily' },
    { name: 'Team View', href: '/admin/attendance/team' },
    { name: 'Reports', href: '/admin/attendance/reports' },
    { name: 'Leave Approvals', href: '/admin/attendance/leaves/approvals' }
  ]
},
{
  name: 'Attendance Settings',
  icon: CogIcon,
  href: '/admin/attendance/settings',
  roles: ['ADMIN'],
  children: [
    { name: 'Shifts', href: '/admin/attendance/shifts' },
    { name: 'Locations', href: '/admin/attendance/locations' },
    { name: 'Holidays', href: '/admin/settings/holidays' }
  ]
}
```

---

## 🎯 Key Pages to Start With

### **For Testing - Start Here:**

1. **Admin Dashboard (Most Important)**
   - URL: `http://localhost:3000/admin/attendance/dashboard`
   - Shows everything at a glance
   - Real-time updates
   - All key metrics

2. **Employee Check-In**
   - URL: `http://localhost:3000/attendance/daily`
   - Test the core functionality
   - GPS verification

3. **Holiday Management**
   - URL: `http://localhost:3000/admin/settings/holidays`
   - Setup company holidays first

4. **Shift Management**
   - URL: `http://localhost:3000/admin/attendance/shifts`
   - Create shifts before assigning

5. **Office Locations**
   - URL: `http://localhost:3000/admin/attendance/locations`
   - Setup locations with GPS coordinates

---

## 🔍 How to Access Each Feature

### Scenario 1: "I want to check in for the day"
→ Go to `http://localhost:3000/attendance` or `/attendance/daily`
→ Click the big **"Check In"** button
→ Allow GPS when browser asks
→ See confirmation message

### Scenario 2: "I want to see who's present today"
→ Login as admin
→ Go to `http://localhost:3000/admin/attendance/dashboard`
→ See live stats at the top
→ Scroll to "Recent Check-Ins" section

### Scenario 3: "I need to apply for leave"
→ Go to `http://localhost:3000/leaves`
→ Check your balance
→ Click **"Apply for Leave"**
→ Fill dates and reason
→ Submit

### Scenario 4: "I forgot to check out yesterday"
→ Go to `http://localhost:3000/attendance/regularization`
→ Select date
→ Choose "Forgot Check-Out"
→ Enter correct times
→ Submit with reason

### Scenario 5: "I want to approve team leaves"
→ Login as manager
→ Go to `http://localhost:3000/admin/attendance/leaves/approvals`
→ See all pending requests
→ Click **"Review"** on any request
→ Approve or reject with notes

---

## 📊 Dashboard Widgets Overview

### Main Dashboard (`/admin/attendance/dashboard`)

```
┌─────────────────────────────────────────────────────────────┐
│  📊 Today's Attendance Overview                              │
├──────────┬──────────┬──────────┬──────────┬──────────┬──────┤
│   Total  │ Present  │   Late   │ On Leave │  Absent  │Remote│
│    50    │    45    │     5    │     3    │     2    │  10  │
└──────────┴──────────┴──────────┴──────────┴──────────┴──────┘

┌─────────────────────────────────────────────────────────────┐
│  🕐 Recent Check-Ins (Live Feed)                             │
├─────────────────────────────────────────────────────────────┤
│  • John Doe checked in at 09:05 AM ✅                        │
│  • Jane Smith checked in at 09:12 AM ⚠️ (Late)              │
│  • Mike Johnson checked in at 09:00 AM ✅                    │
└─────────────────────────────────────────────────────────────┘

┌──────────────────────┐  ┌──────────────────────────────────┐
│  ⚠️ Alerts            │  │  📈 7-Day Attendance Trend       │
├──────────────────────┤  ├──────────────────────────────────┤
│  • 5 Late Arrivals   │  │  [Line Chart: 90% → 95% → 92%]   │
│  • 3 Missing Checkouts│  │                                  │
│  • 1 GPS Alert       │  │                                  │
└──────────────────────┘  └──────────────────────────────────┘
```

---

## 🎬 Video Walkthrough Script

### For Creating Demo Video:

1. **Start Backend:** `./mvnw spring-boot:run`
2. **Start Frontend:** `npm run dev`
3. **Admin Setup:**
   - Login at `/login`
   - Go to `/admin/attendance/locations` → Add office
   - Go to `/admin/attendance/shifts` → Create shift
   - Go to `/admin/settings/holidays` → Add holidays
4. **Employee Experience:**
   - Login as employee
   - Go to `/attendance/daily`
   - Click Check-In
   - Show GPS permission
   - Show success message
   - Take break → Start/End
   - Check-Out
5. **View Reports:**
   - Go to `/attendance/history`
   - Show calendar view
   - Go to `/attendance/reports`
   - Show monthly summary
6. **Admin Dashboard:**
   - Login as admin
   - Go to `/admin/attendance/dashboard`
   - Show real-time stats
   - Show recent check-ins
   - Show alerts

---

## ✅ Quick Checklist

- [ ] Backend running on port 8080
- [ ] Frontend running on port 3000
- [ ] MongoDB connected
- [ ] Admin logged in
- [ ] Office location created
- [ ] Shift created
- [ ] Holidays added
- [ ] Employee assigned to shift
- [ ] Test check-in successful
- [ ] GPS permission granted
- [ ] Dashboard showing data
- [ ] Leave application works
- [ ] Reports loading correctly

---

**Need Help?**
- Check console for errors: F12 → Console
- Check backend logs
- Verify API responses in Network tab
- Test APIs with Postman first

**Happy Testing! 🚀**

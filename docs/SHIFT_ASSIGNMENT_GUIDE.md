# Shift Assignment - Quick Start Guide ✅

**Date**: 2026-03-08
**Feature**: Assign Shifts to Users
**Status**: ✅ **READY TO USE**

---

## 🎯 Fix for Check-In Error

**Problem**: Users getting "No shift configured. Please contact admin."
**Solution**: Admin needs to assign shifts to users before they can check in.

---

## 📍 How to Assign Shifts to Users

### **Step 1: Navigate to Shift Assignment**

**Option 1**: Direct URL
```
http://localhost:3000/admin/attendance/shifts/assign
```

**Option 2**: Via Navigation
1. Go to **Shift Management** (sidebar → HR Management → Shift Management)
2. Click the green **"Assign Users"** button

---

### **Step 2: Select Users**

On the assignment page, you'll see two panels:

**Left Panel - User Selection:**
- ✅ See all active users in your organization
- ✅ Select individual users by clicking checkboxes
- ✅ Or click "Select All" to assign shift to everyone
- ✅ Selected count shown at top

**Features:**
- User's full name displayed
- Email shown for identification
- Selected users highlighted in blue
- Scrollable list for many users

---

### **Step 3: Choose Shift**

**Right Panel - Shift Configuration:**

1. **Select Shift** (Required)
   - Dropdown shows all active shifts
   - Format: "Shift Name (Code)"
   - Example: "Regular Office Hours (REG)"

2. **Effective Date** (Required)
   - When the shift assignment starts
   - Defaults to today
   - Users can check in from this date onwards

3. **End Date** (Optional)
   - Leave blank for permanent assignment
   - Set a date for temporary assignments
   - Example: Project-based shifts

4. **Temporary Assignment** (Optional)
   - Check this box if the assignment is temporary
   - Good for tracking non-permanent shifts

5. **Reason** (Optional)
   - Add notes about why shift is assigned
   - Example: "Department change", "Project XYZ"

---

### **Step 4: Review & Assign**

**Summary Box (Blue):**
- Shows what you're about to assign
- Confirms shift name
- Shows number of users
- Displays effective dates

**Assign Button:**
- Only enabled when users and shift are selected
- Shows count: "Assign Shift to X User(s)"
- Click to complete assignment

---

## 💡 Quick Assignment Example

### **Scenario: Assign regular office shift to all employees**

1. **Go to**: Shift Management → Assign Users
2. **Click**: "Select All" (selects all users)
3. **Choose Shift**: "Regular Office Hours (REG)"
4. **Effective Date**: Today's date (or desired start date)
5. **End Date**: Leave blank (ongoing)
6. **Click**: "Assign Shift to X User(s)"
7. **Done!** ✅

**Result**: All users can now check in using the regular office shift schedule.

---

## 📋 Common Use Cases

### **Use Case 1: New Employee Onboarding**
```
Selected Users: 1 (new employee)
Shift: Regular Office Hours
Effective Date: Their start date
End Date: Blank (ongoing)
```

### **Use Case 2: Department-Wide Shift Change**
```
Selected Users: 10 (entire department)
Shift: Morning Shift
Effective Date: Next Monday
End Date: Blank
Reason: Department restructure
```

### **Use Case 3: Temporary Project Assignment**
```
Selected Users: 5 (project team members)
Shift: Flexible Hours
Effective Date: Project start date
End Date: Project end date
Temporary: ✓ Checked
Reason: Special project XYZ
```

### **Use Case 4: Night Shift Rotation**
```
Selected Users: 3 (week 1 team)
Shift: Night Shift
Effective Date: Week 1 Monday
End Date: Week 1 Friday
Temporary: ✓ Checked
Reason: Rotation week 1
```

---

## ✅ After Assignment

Once shifts are assigned:

### **For Employees:**
- ✅ Can check in at shift start time
- ✅ Grace period applies from shift configuration
- ✅ System validates check-in against assigned shift
- ✅ Late/early calculations based on shift timings

### **For Admins:**
- ✅ View assignments in user profiles
- ✅ Track who is assigned to which shift
- ✅ Change assignments anytime
- ✅ See assignment history

---

## 🔧 Managing Assignments

### **To Change a User's Shift:**
1. Assign new shift with new effective date
2. The new assignment takes effect from the new date
3. Old assignment automatically ends

### **To Remove a Shift Assignment:**
1. Create a new assignment with:
   - End date = today
   - Then assign default shift if needed

### **To Bulk Reassign:**
1. Select all affected users
2. Choose new shift
3. Set new effective date
4. Assign

---

## 📊 Best Practices

### ✅ **DO:**
- Assign shifts before employees start
- Use effective dates for planned changes
- Add reasons for temporary assignments
- Review selected users before assigning
- Use descriptive reasons for tracking

### ❌ **DON'T:**
- Assign shifts retroactively (causes attendance issues)
- Leave users without shifts (they can't check in)
- Forget to set end dates for temporary shifts
- Assign incompatible shifts (check working days)

---

## 🚨 Troubleshooting

### **Problem: User can't check in**
**Solution:**
1. Verify user has shift assigned
2. Check effective date (must be today or earlier)
3. Confirm shift is active
4. Ensure shift matches office location if GPS is used

### **Problem: "No shifts available" in dropdown**
**Solution:**
1. Create shifts first (Shift Management → New Shift)
2. Make sure shifts are active
3. Refresh the assignment page

### **Problem: Can't find user in list**
**Solution:**
1. Check if user is active (only active users shown)
2. Verify user exists in system
3. Check user management page

---

## 🎯 Complete Workflow

### **Setting Up Attendance System:**

1. **Create Shifts** (Admin)
   - Go to Shift Management
   - Click "New Shift"
   - Configure shift details
   - Save

2. **Assign Shifts** (Admin) ← **YOU ARE HERE**
   - Go to Shift Management → Assign Users
   - Select users
   - Choose shift
   - Set dates
   - Assign

3. **Employee Checks In**
   - Navigate to Attendance
   - Click "Check In"
   - System validates against assigned shift
   - Success! ✅

---

## 📝 Summary

**What You Can Do Now:**
- ✅ Assign shifts to individual users
- ✅ Bulk assign shifts to multiple users
- ✅ Set temporary or permanent assignments
- ✅ Schedule future shift changes
- ✅ Track assignment reasons

**What Happens After Assignment:**
- ✅ Users can check in based on their shift
- ✅ System validates timing against shift rules
- ✅ Grace periods and overtime calculated per shift
- ✅ Attendance tracking enabled

---

## 🚀 Next Steps

After assigning shifts:

1. **Test Check-In**
   - Have a user try to check in
   - Verify it works without "No shift configured" error

2. **Configure Office Locations** (if using GPS)
   - Set up office geofence
   - Link to shifts

3. **Monitor Attendance**
   - Check daily attendance dashboard
   - View who's checked in
   - Track late arrivals

4. **Generate Reports**
   - Weekly attendance reports
   - Shift-wise analytics
   - Overtime tracking

---

**Status**: ✅ **READY TO USE**

**Access Now**: `http://localhost:3000/admin/attendance/shifts/assign`

Your employees can now check in successfully! 🎉

# Attendance Monitoring System - Complete Testing Guide

## Prerequisites Checklist

- [ ] MongoDB is running (port 27017)
- [ ] Backend is compiled successfully
- [ ] You have admin credentials
- [ ] Postman or curl installed

---

## Phase 1: Initial Setup (Admin Operations)

### Step 1.1: Start Backend

```bash
cd /Users/pankajthakur/IdeaProjects/CRM/backend
./mvnw spring-boot:run
```

Wait until you see: `Started BackendApplication`

### Step 1.2: Login as Admin

```bash
# Login and get JWT token
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "your_password"
  }'
```

**Save the JWT token from response:**
```bash
export TOKEN="eyJhbGc..."  # Replace with actual token
```

---

## Phase 2: Configure Attendance System (One-time Setup)

### Step 2.1: Create Office Location

```bash
curl -X POST http://localhost:8080/api/office-locations \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Head Office",
    "code": "HQ",
    "address": "123 Main Street, Business District",
    "city": "Mumbai",
    "state": "Maharashtra",
    "country": "India",
    "postalCode": "400001",
    "latitude": 19.0760,
    "longitude": 72.8777,
    "radiusMeters": 100,
    "type": "HEAD_OFFICE",
    "enforceGeofence": true,
    "isActive": true
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Office location created successfully",
  "data": {
    "locationId": "LOC-2026-03-00001",
    "name": "Head Office",
    ...
  }
}
```

**Save the locationId:** `LOC-2026-03-00001`

### Step 2.2: Create Work Shift

```bash
curl -X POST http://localhost:8080/api/shifts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Regular Day Shift",
    "code": "DAY",
    "description": "Standard 9 AM to 6 PM shift",
    "startTime": "09:00:00",
    "endTime": "18:00:00",
    "workHoursMinutes": 540,
    "type": "FIXED",
    "graceMinutes": 15,
    "mandatoryBreakMinutes": 60,
    "maxBreakMinutes": 90,
    "workingDays": ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"],
    "weekendDays": ["SATURDAY", "SUNDAY"],
    "allowOvertime": true,
    "maxOvertimeMinutesPerDay": 180,
    "isDefault": true,
    "isActive": true
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Shift created successfully",
  "data": {
    "shiftId": "SFT-2026-03-00001",
    "name": "Regular Day Shift",
    ...
  }
}
```

**Save the shiftId:** `SFT-2026-03-00001`

### Step 2.3: Create Holidays (2026)

```bash
# Republic Day
curl -X POST http://localhost:8080/api/holidays \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2026-01-26",
    "name": "Republic Day",
    "description": "National Holiday",
    "type": "NATIONAL",
    "isOptional": false
  }'

# Holi
curl -X POST http://localhost:8080/api/holidays \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2026-03-14",
    "name": "Holi",
    "description": "Festival of Colors",
    "type": "NATIONAL",
    "isOptional": false
  }'

# Independence Day
curl -X POST http://localhost:8080/api/holidays \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2026-08-15",
    "name": "Independence Day",
    "description": "National Holiday",
    "type": "NATIONAL",
    "isOptional": false
  }'

# Diwali
curl -X POST http://localhost:8080/api/holidays \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2026-10-30",
    "name": "Diwali",
    "description": "Festival of Lights",
    "type": "NATIONAL",
    "isOptional": false
  }'
```

### Step 2.4: Assign Shift to Employee

```bash
# First, get a user ID (employee)
curl -X GET http://localhost:8080/api/users \
  -H "Authorization: Bearer $TOKEN"

# Save an employee userId, then assign shift
curl -X POST http://localhost:8080/api/admin/bulk/assign-shift \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "shiftId": "SFT-2026-03-00001",
    "officeLocationId": "LOC-2026-03-00001",
    "userIds": ["USR-2026-01-00001"],
    "effectiveDate": "2026-03-01",
    "isTemporary": false,
    "reason": "Initial shift assignment"
  }'
```

---

## Phase 3: Employee Attendance Operations

### Step 3.1: Employee Check-In (Morning)

**Important:** Use actual GPS coordinates near your office location!

```bash
# Login as employee
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "employee_username",
    "password": "employee_password"
  }'

export EMP_TOKEN="eyJhbGc..."  # Employee JWT token

# Check-in at office
curl -X POST http://localhost:8080/api/attendance/check-in \
  -H "Authorization: Bearer $EMP_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "OFFICE",
    "latitude": 19.0760,
    "longitude": 72.8777,
    "accuracy": 10.5,
    "address": "Near Head Office",
    "officeLocationId": "LOC-2026-03-00001",
    "deviceInfo": "Mozilla/5.0 (iPhone)",
    "userNotes": "On time today!"
  }'
```

**Expected Response (On-Time):**
```json
{
  "success": true,
  "message": "Checked in successfully at 09:05 AM",
  "data": {
    "attendanceId": "ATT-2026-03-00001",
    "status": "PRESENT",
    "checkInTime": "2026-03-07T09:05:00",
    "lateMinutes": 0,
    "isLocationVerified": true,
    "locationValidationMessage": "Within office geofence"
  }
}
```

**Expected Response (Late Arrival):**
```json
{
  "success": true,
  "message": "Checked in successfully at 09:30 AM",
  "data": {
    "attendanceId": "ATT-2026-03-00002",
    "status": "LATE",
    "checkInTime": "2026-03-07T09:30:00",
    "lateMinutes": 15,
    "isLocationVerified": true
  }
}
```

### Step 3.2: Start Break (Lunch)

```bash
curl -X POST http://localhost:8080/api/attendance/break/start \
  -H "Authorization: Bearer $EMP_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "attendanceId": "ATT-2026-03-00001",
    "type": "LUNCH",
    "latitude": 19.0760,
    "longitude": 72.8777,
    "accuracy": 10.0
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Break started successfully",
  "data": {
    "breakId": "BRK-001",
    "type": "LUNCH",
    "startTime": "2026-03-07T13:00:00"
  }
}
```

### Step 3.3: End Break

```bash
curl -X POST http://localhost:8080/api/attendance/break/end \
  -H "Authorization: Bearer $EMP_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "attendanceId": "ATT-2026-03-00001",
    "breakId": "BRK-001",
    "latitude": 19.0760,
    "longitude": 72.8777,
    "accuracy": 10.0
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Break ended successfully",
  "data": {
    "breakId": "BRK-001",
    "duration": 45,
    "endTime": "2026-03-07T13:45:00"
  }
}
```

### Step 3.4: Employee Check-Out (Evening)

```bash
curl -X POST http://localhost:8080/api/attendance/check-out \
  -H "Authorization: Bearer $EMP_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "attendanceId": "ATT-2026-03-00001",
    "latitude": 19.0760,
    "longitude": 72.8777,
    "accuracy": 10.0,
    "userNotes": "Completed all tasks"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Checked out successfully",
  "data": {
    "attendanceId": "ATT-2026-03-00001",
    "checkOutTime": "2026-03-07T18:15:00",
    "totalWorkMinutes": 495,
    "totalWorkHours": 8.25,
    "overtimeMinutes": 15,
    "netBreakMinutes": 45
  }
}
```

---

## Phase 4: Leave Management

### Step 4.1: Check Leave Balance

```bash
curl -X GET "http://localhost:8080/api/leaves/my/balance?year=2026" \
  -H "Authorization: Bearer $EMP_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "userId": "USR-2026-01-00001",
    "year": 2026,
    "balances": {
      "CASUAL": {
        "total": 12.0,
        "used": 0.0,
        "pending": 0.0,
        "available": 12.0
      },
      "SICK": {
        "total": 12.0,
        "used": 0.0,
        "available": 12.0
      },
      "EARNED": {
        "total": 15.0,
        "used": 0.0,
        "available": 15.0
      }
    }
  }
}
```

### Step 4.2: Apply for Leave

```bash
curl -X POST http://localhost:8080/api/leaves \
  -H "Authorization: Bearer $EMP_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "leaveType": "CASUAL",
    "startDate": "2026-03-10",
    "endDate": "2026-03-12",
    "reason": "Family function",
    "isHalfDay": false,
    "isEmergencyLeave": false,
    "contactNumberDuringLeave": "+91-9876543210"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Leave applied successfully. Pending approval.",
  "data": {
    "leaveId": "LVE-2026-03-00001",
    "userId": "USR-2026-01-00001",
    "leaveType": "CASUAL",
    "startDate": "2026-03-10",
    "endDate": "2026-03-12",
    "totalDays": 3.0,
    "businessDays": 3,
    "status": "PENDING",
    "balanceBefore": 12.0,
    "balanceAfter": 9.0
  }
}
```

### Step 4.3: Manager - View Pending Leave Approvals

```bash
# Login as manager
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "manager_username",
    "password": "manager_password"
  }'

export MGR_TOKEN="eyJhbGc..."  # Manager JWT token

# Get pending approvals
curl -X GET http://localhost:8080/api/leaves/admin/pending \
  -H "Authorization: Bearer $MGR_TOKEN"
```

### Step 4.4: Manager - Approve Leave

```bash
curl -X POST http://localhost:8080/api/leaves/admin/approve \
  -H "Authorization: Bearer $MGR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "leaveId": "LVE-2026-03-00001",
    "approved": true,
    "notes": "Approved. Enjoy!"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Leave approved successfully",
  "data": {
    "leaveId": "LVE-2026-03-00001",
    "status": "APPROVED",
    "approvedAt": "2026-03-07T14:30:00",
    "approverName": "John Manager"
  }
}
```

---

## Phase 5: Attendance Regularization

### Step 5.1: Request Regularization (Forgot to Check-Out)

```bash
curl -X POST http://localhost:8080/api/attendance/regularizations \
  -H "Authorization: Bearer $EMP_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "attendanceId": "ATT-2026-03-00001",
    "attendanceDate": "2026-03-06",
    "type": "FORGOT_CHECKOUT",
    "requestedCheckInTime": "2026-03-06T09:00:00",
    "requestedCheckOutTime": "2026-03-06T18:00:00",
    "reason": "Forgot to check out due to urgent client call",
    "requestedLatitude": 19.0760,
    "requestedLongitude": 72.8777,
    "requestedAddress": "Head Office"
  }'
```

### Step 5.2: Manager - Approve Regularization

```bash
# Get pending regularizations
curl -X GET http://localhost:8080/api/attendance/regularizations/pending \
  -H "Authorization: Bearer $MGR_TOKEN"

# Approve
curl -X POST http://localhost:8080/api/attendance/regularizations/approve \
  -H "Authorization: Bearer $MGR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "regularizationId": "REG-2026-03-00001",
    "approved": true,
    "notes": "Valid reason, approved"
  }'
```

---

## Phase 6: Reports & Analytics

### Step 6.1: Employee - View My Attendance Summary

```bash
curl -X GET "http://localhost:8080/api/attendance/my/summary?year=2026&month=3" \
  -H "Authorization: Bearer $EMP_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "userId": "USR-2026-01-00001",
    "year": 2026,
    "month": 3,
    "totalWorkingDays": 22,
    "presentDays": 20,
    "lateDays": 2,
    "absentDays": 0,
    "leaveDays": 0,
    "attendancePercentage": 100.0,
    "punctualityPercentage": 90.0,
    "averageWorkHours": 8.5,
    "totalOvertimeHours": 5.0
  }
}
```

### Step 6.2: Employee - View Today's Attendance

```bash
curl -X GET http://localhost:8080/api/attendance/my/today \
  -H "Authorization: Bearer $EMP_TOKEN"
```

### Step 6.3: Manager - View Team Attendance

```bash
curl -X GET "http://localhost:8080/api/attendance/admin/team?startDate=2026-03-01&endDate=2026-03-07" \
  -H "Authorization: Bearer $MGR_TOKEN"
```

### Step 6.4: Admin - View Daily Dashboard

```bash
curl -X GET "http://localhost:8080/api/attendance/admin/dashboard/daily?date=2026-03-07" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "date": "2026-03-07",
    "totalEmployees": 50,
    "presentCount": 45,
    "lateCount": 5,
    "absentCount": 2,
    "onLeaveCount": 3,
    "remoteCount": 10,
    "officeCount": 35,
    "attendancePercentage": 90.0,
    "recentCheckIns": [...],
    "lateArrivals": [...],
    "missedCheckouts": [...]
  }
}
```

### Step 6.5: Admin - Generate Monthly Report

```bash
curl -X GET "http://localhost:8080/api/attendance/admin/report/monthly/USR-2026-01-00001?year=2026&month=3" \
  -H "Authorization: Bearer $TOKEN"
```

---

## Phase 7: GPS & Security Testing

### Test 7.1: Check-In Outside Geofence (Should Fail)

```bash
curl -X POST http://localhost:8080/api/attendance/check-in \
  -H "Authorization: Bearer $EMP_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "OFFICE",
    "latitude": 19.1000,
    "longitude": 72.9000,
    "accuracy": 10.0,
    "address": "Far from office",
    "officeLocationId": "LOC-2026-03-00001"
  }'
```

**Expected Response:**
```json
{
  "success": false,
  "message": "You must be within office geofence to check in",
  "data": {
    "distance": 2500,
    "allowedRadius": 100
  }
}
```

### Test 7.2: Remote Work Check-In (Should Succeed)

```bash
curl -X POST http://localhost:8080/api/attendance/check-in \
  -H "Authorization: Bearer $EMP_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "REMOTE",
    "latitude": 19.1000,
    "longitude": 72.9000,
    "accuracy": 10.0,
    "address": "Working from home",
    "userNotes": "Remote work today"
  }'
```

### Test 7.3: GPS Spoofing Detection (High Accuracy)

```bash
curl -X POST http://localhost:8080/api/attendance/check-in \
  -H "Authorization: Bearer $EMP_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "OFFICE",
    "latitude": 19.0000,
    "longitude": 72.0000,
    "accuracy": 2.0,
    "address": "Exact coordinates",
    "officeLocationId": "LOC-2026-03-00001"
  }'
```

**Expected:** GPS spoofing alert sent to manager if accuracy is suspiciously high

---

## Phase 8: Validation Testing

### Test 8.1: Duplicate Check-In (Should Fail)

```bash
# Try to check-in again on same day
curl -X POST http://localhost:8080/api/attendance/check-in \
  -H "Authorization: Bearer $EMP_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "OFFICE",
    "latitude": 19.0760,
    "longitude": 72.8777,
    "accuracy": 10.0,
    "officeLocationId": "LOC-2026-03-00001"
  }'
```

**Expected Response:**
```json
{
  "success": false,
  "message": "Already checked in today"
}
```

### Test 8.2: Check-Out Without Check-In (Should Fail)

```bash
# Try to check-out without checking in
curl -X POST http://localhost:8080/api/attendance/check-out \
  -H "Authorization: Bearer $EMP_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "attendanceId": "ATT-INVALID",
    "latitude": 19.0760,
    "longitude": 72.8777
  }'
```

### Test 8.3: Leave Application with Insufficient Balance (Should Fail)

```bash
curl -X POST http://localhost:8080/api/leaves \
  -H "Authorization: Bearer $EMP_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "leaveType": "CASUAL",
    "startDate": "2026-03-10",
    "endDate": "2026-03-25",
    "reason": "Long vacation"
  }'
```

**Expected Response:**
```json
{
  "success": false,
  "message": "Insufficient leave balance. Required: 16 days, Available: 12 days"
}
```

---

## Verification Checklist

After running all tests, verify in MongoDB:

```javascript
// Connect to MongoDB
mongosh

use crm_database

// Check attendances
db.attendances.find({ tenantId: "your-tenant-id" }).pretty()

// Check leaves
db.leaves.find({ tenantId: "your-tenant-id" }).pretty()

// Check leave balances
db.leave_balances.find({ tenantId: "your-tenant-id" }).pretty()

// Check shifts
db.shifts.find({ tenantId: "your-tenant-id" }).pretty()

// Check office locations
db.office_locations.find({ tenantId: "your-tenant-id" }).pretty()

// Check holidays
db.holidays.find({ tenantId: "your-tenant-id" }).pretty()

// Check regularizations
db.attendance_regularizations.find({ tenantId: "your-tenant-id" }).pretty()

// Check user shift assignments
db.user_shift_assignments.find({ tenantId: "your-tenant-id" }).pretty()
```

---

## Common Issues & Solutions

### Issue 1: "Tenant context not set"
**Solution:** Ensure JWT token is valid and includes tenantId

### Issue 2: "Shift not found"
**Solution:** Assign shift to employee using bulk assignment API

### Issue 3: "Office location not found"
**Solution:** Create office location first or use null for remote work

### Issue 4: GPS verification fails
**Solution:** Use coordinates within 100m of office location or disable `enforceGeofence`

### Issue 5: Leave balance not initialized
**Solution:** Backend auto-initializes on first leave application. Default: Casual=12, Sick=12, Earned=15

---

## Next Steps: Frontend Testing

Once backend APIs are verified, test the frontend:

1. Start frontend: `cd frontend && npm run dev`
2. Navigate to: `http://localhost:3000/attendance`
3. Test UI flows:
   - Check-in/out buttons
   - GPS permission prompt
   - Leave application form
   - Manager approval interface
   - Reports and dashboards

---

## Performance Testing

```bash
# Test concurrent check-ins
for i in {1..10}; do
  curl -X POST http://localhost:8080/api/attendance/check-in \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"type\": \"OFFICE\", \"latitude\": 19.0760, \"longitude\": 72.8777}" &
done
wait
```

---

## Success Criteria

✅ **All tests passed if:**
- Check-in/out works with GPS verification
- Late arrival triggers notification
- Breaks are tracked correctly
- Leave application and approval flow works
- Balance updates correctly
- Regularization flow works
- Reports show accurate data
- GPS spoofing detection works
- All validations work correctly
- MongoDB data is consistent

---

## Support

If you encounter issues:
1. Check backend logs: `tail -f logs/spring.log`
2. Check MongoDB: `db.attendances.find().limit(5)`
3. Verify JWT token is valid
4. Ensure time is in IST timezone
5. Check network connectivity for GPS

**Happy Testing! 🚀**

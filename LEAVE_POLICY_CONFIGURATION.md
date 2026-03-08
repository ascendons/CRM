# Leave Policy Configuration System

## Overview

The leave policy system allows administrators to configure default leave allocations for all users in a tenant. Previously, leave allocations were hardcoded (12 days casual, 12 days sick, 15 days earned). Now they are **fully configurable** per tenant.

## What Was Fixed

### Issue 1: Balance Cards Not Updating
- **Fixed**: Added `teamLeaves` cache eviction to all leave operations (apply, approve, reject, cancel)
- **Result**: Balance cards now update immediately after approval/rejection
- **Cache Eviction**: `allEntries = true` ensures all users' balances are refreshed

### Issue 2: Configurable Leave Allocations
- **Created**: Leave Policy entity to store default configurations
- **Location**: `LeavePolicy` collection in MongoDB
- **Scope**: Per tenant (each tenant can have different policies)

## Files Created

### Backend

1. **Entity**: `/backend/src/main/java/com/ultron/backend/domain/entity/LeavePolicy.java`
   - Stores leave policy configuration per tenant
   - Contains default allocations, carry-forward rules, notice requirements

2. **Repository**: `/backend/src/main/java/com/ultron/backend/repository/LeavePolicyRepository.java`
   - MongoDB repository for leave policies

3. **Service**: `/backend/src/main/java/com/ultron/backend/service/LeavePolicyService.java`
   - Manages leave policies
   - Auto-creates default policy if none exists
   - Cached for performance

4. **Controller**: `/backend/src/main/java/com/ultron/backend/controller/LeavePolicyController.java`
   - REST API endpoints:
     - `GET /api/v1/admin/leave-policy` - Get current policy
     - `PUT /api/v1/admin/leave-policy` - Update policy (Admin only)

### Modified Files

1. **CacheConfig.java**: Added `leavePolicy` cache
2. **LeaveService.java**:
   - Injected `LeavePolicyService`
   - Updated `getOrCreateLeaveBalance()` to use policy instead of hardcoded values
   - Added `teamLeaves` cache eviction to all mutation operations

## Default Leave Policy

When a tenant is created, the following default policy is applied:

```
CASUAL LEAVE:
  - Allocation: 12 days
  - Carry Forward: No
  - Min Notice: 1 day
  - Max Consecutive: 3 days
  - Requires Approval: Yes

SICK LEAVE:
  - Allocation: 12 days
  - Carry Forward: No
  - Min Notice: 0 days (same day)
  - Requires Documents: Yes (medical certificate)
  - Requires Approval: Yes

EARNED LEAVE:
  - Allocation: 15 days
  - Carry Forward: Yes (up to 15 days)
  - Min Notice: 7 days
  - Requires Approval: Yes

PAID LEAVE:
  - Allocation: 0 days (granted case-by-case)
  - Requires Approval: Yes

COMPENSATORY OFF:
  - Allocation: 0 days (earned by working on holidays)
  - Requires Approval: Yes
```

## How to Configure (Via API)

### Get Current Policy

```bash
GET /api/v1/admin/leave-policy
Authorization: Bearer <token>
```

### Update Policy

```bash
PUT /api/v1/admin/leave-policy
Authorization: Bearer <token>
Content-Type: application/json

{
  "leaveTypes": {
    "CASUAL": {
      "defaultAllocation": 15.0,
      "isCarryForward": false,
      "maxCarryForward": 0.0,
      "minNoticeRequired": 1,
      "maxConsecutiveDays": 3,
      "requiresApproval": true,
      "requiresDocuments": false
    },
    "SICK": {
      "defaultAllocation": 10.0,
      "isCarryForward": false,
      "maxCarryForward": 0.0,
      "minNoticeRequired": 0,
      "maxConsecutiveDays": null,
      "requiresApproval": true,
      "requiresDocuments": true
    },
    "EARNED": {
      "defaultAllocation": 20.0,
      "isCarryForward": true,
      "maxCarryForward": 20.0,
      "minNoticeRequired": 7,
      "maxConsecutiveDays": null,
      "requiresApproval": true,
      "requiresDocuments": false
    }
  },
  "allowCarryForward": true,
  "proRateForNewJoiners": true
}
```

## How It Works

1. **First Time User Applies Leave**:
   - System checks if user has a leave balance for the current year
   - If not, calls `getOrCreateLeaveBalance()`
   - This method calls `leavePolicyService.getPolicy()`
   - Policy is fetched from database (or default is created)
   - User's balance is initialized with policy allocations

2. **Updating Policy**:
   - Admin updates policy via API
   - Cache is evicted (`@CacheEvict`)
   - New users will get the updated allocations
   - **Existing users' balances are NOT affected** (they keep their current balance)

3. **Cache Strategy**:
   - `leavePolicy` cache: TTL 5 minutes, max 1000 entries
   - Cache key: `tenantId`
   - Evicted on policy update

## Testing

### Step 1: Restart Backend
```bash
cd /Users/pankajthakur/IdeaProjects/CRM/backend
mvn spring-boot:run
```

### Step 2: Get Current Policy
```bash
curl -X GET http://localhost:8080/api/v1/admin/leave-policy \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Step 3: Update Policy (Example: Change Casual Leave to 15 days)
```bash
curl -X PUT http://localhost:8080/api/v1/admin/leave-policy \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "leaveTypes": {
      "CASUAL": {
        "defaultAllocation": 15.0,
        "isCarryForward": false,
        "maxCarryForward": 0.0,
        "minNoticeRequired": 1,
        "maxConsecutiveDays": 3,
        "requiresApproval": true,
        "requiresDocuments": false
      },
      ...
    }
  }'
```

### Step 4: Verify New User Gets Updated Allocation
- Create a new user
- Have them apply for leave
- Check their balance - should show 15 days casual leave

## Future Enhancements

1. **Frontend Admin UI**: Create a settings page at `/admin/settings/leave-policy` to manage policies visually
2. **Bulk Update Balances**: Add endpoint to update all existing users' balances when policy changes
3. **Role-Based Policies**: Different policies for different roles (managers get more leave)
4. **Location-Based Policies**: Different policies for different office locations
5. **Leave Accrual**: Gradually accrue leaves over the year instead of giving all at once
6. **Pro-Rating**: Automatically pro-rate leaves for mid-year joiners

## Notes

- **Tenant Isolation**: Each tenant has its own independent policy
- **Default Creation**: If no policy exists, default is auto-created
- **Backward Compatible**: Existing balances are not affected by policy updates
- **Cache Performance**: Policy is cached to avoid database hits on every leave application
- **Admin Only**: Only users with `canManageUsers` permission can update policies

## Next Steps

1. ✅ Backend infrastructure complete
2. ⏳ Create frontend UI for policy management (`/admin/settings/leave-policy`)
3. ⏳ Add validation (e.g., allocation > 0, maxCarryForward <= total)
4. ⏳ Add audit logging for policy changes
5. ⏳ Create migration script to apply new policies to existing users (optional)

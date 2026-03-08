# Security Audit: Role-Based Access Control (RBAC) and Data Visibility

**Date**: 2026-03-08
**Audit Type**: Permission and Data Visibility Review
**Status**: ⚠️ **CRITICAL ISSUES FOUND**

---

## Executive Summary

### ✅ **CORRECTLY IMPLEMENTED**:
1. **Leave Management** - Properly implements role-based data filtering
2. **Attendance System** - Has both user and admin endpoints with proper permissions
3. **Role Definitions** - Clear data visibility levels (ALL, SUBORDINATES, OWN)

### ❌ **CRITICAL SECURITY ISSUES**:
1. **Lead Management** - NO data visibility filtering (all users can see all leads)
2. **Opportunity Management** - NO security annotations (completely unprotected)
3. **Missing Implementation** - Data visibility logic not enforced in controllers/services

---

## Role Definitions (From PredefinedRoles.java)

### **1. System Administrator (ROLE-00001)**

```java
.dataVisibility("ALL")
.canViewAllData(true)
.canModifyAllData(true)
.canManageUsers(true)
.canManageRoles(true)
```

**Expected Access**:
- ✅ See ALL employees' leaves, attendance, leads, opportunities
- ✅ Approve any leave request
- ✅ View all reports and dashboards
- ✅ Manage users, roles, and system settings

---

### **2. Sales Manager (ROLE-00002)**

```java
.dataVisibility("SUBORDINATES")
.canViewAllData(false)
.canModifyAllData(false)
.canExportData(true)
.canImportData(true)
```

**Expected Access**:
- ✅ See ONLY their direct reports' (subordinates') leaves, attendance, leads, opportunities
- ✅ Approve leave requests from their subordinates
- ✅ View team reports (only for their team)
- ❌ Cannot see other managers' team data
- ❌ Cannot see all organization data

---

### **3. Sales Representative (ROLE-00003)**

```java
.dataVisibility("OWN")
.canViewAllData(false)
.canModifyAllData(false)
.canExportData(false)
.canImportData(false)
```

**Expected Access**:
- ✅ See ONLY their own leaves, attendance, leads, opportunities
- ✅ Apply for leave (requires manager approval)
- ✅ View own reports
- ❌ Cannot see team members' data
- ❌ Cannot see manager's data
- ❌ Cannot approve leave requests

---

## Detailed Audit Results

---

## ✅ **LEAVE MANAGEMENT** - Correctly Implemented

### **File**: `/backend/src/main/java/com/ultron/backend/controller/LeaveController.java`

### **User Endpoints** (Correctly Protected):

#### **1. Get My Leaves** (Lines 52-67)
```java
@GetMapping("/my")
@PreAuthorize("hasPermission('LEAVE', 'READ')")
public ResponseEntity<ApiResponse<List<LeaveResponse>>> getMyLeaves(
        Authentication authentication) {
    String userId = authentication.getName();
    List<LeaveResponse> leaves = leaveService.getMyLeaves(userId);
    ...
}
```
- ✅ **Filters by userId** - only returns the logged-in user's leaves
- ✅ **Permission**: `LEAVE_READ` (all users have this)
- ✅ **Data Scope**: OWN

---

### **Manager Endpoints** (Correctly Implemented):

#### **2. Get Pending Approvals** (Lines 134-148)
```java
@GetMapping("/admin/pending")
@PreAuthorize("hasPermission('LEAVE', 'APPROVE')")
public ResponseEntity<ApiResponse<List<LeaveResponse>>> getPendingApprovals(
        Authentication authentication) {
    String managerId = authentication.getName();
    List<LeaveResponse> leaves = leaveService.getPendingApprovals(managerId);
    ...
}
```
- ✅ **Filters by managerId** - only returns leaves where `approverId = managerId`
- ✅ **Permission**: `LEAVE_APPROVE` (only managers/admins have this)
- ✅ **Data Scope**: SUBORDINATES

**Service Implementation** (`LeaveService.java:332-337`):
```java
public List<LeaveResponse> getPendingApprovals(String managerId) {
    String tenantId = getCurrentTenantId();
    List<Leave> leaves = leaveRepository.findByApproverIdAndTenantIdAndStatusAndIsDeletedFalseOrderByCreatedAtDesc(
            managerId, tenantId, LeaveStatus.PENDING);
    return leaves.stream().map(this::mapToResponse).collect(Collectors.toList());
}
```
- ✅ Query filters by `approverId = managerId` → Only subordinates' leaves are returned

---

### **Admin Endpoints** (Correctly Implemented):

#### **3. Get All Pending Approvals** (Lines 154-167)
```java
@GetMapping("/admin/all-pending")
@PreAuthorize("hasPermission('LEAVE', 'READ_ALL')")
public ResponseEntity<ApiResponse<List<LeaveResponse>>> getAllPendingApprovals() {
    List<LeaveResponse> leaves = leaveService.getAllPendingApprovals();
    ...
}
```
- ✅ **No filtering** - returns ALL pending leaves in the tenant
- ✅ **Permission**: `LEAVE_READ_ALL` (only admins have this)
- ✅ **Data Scope**: ALL

**Service Implementation** (`LeaveService.java:342-347`):
```java
public List<LeaveResponse> getAllPendingApprovals() {
    String tenantId = getCurrentTenantId();
    List<Leave> leaves = leaveRepository.findByTenantIdAndStatusAndIsDeletedFalseOrderByCreatedAtDesc(
            tenantId, LeaveStatus.PENDING);
    return leaves.stream().map(this::mapToResponse).collect(Collectors.toList());
}
```
- ✅ Query gets ALL pending leaves (no approverId filter) → Admin sees everything

---

### **Summary: Leave Management**
| Role | Endpoint | Permission | Data Scope | Status |
|------|----------|------------|------------|--------|
| Employee | `GET /my` | `LEAVE_READ` | Own leaves | ✅ Correct |
| Manager | `GET /admin/pending` | `LEAVE_APPROVE` | Subordinates' pending leaves | ✅ Correct |
| Admin | `GET /admin/all-pending` | `LEAVE_READ_ALL` | ALL pending leaves | ✅ Correct |

---

## ✅ **ATTENDANCE SYSTEM** - Correctly Implemented

### **File**: `/backend/src/main/java/com/ultron/backend/controller/AttendanceController.java`

### **User Endpoints**:

#### **1. Get My Attendance History** (Lines 151-169)
```java
@GetMapping("/my/history")
@PreAuthorize("hasPermission('ATTENDANCE', 'READ')")
public ResponseEntity<ApiResponse<List<AttendanceResponse>>> getMyHistory(
        @RequestParam String startDate,
        @RequestParam String endDate,
        Authentication authentication) {
    String userId = authentication.getName();
    List<AttendanceResponse> attendance = attendanceService.getUserAttendance(userId, start, end);
    ...
}
```
- ✅ **Filters by userId**
- ✅ **Permission**: `ATTENDANCE_READ`
- ✅ **Data Scope**: OWN

---

### **Admin Endpoints**:

#### **2. Get Daily Dashboard** (Lines 174-191)
```java
@GetMapping("/admin/dashboard/daily")
@PreAuthorize("hasPermission('ATTENDANCE', 'READ_ALL')")
public ResponseEntity<ApiResponse<DailyAttendanceDashboardResponse>> getDailyDashboard(
        @RequestParam(required = false) String date) {
    DailyAttendanceDashboardResponse dashboard = attendanceService.getDailyDashboard(dateParam);
    ...
}
```
- ✅ **No filtering** - returns ALL employees' attendance
- ✅ **Permission**: `ATTENDANCE_READ_ALL` (admin-only)
- ✅ **Data Scope**: ALL

#### **3. Get Team Attendance** (Lines 242-264)
```java
@GetMapping("/admin/team")
@PreAuthorize("hasPermission('ATTENDANCE', 'READ_ALL')")
public ResponseEntity<ApiResponse<List<AttendanceResponse>>> getTeamAttendance(
        @RequestParam String startDate,
        @RequestParam String endDate) {
    List<AttendanceResponse> attendance = attendanceService.getTeamAttendance(start, end);
    ...
}
```
- ✅ **Permission**: `ATTENDANCE_READ_ALL` (admin-only)
- ✅ **Data Scope**: ALL

---

### **Summary: Attendance**
| Role | Endpoint | Permission | Data Scope | Status |
|------|----------|------------|------------|--------|
| Employee | `GET /my/*` | `ATTENDANCE_READ` | Own attendance | ✅ Correct |
| Admin | `GET /admin/dashboard/daily` | `ATTENDANCE_READ_ALL` | ALL employees | ✅ Correct |
| Admin | `GET /admin/team` | `ATTENDANCE_READ_ALL` | ALL employees | ✅ Correct |

**Note**: Missing manager-specific endpoints for viewing subordinates' attendance. Current implementation only has user (OWN) and admin (ALL), but no manager (SUBORDINATES) endpoints.

---

## ❌ **LEAD MANAGEMENT** - CRITICAL SECURITY ISSUE

### **File**: `/backend/src/main/java/com/ultron/backend/controller/LeadController.java`

### **Problem: getAllLeads Endpoint** (Lines 59-72)

```java
@GetMapping
@PreAuthorize("hasPermission('LEAD', 'READ')")
public ResponseEntity<ApiResponse<List<LeadResponse>>> getAllLeads() {
    log.info("Fetching all leads");
    List<LeadResponse> leads = leadService.getAllLeads();
    return ResponseEntity.ok(...);
}
```

**Service Implementation** (`LeadService.java:191-198`):
```java
public List<LeadResponse> getAllLeads() {
    String tenantId = getCurrentTenantId();
    log.debug("[Tenant: {}] Fetching all leads", tenantId);
    return leadRepository.findByTenantIdAndIsDeletedFalse(tenantId)
            .stream()
            .map(this::mapToResponse)
            .collect(Collectors.toList());
}
```

### ❌ **SECURITY VULNERABILITIES**:

1. **No Data Visibility Filtering**:
   - ❌ Query: `findByTenantIdAndIsDeletedFalse(tenantId)` → Returns **ALL leads**
   - ❌ NO filtering by owner, manager, or subordinates
   - ❌ Does NOT check user's `dataVisibility` setting

2. **Incorrect Permission**:
   - ❌ Uses `LEAD_READ` which **ALL users have** (admin, manager, sales rep)
   - ❌ Should use `LEAD_READ_ALL` for admin access
   - ❌ Missing separate endpoints for manager and user views

3. **Impact**:
   - ⚠️ **Sales Representatives can see ALL leads** (not just their own)
   - ⚠️ **Managers can see ALL leads** (not just their subordinates')
   - ⚠️ **Violates RBAC dataVisibility rules**

---

### **What Should Be Implemented**:

#### **Option 1: Service-Level Filtering** (Recommended)

```java
public List<LeadResponse> getLeadsForCurrentUser(String userId) {
    String tenantId = getCurrentTenantId();
    User user = userRepository.findById(userId).orElseThrow();

    // Get user's role and data visibility
    Role role = roleRepository.findByRoleIdAndTenantId(user.getRoleId(), tenantId).orElseThrow();
    String dataVisibility = role.getPermissions().getDataVisibility();

    List<Lead> leads;
    switch (dataVisibility) {
        case "ALL":
            // Admin: Get all leads
            leads = leadRepository.findByTenantIdAndIsDeletedFalse(tenantId);
            break;
        case "SUBORDINATES":
            // Manager: Get own leads + subordinates' leads
            List<String> subordinateIds = permissionService.getAllSubordinates(user.getUserId());
            subordinateIds.add(user.getUserId()); // Include own leads
            leads = leadRepository.findByLeadOwnerIdInAndTenantIdAndIsDeletedFalse(
                subordinateIds, tenantId);
            break;
        case "OWN":
            // Sales Rep: Get only own leads
            leads = leadRepository.findByLeadOwnerIdAndTenantIdAndIsDeletedFalse(
                user.getUserId(), tenantId);
            break;
        default:
            leads = Collections.emptyList();
    }

    return leads.stream().map(this::mapToResponse).collect(Collectors.toList());
}
```

#### **Option 2: Separate Endpoints** (Current Pattern)

**Controller**:
```java
// Employee: Get own leads
@GetMapping("/my-leads")
@PreAuthorize("hasPermission('LEAD', 'READ')")
public ResponseEntity<ApiResponse<List<LeadResponse>>> getMyLeads(Authentication auth) {
    String userId = auth.getName();
    List<LeadResponse> leads = leadService.getLeadsByOwner(userId);
    ...
}

// Manager: Get team leads
@GetMapping("/admin/team-leads")
@PreAuthorize("hasPermission('LEAD', 'READ_SUBORDINATES')")
public ResponseEntity<ApiResponse<List<LeadResponse>>> getTeamLeads(Authentication auth) {
    String managerId = auth.getName();
    List<LeadResponse> leads = leadService.getTeamLeads(managerId);
    ...
}

// Admin: Get all leads
@GetMapping("/admin/all-leads")
@PreAuthorize("hasPermission('LEAD', 'READ_ALL')")
public ResponseEntity<ApiResponse<List<LeadResponse>>> getAllLeads() {
    List<LeadResponse> leads = leadService.getAllLeads();
    ...
}
```

**Service** (for manager):
```java
public List<LeadResponse> getTeamLeads(String managerId) {
    String tenantId = getCurrentTenantId();

    // Get all subordinates recursively
    List<String> subordinateIds = permissionService.getAllSubordinates(managerId);
    subordinateIds.add(managerId); // Include manager's own leads

    return leadRepository.findByLeadOwnerIdInAndTenantIdAndIsDeletedFalse(
            subordinateIds, tenantId)
        .stream()
        .map(this::mapToResponse)
        .collect(Collectors.toList());
}
```

---

### **Summary: Lead Management**
| Role | Current Behavior | Expected Behavior | Status |
|------|------------------|-------------------|--------|
| Employee | ❌ Can see ALL leads | ✅ Should see ONLY own leads | ❌ **BROKEN** |
| Manager | ❌ Can see ALL leads | ✅ Should see own + subordinates' leads | ❌ **BROKEN** |
| Admin | ✅ Can see ALL leads | ✅ Should see ALL leads | ✅ Works (but wrong permission) |

---

## ❌ **OPPORTUNITY MANAGEMENT** - CRITICAL SECURITY ISSUE

### **File**: `/backend/src/main/java/com/ultron/backend/controller/OpportunityController.java`

### **Problem: No Security Annotations** (Lines 47-58)

```java
@GetMapping
public ResponseEntity<ApiResponse<List<OpportunityResponse>>> getAllOpportunities() {
    log.info("Fetching all opportunities");
    List<OpportunityResponse> opportunities = opportunityService.getAllOpportunities();
    return ResponseEntity.ok(...);
}
```

### ❌ **SECURITY VULNERABILITIES**:

1. **NO PERMISSION CHECK**:
   - ❌ Missing `@PreAuthorize` annotation
   - ❌ **ANY authenticated user can call this endpoint**
   - ❌ Even users without `OPPORTUNITY_READ` permission can access

2. **NO DATA FILTERING**:
   - ❌ Same issues as Lead Management
   - ❌ Returns ALL opportunities regardless of role

3. **Impact**:
   - ⚠️ **CRITICAL**: Completely unprotected endpoint
   - ⚠️ **All users can see all opportunities**
   - ⚠️ **No RBAC enforcement**

---

### **What Should Be Implemented**:

Add `@PreAuthorize` annotations to ALL endpoints:

```java
@GetMapping
@PreAuthorize("hasPermission('OPPORTUNITY', 'READ_ALL')")
public ResponseEntity<ApiResponse<List<OpportunityResponse>>> getAllOpportunities() {
    ...
}

@GetMapping("/my-opportunities")
@PreAuthorize("hasPermission('OPPORTUNITY', 'READ')")
public ResponseEntity<ApiResponse<List<OpportunityResponse>>> getMyOpportunities(
        Authentication auth) {
    String userId = auth.getName();
    List<OpportunityResponse> opps = opportunityService.getOpportunitiesByOwner(userId);
    ...
}

@GetMapping("/admin/team-opportunities")
@PreAuthorize("hasPermission('OPPORTUNITY', 'READ_SUBORDINATES')")
public ResponseEntity<ApiResponse<List<OpportunityResponse>>> getTeamOpportunities(
        Authentication auth) {
    String managerId = auth.getName();
    List<OpportunityResponse> opps = opportunityService.getTeamOpportunities(managerId);
    ...
}
```

---

### **Summary: Opportunity Management**
| Role | Current Behavior | Expected Behavior | Status |
|------|------------------|-------------------|--------|
| **ANY USER** | ❌ Can see ALL opportunities (NO SECURITY) | ✅ Should be restricted by role | ❌ **CRITICAL** |
| Employee | ❌ No filtering | ✅ Should see ONLY own opportunities | ❌ **BROKEN** |
| Manager | ❌ No filtering | ✅ Should see own + subordinates' opportunities | ❌ **BROKEN** |
| Admin | ❌ No permission check | ✅ Should see ALL opportunities (with permission) | ❌ **BROKEN** |

---

## Missing Infrastructure

### **1. Permission Definitions**

Need to add these permissions to the system:

```java
// Add to Role.RolePermissions or Profile.ProfilePermissions

LEAD_READ_SUBORDINATES      // Manager can see subordinates' leads
LEAD_READ_ALL               // Admin can see all leads
OPPORTUNITY_READ_SUBORDINATES
OPPORTUNITY_READ_ALL
ATTENDANCE_READ_SUBORDINATES
```

### **2. Repository Methods**

Need to add these queries:

```java
// LeadRepository.java
List<Lead> findByLeadOwnerIdInAndTenantIdAndIsDeletedFalse(
    List<String> ownerIds, String tenantId);

// OpportunityRepository.java
List<Opportunity> findByOpportunityOwnerIdInAndTenantIdAndIsDeletedFalse(
    List<String> ownerIds, String tenantId);
```

### **3. Service Methods**

Need to implement in `LeadService`, `OpportunityService`:

```java
public List<LeadResponse> getTeamLeads(String managerId);
public List<LeadResponse> getLeadsForCurrentUser(String userId);
```

---

## Action Items (Priority Order)

### **P0 - CRITICAL (Fix Immediately)**:

1. ✅ **Add `@PreAuthorize` to OpportunityController**
   - ALL endpoints MUST have permission checks
   - Prevents unauthorized access

2. ✅ **Fix Lead/Opportunity Data Filtering**
   - Option A: Implement service-level filtering based on dataVisibility
   - Option B: Create separate endpoints for admin/manager/user

3. ✅ **Add Repository Methods**
   - `findByOwnerIdInAndTenantId` for manager queries

---

### **P1 - HIGH (Fix This Week)**:

4. ✅ **Add Manager Endpoints for Attendance**
   - `GET /attendance/admin/team` (filter by subordinates)
   - Permission: `ATTENDANCE_READ_SUBORDINATES`

5. ✅ **Add Permission Definitions**
   - `LEAD_READ_ALL`, `LEAD_READ_SUBORDINATES`
   - `OPPORTUNITY_READ_ALL`, `OPPORTUNITY_READ_SUBORDINATES`
   - Update Role/Profile entities

6. ✅ **Update Frontend**
   - Ensure frontend calls correct endpoints based on user role
   - Hide admin/manager features from regular users

---

### **P2 - MEDIUM (Fix Next Sprint)**:

7. ✅ **Add Data Visibility Service**
   - Centralized service to handle dataVisibility logic
   - Reusable across all entities (Lead, Opportunity, Contact, etc.)

8. ✅ **Add Unit Tests**
   - Test RBAC permissions for each role
   - Test data filtering logic
   - Test unauthorized access attempts

9. ✅ **Add Audit Logging**
   - Log when users access data outside their scope
   - Alert on suspicious access patterns

---

## Testing Checklist

### **Manual Testing**:

#### **Test 1: Sales Representative Access**
```
Login as: Sales Rep (ROLE-00003)
Expected:
- ✅ Can see ONLY own leaves
- ✅ Can see ONLY own leads
- ✅ Can see ONLY own opportunities
- ✅ Can see ONLY own attendance
- ❌ Cannot access /admin/* endpoints

Current:
- ✅ Can see own leaves (correct)
- ❌ Can see ALL leads (BROKEN)
- ❌ Can see ALL opportunities (BROKEN)
- ✅ Can see own attendance (correct)
```

#### **Test 2: Manager Access**
```
Login as: Manager (ROLE-00002)
Expected:
- ✅ Can see own + subordinates' leaves
- ✅ Can approve subordinates' leaves
- ✅ Can see own + subordinates' leads
- ✅ Can see own + subordinates' opportunities
- ❌ Cannot see other managers' team data

Current:
- ✅ Can see subordinates' leaves (correct)
- ✅ Can approve subordinates' leaves (correct)
- ❌ Can see ALL leads (BROKEN)
- ❌ Can see ALL opportunities (BROKEN)
```

#### **Test 3: Admin Access**
```
Login as: Admin (ROLE-00001)
Expected:
- ✅ Can see ALL employees' data
- ✅ Can access ALL /admin/* endpoints

Current:
- ✅ Can see all leaves (correct)
- ✅ Can see all attendance (correct)
- ❌ Can see all leads (wrong permission used)
- ❌ Can see all opportunities (no permission check)
```

---

## Code Examples for Fixes

### **Fix 1: Add Data Visibility Service**

**File**: `/backend/src/main/java/com/ultron/backend/service/DataVisibilityService.java`

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class DataVisibilityService extends BaseTenantService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PermissionService permissionService;

    /**
     * Get visible user IDs based on data visibility rules
     * @param userId Current user's ID
     * @return List of user IDs this user can view data for
     */
    public List<String> getVisibleUserIds(String userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Role role = roleRepository.findByRoleIdAndTenantId(
                user.getRoleId(), getCurrentTenantId())
            .orElseThrow(() -> new ResourceNotFoundException("Role not found"));

        String dataVisibility = role.getPermissions().getDataVisibility();

        switch (dataVisibility) {
            case "ALL":
                // Admin: All users in tenant
                return userRepository.findByTenantIdAndIsDeletedFalse(getCurrentTenantId())
                    .stream()
                    .map(User::getUserId)
                    .collect(Collectors.toList());

            case "SUBORDINATES":
                // Manager: Own + all subordinates
                List<String> subordinates = permissionService.getAllSubordinates(user.getUserId());
                subordinates.add(user.getUserId());
                return subordinates;

            case "OWN":
                // Employee: Only own
                return Collections.singletonList(user.getUserId());

            default:
                return Collections.emptyList();
        }
    }

    /**
     * Check if user can view another user's data
     */
    public boolean canViewUser(String viewerId, String targetUserId) {
        List<String> visibleIds = getVisibleUserIds(viewerId);
        return visibleIds.contains(targetUserId);
    }
}
```

---

### **Fix 2: Update LeadService**

**File**: `/backend/src/main/java/com/ultron/backend/service/LeadService.java`

```java
@Autowired
private DataVisibilityService dataVisibilityService;

public List<LeadResponse> getLeadsForCurrentUser(String userId) {
    String tenantId = getCurrentTenantId();

    // Get visible user IDs based on role
    List<String> visibleUserIds = dataVisibilityService.getVisibleUserIds(userId);

    if (visibleUserIds.isEmpty()) {
        return Collections.emptyList();
    }

    // Query leads owned by visible users
    List<Lead> leads = leadRepository.findByLeadOwnerIdInAndTenantIdAndIsDeletedFalse(
            visibleUserIds, tenantId);

    return leads.stream()
        .map(this::mapToResponse)
        .collect(Collectors.toList());
}
```

---

### **Fix 3: Update LeadController**

**File**: `/backend/src/main/java/com/ultron/backend/controller/LeadController.java`

```java
// Replace existing getAllLeads with this:

@GetMapping
@PreAuthorize("hasPermission('LEAD', 'READ')")
public ResponseEntity<ApiResponse<List<LeadResponse>>> getLeads(Authentication auth) {
    String userId = auth.getName();
    log.info("User {} fetching leads (filtered by data visibility)", userId);

    List<LeadResponse> leads = leadService.getLeadsForCurrentUser(userId);

    return ResponseEntity.ok(
        ApiResponse.<List<LeadResponse>>builder()
            .success(true)
            .message("Leads retrieved successfully")
            .data(leads)
            .build());
}
```

---

## Summary

### **Current State**:
| Module | Security | Data Filtering | Status |
|--------|----------|----------------|--------|
| Leave Management | ✅ Correct | ✅ Correct | ✅ **GOOD** |
| Attendance | ✅ Correct | ⚠️ Missing manager endpoints | ⚠️ **NEEDS WORK** |
| Lead Management | ⚠️ Wrong permission | ❌ No filtering | ❌ **BROKEN** |
| Opportunity Management | ❌ No security | ❌ No filtering | ❌ **CRITICAL** |

### **Required Changes**:
1. ✅ Add `@PreAuthorize` to ALL Opportunity endpoints
2. ✅ Implement data visibility filtering in Lead/Opportunity services
3. ✅ Add repository methods for manager queries
4. ✅ Add new permissions (READ_ALL, READ_SUBORDINATES)
5. ✅ Create DataVisibilityService for reusable logic
6. ✅ Add manager-specific endpoints for Attendance

### **Risk Assessment**:
- **HIGH RISK**: Opportunity module (no security at all)
- **MEDIUM RISK**: Lead module (wrong permissions, no filtering)
- **LOW RISK**: Leave/Attendance modules (mostly correct, minor gaps)

---

**Next Steps**: Prioritize fixing Opportunity and Lead modules immediately to prevent data leakage.

---

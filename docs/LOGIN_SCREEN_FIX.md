# Login Screen Error Fix

**Date**: 2026-03-08
**Error**: `403 Forbidden` when loading login screen
**Status**: ✅ **FIXED**

---

## 🐛 The Problem

When loading the login screen, the app was throwing errors:

```
GET http://localhost:8080/api/v1/users/me/permissions 403 (Forbidden)
TenantProvider.tsx:47 No token found, skipping tenant load
usePermissions.ts:81 [usePermissions] Failed to load permission manifest: ApiError: Network error occurred
SyntaxError: Unexpected end of JSON input
```

---

## 🔍 Root Cause

The `usePermissions` hook was attempting to load user permissions on **every page mount**, including the login page where no user is authenticated yet.

**Before (problematic code):**
```typescript
// usePermissions.ts line 92-94
useEffect(() => {
  loadPermissions(); // ❌ Called without checking authentication!
}, [loadPermissions]);
```

This caused the hook to make an API call to `/api/v1/users/me/permissions` even when there was no authentication token, resulting in a 403 Forbidden error.

---

## ✅ Solution Applied

Updated the `usePermissions` hook to check authentication before attempting to load permissions:

**After (fixed code):**
```typescript
// usePermissions.ts
import { authService } from "@/lib/auth";

useEffect(() => {
  // Check if user is authenticated before trying to load permissions
  if (authService.isAuthenticated()) {
    loadPermissions();
  } else {
    // User not authenticated, skip loading and clear state
    setPermissions(null);
    setLoading(false);
    console.log("[usePermissions] User not authenticated, skipping permission load");
  }
}, [loadPermissions]);
```

---

## 🎯 How It Works Now

### **When User Is NOT Authenticated** (Login Page):
1. ✅ Hook checks `authService.isAuthenticated()` → returns `false`
2. ✅ Sets `permissions = null` and `loading = false`
3. ✅ Skips API call to `/users/me/permissions`
4. ✅ No 403 error thrown

### **When User IS Authenticated** (After Login):
1. ✅ Hook checks `authService.isAuthenticated()` → returns `true`
2. ✅ Calls `loadPermissions()` to fetch user permissions
3. ✅ Permissions loaded successfully
4. ✅ UI components can check permissions

---

## 📁 Files Modified

**File**: `/frontend/hooks/usePermissions.ts`
- **Line 3**: Added import for `authService`
- **Lines 92-103**: Added authentication check in `useEffect`

---

## 🧪 Testing

### **Test Case 1: Login Page Load**
1. Navigate to `/login`
2. **Expected**: No 403 errors in console
3. **Expected**: Login form renders correctly
4. **Expected**: Console log: "User not authenticated, skipping permission load"

### **Test Case 2: After Successful Login**
1. Enter credentials and submit
2. **Expected**: Token stored in localStorage
3. **Expected**: Permissions loaded automatically
4. **Expected**: User redirected to dashboard

### **Test Case 3: Logout and Return to Login**
1. Logout from authenticated session
2. **Expected**: Token cleared
3. **Expected**: Redirected to login page
4. **Expected**: No permission loading errors

---

## 🔧 Related Components

### **authService.isAuthenticated()**
Located: `/frontend/lib/auth.ts` (line 72-84)

Checks if user has a valid token:
```typescript
isAuthenticated(): boolean {
  const token = this.getToken();
  if (token) {
    // Ensure cookie is also set
    if (!document.cookie.includes("auth_token=")) {
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 7);
      document.cookie = `auth_token=${token}; path=/; expires=${expirationDate.toUTCString()}; SameSite=Strict`;
    }
    return true;
  }
  return false;
}
```

---

## 🎓 Best Practices Applied

### **1. Authentication-Aware Hooks**
- Hooks that call authenticated APIs should check `isAuthenticated()` first
- Prevents unnecessary 403 errors
- Improves user experience

### **2. Graceful Degradation**
- Hook still functions on login page (returns `loading: false`, `permissions: null`)
- UI components can handle null permissions state
- No breaking errors

### **3. Clear Logging**
- Added console.log for debugging
- Easy to identify when permission loading is skipped
- Helps with troubleshooting

---

## ⚠️ Similar Issues to Watch For

Check other hooks/components that might make authenticated API calls unconditionally:

1. **useTenant** - Should check auth before loading tenant
2. **useUser** - Should check auth before loading user profile
3. **WebSocketProvider** - Should only connect if authenticated

---

## 🔗 Related Documentation

- **Authentication Flow**: `/docs/AUTHENTICATION_GUIDE.md` (if exists)
- **RBAC System**: `/docs/RBAC_IMPLEMENTATION.md` (if exists)
- **API Client**: `/frontend/lib/api-client.ts`

---

**Status**: ✅ **RESOLVED**

Login screen now loads without errors. Permissions only loaded when user is authenticated.

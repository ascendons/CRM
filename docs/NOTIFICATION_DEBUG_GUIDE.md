# Notification Debugging Guide

**Issue**: Notifications not appearing on dashboard after lead assign/reassign
**Date**: February 26, 2026

---

## 🔍 Root Cause Analysis

The issue is likely a **User ID format mismatch** between:

1. **WebSocket User Principal** (from JWT): MongoDB `_id` field (e.g., `"6762a1b2c3d4e5f6a7b8c9d0"`)
2. **Target User ID** (in Lead): Could be either MongoDB `_id` OR business `userId` (e.g., `"USR-2026-02-00001"`)

### How It Works

**JWT Authentication Flow:**
```java
// AuthService.java line 141, 209
jwtService.generateToken(user.getId(), ...)  // ← MongoDB _id

// JwtService.java line 78
.subject(userId)  // ← Sets MongoDB _id as subject

// WebSocketConfig.java line 68, 76
String userId = jwtService.extractUserId(token);  // ← MongoDB _id
accessor.setUser(authentication);  // ← WebSocket principal = MongoDB _id
```

**WebSocket Subscription:**
- Frontend subscribes to: `/user/queue/notifications`
- Spring translates to: `/user/{mongodb-id}/queue/notifications`
- Example: `/user/6762a1b2c3d4e5f6a7b8c9d0/queue/notifications`

**Notification Sending:**
```java
// LeadService.java line 142-143
notificationService.createAndSendNotification(
    savedLead.getLeadOwnerId(),  // ← What format is this?
    ...
);

// NotificationService.java line 43
messagingTemplate.convertAndSendToUser(targetUserId, "/queue/notifications", dto);
// Sends to: /user/{targetUserId}/queue/notifications
```

**Problem:** If `leadOwnerId` contains business `userId` (USR-2026-02-00001) but WebSocket expects MongoDB `_id` (6762a1b2c3d4e5f6a7b8c9d0), notifications won't arrive!

---

## 🐛 Step-by-Step Debugging

### Step 1: Check WebSocket Connection

**Frontend Console:**
```javascript
// Open browser DevTools → Console
// Should see:
"Connected to WebSocket"
```

If not connected, check:
- Backend is running
- CORS settings allow your origin
- JWT token is valid

### Step 2: Enable Backend Logging

**Edit `application.properties`:**
```properties
# Add these lines
logging.level.com.ultron.backend.service.NotificationService=DEBUG
logging.level.org.springframework.messaging=DEBUG
logging.level.org.springframework.web.socket=DEBUG
```

**Restart backend and check logs:**
```bash
cd backend
./mvnw spring-boot:run

# In another terminal
tail -f logs/spring.log | grep -i "notification\|websocket"
```

### Step 3: Test Lead Assignment

**Perform lead assignment in the UI**

**Check Backend Logs - Should See:**
```
INFO  c.u.b.service.LeadService : Notification sent for lead reassignment: LEAD-2026-02-00001
DEBUG c.u.b.service.NotificationService : Sending notification to user: 6762a1b2c3d4e5f6a7b8c9d0
DEBUG o.s.messaging.simp : Broadcasting to /user/6762a1b2c3d4e5f6a7b8c9d0/queue/notifications
```

### Step 4: Check User ID Format

**Add temporary debug logging in LeadService:**

```java
// LeadService.java - in notification block
try {
    log.info("DEBUG: Lead owner ID = {}", savedLead.getLeadOwnerId());
    log.info("DEBUG: Current user ID = {}", TenantContext.getUserId());

    notificationService.createAndSendNotification(
        savedLead.getLeadOwnerId(),
        ...
    );
}
```

**Expected Output:**
```
DEBUG: Lead owner ID = 6762a1b2c3d4e5f6a7b8c9d0  ← Should be MongoDB _id
DEBUG: Current user ID = 6762a1b2c3d4e5f6a7b8c9d0
```

**If you see:**
```
DEBUG: Lead owner ID = USR-2026-02-00001  ← WRONG FORMAT!
```

Then this confirms the User ID format mismatch.

### Step 5: Check Frontend WebSocket Subscription

**Add console logging in WebSocketProvider.tsx:**

```typescript
// Line 169 - Add logging
stompClient.subscribe(`/user/queue/notifications`, (message: IMessage) => {
    console.log('📬 Notification received via WebSocket:', message.body);
    const notification = JSON.parse(message.body) as Notification;
    console.log('📬 Parsed notification:', notification);
    // ...
});
```

**Test again - Check Browser Console:**
- If you see logs: Backend is sending, frontend is receiving ✅
- If you don't see logs: Notifications aren't arriving ❌

### Step 6: Check User ID in JWT

**Frontend Console:**
```javascript
// Decode your JWT token
const token = localStorage.getItem('token');
const payload = JSON.parse(atob(token.split('.')[1]));
console.log('JWT Payload:', payload);
console.log('JWT Subject (userId):', payload.sub);
console.log('JWT userId claim:', payload.userId);
```

**Check output:**
```javascript
{
  sub: "6762a1b2c3d4e5f6a7b8c9d0",  // ← This is the WebSocket user principal
  userId: "6762a1b2c3d4e5f6a7b8c9d0", // ← Same as sub
  email: "user@example.com",
  tenantId: "699f33336b6fcb6d28b35747",
  ...
}
```

### Step 7: Check MongoDB Data

**Query MongoDB:**
```javascript
use crm;

// Check what's stored as leadOwnerId
db.leads.findOne({}, {leadId: 1, leadOwnerId: 1, tenantId: 1});

// Expected output:
{
  "_id": ObjectId("..."),
  "leadId": "LEAD-2026-02-00001",
  "leadOwnerId": "6762a1b2c3d4e5f6a7b8c9d0",  // ← Should be MongoDB _id
  "tenantId": "699f33336b6fcb6d28b35747"
}

// Check user collection
db.users.findOne({_id: ObjectId("6762a1b2c3d4e5f6a7b8c9d0")}, {userId: 1, email: 1});

// Expected output:
{
  "_id": ObjectId("6762a1b2c3d4e5f6a7b8c9d0"),
  "userId": "USR-2026-02-00001",  // ← Business ID
  "email": "user@example.com"
}
```

---

## 🔧 Fixes Based on Diagnosis

### Fix 1: If leadOwnerId Contains Business userId (USR-...)

**Problem:** Lead stores business `userId` (USR-...) but WebSocket expects MongoDB `_id`

**Solution:** Update LeadService to convert business userId to MongoDB _id before sending notification

```java
// In LeadService.java notification block
try {
    String targetUserId = savedLead.getLeadOwnerId();

    // If leadOwnerId is business userId (USR-...), convert to MongoDB _id
    if (targetUserId != null && targetUserId.startsWith("USR-")) {
        User ownerUser = userRepository.findByUserIdAndTenantId(targetUserId, tenantId)
            .orElse(null);
        if (ownerUser != null) {
            targetUserId = ownerUser.getId();  // Get MongoDB _id
        }
    }

    if (targetUserId != null) {
        notificationService.createAndSendNotification(
            targetUserId,  // ← Now MongoDB _id
            "Lead Assigned: " + savedLead.getFirstName() + " " + savedLead.getLastName(),
            ..
        );
    }
} catch (Exception e) {
    log.error("Failed to send notification", e);
}
```

### Fix 2: If WebSocket Not Connecting

**Check CORS settings in `application.properties`:**
```properties
cors.allowed-origins=http://localhost:3000,http://localhost:3001
```

**Verify frontend is using correct URL:**
```typescript
// WebSocketProvider.tsx line 129
const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';
```

### Fix 3: If Notifications Being Sent But Not Displayed

**Check NotificationPanel state:**
```typescript
// Add logging in WebSocketProvider.tsx
setNotifications(prev => {
    console.log('Current notifications:', prev.length);
    console.log('New notification:', notification);
    const exists = prev.some(n => n.id === notification.id);
    console.log('Already exists?', exists);
    return exists ? prev : [notification, ...prev];
});
```

---

## ✅ Expected Flow (When Working)

1. **User assigns lead to User B**
2. **Backend logs:**
   ```
   INFO: Notification sent for lead reassignment: LEAD-2026-02-00001
   DEBUG: Broadcasting to /user/6762a1b2c3d4e5f6a7b8c9d0/queue/notifications
   ```
3. **Frontend console:**
   ```
   📬 Notification received via WebSocket: {...}
   ```
4. **Notification panel updates** - Badge shows "1", panel shows notification
5. **User B clicks notification** - Navigates to lead detail page

---

## 🎯 Quick Test Script

**Run this in MongoDB to create a test scenario:**
```javascript
// Get current user
const user = db.users.findOne({email: "your-email@example.com"});
console.log("User MongoDB _id:", user._id);
console.log("User business userId:", user.userId);

// Get a lead assigned to this user
const lead = db.leads.findOne({leadOwnerId: user._id.str});
console.log("Lead owner ID:", lead.leadOwnerId);
console.log("Lead owner ID format:", lead.leadOwnerId.startsWith("USR-") ? "Business userId" : "MongoDB _id");
```

---

## 📝 Summary

The most likely issues:

1. ✅ **User ID Format Mismatch** - `leadOwnerId` contains business `userId` instead of MongoDB `_id`
   - Fix: Convert business userId to MongoDB _id before sending notification

2. ⚠️ **WebSocket Not Connected** - Frontend isn't connected to backend WebSocket
   - Fix: Check CORS, JWT, and connection logs

3. ⚠️ **Notifications Sent to Wrong Channel** - Target user ID doesn't match WebSocket principal
   - Fix: Ensure consistent use of MongoDB `_id` everywhere

---

## 🚀 Next Steps

1. Run Step-by-Step Debugging above
2. Identify which issue you have
3. Apply the appropriate fix
4. Test again
5. If still not working, share the logs for further analysis

The debug logs will tell us exactly where the problem is!

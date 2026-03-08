# Quick Fix: Notifications Not Appearing

**Issue**: Notifications not showing on dashboard
**Root Cause**: User ID format mismatch between WebSocket and notification target

---

## The Problem

- WebSocket expects MongoDB `_id` (e.g., `"6762a1b2c3d4e5f6a7b8c9d0"`)
- Lead Owner ID might contain business `userId` (e.g., `"USR-2026-02-00001"`)
- Mismatch = notification sent to wrong channel = not received

---

## The Fix

Update `NotificationService` to resolve any user ID format to MongoDB `_id`:

### Step 1: Update NotificationService.java

**Add new dependencies at the top:**
```java
private final UserRepository userRepository;  // Add this
```

**Replace the `createAndSendNotification` method:**
```java
public NotificationDTO createAndSendNotification(String targetUserId, String title, String message, String type, String actionUrl) {
    String tenantId = TenantContext.getTenantId();

    // Resolve targetUserId to MongoDB _id format
    String resolvedUserId = resolveToMongoId(targetUserId, tenantId);

    if (resolvedUserId == null) {
        log.warn("Could not resolve user ID: {}", targetUserId);
        return null;
    }

    Notification notification = Notification.builder()
            .tenantId(tenantId)
            .targetUserId(resolvedUserId)  // ← Use resolved MongoDB _id
            .title(title)
            .message(message)
            .type(type)
            .actionUrl(actionUrl)
            .createdAt(LocalDateTime.now())
            .isRead(false)
            .build();

    notification = notificationRepository.save(notification);

    NotificationDTO dto = mapToDTO(notification);

    // Send to WebSocket - now using MongoDB _id
    log.debug("Sending notification to user {} (resolved from {})", resolvedUserId, targetUserId);
    messagingTemplate.convertAndSendToUser(resolvedUserId, "/queue/notifications", dto);

    return dto;
}

/**
 * Resolve any user ID format to MongoDB _id
 * Handles both MongoDB _id and business userId (USR-...)
 */
private String resolveToMongoId(String userId, String tenantId) {
    if (userId == null) {
        return null;
    }

    // If it's already MongoDB _id format (24-char hex), return as-is
    if (userId.matches("^[0-9a-fA-F]{24}$")) {
        log.debug("User ID {} is already MongoDB _id format", userId);
        return userId;
    }

    // If it's business userId format (USR-...), lookup MongoDB _id
    if (userId.startsWith("USR-")) {
        log.debug("User ID {} is business userId, looking up MongoDB _id", userId);
        return userRepository.findByUserIdAndTenantId(userId, tenantId)
                .map(User::getId)
                .orElse(null);
    }

    // Unknown format, try to use as-is
    log.warn("Unknown user ID format: {}", userId);
    return userId;
}
```

**Constructor should now include UserRepository:**
```java
@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final UserRepository userRepository;  // ← Add this

    // ... rest of code
}
```

### Step 2: Add Debug Logging (Temporary)

**In LeadService.java - before notification calls:**
```java
try {
    log.info("🔔 Sending notification - Lead: {}, Owner ID: {}, Type: {}",
             savedLead.getLeadId(),
             savedLead.getLeadOwnerId(),
             "LEAD_REASSIGNED");

    notificationService.createAndSendNotification(...);

} catch (Exception e) {
    log.error("Failed to send notification for lead: {}", savedLead.getLeadId(), e);
}
```

### Step 3: Recompile and Test

```bash
cd backend
./mvnw clean compile
./mvnw spring-boot:run
```

### Step 4: Test Notification

1. Assign a lead to another user
2. Check backend logs - should see:
   ```
   🔔 Sending notification - Lead: LEAD-2026-02-00001, Owner ID: 6762a1b2c3d4e5f6a7b8c9d0, Type: LEAD_REASSIGNED
   DEBUG c.u.b.s.NotificationService : User ID 6762a1b2c3d4e5f6a7b8c9d0 is already MongoDB _id format
   DEBUG c.u.b.s.NotificationService : Sending notification to user 6762a1b2c3d4e5f6a7b8c9d0 (resolved from 6762a1b2c3d4e5f6a7b8c9d0)
   ```

3. Check frontend - notification should appear!

---

## Alternative: Quick Test Without Code Changes

**Add debug logging to see what's happening:**

1. Edit `application.properties`:
   ```properties
   logging.level.com.ultron.backend.service.NotificationService=DEBUG
   logging.level.org.springframework.messaging=DEBUG
   ```

2. Restart backend

3. Assign a lead

4. Check logs for:
   ```
   Sending notification to user: [some-id]
   Broadcasting to /user/[some-id]/queue/notifications
   ```

5. Check browser console for:
   ```
   Connected to WebSocket
   ```

6. If WebSocket connected but no notification received, it confirms ID mismatch

---

## Why This Fix Works

1. **Handles Both Formats**: Whether `leadOwnerId` is MongoDB `_id` or business `userId`, it's resolved to MongoDB `_id`
2. **WebSocket Compatibility**: Always sends to MongoDB `_id` format that WebSocket expects
3. **Backwards Compatible**: Doesn't break existing code
4. **Logging**: Shows exactly what's happening for debugging

---

## Expected Outcome

✅ Notifications appear instantly on dashboard
✅ No more silent failures
✅ Works regardless of user ID format stored in leads

---

Try this fix and let me know if notifications start appearing!

# Manual Testing Checklist - Security & Performance

**Date**: _________
**Tester**: _________
**Version**: _________

---

## ✅ P0: Security Authorization Tests

### Test 1: Unauthorized Chat Reading
- [ ] User A creates chat with User B
- [ ] User C (not in conversation) tries to read chat
- [ ] **Expected**: 403 Forbidden response
- [ ] **Actual**: _________
- [ ] **Status**: ⬜ Pass  ⬜ Fail

### Test 2: Group Authorization
- [ ] Create group with Users A and B
- [ ] User C (not member) tries to send message
- [ ] **Expected**: 403 Forbidden response
- [ ] **Actual**: _________
- [ ] **Status**: ⬜ Pass  ⬜ Fail

### Test 3: Cross-User Notification
- [ ] Create notification for User A
- [ ] User B tries to mark it as read
- [ ] **Expected**: 403 Forbidden response
- [ ] **Actual**: _________
- [ ] **Status**: ⬜ Pass  ⬜ Fail

### Test 4: Tenant Isolation
- [ ] User from Tenant A tries to access Tenant B data
- [ ] **Expected**: 403 Forbidden (no cross-tenant access)
- [ ] **Actual**: _________
- [ ] **Status**: ⬜ Pass  ⬜ Fail

---

## ✅ P1: Input Validation Tests

### Test 5: Message Length Validation
- [ ] Send message with 5001 characters
- [ ] **Expected**: 400 Bad Request - "Message too long"
- [ ] **Actual**: _________
- [ ] **Status**: ⬜ Pass  ⬜ Fail

### Test 6: Empty Message Validation
- [ ] Send message with empty content
- [ ] **Expected**: 400 Bad Request - "Content cannot be empty"
- [ ] **Actual**: _________
- [ ] **Status**: ⬜ Pass  ⬜ Fail

### Test 7: Group Name Validation
- [ ] Create group with name > 100 characters
- [ ] **Expected**: 400 Bad Request - "Name too long"
- [ ] **Actual**: _________
- [ ] **Status**: ⬜ Pass  ⬜ Fail

### Test 8: Required Fields Validation
- [ ] Send chat message without recipientId
- [ ] **Expected**: 400 Bad Request
- [ ] **Actual**: _________
- [ ] **Status**: ⬜ Pass  ⬜ Fail

---

## ✅ P0: Performance Tests (N+1 Query Fix)

### Test 9: Chat History Performance
- [ ] Load chat history with 50 messages
- [ ] Check logs for individual user queries
- [ ] **Expected**: 1-2 queries (batch load), <50ms response
- [ ] **Actual**: _________ queries, _________ ms
- [ ] **Status**: ⬜ Pass  ⬜ Fail

### Test 10: Group List Performance
- [ ] User is member of 10 groups
- [ ] Load group list
- [ ] **Expected**: 1-2 queries (batch load), <100ms response
- [ ] **Actual**: _________ queries, _________ ms
- [ ] **Status**: ⬜ Pass  ⬜ Fail

### Test 11: Database Indexes
```bash
# Run in MongoDB shell
db.chat_messages.getIndexes()
db.chat_groups.getIndexes()
db.notifications.getIndexes()
```
- [ ] All indexes present (11 total)
- [ ] idx_chat_direct_messages exists
- [ ] idx_group_members exists
- [ ] idx_user_notifications exists
- [ ] **Status**: ⬜ Pass  ⬜ Fail

---

## ✅ P1: Error Handling Tests

### Test 12: Non-existent Resource
- [ ] Request chat history for non-existent user
- [ ] **Expected**: 404 Not Found with clear message
- [ ] **Actual**: _________
- [ ] **Status**: ⬜ Pass  ⬜ Fail

### Test 13: Invalid JWT Token
- [ ] Send request with expired/invalid token
- [ ] **Expected**: 401 Unauthorized
- [ ] **Actual**: _________
- [ ] **Status**: ⬜ Pass  ⬜ Fail

### Test 14: Server Error Handling
- [ ] Temporarily stop MongoDB
- [ ] Try to send chat message
- [ ] **Expected**: 500 Internal Server Error with generic message
- [ ] **Actual**: _________
- [ ] **Status**: ⬜ Pass  ⬜ Fail

### Test 15: Logging Verification
```bash
tail -f backend/logs/spring.log | grep -i "unauthorized\|error\|exception"
```
- [ ] Unauthorized attempts are logged (WARN level)
- [ ] Errors are logged with stack traces (ERROR level)
- [ ] No sensitive data in logs
- [ ] **Status**: ⬜ Pass  ⬜ Fail

---

## ✅ Functional Tests

### Test 16: Valid Chat Flow
- [ ] User A sends message to User B
- [ ] User B receives message via WebSocket
- [ ] Chat history shows the message
- [ ] Sender name displays correctly
- [ ] **Status**: ⬜ Pass  ⬜ Fail

### Test 17: Group Chat Flow
- [ ] Create group with 3 members
- [ ] Send message to group
- [ ] All members receive message
- [ ] Message shows in group chat history
- [ ] **Status**: ⬜ Pass  ⬜ Fail

### Test 18: Notification Flow
- [ ] Trigger notification for user
- [ ] User receives notification via WebSocket
- [ ] Notification shows in notification list
- [ ] Mark as read works correctly
- [ ] Unread count updates
- [ ] **Status**: ⬜ Pass  ⬜ Fail

### Test 19: Broadcast Messages
- [ ] Send broadcast message to ALL
- [ ] All users in tenant receive it
- [ ] Message shows in "Everyone" chat
- [ ] **Status**: ⬜ Pass  ⬜ Fail

---

## ✅ Load & Stress Tests

### Test 20: Concurrent Users
- [ ] Run load test script with 100 concurrent users
- [ ] Check response times remain <200ms
- [ ] Check error rate <1%
- [ ] Check server CPU <80%
- [ ] **Status**: ⬜ Pass  ⬜ Fail

### Test 21: Message Throughput
- [ ] Send 1000 messages in 1 minute
- [ ] Check all messages delivered
- [ ] Check no message loss
- [ ] Check WebSocket connections stable
- [ ] **Status**: ⬜ Pass  ⬜ Fail

### Test 22: Database Performance
```javascript
// In MongoDB shell
db.chat_messages.find({
  tenantId: "test",
  senderId: "userA",
  recipientId: "userB"
}).explain("executionStats")
```
- [ ] executionTimeMillis < 50ms
- [ ] Uses index (totalKeysExamined > 0)
- [ ] No COLLSCAN (collection scan)
- [ ] **Status**: ⬜ Pass  ⬜ Fail

---

## ✅ WebSocket Tests

### Test 23: Connection Stability
- [ ] Connect to WebSocket
- [ ] Wait 5 minutes with no activity
- [ ] Connection remains active
- [ ] Can still send/receive messages
- [ ] **Status**: ⬜ Pass  ⬜ Fail

### Test 24: Reconnection
- [ ] Connect to WebSocket
- [ ] Disconnect network briefly
- [ ] Check auto-reconnect works
- [ ] Messages sync after reconnect
- [ ] **Status**: ⬜ Pass  ⬜ Fail

### Test 25: Multiple Connections
- [ ] Same user connects from 2 devices
- [ ] Send message from device 1
- [ ] Verify both devices receive it
- [ ] **Status**: ⬜ Pass  ⬜ Fail

---

## 📊 Performance Benchmarks

Record actual performance numbers:

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Chat history load time | <50ms | _____ ms | ⬜ |
| Message send time | <100ms | _____ ms | ⬜ |
| Group list load time | <100ms | _____ ms | ⬜ |
| Notification load time | <50ms | _____ ms | ⬜ |
| WebSocket connect time | <500ms | _____ ms | ⬜ |
| Concurrent users | 100 | _____ | ⬜ |
| Messages per second | 1000 | _____ | ⬜ |
| Database query time | <50ms | _____ ms | ⬜ |

---

## 🐛 Issues Found

| # | Issue | Severity | Status | Notes |
|---|-------|----------|--------|-------|
| 1 | | ⬜ P0 ⬜ P1 ⬜ P2 | ⬜ Open ⬜ Fixed | |
| 2 | | ⬜ P0 ⬜ P1 ⬜ P2 | ⬜ Open ⬜ Fixed | |
| 3 | | ⬜ P0 ⬜ P1 ⬜ P2 | ⬜ Open ⬜ Fixed | |
| 4 | | ⬜ P0 ⬜ P1 ⬜ P2 | ⬜ Open ⬜ Fixed | |
| 5 | | ⬜ P0 ⬜ P1 ⬜ P2 | ⬜ Open ⬜ Fixed | |

---

## ✅ Sign-Off

### Summary
- **Total Tests**: 25
- **Passed**: _____
- **Failed**: _____
- **Pass Rate**: _____%

### Critical Issues
- [ ] No P0 issues found
- [ ] All P0 issues resolved

### Production Readiness
- [ ] All security tests passed
- [ ] All performance tests passed
- [ ] Error handling verified
- [ ] Logging verified
- [ ] Load testing completed

**Ready for Production**: ⬜ Yes  ⬜ No

**Tested By**: _________________
**Date**: _________________
**Approved By**: _________________
**Date**: _________________

---

## 📝 Notes

Additional observations or comments:

_________________________________________
_________________________________________
_________________________________________

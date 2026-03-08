# Security Testing Guide - Quick Reference

## 🎯 Purpose

This guide helps you verify that all security fixes are working correctly.

---

## 🚀 Quick Start

### 1. Deploy the Indexes (REQUIRED FIRST)

```bash
# Connect to your MongoDB
mongosh crm_db

# Run the index script
load('backend/src/main/resources/mongodb-indexes.js')

# Verify indexes were created
db.chat_messages.getIndexes()
db.chat_groups.getIndexes()
db.notifications.getIndexes()
```

### 2. Start the Backend

```bash
cd backend
./mvnw clean spring-boot:run
```

### 3. Prepare Test Data

Create at least 3 test users in the same tenant:
- User A (alice@example.com)
- User B (bob@example.com)
- User C (charlie@example.com)

---

## 🧪 Security Test Scenarios

### Test 1: Prevent Unauthorized Chat Reading

**Scenario**: Alice tries to read chat between Bob and Charlie

```bash
# 1. Bob sends message to Charlie
curl -X POST "http://localhost:8080/api/v1/chat/send" \
  -H "Authorization: Bearer <bob_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "recipientId": "<charlie_user_id>",
    "recipientType": "USER",
    "content": "Hey Charlie, this is private!"
  }'

# 2. Alice tries to read Bob-Charlie chat (SHOULD FAIL)
curl -X GET "http://localhost:8080/api/v1/chat/history/USER/<charlie_user_id>?page=0&size=50" \
  -H "Authorization: Bearer <alice_token>"

# Expected: HTTP 403 Forbidden
# Response: {"success": false, "message": "Not authorized to read this chat"}
```

**✅ Pass Criteria**: Alice gets 403 Forbidden
**❌ Fail Criteria**: Alice can see Bob and Charlie's messages

---

### Test 2: Prevent Unauthorized Group Messaging

**Scenario**: User tries to send message to a group they're not a member of

```bash
# 1. Create a group with Bob and Charlie (Alice not included)
curl -X POST "http://localhost:8080/api/v1/chat/groups" \
  -H "Authorization: Bearer <bob_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Bob and Charlie Only",
    "memberIds": ["<bob_user_id>", "<charlie_user_id>"]
  }'

# Note the group ID from response: <group_id>

# 2. Alice tries to send message to the group (SHOULD FAIL via WebSocket)
# Connect to WebSocket and send:
{
  "recipientId": "<group_id>",
  "recipientType": "GROUP",
  "content": "Hello group!"
}

# Expected: Message is rejected, Alice receives error
```

**✅ Pass Criteria**: Alice's message is rejected with "Not authorized"
**❌ Fail Criteria**: Alice can send to the group

---

### Test 3: Prevent Cross-User Notification Tampering

**Scenario**: Alice tries to mark Bob's notification as read

```bash
# 1. Create a notification for Bob
curl -X POST "http://localhost:8080/api/v1/notifications" \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "targetUserId": "<bob_user_id>",
    "title": "Important Notice",
    "message": "This is for Bob only",
    "type": "SYSTEM_ALERT"
  }'

# Note the notification ID: <notification_id>

# 2. Alice tries to mark Bob's notification as read (SHOULD FAIL)
curl -X PUT "http://localhost:8080/api/v1/notifications/<notification_id>/read" \
  -H "Authorization: Bearer <alice_token>"

# Expected: HTTP 403 Forbidden
# Response: {"success": false, "message": "Not authorized to modify this notification"}
```

**✅ Pass Criteria**: Alice gets 403 Forbidden
**❌ Fail Criteria**: Alice can mark Bob's notification as read

---

### Test 4: Verify Tenant Isolation

**Scenario**: User from Tenant A tries to access Tenant B's data

```bash
# Prerequisites: Create users in two different tenants
# - Alice in Tenant A
# - Bob in Tenant B

# 1. Bob creates a chat message in Tenant B
curl -X POST "http://localhost:8080/api/v1/chat/send" \
  -H "Authorization: Bearer <bob_tenantB_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "recipientId": "<charlie_tenantB_user_id>",
    "recipientType": "USER",
    "content": "Tenant B secret"
  }'

# 2. Alice (Tenant A) tries to read Bob's (Tenant B) chat (SHOULD FAIL)
curl -X GET "http://localhost:8080/api/v1/chat/history/USER/<bob_tenantB_user_id>" \
  -H "Authorization: Bearer <alice_tenantA_token>"

# Expected: HTTP 403 Forbidden (due to tenant mismatch)
```

**✅ Pass Criteria**: Cross-tenant access is denied
**❌ Fail Criteria**: Alice can see Tenant B data

---

### Test 5: Input Validation

**Scenario**: Attempt to send oversized or empty messages

```bash
# Test 5a: Empty message content
curl -X POST "http://localhost:8080/api/v1/chat/send" \
  -H "Authorization: Bearer <alice_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "recipientId": "<bob_user_id>",
    "recipientType": "USER",
    "content": ""
  }'

# Expected: HTTP 400 Bad Request
# Response: Validation error about empty content

# Test 5b: Message too long (>5000 chars)
curl -X POST "http://localhost:8080/api/v1/chat/send" \
  -H "Authorization: Bearer <alice_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "recipientId": "<bob_user_id>",
    "recipientType": "USER",
    "content": "'$(python3 -c 'print("A"*5001)')'"
  }'

# Expected: HTTP 400 Bad Request
# Response: Validation error about message being too long

# Test 5c: Group name too long
curl -X POST "http://localhost:8080/api/v1/chat/groups" \
  -H "Authorization: Bearer <alice_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "'$(python3 -c 'print("A"*101)')'"
    "memberIds": ["<bob_user_id>"]
  }'

# Expected: HTTP 400 Bad Request
```

**✅ Pass Criteria**: All validation errors return 400 Bad Request
**❌ Fail Criteria**: Invalid input is accepted

---

### Test 6: Authorization Logging

**Scenario**: Verify security violations are logged

```bash
# 1. Attempt unauthorized access (from Test 1)
curl -X GET "http://localhost:8080/api/v1/chat/history/USER/<other_user_id>" \
  -H "Authorization: Bearer <alice_token>"

# 2. Check backend logs
tail -f backend/logs/spring.log | grep "not authorized"

# Expected log entries:
# WARN ... User <alice_id> not authorized to read chat with <charlie_id> (type: USER)
```

**✅ Pass Criteria**: Security violations appear in logs with details
**❌ Fail Criteria**: No logging or insufficient detail

---

## 🔍 Performance Testing

### Test Index Performance

```javascript
// In mongosh, test query performance

// Test 1: Chat history query (should use idx_chat_direct_messages)
db.chat_messages.find({
  tenantId: "tenant_123",
  $or: [
    { senderId: "user_A", recipientId: "user_B" },
    { senderId: "user_B", recipientId: "user_A" }
  ]
}).explain("executionStats")

// Look for:
// - executionStats.executionTimeMillis < 50ms (with indexes)
// - executionStats.totalKeysExamined > 0 (using index)
// - executionStats.totalDocsExamined <= executionStats.nReturned (not scanning all docs)

// Test 2: Group membership query
db.chat_groups.find({
  tenantId: "tenant_123",
  memberIds: "user_A"
}).explain("executionStats")

// Should use idx_group_members

// Test 3: Notification query
db.notifications.find({
  tenantId: "tenant_123",
  targetUserId: "user_A",
  isRead: false
}).explain("executionStats")

// Should use idx_unread_notifications
```

**✅ Pass Criteria**:
- All queries use indexes (totalKeysExamined > 0)
- Execution time < 50ms
- No full collection scans

**❌ Fail Criteria**:
- Queries not using indexes (COLLSCAN in explain)
- Execution time > 100ms

---

## 📊 Automated Test Script

Save this as `test-security.sh`:

```bash
#!/bin/bash

# Configuration
BASE_URL="http://localhost:8080/api/v1"
ALICE_TOKEN="<alice_jwt_token>"
BOB_TOKEN="<bob_jwt_token>"
BOB_USER_ID="<bob_user_id>"
CHARLIE_USER_ID="<charlie_user_id>"

echo "================================"
echo "Security Test Suite"
echo "================================"

# Test 1: Unauthorized chat read
echo ""
echo "Test 1: Prevent unauthorized chat reading"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
  -X GET "$BASE_URL/chat/history/USER/$CHARLIE_USER_ID" \
  -H "Authorization: Bearer $ALICE_TOKEN")

if [ "$RESPONSE" == "403" ]; then
  echo "✅ PASS: Unauthorized chat read blocked (403)"
else
  echo "❌ FAIL: Expected 403, got $RESPONSE"
fi

# Test 2: Input validation - empty message
echo ""
echo "Test 2: Input validation - empty message"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST "$BASE_URL/chat/send" \
  -H "Authorization: Bearer $ALICE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"recipientId":"'$BOB_USER_ID'","recipientType":"USER","content":""}')

if [ "$RESPONSE" == "400" ]; then
  echo "✅ PASS: Empty message rejected (400)"
else
  echo "❌ FAIL: Expected 400, got $RESPONSE"
fi

# Test 3: Cross-user notification tampering
echo ""
echo "Test 3: Cross-user notification access"
# Note: You'll need to create a notification first and get its ID
NOTIFICATION_ID="<test_notification_id>"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
  -X PUT "$BASE_URL/notifications/$NOTIFICATION_ID/read" \
  -H "Authorization: Bearer $ALICE_TOKEN")

if [ "$RESPONSE" == "403" ]; then
  echo "✅ PASS: Cross-user notification access blocked (403)"
else
  echo "❌ FAIL: Expected 403, got $RESPONSE"
fi

echo ""
echo "================================"
echo "Test Suite Complete"
echo "================================"
```

Run with:
```bash
chmod +x test-security.sh
./test-security.sh
```

---

## 🎯 Expected Results Summary

| Test | Expected HTTP Status | Expected Behavior |
|------|---------------------|-------------------|
| Unauthorized chat read | 403 Forbidden | Access denied |
| Unauthorized group message | 403 Forbidden | Message rejected |
| Cross-user notification | 403 Forbidden | Modification blocked |
| Cross-tenant access | 403 Forbidden | Data isolation |
| Empty message | 400 Bad Request | Validation error |
| Message too long | 400 Bad Request | Validation error |
| Valid authorized request | 200 OK | Request succeeds |

---

## 🐛 Troubleshooting

### Issue: All tests return 401 Unauthorized
**Solution**: JWT token expired or invalid. Get fresh tokens.

### Issue: Tests return 500 Internal Server Error
**Solution**: Check backend logs. Likely missing indexes - run `mongodb-indexes.js`

### Issue: Authorized requests also returning 403
**Solution**:
1. Check TenantContext is set correctly
2. Verify userId in JWT matches database user ID
3. Check logs for specific authorization failure reason

### Issue: Performance tests show slow queries
**Solution**:
1. Verify indexes were created: `db.chat_messages.getIndexes()`
2. Check index is being used: `.explain("executionStats")`
3. Ensure enough test data exists (indexes work better with data)

---

## ✅ Sign-off Checklist

After completing all tests:

- [ ] All unauthorized access attempts return 403
- [ ] Input validation rejects invalid data (400)
- [ ] Authorized requests work correctly (200)
- [ ] Security violations are logged
- [ ] Query performance < 50ms (with indexes)
- [ ] No N+1 query issues observed
- [ ] Cross-tenant isolation verified
- [ ] WebSocket authorization working

---

**Ready for Production**: Yes ☐ No ☐

**Tested By**: _________________
**Date**: _________________
**Notes**: _________________

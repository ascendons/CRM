# User Duplicate Records - Fix Guide

**Date**: February 26, 2026
**Issue**: `IncorrectResultSizeDataAccessException` - Duplicate User records in database
**Status**: Fix implemented, requires database migration

---

## 🔴 Problem Summary

### Error Encountered
```
org.springframework.dao.IncorrectResultSizeDataAccessException:
Query { "userId" : "USR-2026-02-00001", "tenantId" : "699f33336b6fcb6d28b35747"}
returned non unique result
```

### Root Cause
The User entity had **incorrect unique index configuration** for a multi-tenant system:

**Before (INCORRECT):**
```java
@Indexed(unique = true)
private String userId;    // Unique GLOBALLY (across all tenants) ❌

@Indexed(unique = true)
private String username;  // Unique GLOBALLY ❌

@Indexed(unique = true)
private String email;     // Unique GLOBALLY ❌
```

**Problem:** In multi-tenancy, these fields should be unique **per tenant**, not globally!

This allowed duplicate User records to be created with the same `userId` in the same tenant, causing the query `findByUserIdAndTenantId` to return multiple results when it expects only one.

---

## ✅ Solution Implemented

### Code Changes

**After (CORRECT):**
```java
@CompoundIndexes({
    @CompoundIndex(name = "userId_tenantId_unique",
                   def = "{'userId': 1, 'tenantId': 1}", unique = true),
    @CompoundIndex(name = "username_tenantId_unique",
                   def = "{'username': 1, 'tenantId': 1}", unique = true),
    @CompoundIndex(name = "email_tenantId_unique",
                   def = "{'email': 1, 'tenantId': 1}", unique = true)
})
public class User {
    private String userId;      // Now unique PER tenant ✅
    private String username;    // Now unique PER tenant ✅
    private String email;       // Now unique PER tenant ✅
    private String tenantId;
}
```

**File Modified:** `backend/src/main/java/com/ultron/backend/domain/entity/User.java`

### What Changed
1. ✅ Removed single-field unique indexes (`userId`, `username`, `email`)
2. ✅ Added compound unique indexes (`userId + tenantId`, `username + tenantId`, `email + tenantId`)
3. ✅ Added performance indexes for common queries
4. ✅ Created MongoDB cleanup script to fix existing data

---

## 🚀 Migration Steps

### Prerequisites
- MongoDB access (shell or Compass)
- Backend application stopped
- Database backup (recommended)

### Step 1: Backup Database (Recommended)
```bash
mongodump --db crm --out /path/to/backup
```

### Step 2: Run Database Cleanup Script

**Option A: Using MongoDB Shell**
```bash
# Connect to MongoDB
mongosh mongodb://localhost:27017/crm

# Run the cleanup script
load('/Users/pankajthakur/IdeaProjects/CRM/fix-user-duplicates.js')
```

**Option B: Using MongoDB Compass**
1. Open MongoDB Compass
2. Connect to your database
3. Select the `crm` database
4. Open "Mongosh" tab at the bottom
5. Copy and paste the contents of `fix-user-duplicates.js`
6. Press Enter to execute

### What the Script Does
1. **Analyzes** - Finds all duplicate User records (same userId + tenantId)
2. **Removes** - Deletes duplicates, keeping the oldest record
3. **Drops** - Removes old incorrect unique indexes
4. **Creates** - Builds new compound unique indexes
5. **Verifies** - Confirms no duplicates remain

**Expected Output:**
```
================================================================================
STEP 1: Analyzing duplicate User records...
================================================================================
Found 1 sets of duplicate records

Duplicate records:
1. userId: USR-2026-02-00001, tenantId: 699f33336b6fcb6d28b35747
   Count: 2 records
   IDs: 6762a1b2c3d4e5f6a7b8c9d0, 6762a1b2c3d4e5f6a7b8c9d1

================================================================================
STEP 2: Removing duplicate records (keeping oldest)...
================================================================================
Deleting 1 duplicate(s) for userId: USR-2026-02-00001
  Deleted: 1 records

Total duplicate records removed: 1

================================================================================
STEP 3: Dropping old incorrect unique indexes...
================================================================================
✓ Dropped index: userId_1
✓ Dropped index: username_1
✓ Dropped index: email_1

================================================================================
STEP 4: Creating new compound unique indexes...
================================================================================
✓ Created index: userId_tenantId_unique
✓ Created index: username_tenantId_unique
✓ Created index: email_tenantId_unique
✓ Created index: tenantId_isDeleted
✓ Created index: tenantId_status_isDeleted

================================================================================
STEP 5: Verifying final state...
================================================================================
✓ No duplicate records found - All clean!

MIGRATION COMPLETE
```

### Step 3: Recompile Backend
```bash
cd backend
./mvnw clean compile
```

### Step 4: Start Application
```bash
./mvnw spring-boot:run
```

Spring Boot will automatically create the compound indexes defined in the `@CompoundIndexes` annotation on the User entity.

### Step 5: Verify Fix
Test the operation that was failing:
```bash
# Test lead assignment (the operation that was failing)
curl -X POST "http://localhost:8080/api/v1/leads/{leadId}/assign" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"userId": "USR-2026-02-00001"}'
```

**Expected:** Should work without `IncorrectResultSizeDataAccessException`

---

## 🔍 Verification Checklist

### Database Verification
```javascript
// Check for duplicates (should return 0)
db.users.aggregate([
    {
        $group: {
            _id: { userId: "$userId", tenantId: "$tenantId" },
            count: { $sum: 1 }
        }
    },
    {
        $match: { count: { $gt: 1 } }
    }
]).toArray().length

// Check indexes
db.users.getIndexes()
// Should see:
// - userId_tenantId_unique [UNIQUE]
// - username_tenantId_unique [UNIQUE]
// - email_tenantId_unique [UNIQUE]
```

### Application Verification
- [ ] Backend starts without errors
- [ ] User login works
- [ ] Lead assignment works (was failing before)
- [ ] User creation works
- [ ] No `IncorrectResultSizeDataAccessException` in logs

---

## 🐛 Troubleshooting

### Issue: Script fails with "duplicate key error"
**Cause:** Trying to create unique index but duplicates still exist
**Fix:**
1. Run Step 2 of the script again to remove duplicates
2. Manually review and fix any remaining duplicates
3. Re-run index creation

### Issue: "Cannot create index, index already exists"
**Solution:** This is normal - the script handles this gracefully
- If index exists and is correct: No action needed
- If index exists but is wrong: Drop it manually and re-run script

### Issue: Application still throws IncorrectResultSizeDataAccessException
**Fix:**
1. Verify duplicates are removed: Run verification query above
2. Check if correct indexes exist: Run `db.users.getIndexes()`
3. Restart application to reload schema
4. Check logs for index creation errors

---

## 📊 Impact Analysis

### Before Fix
- ❌ Duplicate User records possible (data integrity issue)
- ❌ Queries expecting single result throw exceptions
- ❌ Lead assignment fails
- ❌ Any operation using `findByUserIdAndTenantId` fails

### After Fix
- ✅ No duplicate Users per tenant (enforced by database)
- ✅ All queries return correct single results
- ✅ Lead assignment works
- ✅ Data integrity guaranteed by compound unique indexes
- ✅ Better query performance with proper indexes

---

## 🎯 Prevention

### For Future Development
1. **Always use compound indexes** for multi-tenant unique constraints
2. **Never use single-field unique indexes** on tenant-scoped data
3. **Test with multiple tenants** to catch multi-tenancy bugs early
4. **Review entity indexes** before deploying schema changes

### Monitoring
```bash
# Monitor for duplicate detection
tail -f logs/spring.log | grep "IncorrectResultSizeDataAccessException"

# Check user creation errors
tail -f logs/spring.log | grep "duplicate key error"
```

---

## 📝 Related Changes

### Modified Files
- `backend/src/main/java/com/ultron/backend/domain/entity/User.java`
  - Removed single-field unique indexes
  - Added compound unique indexes
  - Added performance indexes

### Created Files
- `fix-user-duplicates.js` - MongoDB cleanup script
- `USER_DUPLICATE_FIX.md` - This guide

---

## 🔗 Related Issues

This fix also prevents similar issues with:
- Username conflicts across tenants
- Email conflicts across tenants
- Any User-related unique constraint violations

---

## ✅ Success Criteria

- [x] User entity updated with compound indexes
- [ ] Database cleanup script executed successfully
- [ ] No duplicate User records in database
- [ ] Compound unique indexes created
- [ ] Old incorrect indexes dropped
- [ ] Application compiles successfully
- [ ] Application starts without errors
- [ ] Lead assignment works
- [ ] No `IncorrectResultSizeDataAccessException` errors

---

## 📞 Support

If issues persist after following this guide:

1. Check logs: `tail -f logs/spring.log | grep -i "user\|duplicate\|index"`
2. Verify indexes: Run `db.users.getIndexes()` in MongoDB
3. Check for duplicates: Run verification query above
4. Review entity annotations: Check `User.java` has `@CompoundIndexes`

---

**Fix Implemented By**: Claude Sonnet 4.5
**Date**: February 26, 2026
**Status**: Awaiting Database Migration
**Next Step**: Run `fix-user-duplicates.js` in MongoDB

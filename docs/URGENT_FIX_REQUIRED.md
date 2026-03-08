# 🔴 URGENT: Database Migration Required

**Date**: February 26, 2026
**Issue**: User duplicate records causing application errors
**Status**: Code fixed ✅ | Database migration pending ⏳

---

## Quick Summary

You have duplicate User records in your MongoDB database causing this error:
```
IncorrectResultSizeDataAccessException: Query returned non unique result
```

**Fix Status:**
- ✅ Code fixed (User entity updated with correct compound indexes)
- ✅ Backend compiled successfully
- ⏳ **Database cleanup required** (YOU MUST DO THIS)

---

## 🚨 What You Need To Do NOW

### 1. Run the Database Cleanup Script

**Using MongoDB Shell (mongosh):**
```bash
# Connect to your database
mongosh mongodb://localhost:27017/crm

# Run the cleanup script
load('/Users/pankajthakur/IdeaProjects/CRM/fix-user-duplicates.js')
```

**Using MongoDB Compass:**
1. Open MongoDB Compass
2. Connect to your database
3. Select `crm` database
4. Open "Mongosh" tab
5. Copy and paste contents from `fix-user-duplicates.js`
6. Press Enter

### 2. Restart Your Application
```bash
cd backend
./mvnw spring-boot:run
```

### 3. Test The Fix
Try the operation that was failing (lead assignment or whatever triggered the error).

---

## What the Script Does (in 30 seconds)

1. Finds duplicate User records (same userId + tenantId)
2. Keeps the oldest, deletes duplicates
3. Drops old incorrect indexes
4. Creates new correct compound indexes
5. Verifies everything is clean

**Safe to run:** The script only removes duplicates, keeping the original record.

---

## 📖 Full Documentation

See `USER_DUPLICATE_FIX.md` for:
- Detailed explanation of the problem
- Step-by-step migration guide
- Troubleshooting tips
- Verification steps

---

## ⚡ Quick Check - Do You Have Duplicates?

Run this in MongoDB to check:
```javascript
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
]).toArray()
```

If this returns anything, you have duplicates and MUST run the cleanup script.

---

## ❓ Why Did This Happen?

Your User entity had incorrect unique indexes:
- **Before:** `userId` unique globally (wrong for multi-tenant)
- **After:** `userId + tenantId` unique per tenant (correct)

This allowed duplicate users to be created in the same tenant.

---

## 🎯 Timeline

1. **Right Now**: Run `fix-user-duplicates.js` in MongoDB
2. **After Script**: Restart application
3. **Verify**: Test your application works
4. **Done**: Continue normal development

---

**Time Required**: 2-3 minutes total

**Risk Level**: Low (script keeps oldest record, removes only duplicates)

**Urgency**: HIGH (your application will continue to fail until this is done)

---

Run the script now and you'll be back in business! 🚀

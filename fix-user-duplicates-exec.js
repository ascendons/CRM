/**
 * MongoDB Script: Fix User Duplicate Records (Executable Version)
 *
 * This script removes duplicate users and fixes indexes
 */

// Use the database (JavaScript syntax for mongosh --file)
db = db.getSiblingDB('crm_db');

print("=".repeat(80));
print("STEP 1: Analyzing duplicate User records...");
print("=".repeat(80));

// Find duplicates based on userId + tenantId
const duplicates = db.users.aggregate([
    {
        $match: {
            userId: { $exists: true },
            tenantId: { $exists: true }
        }
    },
    {
        $group: {
            _id: { userId: "$userId", tenantId: "$tenantId" },
            count: { $sum: 1 },
            ids: { $push: "$_id" },
            docs: { $push: "$$ROOT" }
        }
    },
    {
        $match: {
            count: { $gt: 1 }
        }
    }
]).toArray();

print(`Found ${duplicates.length} sets of duplicate records`);

if (duplicates.length > 0) {
    print("\nDuplicate records:");
    duplicates.forEach((dup, index) => {
        print(`\n${index + 1}. userId: ${dup._id.userId}, tenantId: ${dup._id.tenantId}`);
        print(`   Count: ${dup.count} records`);
        print(`   IDs: ${dup.ids.join(", ")}`);
    });
}

print("\n" + "=".repeat(80));
print("STEP 2: Removing duplicate records (keeping oldest)...");
print("=".repeat(80));

let removedCount = 0;
duplicates.forEach((dup) => {
    // Sort by createdAt to keep the oldest record
    const sorted = dup.docs.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
        const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
        return dateA - dateB;
    });

    // Keep the first (oldest), delete the rest
    const toDelete = sorted.slice(1).map(doc => doc._id);

    if (toDelete.length > 0) {
        print(`\nDeleting ${toDelete.length} duplicate(s) for userId: ${dup._id.userId}`);
        const result = db.users.deleteMany({ _id: { $in: toDelete } });
        removedCount += result.deletedCount;
        print(`  Deleted: ${result.deletedCount} records`);
    }
});

print(`\nTotal duplicate records removed: ${removedCount}`);

print("\n" + "=".repeat(80));
print("STEP 3: Dropping old incorrect unique indexes...");
print("=".repeat(80));

// List current indexes
print("\nCurrent indexes:");
db.users.getIndexes().forEach(idx => {
    print(`  - ${idx.name}: ${JSON.stringify(idx.key)}`);
});

// Drop old single-field unique indexes if they exist
const indexesToDrop = [
    "userId_1",          // Old unique index on userId alone
    "username_1",        // Old unique index on username alone
    "email_1"            // Old unique index on email alone
];

indexesToDrop.forEach(indexName => {
    try {
        db.users.dropIndex(indexName);
        print(`✓ Dropped index: ${indexName}`);
    } catch (e) {
        print(`✗ Index ${indexName} not found or already dropped`);
    }
});

print("\n" + "=".repeat(80));
print("STEP 4: Creating new compound unique indexes...");
print("=".repeat(80));

// Create compound unique indexes for multi-tenancy
const newIndexes = [
    {
        name: "userId_tenantId_unique",
        key: { userId: 1, tenantId: 1 },
        unique: true,
        background: true
    },
    {
        name: "username_tenantId_unique",
        key: { username: 1, tenantId: 1 },
        unique: true,
        background: true
    },
    {
        name: "email_tenantId_unique",
        key: { email: 1, tenantId: 1 },
        unique: true,
        background: true
    },
    {
        name: "tenantId_isDeleted",
        key: { tenantId: 1, isDeleted: 1 },
        background: true
    },
    {
        name: "tenantId_status_isDeleted",
        key: { tenantId: 1, status: 1, isDeleted: 1 },
        background: true
    }
];

newIndexes.forEach(index => {
    try {
        db.users.createIndex(index.key, {
            name: index.name,
            unique: index.unique || false,
            background: index.background || true
        });
        print(`✓ Created index: ${index.name}`);
    } catch (e) {
        if (e.code === 85) {
            print(`ℹ Index ${index.name} already exists`);
        } else {
            print(`✗ Failed to create index ${index.name}: ${e.message}`);
        }
    }
});

print("\n" + "=".repeat(80));
print("STEP 5: Verifying final state...");
print("=".repeat(80));

// Check for remaining duplicates
const remainingDuplicates = db.users.aggregate([
    {
        $match: {
            userId: { $exists: true },
            tenantId: { $exists: true }
        }
    },
    {
        $group: {
            _id: { userId: "$userId", tenantId: "$tenantId" },
            count: { $sum: 1 }
        }
    },
    {
        $match: {
            count: { $gt: 1 }
        }
    }
]).toArray();

if (remainingDuplicates.length === 0) {
    print("✓ No duplicate records found - All clean!");
} else {
    print(`✗ WARNING: ${remainingDuplicates.length} duplicate sets still exist!`);
    print("  Please review and fix manually.");
}

// List final indexes
print("\nFinal indexes:");
db.users.getIndexes().forEach(idx => {
    const uniqueFlag = idx.unique ? " [UNIQUE]" : "";
    print(`  - ${idx.name}: ${JSON.stringify(idx.key)}${uniqueFlag}`);
});

// Count total users
const totalUsers = db.users.countDocuments({});
print(`\nTotal users in collection: ${totalUsers}`);

print("\n" + "=".repeat(80));
print("MIGRATION COMPLETE");
print("=".repeat(80));
print("\nNext steps:");
print("1. Restart your Spring Boot application");
print("2. Spring will auto-create compound indexes from @CompoundIndexes annotation");
print("3. Test user operations (create, login, assign leads, etc.)");
print("4. Monitor logs for any 'IncorrectResultSizeDataAccessException' errors");
print("\nIf you see the error again, check for remaining duplicates in MongoDB.");
print("=".repeat(80));

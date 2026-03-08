// MongoDB script to fix duplicate attendance records
// Run this with: mongosh crm_db fix-attendance-duplicates.js

print("Starting attendance duplicate cleanup...");

// Connect to the database
const db = db.getSiblingDB('crm_db');

// Find duplicates
const duplicates = db.attendances.aggregate([
    {
        $match: {
            attendanceId: { $exists: true, $ne: null }
        }
    },
    {
        $group: {
            _id: { attendanceId: "$attendanceId", tenantId: "$tenantId" },
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

print(`Found ${duplicates.length} duplicate attendanceId groups`);

// Process each duplicate group
let removedCount = 0;
duplicates.forEach(dup => {
    print(`\nProcessing duplicates for attendanceId: ${dup._id.attendanceId}, tenantId: ${dup._id.tenantId}`);
    print(`  Found ${dup.count} records`);

    // Sort by creation date to keep the oldest one (or most complete one)
    const sorted = dup.docs.sort((a, b) => {
        // Keep the one with checkOutTime if only one has it
        if (a.checkOutTime && !b.checkOutTime) return -1;
        if (!a.checkOutTime && b.checkOutTime) return 1;

        // Otherwise keep the oldest by createdAt
        if (a.createdAt && b.createdAt) {
            return new Date(a.createdAt) - new Date(b.createdAt);
        }
        return 0;
    });

    // Keep the first one, remove the rest
    const keepId = sorted[0]._id;
    print(`  Keeping record with _id: ${keepId}`);

    for (let i = 1; i < sorted.length; i++) {
        const removeId = sorted[i]._id;
        print(`  Removing duplicate with _id: ${removeId}`);
        db.attendances.deleteOne({ _id: removeId });
        removedCount++;
    }
});

print(`\n--- Cleanup Summary ---`);
print(`Removed ${removedCount} duplicate records`);

// Verify duplicates are gone
const remaining = db.attendances.aggregate([
    {
        $group: {
            _id: { attendanceId: "$attendanceId", tenantId: "$tenantId" },
            count: { $sum: 1 }
        }
    },
    {
        $match: {
            count: { $gt: 1 }
        }
    }
]).toArray();

if (remaining.length === 0) {
    print("✓ All duplicates removed successfully");
} else {
    print(`⚠ Warning: ${remaining.length} duplicate groups still exist`);
}

// Drop and recreate the unique index
print("\n--- Recreating Unique Index ---");

try {
    // Drop existing index if it exists
    db.attendances.dropIndex("attendanceId_tenantId_unique");
    print("✓ Dropped old index");
} catch (e) {
    print("ℹ No existing index to drop");
}

// Create unique compound index
db.attendances.createIndex(
    { attendanceId: 1, tenantId: 1 },
    {
        name: "attendanceId_tenantId_unique",
        unique: true,
        background: false
    }
);

print("✓ Created unique compound index on (attendanceId, tenantId)");

// Verify index creation
const indexes = db.attendances.getIndexes();
const uniqueIndex = indexes.find(idx => idx.name === "attendanceId_tenantId_unique");

if (uniqueIndex && uniqueIndex.unique) {
    print("✓ Unique index verified successfully");
    print(`  Index definition: ${JSON.stringify(uniqueIndex.key)}`);
} else {
    print("⚠ Warning: Unique index not found or not unique");
}

print("\n--- Attendance Statistics ---");
print(`Total attendance records: ${db.attendances.countDocuments({})}`);
print(`Records with attendanceId: ${db.attendances.countDocuments({ attendanceId: { $exists: true, $ne: null }})}`);

print("\nCleanup complete!");

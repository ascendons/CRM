/**
 * Debug Script: Check Notification System
 * Run this in MongoDB to diagnose notification issues
 */

db = db.getSiblingDB('crm_db');

print("=".repeat(80));
print("NOTIFICATION SYSTEM DIAGNOSTICS");
print("=".repeat(80));

// 1. Check all users
print("\n1. ALL USERS IN DATABASE:");
print("-".repeat(80));
const users = db.users.find({}, {
    _id: 1,
    userId: 1,
    username: 1,
    email: 1,
    tenantId: 1,
    'profile.fullName': 1
}).toArray();

users.forEach((user, index) => {
    print(`\nUser ${index + 1}:`);
    print(`  MongoDB _id: ${user._id}`);
    print(`  Business userId: ${user.userId || 'N/A'}`);
    print(`  Username: ${user.username}`);
    print(`  Email: ${user.email}`);
    print(`  Full Name: ${user.profile?.fullName || 'N/A'}`);
    print(`  Tenant ID: ${user.tenantId}`);
});

print(`\nTotal users: ${users.length}`);

// 2. Check recent leads
print("\n" + "=".repeat(80));
print("2. RECENT LEADS (Last 5):");
print("-".repeat(80));
const leads = db.leads.find({}).sort({createdAt: -1}).limit(5).toArray();

leads.forEach((lead, index) => {
    print(`\nLead ${index + 1}:`);
    print(`  Lead ID: ${lead.leadId}`);
    print(`  Name: ${lead.firstName} ${lead.lastName}`);
    print(`  Company: ${lead.companyName}`);
    print(`  Owner ID: ${lead.leadOwnerId}`);
    print(`  Status: ${lead.leadStatus}`);
    print(`  Created: ${lead.createdAt}`);

    // Find owner details
    const owner = db.users.findOne({_id: ObjectId(lead.leadOwnerId)});
    if (owner) {
        print(`  Owner Details:`);
        print(`    - MongoDB _id: ${owner._id}`);
        print(`    - Business userId: ${owner.userId || 'N/A'}`);
        print(`    - Email: ${owner.email}`);
    } else {
        print(`  ⚠️  Owner NOT FOUND for ID: ${lead.leadOwnerId}`);
    }
});

// 3. Check all notifications
print("\n" + "=".repeat(80));
print("3. ALL NOTIFICATIONS (Last 10):");
print("-".repeat(80));
const notifications = db.notifications.find({}).sort({createdAt: -1}).limit(10).toArray();

if (notifications.length === 0) {
    print("\n⚠️  NO NOTIFICATIONS FOUND IN DATABASE!");
    print("   This means notifications are not being created at all.");
} else {
    notifications.forEach((notif, index) => {
        print(`\nNotification ${index + 1}:`);
        print(`  ID: ${notif._id}`);
        print(`  Target User ID: ${notif.targetUserId}`);
        print(`  Title: ${notif.title}`);
        print(`  Message: ${notif.message}`);
        print(`  Type: ${notif.type}`);
        print(`  Action URL: ${notif.actionUrl}`);
        print(`  Is Read: ${notif.isRead}`);
        print(`  Created: ${notif.createdAt}`);

        // Find target user
        const targetUser = db.users.findOne({_id: ObjectId(notif.targetUserId)});
        if (targetUser) {
            print(`  Target User:`);
            print(`    - Business userId: ${targetUser.userId}`);
            print(`    - Email: ${targetUser.email}`);
            print(`    - Full Name: ${targetUser.profile?.fullName || 'N/A'}`);
        } else {
            print(`  ⚠️  Target user NOT FOUND for ID: ${notif.targetUserId}`);
        }
    });
}

print(`\nTotal notifications: ${db.notifications.countDocuments({})}`);

// 4. Check for "user 3" specifically
print("\n" + "=".repeat(80));
print("4. LOOKING FOR 'USER 3':");
print("-".repeat(80));

const user3Candidates = db.users.find({
    $or: [
        { username: /3/i },
        { email: /3/i },
        { 'profile.fullName': /user.*3/i },
        { 'profile.fullName': /3/i }
    ]
}).toArray();

if (user3Candidates.length === 0) {
    print("\n⚠️  No user matching 'user 3' found!");
} else {
    print(`\nFound ${user3Candidates.length} potential 'user 3' candidate(s):`);
    user3Candidates.forEach((user, index) => {
        print(`\nCandidate ${index + 1}:`);
        print(`  MongoDB _id: ${user._id}`);
        print(`  Business userId: ${user.userId}`);
        print(`  Username: ${user.username}`);
        print(`  Email: ${user.email}`);
        print(`  Full Name: ${user.profile?.fullName || 'N/A'}`);

        // Check if this user has any notifications
        const userNotifications = db.notifications.find({targetUserId: user._id.toString()}).toArray();
        print(`  Notifications for this user: ${userNotifications.length}`);
        if (userNotifications.length > 0) {
            userNotifications.forEach(n => {
                print(`    - ${n.title} (${n.isRead ? 'read' : 'unread'})`);
            });
        }
    });
}

// 5. Check notification counts by user
print("\n" + "=".repeat(80));
print("5. NOTIFICATION COUNT BY USER:");
print("-".repeat(80));

const notifCounts = db.notifications.aggregate([
    {
        $group: {
            _id: "$targetUserId",
            total: { $sum: 1 },
            unread: { $sum: { $cond: ["$isRead", 0, 1] } }
        }
    }
]).toArray();

if (notifCounts.length === 0) {
    print("\n⚠️  No notifications in database");
} else {
    notifCounts.forEach(count => {
        const user = db.users.findOne({_id: ObjectId(count._id)});
        print(`\nUser: ${user?.email || count._id}`);
        print(`  Total: ${count.total}, Unread: ${count.unread}`);
    });
}

print("\n" + "=".repeat(80));
print("DIAGNOSTICS COMPLETE");
print("=".repeat(80));

// Key findings
print("\n📊 KEY FINDINGS:");
print("-".repeat(80));

if (db.notifications.countDocuments({}) === 0) {
    print("❌ NO NOTIFICATIONS EXIST - Backend is not creating notifications!");
    print("   → Check backend logs for errors");
    print("   → Check if NotificationService is being called");
} else {
    print(`✓ ${db.notifications.countDocuments({})} notifications exist in database`);
}

if (users.length === 0) {
    print("❌ NO USERS FOUND - Database is empty!");
} else {
    print(`✓ ${users.length} users found`);
}

const user3Match = db.users.findOne({
    $or: [
        { 'profile.fullName': /user.*3/i },
        { username: /user.*3/i },
        { email: /user3/i }
    ]
});

if (user3Match) {
    print(`✓ User 3 found: ${user3Match.email}`);
    print(`  MongoDB _id: ${user3Match._id}`);
    print(`  Business userId: ${user3Match.userId}`);

    const user3Notifs = db.notifications.find({targetUserId: user3Match._id.toString()}).toArray();
    if (user3Notifs.length === 0) {
        print(`❌ User 3 has NO notifications in database`);
        print(`   → Notification not being sent to correct user ID`);
        print(`   → Check lead.leadOwnerId matches user 3's MongoDB _id`);
    } else {
        print(`✓ User 3 has ${user3Notifs.length} notification(s)`);
    }
} else {
    print("❌ Could not identify 'user 3' - please check username/email");
}

print("\n" + "=".repeat(80));

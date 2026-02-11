#!/bin/bash

echo "========================================="
echo "Complete User Fix - Roles & Profiles"
echo "========================================="
echo ""

# Get all users
mongosh crm_db --quiet --eval '
print("Fixing all users...\n");

db.users.find({}).forEach(function(user) {
    print("Processing: " + user.email);
    print("  Current - roleId: " + user.roleId + ", profileId: " + user.profileId);
    print("  TenantId: " + user.tenantId);

    var needsUpdate = false;
    var updates = {};

    // Find admin role for this tenant
    var adminRole = db.roles.findOne({
        tenantId: user.tenantId,
        roleName: "System Administrator",
        isDeleted: false
    });

    // Find admin profile for this tenant
    var adminProfile = db.profiles.findOne({
        tenantId: user.tenantId,
        profileName: "System Administrator",
        isDeleted: false
    });

    // Check and fix roleId
    if (!user.roleId || user.roleId === "" || !db.roles.findOne({roleId: user.roleId, tenantId: user.tenantId})) {
        if (adminRole) {
            updates.roleId = adminRole.roleId;
            updates.roleName = adminRole.roleName;
            needsUpdate = true;
            print("  → Will set roleId: " + adminRole.roleId);
        } else {
            print("  ✗ ERROR: No admin role found for tenant!");
        }
    } else {
        print("  ✓ roleId is valid");
    }

    // Check and fix profileId
    if (!user.profileId || user.profileId === "" || !db.profiles.findOne({profileId: user.profileId, tenantId: user.tenantId})) {
        if (adminProfile) {
            updates.profileId = adminProfile.profileId;
            updates.profileName = adminProfile.profileName;
            needsUpdate = true;
            print("  → Will set profileId: " + adminProfile.profileId);
        } else {
            print("  ✗ ERROR: No admin profile found for tenant!");
        }
    } else {
        print("  ✓ profileId is valid");
    }

    // Apply updates
    if (needsUpdate) {
        db.users.updateOne(
            {_id: user._id},
            {$set: updates}
        );
        print("  ✅ Updated successfully\n");
    } else {
        print("  ✓ No updates needed\n");
    }
});

print("\n========================================");
print("Verification");
print("========================================\n");

// Verify all users have valid assignments
db.users.find({}).forEach(function(user) {
    var role = db.roles.findOne({roleId: user.roleId, tenantId: user.tenantId});
    var profile = db.profiles.findOne({profileId: user.profileId, tenantId: user.tenantId});

    var roleStatus = role ? "✓" : "✗";
    var profileStatus = profile ? "✓" : "✗";

    print(user.email);
    print("  Role:    " + roleStatus + " " + user.roleId);
    print("  Profile: " + profileStatus + " " + user.profileId);

    if (!role || !profile) {
        print("  ⚠️  WARNING: Missing role or profile!");
    }
    print("");
});
'

echo ""
echo "========================================="
echo "✅ Fix Complete!"
echo "========================================="
echo ""
echo "Next steps:"
echo "1. Logout from the application"
echo "2. Clear browser cache: localStorage.clear(); location.reload();"
echo "3. Login again to get fresh JWT token"
echo "4. Dashboard should now load without errors"
echo ""

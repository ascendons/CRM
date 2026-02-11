var tenantId = "698c939796c192e9e74e4f64";
var systemRoles = db.roles.find({ isSystemRole: true }).toArray();

print("Found " + systemRoles.length + " system roles.");

systemRoles.forEach(function (sysRole) {
    var existingRole = db.roles.findOne({ tenantId: tenantId, roleName: sysRole.roleName });
    if (existingRole) {
        print("Role already exists: " + sysRole.roleName + " (" + existingRole.roleId + ")");
        return;
    }

    // Create if missing (shouldn't happen now but good safety)
    var newRoleId = "ROLE-" + new Date().getTime().toString().substring(6) + "-" + Math.floor(Math.random() * 10000);
    var tenantRole = {
        roleId: newRoleId,
        tenantId: tenantId,
        isSystemRole: false,
        roleName: sysRole.roleName,
        description: sysRole.description,
        parentRoleId: sysRole.parentRoleId,
        parentRoleName: sysRole.parentRoleName,
        level: sysRole.level,
        childRoleIds: sysRole.childRoleIds || [],
        modulePermissions: sysRole.modulePermissions || [],
        permissions: sysRole.permissions,
        isActive: true,
        isDeleted: false,
        createdAt: new Date(),
        createdBy: "SYSTEM_MIGRATION"
    };
    db.roles.insertOne(tenantRole);
    print("Created: " + tenantRole.roleName + " - " + newRoleId);
});

// Force assign admin role to ALL users in this tenant to fix the issue
var adminRole = db.roles.findOne({ tenantId: tenantId, roleName: "System Administrator" });
if (adminRole) {
    var updateResult = db.users.updateMany(
        { tenantId: tenantId },
        { $set: { roleId: adminRole.roleId, roleName: adminRole.roleName } }
    );
    print("Forced update of " + updateResult.modifiedCount + " users to Admin role.");
} else {
    print("Admin role not found for tenant " + tenantId);
}

// Verify users
db.users.find({ tenantId: tenantId }, { email: 1, roleName: 1, roleId: 1, _id: 0 }).forEach(u => print(u.email, "-", u.roleName));

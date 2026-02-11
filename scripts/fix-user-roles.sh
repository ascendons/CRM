#!/bin/bash

# RBAC Migration - Fix User Roles Script
# This script seeds roles for existing tenants and assigns users to correct roles

echo "========================================="
echo "RBAC Migration - User Role Assignment"
echo "========================================="
echo ""

# Get all tenant IDs
echo "Step 1: Finding all organizations..."
TENANTS=$(mongosh crm_db --quiet --eval 'db.organizations.find({}, {_id:1}).toArray().map(org => org._id.toString()).join("\n")' 2>/dev/null)

if [ -z "$TENANTS" ]; then
    echo "❌ No organizations found. Please ensure MongoDB is running and crm_db exists."
    exit 1
fi

echo "✅ Found organizations:"
echo "$TENANTS" | nl
echo ""

# For each tenant, seed roles
echo "Step 2: Seeding roles for each tenant..."
echo ""

for TENANT_ID in $TENANTS; do
    echo "Processing Tenant: $TENANT_ID"
    echo "-------------------------------------------"

    # Check if tenant already has roles
    ROLE_COUNT=$(mongosh crm_db --quiet --eval "db.roles.countDocuments({tenantId: '$TENANT_ID'})" 2>/dev/null)

    if [ "$ROLE_COUNT" -gt 0 ]; then
        echo "  ℹ️  Tenant already has $ROLE_COUNT roles. Skipping seed."
    else
        echo "  🔄 Seeding roles for tenant..."

        # Seed roles from system templates
        mongosh crm_db --quiet --eval "
        var tenantId = '$TENANT_ID';
        var systemRoles = db.roles.find({isSystemRole: true}).toArray();
        var createdCount = 0;

        systemRoles.forEach(function(sysRole) {
            var newRoleId = 'ROLE-' + new Date().getTime().toString().substring(6) + '-' + Math.floor(Math.random() * 10000);

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
                createdBy: 'SYSTEM_MIGRATION',
                createdByName: 'System Migration Script'
            };

            db.roles.insertOne(tenantRole);
            createdCount++;
            print('    ✅ Created: ' + tenantRole.roleName + ' (' + newRoleId + ')');
        });

        print('  📊 Total roles created: ' + createdCount);
        " 2>/dev/null

        echo "  ✅ Roles seeded successfully"
    fi

    # Assign admin role to users without roleId
    echo "  🔄 Assigning roles to users..."

    mongosh crm_db --quiet --eval "
    var tenantId = '$TENANT_ID';
    var adminRole = db.roles.findOne({tenantId: tenantId, roleName: 'System Administrator'});

    if (!adminRole) {
        print('    ❌ ERROR: System Administrator role not found for this tenant');
    } else {
        var usersWithoutRole = db.users.find({
            tenantId: tenantId,
            \$or: [
                {roleId: {$exists: false}},
                {roleId: null},
                {roleId: ''}
            ]
        }).toArray();

        if (usersWithoutRole.length === 0) {
            print('    ℹ️  All users already have roles assigned');
        } else {
            var result = db.users.updateMany(
                {
                    tenantId: tenantId,
                    \$or: [
                        {roleId: {$exists: false}},
                        {roleId: null},
                        {roleId: ''}
                    ]
                },
                {
                    \$set: {
                        roleId: adminRole.roleId,
                        roleName: adminRole.roleName
                    }
                }
            );

            print('    ✅ Updated ' + result.modifiedCount + ' user(s) with System Administrator role');
            usersWithoutRole.forEach(function(user) {
                print('       - ' + user.email);
            });
        }
    }
    " 2>/dev/null

    echo ""
done

echo "========================================="
echo "Step 3: Verification"
echo "========================================="
echo ""

# Verify all users have valid roleIds
echo "Checking for users with invalid roles..."
mongosh crm_db --quiet --eval "
var usersWithoutRoles = db.users.aggregate([
    {
        \$lookup: {
            from: 'roles',
            let: { userRoleId: '\$roleId', userTenantId: '\$tenantId' },
            pipeline: [
                {
                    \$match: {
                        \$expr: {
                            \$and: [
                                { \$eq: ['\$roleId', '\$\$userRoleId'] },
                                { \$eq: ['\$tenantId', '\$\$userTenantId'] }
                            ]
                        }
                    }
                }
            ],
            as: 'role'
        }
    },
    {
        \$match: {
            role: { \$size: 0 }
        }
    },
    {
        \$project: {
            email: 1,
            roleId: 1,
            tenantId: 1,
            _id: 0
        }
    }
]).toArray();

if (usersWithoutRoles.length === 0) {
    print('✅ All users have valid role assignments');
} else {
    print('❌ Found ' + usersWithoutRoles.length + ' user(s) with invalid roles:');
    usersWithoutRoles.forEach(function(user) {
        print('   - ' + user.email + ' (roleId: ' + user.roleId + ')');
    });
}
" 2>/dev/null

echo ""

# Summary
echo "========================================="
echo "Migration Summary"
echo "========================================="
mongosh crm_db --quiet --eval "
print('System Roles:', db.roles.countDocuments({isSystemRole: true}));
print('Tenant Roles:', db.roles.countDocuments({isSystemRole: false}));
print('Total Users:', db.users.countDocuments({}));
print('');
print('Roles per Tenant:');
db.roles.aggregate([
    { \$match: { isSystemRole: false, isDeleted: false } },
    { \$group: { _id: '\$tenantId', count: { \$sum: 1 } } },
    { \$sort: { _id: 1 } }
]).forEach(function(result) {
    print('  Tenant ' + result._id + ': ' + result.count + ' roles');
});
" 2>/dev/null

echo ""
echo "========================================="
echo "✅ Migration Complete!"
echo "========================================="
echo ""
echo "Next steps:"
echo "1. Restart the backend if it's running"
echo "2. Clear browser cache (localStorage.clear())"
echo "3. Login again to get fresh JWT token"
echo "4. Start testing with RBAC_TESTING_GUIDE.md"
echo ""

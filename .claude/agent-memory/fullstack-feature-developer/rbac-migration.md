---
name: RBAC Migration Pattern
description: How to add new modules and permissions when creating new CRM feature modules
type: project
---

## Adding New RBAC Module

### 1. RoleMigrationService.java (`service/RoleMigrationService.java`)
In `patchMissingModules()`, add a block:
```java
boolean myModuleExists = modules.stream()
    .anyMatch(m -> m.getModuleName().equalsIgnoreCase("MY_MODULE"));
if (!myModuleExists) {
    modules.add(Role.ModulePermission.builder()
        .moduleName("MY_MODULE")
        .displayName("My Module")
        .canAccess(true)
        .includedPaths(Arrays.asList("/my-module/**"))
        .description("Description of the module")
        .build());
    modified = true;
}
```

### 2. ProfileMigrationService.java (`service/ProfileMigrationService.java`)
In `patchMissingPermissions()`, add `"MY_MODULE"` to the `fieldServiceObjects` list.

### 3. Sidebar.tsx (`frontend/app/components/Sidebar.tsx`)
Add a NavSection with the module key matching exactly:
```tsx
{ href: "/my-module", label: "My Module", icon: "icon_name", module: "MY_MODULE" }
```

## Permission Keys Used
- `VIEW`, `CREATE`, `EDIT`, `DELETE` — standard set
- `MANAGE_MEMBERS` — used in PROJECTS
- `PUBLISH` — used in KNOWLEDGE_BASE
- `WEB_FORMS` module uses standard 4 permissions

## Implemented Modules (P1-P6)
- `PROJECTS` — `/projects/**`, `/timesheets/**`
- `KNOWLEDGE_BASE` — `/knowledge-base/**`
- `WEB_FORMS` — `/marketing/**`

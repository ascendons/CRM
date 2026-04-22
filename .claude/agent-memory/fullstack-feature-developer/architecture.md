---
name: CRM Project Architecture
description: Core stack, conventions, and key file locations for the Ascendons CRM project
type: project
---

## Stack
- Backend: Java 17 + Spring Boot 3.4.2, Maven, port 8080, context-path `/api/v1`
- Frontend: Next.js App Router + TypeScript, port 3000
- DB: MongoDB (`crm_db`), multi-tenant via TenantContext
- Auth: JWT, SecurityConfig at `backend/src/main/java/com/ultron/backend/security/SecurityConfig.java`

## Backend Conventions
- All entities: `tenantId`, `isDeleted` (boolean or Boolean), `createdAt`, `createdBy`, `updatedAt`, `updatedBy`
- Services extend `BaseTenantService`, call `getCurrentTenantId()` not `TenantContext.getTenantId()` directly
- Controllers: `@RequestMapping("/path")`, `@PreAuthorize("hasPermission('MODULE', 'ACTION')")`, `getCurrentUserId()` via `SecurityContextHolder.getContext().getAuthentication().getName()`
- ID generators use timestamp: `"PREFIX-" + System.currentTimeMillis()`
- Public endpoints need explicit `permitAll()` in SecurityConfig (e.g., `/forms/*/submit`, `/landing-pages/public/**`)
- `ApiResponse<T>` is the standard wrapper with `ApiResponse.success(message, data)`

## Frontend Conventions
- API client: `import { api } from '@/lib/api-client'` — has `api.get`, `api.post`, `api.put`, `api.delete`, `api.patch`
- Toast: `import { showToast } from '@/lib/toast'` — `showToast("message", "success"|"error")`
- All pages are `"use client"` components
- No external UI library beyond lucide-react icons
- Sidebar module keys must match backend RBAC module names exactly

## Key Paths
- Backend entities: `backend/src/main/java/com/ultron/backend/domain/entity/`
- Backend enums: `backend/src/main/java/com/ultron/backend/domain/enums/`
- Backend services: `backend/src/main/java/com/ultron/backend/service/`
- Backend controllers: `backend/src/main/java/com/ultron/backend/controller/`
- Backend repositories: `backend/src/main/java/com/ultron/backend/repository/`
- Frontend pages: `frontend/app/`
- Frontend lib services: `frontend/lib/`
- Sidebar: `frontend/app/components/Sidebar.tsx`

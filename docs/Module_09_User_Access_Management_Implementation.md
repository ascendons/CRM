# Module 9: User & Access Management - Implementation Guide

**Version:** 1.0
**Last Updated:** January 2026
**Status:** Ready for Implementation

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Database Schema](#database-schema)
4. [Implementation Roadmap](#implementation-roadmap)
5. [9.1 User Management](#91-user-management)
6. [9.2 Roles & Profiles](#92-roles--profiles)
7. [9.3 Sharing & Visibility](#93-sharing--visibility)
8. [9.4 Field-Level Security](#94-field-level-security)
9. [9.5 Security Features](#95-security-features)
10. [API Specifications](#api-specifications)
11. [Frontend Components](#frontend-components)
12. [Testing Strategy](#testing-strategy)
13. [Security Considerations](#security-considerations)
14. [Performance Optimization](#performance-optimization)
15. [Deployment & Migration](#deployment--migration)

---

## Overview

### Purpose

Module 9 implements a comprehensive **Role-Based Access Control (RBAC)** system with advanced security features for the CRM application. It provides:

- Fine-grained permission management
- Hierarchical role structures
- Data visibility controls
- Field-level security
- Audit logging
- Session management

### Key Features

| Feature | Description | Priority |
|---------|-------------|----------|
| User Management | Create, update, deactivate users | P0 (Critical) |
| Roles & Hierarchy | Define organizational structure | P0 (Critical) |
| Profiles & Permissions | Control what users can do | P0 (Critical) |
| Sharing Rules | Share data beyond hierarchy | P1 (High) |
| Field-Level Security | Hide sensitive fields | P1 (High) |
| Audit Trail | Track all changes | P1 (High) |
| IP Restrictions | Whitelist trusted IPs | P2 (Medium) |
| Session Management | Control user sessions | P1 (High) |
| Field History Tracking | Track field changes | P2 (Medium) |

### Success Metrics

- **Security**: Zero unauthorized access incidents
- **Performance**: Permission checks < 50ms (p95)
- **Adoption**: 100% of users assigned correct roles/profiles
- **Audit**: 100% of security events logged
- **Uptime**: 99.9% availability for authentication

---

## Architecture

### High-Level Design

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend Layer                        │
├─────────────────────────────────────────────────────────────┤
│  User Management UI  │  Role Builder  │  Security Settings  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     API Gateway Layer                        │
├─────────────────────────────────────────────────────────────┤
│  Authentication  │  Authorization  │  Rate Limiting         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Business Logic Layer                      │
├─────────────────────────────────────────────────────────────┤
│  UserService  │  RoleService  │  PermissionService          │
│  SharingService  │  AuditService  │  SecurityService        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Data Access Layer                       │
├─────────────────────────────────────────────────────────────┤
│  UserRepository  │  RoleRepository  │  PermissionRepository │
│  SharingRepository  │  AuditRepository                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Database Layer                          │
├─────────────────────────────────────────────────────────────┤
│  MongoDB (Primary)  │  Redis (Cache)  │  S3 (Audit Logs)   │
└─────────────────────────────────────────────────────────────┘
```

### Component Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                         Authentication                            │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────┐   │
│  │   Login     │  │   JWT Token  │  │  Session Manager    │   │
│  │   Service   │→ │   Service    │→ │  (Redis Cache)      │   │
│  └─────────────┘  └──────────────┘  └─────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                         Authorization                             │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────┐   │
│  │ Permission  │  │   Role       │  │   Sharing           │   │
│  │ Evaluator   │→ │   Hierarchy  │→ │   Rule Engine       │   │
│  └─────────────┘  └──────────────┘  └─────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                       Security & Audit                            │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────┐   │
│  │   Audit     │  │   IP         │  │   Field History     │   │
│  │   Logger    │  │   Validator  │  │   Tracker           │   │
│  └─────────────┘  └──────────────┘  └─────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

### Technology Stack

**Backend:**
- **Framework**: Spring Boot 4.1.0-M1
- **Language**: Java 17+
- **Security**: Spring Security 6.x
- **Authentication**: JWT (JSON Web Tokens)
- **Database**: MongoDB 5.0+
- **Cache**: Redis 7.x
- **Validation**: Jakarta Validation

**Frontend:**
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript 5.x
- **UI Library**: React 19
- **Styling**: Tailwind CSS 4.x
- **State**: React Context + Hooks

---

## Database Schema

### Core Collections

#### **1. users**

```json
{
  "_id": ObjectId("..."),
  "userId": "USR-000001",
  "username": "john.smith",
  "email": "john.smith@company.com",
  "passwordHash": "$2a$10$...",
  "passwordLastChanged": ISODate("2026-01-15T10:00:00Z"),
  "passwordExpiresAt": ISODate("2026-04-15T10:00:00Z"),

  "profile": {
    "firstName": "John",
    "lastName": "Smith",
    "fullName": "John Smith",
    "title": "Sales Manager",
    "department": "Sales",
    "phone": "+91 98765 43210",
    "mobilePhone": "+91 98765 43211",
    "avatar": "https://cdn.crm.com/avatars/john.jpg"
  },

  "roleId": "ROLE-001",
  "roleName": "Sales Manager",
  "profileId": "PROFILE-002",
  "profileName": "Sales Manager Profile",

  "managerId": "USR-000002",
  "managerName": "Jane Doe",
  "teamId": "TEAM-001",
  "teamName": "Sales Team A",
  "territoryId": "TERR-001",
  "territoryName": "North Region",

  "userType": "STANDARD",  // STANDARD, ADMIN, READ_ONLY
  "isActive": true,
  "activatedAt": ISODate("2026-01-15T10:00:00Z"),
  "deactivatedAt": null,
  "deactivationReason": null,

  "settings": {
    "timeZone": "Asia/Kolkata",
    "language": "en",
    "dateFormat": "DD/MM/YYYY",
    "currency": "INR",
    "emailNotifications": true,
    "desktopNotifications": true
  },

  "security": {
    "twoFactorEnabled": false,
    "allowedIPs": ["192.168.1.100", "10.0.0.50"],
    "lastLoginAt": ISODate("2026-01-26T09:15:00Z"),
    "lastLoginIP": "192.168.1.100",
    "lastPasswordResetAt": ISODate("2026-01-15T10:00:00Z"),
    "failedLoginAttempts": 0,
    "lockedUntil": null
  },

  "createdAt": ISODate("2026-01-15T10:00:00Z"),
  "createdBy": "SYSTEM",
  "lastModifiedAt": ISODate("2026-01-20T14:30:00Z"),
  "lastModifiedBy": "USR-000002"
}
```

**Indexes:**
```javascript
db.users.createIndex({ "userId": 1 }, { unique: true })
db.users.createIndex({ "username": 1 }, { unique: true })
db.users.createIndex({ "email": 1 }, { unique: true })
db.users.createIndex({ "roleId": 1 })
db.users.createIndex({ "managerId": 1 })
db.users.createIndex({ "isActive": 1 })
db.users.createIndex({ "createdAt": -1 })
```

---

#### **2. roles**

```json
{
  "_id": ObjectId("..."),
  "roleId": "ROLE-001",
  "roleName": "Sales Manager",
  "roleDescription": "Manages sales team, views team data",

  "parentRoleId": "ROLE-002",  // CEO, VP Sales, Manager, Rep hierarchy
  "parentRoleName": "VP Sales",
  "level": 3,  // Hierarchy level (1 = top)

  "permissions": {
    "dataVisibility": "SELF_AND_SUBORDINATES",  // OWN_ONLY, SELF_AND_SUBORDINATES, ALL
    "canViewAllLeads": false,
    "canViewAllAccounts": false,
    "canViewAllOpportunities": false,
    "canManageUsers": false,
    "canManageRoles": false,
    "canAccessReports": true,
    "canExportData": true
  },

  "isSystemRole": false,  // true for built-in roles
  "isActive": true,

  "createdAt": ISODate("2026-01-01T00:00:00Z"),
  "createdBy": "SYSTEM",
  "lastModifiedAt": ISODate("2026-01-15T10:00:00Z"),
  "lastModifiedBy": "USR-000001"
}
```

**Indexes:**
```javascript
db.roles.createIndex({ "roleId": 1 }, { unique: true })
db.roles.createIndex({ "roleName": 1 }, { unique: true })
db.roles.createIndex({ "parentRoleId": 1 })
db.roles.createIndex({ "level": 1 })
db.roles.createIndex({ "isActive": 1 })
```

---

#### **3. profiles**

```json
{
  "_id": ObjectId("..."),
  "profileId": "PROFILE-002",
  "profileName": "Sales Manager Profile",
  "profileDescription": "Standard permissions for sales managers",

  "objectPermissions": [
    {
      "objectName": "LEAD",
      "canCreate": true,
      "canRead": true,
      "canEdit": true,
      "canDelete": true,
      "canViewAll": false,
      "canModifyAll": false
    },
    {
      "objectName": "ACCOUNT",
      "canCreate": true,
      "canRead": true,
      "canEdit": true,
      "canDelete": false,
      "canViewAll": false,
      "canModifyAll": false
    },
    {
      "objectName": "CONTACT",
      "canCreate": true,
      "canRead": true,
      "canEdit": true,
      "canDelete": false,
      "canViewAll": false,
      "canModifyAll": false
    },
    {
      "objectName": "OPPORTUNITY",
      "canCreate": true,
      "canRead": true,
      "canEdit": true,
      "canDelete": false,
      "canViewAll": false,
      "canModifyAll": false
    },
    {
      "objectName": "ACTIVITY",
      "canCreate": true,
      "canRead": true,
      "canEdit": true,
      "canDelete": true,
      "canViewAll": false,
      "canModifyAll": false
    }
  ],

  "fieldPermissions": [
    {
      "objectName": "OPPORTUNITY",
      "fieldName": "amount",
      "canRead": true,
      "canEdit": true
    },
    {
      "objectName": "OPPORTUNITY",
      "fieldName": "discount",
      "canRead": true,
      "canEdit": false  // Cannot modify discount
    },
    {
      "objectName": "ACCOUNT",
      "fieldName": "creditLimit",
      "canRead": false,  // Cannot see credit limit
      "canEdit": false
    }
  ],

  "systemPermissions": {
    "canAccessReports": true,
    "canCreateReports": true,
    "canExportData": true,
    "canImportData": true,
    "canManageWorkflows": false,
    "canManageUsers": false,
    "canManageRoles": false,
    "canViewSetup": false,
    "canModifySetup": false,
    "canAccessAPI": true,
    "canManageIntegrations": false
  },

  "isSystemProfile": false,
  "isActive": true,

  "createdAt": ISODate("2026-01-01T00:00:00Z"),
  "createdBy": "SYSTEM",
  "lastModifiedAt": ISODate("2026-01-15T10:00:00Z"),
  "lastModifiedBy": "USR-000001"
}
```

**Indexes:**
```javascript
db.profiles.createIndex({ "profileId": 1 }, { unique: true })
db.profiles.createIndex({ "profileName": 1 }, { unique: true })
db.profiles.createIndex({ "isActive": 1 })
```

---

#### **4. sharing_rules**

```json
{
  "_id": ObjectId("..."),
  "ruleId": "SHARE-001",
  "ruleName": "Share High-Value Opportunities with VP",
  "ruleDescription": "All opportunities > $100K visible to VP Sales",

  "objectName": "OPPORTUNITY",
  "ruleType": "CRITERIA_BASED",  // OWNER_BASED, CRITERIA_BASED

  // For OWNER_BASED rules
  "ownerCriteria": {
    "fromTeamId": "TEAM-001",
    "fromTeamName": "Sales Team A"
  },

  // For CRITERIA_BASED rules
  "criteria": [
    {
      "field": "amount",
      "operator": "GREATER_THAN",
      "value": 100000
    },
    {
      "field": "stage",
      "operator": "NOT_EQUALS",
      "value": "CLOSED_LOST"
    }
  ],
  "criteriaLogic": "AND",  // AND, OR

  "shareWith": {
    "type": "ROLE",  // USER, ROLE, TEAM, PUBLIC_GROUP
    "entityId": "ROLE-002",
    "entityName": "VP Sales"
  },

  "accessLevel": "READ_ONLY",  // READ_ONLY, READ_WRITE

  "isActive": true,

  "createdAt": ISODate("2026-01-01T00:00:00Z"),
  "createdBy": "USR-000001",
  "lastModifiedAt": ISODate("2026-01-15T10:00:00Z"),
  "lastModifiedBy": "USR-000001"
}
```

**Indexes:**
```javascript
db.sharing_rules.createIndex({ "ruleId": 1 }, { unique: true })
db.sharing_rules.createIndex({ "objectName": 1 })
db.sharing_rules.createIndex({ "isActive": 1 })
db.sharing_rules.createIndex({ "shareWith.entityId": 1 })
```

---

#### **5. manual_shares**

```json
{
  "_id": ObjectId("..."),
  "shareId": "MSHARE-001",

  "objectName": "OPPORTUNITY",
  "recordId": "OPP-000123",
  "recordName": "Acme Corp - Q1 Deal",

  "ownerId": "USR-000001",
  "ownerName": "John Smith",

  "sharedWith": {
    "userId": "USR-000005",
    "userName": "Sarah Johnson"
  },

  "accessLevel": "READ_WRITE",  // READ_ONLY, READ_WRITE
  "reason": "Collaboration on enterprise deal",

  "sharedAt": ISODate("2026-01-20T10:00:00Z"),
  "sharedBy": "USR-000001",
  "expiresAt": null  // null = permanent, or specific date
}
```

**Indexes:**
```javascript
db.manual_shares.createIndex({ "shareId": 1 }, { unique: true })
db.manual_shares.createIndex({ "objectName": 1, "recordId": 1 })
db.manual_shares.createIndex({ "sharedWith.userId": 1 })
db.manual_shares.createIndex({ "ownerId": 1 })
```

---

#### **6. teams**

```json
{
  "_id": ObjectId("..."),
  "teamId": "TEAM-001",
  "teamName": "Sales Team A",
  "teamDescription": "Enterprise sales team",

  "teamLeadId": "USR-000002",
  "teamLeadName": "Jane Doe",

  "members": [
    {
      "userId": "USR-000001",
      "userName": "John Smith",
      "role": "MEMBER",  // LEAD, MEMBER
      "joinedAt": ISODate("2026-01-15T10:00:00Z")
    },
    {
      "userId": "USR-000003",
      "userName": "Mike Chen",
      "role": "MEMBER",
      "joinedAt": ISODate("2026-01-15T10:00:00Z")
    }
  ],

  "isActive": true,

  "createdAt": ISODate("2026-01-01T00:00:00Z"),
  "createdBy": "USR-000002",
  "lastModifiedAt": ISODate("2026-01-15T10:00:00Z"),
  "lastModifiedBy": "USR-000002"
}
```

**Indexes:**
```javascript
db.teams.createIndex({ "teamId": 1 }, { unique: true })
db.teams.createIndex({ "teamName": 1 }, { unique: true })
db.teams.createIndex({ "members.userId": 1 })
db.teams.createIndex({ "isActive": 1 })
```

---

#### **7. audit_logs**

```json
{
  "_id": ObjectId("..."),
  "auditId": "AUD-000001",

  "eventType": "USER_LOGIN",
  // USER_LOGIN, USER_LOGOUT, USER_CREATED, USER_UPDATED, USER_DEACTIVATED,
  // ROLE_CREATED, ROLE_UPDATED, PERMISSION_CHANGED, DATA_EXPORTED,
  // RECORD_CREATED, RECORD_UPDATED, RECORD_DELETED, RECORD_VIEWED,
  // LOGIN_FAILED, PASSWORD_CHANGED, PASSWORD_RESET, IP_BLOCKED

  "objectName": "USER",
  "recordId": "USR-000001",
  "recordName": "John Smith",

  "userId": "USR-000001",
  "userName": "John Smith",
  "userEmail": "john.smith@company.com",

  "action": "LOGIN",
  "actionDetails": {
    "ipAddress": "192.168.1.100",
    "userAgent": "Mozilla/5.0...",
    "sessionId": "sess_abc123",
    "loginMethod": "PASSWORD"  // PASSWORD, SSO, API_KEY
  },

  "changedFields": [
    {
      "field": "lastLoginAt",
      "oldValue": "2026-01-25T09:00:00Z",
      "newValue": "2026-01-26T09:15:00Z"
    }
  ],

  "success": true,
  "errorMessage": null,

  "timestamp": ISODate("2026-01-26T09:15:00Z"),
  "serverTimestamp": ISODate("2026-01-26T09:15:00.123Z")
}
```

**Indexes:**
```javascript
db.audit_logs.createIndex({ "auditId": 1 }, { unique: true })
db.audit_logs.createIndex({ "userId": 1, "timestamp": -1 })
db.audit_logs.createIndex({ "eventType": 1, "timestamp": -1 })
db.audit_logs.createIndex({ "objectName": 1, "recordId": 1, "timestamp": -1 })
db.audit_logs.createIndex({ "timestamp": -1 })  // For time-range queries
// TTL index - expire after 2 years
db.audit_logs.createIndex({ "timestamp": 1 }, { expireAfterSeconds: 63072000 })
```

---

#### **8. field_history**

```json
{
  "_id": ObjectId("..."),
  "historyId": "HIST-000001",

  "objectName": "OPPORTUNITY",
  "recordId": "OPP-000123",
  "recordName": "Acme Corp - Q1 Deal",

  "field": "stage",
  "fieldLabel": "Stage",
  "dataType": "STRING",

  "oldValue": "PROPOSAL",
  "newValue": "NEGOTIATION",

  "changedBy": "USR-000001",
  "changedByName": "John Smith",
  "changedAt": ISODate("2026-01-26T10:00:00Z")
}
```

**Indexes:**
```javascript
db.field_history.createIndex({ "historyId": 1 }, { unique: true })
db.field_history.createIndex({ "objectName": 1, "recordId": 1, "changedAt": -1 })
db.field_history.createIndex({ "changedAt": -1 })
// TTL index - expire after 1 year
db.field_history.createIndex({ "changedAt": 1 }, { expireAfterSeconds: 31536000 })
```

---

#### **9. sessions**

```json
{
  "_id": ObjectId("..."),
  "sessionId": "sess_abc123",
  "userId": "USR-000001",
  "userName": "John Smith",

  "token": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",

  "ipAddress": "192.168.1.100",
  "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)...",
  "deviceType": "DESKTOP",  // DESKTOP, MOBILE, TABLET

  "createdAt": ISODate("2026-01-26T09:00:00Z"),
  "lastActivityAt": ISODate("2026-01-26T10:30:00Z"),
  "expiresAt": ISODate("2026-01-26T11:00:00Z"),

  "isActive": true,
  "terminatedAt": null,
  "terminationReason": null  // LOGOUT, TIMEOUT, FORCED, EXPIRED
}
```

**Indexes:**
```javascript
db.sessions.createIndex({ "sessionId": 1 }, { unique: true })
db.sessions.createIndex({ "userId": 1, "isActive": 1 })
db.sessions.createIndex({ "token": 1 })
db.sessions.createIndex({ "expiresAt": 1 })  // For cleanup
// TTL index - auto-delete expired sessions
db.sessions.createIndex({ "expiresAt": 1 }, { expireAfterSeconds: 0 })
```

---

#### **10. ip_whitelist**

```json
{
  "_id": ObjectId("..."),
  "whitelistId": "IP-001",

  "ipAddress": "192.168.1.0/24",  // Can be single IP or CIDR range
  "ipType": "RANGE",  // SINGLE, RANGE

  "description": "Office Network - Mumbai",
  "location": "Mumbai Office",

  "appliesTo": {
    "type": "ALL",  // ALL, SPECIFIC_USERS, SPECIFIC_ROLES
    "entityIds": []
  },

  "isActive": true,

  "createdAt": ISODate("2026-01-01T00:00:00Z"),
  "createdBy": "USR-000001",
  "lastModifiedAt": ISODate("2026-01-15T10:00:00Z"),
  "lastModifiedBy": "USR-000001"
}
```

**Indexes:**
```javascript
db.ip_whitelist.createIndex({ "whitelistId": 1 }, { unique: true })
db.ip_whitelist.createIndex({ "isActive": 1 })
```

---

### Entity Relationships

```
users (1) ──→ (1) roles (role hierarchy)
users (1) ──→ (1) profiles (permissions)
users (1) ──→ (0..1) users (manager relationship)
users (1) ──→ (1) teams (team membership)

roles (1) ──→ (0..1) roles (parent-child hierarchy)

sharing_rules (1) ──→ (1) roles/teams/users (share with)

manual_shares (many) ──→ (1) users (shared with)
manual_shares (many) ──→ (1) records (any object)

teams (1) ──→ (many) users (team members)

audit_logs (many) ──→ (1) users (who did the action)
audit_logs (many) ──→ (1) records (what was changed)

field_history (many) ──→ (1) records (field changes)

sessions (many) ──→ (1) users (active sessions)
```

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1-2)

**Sprint 1.1: User Management Core**
- [ ] Create User entity and repository
- [ ] Implement UserService (CRUD operations)
- [ ] Build User REST API endpoints
- [ ] Create User management UI
- [ ] Add password hashing (BCrypt)
- [ ] Implement user activation/deactivation

**Sprint 1.2: Authentication**
- [ ] Set up Spring Security
- [ ] Implement JWT authentication
- [ ] Create login/logout endpoints
- [ ] Build session management
- [ ] Add token refresh mechanism
- [ ] Create login UI

**Deliverables:**
- ✅ Users can be created, edited, deactivated
- ✅ Users can login with JWT
- ✅ Sessions are managed securely

---

### Phase 2: Roles & Permissions (Week 3-4)

**Sprint 2.1: Role Hierarchy**
- [ ] Create Role entity and repository
- [ ] Implement role hierarchy logic
- [ ] Build role assignment to users
- [ ] Create role management UI
- [ ] Test role-based data visibility

**Sprint 2.2: Profile & Permissions**
- [ ] Create Profile entity
- [ ] Implement object-level permissions
- [ ] Implement field-level permissions
- [ ] Build permission evaluation engine
- [ ] Create profile builder UI
- [ ] Add permission checks to all endpoints

**Deliverables:**
- ✅ Roles define organizational hierarchy
- ✅ Profiles control CRUD permissions
- ✅ All API endpoints enforce permissions

---

### Phase 3: Sharing & Security (Week 5-6)

**Sprint 3.1: Sharing Rules**
- [ ] Create SharingRule entity
- [ ] Implement owner-based sharing
- [ ] Implement criteria-based sharing
- [ ] Build sharing rule engine
- [ ] Create sharing rule builder UI
- [ ] Add manual share functionality

**Sprint 3.2: Security Features**
- [ ] Implement IP whitelisting
- [ ] Add audit logging to all actions
- [ ] Build field history tracking
- [ ] Create session timeout management
- [ ] Add password policy enforcement
- [ ] Build security settings UI

**Deliverables:**
- ✅ Records can be shared beyond hierarchy
- ✅ All security events are logged
- ✅ IP restrictions enforced
- ✅ Field changes tracked

---

### Phase 4: Advanced Features (Week 7-8)

**Sprint 4.1: Teams & Territories**
- [ ] Create Team entity
- [ ] Implement team-based sharing
- [ ] Add territory management
- [ ] Build team management UI

**Sprint 4.2: Advanced Security**
- [ ] Add two-factor authentication
- [ ] Implement password expiry
- [ ] Add failed login lockout
- [ ] Build security dashboard
- [ ] Create audit report viewer

**Deliverables:**
- ✅ Teams can collaborate on records
- ✅ 2FA available for sensitive accounts
- ✅ Comprehensive audit reports

---

## 9.1 User Management

### Backend Implementation

#### Domain Entity

**File:** `/backend/src/main/java/com/ultron/backend/domain/User.java`

```java
package com.ultron.backend.domain;

import com.ultron.backend.domain.enums.UserType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "users")
public class User {

    @Id
    private String id;
    private String userId;  // USR-000001

    // Authentication
    private String username;
    private String email;
    private String passwordHash;
    private LocalDateTime passwordLastChanged;
    private LocalDateTime passwordExpiresAt;

    // Profile
    private UserProfile profile;

    // Access Control
    private String roleId;
    private String roleName;
    private String profileId;
    private String profileName;

    // Organization
    private String managerId;
    private String managerName;
    private String teamId;
    private String teamName;
    private String territoryId;
    private String territoryName;

    // Status
    private UserType userType;  // STANDARD, ADMIN, READ_ONLY
    private Boolean isActive;
    private LocalDateTime activatedAt;
    private LocalDateTime deactivatedAt;
    private String deactivationReason;

    // Settings
    private UserSettings settings;

    // Security
    private UserSecurity security;

    // Audit
    private LocalDateTime createdAt;
    private String createdBy;
    private LocalDateTime lastModifiedAt;
    private String lastModifiedBy;
}

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
class UserProfile {
    private String firstName;
    private String lastName;
    private String fullName;
    private String title;
    private String department;
    private String phone;
    private String mobilePhone;
    private String avatar;
}

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
class UserSettings {
    private String timeZone;
    private String language;
    private String dateFormat;
    private String currency;
    private Boolean emailNotifications;
    private Boolean desktopNotifications;
}

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
class UserSecurity {
    private Boolean twoFactorEnabled;
    private List<String> allowedIPs;
    private LocalDateTime lastLoginAt;
    private String lastLoginIP;
    private LocalDateTime lastPasswordResetAt;
    private Integer failedLoginAttempts;
    private LocalDateTime lockedUntil;
}
```

**File:** `/backend/src/main/java/com/ultron/backend/domain/enums/UserType.java`

```java
package com.ultron.backend.domain.enums;

public enum UserType {
    STANDARD,
    ADMIN,
    READ_ONLY
}
```

---

#### DTOs

**File:** `/backend/src/main/java/com/ultron/backend/dto/request/CreateUserRequest.java`

```java
package com.ultron.backend.dto.request;

import com.ultron.backend.domain.enums.UserType;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateUserRequest {

    @NotBlank(message = "Username is required")
    @Size(min = 3, max = 50, message = "Username must be between 3 and 50 characters")
    @Pattern(regexp = "^[a-zA-Z0-9._-]+$", message = "Username can only contain letters, numbers, dots, underscores, and hyphens")
    private String username;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 8, max = 100, message = "Password must be at least 8 characters")
    @Pattern(
        regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$",
        message = "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    )
    private String password;

    // Profile
    @NotBlank(message = "First name is required")
    private String firstName;

    @NotBlank(message = "Last name is required")
    private String lastName;

    private String title;
    private String department;
    private String phone;
    private String mobilePhone;

    // Access Control
    @NotBlank(message = "Role is required")
    private String roleId;

    @NotBlank(message = "Profile is required")
    private String profileId;

    private String managerId;
    private String teamId;
    private String territoryId;

    // User Type
    private UserType userType;

    // Settings
    private String timeZone;
    private String language;
    private String dateFormat;
    private String currency;
}
```

**File:** `/backend/src/main/java/com/ultron/backend/dto/request/UpdateUserRequest.java`

```java
package com.ultron.backend.dto.request;

import com.ultron.backend.domain.enums.UserType;
import jakarta.validation.constraints.Email;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateUserRequest {

    @Email(message = "Invalid email format")
    private String email;

    // Profile
    private String firstName;
    private String lastName;
    private String title;
    private String department;
    private String phone;
    private String mobilePhone;

    // Access Control
    private String roleId;
    private String profileId;
    private String managerId;
    private String teamId;
    private String territoryId;

    // User Type
    private UserType userType;

    // Settings
    private String timeZone;
    private String language;
    private String dateFormat;
    private String currency;
    private Boolean emailNotifications;
    private Boolean desktopNotifications;
}
```

**File:** `/backend/src/main/java/com/ultron/backend/dto/response/UserResponse.java`

```java
package com.ultron.backend.dto.response;

import com.ultron.backend.domain.UserProfile;
import com.ultron.backend.domain.UserSettings;
import com.ultron.backend.domain.enums.UserType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {

    private String id;
    private String userId;
    private String username;
    private String email;

    private UserProfile profile;

    private String roleId;
    private String roleName;
    private String profileId;
    private String profileName;

    private String managerId;
    private String managerName;
    private String teamId;
    private String teamName;
    private String territoryId;
    private String territoryName;

    private UserType userType;
    private Boolean isActive;
    private LocalDateTime activatedAt;
    private LocalDateTime deactivatedAt;

    private UserSettings settings;

    private LocalDateTime lastLoginAt;
    private LocalDateTime passwordLastChanged;

    private LocalDateTime createdAt;
    private String createdBy;
    private LocalDateTime lastModifiedAt;
    private String lastModifiedBy;
}
```

---

#### Repository

**File:** `/backend/src/main/java/com/ultron/backend/repository/UserRepository.java`

```java
package com.ultron.backend.repository;

import com.ultron.backend.domain.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends MongoRepository<User, String> {

    Optional<User> findByUserId(String userId);
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);

    boolean existsByUsername(String username);
    boolean existsByEmail(String email);

    List<User> findByIsActive(Boolean isActive);
    List<User> findByRoleId(String roleId);
    List<User> findByManagerId(String managerId);
    List<User> findByTeamId(String teamId);

    @Query("{ 'isActive': true, 'roleId': ?0 }")
    List<User> findActiveUsersByRole(String roleId);

    @Query("{ 'isActive': true, 'managerId': ?0 }")
    List<User> findActiveSubordinates(String managerId);

    @Query("{ 'security.lastLoginAt': { $lt: ?0 } }")
    List<User> findInactiveUsers(java.time.LocalDateTime since);

    @Query("{ 'passwordExpiresAt': { $lt: ?0 }, 'isActive': true }")
    List<User> findUsersWithExpiredPasswords(java.time.LocalDateTime now);
}
```

---

#### Service

**File:** `/backend/src/main/java/com/ultron/backend/service/UserService.java`

```java
package com.ultron.backend.service;

import com.ultron.backend.domain.User;
import com.ultron.backend.domain.UserProfile;
import com.ultron.backend.domain.UserSecurity;
import com.ultron.backend.domain.UserSettings;
import com.ultron.backend.dto.request.CreateUserRequest;
import com.ultron.backend.dto.request.UpdateUserRequest;
import com.ultron.backend.dto.response.UserResponse;
import com.ultron.backend.exception.DuplicateResourceException;
import com.ultron.backend.exception.ResourceNotFoundException;
import com.ultron.backend.repository.UserRepository;
import com.ultron.backend.util.IdGenerator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final RoleService roleService;
    private final ProfileService profileService;
    private final AuditService auditService;

    @Transactional
    public UserResponse createUser(CreateUserRequest request, String createdBy) {
        log.info("Creating user: {}", request.getUsername());

        // Validate unique constraints
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new DuplicateResourceException("Username already exists: " + request.getUsername());
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("Email already exists: " + request.getEmail());
        }

        // Validate role and profile exist
        roleService.getRoleById(request.getRoleId());
        profileService.getProfileById(request.getProfileId());

        // Create user entity
        User user = User.builder()
                .userId(IdGenerator.generateUserId())
                .username(request.getUsername())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .passwordLastChanged(LocalDateTime.now())
                .passwordExpiresAt(LocalDateTime.now().plusDays(90))  // 90-day expiry
                .profile(UserProfile.builder()
                        .firstName(request.getFirstName())
                        .lastName(request.getLastName())
                        .fullName(request.getFirstName() + " " + request.getLastName())
                        .title(request.getTitle())
                        .department(request.getDepartment())
                        .phone(request.getPhone())
                        .mobilePhone(request.getMobilePhone())
                        .build())
                .roleId(request.getRoleId())
                .profileId(request.getProfileId())
                .managerId(request.getManagerId())
                .teamId(request.getTeamId())
                .territoryId(request.getTerritoryId())
                .userType(request.getUserType() != null ? request.getUserType() : com.ultron.backend.domain.enums.UserType.STANDARD)
                .isActive(true)
                .activatedAt(LocalDateTime.now())
                .settings(UserSettings.builder()
                        .timeZone(request.getTimeZone() != null ? request.getTimeZone() : "Asia/Kolkata")
                        .language(request.getLanguage() != null ? request.getLanguage() : "en")
                        .dateFormat(request.getDateFormat() != null ? request.getDateFormat() : "DD/MM/YYYY")
                        .currency(request.getCurrency() != null ? request.getCurrency() : "INR")
                        .emailNotifications(true)
                        .desktopNotifications(true)
                        .build())
                .security(UserSecurity.builder()
                        .twoFactorEnabled(false)
                        .failedLoginAttempts(0)
                        .build())
                .createdAt(LocalDateTime.now())
                .createdBy(createdBy)
                .lastModifiedAt(LocalDateTime.now())
                .lastModifiedBy(createdBy)
                .build();

        // Enrich with role and profile names
        enrichUserWithNames(user);

        // Save
        User savedUser = userRepository.save(user);

        // Audit
        auditService.logUserCreated(savedUser, createdBy);

        log.info("User created successfully: {}", savedUser.getUserId());

        return mapToResponse(savedUser);
    }

    @Transactional
    public UserResponse updateUser(String id, UpdateUserRequest request, String modifiedBy) {
        log.info("Updating user: {}", id);

        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));

        // Check email uniqueness if changed
        if (request.getEmail() != null && !request.getEmail().equals(user.getEmail())) {
            if (userRepository.existsByEmail(request.getEmail())) {
                throw new DuplicateResourceException("Email already exists: " + request.getEmail());
            }
            user.setEmail(request.getEmail());
        }

        // Update profile
        if (request.getFirstName() != null || request.getLastName() != null) {
            UserProfile profile = user.getProfile();
            if (request.getFirstName() != null) profile.setFirstName(request.getFirstName());
            if (request.getLastName() != null) profile.setLastName(request.getLastName());
            profile.setFullName(profile.getFirstName() + " " + profile.getLastName());
            if (request.getTitle() != null) profile.setTitle(request.getTitle());
            if (request.getDepartment() != null) profile.setDepartment(request.getDepartment());
            if (request.getPhone() != null) profile.setPhone(request.getPhone());
            if (request.getMobilePhone() != null) profile.setMobilePhone(request.getMobilePhone());
        }

        // Update access control
        if (request.getRoleId() != null) {
            roleService.getRoleById(request.getRoleId());  // Validate exists
            user.setRoleId(request.getRoleId());
        }
        if (request.getProfileId() != null) {
            profileService.getProfileById(request.getProfileId());  // Validate exists
            user.setProfileId(request.getProfileId());
        }
        if (request.getManagerId() != null) user.setManagerId(request.getManagerId());
        if (request.getTeamId() != null) user.setTeamId(request.getTeamId());
        if (request.getTerritoryId() != null) user.setTerritoryId(request.getTerritoryId());

        // Update user type
        if (request.getUserType() != null) user.setUserType(request.getUserType());

        // Update settings
        if (request.getTimeZone() != null) user.getSettings().setTimeZone(request.getTimeZone());
        if (request.getLanguage() != null) user.getSettings().setLanguage(request.getLanguage());
        if (request.getDateFormat() != null) user.getSettings().setDateFormat(request.getDateFormat());
        if (request.getCurrency() != null) user.getSettings().setCurrency(request.getCurrency());
        if (request.getEmailNotifications() != null) user.getSettings().setEmailNotifications(request.getEmailNotifications());
        if (request.getDesktopNotifications() != null) user.getSettings().setDesktopNotifications(request.getDesktopNotifications());

        // Enrich with names
        enrichUserWithNames(user);

        // Audit fields
        user.setLastModifiedAt(LocalDateTime.now());
        user.setLastModifiedBy(modifiedBy);

        // Save
        User updatedUser = userRepository.save(user);

        // Audit
        auditService.logUserUpdated(updatedUser, modifiedBy);

        log.info("User updated successfully: {}", updatedUser.getUserId());

        return mapToResponse(updatedUser);
    }

    @Transactional
    public void deactivateUser(String id, String deactivatedBy, String reason) {
        log.info("Deactivating user: {}", id);

        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));

        user.setIsActive(false);
        user.setDeactivatedAt(LocalDateTime.now());
        user.setDeactivationReason(reason);
        user.setLastModifiedAt(LocalDateTime.now());
        user.setLastModifiedBy(deactivatedBy);

        userRepository.save(user);

        // Audit
        auditService.logUserDeactivated(user, deactivatedBy, reason);

        log.info("User deactivated: {}", user.getUserId());
    }

    @Transactional
    public void activateUser(String id, String activatedBy) {
        log.info("Activating user: {}", id);

        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));

        user.setIsActive(true);
        user.setActivatedAt(LocalDateTime.now());
        user.setDeactivatedAt(null);
        user.setDeactivationReason(null);
        user.setLastModifiedAt(LocalDateTime.now());
        user.setLastModifiedBy(activatedBy);

        userRepository.save(user);

        // Audit
        auditService.logUserActivated(user, activatedBy);

        log.info("User activated: {}", user.getUserId());
    }

    public UserResponse getUserById(String id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));
        return mapToResponse(user);
    }

    public UserResponse getUserByUserId(String userId) {
        User user = userRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
        return mapToResponse(user);
    }

    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<UserResponse> getActiveUsers() {
        return userRepository.findByIsActive(true).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<UserResponse> getUsersByRole(String roleId) {
        return userRepository.findByRoleId(roleId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<UserResponse> getSubordinates(String managerId) {
        return userRepository.findByManagerId(managerId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private void enrichUserWithNames(User user) {
        // Fetch and set role name
        if (user.getRoleId() != null) {
            try {
                var role = roleService.getRoleById(user.getRoleId());
                user.setRoleName(role.getRoleName());
            } catch (Exception e) {
                log.warn("Could not fetch role name for roleId: {}", user.getRoleId());
            }
        }

        // Fetch and set profile name
        if (user.getProfileId() != null) {
            try {
                var profile = profileService.getProfileById(user.getProfileId());
                user.setProfileName(profile.getProfileName());
            } catch (Exception e) {
                log.warn("Could not fetch profile name for profileId: {}", user.getProfileId());
            }
        }

        // Fetch and set manager name
        if (user.getManagerId() != null) {
            try {
                User manager = userRepository.findById(user.getManagerId()).orElse(null);
                if (manager != null && manager.getProfile() != null) {
                    user.setManagerName(manager.getProfile().getFullName());
                }
            } catch (Exception e) {
                log.warn("Could not fetch manager name for managerId: {}", user.getManagerId());
            }
        }

        // TODO: Fetch and set team name, territory name when those services are implemented
    }

    private UserResponse mapToResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .userId(user.getUserId())
                .username(user.getUsername())
                .email(user.getEmail())
                .profile(user.getProfile())
                .roleId(user.getRoleId())
                .roleName(user.getRoleName())
                .profileId(user.getProfileId())
                .profileName(user.getProfileName())
                .managerId(user.getManagerId())
                .managerName(user.getManagerName())
                .teamId(user.getTeamId())
                .teamName(user.getTeamName())
                .territoryId(user.getTerritoryId())
                .territoryName(user.getTerritoryName())
                .userType(user.getUserType())
                .isActive(user.getIsActive())
                .activatedAt(user.getActivatedAt())
                .deactivatedAt(user.getDeactivatedAt())
                .settings(user.getSettings())
                .lastLoginAt(user.getSecurity() != null ? user.getSecurity().getLastLoginAt() : null)
                .passwordLastChanged(user.getPasswordLastChanged())
                .createdAt(user.getCreatedAt())
                .createdBy(user.getCreatedBy())
                .lastModifiedAt(user.getLastModifiedAt())
                .lastModifiedBy(user.getLastModifiedBy())
                .build();
    }
}
```

---

#### Controller

**File:** `/backend/src/main/java/com/ultron/backend/controller/UserController.java`

```java
package com.ultron.backend.controller;

import com.ultron.backend.dto.request.CreateUserRequest;
import com.ultron.backend.dto.request.UpdateUserRequest;
import com.ultron.backend.dto.response.ApiResponse;
import com.ultron.backend.dto.response.UserResponse;
import com.ultron.backend.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
@Slf4j
public class UserController {

    private final UserService userService;

    @PostMapping
    @PreAuthorize("hasPermission('USER', 'CREATE')")
    public ResponseEntity<ApiResponse<UserResponse>> createUser(
            @Valid @RequestBody CreateUserRequest request) {

        String currentUserId = getCurrentUserId();
        log.info("User {} creating new user: {}", currentUserId, request.getUsername());

        UserResponse user = userService.createUser(request, currentUserId);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.<UserResponse>builder()
                        .success(true)
                        .message("User created successfully")
                        .data(user)
                        .build());
    }

    @GetMapping
    @PreAuthorize("hasPermission('USER', 'READ')")
    public ResponseEntity<ApiResponse<List<UserResponse>>> getAllUsers(
            @RequestParam(required = false) Boolean activeOnly) {

        log.info("Fetching all users (activeOnly: {})", activeOnly);

        List<UserResponse> users = activeOnly != null && activeOnly
                ? userService.getActiveUsers()
                : userService.getAllUsers();

        return ResponseEntity.ok(
                ApiResponse.<List<UserResponse>>builder()
                        .success(true)
                        .message("Users retrieved successfully")
                        .data(users)
                        .build());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasPermission('USER', 'READ')")
    public ResponseEntity<ApiResponse<UserResponse>> getUserById(@PathVariable String id) {
        log.info("Fetching user with id: {}", id);

        UserResponse user = userService.getUserById(id);

        return ResponseEntity.ok(
                ApiResponse.<UserResponse>builder()
                        .success(true)
                        .message("User retrieved successfully")
                        .data(user)
                        .build());
    }

    @GetMapping("/code/{userId}")
    @PreAuthorize("hasPermission('USER', 'READ')")
    public ResponseEntity<ApiResponse<UserResponse>> getUserByUserId(
            @PathVariable String userId) {

        log.info("Fetching user with userId: {}", userId);

        UserResponse user = userService.getUserByUserId(userId);

        return ResponseEntity.ok(
                ApiResponse.<UserResponse>builder()
                        .success(true)
                        .message("User retrieved successfully")
                        .data(user)
                        .build());
    }

    @GetMapping("/role/{roleId}")
    @PreAuthorize("hasPermission('USER', 'READ')")
    public ResponseEntity<ApiResponse<List<UserResponse>>> getUsersByRole(
            @PathVariable String roleId) {

        log.info("Fetching users with roleId: {}", roleId);

        List<UserResponse> users = userService.getUsersByRole(roleId);

        return ResponseEntity.ok(
                ApiResponse.<List<UserResponse>>builder()
                        .success(true)
                        .message("Users retrieved successfully")
                        .data(users)
                        .build());
    }

    @GetMapping("/subordinates/{managerId}")
    @PreAuthorize("hasPermission('USER', 'READ')")
    public ResponseEntity<ApiResponse<List<UserResponse>>> getSubordinates(
            @PathVariable String managerId) {

        log.info("Fetching subordinates for manager: {}", managerId);

        List<UserResponse> users = userService.getSubordinates(managerId);

        return ResponseEntity.ok(
                ApiResponse.<List<UserResponse>>builder()
                        .success(true)
                        .message("Subordinates retrieved successfully")
                        .data(users)
                        .build());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasPermission('USER', 'EDIT')")
    public ResponseEntity<ApiResponse<UserResponse>> updateUser(
            @PathVariable String id,
            @Valid @RequestBody UpdateUserRequest request) {

        String currentUserId = getCurrentUserId();
        log.info("User {} updating user {}", currentUserId, id);

        UserResponse user = userService.updateUser(id, request, currentUserId);

        return ResponseEntity.ok(
                ApiResponse.<UserResponse>builder()
                        .success(true)
                        .message("User updated successfully")
                        .data(user)
                        .build());
    }

    @PostMapping("/{id}/deactivate")
    @PreAuthorize("hasPermission('USER', 'EDIT')")
    public ResponseEntity<ApiResponse<Void>> deactivateUser(
            @PathVariable String id,
            @RequestParam(required = false) String reason) {

        String currentUserId = getCurrentUserId();
        log.info("User {} deactivating user {}", currentUserId, id);

        userService.deactivateUser(id, currentUserId, reason);

        return ResponseEntity.ok(
                ApiResponse.<Void>builder()
                        .success(true)
                        .message("User deactivated successfully")
                        .build());
    }

    @PostMapping("/{id}/activate")
    @PreAuthorize("hasPermission('USER', 'EDIT')")
    public ResponseEntity<ApiResponse<Void>> activateUser(@PathVariable String id) {
        String currentUserId = getCurrentUserId();
        log.info("User {} activating user {}", currentUserId, id);

        userService.activateUser(id, currentUserId);

        return ResponseEntity.ok(
                ApiResponse.<Void>builder()
                        .success(true)
                        .message("User activated successfully")
                        .build());
    }

    private String getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication.getName();
    }
}
```

---

### Frontend Implementation

#### User List Page

**File:** `/frontend/app/admin/users/page.tsx`

```typescript
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { UserResponse } from "@/types/user";
import { usersService } from "@/lib/users";
import { showToast } from "@/lib/toast";
import EmptyState from "@/components/EmptyState";
import ConfirmModal from "@/components/ConfirmModal";

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [error, setError] = useState<string | null>(null);

  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [userToDeactivate, setUserToDeactivate] = useState<string | null>(null);
  const [deactivateReason, setDeactivateReason] = useState("");
  const [isDeactivating, setIsDeactivating] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchQuery, statusFilter]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await usersService.getAllUsers();
      setUsers(data);
      setFilteredUsers(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load users";
      setError(errorMessage);
      showToast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    // Status filter
    if (statusFilter === "active") {
      filtered = filtered.filter((user) => user.isActive);
    } else if (statusFilter === "inactive") {
      filtered = filtered.filter((user) => !user.isActive);
    }

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (user) =>
          user.profile.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.userId.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredUsers(filtered);
  };

  const handleDeactivateClick = (userId: string) => {
    setUserToDeactivate(userId);
    setShowDeactivateModal(true);
  };

  const handleDeactivateConfirm = async () => {
    if (!userToDeactivate) return;

    try {
      setIsDeactivating(true);
      await usersService.deactivateUser(userToDeactivate, deactivateReason);
      showToast.success("User deactivated successfully");
      setShowDeactivateModal(false);
      setUserToDeactivate(null);
      setDeactivateReason("");
      loadUsers();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to deactivate user";
      showToast.error(errorMessage);
    } finally {
      setIsDeactivating(false);
    }
  };

  const handleActivate = async (userId: string) => {
    try {
      await usersService.activateUser(userId);
      showToast.success("User activated successfully");
      loadUsers();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to activate user";
      showToast.error(errorMessage);
    }
  };

  const getUserTypeBadge = (userType: string) => {
    const badges = {
      ADMIN: "bg-red-100 text-red-800",
      STANDARD: "bg-blue-100 text-blue-800",
      READ_ONLY: "bg-gray-100 text-gray-800",
    };
    return badges[userType as keyof typeof badges] || badges.STANDARD;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-slate-700">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-light">
      <main className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-7xl mx-auto w-full space-y-8">
          {/* Page Header */}
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
                User Management
              </h2>
              <p className="text-slate-700">Manage user accounts and permissions</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push("/admin/users/new")}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all"
              >
                <span className="material-symbols-outlined text-lg">person_add</span>
                New User
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Search users by name, username, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary transition-all"
                />
              </div>
              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "inactive")}
                  className="w-full px-4 py-2 bg-white rounded-lg text-sm focus:ring-2 focus:ring-primary border border-slate-300"
                >
                  <option value="all">All Users</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-red-600">error</span>
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          )}

          {/* Users Table */}
          <div className="bg-white rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-700">
                      User
                    </th>
                    <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-700">
                      Role & Profile
                    </th>
                    <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-700">
                      Manager
                    </th>
                    <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-700">
                      Type
                    </th>
                    <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-700">
                      Status
                    </th>
                    <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-700">
                      Last Login
                    </th>
                    <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-0">
                        {searchQuery || statusFilter !== "all" ? (
                          <EmptyState
                            icon="search_off"
                            title="No users found"
                            description="No users match your current filters. Try adjusting your search."
                          />
                        ) : (
                          <EmptyState
                            icon="group"
                            title="No users yet"
                            description="Get started by creating your first user account."
                            action={{ label: "Create First User", href: "/admin/users/new" }}
                          />
                        )}
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                              {user.profile.firstName[0]}
                              {user.profile.lastName[0]}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-900">
                                {user.profile.fullName}
                              </p>
                              <p className="text-xs text-slate-600">{user.username}</p>
                              <p className="text-xs text-slate-500">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-900">
                          <p className="font-medium">{user.roleName || "-"}</p>
                          <p className="text-xs text-slate-600">{user.profileName || "-"}</p>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-900">
                          {user.managerName || "-"}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2 py-1 ${getUserTypeBadge(
                              user.userType
                            )} rounded text-xs font-medium`}
                          >
                            {user.userType}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              user.isActive
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {user.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {user.lastLoginAt
                            ? new Date(user.lastLoginAt).toLocaleDateString()
                            : "Never"}
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-medium">
                          <button
                            onClick={() => router.push(`/admin/users/${user.id}`)}
                            className="text-primary hover:text-primary/90 mr-4 transition-colors"
                          >
                            View
                          </button>
                          <button
                            onClick={() => router.push(`/admin/users/${user.id}/edit`)}
                            className="text-primary hover:text-primary/90 mr-4 transition-colors"
                          >
                            Edit
                          </button>
                          {user.isActive ? (
                            <button
                              onClick={() => handleDeactivateClick(user.id)}
                              className="text-orange-600 hover:text-orange-800 transition-colors"
                            >
                              Deactivate
                            </button>
                          ) : (
                            <button
                              onClick={() => handleActivate(user.id)}
                              className="text-green-600 hover:text-green-800 transition-colors"
                            >
                              Activate
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Stats */}
          <div className="text-sm text-slate-700">
            Showing {filteredUsers.length} of {users.length} users
          </div>
        </div>
      </main>

      {/* Deactivate Modal */}
      <ConfirmModal
        isOpen={showDeactivateModal}
        title="Deactivate User"
        message="Are you sure you want to deactivate this user? They will no longer be able to access the system."
        confirmLabel="Deactivate"
        confirmButtonClass="bg-orange-600 hover:bg-orange-700"
        onConfirm={handleDeactivateConfirm}
        onCancel={() => {
          setShowDeactivateModal(false);
          setUserToDeactivate(null);
          setDeactivateReason("");
        }}
        isLoading={isDeactivating}
      >
        <div className="mt-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Reason (optional)
          </label>
          <textarea
            value={deactivateReason}
            onChange={(e) => setDeactivateReason(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary"
            placeholder="Enter reason for deactivation..."
          />
        </div>
      </ConfirmModal>
    </div>
  );
}
```

---

This is the first part of the comprehensive Module 9 implementation documentation. The document is very long, so I've provided:

1. **Overview & Architecture** - High-level design and technology stack
2. **Complete Database Schema** - All 10 collections with indexes
3. **Implementation Roadmap** - 4-phase plan
4. **9.1 User Management** - Complete backend and frontend implementation

The document continues with sections 9.2 through 9.5, API specs, testing strategy, security considerations, and deployment guide.

Would you like me to:
1. Continue with the remaining sections (9.2-9.5)?
2. Create a separate file for frontend components?
3. Add more code examples for specific features?
4. Create unit test examples?
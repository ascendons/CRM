# Field Service CRM — Implementation Plan
**Voltas-Style HVAC/Field Operations Extension**
_Prepared: 2026-04-06_

---

## Table of Contents
1. [Gap Analysis](#gap-analysis)
2. [Phase 1 — Asset & Contract Foundation](#phase-1--asset--contract-foundation)
3. [Phase 2 — Work Order Management](#phase-2--work-order-management)
4. [Phase 3 — Field Service Management](#phase-3--field-service-management)
5. [Phase 4 — Spare Parts & Field Inventory](#phase-4--spare-parts--field-inventory)
6. [Phase 5 — Procurement Enhancement](#phase-5--procurement-enhancement)
7. [Phase 6 — Dealer & Distributor Management](#phase-6--dealer--distributor-management)
8. [Phase 7 — Service Analytics & SLA Dashboards](#phase-7--service-analytics--sla-dashboards)
9. [Phase 8 — Workflow Engine & Escalation](#phase-8--workflow-engine--escalation)
10. [Implementation Sequence & Timeline](#implementation-sequence--timeline)
11. [New Collections Summary](#new-collections-summary)
12. [Architectural Reuse Guide](#architectural-reuse-guide)

---

## Gap Analysis

### What Already Exists (No Rebuild Needed)

| Module | Status | Coverage |
|---|---|---|
| Lead Management | Complete | BANT scoring, assignment, conversion |
| Sales Pipeline | Complete | 7-stage opportunities |
| Activities | Complete | Tasks, Calls, Emails, Meetings |
| Proposals / Invoices | Complete | PDF, GST, versioning, milestones |
| HRMS Core | Complete | Attendance, Leave, Shifts, Geofence |
| RBAC | Complete | Dynamic roles, permissions matrix |
| Multi-tenancy | Complete | ThreadLocal tenant isolation |
| Inventory (Basic) | Partial | Warehouses, stock, PO — no spare parts, RFQ, GRN |
| Analytics | Partial | CRM dashboards — no service KPIs |

### What Needs to Be Built

| Module | Gap Level |
|---|---|
| Asset / Equipment Registry | Not built |
| AMC / Contract Management | Not built |
| Work Order Management | Not built |
| Service Request / Complaint Portal | Not built |
| Engineer Dispatch & Scheduling | Not built |
| Geo-Tracking (field) | Not built |
| Technician Skill Matrix | Not built |
| Spare Parts Catalog (field-grade) | Not built |
| Field Parts Request workflow | Not built |
| Vendor Management (full) | Not built |
| RFQ / GRN / Rate Contracts | Not built |
| Dealer / Distributor Management | Not built |
| Service KPI Analytics | Not built |
| SLA Engine + Escalation Matrix | Not built |

---

## Phase 1 — Asset & Contract Foundation
> Prerequisite for everything else. No field service without assets and AMCs.

### 1.1 Asset / Equipment Registry

Every AC unit, compressor, chiller, or VRF system is a managed asset. Service history, warranty, and AMC linkage all live here.

#### New MongoDB Collections

**`assets`**
```
serialNo, assetCode (ASSET-2024-01-00001), model, brand,
category (AC / Chiller / VRF / AHU), installDate, warrantyExpiry,
siteAddress, accountId, contactId, assignedEngineerId,
status (Active / Decommissioned / UnderRepair), notes
```

**`asset_categories`**
```
name, description, defaultChecklistTemplateId,
requiredSkills[], maintenanceIntervalDays
```

#### Backend

| Artifact | Detail |
|---|---|
| `AssetController` | CRUD + search by account / serial / category |
| `AssetService` | Business logic, warranty expiry checks |
| `AssetRepository` | Tenant-aware MongoDB queries |
| `AssetIdGeneratorService` | Auto-increment → `ASSET-YYYY-MM-XXXXX` |
| Asset→Account link | Extend `AccountService` to include assets list endpoint |
| Warranty expiry scheduler | Daily job, fire `AssetWarrantyExpiringEvent` 30/60/90 days prior |

#### Frontend Pages

| Route | Purpose |
|---|---|
| `/assets` | List with filters: account, status, warranty expiry |
| `/assets/new` | Create asset |
| `/assets/[id]` | 360° view: details + service history + open WOs + AMC |
| `/assets/[id]/edit` | Edit asset |
| `/admin/settings/asset-categories` | Manage categories and default checklists |

---

### 1.2 AMC / Contract Management

#### New MongoDB Collections

**`contracts`**
```
contractNumber (CON-2024-01-00001), type (AMC / Warranty / Project),
accountId, assetIds[], startDate, endDate,
billingCycle (Monthly / Quarterly / Annual),
visitFrequency (per year), slaConfig { responseHrs, resolutionHrs },
penaltyClauses { perHourBreachPenalty, maxPenaltyCap },
status (Draft / Active / Expired / Renewed / Cancelled),
renewalReminderSentAt
```

**`contract_visits`**
```
contractId, visitNumber, scheduledDate, actualDate,
workOrderId, engineerId, status (Scheduled / Completed / Missed / Rescheduled)
```

**`contract_billing_cycles`**
```
contractId, cycleNumber, periodStart, periodEnd,
invoiceId, amount, status (Pending / Invoiced / Paid / Overdue)
```

#### Backend

| Artifact | Detail |
|---|---|
| `ContractController` | CRUD + renewal + billing cycle list |
| `ContractService` | SLA config feed, visit schedule generation |
| `ContractRepository` | Query by account, status, expiry window |
| `ContractIdGeneratorService` | Auto-increment → `CON-YYYY-MM-XXXXX` |
| Visit scheduler | Auto-trigger PM Work Orders on scheduled visit dates |
| Expiry alert scheduler | 30 / 60 / 90 day renewal reminders |
| Billing cycle service | Auto-generate invoice (reuse `ProposalService`) on cycle due date |

#### Frontend Pages

| Route | Purpose |
|---|---|
| `/contracts` | List with active / expiring filters |
| `/contracts/new` | Create contract with asset + SLA selection |
| `/contracts/[id]` | Details: linked assets, visit schedule, billing history, SLA summary |
| `/contracts/[id]/edit` | Edit contract |
| `/contracts/[id]/visits` | Visit calendar + completion status |

---

## Phase 2 — Work Order Management
> The heart of operations. All field activity flows through Work Orders.

### 2.1 Work Order Core

#### New MongoDB Collections

**`work_orders`**
```
woNumber (WO-2024-01-00001), type (WorkOrderType),
accountId, contactId, assetId, contractId,
assignedEngineerIds[], priority (WorkOrderPriority),
status (WorkOrderStatus), slaDeadline, slaBreached (bool),
scheduledDate, actualStartTime, actualEndTime,
symptoms, diagnosis, resolution, rootCause,
partsUsed[] { partId, qty, serialNo },
checklistTemplateId, checklistCompletedAt,
photos[] { url, caption, uploadedAt },
customerSignOff { method (OTP / Signature), verifiedAt, signatureUrl },
closureNotes, reopenCount, totalLaborHours
```

**`work_order_checklists`** (templates)
```
name, assetCategoryId, jobType (WorkOrderType),
items[] { itemCode, description, inputType (Pass/Fail/Numeric/Text),
           isMandatory, failureAction (Block / Warn) }
```

**`work_order_checklist_responses`** (per WO execution)
```
workOrderId, templateId, engineerId, startedAt, completedAt,
responses[] { itemCode, status (Pass / Fail / NA), value, note, photoUrl }
```

#### New Enums

| Enum | Values |
|---|---|
| `WorkOrderType` | Installation, PreventiveMaintenance, Breakdown, AmcVisit, Warranty, ProjectWork |
| `WorkOrderStatus` | Open, Assigned, EnRoute, OnSite, InProgress, PendingSpares, OnHold, Completed, Cancelled, Reopened |
| `WorkOrderPriority` | Low, Medium, High, Critical, Emergency |
| `ChecklistItemStatus` | Pass, Fail, NA, Pending |
| `SignOffMethod` | OTP, Signature, None |

#### Backend

| Artifact | Detail |
|---|---|
| `WorkOrderController` | Full CRUD + assign + status transitions + close |
| `WorkOrderService` | State machine, SLA calculation, auto-assignment |
| `WorkOrderRepository` | Queries by status, engineer, account, SLA breach |
| `WorkOrderIdGeneratorService` | `WO-YYYY-MM-XXXXX` |
| `ChecklistService` | Template CRUD + response recording |
| `WorkOrderAutoAssignService` | Extend `LeadAssignmentService` — match by skill + location + workload |
| SLA engine | Calculate `slaDeadline` from contract or org default on creation |
| SLA breach monitor | Scheduled job every 5 min — set `slaBreached=true`, fire event |
| Parts deduction | On WO closure, call `PartsConsumptionService` to deduct stock |
| Photo upload | Multipart endpoint, store URL in `photos[]` |
| Customer sign-off | OTP send → verify flow, or signature base64 store |

**State Machine Rules:**
```
Open → Assigned (on engineer assignment)
Assigned → EnRoute (engineer taps "On My Way")
EnRoute → OnSite (GPS geofence match OR manual)
OnSite → InProgress (checklist started)
InProgress → PendingSpares (parts request raised)
PendingSpares → InProgress (parts received)
InProgress → Completed (checklist done + customer sign-off)
Completed → Reopened (customer complaint within 7 days)
Any → Cancelled (with reason)
```

#### Frontend Pages

| Route | Purpose |
|---|---|
| `/work-orders` | List with Kanban (by status) + table view + calendar |
| `/work-orders/new` | Create WO: asset / account / contract / engineer / priority |
| `/work-orders/[id]` | WO detail: timeline, checklist progress, parts used, photos, sign-off |
| `/work-orders/[id]/checklist` | Checklist execution (mobile-optimized) |
| `/work-orders/[id]/parts` | Parts requested / consumed |
| `/admin/settings/checklists` | Checklist template management |
| `/admin/settings/checklists/new` | Create checklist template |

---

### 2.2 Complaint / Service Request Portal

#### New MongoDB Collections

**`service_requests`**
```
srNumber (SR-2024-01-00001), source (Portal / Phone / Email / WhatsApp),
accountId, contactId, assetId, description, priority,
status (Open / Acknowledged / WOCreated / Resolved / Closed),
workOrderId, slaDeadline, acknowledgedAt, resolvedAt
```

#### Backend

| Artifact | Detail |
|---|---|
| `ServiceRequestController` | Create SR, acknowledge, convert to WO, close |
| `ServiceRequestService` | Auto-acknowledgement email, SLA clock start |
| `ServiceRequestRepository` | Queries by account, status, asset |
| `ServiceRequestIdGeneratorService` | `SR-YYYY-MM-XXXXX` |

#### Frontend Pages

| Route | Purpose |
|---|---|
| `/service-requests` | SR list with status filters |
| `/service-requests/new` | Raise service request |
| `/service-requests/[id]` | SR detail + linked Work Order |

---

## Phase 3 — Field Service Management

### 3.1 Engineer Dispatch & Scheduling

#### New MongoDB Collections

**`engineer_schedules`**
```
engineerId, date, slots[] { workOrderId, startTime, endTime, status },
availability (Available / OnJob / Leave / Travel / Training)
```

**`dispatch_assignments`**
```
workOrderId, engineerId, dispatchedAt, estimatedArrival,
arrivedAt, departedAt, gpsOnDispatch { lat, lng }
```

#### Backend

| Artifact | Detail |
|---|---|
| `DispatchController` | Assign, reassign, bulk dispatch |
| `DispatchService` | Availability check (cross-ref Attendance + Leave), workload cap |
| `ScheduleService` | Day-view schedule CRUD per engineer |
| Engineer availability API | Real-time: Available / OnJob / Offline |
| WebSocket push | On assignment, push job card to engineer's mobile session |
| Reassignment audit | Every reassignment logged with reason in `AuditLog` |

#### Frontend Pages

| Route | Purpose |
|---|---|
| `/dispatch` | Drag-and-drop dispatch board (Gantt by engineer × day) |
| `/dispatch/map` | Map view: engineer locations + open WOs (Leaflet / Google Maps) |
| `/admin/engineers` | Engineer capacity: current jobs, availability, skill tags |

---

### 3.2 Geo-Tracking & Field Visibility

Extend existing GPS infrastructure (`GpsSpoofingDetector`, `OfficeLocation` geofence).

#### New MongoDB Collections

**`engineer_locations`** (TTL: 24 hours)
```
engineerId, lat, lng, accuracy, timestamp, workOrderId, batteryLevel
```

**`work_order_geo_events`**
```
workOrderId, engineerId, eventType (Arrived / Departed),
lat, lng, timestamp, geofenceMatch (bool), spoofDetected (bool)
```

#### Backend

| Artifact | Detail |
|---|---|
| `EngineerLocationController` | POST location update (engineer pushes every 2 min) |
| `GeoTrackingService` | Store to TTL collection, broadcast via WebSocket |
| Geofence auto-status | On site arrival detection → auto-update WO to `OnSite` |
| Spoof detection | Reuse `GpsSpoofingDetector` for field check-ins |

---

### 3.3 Technician Skill Matrix

#### New MongoDB Collections

**`technician_skills`**
```
userId, skillName (SplitAC / VRF / Chiller / Electrical / Refrigeration),
certificationBody, certNumber, issueDate, expiryDate,
verifiedBy, proficiencyLevel (Trainee / Competent / Expert)
```

**`training_records`**
```
userId, trainingName, trainingType (Internal / External / OEM),
completedDate, trainerName, score, passed (bool), certAttachmentUrl
```

#### Backend

| Artifact | Detail |
|---|---|
| `SkillMatrixController` | CRUD skills + training records per user |
| `SkillMatrixService` | Query available engineers by required skill |
| WO auto-assignment integration | Match `asset.category.requiredSkills` vs `technician_skills` |
| Certification expiry alerts | 30-day warning via `NotificationService` |

#### Frontend Pages

| Route | Purpose |
|---|---|
| `/admin/users/[id]/skills` | Skill matrix for a technician |
| `/admin/skill-matrix` | Org-wide skill matrix heat map |
| `/admin/users/[id]/training` | Training records and certifications |

---

## Phase 4 — Spare Parts & Field Inventory

### 4.1 Field-Grade Spare Parts Catalog

Extend existing `Product` / `DynamicProduct` entities with field-specific attributes.

#### Extend Existing Entities

**Extend `Product`:**
```
+ partNumber, compatibleModels[], partCategory (Compressor / Filter / PCB / Motor / Valve),
+ vendorId, warrantyPeriodDays, criticality (FastMoving / SlowMoving / NonStocking),
+ reorderPoint, reorderQty
```

**New: `vendor_parts`**
```
vendorId, partId, vendorPartNumber, lastPurchasePrice,
leadTimeDays, preferredVendor (bool)
```

#### Backend

| Artifact | Detail |
|---|---|
| Model compatibility search | Search parts by `compatibleModels[]` (AC model number) |
| `PartsConsumptionService` | Deduct stock on WO closure, create `StockTransaction` with `workOrderId` |
| Warranty tracking | Each issued part linked to serial number + warranty expiry |
| Auto-reorder trigger | When `stock.quantity <= reorderPoint` → create draft PO |

---

### 4.2 Field Engineer Parts Request

#### New MongoDB Collections

**`parts_requests`**
```
requestNumber, workOrderId, engineerId, requestedAt,
requestedParts[] { partId, qty, reason },
status (Pending / Approved / Rejected / Dispatched / Received),
approvedBy, warehouseId, dispatchedAt, receivedAt
```

#### Backend

| Artifact | Detail |
|---|---|
| `PartsRequestController` | Create, approve, dispatch, receive |
| `PartsRequestService` | Approval workflow, stock reservation on approval |
| Stock reservation | Reuse `StockReservation` entity on approval |
| WebSocket push | Notify engineer when parts approved and dispatched |

#### Frontend Pages

| Route | Purpose |
|---|---|
| `/work-orders/[id]/parts` | Engineer raises parts request from WO |
| `/warehouse/parts-requests` | Warehouse team view: pending approvals + dispatch queue |

---

## Phase 5 — Procurement Enhancement

### 5.1 Vendor Management

#### New MongoDB Collections

**`vendors`**
```
vendorCode (VEN-2024-01-00001), companyName, contactPerson,
email, phone, GSTIN, paymentTermsDays, creditLimit,
rating (1-5), status (Active / Inactive / Blacklisted),
categories[], bankDetails { accountNo, ifsc, bankName },
address
```

#### Backend

| Artifact | Detail |
|---|---|
| `VendorController` | Full CRUD + rating update |
| `VendorService` | Blacklist enforcement, category search |
| `VendorRepository` | Query by category, status, rating |
| `VendorIdGeneratorService` | `VEN-YYYY-MM-XXXXX` |

---

### 5.2 RFQ, GRN, Rate Contracts

#### New MongoDB Collections

**`rfqs`**
```
rfqNumber (RFQ-2024-01-00001), description,
items[] { partId, qty, specs },
vendorIds[], deadline,
responses[] { vendorId, unitPrice, deliveryDays, notes },
selectedVendorId, status (Open / Closed / Cancelled)
```

**`grns`** (Goods Receipt Notes)
```
grnNumber (GRN-2024-01-00001), poId, receivedDate, receivedBy,
lineItems[] { partId, orderedQty, receivedQty, condition (Good/Damaged/Rejected) },
qualityStatus (Accepted / PartiallyAccepted / Rejected),
remarks
```

**`rate_contracts`**
```
rcNumber (RC-2024-01-00001), vendorId,
lineItems[] { partId, agreedUnitPrice, minOrderQty },
validFrom, validTo, autoRenew (bool),
status (Active / Expired / Terminated)
```

#### Extend `PurchaseOrder`

```
+ approvalWorkflow [] { level, approverId, status, approvedAt, comments }
+ invoiceMatchStatus (Pending / Matched / Discrepancy)
+ grnId
+ vendorInvoiceNumber, vendorInvoiceDate, vendorInvoiceAmount
+ paymentStatus (Unpaid / PartiallyPaid / Paid)
+ paymentDueDate
```

#### Backend

| Artifact | Detail |
|---|---|
| `VendorController` + `RFQController` | CRUD |
| `GRNController` | Create GRN against PO, 3-way match trigger |
| `RateContractController` | CRUD + auto-PO from rate contract on reorder |
| PO approval workflow | Multi-level by amount: `< 50k → L1`, `50k-5L → L2`, `> 5L → L3` |
| Invoice matching | Compare PO qty × price vs GRN received vs vendor invoice |

#### Frontend Pages

| Route | Purpose |
|---|---|
| `/vendors` | Vendor list |
| `/vendors/[id]` | Vendor 360°: details, POs, rate contracts, rating |
| `/procurement/rfq` | RFQ list + create |
| `/procurement/rfq/[id]` | RFQ details + vendor responses comparison |
| `/procurement/grn` | GRN list + create against PO |
| `/procurement/rate-contracts` | Rate contract list + create |

---

## Phase 6 — Dealer & Distributor Management

### 6.1 Channel Partner Module

#### New MongoDB Collections

**`dealers`**
```
dealerCode (DLR-2024-01-00001), companyName,
tier (Platinum / Gold / Silver / Bronze), region, territory,
creditLimit, currentCreditUsed, contactPerson, email, phone,
GSTIN, status (Active / Inactive / Suspended),
onboardedDate, accountManagerId
```

**`dealer_orders`**
```
orderNumber, dealerId, products[] { productId, qty, unitPrice },
totalValue, creditUsed, status (Pending / Confirmed / Shipped / Delivered / Cancelled),
fulfillmentStatus, placedAt, deliveredAt
```

**`dealer_performance`**
```
dealerId, month, year,
target, actualSales, incentivesEarned,
openOrders, pendingPayments
```

#### Backend

| Artifact | Detail |
|---|---|
| `DealerController` | Full CRUD + credit block on limit breach |
| `DealerService` | Credit utilisation tracking, tier upgrade logic |
| `DealerRepository` | Query by territory, tier, status |
| `DealerIdGeneratorService` | `DLR-YYYY-MM-XXXXX` |
| Territory lead assignment | Extend `LeadAssignmentConfig` with territory→dealerId mapping |
| Performance report | Monthly aggregation per dealer |

#### Frontend Pages

| Route | Purpose |
|---|---|
| `/dealers` | Dealer list with tier / territory filters |
| `/dealers/[id]` | Dealer 360°: details, orders, performance, credit status |
| `/dealers/[id]/orders` | Order history |
| `/admin/dealer-tiers` | Tier configuration and benefit rules |

---

## Phase 7 — Service Analytics & SLA Dashboards

### 7.1 Service KPI Engine

#### Metrics to Compute

| KPI | Formula |
|---|---|
| MTTR (Mean Time To Repair) | `avg(actualEndTime - actualStartTime)` per WO |
| First Time Fix Rate | `WOs closed without reopen / total WOs closed` |
| SLA Compliance Rate | `WOs resolved within slaDeadline / total WOs` |
| Engineer Productivity | `WOs completed per engineer per period` |
| Pending TAT | `now - createdAt` for all open WOs (buckets: 0-4h, 4-8h, 8-24h, 24h+) |
| Repeat Visit Rate | `WOs on same asset within 30 days of previous close` |
| Parts Availability Rate | `Parts requests fulfilled same-day / total requests` |

#### Backend

| Artifact | Detail |
|---|---|
| `ServiceAnalyticsController` | GET endpoints under `/api/v1/analytics/service/` |
| `ServiceAnalyticsService` | MongoDB aggregation pipeline queries |
| Cache | Caffeine cache (reuse `CacheConfig`), 15-min TTL for KPIs |

#### Frontend Pages

| Route | Purpose |
|---|---|
| `/analytics/service` | Service KPI dashboard |
| — | MTTR trend line chart |
| — | SLA compliance gauge |
| — | Engineer productivity heat map |
| — | WO volume by type / priority (bar chart) |
| — | Open WO aging bucket chart |

---

### 7.2 Inventory Aging & Reorder Reports

| Report | Detail |
|---|---|
| Dead stock | Parts not moved in 90 / 180 / 360 days |
| Reorder recommendations | Parts below reorder point, suggested qty from rate contract |
| Consumption trend | Top 20 consumed parts by WO type |

#### Frontend Pages

| Route | Purpose |
|---|---|
| `/analytics/inventory` | Inventory aging + reorder dashboard |

---

## Phase 8 — Workflow Engine & Escalation

### 8.1 Escalation Matrix

#### New MongoDB Collections

**`escalation_rules`**
```
name, trigger (SLABreach / WOUnassigned / SRUnacknowledged / POPendingApproval),
conditionMinutes, level (L1 / L2 / L3),
notifyUserIds[], notificationChannels (InApp / Email / SMS),
autoEscalateAfterMinutes (for next level)
```

**`escalation_logs`**
```
ruleId, entityType, entityId, triggeredAt,
level, notifiedUserIds[], acknowledgedAt, acknowledgedBy, resolvedAt
```

#### Backend

| Artifact | Detail |
|---|---|
| `EscalationService` | Scheduled job every 5 min — evaluate all active rules |
| `EscalationController` | CRUD for rules, log viewer |
| Events | `SLABreachEvent`, `WOOverdueEvent`, `SRUnacknowledgedEvent` via `ApplicationEventPublisher` |
| Notification routing | Extend `NotificationService` with escalation channel dispatch |

#### Frontend Pages

| Route | Purpose |
|---|---|
| `/admin/settings/escalation` | Escalation rule configuration |
| `/admin/escalation-logs` | Escalation history and resolution tracking |

---

### 8.2 Multi-Level PO Approval

Reuse Leave approval workflow pattern for Purchase Orders.

| Amount Threshold | Approval Level |
|---|---|
| < ₹50,000 | L1: Direct Manager |
| ₹50,000 – ₹5,00,000 | L2: Department Head |
| > ₹5,00,000 | L3: Finance Director |

---

## Implementation Sequence & Timeline

| Phase | Modules | Backend | Frontend | Priority |
|---|---|---|---|---|
| **Phase 1** | Asset Registry + AMC/Contracts | 3 weeks | 2 weeks | P0 — Blocker |
| **Phase 2** | Work Order + Service Request | 4 weeks | 3 weeks | P0 — Core |
| **Phase 3** | FSM: Dispatch + Geo + Skill Matrix | 3 weeks | 2 weeks | P1 — Critical |
| **Phase 4** | Spare Parts (field-grade inventory) | 2 weeks | 1.5 weeks | P1 — Critical |
| **Phase 5** | Vendor + Procurement (RFQ/GRN) | 2 weeks | 2 weeks | P2 — Important |
| **Phase 6** | Dealer / Distributor | 2 weeks | 1.5 weeks | P2 — Important |
| **Phase 7** | Service Analytics + SLA Dashboards | 2 weeks | 2 weeks | P2 — Important |
| **Phase 8** | Escalation + Workflow Engine | 1.5 weeks | 1 week | P3 — Enhancement |

**Total: ~22 weeks backend / ~17 weeks frontend** (parallel teams)

**Recommended start sequence:**
1. Phase 1 → Asset Registry first (every WO references an asset)
2. Phase 1 → AMC Contracts (defines SLA config that feeds WO)
3. Phase 2 → Work Order core (central operational entity)
4. Phases 3–8 can be built incrementally without breaking existing functionality

---

## New Collections Summary

| Collection | Phase | Notes |
|---|---|---|
| `assets` | 1 | Core equipment registry |
| `asset_categories` | 1 | Categories with checklists + required skills |
| `contracts` | 1 | AMC / warranty / project contracts |
| `contract_visits` | 1 | Scheduled PM visit tracking |
| `contract_billing_cycles` | 1 | Billing schedule per contract |
| `service_requests` | 2 | Customer complaints / SRs |
| `work_orders` | 2 | Core work order entity |
| `work_order_checklists` | 2 | Checklist templates per job type |
| `work_order_checklist_responses` | 2 | Per-WO execution responses |
| `engineer_schedules` | 3 | Daily dispatch schedule per engineer |
| `dispatch_assignments` | 3 | Dispatch records with GPS |
| `engineer_locations` | 3 | TTL-indexed real-time GPS (24h rolling) |
| `work_order_geo_events` | 3 | Arrived/Departed site events |
| `technician_skills` | 3 | Skills and certifications per user |
| `training_records` | 3 | Training history |
| `vendor_parts` | 4 | Vendor-to-part price mapping |
| `parts_requests` | 4 | Field engineer parts requests |
| `vendors` | 5 | Vendor master |
| `rfqs` | 5 | Request for Quotation |
| `grns` | 5 | Goods Receipt Notes |
| `rate_contracts` | 5 | Vendor rate contracts |
| `dealers` | 6 | Dealer / distributor master |
| `dealer_orders` | 6 | Orders placed by dealers |
| `dealer_performance` | 6 | Monthly performance tracking |
| `escalation_rules` | 8 | Escalation trigger configuration |
| `escalation_logs` | 8 | Escalation history |

**Total new collections: 26**
**Total collections after implementation: 64 (existing 38 + new 26)**

---

## Architectural Reuse Guide

| Existing Pattern | Reused In | How |
|---|---|---|
| `LeadAssignmentService` auto-assign engine | WO auto-assignment | Match engineer by skill + geo + workload |
| `AttendanceService` GPS + geofence | Engineer site check-in | Re-trigger on WO arrival |
| `GpsSpoofingDetector` | Field geo-events | Validate engineer GPS on site arrival |
| `LeaveService` approval workflow | PO multi-level approval | Same state machine, different approvers |
| `ProposalService` invoice generation | AMC billing cycles | Generate invoice per billing cycle |
| `NotificationService` + WebSocket | SLA breach, WO assignment push | New event types wired to existing delivery |
| `ApplicationEventPublisher` | `WOCreatedEvent`, `SLABreachEvent` | New event classes, existing infra |
| `BaseTenantService` | All new services | All new entities extend base |
| `TenantAwareMongoTemplate` | All new repositories | Automatic tenant isolation |
| `AuditLogService` + AOP | All new controllers | `@ActivityTracking` annotation |
| `CacheConfig` Caffeine | Service KPI dashboard | 15-min TTL cache on analytics |
| Sequence-based ID generator pattern | WO, Asset, SR, Vendor, Dealer IDs | Same `SequenceRepository` pattern |
| `CustomPermissionEvaluator` | New module permissions | Add new module keys |
| `PredefinedRoles` | Field Engineer, Dispatch, Warehouse roles | New predefined roles |

---

## New Predefined Roles to Add

| Role | Key Permissions |
|---|---|
| `FIELD_ENGINEER` | View/update assigned WOs, record checklist, upload photos, request parts |
| `DISPATCH_MANAGER` | Assign/reassign WOs, view dispatch board, engineer availability |
| `WAREHOUSE_MANAGER` | Approve parts requests, manage stock, create GRN |
| `SERVICE_MANAGER` | All WO ops, SLA monitoring, engineer management |
| `DEALER` | View own orders, raise service requests, view invoices |
| `VENDOR` | (Future) View own POs, submit invoices |

---

## New Module Permission Keys

```
WORK_ORDERS      — view, create, edit, delete, assign, close
ASSETS           — view, create, edit, delete
CONTRACTS        — view, create, edit, delete, renew
SERVICE_REQUESTS — view, create, edit, close
DISPATCH         — view, assign, reassign
SKILL_MATRIX     — view, edit
VENDORS          — view, create, edit, delete
PROCUREMENT      — view, create, approve, receive
DEALERS          — view, create, edit, delete
SERVICE_ANALYTICS — view
ESCALATION       — view, configure
```

---

_End of Implementation Plan_

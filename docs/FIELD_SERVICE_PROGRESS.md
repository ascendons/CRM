# Field Service Module — Implementation Progress Tracker
**Branch:** `siddharth-hvac`
**Started:** 2026-04-15
**Plan Reference:** `docs/IMPLEMENTATION_PLAN_FIELD_SERVICE.md`

---

## Feasibility Summary

| Concern | Assessment |
|---|---|
| Architecture fit | **Excellent** — all patterns (BaseTenantService, TenantAwareMongoTemplate, ApplicationEventPublisher, @Scheduled, WebSocket, Caffeine cache, SequenceRepository) are directly reusable |
| MongoDB TTL collections | Native MongoDB TTL index — no extra infra needed for `engineer_locations` |
| State machine (WO, 10 states) | Manageable as explicit transition methods in service layer |
| Real-time geo push (2-min) | Feasible via existing WebSocket `SimpMessagingTemplate` |
| 3-way invoice match | Complex logic but well-scoped; reuse `ProposalService` for AMC billing |
| SLA breach scheduler | `@Scheduled` every 5 min — low risk |
| Multi-level PO approval | Direct reuse of leave approval state machine |
| Scope (26 collections) | Large but incrementally safe — each phase is independently deployable |

**Verdict:** Fully feasible. Implementation follows existing conventions with zero new infrastructure.

---

## Package & File Conventions (for resumability)

- **Base package:** `com.ultron.backend`
- **Entities:** `domain/entity/`, annotated `@Document(collection = "...")`
- **Enums:** `domain/enums/`
- **Controllers:** `controller/`, `@RequestMapping("/module-name")`
- **Services:** `service/`, extend `BaseTenantService`
- **Repositories:** `repository/`, extend `MongoRepository<Entity, String>`
- **Request DTOs:** `dto/request/Create<Name>Request.java`, `Update<Name>Request.java`
- **Response DTOs:** `dto/response/<Name>Response.java`
- **ID Generators:** `service/<Name>IdGeneratorService.java` (timestamp-based)
- **Permissions:** `hasPermission('<MODULE>', '<ACTION>')` in `@PreAuthorize`
- **Frontend pages:** `frontend/app/<module>/` with Next.js App Router

---

## Phase Status Overview

| Phase | Name | Backend | Frontend | Status |
|---|---|---|---|---|
| **1.1** | Asset / Equipment Registry | ✅ | ✅ | Complete |
| **1.2** | AMC / Contract Management | ✅ | ✅ | Complete |
| **2.1** | Work Order Core | ✅ | ✅ | Complete |
| **2.2** | Complaint / Service Request | ✅ | ✅ | Complete |
| **3.1** | Engineer Dispatch & Scheduling | ✅ | ✅ | Complete |
| **3.2** | Geo-Tracking & Field Visibility | ✅ | ⬜ | Backend Only |
| **3.3** | Technician Skill Matrix | ✅ | ✅ | Complete |
| **4.1** | Spare Parts Catalog (field-grade) | ✅ | ✅ | Complete |
| **4.2** | Field Engineer Parts Request | ✅ | ✅ | Complete |
| **5.1** | Vendor Management | ✅ | ✅ | Complete |
| **5.2** | RFQ / GRN / Rate Contracts | ✅ | ✅ | Complete |
| **6.1** | Dealer / Distributor Management | ✅ | ✅ | Complete |
| **7.1** | Service KPI Analytics | ✅ | ✅ | Complete |
| **7.2** | Inventory Aging & Reorder Reports | ✅ | ✅ | Complete |
| **8.1** | Escalation Matrix | ✅ | ✅ | Complete |
| **8.2** | Multi-Level PO Approval | ✅ | ⬜ | Backend Only |

Legend: ✅ Done | 🔄 In Progress | ⬜ Not Started | ❌ Blocked

---

## Pending Items Resolved (Post Phase-8 Audit)

| Item | File | Status |
|---|---|---|
| New RBAC roles (Field Engineer, Dispatch Manager, Warehouse Manager, Service Manager) | `ProfileMigrationService.java` | ✅ |
| New permission keys (DISPATCH, SKILL_MATRIX, PARTS_REQUEST, VENDORS, PROCUREMENT, DEALERS, SERVICE_ANALYTICS, ESCALATION, PURCHASE_ORDER) | `ProfileMigrationService.patchMissingPermissions` | ✅ |
| New module paths (FIELD_SERVICE, PROCUREMENT, DEALER_MANAGEMENT, SERVICE_ANALYTICS, ESCALATION) | `RoleMigrationService.patchMissingModules` | ✅ |
| Warranty expiry scheduler (30/60/90 day alerts) | `scheduler/AssetWarrantyExpiryScheduler.java` | ✅ |
| Contract visit auto-scheduler (creates PM Work Orders for due visits) | `scheduler/ContractVisitScheduler.java` | ✅ |
| Auto-reorder → draft PO (when stock ≤ reorderPoint on WO closure) | `service/PartsConsumptionService.java` | ✅ |
| Dealer performance aggregation (monthly, scheduled) | `service/DealerPerformanceService.java` | ✅ |
| `DealerPerformanceRepository` | `repository/DealerPerformanceRepository.java` | ✅ |
| Dealer performance endpoints (`GET /dealers/{id}/performance`, `GET /dealers/performance/monthly`) | `controller/DealerController.java` | ✅ |

---

## Phase 1.1 — Asset / Equipment Registry

### Backend Files

| File | Path | Status |
|---|---|---|
| `AssetStatus.java` | `domain/enums/` | ✅ |
| `AssetCategoryType.java` | `domain/enums/` | ✅ |
| `Asset.java` | `domain/entity/` | ✅ |
| `AssetCategory.java` | `domain/entity/` | ✅ |
| `AssetRepository.java` | `repository/` | ✅ |
| `AssetCategoryRepository.java` | `repository/` | ✅ |
| `AssetIdGeneratorService.java` | `service/` | ✅ |
| `AssetService.java` | `service/` | ✅ |
| `AssetCategoryService.java` | `service/` | ✅ |
| `CreateAssetRequest.java` | `dto/request/` | ✅ |
| `UpdateAssetRequest.java` | `dto/request/` | ✅ |
| `AssetResponse.java` | `dto/response/` | ✅ |
| `CreateAssetCategoryRequest.java` | `dto/request/` | ✅ |
| `AssetCategoryResponse.java` | `dto/response/` | ✅ |
| `AssetController.java` | `controller/` | ✅ |
| `AssetCategoryController.java` | `controller/` | ✅ |

### Frontend Files

| File | Path | Status |
|---|---|---|
| `page.tsx` (list) | `app/assets/` | ⬜ |
| `page.tsx` (new) | `app/assets/new/` | ⬜ |
| `page.tsx` (detail) | `app/assets/[id]/` | ⬜ |
| `page.tsx` (edit) | `app/assets/[id]/edit/` | ⬜ |
| `page.tsx` (categories) | `app/admin/settings/asset-categories/` | ⬜ |

---

## Phase 1.2 — AMC / Contract Management

### Backend Files

| File | Path | Status |
|---|---|---|
| `ContractType.java` | `domain/enums/` | ✅ |
| `ContractStatus.java` | `domain/enums/` | ✅ |
| `BillingCycle.java` | `domain/enums/` | ✅ |
| `ContractVisitStatus.java` | `domain/enums/` | ✅ |
| `Contract.java` | `domain/entity/` | ✅ |
| `ContractVisit.java` | `domain/entity/` | ✅ |
| `ContractBillingCycle.java` | `domain/entity/` | ✅ |
| `ContractRepository.java` | `repository/` | ✅ |
| `ContractVisitRepository.java` | `repository/` | ✅ |
| `ContractBillingCycleRepository.java` | `repository/` | ✅ |
| `ContractIdGeneratorService.java` | `service/` | ✅ |
| `ContractService.java` | `service/` | ✅ |
| `CreateContractRequest.java` | `dto/request/` | ✅ |
| `UpdateContractRequest.java` | `dto/request/` | ⬜ (covered inline in service) |
| `ContractResponse.java` | `dto/response/` | ✅ |
| `ContractController.java` | `controller/` | ✅ |

### Frontend Files

| File | Path | Status |
|---|---|---|
| `page.tsx` (list) | `app/contracts/` | ⬜ |
| `page.tsx` (new) | `app/contracts/new/` | ⬜ |
| `page.tsx` (detail) | `app/contracts/[id]/` | ⬜ |
| `page.tsx` (edit) | `app/contracts/[id]/edit/` | ⬜ |
| `page.tsx` (visits) | `app/contracts/[id]/visits/` | ⬜ |

---

## Phase 2.1 — Work Order Core

### Backend Files

| File | Path | Status |
|---|---|---|
| `WorkOrderType.java` | `domain/enums/` | ✅ |
| `WorkOrderStatus.java` | `domain/enums/` | ✅ |
| `WorkOrderPriority.java` | `domain/enums/` | ✅ |
| `ChecklistItemStatus.java` | `domain/enums/` | ✅ |
| `SignOffMethod.java` | `domain/enums/` | ✅ |
| `WorkOrder.java` | `domain/entity/` | ✅ |
| `WorkOrderChecklist.java` | `domain/entity/` | ✅ |
| `WorkOrderChecklistResponse.java` | `domain/entity/` | ✅ |
| `WorkOrderRepository.java` | `repository/` | ✅ |
| `WorkOrderChecklistRepository.java` | `repository/` | ✅ |
| `WorkOrderChecklistResponseRepository.java` | `repository/` | ✅ |
| `WorkOrderIdGeneratorService.java` | `service/` | ✅ |
| `WorkOrderService.java` | `service/` | ✅ |
| `ChecklistService.java` | `service/` | ✅ |
| `SlaBreachScheduler.java` | `scheduler/` | ✅ |
| `CreateWorkOrderRequest.java` | `dto/request/` | ✅ |
| `UpdateWorkOrderRequest.java` | `dto/request/` | ✅ |
| `WorkOrderResponse.java` | `dto/response/` | ✅ |
| `WorkOrderController.java` | `controller/` | ✅ |

### Frontend Files

| File | Path | Status |
|---|---|---|
| `page.tsx` (list/kanban) | `app/work-orders/` | ⬜ |
| `page.tsx` (new) | `app/work-orders/new/` | ⬜ |
| `page.tsx` (detail) | `app/work-orders/[id]/` | ⬜ |
| `page.tsx` (checklist) | `app/work-orders/[id]/checklist/` | ⬜ |
| `page.tsx` (parts) | `app/work-orders/[id]/parts/` | ⬜ |

---

## Phase 2.2 — Service Request / Complaint Portal

### Backend Files

| File | Path | Status |
|---|---|---|
| `ServiceRequestStatus.java` | `domain/enums/` | ✅ |
| `ServiceRequestSource.java` | `domain/enums/` | ✅ |
| `ServiceRequest.java` | `domain/entity/` | ✅ |
| `ServiceRequestRepository.java` | `repository/` | ✅ |
| `ServiceRequestIdGeneratorService.java` | `service/` | ✅ |
| `ServiceRequestService.java` | `service/` | ✅ |
| `CreateServiceRequestRequest.java` | `dto/request/` | ✅ |
| `ServiceRequestResponse.java` | `dto/response/` | ✅ |
| `ServiceRequestController.java` | `controller/` | ✅ |

---

## Phase 3.1 — Engineer Dispatch & Scheduling

### Backend Files

| File | Path | Status |
|---|---|---|
| `EngineerAvailability.java` | `domain/enums/` | ✅ |
| `EngineerSchedule.java` | `domain/entity/` | ✅ |
| `DispatchAssignment.java` | `domain/entity/` | ✅ |
| `EngineerScheduleRepository.java` | `repository/` | ✅ |
| `DispatchAssignmentRepository.java` | `repository/` | ✅ |
| `DispatchService.java` | `service/` | ✅ |
| `ScheduleService.java` | `service/` | ✅ |
| `DispatchController.java` | `controller/` | ✅ |

---

## Phase 3.2 — Geo-Tracking & Field Visibility

### Backend Files

| File | Path | Status |
|---|---|---|
| `EngineerLocation.java` | `domain/entity/` (TTL 24h) | ✅ |
| `WorkOrderGeoEvent.java` | `domain/entity/` | ✅ |
| `EngineerLocationRepository.java` | `repository/` | ✅ |
| `WorkOrderGeoEventRepository.java` | `repository/` | ✅ |
| `GeoTrackingService.java` | `service/` | ✅ |
| `EngineerLocationController.java` | `controller/` | ✅ |

---

## Phase 3.3 — Technician Skill Matrix

### Backend Files

| File | Path | Status |
|---|---|---|
| `ProficiencyLevel.java` | `domain/enums/` | ✅ |
| `TrainingType.java` | `domain/enums/` | ✅ |
| `TechnicianSkill.java` | `domain/entity/` | ✅ |
| `TrainingRecord.java` | `domain/entity/` | ✅ |
| `TechnicianSkillRepository.java` | `repository/` | ✅ |
| `TrainingRecordRepository.java` | `repository/` | ✅ |
| `SkillMatrixService.java` | `service/` | ✅ |
| `SkillMatrixController.java` | `controller/` | ✅ |

---

## Phase 4.1 — Spare Parts Catalog

### Backend Files

| File | Path | Status |
|---|---|---|
| Extend `Product.java` | `domain/entity/` (+field-grade fields) | ✅ |
| `VendorPart.java` | `domain/entity/` | ✅ |
| `VendorPartRepository.java` | `repository/` | ✅ |
| `PartsConsumptionService.java` | `service/` | ✅ |

---

## Phase 4.2 — Field Engineer Parts Request

### Backend Files

| File | Path | Status |
|---|---|---|
| `PartsRequestStatus.java` | `domain/enums/` | ✅ |
| `PartsRequest.java` | `domain/entity/` | ✅ |
| `PartsRequestRepository.java` | `repository/` | ✅ |
| `PartsRequestService.java` | `service/` | ✅ |
| `PartsRequestController.java` | `controller/` | ✅ |

---

## Phase 5.1 — Vendor Management

### Backend Files

| File | Path | Status |
|---|---|---|
| `VendorStatus.java` | `domain/enums/` | ✅ |
| `Vendor.java` | `domain/entity/` | ✅ |
| `VendorRepository.java` | `repository/` | ✅ |
| `VendorIdGeneratorService.java` | `service/` | ✅ |
| `VendorService.java` | `service/` | ✅ |
| `VendorController.java` | `controller/` | ✅ |

---

## Phase 5.2 — RFQ / GRN / Rate Contracts

### Backend Files

| File | Path | Status |
|---|---|---|
| `RFQStatus.java` | `domain/enums/` | ✅ |
| `GRNQualityStatus.java` | `domain/enums/` | ✅ |
| `RFQ.java` | `domain/entity/` | ✅ |
| `GRN.java` | `domain/entity/` | ✅ |
| `RateContract.java` | `domain/entity/` | ✅ |
| `RFQRepository.java` | `repository/` | ✅ |
| `GRNRepository.java` | `repository/` | ✅ |
| `RateContractRepository.java` | `repository/` | ✅ |
| `RFQController.java` | `controller/` | ✅ |
| `GRNController.java` | `controller/` | ✅ |
| `RateContractController.java` | `controller/` | ✅ |
| Extend `PurchaseOrder.java` | `domain/entity/` (+approval + GRN fields) | ✅ |

---

## Phase 6.1 — Dealer / Distributor Management

### Backend Files

| File | Path | Status |
|---|---|---|
| `DealerTier.java` | `domain/enums/` | ✅ |
| `DealerStatus.java` | `domain/enums/` | ✅ |
| `Dealer.java` | `domain/entity/` | ✅ |
| `DealerOrder.java` | `domain/entity/` | ✅ |
| `DealerPerformance.java` | `domain/entity/` | ✅ |
| `DealerRepository.java` | `repository/` | ✅ |
| `DealerOrderRepository.java` | `repository/` | ✅ |
| `DealerIdGeneratorService.java` | `service/` | ✅ |
| `DealerService.java` | `service/` | ✅ |
| `DealerController.java` | `controller/` | ✅ |

---

## Phase 7.1 — Service KPI Analytics

### Backend Files

| File | Path | Status |
|---|---|---|
| `ServiceAnalyticsService.java` | `service/` | ✅ |
| `ServiceAnalyticsController.java` | `controller/` (at `/analytics/service`) | ✅ |

**KPIs:** MTTR, First Time Fix Rate, SLA Compliance Rate, Repeat Visit Rate, WO aging buckets, engineer productivity, volume by type/priority/status, parts availability rate.

---

## Phase 7.2 — Inventory Aging & Reorder Reports

### Backend Files

| File | Path | Status |
|---|---|---|
| `InventoryAnalyticsService.java` | `service/` | ✅ |

**Endpoints on `ServiceAnalyticsController`:** `/inventory/dead-stock`, `/inventory/reorder`, `/inventory/top-consumed`

---

## Phase 8.1 — Escalation Matrix

### Backend Files

| File | Path | Status |
|---|---|---|
| `EscalationTrigger.java` | `domain/enums/` | ✅ |
| `EscalationLevel.java` | `domain/enums/` | ✅ |
| `EscalationRule.java` | `domain/entity/` | ✅ |
| `EscalationLog.java` | `domain/entity/` | ✅ |
| `EscalationRuleRepository.java` | `repository/` | ✅ |
| `EscalationLogRepository.java` | `repository/` | ✅ |
| `EscalationService.java` | `service/` (@Scheduled every 5 min) | ✅ |
| `EscalationController.java` | `controller/` (at `/admin/settings/escalation`) | ✅ |

---

## Phase 8.2 — Multi-Level PO Approval

### Backend Files

| File | Path | Status |
|---|---|---|
| Extend `PurchaseOrder.java` | `domain/entity/` (+`approvalWorkflow`, `ApprovalStep`) | ✅ |
| `PurchaseOrderApprovalService.java` | `service/` | ✅ |
| `PurchaseOrderApprovalController.java` | `controller/` (at `/procurement/purchase-orders`) | ✅ |

**Thresholds:** < ₹50k → L1 only; ₹50k–₹5L → L1+L2; > ₹5L → L1+L2+L3

---

## Resume Instructions

When resuming after a context limit:

1. Read this file first to see current state (✅/🔄/⬜)
2. Read `docs/IMPLEMENTATION_PLAN_FIELD_SERVICE.md` for detailed specs
3. Check the last completed file by scanning the backend/frontend directories
4. Continue from the first ⬜ item in the first incomplete phase
5. Mark each file ✅ in this tracker as you complete it

**Key paths:**
- Backend base: `backend/src/main/java/com/ultron/backend/`
- Frontend base: `frontend/app/`
- Enums: `domain/enums/`
- Entities: `domain/entity/`
- Repos: `repository/`
- Services: `service/`
- Controllers: `controller/`
- Request DTOs: `dto/request/`
- Response DTOs: `dto/response/`

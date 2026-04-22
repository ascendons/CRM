# Bitrix24 Gap — Implementation Plan
**Branch:** `master` (feature branches per phase)  
**Reference:** Bitrix24 feature comparison dated 2026-04-20  
**Conventions:** Java 17 + Spring Boot 3.4.2 · Next.js 15 App Router · MongoDB · Tailwind CSS 4

---

## How to Use This File

1. Pick the next `⬜ Not Started` phase
2. Create a feature branch: `git checkout -b <phase-branch-name>`
3. Implement backend → frontend in the order listed
4. Mark each item `✅` when done
5. Update **Phase Status Overview** table

---

## Phase Status Overview

| Phase | Name | Priority | Backend | Frontend | Status |
|---|---|---|---|---|---|
| **P1** | Project & Task Management | 🔴 High | ✅ | ✅ | ✅ Completed |
| **P2** | Task Time Tracking & Workload | 🔴 High | ✅ | ✅ | ✅ Completed |
| **P3** | Knowledge Base | 🔴 High | ✅ | ✅ | ✅ Completed |
| **P4** | Email Marketing Campaigns | 🔴 High | — | — | ⏭ Skipped |
| **P5** | SMS Marketing Campaigns | 🔴 High | — | — | ⏭ Skipped |
| **P6** | Web Form & Landing Page Builder | 🔴 High | ✅ | ✅ | ✅ Completed |
| **P7** | Omnichannel Inbox | 🔴 High | — | — | ⏭ Skipped |
| **P8** | Telephony / VoIP Integration | 🔴 High | — | — | ⏭ Skipped |
| **P9** | Performance Reviews & OKRs | 🟡 Medium | ⬜ | ⬜ | Not Started |
| **P10** | Employee Onboarding / Offboarding | 🟡 Medium | ⬜ | ⬜ | Not Started |
| **P11** | Document Storage & Collaboration | 🟡 Medium | ⬜ | ⬜ | Not Started |
| **P12** | Recurring Tasks & Dependencies | 🟡 Medium | ⬜ | ⬜ | Not Started |
| **P13** | Company Activity Feed / Intranet | 🟡 Medium | ⬜ | ⬜ | Not Started |
| **P14** | Multi-Currency Support | 🟡 Medium | ⬜ | ⬜ | Not Started |
| **P15** | E-Signature on Documents | 🟡 Medium | ⬜ | ⬜ | Not Started |
| **P16** | Custom Report Builder | 🟡 Medium | ⬜ | ⬜ | Not Started |
| **P17** | Google / Outlook Calendar Sync | 🟢 Low | ⬜ | ⬜ | Not Started |
| **P18** | Poll / Survey Module | 🟢 Low | ⬜ | ⬜ | Not Started |
| **P19** | Customer Self-Service Portal | 🟢 Low | ⬜ | ⬜ | Not Started |
| **P20** | AI CoPilot (Call + CRM) | 🟢 Low | ⬜ | ⬜ | Not Started |

---

## Phase P1 — Project & Task Management

**Branch:** `feature/project-management`  
**Bitrix24 equivalent:** Projects, Tasks, Kanban, Gantt, Scrum  
**Why first:** Core productivity gap; required by PM and ops teams before marketing features.

### New MongoDB Collections
| Collection | Purpose |
|---|---|
| `projects` | Project header, milestones, budget, dates |
| `project_tasks` | Tasks linked to a project (separate from Activity tasks) |
| `task_comments` | Comments on tasks |

### Backend Files

| File | Path | Status |
|---|---|---|
| `ProjectStatus.java` | `domain/enums/` | ⬜ |
| `TaskPriority.java` | `domain/enums/` | ⬜ |
| `TaskStatus.java` | `domain/enums/` | ⬜ |
| `Project.java` | `domain/entity/` — fields: projectId, name, description, status, ownerId, memberIds, startDate, dueDate, budget, milestones[], tags[], tenantId, isDeleted, createdAt, createdBy | ⬜ |
| `ProjectTask.java` | `domain/entity/` — fields: taskId, projectId, title, description, assigneeIds, priority, status, parentTaskId (for subtasks), dueDate, estimatedHours, completionPct, checklistItems[], attachments[], tenantId, isDeleted | ⬜ |
| `TaskComment.java` | `domain/entity/` — fields: taskId, authorId, body, mentions[], createdAt | ⬜ |
| `ProjectRepository.java` | `repository/` | ⬜ |
| `ProjectTaskRepository.java` | `repository/` | ⬜ |
| `TaskCommentRepository.java` | `repository/` | ⬜ |
| `ProjectIdGeneratorService.java` | `service/` — format: `PROJ-YYYY-MM-NNNNN` | ⬜ |
| `TaskIdGeneratorService.java` | `service/` — format: `TASK-YYYY-MM-NNNNN` | ⬜ |
| `ProjectService.java` | `service/` — CRUD, add/remove members, update status | ⬜ |
| `ProjectTaskService.java` | `service/` — CRUD, subtask support, status transitions, bulk reorder | ⬜ |
| `CreateProjectRequest.java` | `dto/request/` | ⬜ |
| `UpdateProjectRequest.java` | `dto/request/` | ⬜ |
| `CreateProjectTaskRequest.java` | `dto/request/` | ⬜ |
| `UpdateProjectTaskRequest.java` | `dto/request/` | ⬜ |
| `ProjectResponse.java` | `dto/response/` | ⬜ |
| `ProjectTaskResponse.java` | `dto/response/` | ⬜ |
| `ProjectController.java` | `controller/` — `GET/POST /projects`, `GET/PUT/DELETE /projects/{id}`, `POST /projects/{id}/members`, `GET /projects/{id}/tasks` | ⬜ |
| `ProjectTaskController.java` | `controller/` — `GET/POST /project-tasks`, `GET/PUT/DELETE /project-tasks/{id}`, `POST /project-tasks/{id}/comments`, `POST /project-tasks/{id}/status` | ⬜ |

### Frontend Files

| File | Path | Status |
|---|---|---|
| `page.tsx` (project list) | `app/projects/` — card grid, filter by status, "New Project" button | ⬜ |
| `page.tsx` (new project) | `app/projects/new/` — form: name, description, dates, members, budget | ⬜ |
| `page.tsx` (project detail) | `app/projects/[id]/` — tabs: Overview, Kanban, List, Gantt | ⬜ |
| `page.tsx` (kanban view) | `app/projects/[id]/kanban/` — drag-and-drop columns by status | ⬜ |
| `page.tsx` (gantt view) | `app/projects/[id]/gantt/` — timeline bars using CSS grid (no library) | ⬜ |
| `page.tsx` (task detail) | `app/projects/[id]/tasks/[taskId]/` — full task view with comments, subtasks, checklist | ⬜ |
| `projects.ts` | `lib/` — service functions for all project API calls | ⬜ |

### RBAC
- New module: `PROJECTS`
- Permission keys: `VIEW`, `CREATE`, `EDIT`, `DELETE`, `MANAGE_MEMBERS`
- Add to `ProfileMigrationService.patchMissingPermissions`
- Add to `RoleMigrationService.patchMissingModules`

---

## Phase P2 — Task Time Tracking & Workload Management

**Branch:** `feature/time-tracking`  
**Bitrix24 equivalent:** Time tracking, billable hours, workload view  
**Depends on:** P1 (ProjectTask entity)

### New MongoDB Collections
| Collection | Purpose |
|---|---|
| `time_entries` | Time logged against a task or work order |

### Backend Files

| File | Path | Status |
|---|---|---|
| `TimeEntryType.java` | `domain/enums/` — BILLABLE, NON_BILLABLE, INTERNAL | ⬜ |
| `TimeEntry.java` | `domain/entity/` — fields: entryId, userId, taskId, projectId, workOrderId, description, startTime, endTime, durationMinutes, type, isBillable, tenantId, createdAt | ⬜ |
| `TimeEntryRepository.java` | `repository/` — `findByTenantIdAndUserId`, `findByTenantIdAndTaskId`, `findByTenantIdAndDateBetween` | ⬜ |
| `TimeEntryService.java` | `service/` — start timer, stop timer, manual entry, get summary by user/project/date range | ⬜ |
| `CreateTimeEntryRequest.java` | `dto/request/` | ⬜ |
| `TimeEntryResponse.java` | `dto/response/` | ⬜ |
| `WorkloadSummary.java` | `dto/response/` — userId, userName, assignedTasks, completedTasks, totalHoursLogged, pendingHours | ⬜ |
| `TimeEntryController.java` | `controller/` — `POST /time-entries`, `GET /time-entries?userId=&from=&to=`, `GET /time-entries/workload?date=`, `POST /time-entries/{id}/stop` | ⬜ |

### Frontend Files

| File | Path | Status |
|---|---|---|
| `page.tsx` (my timesheets) | `app/timesheets/` — weekly grid, daily entries, total hours | ⬜ |
| `page.tsx` (workload) | `app/projects/workload/` — team workload heatmap by person/week | ⬜ |
| `timesheets.ts` | `lib/` — service functions | ⬜ |
| Timer widget | `app/components/TaskTimer.tsx` — start/stop timer, shows running time, links to task | ⬜ |

---

## Phase P3 — Knowledge Base

**Branch:** `feature/knowledge-base`  
**Bitrix24 equivalent:** Knowledge Base, internal wiki, searchable articles  
**Why high priority:** Needed for onboarding, SOPs, product docs — zero dependency on other phases.

### New MongoDB Collections
| Collection | Purpose |
|---|---|
| `kb_categories` | Top-level knowledge base categories |
| `kb_articles` | Articles within categories |

### Backend Files

| File | Path | Status |
|---|---|---|
| `KbArticleStatus.java` | `domain/enums/` — DRAFT, PUBLISHED, ARCHIVED | ⬜ |
| `KbCategory.java` | `domain/entity/` — categoryId, name, description, parentCategoryId, icon, sortOrder, tenantId, isDeleted | ⬜ |
| `KbArticle.java` | `domain/entity/` — articleId, categoryId, title, slug, body (HTML/Markdown), authorId, status, tags[], viewCount, searchKeywords[], tenantId, isDeleted, publishedAt | ⬜ |
| `KbCategoryRepository.java` | `repository/` | ⬜ |
| `KbArticleRepository.java` | `repository/` — `findByTenantIdAndStatus`, `findByTenantIdAndCategoryId`, full-text search via `$text` index | ⬜ |
| `KbArticleIdGeneratorService.java` | `service/` | ⬜ |
| `KbService.java` | `service/` — CRUD for categories and articles, publish/archive, search, increment view count | ⬜ |
| `CreateKbArticleRequest.java` | `dto/request/` | ⬜ |
| `KbArticleResponse.java` | `dto/response/` | ⬜ |
| `KbController.java` | `controller/` — `GET /kb/categories`, `GET /kb/articles`, `GET /kb/articles/{id}`, `GET /kb/search?q=`, `POST /kb/articles`, `PUT /kb/articles/{id}`, `POST /kb/articles/{id}/publish` | ⬜ |

### Frontend Files

| File | Path | Status |
|---|---|---|
| `page.tsx` (KB home) | `app/knowledge-base/` — category cards, search bar, recent articles | ⬜ |
| `page.tsx` (category) | `app/knowledge-base/[categoryId]/` — article list with excerpts | ⬜ |
| `page.tsx` (article view) | `app/knowledge-base/articles/[id]/` — rendered HTML body, breadcrumb, view count | ⬜ |
| `page.tsx` (article editor) | `app/knowledge-base/articles/new/` and `/[id]/edit/` — rich text editor (use `<textarea>` with markdown preview) | ⬜ |
| `knowledge-base.ts` | `lib/` — service functions | ⬜ |

---

## Phase P4 — Email Marketing Campaigns

**Branch:** `feature/email-marketing`  
**Bitrix24 equivalent:** Email campaigns, drip sequences, newsletter templates  
**External dependency:** SMTP provider (SendGrid / AWS SES — config via env vars)

### New MongoDB Collections
| Collection | Purpose |
|---|---|
| `email_campaigns` | Campaign definition: name, subject, template, audience, schedule |
| `email_campaign_logs` | Per-recipient send/open/click tracking |

### Backend Files

| File | Path | Status |
|---|---|---|
| `CampaignStatus.java` | `domain/enums/` — DRAFT, SCHEDULED, RUNNING, PAUSED, COMPLETED, FAILED | ⬜ |
| `CampaignAudienceType.java` | `domain/enums/` — ALL_CONTACTS, ALL_LEADS, SEGMENT, MANUAL_LIST | ⬜ |
| `EmailCampaign.java` | `domain/entity/` — campaignId, name, subject, htmlBody, senderName, senderEmail, audienceType, segmentFilter, recipientIds[], scheduledAt, status, stats{sent,opened,clicked,bounced}, tenantId, isDeleted | ⬜ |
| `EmailCampaignLog.java` | `domain/entity/` — campaignId, recipientId, recipientEmail, sentAt, openedAt, clickedAt, bounced, unsubscribed | ⬜ |
| `EmailCampaignRepository.java` | `repository/` | ⬜ |
| `EmailCampaignLogRepository.java` | `repository/` | ⬜ |
| `EmailCampaignService.java` | `service/` — CRUD, schedule, send (batch with rate limiting), track opens via pixel, update stats | ⬜ |
| `EmailCampaignScheduler.java` | `scheduler/` — `@Scheduled(fixedDelay=60000)` — picks SCHEDULED campaigns whose `scheduledAt <= now` and dispatches | ⬜ |
| `CreateEmailCampaignRequest.java` | `dto/request/` | ⬜ |
| `EmailCampaignResponse.java` | `dto/response/` | ⬜ |
| `EmailCampaignController.java` | `controller/` — `GET/POST /marketing/email-campaigns`, `GET/PUT /marketing/email-campaigns/{id}`, `POST /{id}/send`, `POST /{id}/schedule`, `GET /{id}/stats`, `GET /marketing/email-campaigns/track/{logId}/open` (pixel endpoint) | ⬜ |

### Frontend Files

| File | Path | Status |
|---|---|---|
| `page.tsx` (campaign list) | `app/marketing/email-campaigns/` — table with status badges, stats columns | ⬜ |
| `page.tsx` (new campaign) | `app/marketing/email-campaigns/new/` — multi-step: template → audience → schedule | ⬜ |
| `page.tsx` (campaign detail) | `app/marketing/email-campaigns/[id]/` — stats dashboard: sent/opened/clicked rates with progress bars | ⬜ |
| `email-campaigns.ts` | `lib/` — service functions | ⬜ |

---

## Phase P5 — SMS Marketing Campaigns

**Branch:** `feature/sms-marketing`  
**Bitrix24 equivalent:** SMS campaigns, order confirmation SMS, reminder SMS  
**External dependency:** SMS provider (Twilio / MSG91 — config via env vars `SMS_PROVIDER_API_KEY`)  
**Depends on:** P4 (reuse campaign audience/log patterns)

### New MongoDB Collections
| Collection | Purpose |
|---|---|
| `sms_campaigns` | SMS campaign definition |
| `sms_campaign_logs` | Per-recipient delivery tracking |

### Backend Files

| File | Path | Status |
|---|---|---|
| `SmsCampaign.java` | `domain/entity/` — campaignId, name, messageBody (max 160 chars), audienceType, recipientIds[], scheduledAt, status, stats{sent,delivered,failed}, tenantId, isDeleted | ⬜ |
| `SmsCampaignLog.java` | `domain/entity/` — campaignId, recipientPhone, sentAt, deliveredAt, failed, errorMessage | ⬜ |
| `SmsCampaignRepository.java` | `repository/` | ⬜ |
| `SmsCampaignLogRepository.java` | `repository/` | ⬜ |
| `SmsProviderService.java` | `service/` — abstraction layer: `send(to, body)` — internally calls Twilio/MSG91 based on config | ⬜ |
| `SmsCampaignService.java` | `service/` — CRUD, schedule, dispatch batches | ⬜ |
| `SmsCampaignScheduler.java` | `scheduler/` — same pattern as EmailCampaignScheduler | ⬜ |
| `SmsCampaignController.java` | `controller/` at `/marketing/sms-campaigns` | ⬜ |

### Frontend Files

| File | Path | Status |
|---|---|---|
| `page.tsx` (SMS campaign list) | `app/marketing/sms-campaigns/` | ⬜ |
| `page.tsx` (new SMS campaign) | `app/marketing/sms-campaigns/new/` — character counter, audience picker, schedule | ⬜ |
| `page.tsx` (SMS stats) | `app/marketing/sms-campaigns/[id]/` | ⬜ |
| `sms-campaigns.ts` | `lib/` | ⬜ |

---

## Phase P6 — Web Form & Landing Page Builder

**Branch:** `feature/form-builder`  
**Bitrix24 equivalent:** Web forms for lead capture, landing page builder, conditional logic  
**Key output:** Embeddable form generates leads directly into `leads` collection

### New MongoDB Collections
| Collection | Purpose |
|---|---|
| `web_forms` | Form definition: fields, styling, destination |
| `web_form_submissions` | Each submission with field values |
| `landing_pages` | Landing page definition with form and content blocks |

### Backend Files

| File | Path | Status |
|---|---|---|
| `FormFieldType.java` | `domain/enums/` — TEXT, EMAIL, PHONE, NUMBER, DROPDOWN, CHECKBOX, TEXTAREA, DATE | ⬜ |
| `WebForm.java` | `domain/entity/` — formId, name, fields[]{label, type, required, options[]}, submitAction{createLead/createContact}, redirectUrl, thankYouMessage, themeColor, tenantId, isDeleted | ⬜ |
| `WebFormSubmission.java` | `domain/entity/` — formId, submittedAt, ipAddress, responses{fieldId→value}, createdLeadId, tenantId | ⬜ |
| `LandingPage.java` | `domain/entity/` — pageId, slug, title, heroText, ctaText, formId, heroImageUrl, published, tenantId | ⬜ |
| `WebFormRepository.java` | `repository/` | ⬜ |
| `WebFormSubmissionRepository.java` | `repository/` | ⬜ |
| `LandingPageRepository.java` | `repository/` | ⬜ |
| `WebFormService.java` | `service/` — CRUD forms, handle submission (create lead/contact from field mappings), generate embed script | ⬜ |
| `LandingPageService.java` | `service/` — CRUD, publish/unpublish, get by slug (public endpoint) | ⬜ |
| `WebFormController.java` | `controller/` — `GET/POST /forms`, `GET/PUT/DELETE /forms/{id}`, `POST /forms/{id}/submit` (public, no auth), `GET /forms/{id}/submissions`, `GET /forms/{id}/embed-code` | ⬜ |
| `LandingPageController.java` | `controller/` — `GET/POST /landing-pages`, `GET /landing-pages/{id}`, `GET /landing-pages/public/{slug}` (public, no auth), `POST /{id}/publish` | ⬜ |

### Frontend Files

| File | Path | Status |
|---|---|---|
| `page.tsx` (form list) | `app/marketing/forms/` | ⬜ |
| `page.tsx` (form builder) | `app/marketing/forms/new/` and `/[id]/edit/` — drag-and-drop field builder, preview panel, embed code tab | ⬜ |
| `page.tsx` (submissions) | `app/marketing/forms/[id]/submissions/` — table of all submissions | ⬜ |
| `page.tsx` (landing page list) | `app/marketing/landing-pages/` | ⬜ |
| `page.tsx` (landing page editor) | `app/marketing/landing-pages/new/` — hero text, CTA, pick a form, color picker | ⬜ |
| `page.tsx` (public landing page) | `app/lp/[slug]/page.tsx` — public-facing, no auth, renders form | ⬜ |
| `forms.ts` | `lib/` | ⬜ |

---

## Phase P7 — Omnichannel Inbox

**Branch:** `feature/omnichannel-inbox`  
**Bitrix24 equivalent:** Unified inbox — WhatsApp, Instagram, Telegram, email, chat in one view  
**External dependencies:** WhatsApp Business API, Telegram Bot API, Instagram Graph API (all via env vars)  
**Architecture:** Each channel adapter pushes messages into a unified `inbox_messages` collection; agents (users) reply from a single UI.

### New MongoDB Collections
| Collection | Purpose |
|---|---|
| `inbox_channels` | Configured channels per tenant (WhatsApp, Telegram, Instagram, Email) |
| `inbox_conversations` | One conversation per customer×channel, holds all messages |
| `inbox_messages` | Individual messages (inbound + outbound) |

### Backend Files

| File | Path | Status |
|---|---|---|
| `InboxChannelType.java` | `domain/enums/` — WHATSAPP, TELEGRAM, INSTAGRAM, EMAIL, CHAT | ⬜ |
| `ConversationStatus.java` | `domain/enums/` — OPEN, PENDING, RESOLVED, SPAM | ⬜ |
| `InboxChannel.java` | `domain/entity/` — channelId, type, name, credentials{apiKey, webhookToken, phoneNumber}, isActive, tenantId | ⬜ |
| `InboxConversation.java` | `domain/entity/` — conversationId, channelId, channelType, customerIdentifier, customerName, assignedAgentId, status, lastMessageAt, linkedLeadId, linkedContactId, tenantId | ⬜ |
| `InboxMessage.java` | `domain/entity/` — messageId, conversationId, direction{INBOUND/OUTBOUND}, body, mediaUrl, sentAt, deliveredAt, readAt, authorId, tenantId | ⬜ |
| `InboxChannelRepository.java` | `repository/` | ⬜ |
| `InboxConversationRepository.java` | `repository/` — `findByTenantIdAndStatus`, `findByTenantIdAndAssignedAgentId` | ⬜ |
| `InboxMessageRepository.java` | `repository/` | ⬜ |
| `WhatsAppAdapter.java` | `service/inbox/` — receives webhook, normalizes to InboxMessage, sends reply via WhatsApp API | ⬜ |
| `TelegramAdapter.java` | `service/inbox/` — Telegram Bot webhook adapter | ⬜ |
| `InboxService.java` | `service/` — list conversations, get messages, send reply (routes to correct adapter), assign agent, resolve | ⬜ |
| `InboxController.java` | `controller/` — `GET /inbox/conversations`, `GET /inbox/conversations/{id}/messages`, `POST /inbox/conversations/{id}/reply`, `POST /inbox/conversations/{id}/assign`, `POST /inbox/conversations/{id}/resolve` | ⬜ |
| `InboxWebhookController.java` | `controller/` — `POST /inbox/webhook/whatsapp`, `POST /inbox/webhook/telegram` (public, HMAC-verified) | ⬜ |
| `InboxChannelController.java` | `controller/` — `GET/POST/PUT /admin/inbox/channels` — channel configuration | ⬜ |

### Frontend Files

| File | Path | Status |
|---|---|---|
| `page.tsx` (inbox) | `app/inbox/` — 3-pane: channel sidebar → conversation list → message thread | ⬜ |
| `page.tsx` (channel setup) | `app/admin/settings/inbox-channels/` — configure WhatsApp/Telegram/Instagram credentials | ⬜ |
| `inbox.ts` | `lib/` | ⬜ |

### Real-Time
- Push new inbound messages via existing WebSocket (`SimpMessagingTemplate`) to `/topic/inbox/{tenantId}/{agentId}`

---

## Phase P8 — Telephony / VoIP Integration

**Branch:** `feature/telephony`  
**Bitrix24 equivalent:** Virtual phone numbers, call recording, IVR, call center queue  
**External dependency:** Twilio Voice API or Exotel (India) — config via env vars  
**Scope:** Click-to-call from CRM, inbound call routing, call logs, recording storage

### New MongoDB Collections
| Collection | Purpose |
|---|---|
| `call_logs` | Every inbound/outbound call record |
| `ivr_menus` | IVR menu definitions |

### Backend Files

| File | Path | Status |
|---|---|---|
| `CallDirection.java` | `domain/enums/` — INBOUND, OUTBOUND | ⬜ |
| `CallStatus.java` | `domain/enums/` — INITIATED, RINGING, IN_PROGRESS, COMPLETED, MISSED, FAILED | ⬜ |
| `CallLog.java` | `domain/entity/` — callId, direction, fromNumber, toNumber, agentId, linkedLeadId, linkedContactId, linkedDealId, status, durationSeconds, recordingUrl, startedAt, endedAt, notes, tenantId | ⬜ |
| `IvrMenu.java` | `domain/entity/` — menuId, name, greeting, options[]{digit, label, action{ROUTE_TO_AGENT/VOICEMAIL/SUBMENU}}, tenantId | ⬜ |
| `CallLogRepository.java` | `repository/` | ⬜ |
| `IvrMenuRepository.java` | `repository/` | ⬜ |
| `TelephonyProviderService.java` | `service/` — abstraction: `initiateCall(from, to)`, `getRecordingUrl(callSid)` | ⬜ |
| `CallLogService.java` | `service/` — CRUD logs, link to CRM record, fetch recordings | ⬜ |
| `TelephonyWebhookController.java` | `controller/` — `POST /telephony/webhook/call-status` (Twilio status callback), `POST /telephony/webhook/inbound` (TwiML response) | ⬜ |
| `CallLogController.java` | `controller/` — `GET /telephony/calls`, `POST /telephony/calls/initiate`, `GET /telephony/calls/{id}`, `PUT /telephony/calls/{id}/notes` | ⬜ |
| `IvrController.java` | `controller/` — `GET/POST/PUT /admin/telephony/ivr` | ⬜ |

### Frontend Files

| File | Path | Status |
|---|---|---|
| `page.tsx` (call logs) | `app/telephony/calls/` — table with call direction icon, duration, recording play button | ⬜ |
| `page.tsx` (IVR builder) | `app/admin/telephony/ivr/` — tree-based IVR menu builder | ⬜ |
| Click-to-call button | `app/components/ClickToCall.tsx` — small button on Lead/Contact/Deal pages | ⬜ |
| `telephony.ts` | `lib/` | ⬜ |

---

## Phase P9 — Performance Reviews & OKRs

**Branch:** `feature/performance-management`  
**Bitrix24 equivalent:** Performance reviews, 360 feedback, OKR tracking, KPI management

### New MongoDB Collections
| Collection | Purpose |
|---|---|
| `review_cycles` | Review period definitions |
| `performance_reviews` | Individual review records |
| `objectives` | OKRs — Objectives with Key Results |

### Backend Files

| File | Path | Status |
|---|---|---|
| `ReviewStatus.java` | `domain/enums/` — DRAFT, SUBMITTED, ACKNOWLEDGED, COMPLETED | ⬜ |
| `ReviewCycle.java` | `domain/entity/` — cycleId, name, startDate, endDate, reviewerType{MANAGER/PEER/SELF/360}, tenantId | ⬜ |
| `PerformanceReview.java` | `domain/entity/` — reviewId, cycleId, revieweeId, reviewerId, ratings[]{competency, score, comment}, overallScore, summary, status, tenantId | ⬜ |
| `Objective.java` | `domain/entity/` — objectiveId, title, ownerId, quarter, year, keyResults[]{title, targetValue, currentValue, unit}, progress (auto-computed), tenantId | ⬜ |
| `ReviewCycleRepository.java` | `repository/` | ⬜ |
| `PerformanceReviewRepository.java` | `repository/` | ⬜ |
| `ObjectiveRepository.java` | `repository/` | ⬜ |
| `PerformanceService.java` | `service/` — create reviews, submit, acknowledge, compute scores | ⬜ |
| `OkrService.java` | `service/` — CRUD objectives, update key result progress, compute objective % | ⬜ |
| `PerformanceController.java` | `controller/` at `/hr/performance` | ⬜ |
| `OkrController.java` | `controller/` at `/hr/okrs` | ⬜ |

### Frontend Files

| File | Path | Status |
|---|---|---|
| `page.tsx` (review cycles) | `app/hr/performance/` | ⬜ |
| `page.tsx` (my review) | `app/hr/performance/reviews/[id]/` — competency sliders, comment boxes | ⬜ |
| `page.tsx` (OKR dashboard) | `app/hr/okrs/` — objective cards with progress bars, key result rows | ⬜ |
| `performance.ts` | `lib/` | ⬜ |

---

## Phase P10 — Employee Onboarding / Offboarding

**Branch:** `feature/onboarding`  
**Bitrix24 equivalent:** Onboarding workflows, task checklists, training assignments, mentor assignment

### New MongoDB Collections
| Collection | Purpose |
|---|---|
| `onboarding_templates` | Reusable onboarding task checklists per role |
| `onboarding_instances` | Per-employee onboarding run |

### Backend Files

| File | Path | Status |
|---|---|---|
| `OnboardingType.java` | `domain/enums/` — ONBOARDING, OFFBOARDING | ⬜ |
| `OnboardingTemplate.java` | `domain/entity/` — templateId, name, type, tasks[]{title, description, assigneeTo{SELF/MANAGER/HR/IT}, dueDaysFromStart, isRequired}, tenantId | ⬜ |
| `OnboardingInstance.java` | `domain/entity/` — instanceId, templateId, employeeId, mentorId, startDate, tasks[]{...templateTask + status + completedAt + completedBy}, progress, tenantId | ⬜ |
| `OnboardingTemplateRepository.java` | `repository/` | ⬜ |
| `OnboardingInstanceRepository.java` | `repository/` | ⬜ |
| `OnboardingService.java` | `service/` — create instance from template (auto-set due dates), complete task, assign mentor | ⬜ |
| `OnboardingController.java` | `controller/` at `/hr/onboarding` — `GET/POST /templates`, `POST /instances`, `POST /instances/{id}/tasks/{taskId}/complete`, `GET /instances/{employeeId}` | ⬜ |

### Frontend Files

| File | Path | Status |
|---|---|---|
| `page.tsx` (onboarding home) | `app/hr/onboarding/` — in-progress instances list | ⬜ |
| `page.tsx` (template editor) | `app/hr/onboarding/templates/[id]/` — checklist builder | ⬜ |
| `page.tsx` (employee onboarding) | `app/hr/onboarding/[instanceId]/` — task checklist with checkboxes, progress bar | ⬜ |
| `onboarding.ts` | `lib/` | ⬜ |

---

## Phase P11 — Document Storage & Collaboration

**Branch:** `feature/document-drive`  
**Bitrix24 equivalent:** Drive, file storage, document versioning, collaborative editing  
**Storage backend:** AWS S3 / MinIO (via `DOCUMENT_STORAGE_URL`, `DOCUMENT_STORAGE_KEY` env vars)

### New MongoDB Collections
| Collection | Purpose |
|---|---|
| `drive_folders` | Folder hierarchy per tenant |
| `drive_files` | File metadata (actual file in S3) |
| `drive_file_versions` | Version history per file |

### Backend Files

| File | Path | Status |
|---|---|---|
| `DriveFileType.java` | `domain/enums/` — DOCUMENT, SPREADSHEET, PDF, IMAGE, VIDEO, OTHER | ⬜ |
| `DriveFolder.java` | `domain/entity/` — folderId, name, parentFolderId, ownerIds[], isShared, tenantId, isDeleted | ⬜ |
| `DriveFile.java` | `domain/entity/` — fileId, folderId, name, mimeType, sizeBytes, storageKey (S3 key), currentVersion, sharedWith[], linkedEntityType, linkedEntityId, tenantId, isDeleted | ⬜ |
| `DriveFileVersion.java` | `domain/entity/` — versionId, fileId, versionNumber, storageKey, uploadedBy, uploadedAt, sizeBytes | ⬜ |
| `DriveFolderRepository.java` | `repository/` | ⬜ |
| `DriveFileRepository.java` | `repository/` | ⬜ |
| `DriveFileVersionRepository.java` | `repository/` | ⬜ |
| `StorageService.java` | `service/` — abstraction: `uploadFile(key, bytes)`, `getPresignedUrl(key, expirySeconds)`, `deleteFile(key)` | ⬜ |
| `DriveService.java` | `service/` — CRUD folders and files, upload new version, generate download URL, search by name | ⬜ |
| `DriveController.java` | `controller/` at `/drive` — `GET /drive/folders`, `POST /drive/folders`, `GET /drive/files?folderId=`, `POST /drive/files/upload` (multipart), `GET /drive/files/{id}/download`, `DELETE /drive/files/{id}` | ⬜ |

### Frontend Files

| File | Path | Status |
|---|---|---|
| `page.tsx` (drive home) | `app/drive/` — folder tree sidebar + file grid/list, drag-upload zone | ⬜ |
| `page.tsx` (file preview) | `app/drive/files/[id]/` — PDF/image preview, version history list, download button | ⬜ |
| `drive.ts` | `lib/` | ⬜ |

---

## Phase P12 — Recurring Tasks & Task Dependencies

**Branch:** `feature/task-enhancements`  
**Bitrix24 equivalent:** Recurring task scheduling, task dependencies (blocked by / blocks)  
**Depends on:** P1 (ProjectTask entity)

### Backend Changes (extend existing entities)

| File | Change | Status |
|---|---|---|
| `ProjectTask.java` | Add: `recurrenceRule{frequency: DAILY/WEEKLY/MONTHLY, interval, endDate}`, `dependsOnTaskIds[]`, `blockedByCount` | ⬜ |
| `RecurringTaskScheduler.java` | `scheduler/` — `@Scheduled(cron = "0 0 0 * * *")` — clones completed recurring tasks for next occurrence | ⬜ |
| `ProjectTaskService.java` | Add: validate dependency chain before status change (cannot complete if blockers open), generate next occurrence for recurring tasks | ⬜ |

### Frontend Changes

| File | Change | Status |
|---|---|---|
| Task form in `app/projects/[id]/tasks/[taskId]/` | Add recurrence picker (frequency + end date), dependency selector (searchable task list) | ⬜ |
| Kanban / Gantt views | Show blocked indicator on cards, dependency arrows on Gantt | ⬜ |

---

## Phase P13 — Company Activity Feed / Intranet

**Branch:** `feature/intranet-feed`  
**Bitrix24 equivalent:** Activity stream, company announcements, polls, employee social network

### New MongoDB Collections
| Collection | Purpose |
|---|---|
| `feed_posts` | Posts, announcements, polls |
| `feed_reactions` | Emoji reactions on posts |
| `feed_poll_votes` | Poll vote records |

### Backend Files

| File | Path | Status |
|---|---|---|
| `FeedPostType.java` | `domain/enums/` — POST, ANNOUNCEMENT, POLL | ⬜ |
| `FeedPost.java` | `domain/entity/` — postId, type, authorId, body, imageUrl, pollOptions[]{option, voteCount}, isPinned, mentions[], reactionCounts{}, commentCount, tenantId, isDeleted, createdAt | ⬜ |
| `FeedReaction.java` | `domain/entity/` — postId, userId, emoji, createdAt | ⬜ |
| `FeedPollVote.java` | `domain/entity/` — postId, userId, optionIndex, createdAt | ⬜ |
| `FeedPostRepository.java` | `repository/` | ⬜ |
| `FeedService.java` | `service/` — CRUD posts, react, vote on poll, pin post, paginated feed | ⬜ |
| `FeedController.java` | `controller/` at `/feed` — `GET /feed?page=`, `POST /feed`, `POST /feed/{id}/react`, `POST /feed/{id}/vote`, `PUT /feed/{id}/pin` | ⬜ |

### Frontend Files

| File | Path | Status |
|---|---|---|
| `page.tsx` (feed) | `app/feed/` — infinite scroll, compose box, post cards with reactions, poll voting | ⬜ |
| `feed.ts` | `lib/` | ⬜ |

---

## Phase P14 — Multi-Currency Support

**Branch:** `feature/multi-currency`  
**Bitrix24 equivalent:** Multi-currency on deals, invoices, products  
**Approach:** Store amounts in base currency (INR), display in selected currency using exchange rates fetched from a free API (e.g., Frankfurter.app)

### Backend Changes

| File | Change | Status |
|---|---|---|
| `CurrencyConfig.java` | New entity — baseCurrency, supportedCurrencies[], exchangeRates{USD:83.2, EUR:90.1}, lastUpdatedAt, tenantId | ⬜ |
| `CurrencyService.java` | Fetch rates from Frankfurter API daily, store in MongoDB, provide conversion methods | ⬜ |
| `CurrencyScheduler.java` | `@Scheduled(cron = "0 0 9 * * *")` — refresh rates daily | ⬜ |
| `CurrencyController.java` | `GET /admin/settings/currency`, `PUT /admin/settings/currency` (set base + supported), `GET /admin/settings/currency/rates` | ⬜ |
| `Opportunity.java`, `Invoice.java`, `PurchaseOrder.java` | Add `currency` field + `exchangeRate` snapshot at creation time | ⬜ |

### Frontend Changes

| File | Change | Status |
|---|---|---|
| Currency settings | `app/admin/settings/currency/page.tsx` | ⬜ |
| Amount display helper | `lib/currency.ts` — `formatCurrency(amount, currency, rate)` | ⬜ |
| Opportunity, Invoice forms | Currency dropdown + auto-converted display | ⬜ |

---

## Phase P15 — E-Signature on Documents

**Branch:** `feature/esignature`  
**Bitrix24 equivalent:** E-signature for proposals, HR contracts, offer letters  
**Approach:** Signature pad embedded in a secure public link; signature stored as base64 PNG alongside the document

### New MongoDB Collections
| Collection | Purpose |
|---|---|
| `signature_requests` | Pending/completed signature requests |

### Backend Files

| File | Path | Status |
|---|---|---|
| `SignatureStatus.java` | `domain/enums/` — PENDING, SIGNED, DECLINED, EXPIRED | ⬜ |
| `SignatureRequest.java` | `domain/entity/` — requestId, documentType{PROPOSAL/CONTRACT/HR_DOCUMENT}, documentId, signerEmail, signerName, token (UUID), signedAt, signatureImageBase64, ipAddress, status, expiresAt, tenantId | ⬜ |
| `SignatureRequestRepository.java` | `repository/` | ⬜ |
| `ESignatureService.java` | `service/` — create request (generates token, sends email link), verify token, store signature, update document status | ⬜ |
| `ESignatureController.java` | `controller/` — `POST /esignature/requests` (create + send email), `GET /esignature/sign/{token}` (public, returns document info), `POST /esignature/sign/{token}` (public, accepts signature), `GET /esignature/requests?documentId=` | ⬜ |

### Frontend Files

| File | Path | Status |
|---|---|---|
| `page.tsx` (signing page) | `app/sign/[token]/page.tsx` — public page: document summary + canvas signature pad + submit | ⬜ |
| "Request Signature" button | Add to `app/proposals/[id]/` and `app/contracts/[id]/` detail pages | ⬜ |
| `esignature.ts` | `lib/` | ⬜ |

---

## Phase P16 — Custom Report Builder

**Branch:** `feature/report-builder`  
**Bitrix24 equivalent:** Drag-and-drop report builder, custom KPIs, scheduled reports  
**Approach:** User configures a report (data source + filters + columns + chart type); backend runs MongoDB aggregation dynamically; result rendered as table + chart.

### New MongoDB Collections
| Collection | Purpose |
|---|---|
| `saved_reports` | Report configurations saved by users |

### Backend Files

| File | Path | Status |
|---|---|---|
| `ReportDataSource.java` | `domain/enums/` — LEADS, OPPORTUNITIES, WORK_ORDERS, ATTENDANCE, INVOICES, ACTIVITIES | ⬜ |
| `ReportChartType.java` | `domain/enums/` — TABLE, BAR, LINE, PIE, FUNNEL | ⬜ |
| `SavedReport.java` | `domain/entity/` — reportId, name, dataSource, filters[]{field, operator, value}, columns[], groupBy, chartType, isScheduled, scheduleFrequency, recipientEmails[], tenantId, createdBy | ⬜ |
| `SavedReportRepository.java` | `repository/` | ⬜ |
| `ReportBuilderService.java` | `service/` — validates config, builds MongoDB aggregation pipeline dynamically, executes and returns data | ⬜ |
| `ReportSchedulerService.java` | `scheduler/` — sends scheduled reports by email | ⬜ |
| `ReportController.java` | `controller/` at `/reports` — `GET/POST /reports`, `GET/PUT/DELETE /reports/{id}`, `POST /reports/{id}/run`, `POST /reports/{id}/export` | ⬜ |

### Frontend Files

| File | Path | Status |
|---|---|---|
| `page.tsx` (report list) | `app/reports/` | ⬜ |
| `page.tsx` (report builder) | `app/reports/new/` and `/[id]/edit/` — data source picker, filter builder, column selector, chart type picker | ⬜ |
| `page.tsx` (report viewer) | `app/reports/[id]/` — rendered table + chart (use `recharts` or CSS-only bar charts) | ⬜ |
| `reports.ts` | `lib/` | ⬜ |

---

## Phase P17 — Google / Outlook Calendar Sync

**Branch:** `feature/calendar-sync`  
**Bitrix24 equivalent:** Google Calendar & Outlook Calendar integration  
**External dependency:** Google OAuth2 + Calendar API, Microsoft Graph API

### Backend Files

| File | Path | Status |
|---|---|---|
| `CalendarProvider.java` | `domain/enums/` — GOOGLE, OUTLOOK | ⬜ |
| `CalendarIntegration.java` | `domain/entity/` — userId, provider, accessToken (encrypted), refreshToken (encrypted), calendarId, lastSyncedAt, tenantId | ⬜ |
| `CalendarIntegrationRepository.java` | `repository/` | ⬜ |
| `GoogleCalendarService.java` | `service/` — OAuth flow, create/update/delete events | ⬜ |
| `CalendarSyncScheduler.java` | `scheduler/` — sync every 15 min | ⬜ |
| `CalendarController.java` | `controller/` at `/integrations/calendar` — `GET /auth/google`, `GET /auth/google/callback`, `DELETE /disconnect`, `GET /status` | ⬜ |

### Frontend Files

| File | Path | Status |
|---|---|---|
| `page.tsx` (integrations) | `app/admin/settings/integrations/` — Google Calendar + Outlook connect buttons, sync status | ⬜ |

---

## Phase P18 — Poll / Survey Module

**Branch:** `feature/surveys`  
**Bitrix24 equivalent:** Poll creation, pulse surveys, feedback collection  
**Depends on:** Can be standalone or integrated with P13 (feed polls)

### New MongoDB Collections
| Collection | Purpose |
|---|---|
| `surveys` | Survey definitions |
| `survey_responses` | Per-user survey responses |

### Backend Files

| File | Path | Status |
|---|---|---|
| `SurveyQuestionType.java` | `domain/enums/` — RATING, MULTIPLE_CHOICE, TEXT, YES_NO, NPS | ⬜ |
| `Survey.java` | `domain/entity/` — surveyId, title, description, questions[], isAnonymous, targetUserIds[], dueDate, status, tenantId | ⬜ |
| `SurveyResponse.java` | `domain/entity/` — surveyId, respondentId (null if anonymous), answers[]{questionId, value}, submittedAt | ⬜ |
| `SurveyRepository.java` | `repository/` | ⬜ |
| `SurveyResponseRepository.java` | `repository/` | ⬜ |
| `SurveyService.java` | `service/` — CRUD, distribute, collect responses, compute aggregate results | ⬜ |
| `SurveyController.java` | `controller/` at `/surveys` | ⬜ |

### Frontend Files

| File | Path | Status |
|---|---|---|
| `page.tsx` (survey list) | `app/surveys/` | ⬜ |
| `page.tsx` (survey builder) | `app/surveys/new/` | ⬜ |
| `page.tsx` (take survey) | `app/surveys/[id]/respond/` | ⬜ |
| `page.tsx` (results) | `app/surveys/[id]/results/` — bar charts per question | ⬜ |
| `surveys.ts` | `lib/` | ⬜ |

---

## Phase P19 — Customer Self-Service Portal

**Branch:** `feature/customer-portal`  
**Bitrix24 equivalent:** Customer portal for viewing invoices, submitting tickets, tracking orders  
**Architecture:** Separate public-facing Next.js route group `(portal)` with its own auth (portal token, not internal JWT)

### New MongoDB Collections
| Collection | Purpose |
|---|---|
| `portal_sessions` | Customer portal login sessions (token-based) |

### Backend Files

| File | Path | Status |
|---|---|---|
| `PortalAuthService.java` | `service/` — send magic-link to customer email, validate token, return portal JWT | ⬜ |
| `PortalController.java` | `controller/` at `/portal` — `POST /portal/auth/request-link`, `POST /portal/auth/verify`, `GET /portal/invoices`, `GET /portal/service-requests`, `POST /portal/service-requests`, `GET /portal/work-orders` | ⬜ |

### Frontend Files (separate route group)

| File | Path | Status |
|---|---|---|
| `page.tsx` (portal login) | `app/(portal)/portal/login/page.tsx` | ⬜ |
| `page.tsx` (portal home) | `app/(portal)/portal/page.tsx` — customer dashboard | ⬜ |
| `page.tsx` (invoices) | `app/(portal)/portal/invoices/page.tsx` | ⬜ |
| `page.tsx` (raise ticket) | `app/(portal)/portal/tickets/new/page.tsx` | ⬜ |
| `page.tsx` (track ticket) | `app/(portal)/portal/tickets/page.tsx` | ⬜ |

---

## Phase P20 — AI CoPilot

**Branch:** `feature/ai-copilot`  
**Bitrix24 equivalent:** CoPilot — call transcription, CRM field auto-fill, content suggestions  
**External dependency:** Anthropic API (`ANTHROPIC_API_KEY` env var)  
**Scope (MVP):** Summarize call notes, draft email replies, suggest next action on a lead

### Backend Files

| File | Path | Status |
|---|---|---|
| `AiRequest.java` | `dto/request/` — context{entityType, entityId, customPrompt} | ⬜ |
| `AiResponse.java` | `dto/response/` — suggestion, confidence, usage | ⬜ |
| `CopilotService.java` | `service/` — calls Claude API, builds context from CRM entity, returns structured suggestion | ⬜ |
| `CopilotController.java` | `controller/` at `/ai` — `POST /ai/summarize` (any text), `POST /ai/suggest-reply` (email context), `POST /ai/next-action` (lead/deal context), `POST /ai/transcribe` (audio file → text via Whisper API) | ⬜ |

### Frontend Files

| File | Path | Status |
|---|---|---|
| CoPilot panel | `app/components/CopilotPanel.tsx` — slide-in sidebar with prompt input + suggestion display | ⬜ |
| Integrate into Lead detail | Show "Suggest Next Action" button on `/leads/[id]/` | ⬜ |
| Integrate into email compose | Show "Draft Reply" button in activity email compose | ⬜ |
| `copilot.ts` | `lib/` | ⬜ |

---

## Implementation Notes

### Conventions to Follow
- All entities: extend with `tenantId`, `isDeleted`, `createdAt`, `createdBy`, `updatedAt`, `updatedBy`
- All services: extend `BaseTenantService`, use `getCurrentTenantId()`
- All controllers: use `TenantContext.getTenantId()` + `@PreAuthorize("hasPermission('MODULE', 'ACTION')")`
- New modules: always add to `ProfileMigrationService.patchMissingPermissions` + `RoleMigrationService.patchMissingModules`
- Frontend: `showToast` from `@/lib/toast` (never `toast`), no external UI libraries beyond lucide-react
- Schedulers: never call `repository.findAll()` without tenant filter

### External Services Required (env vars to configure)
| Service | Env Var | Used By |
|---|---|---|
| SendGrid / AWS SES | `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` | P4 Email campaigns, P15 E-Signature |
| Twilio / MSG91 | `SMS_PROVIDER`, `SMS_API_KEY`, `SMS_FROM` | P5 SMS, P8 Telephony |
| WhatsApp Business API | `WHATSAPP_API_TOKEN`, `WHATSAPP_PHONE_ID` | P7 Omnichannel |
| Telegram Bot API | `TELEGRAM_BOT_TOKEN` | P7 Omnichannel |
| AWS S3 / MinIO | `STORAGE_ENDPOINT`, `STORAGE_KEY`, `STORAGE_SECRET`, `STORAGE_BUCKET` | P11 Drive |
| Google OAuth | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | P17 Calendar Sync |
| Anthropic API | `ANTHROPIC_API_KEY` | P20 AI CoPilot |
| Frankfurter (free) | No key needed | P14 Currency rates |

---

*Last updated: 2026-04-20*  
*To resume: read this file, find first ⬜ phase, create branch, start implementing.*

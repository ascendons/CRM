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
| **P4** | Email Marketing Campaigns | 🔴 High | — | — | ❌ Removed |
| **P5** | SMS Marketing Campaigns | 🔴 High | — | — | ⏭ Skipped |
| **P6** | Web Form & Landing Page Builder | 🔴 High | ✅ | ✅ | ✅ Completed |
| **P7** | Omnichannel Inbox | 🔴 High | — | — | ⏭ Skipped |
| **P8** | Telephony / VoIP Integration | 🔴 High | — | — | ⏭ Skipped |
| **P9** | Performance Reviews & OKRs | 🟡 Medium | ✅ | ✅ | ✅ Completed |
| **P10** | Employee Onboarding / Offboarding | 🟡 Medium | ✅ | ✅ | ✅ Completed |
| **P11** | Document Storage & Collaboration | 🟡 Medium | ⬜ | ⬜ | Not Started |
| **P12** | Recurring Tasks & Dependencies | 🟡 Medium | ✅ | ✅ | ✅ Completed |
| **P13** | Company Activity Feed / Intranet | 🟡 Medium | ✅ | ✅ | ✅ Completed |
| **P14** | Multi-Currency Support | 🟡 Medium | ✅ | ✅ | ✅ Completed |
| **P15** | E-Signature on Documents | 🟡 Medium | ✅ | ✅ | ✅ Completed |
| **P16** | Custom Report Builder | 🟡 Medium | ✅ | ✅ | ✅ Completed |
| **P17** | Google / Outlook Calendar Sync | 🟢 Low | ⬜ | ⬜ | Not Started |
| **P18** | Poll / Survey Module | 🟢 Low | ✅ | ✅ | ✅ Completed |
| **P19** | Customer Self-Service Portal | 🟢 Low | ✅ | ✅ | ✅ Completed |
| **P20** | AI CoPilot (Call + CRM) | 🟢 Low | ⬜ | ⬜ | Not Started |

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
| SendGrid / AWS SES | `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` | P15 E-Signature |
| Twilio / MSG91 | `SMS_PROVIDER`, `SMS_API_KEY`, `SMS_FROM` | P5 SMS, P8 Telephony |
| WhatsApp Business API | `WHATSAPP_API_TOKEN`, `WHATSAPP_PHONE_ID` | P7 Omnichannel |
| Telegram Bot API | `TELEGRAM_BOT_TOKEN` | P7 Omnichannel |
| AWS S3 / MinIO | `STORAGE_ENDPOINT`, `STORAGE_KEY`, `STORAGE_SECRET`, `STORAGE_BUCKET` | P11 Drive |
| Google OAuth | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | P17 Calendar Sync |
| Anthropic API | `ANTHROPIC_API_KEY` | P20 AI CoPilot |
| Frankfurter (free) | No key needed | P14 Currency rates |

---

*Last updated: 2026-04-23*  
*To resume: read this file, find first ⬜ phase, create branch, start implementing.*

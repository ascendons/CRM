# Ascendons CRM — Feature Testing Checklist

**How to use:** Go through each section, test every item, and mark ✅ Pass / ❌ Fail / ⏭ Skipped.  
Test URL: `http://localhost:3000` (frontend) · `http://localhost:8080/api/v1` (backend)

---

## 🔐 Authentication & Session

| # | Test | Expected | Result |
|---|---|---|---|
| A1 | Login with valid credentials | Redirects to dashboard, JWT stored | |
| A2 | Login with wrong password | Error toast shown, no redirect | |
| A3 | Access protected page without login | Redirects to `/login` | |
| A4 | Logout | Clears session, redirects to login | |
| A5 | Token expiry (wait 24h or manually expire) | Auto-redirects to login | |

---

## 👥 User Management

| # | Test | Expected | Result |
|---|---|---|---|
| U1 | Admin creates a new user | User appears in list, receives credentials | |
| U2 | Admin edits user details | Changes saved and reflected | |
| U3 | Admin deactivates a user | User cannot login, shown as inactive | |
| U4 | Admin deletes a user *(Bug #10 fix)* | User soft-deleted, disappears from active list | |
| U5 | Deleted user cannot login | Login rejected | |
| U6 | Admin assigns a role/profile to user | User gets correct permissions | |

---

## 🔐 Permissions & RBAC

| # | Test | Expected | Result |
|---|---|---|---|
| P1 | Sales rep cannot see "Assign Lead" button *(Bug #13 fix)* | Assign button hidden for sales rep role | |
| P2 | Sales rep can only view own leads | Lead list shows only their assigned leads | |
| P3 | Manager can see own + team leads | Lead list shows self + subordinates | |
| P4 | Admin sees all leads in tenant | Full lead list visible | |
| P5 | User without DELETE permission cannot delete | Delete button hidden or returns 403 | |
| P6 | Module-level permission: disable HR module for role | HR menu hidden for that role | |

---

## 📋 Leads

| # | Test | Expected | Result |
|---|---|---|---|
| L1 | Create a new lead | Lead appears in list with correct ID (LEAD-YYYY-MM-NNNNN) | |
| L2 | Assigned leads show for sales rep *(Bug #8 fix)* | Sales rep sees leads assigned to them | |
| L3 | Lead count for sales rep is correct *(Bug #7 fix)* | Dashboard stat = number of leads assigned to/by them | |
| L4 | Search by company name (e.g. "Zoloto") *(Bug #12 fix)* | Results ranked: exact match first, max relevant results | |
| L5 | Search by lead name | Returns matching leads | |
| L6 | Filter leads by status | Only leads with selected status shown | |
| L7 | Delete a lead *(Bug #11 fix)* | Lead removed from list, soft-deleted in DB | |
| L8 | Bulk delete leads | All selected leads deleted, confirmation modal shown | |
| L9 | Convert lead to opportunity | Opportunity created, lead status changes to CONVERTED | |
| L10 | Assign lead (admin/manager) | Lead reassigned, new owner sees it | |
| L11 | Sales rep cannot assign lead *(Bug #13 fix)* | Assign option not visible to sales rep | |
| L12 | Lead Kanban view | Leads shown in columns by status, drag works | |
| L13 | Export leads to CSV/Excel | File downloads with correct data | |

---

## 👤 Contacts

| # | Test | Expected | Result |
|---|---|---|---|
| C1 | Create a new contact | Contact saved with correct fields | |
| C2 | Edit contact details | Changes saved | |
| C3 | Delete a contact *(Bug #11 fix)* | Contact soft-deleted, removed from list | |
| C4 | Search contacts | Returns relevant results | |
| C5 | Link contact to a lead/opportunity | Relationship visible on both records | |
| C6 | Back button on contact detail *(Bug #13 fix)* | Returns to contacts list | |

---

## 💼 Opportunities / Pipeline

| # | Test | Expected | Result |
|---|---|---|---|
| O1 | Create an opportunity | Appears in pipeline | |
| O2 | Move opportunity through stages | Stage updates correctly | |
| O3 | Edit opportunity details | Changes saved | |
| O4 | Delete an opportunity | Removed from pipeline | |
| O5 | Back button on opportunity detail *(Bug #13 fix)* | Returns to pipeline | |
| O6 | Pipeline Kanban view | Columns by stage, drag works | |

---

## 📦 Products / Catalog

| # | Test | Expected | Result |
|---|---|---|---|
| PR1 | Create product — name does NOT copy from SKU *(Bug #5 fix)* | Name and SKU are independent fields | |
| PR2 | Create product with MRP (listPrice) and base price | Both saved correctly | |
| PR3 | Edit product | Changes saved | |
| PR4 | Search product by name | Returns ranked results (exact match first) *(Bug #12 fix)* | |
| PR5 | Search product by SKU | Returns exact SKU match at top | |
| PR6 | Search "Zoloto" — description match should NOT appear *(Bug #12 fix)* | Only name/SKU matches returned | |
| PR7 | Product submit button disabled on double-click *(Bug #6 fix)* | Cannot submit twice | |

---

## 📄 Proposals / Quotations

| # | Test | Expected | Result |
|---|---|---|---|
| Q1 | Create a Quotation | Saved with type "Quotation" | |
| Q2 | Select product in line item — MRP auto-filled *(Bug #9 fix)* | listPrice populated from product | |
| Q3 | Product name on line item is product name, not code *(Bug #5 fix)* | Correct name shown | |
| Q4 | Confirmation modal before saving *(Bug #6 fix)* | "Are you sure?" modal appears before POST | |
| Q5 | Cannot submit proposal twice (button disabled) *(Bug #6 fix)* | Button disabled during save | |
| Q6 | Create a Proforma Invoice | Saved with type "Proforma Invoice" | |
| Q7 | Create a Technical Quotation *(New Feature)* | Saved with type "Technical Quotation" | |
| Q8 | Technical Quotation — MRP/discount column hidden *(New Feature)* | Only: Product, Qty, Unit, Unit Price, Tax, Total visible | |
| Q9 | Technical Quotation badge shown in proposal list | "Technical Quotation" badge visible in list | |
| Q10 | Technical Quotation badge shown on detail page | Header shows "Technical Quotation" label | |
| Q11 | Edit a proposal | Changes saved correctly | |
| Q12 | Back button on proposal detail *(Bug #13 fix)* | Returns to proposals list | |
| Q13 | PDF/print proposal | Renders correctly | |

---

## 🧾 Invoices

| # | Test | Expected | Result |
|---|---|---|---|
| I1 | Create invoice from proposal | Line items carried over | |
| I2 | Default template is Quotation (not Proforma) *(Bug #14 - already fixed)* | Form opens with Quotation selected | |
| I3 | Tax calculated correctly | GST/IGST applied per line item | |
| I4 | Invoice PDF download | Correct totals, layout | |

---

## 📅 Activities (Tasks / Calls / Meetings / Emails / Notes)

| # | Test | Expected | Result |
|---|---|---|---|
| AC1 | Create a task | Appears in activity list | |
| AC2 | Create a call log | Saved with correct details | |
| AC3 | Create a meeting | Appears in calendar/list | |
| AC4 | Mark activity as complete | Status updated | |
| AC5 | Activities linked to lead/contact/deal | Visible on record timeline | |

---

## 🗂️ Projects & Tasks (P1)

| # | Test | Expected | Result |
|---|---|---|---|
| PJ1 | Create a project | Appears in project list with ID PROJ-YYYY-MM-NNNNN | |
| PJ2 | Add members to project | Members can view project | |
| PJ3 | Create a task in project | Task appears with ID TASK-YYYY-MM-NNNNN | |
| PJ4 | Create a subtask | Subtask linked to parent task | |
| PJ5 | Kanban view | Tasks in columns by status | |
| PJ6 | Gantt view | Timeline bars render | |
| PJ7 | Add checklist items to task | Items appear, can be checked off | |
| PJ8 | Add comment to task | Comment appears with author | |
| PJ9 | Change task status | Status updates, Kanban reflects | |

---

## ⏱️ Time Tracking (P2)

| # | Test | Expected | Result |
|---|---|---|---|
| TT1 | Start timer on a task | Timer runs, shows elapsed time | |
| TT2 | Stop timer | Entry saved with duration | |
| TT3 | Manual time entry | Entry saved correctly | |
| TT4 | Weekly timesheet view | Shows entries grouped by day | |
| TT5 | Workload view | Shows team hours per person | |

---

## 📚 Knowledge Base (P3)

| # | Test | Expected | Result |
|---|---|---|---|
| KB1 | Create a KB category | Appears on KB home | |
| KB2 | Create a draft article | Saved as DRAFT | |
| KB3 | Publish an article | Status changes to PUBLISHED, visible on KB home | |
| KB4 | Search articles | Returns matching results | |
| KB5 | View count increments | Each view adds 1 to view count | |
| KB6 | Edit article | Changes saved | |
| KB7 | Archive article | Status ARCHIVED, hidden from public | |

---

## 🌐 Web Forms & Landing Pages (P6)

| # | Test | Expected | Result |
|---|---|---|---|
| WF1 | Create a web form with fields | Form saved | |
| WF2 | Get embed code | JavaScript snippet returned | |
| WF3 | Submit the form (public endpoint, no auth) | Submission saved, lead created | |
| WF4 | View submissions list | All submissions visible | |
| WF5 | Create a landing page | Saved with slug | |
| WF6 | Publish landing page | Accessible at `/lp/[slug]` without login | |
| WF7 | Public landing page renders form | Form visible and submittable | |

---

## 🏖️ HR — Attendance & Leave

| # | Test | Expected | Result |
|---|---|---|---|
| HR1 | Clock in/out | Attendance recorded | |
| HR2 | Apply for leave | Leave request created | |
| HR3 | Approve/reject leave | Status updated, employee notified | |
| HR4 | View attendance report | Correct data shown | |

---

## 📊 Dashboard & Analytics

| # | Test | Expected | Result |
|---|---|---|---|
| DA1 | Dashboard loads without errors | All widgets render | |
| DA2 | Lead funnel shows correct counts | Matches actual lead statuses | |
| DA3 | Sales rep dashboard shows only own data | No cross-tenant/cross-user data leak | |
| DA4 | Date range filter on analytics | Data updates for selected period | |

---

## 🔍 Search (Global)

| # | Test | Expected | Result |
|---|---|---|---|
| S1 | Search by exact name | Exact match appears first | |
| S2 | Search by partial name | Relevant results, ranked by relevance | |
| S3 | Search returns max ~20 relevant results | Not 200 generic results | |

---

## 🚀 Navigation & UX

| # | Test | Expected | Result |
|---|---|---|---|
| N1 | Back button on lead detail | Returns to leads list | |
| N2 | Back button on contact detail | Returns to contacts list | |
| N3 | Back button on opportunity detail | Returns to pipeline | |
| N4 | Back button on proposal detail | Returns to proposals list | |
| N5 | Back button on product detail | Returns to products list | |
| N6 | Sidebar nav links all work | No broken routes | |
| N7 | Mobile responsive layout | No overflow, menus work | |

---

## 🔔 Real-Time & Notifications

| # | Test | Expected | Result |
|---|---|---|---|
| RT1 | WebSocket connects on login | No console errors | |
| RT2 | Notification received for assigned lead | Bell icon shows count | |
| RT3 | Chat message sent/received | Real-time delivery | |

---

## Summary

| Category | Total | Pass | Fail | Skipped |
|---|---|---|---|---|
| Authentication | 5 | | | |
| User Management | 6 | | | |
| Permissions | 6 | | | |
| Leads | 13 | | | |
| Contacts | 6 | | | |
| Opportunities | 6 | | | |
| Products | 7 | | | |
| Proposals/Quotations | 13 | | | |
| Invoices | 4 | | | |
| Activities | 5 | | | |
| Projects & Tasks | 9 | | | |
| Time Tracking | 5 | | | |
| Knowledge Base | 7 | | | |
| Web Forms | 7 | | | |
| HR | 4 | | | |
| Dashboard | 4 | | | |
| Search | 3 | | | |
| Navigation/UX | 7 | | | |
| Real-Time | 3 | | | |
| **TOTAL** | **119** | | | |

---

*Generated: 2026-04-21 · Branch: siddharth-hvac*

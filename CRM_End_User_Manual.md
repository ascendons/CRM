# Ascendons CRM — End User Manual

**Version 1.0 — April 2026**

---

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [Organization Setup](#2-organization-setup)
3. [User Management & Roles](#3-user-management--roles)
4. [Lead Management](#4-lead-management)
5. [Quotation & Proposal Management](#5-quotation--proposal-management)
6. [Admin Panel](#6-admin-panel)
7. [HR & Attendance](#7-hr--attendance)
8. [Field Service & Work Orders](#8-field-service--work-orders)
9. [Dashboard & Analytics](#9-dashboard--analytics)
10. [Calendar](#10-calendar)
11. [Notifications & Chat](#11-notifications--chat)

---

## 1. Getting Started

### 1.1 Logging In

1. Open your browser and navigate to `https://crm.ascendons.com`
2. Enter your **Email** and **Password**
3. Click **Sign In**
4. You will be redirected to the **Dashboard** on first login

> **Note:** Password must be at least 8 characters with 1 uppercase, 1 lowercase, 1 digit, and 1 special character.

### 1.2 Understanding the Navigation

The sidebar (left side) contains all modules. Modules visible to you depend on your **role** and **organization settings**.

| Element | Description |
|---|---|
| **Sidebar** | Contains all module links |
| **Top Bar** | Shows search, notifications bell, user profile |
| **Back Button** | Appears on sub-pages to navigate up |
| **Notification Bell** | Shows unread count; click to expand |
| **User Menu** | Profile, settings, logout |

### 1.3 First-Time Setup Checklist

Before using the CRM, ensure your organization admin has completed:

- [ ] Created the organization and configured settings
- [ ] Added office locations and shifts
- [ ] Created roles and assigned module permissions
- [ ] Invited team members via email
- [ ] Configured product catalog (if using sales features)

---

## 2. Organization Setup

### 2.1 Accessing Organization Settings

1. Click your **profile icon** (top right)
2. Select **Organization Settings**
3. You need **ADMIN** role permissions to access this section

### 2.2 General Settings

1. Go to **Organization Settings → General**
2. Edit: Organization name, logo, address, contact info
3. Click **Save Changes**

### 2.3 Office Locations

1. Go to **Organization Settings → Locations**
2. Click **Add Location**
3. Fill in:
   - **Location Name** (e.g., "Head Office", "Branch Mumbai")
   - **Address** — full postal address
   - **City / State / Country / PIN Code**
   - **Phone** (optional)
   - **Is Head Office** — toggle if this is the main location
4. Click **Save**

**Deleting a location:** Click the trash icon. Locations linked to shifts or attendance records cannot be deleted without removing those associations first.

### 2.4 Shifts

Shifts define working hours for attendance tracking.

1. Go to **Organization Settings → Shifts**
2. Click **Add Shift**
3. Configure:
   - **Shift Name** (e.g., "Morning Shift", "Night Shift", "Flexible")
   - **Start Time** (e.g., 09:00)
   - **End Time** (e.g., 18:00)
   - **Grace Period (minutes)** — allowed late arrival time
   - **Office Location** — which location this shift applies to
4. Click **Save**

> **Tip:** Create separate shifts for different office locations. Employees can be assigned different shifts based on their role or location.

### 2.5 Organization Modules

This tab controls which modules are visible to your organization. If a module is disabled here, it will not appear in the sidebar for any user regardless of their role permissions.

---

## 3. User Management & Roles

### 3.1 Inviting Users

1. Go to **Admin → Users**
2. Click **Add User**
3. Fill in:
   - **Full Name**
   - **Email** — user will receive login instructions
   - **Phone** (optional)
   - **Role** — select from the drop-down
   - **Reporting To** — select manager (optional)
4. Click **Save**

The user will receive an email with a link to set their password and access the CRM.

### 3.2 Creating a Role

1. Go to **Admin → Roles**
2. Click **New Role**
3. Fill in:
   - **Role Name** (e.g., "Sales Manager", "Field Technician")
   - **Description** (optional)
   - **Level** (1–5) — hierarchy depth; higher levels inherit lower-level permissions
   - **Parent Role** — optional; select a role this should inherit from
   - **Data Visibility** — who can see this role's data: `All`, `Team`, `Self Only`
4. Configure **Module Permissions**:
   - Expand each module (CRM, HR, Field Service, etc.)
   - Set `Create / Read / Update / Delete / Export` per module
   - Use "Select All" for full access
5. Click **Save**

### 3.3 Assigning a Role to a User

1. Go to **Admin → Users**
2. Find the user row
3. Click the **Edit** icon (pencil)
4. Change the **Role** from the drop-down
5. Click **Save**

### 3.4 Copying a Role

1. Go to **Admin → Roles**
2. Find the role you want to duplicate
3. Click the **Copy** icon (duplicate) in the Actions column
4. Confirm — a new role is created with "Copy of" prefix, initially inactive
5. Edit the new role to rename it and adjust permissions

### 3.5 Activating / Deactivating a Role

- **Deactivate:** Click the toggle-off icon on an active role → role becomes inactive, cannot be assigned to new users
- **Activate:** Click the toggle-on icon on an inactive role → role becomes usable again

> **Note:** Deactivating a role does not affect existing users assigned to it — they retain access. To revoke access, reassign those users to an active role.

### 3.6 Exporting Roles

1. Go to **Admin → Roles**
2. Click **Export CSV** — a CSV file downloads with all role data (name, level, parent, visibility, status, child count)

---

## 4. Lead Management

### 4.1 Creating a Lead

1. Go to **CRM → Leads**
2. Click **New Lead** (top right button)
3. Fill in the fields:

   | Field | Description |
   |---|---|
   | **Salutation** | Mr. / Mrs. / Ms. / Dr. |
   | **First Name / Last Name** | Contact person name |
   | **Company Name** | Organization the lead belongs to |
   | **Email** | Primary email address |
   | **Phone** | Contact phone number |
   | **Lead Source** | How the lead was acquired (Website, Referral, Campaign, etc.) |
   | **Lead Owner** | Person responsible for this lead |
   | **Estimated Value** | Potential deal value in ₹ |
   | **BANT Score** | B = Budget, A = Authority, N = Need, T = Timeline |
   | **Tags** | Keywords for categorization |

4. Click **Save**

> **Tip:** Fill in the Company Details section to associate the lead with an existing account or create a new one. Select **"Create New Company"** to register the company in the system simultaneously.

### 4.2 Lead Detail View

Click any lead row to open its detail page:

- **Overview tab** — key info, timeline of all activities
- **Emails tab** — sent/received emails linked to this lead
- **Calls tab** — call log entries
- **Meetings tab** — scheduled and completed meetings
- **Notes tab** — free-form notes
- **Proposals tab** — all proposals/quotes sent to this lead
- **Files tab** — uploaded documents

### 4.3 Converting a Lead to an Opportunity

1. Open a lead detail page
2. Click **Convert to Opportunity** (top right)
3. Fill in:
   - **Opportunity Name** — pre-filled from company name, editable
   - **Stage** — select from: Prospect, Qualified, Proposal, Negotiation, Won, Lost
   - **Expected Close Date** — target date for deal completion
   - **Amount** — deal value
   - **Probability %** — likelihood of closing
4. Click **Convert** — the lead is marked as converted and an Opportunity is created

### 4.4 Lead Assignment

- **Manual assignment:** Edit a lead → change the Lead Owner
- **Auto-assignment:** Admins can configure routing rules in Admin → Lead Settings

### 4.5 Bulk Actions

1. On the Leads list page, **check the boxes** on the left of each lead
2. The bulk action bar appears at the top
3. Select an action: **Assign Owner**, **Change Status**, **Add Tag**, **Delete**

### 4.6 Lead Status Flow

```
New → Contacted → Qualified → Converted
                          → Lost
```

Use the **Status** filter on the list page to filter by any status.

### 4.7 Searching & Filtering Leads

- **Search bar** — type name, company, email to filter the list instantly
- **Status filter** — filter by lead status
- **Owner filter** — view leads assigned to a specific user
- **Source filter** — filter by lead source
- **Date range** — filter by creation date or last updated date

---

## 5. Quotation & Proposal Management

### 5.1 Creating a Proposal / Quote

1. Go to **CRM → Proposals**
2. Click **New Proposal**
3. Fill in:
   - **Proposal Title**
   - **Related Lead** — search and select a lead
   - **Valid Until** — expiry date
   - **Payment Terms** — NET 30, NET 60, etc.
   - **Notes / Terms** — terms and conditions text
4. Click **Add Line Item** to add products:

   - Select **Product** from catalog
   - Enter **Quantity**
   - Unit price auto-fills from catalog (editable)
   - **Discount %** — optional per-item discount
   - **Tax** — select tax group

5. Add more line items as needed
6. Totals (subtotal, tax, discount, grand total) update automatically
7. Click **Save Draft** (to save without sending) or **Send** (to email to the lead)

### 5.2 Versioning

Every time you edit and save a proposal that has already been sent, a **new version** is created (e.g., v1, v2, v3). You can:

- View version history from the Proposals detail page
- Compare any two versions side-by-side
- Restore a previous version

### 5.3 Generating Invoice from Proposal

1. Open a **Won** proposal
2. Click **Generate Invoice**
3. Select **Invoice Type** (Tax Invoice / Proforma Invoice)
4. Review pre-filled data
5. Click **Create Invoice**

### 5.4 RFQ (Request for Quotation) Management

1. Go to **Procurement → RFQs**
2. Click **New RFQ**
3. Fill in:
   - **RFQ Title**
   - **Required Date** — when items are needed
   - **Vendor** — select vendor(s) to request quotes from
   - Add **Line Items** (product, quantity, description)
4. Click **Send to Vendors** — the system sends email notifications to selected vendors
5. Vendors submit quotes; you can compare them in the **Quotes** tab
6. Award the RFQ to a vendor → it becomes a **Purchase Order**

### 5.5 Purchase Orders

- RFQs that are awarded automatically generate Purchase Orders
- **PO Status flow:** Pending → Approved → Sent → Dispatched → Received
- Each status change updates the inventory if products are tracked

---

## 6. Admin Panel

### 6.1 Accessing Admin

Only users with **ADMIN** role can access the Admin section. The **Admin** module appears in the sidebar for admin users.

### 6.2 Users Section

- **View all users** in the organization
- **Invite new users** via email
- **Edit** user details, role, manager
- **Activate / Deactivate** users (deactivated users cannot log in)
- **Reset password** — sends a password-reset email to the user
- **Export** user list to CSV

### 6.3 Roles Section

- **Create / Edit / Delete** roles
- **Hierarchy** — set parent-child relationships between roles
- **Module permissions** — granular access control per module
- **Data visibility** — control what data the role can see

### 6.4 Organization Settings

- **General** — company name, logo, contact
- **Locations** — office / branch addresses
- **Shifts** — working hours configuration
- **Modules** — enable/disable modules for the organization

### 6.5 Audit Trail

1. Go to **Admin → Audit Logs**
2. View a log of all significant actions (creates, updates, deletes) with:
   - User who performed it
   - Action type
   - Date and time
   - Affected record (type + ID)

### 6.6 Product Catalog

1. Go to **Admin → Products**
2. Click **Add Product**
3. Fill in:
   - **Product Name**
   - **SKU** (Stock Keeping Unit — unique identifier)
   - **Category** — select or create a category
   - **Unit Price** — selling price
   - **Cost Price** — purchase cost (for margin calculation)
   - **Tax Group** — select applicable GST rate
   - **Units** — pieces, kg, liters, etc.
   - **Description**
   - **Is Active** — toggle to disable/enable
4. Click **Save**

**Product Categories:**
- Create categories from **Admin → Product Categories**
- Assign products to categories for easier filtering

### 6.7 Vendor Management

1. Go to **Procurement → Vendors**
2. Click **Add Vendor**
3. Fill in vendor details: name, email, phone, address, GST number, payment terms
4. Click **Save**

---

## 7. HR & Attendance

### 7.1 Marking Attendance

1. Go to **HR → Attendance**
2. The current day is shown at the top
3. Click **Check In** when you start work
4. Click **Check Out** when you finish
5. The system auto-calculates hours worked vs. your shift duration

> **Note:** You can only check in once per day. Check-out marks the end of your workday.

### 7.2 Viewing Attendance History

1. Go to **HR → Attendance**
2. Use the **calendar picker** to select a month
3. Your attendance records for the month are shown:
   - ✓ Green = Present
   - ✓ Half = Half day (check-in or check-out missing)
   - ✗ Red = Absent

### 7.3 Manager: Approving Attendance

Managers can approve/reject attendance for their team members:

1. Go to **HR → Attendance → Team Attendance**
2. Select the employee from the list
3. Correct any missing check-in/check-out times
4. Click **Approve** or **Reject** with a note

### 7.4 Applying for Leave

1. Go to **HR → Leave**
2. Click **Apply for Leave**
3. Select:
   - **Leave Type** (Casual Leave, Sick Leave, Earned Leave, etc.)
   - **From Date** and **To Date**
   - **Reason** — brief description
4. Click **Submit**

The request goes to your **reporting manager** for approval.

### 7.5 Leave Workflow

```
Employee submits request
    ↓
Manager receives notification
    ↓
Manager Approves / Rejects
    ↓
Employee notified of outcome
    ↓
If approved, leave is reflected in attendance calendar
```

### 7.6 Shift Management (Admin)

1. Go to **Admin → Shifts**
2. View all shifts and their assignments
3. Assign / reassign employees to shifts
4. Admins can create, edit, and delete shifts

---

## 8. Field Service & Work Orders

### 8.1 Creating a Work Order

1. Go to **Field Service → Work Orders**
2. Click **New Work Order**
3. Fill in:
   - **Title** — brief description of the job
   - **Related Account** — customer account
   - **Location** — service address
   - **Priority** — Low / Medium / High / Urgent
   - **Assigned To** — field technician
   - **Scheduled Date** — when the job should be done
   - **SLA Deadline** — auto-calculated from priority
   - **Description** — detailed work instructions
4. Click **Save**

### 8.2 Work Order Status Flow

```
Assigned → In Progress → On Hold → Completed
                           ↓
                        Cancelled
```

- **Assigned** — work order created, technician notified
- **In Progress** — technician has started work
- **On Hold** — waiting for parts or customer approval
- **Completed** — job done, awaiting customer sign-off
- **Cancelled** — work order cancelled

### 8.3 Parts & Materials

1. Open a work order
2. Go to **Parts** tab
3. Click **Add Part**
4. Select product from catalog, enter quantity used
5. Parts are deducted from inventory on work order completion

### 8.4 Checklist

1. Open a work order
2. Go to **Checklist** tab
3. Add checklist items (e.g., "Check oil", "Inspect filters")
4. Technician checks off items as they complete them
5. Checklist must be 100% complete to mark work order as Completed

### 8.5 Checklist Templates

Admins can create reusable **Checklist Templates** from **Admin → Work Order Templates** that can be applied to new work orders.

---

## 9. Dashboard & Analytics

### 9.1 Dashboard Overview

The Dashboard (home page) shows:

- **Lead Statistics** — new, contacted, qualified, converted counts
- **Opportunity Pipeline** — stage-wise opportunity counts and values
- **Today's Activities** — tasks, meetings, follow-ups due today
- **Attendance Status** — your check-in/check-out for today
- **Leave Balance** — remaining leave days
- **Recent Activities** — latest actions across the system

### 9.2 Lead Analytics

Go to **Analytics → Lead Analytics** for:

- Lead creation trends (line chart by month)
- Lead source effectiveness (bar chart)
- Conversion rates
- Pipeline velocity (avg. time from new to converted)

### 9.3 Sales Analytics

Go to **Analytics → Sales Analytics** for:

- Revenue by month / quarter
- Win/loss ratios
- Average deal size
- Top performing sales reps

### 9.4 Exporting Reports

1. Navigate to any Analytics page
2. Click **Export**
3. Choose format: **Excel**, **CSV**, or **PDF**
4. File downloads automatically

---

## 10. Calendar

### 10.1 Calendar Views

Go to **Calendar** from the sidebar. Available views:

- **Month** — shows all events in a monthly grid
- **Week** — shows events by day and time
- **Day** — detailed view of a single day

### 10.2 Creating an Event

1. Click any date/time slot in the calendar
2. Or click **+ New Event** button
3. Fill in:
   - **Title** — event name
   - **Type** — Meeting / Task / Deadline / Follow-up / Other
   - **Date & Time** — start and end
   - **Attendees** — search and select team members
   - **Related To** — link to a Lead, Opportunity, or Account
   - **Description** — agenda / notes
4. Click **Save**

### 10.3 Inviting Attendees

1. While creating/editing an event
2. In the **Attendees** field, type a name or email
3. Select from the dropdown (shows users in your organization)
4. Attendees receive a notification and the event appears on their calendar

### 10.4 Syncing with Lead

1. While creating an event, type in **Related To**
2. Search for an existing lead or contact
3. The event is linked to that lead's timeline

### 10.5 Employee Filter (Admin)

Admins can see all employees' calendars:

1. Click the **Employee** dropdown at the top of the Calendar page
2. Select one or more employees to view their schedules
3. Useful for capacity planning and attendance verification

---

## 11. Notifications & Chat

### 11.1 Notification Bell

The bell icon (top right) shows:

- **Unread count badge** — number of unread notifications
- **Dropdown list** — recent notifications, newest first
- Click any notification to navigate to the relevant page
- Click **Mark all as read** to clear the badge

### 11.2 Types of Notifications

| Event | Notification |
|---|---|
| New lead assigned to you | "New lead: [Name] assigned to you" |
| Leave request submitted | "[User] applied for leave" |
| Leave approved/rejected | "Your leave request was [Approved/Rejected]" |
| Work order assigned | "Work order #[ID] assigned to you" |
| RFQ quote received | "New quote received for RFQ #[ID]" |
| Chat message | "[User] sent you a message" |

### 11.3 Chat

1. Click the **Chat** icon in the sidebar (if enabled for your role)
2. Available chat types:
   - **Direct Message** — 1-on-1 with any user
   - **Group Chat** — multiple participants
   - **Broadcast** — send to everyone in the organization

### 11.4 Sending a Direct Message

1. In Chat, click **New Message**
2. Type the recipient's name
3. Compose your message
4. Press **Enter** to send

### 11.5 Creating a Group

1. Click **New Chat → Create Group**
2. Give the group a name
3. Add participants by searching for names
4. Click **Create**

---

## Quick Reference: Common Workflows

### Onboarding a New Sales Rep

1. **Admin** creates the role with CRM, Leads, Opportunities permissions
2. **Admin** creates the user and assigns the new role
3. **Admin** adds office location and shift
4. Sales rep logs in, sets password
5. Sales rep can now view and manage their assigned leads

### Handling a New Lead End-to-End

1. Lead comes in → create in **CRM → Leads**
2. Call the lead → log activity in lead detail
3. Qualify → update BANT score
4. Send proposal → **CRM → Proposals → New Proposal**
5. Negotiate → update proposal, send revised version
6. Win → convert proposal status to "Won"
7. Generate invoice → **Proposals → Generate Invoice**

### Processing a Purchase Order

1. **Procurement → RFQs → New RFQ**
2. Add line items, select vendors, send
3. Receive and compare quotes
4. **Award RFQ** → Purchase Order auto-created
5. PO goes through approval workflow
6. Vendor dispatched → update PO status to "Dispatched"
7. Goods received → update to "Received"

### Setting Up Attendance for a New Employee

1. **Admin** creates the user
2. **Admin** creates or assigns a shift that matches the employee's schedule
3. Employee logs in and can now check in/out from **HR → Attendance**

---

> **End of Manual** — For additional help, contact your system administrator.
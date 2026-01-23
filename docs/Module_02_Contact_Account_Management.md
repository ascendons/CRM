# Module 2: Contact & Account Management - Complete Detailed Specification

## Overview
Manage individual contacts (people) and accounts (companies) with comprehensive relationship mapping, 360° views, and hierarchical structures.

---

## 2.1 Contact Management

### Feature: Contact Creation

**Purpose:** Create and store information about individual people at customer/prospect companies.

#### Contact Form Fields

**Basic Information (Required):**
- **Salutation** (Dropdown: Mr., Mrs., Ms., Dr., Prof., None)
- **First Name** (Text, max 50 characters, required)
- **Last Name** (Text, max 50 characters, required)
- **Job Title** (Text, max 100 characters)
    - Examples: "VP of Sales", "Chief Technology Officer", "Marketing Manager"
- **Department** (Dropdown: Sales, Marketing, IT, Operations, HR, Finance, Executive, Engineering, Customer Support, Legal, Other)

**Contact Details:**
- **Email (Primary)** (Email format, required, unique per account)
- **Email (Secondary)** (Email format, optional)
- **Mobile Phone** (Text with country code dropdown)
- **Office Phone** (Text with extension field)
- **Direct Phone** (Text)
- **Fax** (Text, optional - still used in some industries)
- **LinkedIn Profile** (URL, LinkedIn.com domain validation)
- **Twitter Handle** (Text, starts with @, optional)
- **Skype ID** (Text, optional)

**Account Relationship (Required):**
- **Account Name** (Lookup to Accounts table, required)
    - Searchable dropdown showing all active accounts
    - Can create new account inline if doesn't exist
- **Reports To** (Lookup to Contacts table, optional)
    - Select manager/supervisor
    - Creates hierarchical relationship
    - Must be contact from SAME account
- **Contact Role** (Dropdown: Decision Maker, Influencer, Champion, User, Gatekeeper, Blocker, End User)
- **Is Primary Contact** (Checkbox)
    - Only one primary contact per account
    - Auto-unchecks previous primary when setting new

**Address Information:**
- **Mailing Street** (Text)
- **Mailing City** (Text)
- **Mailing State/Province** (Dropdown based on country)
- **Mailing Zip/Postal Code** (Text)
- **Mailing Country** (Dropdown, defaults to user's country)
- **Checkbox:** "Same as Account Address" (auto-fills from account)

**Additional Information:**
- **Birthday** (Date picker, optional)
    - Format: MM-DD-YYYY
    - Used for relationship building, birthday reminders
- **Assistant Name** (Text)
- **Assistant Phone** (Text)
- **Lead Source** (Dropdown: How was this contact acquired)
    - Referral, Website, Cold Call, LinkedIn, Conference, Trade Show, Partner, Other
- **Preferred Contact Method** (Dropdown: Email, Phone, LinkedIn, WhatsApp)
- **Best Time to Contact** (Dropdown: Morning, Afternoon, Evening)
- **Time Zone** (Dropdown: Auto-detected based on location)

**Description & Notes:**
- **Description** (Rich text editor, max 2000 characters)
    - Free-form notes about contact
    - Preferences, interests, background

**System Fields (Auto-generated):**
- **Contact ID:** CONT-YYYY-MM-XXXXX
- **Created Date & Time**
- **Created By** (User who created)
- **Last Modified Date & Time**
- **Last Modified By**
- **Last Activity Date** (Auto-updates when activity logged)
- **Email Opt Out** (Checkbox - GDPR compliance)
    - If checked, cannot send marketing emails
    - Can still send transactional emails
- **Do Not Call** (Checkbox - regulatory compliance)

---

#### Validation Logic

**Field Validations:**

1. **First Name:**
    - Required
    - Minimum 2 characters
    - Maximum 50 characters
    - Only letters, spaces, hyphens, apostrophes
    - No numbers or special characters

2. **Last Name:**
    - Same validation as First Name

3. **Email (Primary):**
    - Required
    - Valid email format (regex validation)
    - Check uniqueness within same account
        - Same person can't have duplicate email at same company
        - But same email can exist across different accounts (different companies)
    - Domain validation (check MX records)
    - Show warning if disposable email domain

4. **Email (Secondary):**
    - Optional
    - If provided, must be valid format
    - Cannot be same as primary email
    - Must be different domain or same domain

5. **Phone Numbers:**
    - Validate international format
    - Remove special characters for storage (spaces, dashes, parentheses)
    - Store normalized: +[country code][number]
    - Example: Input "+91 98765 43210" → Store "+919876543210"

6. **Account Name:**
    - Required
    - Must select existing account OR create new
    - Cannot be blank

7. **Reports To:**
    - Optional
    - If selected, must be contact from SAME account
    - Validation: contact.account_id = reports_to_contact.account_id
    - Cannot report to self (circular reference)
    - Cannot create circular reporting chain (A→B→C→A)

8. **LinkedIn URL:**
    - If provided, must match pattern: linkedin.com/in/[profile]
    - Validate URL format

9. **Birthday:**
    - If provided, must be valid date
    - Cannot be in future
    - Must be reasonable (not > 120 years ago)

10. **Primary Contact:**
    - Only one primary per account allowed
    - When setting as primary:
        - Query: Find other contacts where account_id = this.account_id AND is_primary = true
        - If found, uncheck that contact's is_primary
        - Set this contact's is_primary = true

---

#### Business Logic Flow

**On Form Submit (Create Contact):**

**Step 1: Validate All Fields**
- Run all field validations listed above
- If any validation fails, show inline error
- Prevent submission until all valid

**Step 2: Check for Duplicates**
- Check if contact with same email exists at this account
- Query: SELECT * FROM contacts WHERE email = input.email AND account_id = input.account_id
- If found:
    - Show modal: "Contact with this email already exists at [Account Name]"
    - Options:
        - View Existing Contact
        - Update Existing Contact
        - Create Anyway (if legitimately different person, e.g., same company email for different people)
    - User must choose option

**Step 3: Validate Reports To (if provided)**
- If Reports To field filled:
    - Get selected contact's account_id
    - Verify: reports_to.account_id = this.account_id
    - If different accounts: Show error "Reports To must be contact from same account"
    - Check for circular reporting:
        - Trace hierarchy upward
        - If finds self in chain: Error "Circular reporting relationship detected"
        - Maximum 10 levels depth check

**Step 4: Handle Primary Contact**
- If is_primary checkbox is checked:
    - Query: Find current primary contact for this account
    - If found:
        - Update old_primary.is_primary = false
        - Create activity log: "Primary contact changed from [Old] to [New]"
    - Set this.is_primary = true

**Step 5: Generate Contact ID**
- Format: CONT-YYYY-MM-XXXXX
- YYYY = Current year
- MM = Current month (01-12)
- XXXXX = Auto-increment sequence (00001, 00002...)
- Example: CONT-2024-01-00087

**Step 6: Set System Fields**
- created_date = Current timestamp
- created_by = Logged-in user ID
- last_modified_date = Current timestamp
- last_modified_by = Logged-in user ID
- tenant_id = User's tenant (multi-tenancy)
- last_activity_date = NULL (no activity yet)

**Step 7: Normalize Data**
- Phone numbers: Remove formatting, store as +[country][number]
- Email: Convert to lowercase for consistency
- Name: Title case (capitalize first letter of each word)
- LinkedIn URL: Ensure https:// prefix

**Step 8: Save to Database**
- Insert record into contacts table
- Store all field values
- Ensure tenant isolation (tenant_id filter)

**Step 9: Create Initial Activity**
- Type: "Contact Created"
- Description: "Contact created by [User Name]"
- Timestamp: Current time
- Link to contact record

**Step 10: Update Account**
- Update account.last_modified_date
- If first contact at account: Set as primary automatically
- Increment account.contact_count (cached counter)

**Step 11: Link to Lead (if converting from lead)**
- If contact created during lead conversion:
    - Store lead.converted_to_contact_id = contact.id
    - Create link for traceability

**Step 12: Send Notifications**
- If contact owner different from creator:
    - Email notification: "New contact created and assigned to you"
    - In-app notification
    - Include contact details and account info

**Step 13: Trigger Workflows**
- Check for "Contact Created" workflows
- Execute configured actions (tasks, emails, field updates)

**Step 14: Index for Search**
- Add contact to Elasticsearch index
- Index fields: name, email, title, company, phone
- Enable full-text search

**Step 15: Update Dashboards**
- Increment "Contacts Created Today" counter
- Refresh real-time widgets
- Update contact statistics

**Step 16: Return Response**
- Redirect to contact detail page
- Show success message: "Contact created successfully"
- Display contact ID and name

---

#### Duplicate Contact Handling

**Duplicate Detection Logic:**

**When to Check:**
- On manual contact creation (before save)
- On bulk import (for each row)
- Real-time as user types email

**Matching Criteria:**

1. **Exact Email Match (100% confidence):**
    - Compare: contact.email = input.email
    - Within same account: account_id must match
    - Definite duplicate if match

2. **Similar Email (80% confidence):**
    - Fuzzy match on email local part
    - Example: john.doe@acme.com vs johndoe@acme.com
    - Calculate similarity score

3. **Name Match at Same Account (70% confidence):**
    - First name + Last name match
    - Same account
    - Could be duplicate or relatives/similar names

**Duplicate Modal Display:**

```
⚠ Potential Duplicate Contact Found

Existing Contact:
─────────────────────────────────
Name: John Doe
Title: VP of Sales
Account: Acme Corporation
Email: john.doe@acme.com
Phone: +1-555-1234
Created: Jan 5, 2024
Owner: Sarah Johnson

Your Input:
─────────────────────────────────
Name: John Doe
Title: Senior VP of Sales
Account: Acme Corporation
Email: john.doe@acme.com
Phone: +1-555-1234

What would you like to do?

○ Update existing contact (merge new data)
○ Create new contact anyway (different person)
○ Cancel and review

[Confirm]  [Cancel]
```

**User Options:**

**Option 1: Update Existing**
- Opens merge interface
- Shows side-by-side comparison
- User selects which field values to keep
- Updates existing contact
- Creates activity: "Contact updated from duplicate submission"

**Option 2: Create Anyway**
- Requires reason (text input, required)
- Common reasons:
    - "Different person with same name at company"
    - "Contact changed email address"
    - "Personal vs work email"
- Creates new contact
- Links as "Related Contacts"
- Logs decision for audit

**Option 3: Cancel**
- Returns to form
- Data preserved
- User can edit and try again

---

### Feature: Contact Detail Page (360° View)

**Purpose:** Comprehensive single-page view of all contact information and related data.

#### Page Layout

**Header Section (Always Visible):**

**Left Side:**
- **Contact Photo/Avatar**
    - Upload custom photo OR
    - Auto-generated from initials (colored background)
    - 120x120 pixels, circular crop
- **Contact Name** (Large, prominent)
    - Format: [Salutation] [First Name] [Last Name]
    - Example: "Mr. John Doe"
- **Job Title & Department**
    - Subtitle below name
    - Format: "[Title] at [Account Name]"
    - Example: "VP of Sales at Acme Corporation"
    - Clickable link to account

**Right Side:**
- **Contact Owner** (Avatar and name)
- **Change Owner** button (if permitted)
- **Contact Role Badge** (Color-coded)
    - Decision Maker: Red
    - Influencer: Orange
    - Champion: Green
    - User: Blue
    - Gatekeeper: Yellow
- **Star/Favorite** button (toggle)
- **More Actions** dropdown:
    - Edit Contact
    - Delete Contact
    - Clone Contact
    - Send Email
    - Log Call
    - Schedule Meeting
    - Export vCard
    - Share with Team

**Quick Action Bar:**
- **Email** button (opens email composer with contact)
- **Call** button (click-to-call if enabled)
- **WhatsApp** button (if number available)
- **LinkedIn** button (opens LinkedIn profile)
- **Meeting** button (opens calendar scheduler)

---

**Quick Stats Cards (Below Header):**

Display 4 metric cards:

**Card 1: Total Opportunities**
- Count of all opportunities where this contact is linked
- Total value (sum of amounts)
- Click to see opportunities list

**Card 2: Open Deals**
- Count of open opportunities
- Total value
- Color: Blue

**Card 3: Closed Won**
- Count of won opportunities
- Total revenue generated
- Color: Green

**Card 4: Total Activities**
- Count of all activities (emails, calls, meetings)
- Breakdown by type (icon counts)
- Last activity date

---

**Tab Navigation:**

**Tab 1: Overview (Default)**

**Contact Information Panel (Left Column):**

Organized in collapsible sections:

**Section: Contact Details**
- Salutation, First Name, Last Name
- Job Title, Department
- Email (primary, secondary) with email status indicator
- Mobile, Office, Direct Phone
- LinkedIn, Twitter
- Inline editing: Click any field to edit
- Save/Cancel buttons appear on edit

**Section: Account Information**
- Account Name (link to account)
- Reports To (link to manager contact)
- Contact Role
- Primary Contact (checkbox)

**Section: Address**
- Full mailing address
- Map view (embedded Google Maps)
- "Get Directions" link

**Section: Additional Information**
- Birthday (with "Send Birthday Greeting" button)
- Assistant Name & Phone
- Lead Source
- Preferred Contact Method
- Best Time to Contact
- Time Zone

**Section: Description**
- Rich text notes
- Editable
- Character count

**Section: System Information** (Collapsed by default)
- Contact ID
- Created Date/By
- Last Modified Date/By
- Last Activity Date
- Email Opt Out status
- Do Not Call status

**Activity Timeline Panel (Right Column):**

**Quick Activity Actions:**
- "Log Call" button
- "Send Email" button
- "Add Note" button
- "Schedule Task" button

**Timeline Display:**
- Reverse chronological (newest first)
- Activity type icons (email, call, meeting, note, task)
- For each activity:
    - Icon and type
    - Date/time (relative: "2 hours ago" or absolute: "Jan 15, 2:30 PM")
    - Description/summary
    - User who logged it
    - Expand for full details
- Load more button (pagination, 20 per page)
- Filter by activity type (checkboxes)
- Date range filter

---

**Tab 2: Opportunities**

**Purpose:** Show all opportunities associated with this contact.

**Display:**
- Table view with columns:
    - Opportunity Name (link to opportunity)
    - Account Name
    - Amount (formatted currency)
    - Stage
    - Close Date
    - Probability %
    - Owner
    - Age (days since created)
- Sort by any column (click header)
- Filter by stage, date range, owner
- Search within opportunities

**Actions:**
- "New Opportunity" button (pre-fills contact and account)
- Export to Excel

**Summary Stats Above Table:**
- Total Opportunities: [Count]
- Total Value: [Sum of amounts]
- Average Deal Size: [Average]
- Win Rate: [Won / Total Closed]

---

**Tab 3: Activity (Detailed Timeline)**

**Purpose:** Comprehensive view of all activities with advanced filtering.

**Filter Panel (Left Sidebar):**
- **Activity Type** (checkboxes):
    - ☐ Emails (Sent, Received)
    - ☐ Calls (Inbound, Outbound)
    - ☐ Meetings
    - ☐ Tasks
    - ☐ Notes
    - ☐ File Uploads
    - ☐ Status Changes
- **Date Range:**
    - Presets: Today, This Week, This Month, This Quarter, All Time
    - Custom range (date pickers)
- **User:**
    - Multi-select users
    - Option: "My Activities Only"
- **Outcome:**
    - Successful, Unsuccessful, Pending

**Activity Timeline (Main Area):**
- Same as overview tab but with more detail
- Grouping options:
    - By Date (Today, Yesterday, This Week, Earlier)
    - By Type
    - By User
    - Flat (no grouping)
- Inline actions:
    - Reply to email
    - Edit note
    - Complete task
    - Delete activity (if permitted)

**Export Options:**
- Export to PDF
- Export to Excel
- Email activity summary

---

**Tab 4: Files & Documents**

**Purpose:** All files attached to this contact.

**Display Options:**
- **Grid View:** Thumbnails with file icons
- **List View:** Table with columns (Name, Type, Size, Uploaded By, Date)

**File Categories (Filter):**
- All Files
- Documents (PDF, DOC, XLS, PPT)
- Images (PNG, JPG, GIF)
- Contracts
- Proposals
- Invoices
- Other

**Actions:**
- **Upload Files** button
    - Drag-and-drop area
    - Browse to select
    - Multiple file upload
    - Maximum 10 MB per file
    - Supported types: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, PNG, JPG, GIF, ZIP
- **Bulk Actions:**
    - Download selected
    - Delete selected
    - Move to folder

**For Each File:**
- Preview (if image or PDF)
- Download
- Share (generate link)
- Delete
- Rename
- Add to folder
- Version history (if updated)

**Storage:**
- Files stored in cloud storage (AWS S3 / Google Cloud Storage)
- Database stores metadata (filename, size, type, path, uploaded_by, uploaded_date)
- Virus scanning on upload

---

**Tab 5: Related Contacts**

**Purpose:** Show other contacts from same account and reporting relationships.

**Sections:**

**Section 1: Reporting Hierarchy**
- Visual org chart (tree diagram)
- Shows reporting chain:
    - This contact's manager (Reports To)
    - This contact
    - Direct reports (contacts who report to this person)
- Click any contact in chart to navigate to them
- Expand/collapse nodes
- Export org chart as image

**Section 2: All Contacts at Account**
- Table showing all contacts from same account
- Columns: Name, Title, Email, Phone, Role, Primary
- Highlight this contact in list
- Click row to navigate
- Filter by role, department

**Section 3: Related Contacts** (Custom Relationships)
- Manually added relationships
- Types: Spouse, Assistant, Team Member, Reports To Indirectly
- Add/remove relationships

---

**Tab 6: Notes**

**Purpose:** Sticky notes and important information about contact.

**Display:**
- Grid of note cards
- Each note shows:
    - Title (optional)
    - Content (rich text)
    - Created by
    - Created date
    - Last edited date
    - Pin icon (pinned notes stay at top)

**Actions:**
- "New Note" button
    - Modal or inline editor
    - Rich text formatting
    - @ mention other users
    - Attach files
    - Set reminder
- Edit note (pencil icon)
- Delete note (trash icon)
- Pin/Unpin note

**Note Categories:**
- Personal (visible only to me)
- Shared (visible to team)
- Public (visible to all with access)

---

#### Business Logic: Contact 360° Page

**Page Load Sequence:**

**Step 1: Fetch Contact Data**
- Query contact record by ID
- Include all fields
- Join with account table for account details
- Join with user table for owner details

**Step 2: Calculate Quick Stats**
- Count opportunities linked to contact:
  ```
  Total Opps = COUNT(*) FROM opportunities WHERE contact_id = this_contact
  Total Value = SUM(amount) FROM opportunities WHERE contact_id = this_contact
  Open Deals = COUNT(*) WHERE status = 'Open'
  Won Deals = COUNT(*) WHERE status = 'Closed Won'
  ```
- Count activities:
  ```
  Total Activities = COUNT(*) FROM activities WHERE contact_id = this_contact
  ```
- Get last activity date:
  ```
  Last Activity = MAX(activity_date) FROM activities WHERE contact_id = this_contact
  ```

**Step 3: Load Recent Activities (for Overview Tab)**
- Query activities table
- Filter: contact_id = this_contact
- Order by: activity_date DESC
- Limit: 20 (first page)
- Include: activity type, date, description, user

**Step 4: Check Permissions**
- Verify user can view this contact
- Check based on:
    - Contact owner (if user is owner, allow)
    - User role (manager can see team contacts)
    - Sharing rules (explicit sharing)
    - Account access (if user can see account, can see contacts)
- If no permission: Show error "Insufficient privileges"

**Step 5: Load Reporting Hierarchy** (if on Related Contacts tab)
- Recursive query to build org chart
- Start with this contact
- Find manager (Reports To)
- Find direct reports
- Maximum 5 levels up, unlimited down
- Stop at circular reference

**Step 6: Set Page State**
- Mark contact as "viewed" for current user
- Update last_viewed_date
- Track page view for analytics
- Add to user's "Recently Viewed" list

**Step 7: Real-Time Updates** (WebSocket)
- Subscribe to contact record updates
- If another user edits contact:
    - Show notification: "This contact was updated by [User]"
    - Option to refresh page
- Prevents conflicting edits

**Step 8: Lazy Load Tabs**
- Only load data when user clicks tab
- Overview: Loaded immediately
- Opportunities: Load when tab clicked
- Files: Load when tab clicked
- This improves initial page load speed

---

### Feature: Contact Hierarchy & Org Charts

**Purpose:** Visualize reporting structure within organization.

#### Hierarchy Relationships

**Reports To Field:**
- Dropdown lookup to other contacts
- Filter: Only show contacts from SAME account
- Creates parent-child relationship
- One contact can only report to ONE other contact
- But one contact can have MULTIPLE direct reports

**Validation Rules:**

**Rule 1: Same Account**
- Manager must be from same account as employee
- Validation:
  ```
  IF reports_to_contact IS NOT NULL:
      IF reports_to_contact.account_id != this_contact.account_id:
          ERROR: "Reports To must be contact from same account"
  ```

**Rule 2: No Self-Reporting**
- Contact cannot report to itself
- Validation:
  ```
  IF reports_to_contact.id == this_contact.id:
      ERROR: "Contact cannot report to itself"
  ```

**Rule 3: No Circular Reporting**
- Prevent: A → B → C → A
- Validation algorithm:
  ```
  FUNCTION check_circular(contact, original_contact, depth=0):
      IF depth > 10:
          RETURN ERROR "Maximum hierarchy depth exceeded"
      
      IF contact.reports_to_id IS NULL:
          RETURN OK (reached top of hierarchy)
      
      IF contact.reports_to_id == original_contact.id:
          RETURN ERROR "Circular reporting detected"
      
      manager = GET_CONTACT(contact.reports_to_id)
      RETURN check_circular(manager, original_contact, depth+1)
  ```

**Rule 4: Maximum Depth**
- Limit hierarchy to 10 levels
- Prevents overly complex structures
- Easier to visualize

---

#### Org Chart Visualization

**Visual Display:**

**Tree Structure:**
```
                    CEO
                     |
          ┌──────────┴──────────┐
          │                     │
     VP Sales              VP Engineering
          |                     |
    ┌─────┴─────┐         ┌────┴────┐
    |           |         |         |
Sales Mgr   Sales Mgr   Eng Mgr   Eng Mgr
    |
  ┌─┴─┐
  |   |
Rep Rep
```

**Node Display:**
- Each node shows:
    - Contact photo/avatar
    - Name
    - Job Title
    - Email (on hover)
    - Phone (on hover)
- Click node to navigate to contact detail
- Different colors for different levels
- Highlight current contact in tree

**Interactions:**
- **Zoom:** In/out controls
- **Pan:** Drag to move around large trees
- **Expand/Collapse:** Click node to expand/collapse children
- **Fullscreen:** View in fullscreen mode
- **Export:** Download as PNG or PDF

**Alternative Views:**

**1. Horizontal Tree:** Left to right layout
**2. Radial/Circle:** CEO in center, radiating outward
**3. List View:** Indented list showing hierarchy

---

#### Building the Org Chart

**Algorithm:**

**Step 1: Find Root**
- Start with current contact
- Traverse upward (follow Reports To) until no more parent
- This is the root (typically CEO or top executive)

**Step 2: Build Tree Recursively**
```
FUNCTION build_tree(root_contact):
    node = {
        contact: root_contact,
        children: []
    }
    
    // Find all direct reports
    direct_reports = GET_CONTACTS WHERE reports_to_id = root_contact.id
    
    // Recursively build tree for each child
    FOR EACH report IN direct_reports:
        child_node = build_tree(report)
        node.children.ADD(child_node)
    
    RETURN node
```

**Step 3: Render Tree**
- Use D3.js or similar library
- Calculate node positions
- Draw connecting lines
- Render contact cards at each node

**Step 4: Handle Large Trees**
- If > 50 nodes: Initially collapse all except path to current contact
- Lazy load: Only load children when parent expanded
- Search functionality to jump to specific contact

---

#### Use Cases for Hierarchy

**1. Identify Decision Chain:**
- See who current contact reports to
- Trace all the way to C-level
- Understand decision-making authority

**2. Multi-Threading:**
- Identify multiple contacts at account
- Different levels for different purposes
- Coach (lower level), Decision Maker (C-level)

**3. Stakeholder Mapping:**
- Map all stakeholders involved in deal
- Understand relationships
- Plan engagement strategy

**4. Account Coverage:**
- See which contacts we have
- Identify gaps (missing decision makers)
- Prioritize relationship building

---

### Feature: Contact Email Status

**Purpose:** Track email deliverability and engagement for each contact.

#### Email Status Types

**1. Verified ✓ (Green)**
- Email verified as valid and deliverable
- Last verification date within 30 days
- Safe to send emails

**2. Unverified ⚠ (Yellow)**
- Email not yet verified OR
- Verification older than 30 days
- Recommend verification before sending

**3. Invalid ✗ (Red)**
- Email failed verification
- Bounced in past
- Domain doesn't exist
- Do not send emails

**4. Bounced 🚫 (Orange)**
- Email bounced when sent
- Hard bounce (permanent failure)
- Update email address

**5. Opted Out 📵 (Gray)**
- Contact unsubscribed from emails
- Cannot send marketing emails
- Can send transactional only

---

#### Verification Logic

**When to Verify:**
- On contact creation (if email provided)
- When email updated
- Manual: User clicks "Verify Email" button
- Automatic: Re-verify every 30 days (batch job)

**Verification Process:**
(See Module 1 Lead Management for detailed email verification logic)

**Quick Summary:**
1. Check email format
2. Validate domain exists (DNS lookup)
3. Check MX records
4. Optional: SMTP verification
5. Store result and date

**Display on Contact:**
- Badge next to email field showing status
- Tooltip on hover:
  ```
  Email Status: Verified ✓
  Last Verified: Jan 15, 2024
  Verification Method: SMTP Check
  [Reverify Now]
  ```

---

#### Bounce Handling

**When Email Bounces:**

**Automatic Detection:**
- Email sent via CRM
- Delivery fails (bounce)
- Email provider sends bounce notification (webhook)
- System processes bounce

**Bounce Types:**

**Hard Bounce (Permanent):**
- Email address doesn't exist
- Domain doesn't exist
- Recipient email server blocked sender
- Action: Mark email as Invalid
- Stop sending to this email

**Soft Bounce (Temporary):**
- Mailbox full
- Server temporarily unavailable
- Email too large
- Action: Retry 3 times over 3 days
- If still bouncing, mark as Invalid

**Bounce Processing Logic:**
```
ON EMAIL BOUNCE RECEIVED:
    1. Parse bounce notification
    2. Extract bounce type (hard/soft)
    3. Find contact by email address
    
    IF hard bounce:
        contact.email_status = "Bounced"
        contact.email_bounce_date = now
        contact.email_opt_out = true (stop sending)
        CREATE activity "Email bounced"
        NOTIFY contact owner
    
    IF soft bounce:
        contact.email_soft_bounce_count += 1
        IF soft_bounce_count >= 3:
            contact.email_status = "Invalid"
            contact.email_opt_out = true
        ELSE:
            RETRY sending after 24 hours
```

**User Notification:**
- Email to contact owner:
    - "Email bounced for [Contact Name]"
    - Bounce reason
    - Suggested action: Update email address
- In-app notification
- Task created: "Update email for [Contact]"

---

### Feature: Contact Merge

**Purpose:** Combine duplicate contact records.

#### When to Merge

**Duplicate Scenarios:**
- Same person with slight name variations
- Same email but different accounts (person changed companies)
- Multiple entries for same person at same company
- Old record + new record for same person

#### Merge Process

**Step 1: Identify Duplicates**
- Search for potential duplicates
- Duplicate Contacts report
- Manual: User finds duplicates

**Step 2: Select Contacts to Merge**
- From Contacts list page
- Select 2 contacts (checkboxes)
- Click "Merge Contacts" button
- Or from contact detail page:
    - Click "Merge with Another Contact"
    - Search and select other contact

**Step 3: Merge Preview**

**Comparison View:**
```
Merge Contacts

Master (Left) will be kept
Duplicate (Right) will be deleted

Field               | Master (✓)        | Duplicate (○)
──────────────────────────────────────────────────────
First Name          | ● John            | ○ Jon
Last Name           | ● Doe             | ○ Doe
Email               | ● john@acme.com   | ○ john.doe@acme.com
Mobile              | ○ +1-555-1111     | ● +1-555-2222
Job Title           | ○ Manager         | ● Senior Manager
Account             | ● Acme Corp       | ● Acme Corp
Reports To          | ○ Sarah           | ● Mike (CEO)
LinkedIn            | ○ (empty)         | ● linkedin.com/in/john
Birthday            | ○ (empty)         | ● Jan 15, 1980

Activities (27 total):
☑ Transfer all activities from duplicate to master
☑ Combine notes
☑ Transfer file attachments

Opportunities (3):
☑ Relink opportunities to master contact

[Merge Contacts]  [Cancel]
```

**Field Selection:**
- Radio buttons to choose value for each field
- Smart defaults:
    - Non-empty over empty
    - More recent over older
    - More complete over less complete
- User can override any selection

**Step 4: Execute Merge**

**Merge Logic:**
```
BEGIN TRANSACTION:
    1. Update master contact with selected field values
    2. Transfer activities:
        UPDATE activities SET contact_id = master.id 
        WHERE contact_id = duplicate.id
    3. Transfer opportunities:
        UPDATE opportunities SET contact_id = master.id
        WHERE contact_id = duplicate.id
    4. Transfer files:
        UPDATE files SET contact_id = master.id
        WHERE contact_id = duplicate.id
    5. Combine notes:
        master.description += "\n\n[From merged contact]\n" + duplicate.description
    6. Update account contact count:
        IF duplicate.is_primary AND NOT master.is_primary:
            master.is_primary = true
    7. Create merge log:
        INSERT INTO contact_merges (master_id, duplicate_id, merged_by, merged_date)
    8. Soft delete duplicate:
        duplicate.is_deleted = true
        duplicate.deleted_date = now
        duplicate.merged_into_contact_id = master.id
    9. Create activity on master:
        "Merged with contact [Duplicate Name] on [Date]"
COMMIT TRANSACTION
```

**Step 5: Post-Merge**
- Redirect to master contact detail page
- Show success message
- Link to view merge log
- Notify contact owner (if different)

---

## 2.2 Account Management

### Feature: Account Creation

**Purpose:** Create and manage company/organization records (B2B customers/prospects).

#### Account Form Fields

**Account Information (Required):**
- **Account Name** (Text, max 200 characters, required, unique)
    - Full legal company name
    - Example: "Acme Corporation Inc."
- **Account Number** (Auto-generated: ACC-YYYY-MM-XXXXX)
    - Unique identifier
    - System-generated, read-only
- **Account Type** (Dropdown, required)
    - Customer (paying customer)
    - Prospect (potential customer)
    - Partner (business partner, reseller)
    - Competitor (competitive intelligence)
    - Former Customer (churned customer)
    - Vendor (supplier to us)
- **Industry** (Dropdown)
    - Technology, Manufacturing, Healthcare, Financial Services, Retail, Education, Real Estate, E-commerce, Consulting, Professional Services, Construction, Transportation, Media, Telecommunications, Energy, Government, Non-Profit, Other
- **Account Owner** (User lookup, required, defaults to current user)
- **Parent Account** (Lookup to other Accounts, optional)
    - Creates hierarchy
    - For subsidiaries, branches, divisions

**Contact Information:**
- **Phone** (Main company number)
- **Fax** (Optional, still used in some industries)
- **Website** (URL with http:// or https://)
    - Auto-validate URL format
    - Try to fetch favicon for display

**Address Information:**

**Billing Address:**
- Street (Textarea, multi-line)
- City (Text)
- State/Province (Dropdown based on country)
- Zip/Postal Code (Text)
- Country (Dropdown)

**Shipping Address:**
- Checkbox: "Same as Billing Address"
    - If checked, auto-copy billing to shipping
- If not checked, separate fields:
    - Street, City, State, Zip, Country

**Financial Information:**
- **Annual Revenue** (Currency with dropdown)
    - Select currency: USD, EUR, GBP, INR, etc.
    - Enter amount
    - Store in base currency, display in user's currency
- **Number of Employees** (Number)
    - Exact count OR
    - Range (1-10, 11-50, 51-200, 201-500, 500+)
- **Ownership** (Dropdown)
    - Public (publicly traded)
    - Private (privately held)
    - Government (government entity)
    - Non-Profit (charitable organization)
    - Subsidiary (part of larger company)
- **Ticker Symbol** (Text, for public companies)
    - Example: AAPL, GOOGL, MSFT
    - Link to stock info

**India-Specific Fields:**
- **GST Number** (Goods and Services Tax ID)
    - Format: 15 characters alphanumeric
    - Pattern: 22AAAAA0000A1Z5
    - Validation: Check digit algorithm
- **PAN Number** (Permanent Account Number)
    - Format: 10 characters
    - Pattern: AAAAA9999A
    - First 5 letters, 4 digits, 1 letter

**Additional Information:**
- **Description** (Rich text editor)
    - Company overview
    - Business model
    - Key products/services
    - Competitive position
- **SIC Code** (Standard Industrial Classification)
    - 4-digit code
    - Used for industry categorization
- **NAICS Code** (North American Industry Classification System)
    - 6-digit code
    - More detailed than SIC
- **Rating** (Dropdown)
    - Hot (high potential, active engagement)
    - Warm (moderate interest)
    - Cold (low engagement, long-term prospect)
- **Account Source** (How did we acquire this account)
    - Inbound, Outbound, Referral, Partner, Conference, Advertisement, Other

**System Fields (Auto-generated):**
- Account ID: ACC-YYYY-MM-XXXXX
- Created Date & Time
- Created By
- Last Modified Date & Time
- Last Modified By
- Last Activity Date (across all contacts)

---

#### Validation Logic

**Field Validations:**

**1. Account Name:**
- Required
- Minimum 2 characters
- Maximum 200 characters
- Check uniqueness:
    - Query: SELECT * FROM accounts WHERE name = input.name AND tenant_id = current_tenant
    - If found: Show warning
        - "Account with this name already exists"
        - Options:
            - View Existing Account
            - Create Anyway (if different company, same name)
    - Fuzzy match check:
        - "Acme Corporation" vs "Acme Corp"
        - If similarity > 85%: Show warning

**2. Account Type:**
- Required
- Must select from dropdown

**3. Website:**
- If provided, validate URL format
- Must start with http:// or https://
- Check domain exists (DNS lookup)
- Try to fetch and display favicon

**4. GST Number (India):**
- If provided, validate format
- 15 characters: 2 digits (state code) + 10 digits (PAN) + 1 digit (entity) + 1 letter (Z) + 1 check digit
- Validation algorithm:
  ```
  FUNCTION validate_gst(gst):
      IF length(gst) != 15:
          RETURN false
      
      state_code = gst[0:2]
      IF NOT is_valid_state_code(state_code):
          RETURN false
      
      pan_part = gst[2:12]
      IF NOT matches_pattern(pan_part, "AAAAA9999A"):
          RETURN false
      
      check_digit = calculate_gst_checksum(gst[0:14])
      IF check_digit != gst[14]:
          RETURN false "Invalid GST check digit"
      
      RETURN true
  ```

**5. PAN Number (India):**
- If provided, validate format
- 10 characters: 5 letters + 4 digits + 1 letter
- Pattern: AAAAA9999A
- 4th character must be 'P' for individual or 'C' for company

**6. Annual Revenue:**
- If provided, must be positive number
- Stored in base currency (USD)
- Displayed in user's currency
- Conversion rate applied

**7. Number of Employees:**
- Must be positive integer
- Reasonable maximum (< 10 million)

**8. Parent Account:**
- If provided, must be existing account
- Cannot be self (account.id = parent.id)
- Cannot create circular hierarchy:
    - A → B → C → A not allowed

**9. Ticker Symbol:**
- If provided, validate format
- 1-5 uppercase letters
- Verify exists via stock API (optional)

---

#### Business Logic Flow

**On Form Submit (Create Account):**

**Step 1: Validate All Fields**
- Run all validation rules
- If any fail, show errors inline
- Prevent submission

**Step 2: Check for Duplicate Accounts**

**Exact Name Match:**
```
duplicates = SELECT * FROM accounts 
             WHERE LOWER(name) = LOWER(input.name) 
             AND tenant_id = current_tenant
```

**Fuzzy Name Match (Catch variations):**
```
potential_duplicates = SELECT * FROM accounts 
                       WHERE SIMILARITY(name, input.name) > 0.85
                       AND tenant_id = current_tenant
```

**If duplicates found:**
- Show modal with matches
- Allow user to:
    - View existing account
    - Update existing account
    - Create new anyway (with reason)

**Step 3: Validate Parent Account (if provided)**
- Verify parent exists
- Check not creating circular hierarchy:
  ```
  FUNCTION check_circular_account(account, parent, depth=0):
      IF depth > 5:
          RETURN ERROR "Maximum hierarchy depth exceeded"
      
      IF parent IS NULL:
          RETURN OK
      
      IF parent.id == account.id:
          RETURN ERROR "Account cannot be its own parent"
      
      IF parent.parent_account_id IS NULL:
          RETURN OK
      
      grandparent = GET_ACCOUNT(parent.parent_account_id)
      RETURN check_circular_account(account, grandparent, depth+1)
  ```

**Step 4: Generate Account Number**
- Format: ACC-YYYY-MM-XXXXX
- Example: ACC-2024-01-00045

**Step 5: Set System Fields**
- created_date = now
- created_by = current_user
- last_modified_date = now
- last_modified_by = current_user
- tenant_id = current_tenant

**Step 6: Enrich Account Data (if API enabled)**
- Call company enrichment API (Clearbit, Hunter, etc.)
- Auto-fill missing fields:
    - Industry
    - Number of Employees
    - Annual Revenue
    - Description
    - Logo
- Store enrichment source and date

**Step 7: Geocode Address**
- Use Google Maps API to geocode billing address
- Get latitude/longitude
- Store for mapping features
- Validate/standardize address format

**Step 8: Save to Database**
- Insert account record
- Store all fields
- Tenant isolation

**Step 9: Create Initial Activity**
- Type: "Account Created"
- Description: "Account created by [User]"
- Timestamp

**Step 10: Link to Parent (if applicable)**
- Update parent's child_account_count
- Add to hierarchy

**Step 11: Send Notifications**
- If owner != creator:
    - Email owner: "New account assigned to you"
    - In-app notification

**Step 12: Trigger Workflows**
- Execute "Account Created" workflows
- Auto-create tasks (e.g., "Research account")

**Step 13: Index for Search**
- Add to Elasticsearch
- Index: name, industry, description, website

**Step 14: Update Statistics**
- Increment accounts created today
- Update dashboards

**Step 15: Return Response**
- Redirect to account detail page
- Show success message
- Display account number

---

### Feature: Account Hierarchy

**Purpose:** Manage parent-child relationships between accounts (e.g., HQ and subsidiaries).

#### Hierarchy Structure

**Parent-Child Relationship:**
- **Parent Account** field creates link
- One account can have ONE parent
- One account can have MULTIPLE children

**Example Hierarchy:**
```
Acme Corporation (HQ)
├── Acme North America
│   ├── Acme USA
│   └── Acme Canada
├── Acme Europe
│   ├── Acme UK
│   ├── Acme Germany
│   └── Acme France
└── Acme Asia Pacific
    ├── Acme India
    ├── Acme Singapore
    └── Acme Australia
```

---

#### Hierarchy Rules

**Rule 1: Single Parent**
- Account can only have ONE parent
- But parent can have many children

**Rule 2: No Self-Parenting**
- Account cannot be its own parent
- Validation: parent_id != account_id

**Rule 3: No Circular Hierarchy**
- Prevent: A → B → C → A
- Validation algorithm (same as contact hierarchy)

**Rule 4: Maximum Depth**
- Limit: 5 levels deep
- Prevents overly complex structures
- Easier to manage and visualize

---

#### Hierarchy Visualization

**Tree View:**

**Display:**
- Visual tree diagram
- Parent at top
- Children below
- Grandchildren further down
- Connecting lines show relationships

**Each Node Shows:**
- Account logo/icon
- Account name
- Account type badge
- Number of employees
- Annual revenue
- Number of opportunities

**Interactions:**
- Click node to navigate to account
- Expand/collapse children
- Zoom in/out
- Export as image/PDF

**Alternative View - List:**
```
Acme Corporation (HQ)
  └─ Acme North America
      └─ Acme USA
      └─ Acme Canada
  └─ Acme Europe
      └─ Acme UK
```
Indented list showing hierarchy

---

#### Rollup Calculations

**Purpose:** Aggregate data from child accounts to parent.

**Rollup Fields:**

**1. Total Revenue:**
- Sum annual revenue from all children
- Include grandchildren (recursive)
- Formula:
  ```
  Total Revenue = this.annual_revenue + SUM(child.total_revenue)
  ```

**2. Total Employees:**
- Sum employees from all children
- Formula:
  ```
  Total Employees = this.employees + SUM(child.total_employees)
  ```

**3. Total Opportunities:**
- Count opportunities at this account + all children
- Formula:
  ```
  Total Opps = COUNT(this.opportunities) + SUM(child.total_opps)
  ```

**4. Total Opportunity Value:**
- Sum opportunity amounts across hierarchy
- Include only open opportunities

**Calculation Logic:**

**Recursive Rollup:**
```
FUNCTION calculate_rollup(account):
    // Start with this account's own values
    total_revenue = account.annual_revenue
    total_employees = account.employees
    total_opps = COUNT(account.opportunities)
    
    // Add children's rollups
    children = GET_CHILD_ACCOUNTS(account.id)
    
    FOR EACH child IN children:
        child_rollup = calculate_rollup(child)  // Recursive
        total_revenue += child_rollup.revenue
        total_employees += child_rollup.employees
        total_opps += child_rollup.opps
    
    RETURN {
        revenue: total_revenue,
        employees: total_employees,
        opps: total_opps
    }
```

**When to Recalculate:**
- When child account data changes
- When account added/removed from hierarchy
- Scheduled: Daily batch job
- Manual: "Recalculate" button for admins

**Display:**
- Show on parent account detail page
- Separate section: "Hierarchy Summary"
- Breakdown: This account vs children

---

#### Hierarchy Management

**Add Child Account:**
1. Go to parent account
2. Click "Add Child Account"
3. Options:
    - Create new account (pre-fills parent)
    - Link existing account
4. If linking existing:
    - Search for account
    - Select account
    - Confirm (updates parent field)

**Remove from Hierarchy:**
1. Go to child account
2. Edit parent account field
3. Clear/remove parent
4. Save
5. Account becomes standalone

**Move in Hierarchy:**
1. Go to account
2. Edit parent account field
3. Select new parent
4. Save
5. Updates hierarchy

**Bulk Operations:**
- Select multiple accounts
- "Change Parent" action
- Set new parent for all

---
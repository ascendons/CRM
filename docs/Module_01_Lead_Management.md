# Module 1: Lead Management - Complete Specification

## Overview
Complete lead lifecycle management from capture through qualification and conversion to opportunities.

---

## 1.1 Lead Creation

### Feature: Manual Lead Entry

**Purpose:** Allow sales reps to manually create leads through a web form.

#### Form Fields

**Basic Information (Required):**
- First Name (Text, max 50 characters)
- Last Name (Text, max 50 characters)
- Email (Email format, must be unique across all leads)
- Phone (Text with country code dropdown)
- Company Name (Text, max 100 characters)

**Contact Details (Optional):**
- Job Title (Text)
- Department (Dropdown: Sales, Marketing, IT, Operations, HR, Finance, Executive, Other)
- Mobile Phone (Text)
- Work Phone (Text)
- LinkedIn Profile (URL)
- Website (URL)

**Company Information:**
- Industry (Dropdown: Technology, Manufacturing, Healthcare, Finance, Retail, Education, Real Estate, E-commerce, Consulting, Professional Services, etc.)
- Company Size (Dropdown: 1-10, 11-50, 51-200, 201-500, 500+)
- Annual Revenue (Currency with dropdown)
- Number of Employees (Number)

**Address Information:**
- Country (Dropdown with search, 200+ countries)
- State/Province (Dynamic dropdown based on country selection)
- City (Text)
- Street Address (Text)
- Postal Code (Text)

**Lead Classification:**
- Lead Source (Dropdown: Website, Referral, Cold Call, LinkedIn, Trade Show, Partner, Advertising, Email Campaign, Other)
- Lead Status (Dropdown: New, Contacted, Qualified, Unqualified, Lost)
- Lead Owner (User lookup dropdown, defaults to logged-in user)
- Expected Revenue (Currency)
- Expected Close Date (Date picker)

**Additional Information:**
- Description/Notes (Rich text editor, max 2000 characters)
- Tags (Multi-select, custom tags for categorization)

**System Fields (Auto-generated, read-only):**
- Lead ID: LEAD-YYYY-MM-XXXXX
- Created Date & Time
- Created By
- Last Modified Date & Time
- Last Modified By
- Last Activity Date

#### Validation Logic

**Field Validations:**
1. **First Name:** Required, minimum 2 characters, only letters, spaces, hyphens, apostrophes
2. **Last Name:** Required, minimum 2 characters, same pattern as first name
3. **Email:** Required, must match email pattern (user@domain.com), check uniqueness in database
4. **Phone:** Required, must be 10-15 digits, international format supported
5. **Company Name:** Required, minimum 2 characters, maximum 100
6. **Expected Revenue:** Must be positive number if provided
7. **Website:** Must be valid URL format (http:// or https://)
8. **LinkedIn:** Must be valid LinkedIn URL format
9. **Expected Close Date:** Cannot be more than 2 years in future (warning)

**Unique Email Check:**
- Query database for existing lead with same email
- If found, show warning with link to existing lead
- Provide options: View Existing, Merge, or Continue Anyway

#### Business Logic Flow

**On Form Submit:**

1. **Validate All Fields:**
   - Check all required fields are filled
   - Validate format of email, phone, URLs
   - Check email uniqueness
   - Validate number fields are numeric
   - Validate dates are in correct format

2. **Generate Unique Lead ID:**
   - Format: LEAD-YYYY-MM-XXXXX
   - YYYY = Current year
   - MM = Current month (01-12)
   - XXXXX = Auto-increment sequence number (00001, 00002, etc.)
   - Example: LEAD-2024-01-00125

3. **Set System Fields:**
   - Created Date = Current timestamp
   - Created By = Logged-in user ID
   - Last Modified Date = Current timestamp
   - Last Modified By = Logged-in user ID
   - Tenant ID = User's tenant (for multi-tenancy)
   - Last Activity Date = null (no activity yet)

4. **Set Default Values:**
   - Lead Score = 0 (will be calculated later)
   - Lead Grade = "D" (will be calculated based on score)
   - Lead Owner = Specified user OR logged-in user if not specified
   - Lead Status = "New" if not specified

5. **Save to Database:**
   - Insert new record in leads table
   - Store all field values
   - Ensure tenant isolation (save tenant_id)

6. **Create Activity Log:**
   - Type: "Lead Created"
   - Description: "Lead created by [User Name]"
   - Timestamp: Current time
   - Link to lead record

7. **Send Notifications:**
   - If owner is different from creator:
     - Send email to lead owner: "New lead assigned to you"
     - Send in-app notification
     - Include lead details (name, company, source)

8. **Trigger Workflows:**
   - Check if any "Lead Created" workflows exist
   - Execute workflow actions (auto-assignment, tasks, emails, etc.)

9. **Update Search Index:**
   - Add lead to Elasticsearch index
   - Index fields: name, email, company, description for full-text search

10. **Update Dashboard Statistics:**
    - Increment total leads count
    - Increment "New Leads Today" counter
    - Update lead source statistics
    - Refresh real-time dashboard widgets

11. **Return Response:**
    - Redirect to lead detail page
    - Show success message: "Lead created successfully"
    - Display lead ID and name

#### User Actions

**Save Button:**
- Validate and save lead
- Stay on lead detail page after save
- Show success toast notification

**Save & New Button:**
- Validate and save current lead
- Clear form and open new blank lead form
- Show success message with link to saved lead
- Useful for rapid data entry

**Save & Convert Button:**
- Validate and save lead
- Immediately open "Convert to Opportunity" dialog
- Pre-fill opportunity data from lead
- Fast-track for hot leads

**Cancel Button:**
- Check if form has unsaved changes
- If yes, show confirmation: "You have unsaved changes. Discard?"
- If confirmed, navigate back to leads list
- If no changes, navigate back immediately

#### UI/UX Requirements

**Form Layout:**
- Group related fields in sections (collapsible panels)
- Use 2-column layout on desktop, 1-column on mobile
- Responsive design for all screen sizes
- Auto-save draft every 30 seconds to prevent data loss

**Inline Validation:**
- Show validation errors as user types (real-time)
- Display error message below field in red
- Show green checkmark for valid fields
- Disable submit button until all required fields valid

**Field Helpers:**
- Required fields marked with red asterisk (*)
- Tooltip icons with examples for complex fields
- Placeholder text showing expected format
- Character counters for text fields with limits

**Auto-completion:**
- Company name field triggers company lookup
- Suggest matching companies from database
- Auto-fill industry, size, revenue if company found
- Allow manual entry if not found

**Accessibility:**
- Keyboard navigation support (Tab, Enter)
- ARIA labels for screen readers
- High contrast mode support
- Focus indicators on all interactive elements

---

### Feature: Bulk Lead Import

**Purpose:** Import hundreds or thousands of leads from CSV/Excel files efficiently.

#### Import Process Flow

**Step 1: File Upload**

**Supported Formats:**
- CSV (.csv)
- Excel (.xlsx, .xls)

**File Constraints:**
- Maximum file size: 5 MB
- Maximum records per import: 1,000 leads
- Must have header row with column names

**Upload Interface:**
- Drag-and-drop zone for file
- Browse button as alternative
- Show file name and size after selection
- Display upload progress bar
- Validate file before processing

**File Validation:**
- Check file extension is allowed
- Verify file size under limit
- Confirm file is readable
- Check for header row
- Count total rows
- Show error if validation fails

---

**Step 2: Column Mapping**

**Auto-Mapping Logic:**
- Parse CSV/Excel header row
- Extract column names
- Match column names to CRM fields (case-insensitive)
- Common mappings:
  - "First Name" → First Name field
  - "Last Name" → Last Name field
  - "Email" or "Email Address" → Email field
  - "Phone" or "Phone Number" → Phone field
  - "Company" or "Company Name" → Company Name field
  - etc.

**Manual Mapping Interface:**
- Show table with two columns:
  - Left: CSV column name
  - Right: CRM field dropdown
- Pre-select auto-matched fields
- Highlight unmapped columns in yellow
- Allow user to select CRM field for each column
- Option to skip columns (don't import)

**Preview Mapping:**
- Show first 5 rows with mapped data
- Display in CRM field structure
- Allow user to verify mapping is correct
- Highlight any data format issues

---

**Step 3: Data Validation**

**For Each Row, Validate:**

1. **Required Fields Check:**
   - First Name present and not empty
   - Last Name present and not empty
   - Email present and not empty
   - Phone present and not empty
   - Company Name present and not empty
   - Mark row as "Error" if any required field missing

2. **Format Validation:**
   - Email: Check format (contains @, has domain)
   - Phone: Check format (10-15 digits)
   - Expected Revenue: Check is numeric
   - Expected Close Date: Check is valid date format
   - URLs: Check valid URL format
   - Mark row as "Warning" if format invalid

3. **Data Type Validation:**
   - Numbers are numeric (revenue, employee count)
   - Dates are in acceptable format
   - Dropdown values exist in system (Industry, Lead Source)
   - Mark invalid data types

4. **Duplicate Detection:**
   - Check email against existing leads in database
   - Check email against other rows in import file
   - Mark as "Duplicate" if found
   - Count total duplicates

5. **Data Quality Checks:**
   - Check for obviously fake emails (test@test.com)
   - Flag disposable email domains
   - Detect gibberish data
   - Warn about incomplete data

**Validation Results:**
- Show summary: X valid, Y warnings, Z errors
- Display validation table with status icons:
  - ✓ Green: Valid row
  - ⚠ Yellow: Warning (can import with caution)
  - ✗ Red: Error (cannot import, needs fix)
- Allow filtering by status
- Export validation report

---

**Step 4: Duplicate Handling**

**Duplicate Options:**

1. **Skip Duplicates:**
   - Don't import rows with duplicate emails
   - Keep existing lead data unchanged
   - Count as "skipped" in report

2. **Update Existing:**
   - Find existing lead by email
   - Update fields with new data from CSV
   - Preserve fields not in CSV
   - Add note: "Updated via import on [date]"
   - Count as "updated" in report

3. **Create as New:**
   - Import duplicate email as new lead
   - Allow duplicate emails in system
   - Useful if intentionally importing related contacts
   - Count as "created" in report

**Smart Update Logic:**
- If update mode selected:
  - Only update fields that have values in CSV
  - Don't overwrite with blank/null values
  - Preserve existing data for unmapped columns
  - Update "Last Modified" timestamp
  - Create activity: "Lead updated via import"

---

**Step 5: Import Options**

**Default Values (for missing data):**
- Lead Status: Dropdown (default: "New")
- Lead Owner: User dropdown (default: current user)
- Lead Source: Dropdown (default: "Import" or user-selected)
- Apply these defaults where CSV has no value

**Notification Settings:**
- Checkbox: "Send email to lead owners"
  - If checked, email each owner about new leads assigned
  - If unchecked, silent import
- Checkbox: "Create follow-up tasks"
  - If checked, create task "Follow up with imported lead" for each
  - Due date: Today + 1 day

**Import Scheduling:**
- Import Now (immediate)
- Schedule for later (date/time picker)
- Useful for off-peak processing

---

**Step 6: Process Import**

**Processing Logic:**

1. **Create Import Job:**
   - Generate Import Job ID: IMP-YYYY-MM-XXXXX
   - Status: "Processing"
   - Total rows: Count from file
   - Store import configuration (mappings, options)

2. **Batch Processing:**
   - Process records in batches of 100
   - For each batch:
     - Read 100 rows
     - Validate each row
     - Apply business logic
     - Insert/update database
     - Track success/failure
   - Continue with next batch

3. **For Each Valid Row:**
   - Generate Lead ID
   - Map CSV data to lead fields
   - Apply default values for missing fields
   - Check duplicate email:
     - If skip mode: Skip row, continue
     - If update mode: Find existing, update fields
     - If create mode: Create new lead
   - Set import metadata (import_id, import_date)
   - Save to database
   - Create activity log
   - Add to success count

4. **Error Handling:**
   - If row fails validation: Add to error list
   - If database error: Rollback that row, continue
   - If critical error: Pause import, notify admin
   - Track all errors with row number and reason

5. **Progress Tracking:**
   - Update import job progress percentage
   - Store counts: processed, success, updated, failed
   - Allow user to view progress in real-time
   - Update dashboard every 100 records

6. **Background Processing:**
   - Run as asynchronous job (don't block UI)
   - Allow user to navigate away
   - Process continues in background
   - Poll for status updates

---

**Step 7: Import Summary**

**Generate Report:**

**Summary Statistics:**
- Total rows in file: 500
- Successfully imported: 475
- Updated existing: 15
- Skipped (duplicates): 5
- Failed (errors): 5
- Processing time: 2 minutes 30 seconds

**Detailed Breakdown:**
- New leads created: 475
- Existing leads updated: 15
- Leads by source: Website (200), Referral (150), Other (125)
- Leads by status: New (450), Contacted (25)
- Leads by owner: User A (200), User B (150), User C (125)

**Error Report:**
- Downloadable CSV file
- Columns: Row Number, Error Type, Data, Suggested Fix
- Examples:
  - Row 45: Missing email, john.doe, Add email address
  - Row 127: Invalid phone, 123, Use valid phone format
  - Row 200: Duplicate email, existing@company.com, Use update mode or skip

**Post-Import Actions:**
- View Imported Leads: Link to filtered list
- Download Error Report: CSV download
- Re-import Failed Rows: Upload corrected CSV
- Close: Return to leads dashboard

**Notifications:**
- Email to importing user:
  - Subject: "Lead import completed"
  - Summary statistics
  - Link to view leads
  - Link to download error report

- Email to lead owners (if enabled):
  - "You have X new leads assigned"
  - List of assigned leads
  - Link to view in CRM

---

**Step 8: Post-Import Processing**

**After Import Completes:**

1. **Trigger Workflows:**
   - For each newly created lead
   - Execute "Lead Created" workflows
   - Apply auto-assignment rules
   - Send welcome emails if configured

2. **Update Search Index:**
   - Bulk index all new leads in Elasticsearch
   - Make searchable immediately
   - Optimize index after bulk import

3. **Recalculate Statistics:**
   - Update dashboard counters
   - Recalculate lead source statistics
   - Update owner workload metrics
   - Refresh real-time charts

4. **Create System Activity:**
   - Log import event in system audit trail
   - Record: who imported, when, how many, from which file
   - Store for compliance and troubleshooting

5. **Cleanup:**
   - Archive uploaded file for 30 days
   - Clean up temporary processing files
   - Mark import job as "Completed"

---

## 1.2 Lead Scoring

### Feature: Automatic Lead Scoring

**Purpose:** Automatically assign a numerical score (0-100) to each lead to prioritize sales efforts and identify the hottest prospects.

#### Scoring Model

**Total Score = Demographic Score (40 points max) + Behavioral Score (60 points max)**

This weighting emphasizes behavioral engagement over static demographics, as engaged leads are more likely to convert.

---

### Demographic Scoring (40 points maximum)

**What it measures:** How well the lead fits your ideal customer profile based on firmographic data.

#### 1. Company Size Scoring (15 points max)

**Logic:**
- Get lead's "Company Size" field value
- Map value to points using this table:

| Company Size | Employees | Points | Reasoning |
|--------------|-----------|--------|-----------|
| Enterprise | 500+ | 15 | Largest budget, multiple departments, highest deal value |
| Large | 201-500 | 12 | Substantial budget, growth potential |
| Mid-Market | 51-200 | 9 | Good budget, faster decisions |
| Small | 11-50 | 6 | Limited budget, but higher volume potential |
| Micro | 1-10 | 3 | Very limited budget, may grow |
| Unknown | - | 0 | No data to score |

**Example:**
- Lead from company with 350 employees → Company Size = "201-500" → 12 points

---

#### 2. Job Title/Role Scoring (15 points max)

**Logic:**
- Get lead's "Job Title" field
- Convert to lowercase for comparison
- Search for keywords indicating seniority level
- Assign points based on decision-making authority

| Role Level | Keywords | Points | Reasoning |
|------------|----------|--------|-----------|
| C-Level Executive | ceo, cto, cfo, cmo, coo, chief, president | 15 | Final decision maker, budget owner |
| Vice President | vp, vice president, svp, senior vice president | 12 | High authority, strong influence |
| Director | director, head of | 10 | Department leader, budget influence |
| Manager | manager, mgr, lead | 8 | Team leader, recommendation influence |
| Executive/Specialist | executive, specialist, senior, coordinator | 5 | End user, some influence |
| Other | - | 0 | Unknown authority level |

**Keyword Matching:**
- Parse job title for keywords (case-insensitive)
- Check in order of priority (C-Level first, then VP, etc.)
- Use first match found
- If multiple keywords match, use highest scoring category

**Examples:**
- "Chief Technology Officer" → contains "chief" → 15 points
- "VP of Engineering" → contains "vp" → 12 points  
- "Software Engineer" → no keywords → 0 points

---

#### 3. Industry Match Scoring (10 points max)

**Logic:**
- Get lead's "Industry" field
- Check against configured target industries list
- Assign points based on strategic fit

**Configuration (Admin Panel):**
- Define "Target Industries" (industries you focus on)
- Define "Adjacent Industries" (industries with some fit)
- All others considered "Low Priority"

| Match Type | Points | Example |
|------------|--------|---------|
| Target Industry | 10 | Your target: Technology, Lead industry: Technology → 10 points |
| Adjacent Industry | 5 | Your target: Technology, Lead industry: Professional Services → 5 points |
| Other Industry | 0 | Your target: Technology, Lead industry: Agriculture → 0 points |

**Example Target Industries:**
- Technology, SaaS, Financial Services, Healthcare

**Example Adjacent Industries:**
- Professional Services, Consulting, Manufacturing (uses technology)

---

**Total Demographic Score Calculation:**

1. Company Size Points (0-15)
2. + Job Title Points (0-15)  
3. + Industry Points (0-10)
4. = Demographic Score (0-40)
5. Cap at 40 if sum exceeds

**Example:**
- Company: 300 employees (201-500) → 12 points
- Title: "Director of IT" → 10 points
- Industry: Technology (target) → 10 points
- **Total Demographic: 32 points**

---

### Behavioral Scoring (60 points maximum)

**What it measures:** How engaged the lead is with your company through various touchpoints.

#### 1. Email Engagement (25 points max)

**Email Opened:**
- Points per open: 5
- Maximum: 15 points (after 3+ opens)
- **Logic:** Count email open events, multiply by 5, cap at 15

**Email Link Clicked:**
- Points per click: 10
- Maximum: 25 points (after 2+ clicks)
- **Logic:** Count link click events, multiply by 10, cap at 25
- Note: Link clicks are stronger signal than opens (requires action)

**Email Unsubscribed:**
- Points: -20 (penalty)
- **Logic:** If unsubscribed, subtract 20 from total score
- Indicates lost interest or annoyance

**Tracking Requirements:**
- Embed tracking pixel in emails (1x1 transparent image)
- When image loads → log "email opened" event
- Replace links with tracking redirects
- When clicked → log "link clicked" event, then redirect

**Example:**
- Lead opened 5 emails → 3 opens counted (capped) → 15 points
- Lead clicked 3 links → 2 clicks counted (capped) → 20 points (using higher cap of 25)
- Total email engagement: 15 + 20 = 25 points (at max)

---

#### 2. Website Activity (24 points max)

**Page Visit:**
- Points per visit: 8
- Maximum: 24 points (after 3+ visits)
- **Logic:** Count unique website sessions, multiply by 8, cap at 24

**Pricing Page Visit:**
- Points: 10 (bonus)
- **Logic:** If visited /pricing page, add 10 points
- Strong buying intent signal

**Careers Page Visit:**
- Points: -5 (penalty)
- **Logic:** If visited /careers page, subtract 5
- Indicates job seeker, not potential buyer

**Tracking Requirements:**
- Install tracking script on website (JavaScript)
- Use cookies to identify visitors
- Match visitor to lead via email (form submission, email link click)
- Log page views with URLs
- Track session duration and pages viewed

**Example:**
- Lead visited website 4 times → 3 visits counted (capped) → 24 points
- Also visited pricing page → +10 points
- Total website: 24 + 10 = 34 points

---

#### 3. Content Engagement (36 points max)

**Whitepaper Download:**
- Points per download: 12
- Maximum: 24 points (after 2+ downloads)
- **Logic:** Count whitepaper downloads, multiply by 12, cap at 24

**Case Study Download:**
- Points per download: 15
- Maximum: 30 points (after 2+ downloads)
- **Logic:** Count case study downloads, multiply by 15, cap at 30
- Higher value than whitepaper (closer to buying stage)

**Webinar Attended:**
- Points: 20 (per webinar)
- **Logic:** If attended live webinar, add 20 points
- High engagement, invested time

**Demo Video Watched:**
- Points: 15
- **Logic:** If watched product demo video (>80% completion), add 15
- Indicates product interest

**Tracking Requirements:**
- Require email to download content (form gate)
- Log download events with content type
- For webinars: Track registration and actual attendance
- For videos: Track play events and watch percentage

**Example:**
- Downloaded 2 whitepapers → 24 points
- Watched demo video → 15 points
- Total content: 24 + 15 = 39 points (under 36 max? No, this can exceed)

*Note: Behavioral sub-scores can individually exceed limits, but total behavioral capped at 60*

---

#### 4. Form Submissions (15-25 points)

**Contact Form:**
- Points: 15
- **Logic:** Submitted general contact/inquiry form

**Demo Request:**
- Points: 20
- **Logic:** Requested product demo (high intent)

**Quote Request:**
- Points: 25
- **Logic:** Requested pricing quote (very high intent, near purchase)

**Tracking Requirements:**
- Capture form submission events
- Store form type with lead
- Log as activity "Form Submitted: [Form Name]"

---

#### 5. Direct Engagement (15-25 points)

**Email Reply:**
- Points: 20
- **Logic:** Lead replied to your email (two-way conversation started)

**Phone Call Answered:**
- Points: 15
- **Logic:** Lead answered your call (live conversation)

**Meeting Attended:**
- Points: 25
- **Logic:** Lead attended scheduled meeting (highest engagement)

**Tracking Requirements:**
- Log all activities (calls, emails, meetings)
- Track response/attendance status
- Link activities to lead record

---

**Total Behavioral Score Calculation:**

1. Query all activities for this lead from database
2. Filter activities by type (email open, click, visit, download, etc.)
3. Count each activity type
4. Calculate points for each category (with caps)
5. Sum all behavioral points
6. Cap at 60 if sum exceeds

**Example:**
- Email opens (3): 15 points
- Link clicks (2): 20 points
- Website visits (3): 24 points
- Whitepaper (1): 12 points
- Email reply (1): 20 points
- **Total: 91 points, but capped at 60**

---

### Final Score Calculation

**Total Lead Score = Demographic Score + Behavioral Score**

**Capping:**
- Minimum: 0 (negative scores reset to 0)
- Maximum: 100

**Example Lead:**
- Demographic: 32 points (company size 12 + title 10 + industry 10)
- Behavioral: 60 points (highly engaged, multiple touchpoints)
- **Total Score: 92**

---

### Lead Grading

**Purpose:** Categorize leads into actionable segments based on score.

| Grade | Score Range | Label | Action | Priority |
|-------|-------------|-------|--------|----------|
| A | 80-100 | Hot Lead | Immediate follow-up (within 1 hour) | Highest |
| B | 60-79 | Warm Lead | Follow up within 24 hours | High |
| C | 40-59 | Cold Lead | Follow up within 3-5 days, nurture campaigns | Medium |
| D | 0-39 | Very Cold | Low priority, drip campaigns | Low |

**Logic:**
- Calculate score
- Check which range score falls into
- Assign corresponding grade letter
- Store grade with lead record
- Use for filtering, reporting, prioritization

---

### Score Recalculation Triggers

**When to Recalculate Score:**

1. **Lead Demographics Updated:**
   - Company size changed
   - Job title changed
   - Industry changed
   - → Recalculate demographic score immediately

2. **Email Activity:**
   - Email sent to lead
   - Email opened by lead
   - Link clicked in email
   - → Recalculate behavioral score immediately

3. **Website Activity:**
   - Lead visits website (tracked via cookie/email)
   - Page view logged
   - → Recalculate behavioral score in real-time or near-real-time

4. **Content Downloaded:**
   - Lead submits form to download content
   - → Recalculate behavioral score immediately

5. **Activity Logged:**
   - Phone call logged
   - Meeting logged
   - Email reply logged
   - → Recalculate behavioral score immediately

6. **Manual Trigger:**
   - User clicks "Recalculate Score" button on lead detail page
   - Admin runs "Recalculate All Scores" batch job

7. **Scheduled Batch:**
   - Daily batch job at midnight
   - Recalculates all lead scores
   - Ensures consistency and catches any missed updates

---

### Score Change Notifications

**Threshold Alerts:**

**Lead Becomes Hot (≥80):**
- Trigger: Score crosses 80 threshold
- Action:
  - Send urgent notification to lead owner
  - Email subject: "🔥 Hot Lead Alert: [Lead Name] scored 85"
  - In-app notification with sound/popup
  - Optional: SMS to owner's mobile
  - Create task: "Follow up with hot lead immediately"

**Significant Score Increase (+20 in 24 hours):**
- Trigger: Score increases by 20+ points within 24-hour period
- Action:
  - Send notification: "Lead heating up: [Lead Name] +25 points"
  - Shows what activities drove increase
  - Suggest immediate action

**Score Drops Below 40:**
- Trigger: Previously higher-scored lead drops to D grade
- Action:
  - Notify owner: "Lead cooling down: [Lead Name] now Cold"
  - Suggest adding to nurture campaign
  - Create task to re-engage

---

### Manual Score Adjustment

**Use Case:** Sales manager overrides automatic score based on insider information.

**Process:**
1. Manager clicks "Adjust Score" button on lead detail
2. Modal opens showing:
   - Current Score: 65 (Grade B)
   - Auto-Calculated Score: 65
   - New Score: [Input 0-100]
   - Reason: [Text area, required]
3. Manager enters:
   - New Score: 85
   - Reason: "CEO confirmed budget and timeline in conversation"
4. Manager clicks "Save"

**Logic:**
- Store manual override in database
- Set flag: manually_scored = true
- Store: manual_score_value, manual_score_reason, adjusted_by, adjusted_date
- Display score shows manual value (85) with indicator
- Auto-calculation paused for this lead
- Show tooltip: "Manually adjusted by [Name] on [Date]: [Reason]"

**Override Expiration:**
- Option 1: Never expire (permanent override)
- Option 2: Expire after X days (auto-resume scoring)
- Option 3: Expire on next status change
- Option 4: Expire on next activity

**Reporting:**
- Track all manual adjustments
- Report showing: who adjusted, when, reason, old vs new score
- Audit compliance

---

## 1.3 Lead Assignment

### Feature: Manual Lead Assignment

**Purpose:** Allow users to assign leads to sales reps manually.

#### Assignment Methods

**1. Assignment on Lead Creation:**
- "Lead Owner" field on create form
- Dropdown showing all active sales users
- Default: Current logged-in user
- User can select different owner before saving

**2. Reassignment from Lead Detail:**
- "Change Owner" button on lead detail page
- Opens assignment modal
- Shows current owner
- Select new owner from dropdown
- Optional: Add assignment note
- Checkbox: "Notify new owner via email"
- Checkbox: "Transfer open tasks to new owner"

**3. Bulk Assignment:**
- On leads list page
- Select multiple leads (checkboxes)
- Click "Assign" button in toolbar
- Opens bulk assignment modal
- Select new owner for all
- Confirm assignment
- Progress indicator for bulk operation

#### Assignment Logic

**Single Lead Assignment:**
1. User selects new owner from dropdown
2. Validate new owner is active user with "Sales" role
3. Store previous owner in variable
4. Update lead.owner_id = new_owner.id
5. Update lead.last_modified_by = current_user.id
6. Update lead.last_modified_date = current_timestamp
7. Create assignment history record:
   - previous_owner, new_owner, assigned_by, assignment_date, assignment_note
8. Create activity log:
   - "Lead reassigned from [Previous] to [New Owner] by [Current User]"
9. If "Transfer Tasks" checked:
   - Find all open tasks where lead_id matches
   - Update task.owner = new_owner
   - Create activity on each task: "Reassigned due to lead ownership change"
10. Send notifications (see below)
11. Update dashboard statistics:
    - Decrement previous owner's lead count
    - Increment new owner's lead count

**Bulk Assignment:**
1. Get list of selected lead IDs (e.g., 50 leads)
2. Process in batches of 10 for performance
3. For each batch:
   - Begin database transaction
   - Update owner for all leads in batch
   - Create assignment history records
   - Create activity logs
   - Commit transaction
4. Track success/failure for each
5. Show progress: "Assigning leads... 30/50 complete"
6. Send single consolidated notification to new owner
7. Show summary: "45 leads assigned successfully, 5 failed"

#### Assignment Notifications

**To Previous Owner:**
- Email subject: "Lead [Lead Name] has been reassigned"
- Body:
  - Lead details (name, company, email)
  - New owner name
  - Reason/note (if provided)
  - Link to lead (read-only access)
- In-app notification badge

**To New Owner:**
- Email subject: "New lead assigned to you: [Lead Name]"
- Body:
  - Lead details (name, company, email, phone)
  - Lead score and grade
  - Lead source
  - Assigned by whom
  - Assignment note
  - Quick actions: View Lead, Call, Email
- In-app notification with popup
- Mobile push notification (if app installed)
- Mark as high priority if lead score > 80

**To Assigner:**
- Confirmation message: "Lead successfully assigned to [New Owner]"
- No email (they initiated the action)

#### Assignment Permissions

**Who Can Assign:**
- **Own Leads:** Any user can reassign leads they own
- **Team Leads:** Managers can assign any lead in their team
- **All Leads:** Admins can assign any lead in system

**Permission Check Logic:**
1. Get current user's role
2. Get lead's current owner
3. Check permission matrix:
   - If user is lead owner → Allow
   - If user role is "Manager" AND lead owner reports to user → Allow
   - If user role is "Admin" → Allow
   - Else → Deny with error "You don't have permission to assign this lead"

#### Assignment History

**Tracking:**
- Store every assignment change in assignment_history table
- Fields: lead_id, from_owner, to_owner, assigned_by, assigned_date, reason

**Display:**
- "Assignment History" section on lead detail page
- Timeline view showing all assignments:
  ```
  Jan 15, 2024 - Assigned to John Smith by Sarah (Manager)
  Reason: John has expertise in technology sector
  
  Jan 10, 2024 - Assigned to Mike Chen by Auto-Assignment
  Reason: Round-robin distribution
  
  Jan 5, 2024 - Created by Sarah Johnson
  Initial owner: Sarah Johnson
  ```

---

### Feature: Automatic Lead Assignment (Round Robin)

**Purpose:** Distribute new leads equally among sales team using round-robin rotation.

#### Configuration (Admin Panel)

**Enable Auto-Assignment:**
- Toggle switch: Enable/Disable
- When enabled, all new leads auto-assigned
- When disabled, leads remain unassigned or assigned to creator

**Select Assignment Method:**
- ○ Round Robin (equal distribution by time)
- ○ Load Balanced (equal distribution by current load)
- ○ Skill-Based (match lead attributes to rep skills)

**Team Selection:**
- Multi-select list of all active sales users
- Check users to include in rotation
- Uncheck to exclude (vacation, capacity reached)
- Show each user's current stats:
  - Active leads: 45
  - Last assigned: 2 hours ago
  - Status: Available / Out of Office

**Assignment Filters:**

Configure rules to assign specific leads to specific users:

**By Geography:**
- If lead.country = "USA" AND lead.state = "California"
  → Assign to: [User A, User B]
- If lead.country = "India" AND lead.state = "Maharashtra"
  → Assign to: [User C, User D]

**By Industry:**
- If lead.industry = "Technology"
  → Assign to: [User A, User E] (technology specialists)
- If lead.industry = "Healthcare"
  → Assign to: [User B] (healthcare specialist)

**By Lead Source:**
- If lead.source = "Referral"
  → Assign to: [Senior reps only]
- If lead.source = "Website"
  → Assign to: [All reps]

**By Company Size:**
- If lead.company_size = "500+"
  → Assign to: [Enterprise reps]
- If lead.company_size = "1-50"
  → Assign to: [SMB reps]

**By Lead Score:**
- If lead.score >= 80
  → Assign to: [Senior reps]
- If lead.score < 40
  → Assign to: [Junior reps or inside sales]

#### Round Robin Algorithm

**How It Works:**

**Concept:** Distribute leads sequentially to users, cycling through the list.

**Implementation:**

1. **Maintain Rotation Queue:**
   - List of eligible users in order
   - Track "last_assigned_timestamp" for each user
   - Initially all users have timestamp = null

2. **On New Lead Created:**
   - Check if auto-assignment enabled
   - Apply filters to get eligible users for this lead
   - From eligible users, find who was assigned least recently
   - Assign lead to that user
   - Update user's last_assigned_timestamp to now

3. **Example:**
   ```
   Users in rotation: Alice, Bob, Charlie
   
   Lead 1 arrives → Last assigned:
     Alice: never → Assign to Alice
   
   Lead 2 arrives → Last assigned:
     Bob: never
     Charlie: never
     Alice: 1 minute ago
     → Assign to Bob (alphabetically first among tied)
   
   Lead 3 arrives → Last assigned:
     Charlie: never
     Alice: 1 minute ago
     Bob: 30 seconds ago
     → Assign to Charlie
   
   Lead 4 arrives → Last assigned:
     Alice: 1 minute ago (oldest)
     Bob: 30 seconds ago
     Charlie: just now
     → Assign to Alice (cycle repeats)
   ```

4. **Tie-Breaking:**
   - If multiple users have same last_assigned_timestamp
   - Use alphabetical order of names
   - Or use user ID order

**Handling User Unavailability:**

**Out of Office:**
- User sets "Out of Office" status with date range
- System automatically excludes from rotation during dates
- Resume rotation when user returns

**Capacity Limits:**
- Set max active leads per user (e.g., 50)
- If user reaches limit, skip in rotation
- Alert manager when user near capacity
- When user closes leads, add back to rotation

**Working Hours:**
- Define working hours per user (timezone-aware)
- Only assign during user's working hours
- Queue leads for assignment when user back online

---

### Feature: Load Balanced Assignment

**Purpose:** Distribute leads based on current workload, not just time.

#### How It Differs from Round Robin

- **Round Robin:** Based on time (who was assigned longest ago)
- **Load Balanced:** Based on current active lead count

#### Algorithm

1. **On New Lead Created:**
   - Get eligible users (after applying filters)
   - For each eligible user:
     - Count active leads (status NOT in [Converted, Lost, Unqualified])
     - Store count
   - Sort users by active lead count (ascending)
   - Assign to user with lowest count

2. **Example:**
   ```
   Current active leads:
   Alice: 15 leads
   Bob: 20 leads
   Charlie: 15 leads
   
   New lead arrives:
   → Alice and Charlie tied at 15 (lowest)
   → Check last_assigned_timestamp among tied users
   → Charlie assigned 1 hour ago, Alice 2 hours ago
   → Assign to Alice
   
   Updated counts:
   Alice: 16 leads
   Bob: 20 leads
   Charlie: 15 leads
   
   Next lead arrives:
   → Charlie has lowest (15)
   → Assign to Charlie
   ```

3. **Tie-Breaking:**
   - If multiple users have same lead count
   - Use round-robin logic (last assigned timestamp)
   - Ensures fairness even with equal loads

#### Benefits
- Automatically balances when users have different workloads
- Compensates if one user on vacation (others had more leads)
- Adjusts for different close rates
- More equitable distribution long-term

---

### Feature: Territory-Based Assignment

**Purpose:** Assign leads based on geographic territory ownership.

#### Territory Setup

**Define Territories:**

**Territory Structure:**
- Territory Name: "North India"
- Territory Code: "NI"
- Geography:
  - Countries: India
  - States: Delhi, Punjab, Haryana, Uttar Pradesh, Uttarakhand
  - Cities: (optional specific cities)
  - Postal Codes: (optional specific ranges)

**Assign Users:**
- Primary Rep: User A (handles most leads)
- Secondary Rep: User B (handles overflow)
- Territory Manager: User C (escalations)

**Another Territory:**
- Territory Name: "South India"
- States: Karnataka, Tamil Nadu, Kerala, Andhra Pradesh, Telangana
- Assigned Users: User D (primary), User E (secondary)

#### Territory Matching Logic

**On New Lead Created:**

1. **Extract Lead Location:**
   - Get lead.country, lead.state, lead.city, lead.postal_code

2. **Find Matching Territory:**
   - Query territories table
   - Match by most specific:
     - Check postal code first (most specific)
     - Then check city
     - Then check state
     - Then check country
   - Use first match found

3. **Example:**
   ```
   Lead location:
   - Country: India
   - State: Maharashtra
   - City: Mumbai
   - Postal Code: 400001
   
   Territory matches:
   - "Mumbai Central" (postal 400001-400100) ← Most specific
   - "Maharashtra" (state level)
   - "India" (country level)
   
   → Assign to "Mumbai Central" territory
   ```

4. **Get Territory Users:**
   - Territory has: User A (primary), User B (secondary)
   - Check availability:
     - User A: Active, not at capacity
     - User B: Active
   - Assign to User A (primary)

5. **No Territory Match:**
   - Lead location doesn't match any territory
   - Options:
     - Assign to default "Unassigned" territory
     - Assign to sales manager for manual review
     - Use fallback assignment (round-robin of all users)

#### Overflow Handling

**If Primary Rep Unavailable:**
- Check primary rep status and capacity
- If unavailable or at capacity:
  - Assign to secondary rep
- If secondary also unavailable:
  - Assign to territory manager
  - Or escalate to next territory level (if hierarchical)

**Example:**
```
Territory: North India
- Primary: User A (50 leads, max 50 - AT CAPACITY)
- Secondary: User B (30 leads, max 50 - Available)

New lead from Delhi arrives:
→ Matches North India territory
→ User A at capacity, skip
→ Assign to User B (secondary)
→ Notify territory manager of capacity issue
```

---

## 1.4 Lead Qualification

### Feature: BANT Qualification Framework

**Purpose:** Structure qualification process to ensure leads meet basic criteria before converting to opportunities.

**BANT = Budget, Authority, Need, Timeline**

#### Qualification Fields

**Budget (B):**

**Fields:**
- Has Budget? (Dropdown: Yes / No / Unknown)
- Budget Amount (Currency, enabled if "Yes")
- Budget Timeframe (Dropdown: This Quarter / Next Quarter / This Year / Next Year)
- Budget Approval Status (Dropdown: Approved / In Approval / Needs Approval / Unknown)

**Qualification Logic:**
- If "Has Budget" = No → Flag as risk, may not qualify
- If "Has Budget" = Yes but Amount = 0 → Prompt for amount
- If Amount < Expected Revenue → Warning "Budget below expected deal size"

---

**Authority (A):**

**Fields:**
- Is Decision Maker? (Dropdown: Yes / No / Unknown)
- Decision Maker Name (Text, required if "No")
- Decision Maker Title (Text)
- Decision Maker Contact (Email/Phone)
- Decision Making Process (Textarea)
- Decision Committee Members (Multi-lookup to Contacts)
- Lead's Role in Decision (Dropdown: Decision Maker / Influencer / Champion / Gatekeeper / End User / Blocker)

**Qualification Logic:**
- If "Is Decision Maker" = No → Require decision maker info
- If decision maker not identified → Can't fully qualify
- Show org chart if multiple contacts from same account

---

**Need (N):**

**Fields:**
- Business Problem (Textarea, required, min 50 characters)
- Pain Points (Textarea, required, min 30 characters)
- Current Solution (Text - what they use now)
- Why Change Now? (Textarea - trigger event)
- Impact of Not Solving (Textarea - cost of inaction)
- Success Metrics (Textarea - how they'll measure success)

**Qualification Logic:**
- Business Problem must articulate clear pain
- If "Current Solution" = competitor → Note for competitive positioning
- "Why Change Now" identifies urgency
- Without clear need, likely won't convert

---

**Timeline (T):**

**Fields:**
- Expected Purchase Date (Date, required)
- Project Start Date (Date - when they want to implement)
- Urgency Level (Dropdown: Urgent / High / Medium / Low)
- Timeline Drivers (Textarea - what creates urgency)
- Potential Delays (Textarea - what could slow process)

**Qualification Logic:**
- If Expected Purchase Date > 12 months → Long-term opportunity, lower priority
- If Urgency = Urgent but Purchase Date far future → Inconsistent, investigate
- Timeline Drivers validate urgency

---

#### Qualification Scoring

**Calculate qualification completeness:**

**Budget Score (0-25 points):**
- Has Budget = Yes + Amount filled + Timeframe: 25 pts
- Has Budget = Yes + Amount filled: 20 pts
- Has Budget = Yes: 15 pts
- Has Budget = Unknown: 10 pts
- Has Budget = No: 0 pts

**Authority Score (0-25 points):**
- Is Decision Maker = Yes: 25 pts
- Is Decision Maker = No + Decision Maker identified + Contact info: 20 pts
- Is Decision Maker = No + Decision Maker identified: 15 pts
- Some authority info: 10 pts
- No authority info: 0 pts

**Need Score (0-25 points):**
- All need fields filled (problem, pain, current, why change): 25 pts
- Problem + Pain + Why change: 20 pts
- Problem + Pain: 15 pts
- Problem only: 10 pts
- No need info: 0 pts

**Timeline Score (0-25 points):**
- Purchase Date + Start Date + Urgency + Drivers: 25 pts
- Purchase Date + Urgency: 20 pts
- Purchase Date + Drivers: 15 pts
- Purchase Date only: 10 pts
- No timeline: 0 pts

**Total Qualification Score = Sum of all (0-100)**

**Qualification Thresholds:**
- 80-100: Highly Qualified (ready to convert)
- 60-79: Qualified (can convert)
- 40-59: Partially Qualified (need more info)
- 0-39: Not Qualified (continue discovery)

---

#### Qualification Actions

**Qualify Button:**
- Available on lead detail page
- Click opens qualification review modal
- Shows BANT scorecard:
  ```
  Budget:    ✓ Complete (25/25)
  Authority: ⚠ Partial (15/25)
  Need:      ✓ Complete (25/25)
  Timeline:  ✓ Complete (25/25)
  
  Total: 90/100 - Highly Qualified
  ```
- If score >= 60:
  - "Mark as Qualified" button enabled
  - Click updates status to "Qualified"
  - Enables "Convert to Opportunity"
- If score < 60:
  - Show missing fields
  - "Need More Info" button
  - Creates task to gather missing data

**Disqualify Button:**
- Opens disqualification modal
- **Reason (required dropdown):**
  - No Budget
  - No Authority (can't reach decision maker)
  - No Need (not a good fit)
  - Timeline Too Long
  - Chose Competitor
  - Unresponsive
  - Not Target Customer
  - Other (text explanation required)
- **Details (textarea):** Explain why
- **Re-evaluate Date (optional):** When to revisit
- Click "Disqualify"
- Updates status to "Unqualified"
- Prevents conversion
- If re-evaluate date set, creates future task

**Need More Info Button:**
- Sets status to "Contacted"
- Creates task: "Complete BANT qualification"
- Lists which sections incomplete
- Due date: Today + 3 days
- Assigns to lead owner

---

### Feature: Qualification Checklist

**Purpose:** Step-by-step checklist ensuring thorough discovery.

#### Checklist Items

**Discovery & Needs (5 items):**
- [ ] Had discovery call (minimum 30 minutes)
- [ ] Identified primary business problem
- [ ] Documented pain points (at least 3)
- [ ] Understood current solution
- [ ] Confirmed why changing now

**Decision Process (4 items):**
- [ ] Identified decision maker
- [ ] Met or spoken with decision maker
- [ ] Mapped decision committee
- [ ] Understood approval process

**Budget & Timeline (4 items):**
- [ ] Confirmed budget availability
- [ ] Identified budget timeframe
- [ ] Established project timeline
- [ ] Identified timeline drivers

**Competitive (3 items):**
- [ ] Identified competitors being evaluated
- [ ] Understood evaluation criteria
- [ ] Positioned unique value

**Next Steps (2 items):**
- [ ] Sent proposal or scheduled demo
- [ ] Defined success metrics

**Total: 18 checklist items**

#### Checklist Logic

**For Each Item:**
- Click checkbox to mark complete
- When checked:
  - Record completion date
  - Record who completed (user)
  - Optional: Add notes
  - Can upload supporting documents
- Can uncheck if needed
- Calculate progress: X/18 completed (Y%)

**Completion Tracking:**
- Show progress bar
- Color coding:
  - 0-25%: Red (just started)
  - 26-50%: Orange (in progress)
  - 51-75%: Yellow (good progress)
  - 76-100%: Green (nearly/fully complete)

**Conversion Requirement:**
- Configuration: "Minimum 80% checklist completion to convert"
- If below threshold:
  - "Convert" button disabled
  - Tooltip: "Complete at least 80% of qualification checklist"
  - Manager can override with approval and reason

**Auto-Complete Items:**
Some items auto-check based on system actions:
- "Had discovery call" → Auto-check when call >30 min logged
- "Sent proposal" → Auto-check when proposal sent
- "Met decision maker" → Auto-check when meeting with decision maker contact logged

**Reminders:**
- If checklist <50% complete after 7 days → Remind owner
- If checklist stalled (no progress in 5 days) → Alert manager
- Configurable reminder schedule

---

## 1.5 Lead Enrichment

### Feature: Auto-Fill Company Information

**Purpose:** Automatically populate company data when user enters company name.

#### How It Works

**User Experience:**
1. User types in "Company Name" field
2. After 3 characters, system queries company database
3. Dropdown shows matching companies:
   ```
   🏢 Acme Corporation
      Technology • 500+ employees • San Francisco, CA
   
   🏢 Acme Industries
      Manufacturing • 201-500 employees • Mumbai, India
   ```
4. User selects company from list
5. System auto-fills all available fields:
   - Website
   - Industry
   - Company Size
   - Annual Revenue
   - Address (Street, City, State, Country, Postal Code)
   - Phone
   - LinkedIn Company Page
   - Description

6. User can edit any auto-filled data
7. User continues with remaining fields

#### Data Sources

**Internal Database:**
- First check if company exists in CRM already
- If found, use existing data (most relevant)
- Faster, no API cost

**External APIs:**

**For International Companies:**
1. **Clearbit API** (primary)
   - Comprehensive company data
   - High accuracy
   - API: POST /v2/companies/find
   - Input: Company name or domain
   - Returns: Full company profile

2. **Hunter.io** (secondary)
   - Company domain info
   - Email patterns
   - Good for contact discovery

**For India Companies:**
1. **IndiaMART API**
   - Large B2B directory
   - Manufacturer/supplier data
   
2. **Ministry of Corporate Affairs (MCA)**
   - Official company registry
   - Director information
   - GST numbers

**Address Validation:**
- Google Maps API / Google Places API
- Validate and standardize addresses
- Get geocoordinates
- Correct formatting

#### Enrichment Logic

**On Company Name Entry:**

1. **Debounce user input**
   - Wait 500ms after user stops typing
   - Prevents API calls on every keystroke

2. **Check internal database:**
   - Query: SELECT * FROM companies WHERE name LIKE '%{input}%'
   - If match found: Return cached data
   - If cache >90 days old: Refresh in background

3. **If not in cache, call external API:**
   - Extract domain if URL provided
   - Call Clearbit: POST /v2/companies/find?domain={domain}
   - If fails, try Hunter.io
   - If looks like Indian company, try IndiaMART

4. **Normalize data:**
   - Map external fields to CRM fields
   - Example: External "sector" → CRM "industry"
   - Standardize company size to ranges
   - Convert currency if needed

5. **Validate address:**
   - Call Google Maps API
   - Standardize format
   - Get coordinates

6. **Cache result:**
   - Store in companies table
   - Save enrichment metadata (source, date, confidence)
   - Cache for 90 days

7. **Return to frontend:**
   - Populate form fields
   - Show confidence indicator
   - Allow user override

**Data Mapping Example:**

```
External API Response → CRM Fields

name: "Acme Corporation" → companyName
domain: "acme.com" → website
category.industry: "Application Software" → industry: "Technology"
metrics.employees: 5000 → companySize: "500+"
metrics.annualRevenue: 500000000 → annualRevenue: 500000000
geo.city: "San Francisco" → city
geo.state: "California" → state
geo.country: "United States" → country
phone: "+1 415-555-1234" → phone
linkedin.handle: "acme-corporation" → linkedIn: "https://linkedin.com/company/acme-corporation"
```

#### Enrichment Quality Indicators

**Show confidence score:**
- Data from Clearbit, 95% confidence ✓
- Data from web scraping, 60% confidence ⚠
- Manual entry required ✗

**Field-level indicators:**
- Green checkmark: High confidence data
- Yellow warning: Medium confidence, verify
- Red flag: Low confidence or old data
- Gray: No data available

#### Cost Management

**API Usage Limits:**
- Clearbit: 600 requests/minute, pay per lookup
- Cache results to avoid repeated lookups
- Set daily budget limit
- Alert admin if approaching limit

**Optimization:**
- Cache company data for 90 days
- Batch enrichment for imports
- Only enrich when user requests (not automatic on every lead)

---

### Feature: Email Validation & Verification

**Purpose:** Validate email format and verify email exists to reduce bounces.

#### Validation Levels

**Level 1: Format Validation (Instant, Client-Side)**

**Check:**
- Contains exactly one @ symbol
- @ not at start or end
- Local part (before @): Letters, numbers, dots, hyphens, underscores
  - No leading/trailing dots
  - No consecutive dots
- Domain (after @): Valid domain format
  - At least one dot
  - TLD at least 2 characters
- No spaces or special characters (except allowed)
- Total length <= 254 characters

**Logic:**
- Use regular expression pattern
- Validate as user types (real-time)
- Show error immediately if invalid
- Example valid: john.doe@example.com
- Example invalid: john..doe@example, john@, @example.com

---

**Level 2: Domain Validation (1-2 seconds, Server-Side)**

**DNS Lookup:**
- Check if domain exists
- Query DNS for A record or MX record
- If no records: Domain doesn't exist, email invalid

**MX Record Check:**
- Check if domain has mail server (MX record)
- MX record = domain can receive email
- If no MX: Domain can't receive email

**Disposable Email Detection:**
- Check domain against list of disposable providers
- Examples: mailinator.com, tempmail.com, guerrillamail.com
- If disposable: Flag as risky
- Warn user: "This appears to be a disposable email"

**Role-Based Detection:**
- Check local part for generic terms
- Examples: info@, admin@, sales@, support@, noreply@
- These are distribution lists, not individuals
- Flag: "Consider finding direct contact email"

---

**Level 3: Mailbox Verification (3-5 seconds, Server-Side)**

**SMTP Check:**
- Connect to mail server from MX record
- Initiate SMTP conversation
- Ask: "Does mailbox exist?"
- Server responds:
  - 250 OK → Mailbox exists ✓
  - 550 User unknown → Doesn't exist ✗
  - 450 Busy → Try again later
- Disconnect (don't actually send email)

**Catch-All Detection:**
- Some domains accept all addresses (catch-all)
- Test random address: randomstring12345@domain.com
- If accepted → Catch-all domain
- Can't confirm specific mailbox exists
- Flag as "Unverified"

**Limitations:**
- Some servers block verification (greylisting)
- False positives possible
- Can be slow (3-5 seconds)

---

#### Verification Results

**Email Status:**

**Valid ✓ (Green):**
- Format correct
- Domain exists
- MX record found
- Mailbox verified
- Action: Safe to email

**Valid (Unverified) ⚠ (Yellow):**
- Format correct
- Domain exists
- Mailbox not verified (catch-all or blocked)
- Action: Proceed with caution

**Invalid ✗ (Red):**
- Format incorrect OR
- Domain doesn't exist OR
- Mailbox doesn't exist
- Action: Do not email

**Risky ⚠ (Orange):**
- Disposable email
- Role-based email
- Spam trap suspected
- Action: Manual review

**Unknown ? (Gray):**
- Verification failed (timeout, error)
- Action: Retry or manual review

---

#### Verification Logic

**On Email Entry:**

1. **Client-side format check:**
   - Validate pattern immediately
   - If invalid: Show error, don't proceed

2. **Server-side validation (async):**
   - On field blur or 1 second after typing stops
   - Check cache first:
     - Query email_verifications table
     - If verified within 30 days: Return cached result
     - If >30 days old: Re-verify

3. **If not in cache:**
   - **Step 1:** DNS lookup for domain
   - **Step 2:** Check MX records
   - **Step 3:** Check disposable list
   - **Step 4:** Check role-based
   - **Step 5:** (Optional) SMTP verification

4. **Store result:**
   - Save in email_verifications table
   - Cache for 30 days
   - Fields: email, status, verification_date, source

5. **Update UI:**
   - Show status indicator next to field
   - Color-code (green/yellow/red)
   - Tooltip with details

6. **Handle invalid:**
   - If invalid: Block form submission
   - Show error: "Please enter a valid email"
   - Suggest correction if common typo

---

#### Bulk Verification

**For Import:**
- User uploads CSV with emails
- System verifies all emails in background
- Shows progress
- Returns results:
  - 450 valid
  - 30 risky
  - 20 invalid
- Download cleaned list

---

## 1.6 Lead Duplicate Detection & Merge

### Feature: Automatic Duplicate Detection

**Purpose:** Prevent duplicate leads from entering system.

#### Matching Criteria

**1. Exact Email Match (100% Confidence)**
- Compare emails (case-insensitive)
- If match → Definite duplicate

**2. Phone Number Match (90% Confidence)**
- Normalize phone numbers:
  - Remove spaces, dashes, parentheses
  - Remove country codes
  - Compare digits only
- Example: +91-98765-43210 = 9876543210
- If match → Likely duplicate

**3. Company + Name Match (80% Confidence)**
- Compare company name AND (first + last name)
- Use fuzzy matching for typos
- Example:
  - "Acme Corp" + "John Doe"
  - vs "Acme Corporation" + "John Doe"
  - Similarity: 85% → Probable duplicate

**4. Similar Email (70% Confidence)**
- Variations of same email:
  - john.doe@acme.com
  - vs johndoe@acme.com (dot removed)
  - vs j.doe@acme.com (abbreviated)

**5. Name + Company + City (60% Confidence)**
- Same person might exist
- Or different people at same company
- Requires manual review

#### Duplicate Detection Flow

**On Manual Lead Creation:**

1. **Real-Time Email Check:**
   - User enters email
   - On blur: Check for exact match
   - If found: Show inline warning
   - "⚠ Lead with this email exists. View existing lead"

2. **Pre-Save Comprehensive Check:**
   - User fills all fields
   - Clicks "Save"
   - Before saving, run all duplicate checks
   - If matches found: Block save, show modal

**Duplicate Detection Modal:**

```
⚠ Potential Duplicate Detected

We found 2 existing leads that may be the same person:

┌─────────────────────────────────────────┐
│ Match 1: 100% (Exact Email)             │
│ Name: John Doe                          │
│ Company: Acme Corp                      │
│ Email: john.doe@acme.com                │
│ Phone: +91-9876543210                   │
│ Status: Contacted                       │
│ Owner: Sarah                            │
│ Created: Jan 10, 2024                   │
│ [View Lead] [Merge with This]          │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Match 2: 80% (Name + Company)           │
│ Name: John Doe                          │
│ Company: Acme Corporation               │
│ Email: j.doe@acme.com                   │
│ [View Lead] [Merge with This]          │
└─────────────────────────────────────────┘

What would you like to do?

○ Merge with existing lead (select above)
○ Create as new anyway (different person)
○ Cancel and review

[Confirm]  [Cancel]
```

**User Options:**

**Option 1: Merge**
- Select which existing lead to merge with
- Opens merge interface (see below)

**Option 2: Create Anyway**
- User must provide reason:
  - "Different person at same company"
  - "Previous lead was converted"
  - "Different role/department"
  - Other (text explanation)
- System creates new lead
- Links as "Related Leads"
- Logs decision for audit

**Option 3: Cancel**
- Return to form
- Edit information
- Try again

---

**On Bulk Import:**

1. **For each row:**
   - Run duplicate check
   - If duplicate: Mark row

2. **After parsing:**
   - Show summary:
     - 450 unique leads
     - 50 potential duplicates

3. **Duplicate handling options:**
   - Skip all duplicates
   - Update existing (merge data)
   - Import all as new
   - Review individually

4. **If review individually:**
   - Show each duplicate with options
   - User decides per case

---

### Feature: Lead Merge

**Purpose:** Combine duplicate lead records into single master.

#### Merge Interface

**Side-by-Side Comparison:**

```
Merge Leads

Left (Master) will be kept
Right (Duplicate) will be deleted

Field           | Existing (✓)      | New (○)
─────────────────────────────────────────────
First Name      | ● John            | ○ John
Last Name       | ● Doe             | ○ Doe
Email           | ● john@acme.com   | ○ john@acme.com
Phone           | ○ +91-9876543210  | ● +91-9876554321
Company         | ● Acme Corp       | ○ Acme Corporation
Job Title       | ○ Manager         | ● Senior Manager
Lead Source     | ● Website         | ○ Referral
Lead Status     | ○ New             | ● Contacted
Lead Score      | ○ 45              | ● 72

Description:
[Combine] 
Existing: Initial inquiry about enterprise plan
New: Follow-up from webinar attended

Activities:
☑ Transfer all activities from duplicate to master
☑ Combine notes and comments
☑ Transfer attachments

[Merge Leads]  [Cancel]
```

**For Each Field:**
- Radio buttons to select which value to keep
- Can choose from existing or new
- Some fields combinable (descriptions, notes)

**Smart Default Selection:**
- Email: Use existing (master)
- Phone: Use newer or more complete
- Score: Use higher score
- Status: Use more advanced status
- Dates: Earliest created, latest modified
- Empty fields: Use non-empty value

---

#### Merge Logic

**When user clicks "Merge Leads":**

1. **Validate selection:**
   - Ensure radio button selected for each field
   - Or use smart defaults

2. **Begin transaction:**
   - Start database transaction
   - Rollback if any step fails

3. **Update master lead:**
   - Apply selected field values
   - Recalculate lead score if needed
   - Update last modified timestamp

4. **Transfer activities:**
   - Get all activities for duplicate lead
   - Update activity.lead_id to master lead ID
   - Preserve timestamps and owners
   - Add note: "Transferred from merged lead [ID]"

5. **Transfer attachments:**
   - Move all files to master lead
   - Update file.lead_id references

6. **Transfer relationships:**
   - Campaign memberships
   - List memberships
   - Custom object relationships

7. **Create merge log:**
   - Record in lead_merges table:
     - master_lead_id
     - duplicate_lead_id
     - merged_by (user ID)
     - merged_date
     - field_selections (JSON)

8. **Create activity:**
   - On master lead
   - "Merged with lead [Duplicate ID] on [Date]"

9. **Soft delete duplicate:**
   - Set is_deleted = true
   - Set deleted_date = now
   - Set deleted_by = current user
   - Set merged_into_lead_id = master ID
   - Keep record for audit (don't hard delete)

10. **Commit transaction:**
    - If all successful: Commit
    - If error: Rollback, show error

11. **Update references:**
    - Any reports, dashboards
    - Point to master lead

12. **Notify stakeholders:**
    - If different owners:
      - Notify duplicate owner
      - "Your lead was merged into lead owned by [Name]"
    - Tasks reassigned if needed

13. **Redirect:**
    - Navigate to master lead detail page
    - Show success: "Leads merged successfully"

---

## 1.7 Lead Status Management

### Feature: Lead Status Tracking

**Purpose:** Track lead progression through sales process.

#### Default Lead Statuses

**1. New**
- Just created, not yet contacted
- Auto-assigned to new leads
- High priority for first contact

**2. Contacted**
- First touch made (call, email, meeting)
- Auto-updates when first activity logged
- In active sales process

**3. Qualified**
- Passed qualification criteria (BANT)
- Ready for opportunity conversion
- Can be converted

**4. Proposal Sent**
- Proposal or quote shared
- Awaiting response
- Near closing stage

**5. Negotiation**
- Discussing terms, pricing
- Active deal discussions
- High engagement

**6. Unqualified**
- Doesn't meet criteria
- Won't convert to opportunity
- End status (closed)

**7. Lost**
- Not interested or chose competitor
- End status (closed)
- Requires reason

**8. Converted**
- Successfully converted to opportunity
- End status (successful)
- Read-only after conversion

#### Status Properties

**Each Status Has:**
- Status Name
- Status Order (sequence 1, 2, 3...)
- Status Color (for visual coding)
- Is Active? (Yes/No)
- Is End Status? (Yes for Lost/Converted/Unqualified)
- Required Fields (must fill before moving here)
- Auto-trigger Actions

**Example Configuration:**

```
Status: Qualified
Order: 3
Color: Blue
Active: Yes
End Status: No
Required Fields:
  - Business Problem (must be filled)
  - Budget Amount (must have value)
  - Expected Close Date (must be set)
Actions on Entry:
  - Create task "Schedule proposal presentation"
  - Notify sales manager
```

#### Status Change Logic

**Allowed Transitions:**
- New → Contacted (after activity)
- Contacted → Qualified (after qualification)
- Qualified → Proposal Sent (after proposal)
- Proposal Sent → Negotiation
- Any → Unqualified (with reason)
- Any → Lost (with reason)
- Qualified → Converted (creates opportunity)

**Validation:**
- Check required fields filled before allowing status change
- If requirements not met: Show error
- Example: Can't move to Qualified without Business Problem field

**Auto-Status Updates:**
- When first activity logged → New to Contacted
- When qualification score ≥ 60 → Contacted to Qualified
- When proposal sent → Any to Proposal Sent
- Configurable rules

#### Status Change UI

**On Lead Detail Page:**
- Status dropdown at top
- Shows current status with color
- Click to see other statuses
- Select new status
- If end status (Lost, Unqualified):
  - Requires reason (dropdown + text)
  - Requires notes
- If converting to Converted:
  - Opens conversion wizard
- Save status change

**Status Change Tracking:**
- Create activity: "Status changed from [Old] to [New]"
- Store in status_history table:
  - lead_id
  - from_status
  - to_status
  - changed_by
  - changed_date
  - reason (if applicable)
- Show history timeline on lead page

---

## 1.8 Lead Conversion

### Feature: Convert Lead to Opportunity

**Purpose:** Transform qualified lead into sales opportunity.

#### Conversion Prerequisites

**Must Meet:**
- Lead Status = "Qualified"
- Qualification score ≥ 60 (configurable)
- Required BANT fields filled
- No blocking errors

**Pre-Conversion Checklist:**
- Business problem identified ✓
- Decision maker known ✓
- Budget confirmed ✓
- Timeline defined ✓

**If not met:**
- Show error: "Lead not fully qualified"
- List missing items
- Option: "Qualify Now" or "Manager Override"

---

#### Conversion Process

**User clicks "Convert to Opportunity":**

1. **Validation:**
   - Check lead is qualified
   - Check no existing opportunity for this lead
   - Check user has permission

2. **Conversion Modal Opens:**
   ```
   Convert Lead to Opportunity
   
   This will create:
   ☑ Contact (from lead details)
   ☑ Account (company record)
   ☑ Opportunity (sales deal)
   
   Opportunity Details:
   - Name: [Auto: "Acme Corp - CRM Implementation"]
   - Amount: [$50,000] (from expected revenue)
   - Close Date: [2024-06-30]
   - Stage: [Qualification ▼]
   - Owner: [Current User ▼]
   
   [Convert]  [Cancel]
   ```

3. **User reviews/edits:**
   - Opportunity name (editable)
   - Amount (pre-filled from expected revenue)
   - Close date (pre-filled from expected close)
   - Stage (default: first stage)
   - Owner (default: lead owner)

4. **User clicks "Convert":**

---

#### Conversion Logic

**What Happens:**

1. **Create Contact Record:**
   - Copy lead data to new contact:
     - First Name, Last Name
     - Email, Phone
     - Job Title, Department
     - LinkedIn, etc.
   - Generate Contact ID: CONT-YYYY-MM-XXXXX
   - Set created date, created by

2. **Create Account Record:**
   - Copy company data to new account:
     - Company Name → Account Name
     - Industry, Company Size
     - Address, Phone
     - Website, etc.
   - Or link to existing account if company exists
   - Generate Account ID: ACC-YYYY-MM-XXXXX

3. **Link Contact to Account:**
   - Set contact.account_id = account.id
   - Primary contact = true

4. **Create Opportunity Record:**
   - Opportunity Name (from user input)
   - Amount (from expected revenue)
   - Close Date (from expected close)
   - Stage (from user input)
   - Account ID (linked)
   - Contact ID (linked)
   - Owner (from user input)
   - Generate Opportunity ID: OPP-YYYY-MM-XXXXX

5. **Transfer Activities:**
   - Get all activities for lead
   - Copy to opportunity
   - Preserve: Type, Date, Description, Owner
   - Add note: "Transferred from Lead [ID]"
   - Keep original activities on lead (for history)

6. **Transfer Attachments:**
   - Copy all files to opportunity
   - Link to opportunity record

7. **Transfer Qualification Data:**
   - Copy BANT fields to opportunity
   - Budget, Authority, Need, Timeline info
   - Competitors, Next Steps

8. **Update Lead Status:**
   - Set status = "Converted"
   - Set converted_date = now
   - Set converted_to_opportunity_id = new opp ID
   - Set converted_to_contact_id = new contact ID
   - Set converted_to_account_id = new account ID
   - Lead becomes read-only (can view, not edit)

9. **Create Conversion Log:**
   - Record in conversions table:
     - lead_id
     - contact_id
     - account_id
     - opportunity_id
     - converted_by
     - converted_date

10. **Send Notifications:**
    - To opportunity owner (if different):
      - "New opportunity created from lead"
      - Opportunity details
      - Link to opportunity
    - To sales manager:
      - Lead conversion summary
      - Dashboard update

11. **Update Statistics:**
    - Increment conversion count
    - Calculate conversion rate
    - Update forecasts
    - Refresh dashboards

12. **Redirect User:**
    - Navigate to opportunity detail page
    - Show success message
    - Links to Contact and Account

---

#### Post-Conversion

**Lead Record:**
- Status: Converted (locked)
- Read-only (can view, not edit)
- Shows links to:
  - Created Contact
  - Created Account
  - Created Opportunity
- Conversion date and user visible

**If Opportunity Lost Later:**
- Opportunity closed as "Lost"
- Lead remains "Converted"
- Can optionally reopen lead:
  - Create new lead from contact
  - Or manually change status back
  - Requires manager approval

**Conversion Reports:**
- Lead conversion rate
- Time to conversion
- Conversion by source
- Conversion by rep

---


# Module 3: Opportunity Management - Complete Detailed Specification

## Overview
Manage sales opportunities from initial qualification through close, track pipeline stages, forecast revenue, and manage products/pricing.

---

## 3.1 Opportunity Creation

### Feature: Create Opportunity

**Purpose:** Create sales deals/opportunities to track potential revenue and sales progress.

#### Opportunity Form Fields

**Basic Information (Required):**
- **Opportunity Name** (Text, max 120 chars, Required)
   - Descriptive name for the deal
   - Format suggestion: "[Account Name] - [Product/Service]"
   - Examples:
      - "Acme Corp - CRM Implementation"
      - "TechStart Inc - Annual License Renewal"
      - "Global Industries - Consulting Services Q1"
- **Account** (Lookup to Accounts, Required)
   - Must link to existing account
   - Searchable dropdown
   - Shows: Account Name, Industry, Owner
- **Contact** (Lookup to Contacts, Optional but recommended)
   - Primary contact for this opportunity
   - Filter: Only show contacts from selected account
   - Can add multiple contacts later

**Financial Information (Required):**
- **Amount** (Currency, Required)
   - Expected deal value
   - Cannot be negative
   - Can be 0 for strategic deals
   - Format: $50,000.00
   - Multi-currency support
- **Close Date** (Date, Required)
   - Expected closing date
   - Format: MM/DD/YYYY or DD/MM/YYYY based on locale
   - Cannot be more than 5 years in future (warning)
   - Can be in past (for backdating)
- **Currency** (Dropdown)
   - USD, EUR, GBP, INR, JPY, etc.
   - Defaults to account's currency or user's default
   - Exchange rate applied for reporting

**Sales Process:**
- **Stage** (Dropdown, Required)
   - Current stage in sales process
   - Options: Qualification, Needs Analysis, Proposal, Negotiation, Closed Won, Closed Lost
   - Auto-sets probability based on stage
- **Probability** (Percentage, Auto-calculated)
   - Likelihood of closing (0-100%)
   - Maps to stage automatically
   - Can override manually if needed
   - Example: Qualification = 10%, Negotiation = 60%
- **Opportunity Owner** (User lookup, Required)
   - Defaults to current user
   - Can reassign to another sales rep
- **Type** (Dropdown)
   - New Business (new customer or new product to existing)
   - Renewal (contract/subscription renewal)
   - Upsell (selling more to existing customer)
   - Cross-sell (selling different product to existing)

**Classification:**
- **Lead Source** (Dropdown)
   - How did this opportunity originate
   - Website, Referral, Cold Call, Conference, Partner, Inbound, Other
   - Inherited from lead if converted
- **Forecast Category** (Dropdown)
   - Pipeline (possible deal)
   - Best Case (likely to close)
   - Commit (certain to close)
   - Omitted (not forecasting)
   - Used for revenue forecasting
- **Campaign** (Lookup to Marketing Campaigns, Optional)
   - Link to marketing campaign that generated this
   - For ROI tracking

**Additional Details:**
- **Next Step** (Text, max 255 chars)
   - What's the next action needed
   - Examples: "Send proposal", "Schedule demo", "Follow up on contract"
   - Helps team stay aligned
- **Description** (Rich text, max 5000 chars)
   - Detailed notes about opportunity
   - Business requirements
   - Decision criteria
   - Competitive situation
- **Primary Campaign Source** (Lookup)
   - If opportunity influenced by multiple campaigns
   - Which was primary driver

**Competitor Information:**
- **Competitors** (Multi-select or Text)
   - Who are we competing against
   - Options: Salesforce, HubSpot, Zoho, Microsoft, Custom
   - Multiple competitors allowed

**Product Information (Optional at creation):**
- Can add products/line items after creation
- Or add during creation via "Add Products" section

**Dates (System-calculated):**
- **Created Date** (Auto, read-only)
- **Last Modified Date** (Auto, read-only)
- **Last Activity Date** (Auto-updates on any activity)
- **Age** (Days since created, calculated)
- **Days in Stage** (Days since last stage change, calculated)

**System Fields:**
- **Opportunity ID:** OPP-YYYY-MM-XXXXX
- **Created By**
- **Last Modified By**
- **Tenant ID** (multi-tenancy)

---

#### Validation Logic

**Field Validations:**

**1. Opportunity Name:**
- Required
- Minimum 3 characters
- Maximum 120 characters
- Special characters allowed

**2. Account:**
- Required
- Must be existing, active account
- Cannot link to deleted account

**3. Contact:**
- If provided, must be from selected account
- Validation:
  ```
  IF contact IS NOT NULL:
      IF contact.account_id != opportunity.account_id:
          ERROR: "Contact must be from selected account"
  ```

**4. Amount:**
- Required
- Must be numeric
- Cannot be negative (except for credits/refunds)
- Maximum: $999,999,999.99
- If > $1M: Show warning "Large deal, requires approval"

**5. Close Date:**
- Required
- Must be valid date
- If in past: Show warning "Close date is in the past"
- If > 5 years future: Show warning "Close date very far out"
- Cannot be before created date

**6. Stage:**
- Required
- Must be valid stage from configured list
- Cannot skip stages (configurable)
   - Example: Can't go from Qualification directly to Closed Won
   - Must progress through intermediate stages

**7. Probability:**
- Must be 0-100
- Usually auto-set based on stage
- If manually overridden:
   - Must still be 0-100
   - Flag as manually adjusted

**8. Currency:**
- Must be valid currency code
- Check against supported currencies list

**9. Opportunity Owner:**
- Required
- Must be active user
- Must have appropriate role/permissions

---

#### Business Logic Flow

**On Form Submit (Create Opportunity):**

**Step 1: Validate All Fields**
- Run all validation rules
- Check required fields populated
- Validate data formats
- Check business rules
- If validation fails: Show errors, prevent save

**Step 2: Generate Opportunity ID**
- Format: OPP-YYYY-MM-XXXXX
- YYYY = Current year
- MM = Current month
- XXXXX = Auto-increment sequence
- Example: OPP-2024-01-00234

**Step 3: Calculate Probability**
- Get probability from stage configuration
- Stage-to-probability mapping:
  ```
  Qualification: 10%
  Needs Analysis: 20%
  Proposal/Demo: 40%
  Negotiation: 60%
  Verbal Commitment: 80%
  Closed Won: 100%
  Closed Lost: 0%
  ```
- If user manually set probability: Flag override
- Store both calculated and actual probability

**Step 4: Calculate Weighted Amount**
- Formula: `Weighted Amount = Amount × (Probability / 100)`
- Example: $100,000 × 60% = $60,000
- Used for forecasting

**Step 5: Set Stage Information**
- Current stage = selected stage
- Stage entry date = now
- Previous stage = null (new opportunity)
- Days in stage = 0

**Step 6: Set System Fields**
- created_date = Current timestamp
- created_by = Current user ID
- last_modified_date = Current timestamp
- last_modified_by = Current user ID
- tenant_id = User's tenant
- last_activity_date = null

**Step 7: Set Default Values**
- If forecast category not set:
   - If probability ≥ 70%: "Best Case"
   - If probability ≥ 50%: "Pipeline"
   - Else: "Omitted"
- Age = 0
- Days in stage = 0
- Is closed = false
- Is won = false

**Step 8: Currency Conversion**
- If opportunity currency ≠ base currency (USD):
   - Get exchange rate for close date
   - Calculate: amount_usd = amount × exchange_rate
   - Store both original and converted amounts

**Step 9: Link Relationships**
- Link to account (required)
- Link to primary contact (if provided)
- Link to campaign (if provided)
- Link to parent opportunity (if renewal/upsell)

**Step 10: Copy Account Details**
- Copy billing address from account
- Copy shipping address if needed
- Copy payment terms if configured
- Reference data for contracts

**Step 11: Save to Database**
- Insert opportunity record
- Store all field values
- Ensure tenant isolation

**Step 12: Create Initial Activity**
- Type: "Opportunity Created"
- Description: "Opportunity created by [User Name]"
- Timestamp: Current time
- Subject: Opportunity name

**Step 13: Create Default Team**
- Add opportunity owner to opportunity team
- Role: "Opportunity Owner"
- Access: Full
- Add account owner if different
- Role: "Account Owner"
- Access: Read/Write

**Step 14: Update Account**
- Increment account.opportunity_count
- Update account.last_activity_date
- Add to account's pipeline value

**Step 15: Send Notifications**
- If owner ≠ creator:
   - Email notification: "New opportunity assigned to you"
   - In-app notification
   - Include: Opportunity name, account, amount, close date
- If large deal (> $100K):
   - Notify sales manager
   - Subject: "Large opportunity created: $XXX,XXX"

**Step 16: Trigger Workflows**
- Execute "Opportunity Created" workflows
- Examples:
   - Create task: "Schedule discovery call"
   - Send email: "Welcome to sales process"
   - Update fields
   - Call webhook

**Step 17: Update Forecast**
- Add to current period forecast
- Recalculate team pipeline
- Update dashboards

**Step 18: Index for Search**
- Add to Elasticsearch
- Index: name, account, description, products

**Step 19: Update Statistics**
- Increment opportunities created today
- Update pipeline metrics
- Refresh real-time widgets

**Step 20: Return Response**
- Redirect to opportunity detail page
- Success message: "Opportunity created successfully"
- Show opportunity ID and name

---

### Feature: Opportunity Detail Page (360° View)

**Purpose:** Comprehensive view of opportunity with all related information.

#### Page Layout

**Header Section:**

**Left Side:**
- **Opportunity Name** (Large, bold)
   - Editable inline (click to edit)
- **Account Name** (Clickable link)
   - Opens account detail
- **Primary Contact** (Clickable link)
   - Opens contact detail
- **Stage Badge** (Color-coded)
   - Visual indicator of current stage
   - Color examples:
      - Qualification: Gray
      - Proposal: Blue
      - Negotiation: Orange
      - Closed Won: Green
      - Closed Lost: Red

**Right Side:**
- **Amount** (Large, prominent)
   - Display currency symbol
   - Example: $125,000.00
- **Close Date**
   - Show days until/past close
   - "Closes in 15 days" or "15 days overdue"
- **Probability**
   - Percentage with progress bar
- **Opportunity Owner**
   - Avatar and name
   - Change owner button

**Quick Actions Bar:**
- **Edit** (edit all fields)
- **Clone** (duplicate opportunity)
- **Delete** (soft delete with confirmation)
- **Share** (share with team members)
- **Convert to Quote** (generate quote)
- **Add Product** (add line items)
- **Log Activity** (call, meeting, note)
- **Close Won** (mark as won)
- **Close Lost** (mark as lost)
- **More** (dropdown for additional actions)

---

**Key Metrics Row:**

**4 Cards:**

**Card 1: Weighted Value**
- Amount × Probability
- Used for forecasting
- Example: $125,000 × 60% = $75,000

**Card 2: Age**
- Days since created
- Visual indicator:
   - < 30 days: Green
   - 30-60 days: Yellow
   - > 60 days: Red
- Average sales cycle for comparison

**Card 3: Days in Stage**
- Days in current stage
- Expected duration for stage
- Warning if exceeding expected
- Example: "14 days (Expected: 10 days)"

**Card 4: Next Activity**
- Date and type of next scheduled activity
- Or "No activity scheduled" warning
- Link to create activity

---

**Main Content - Tabbed Interface:**

**Tab 1: Details**

**Left Column:**

**Opportunity Information:**
- All fields from create form
- Inline editing enabled
- Save button appears on change

**Additional Fields:**
- Expected Revenue (calculated: amount × probability)
- Fiscal Period (Q1 2024, Q2 2024, etc.)
- Opportunity Record Type (if multiple types)
- Delivery/Installation Status

**Stage History:**
- Timeline showing stage progression
- Each stage shows:
   - Stage name
   - Entry date
   - Duration in stage
   - User who changed stage
- Visual timeline with connecting lines

**System Information:**
- Opportunity ID
- Created Date/By
- Last Modified Date/By
- Last Activity Date
- Last Stage Change Date

**Right Column:**

**Key Dates:**
- Close Date
- Expected Revenue Date
- Contract Start Date
- Contract End Date

**Description:**
- Full description
- Rich text editing
- Attachments

**Competitors:**
- List of competitors
- Add/remove competitors
- Competitive intelligence notes

**Next Steps:**
- Current next step
- Update next step
- History of next steps

---

**Tab 2: Products**

**Purpose:** Manage products/line items for this opportunity.

**Display:** Table

**Columns:**
1. **Product Name** (link to product)
2. **Product Code/SKU**
3. **Quantity**
4. **Sales Price** (per unit)
5. **Discount** (% or amount)
6. **Total Price** (Qty × Price × (1 - Discount))
7. **Actions** (Edit, Delete)

**Product Row Details:**
- Product description
- Specifications
- Delivery date
- Custom fields

**Summary Section (Bottom):**
```
Subtotal:           $100,000.00
Discount:           - $5,000.00
                    ____________
Subtotal After:     $95,000.00
Tax (18%):          + $17,100.00
Shipping:           + $500.00
                    ____________
Total Amount:       $112,600.00
```

**Actions:**
- **Add Product** button
   - Search product catalog
   - Or create custom product
   - Set quantity, price, discount
- **Add Bundle** (multiple products together)
- **Add Discount** (overall discount)
- **Recalculate** (update totals)

**Product Selection Process:**

**Step 1: Click "Add Product"**
- Opens product search modal

**Step 2: Search/Select Product**
- Search by name, code, category
- Filter by product family
- Shows: Name, code, list price, description
- Select product

**Step 3: Configure Product**
- **Quantity:** Enter number (default 1)
- **Sales Price:** Pre-filled with list price, editable
- **Discount:**
   - Percentage OR fixed amount
   - If > threshold: Require approval
- **Custom Fields:** Any product-specific fields

**Step 4: Add to Opportunity**
- Product added to table
- Totals recalculated
- Save changes

**Discount Approval Workflow:**
- If discount > 10%: Manager approval required
- If discount > 20%: Director approval required
- Status shows: "Pending Approval"
- Approver gets notification
- Until approved, cannot close won

---

**Tab 3: Contacts**

**Purpose:** All contacts involved in this opportunity.

**Display:** Table or card grid

**Columns:**
1. **Contact Name** (photo, link)
2. **Job Title**
3. **Role in Opportunity**
   - Decision Maker
   - Influencer
   - Champion
   - User
   - Gatekeeper
4. **Email**
5. **Phone**
6. **Primary Contact** (badge if yes)
7. **Actions**

**Contact Roles:**
- Essential for complex B2B sales
- Multiple decision makers/influencers
- Track who needs to be engaged

**Actions:**
- **Add Contact**
   - Search contacts from account
   - Or create new contact
   - Assign role in opportunity
- **Set as Primary**
- **Remove from Opportunity**

**Contact Role Definitions:**
- **Decision Maker:** Final approval authority
- **Influencer:** Influences decision but doesn't decide
- **Champion:** Internal advocate for your solution
- **User:** Will use the product/service
- **Gatekeeper:** Controls access to decision maker
- **Blocker:** Opposes your solution

---

**Tab 4: Activity Timeline**

**Purpose:** All activities related to this opportunity.

**Display:** Chronological timeline

**Activity Types:**
- Emails (sent/received)
- Calls (logged)
- Meetings (scheduled/completed)
- Tasks (created/completed)
- Notes (added)
- Files (uploaded)
- Stage changes
- Field updates

**Each Activity Shows:**
- Icon (based on type)
- Date/time
- Description
- User who logged it
- Related contact (if applicable)
- Expand for full details

**Quick Actions (Top of Timeline):**
- "Log Call" button
- "Send Email" button
- "Add Note" button
- "Create Task" button
- "Schedule Meeting" button

**Filters:**
- By activity type
- By date range
- By user
- By contact

---

**Tab 5: Quotes**

**Purpose:** All quotes generated for this opportunity.

**Display:** Table

**Columns:**
1. **Quote Number** (QTE-2024-01-00123)
2. **Quote Name**
3. **Status** (Draft, Sent, Accepted, Rejected, Expired)
4. **Total Amount**
5. **Created Date**
6. **Expiration Date**
7. **Actions** (View, Edit, Send, PDF)

**Quote Status:**
- **Draft:** Being prepared
- **Sent:** Emailed to customer
- **Viewed:** Customer opened email/PDF
- **Accepted:** Customer accepted/signed
- **Rejected:** Customer declined
- **Expired:** Past expiration date

**Actions:**
- "Create Quote" button
   - Generate from opportunity products
   - Pre-fills customer info
- "Send Quote" (email with PDF)
- "Clone Quote" (for revisions)

---

**Tab 6: Competitors**

**Purpose:** Track competitive situation.

**Information to Capture:**

**For Each Competitor:**
- **Competitor Name**
- **Strengths:** What are they good at?
- **Weaknesses:** Where do they fall short?
- **Pricing:** How do they price?
- **Win Strategy:** How do we beat them?
- **Status:**
   - Active (in competition)
   - Eliminated (out of consideration)
   - Won (they won the deal)

**Competitive Intelligence:**
- Battle cards (how to compete)
- Win/loss history against this competitor
- Common objections and responses

**Actions:**
- "Add Competitor" button
- Select from predefined list or add custom
- Fill in competitive analysis
- Update as situation changes

---

**Tab 7: Team**

**Purpose:** Team members working on this opportunity.

**Opportunity Team:**
- Owner (primary responsible)
- Account Executive
- Sales Engineer
- Solution Consultant
- Customer Success Manager
- Other supporting roles

**Team Member Information:**
- Name and photo
- Role on opportunity
- Access level (Read, Read/Write, Full)
- Added date

**Actions:**
- "Add Team Member" button
- Select user
- Assign role
- Set access level
- Team members get notifications about updates

---

**Tab 8: Files**

**Purpose:** All documents related to opportunity.

**File Categories:**
- Proposals
- Contracts
- SOWs (Statements of Work)
- Presentations
- ROI Calculators
- Case Studies
- Technical Documentation
- Other

**Display:** Grid or list view

**Actions:**
- Upload files
- Download
- Preview
- Delete
- Share via link
- Version control

---

**Tab 9: Notes & Comments**

**Purpose:** Internal notes and team collaboration.

**Types:**

**Notes:**
- Personal notes (only visible to you)
- Shared notes (visible to team)
- Important/pinned notes

**Comments:**
- Team discussion
- @mention team members
- Threaded conversations

**Actions:**
- Add note/comment
- Edit own notes
- Delete own notes
- Reply to comments
- Mark as important

---

## 3.2 Opportunity Stages

### Feature: Sales Stage Management

**Purpose:** Track opportunity progression through defined sales process.

#### Default Sales Stages

**Standard B2B Sales Process:**

**1. Qualification (10%)**
- **Purpose:** Initial assessment of fit
- **Activities:**
   - Initial discovery call
   - BANT qualification
   - Identify pain points
   - Confirm budget and authority
- **Exit Criteria:**
   - Budget confirmed
   - Decision maker identified
   - Clear business need
   - Timeline established
- **Expected Duration:** 7-14 days

**2. Needs Analysis (20%)**
- **Purpose:** Deep requirements gathering
- **Activities:**
   - Detailed discovery calls
   - Stakeholder interviews
   - Requirements documentation
   - Success criteria defined
- **Exit Criteria:**
   - Requirements documented
   - Success metrics defined
   - All stakeholders identified
   - Demo/proposal agreed
- **Expected Duration:** 14-21 days

**3. Proposal/Demo (40%)**
- **Purpose:** Present solution
- **Activities:**
   - Product demonstration
   - Proposal creation and delivery
   - ROI calculation
   - Address objections
- **Exit Criteria:**
   - Demo completed successfully
   - Proposal submitted
   - All questions answered
   - Customer interested in proceeding
- **Expected Duration:** 10-14 days

**4. Negotiation (60%)**
- **Purpose:** Finalize terms
- **Activities:**
   - Negotiate pricing
   - Discuss terms and conditions
   - Legal review
   - Address final concerns
- **Exit Criteria:**
   - Pricing agreed
   - Terms negotiated
   - Legal approval (both sides)
   - Ready for contract
- **Expected Duration:** 7-14 days

**5. Verbal Commitment (80%)**
- **Purpose:** Verbal agreement received
- **Activities:**
   - Verbal confirmation
   - Contract preparation
   - Send for signature
   - Address any last-minute items
- **Exit Criteria:**
   - Customer verbally agreed
   - Contract sent
   - Awaiting signature
- **Expected Duration:** 3-7 days

**6. Closed Won (100%)**
- **Purpose:** Deal won, contract signed
- **Activities:**
   - Contract executed
   - Payment received (or terms set)
   - Handoff to implementation
   - Customer onboarding begins
- **End Stage:** Success

**7. Closed Lost (0%)**
- **Purpose:** Deal lost
- **Loss Reasons:**
   - No budget
   - Chose competitor
   - No decision
   - Timing not right
   - Price too high
   - Poor fit
   - Other
- **End Stage:** Failure

---

#### Stage Configuration

**Stage Properties:**

**For Each Stage:**
- **Stage Name** (e.g., "Proposal")
- **Stage Order** (1, 2, 3, ... for sequence)
- **Probability** (%)
   - Default probability for this stage
   - Auto-applied when stage selected
- **Stage Type**
   - Open (active, in progress)
   - Closed/Won (successful close)
   - Closed/Lost (unsuccessful close)
- **Expected Duration** (days)
   - How long typically in this stage
   - Used for stagnation detection
- **Required Fields**
   - Fields that must be filled before entering stage
   - Example: Proposal stage requires "Next Step" filled
- **Required Activities**
   - Activities that must be logged
   - Example: Demo stage requires "Demo Completed" activity
- **Stage Actions** (automated)
   - Tasks to create
   - Emails to send
   - Field updates
   - Notifications
- **Stage Color** (for visual coding)
   - Used in pipeline views, charts

---

#### Stage Change Logic

**On Stage Change:**

**Step 1: Validate Prerequisites**
- Check required fields are filled
- Check required activities completed
- If validation fails:
   - Show error modal listing requirements
   - Cannot proceed to new stage
   - Options: Cancel or complete requirements

**Step 2: Validate Stage Progression**
- Check if skipping stages (if enforced)
- Business rule: Can't skip from Qualification directly to Negotiation
- Must follow defined path
- Manager override option (with approval)

**Step 3: Update Stage Information**
- **Previous Stage:** Store current stage
- **Current Stage:** Set to new stage
- **Stage Change Date:** Current timestamp
- **Stage Changed By:** Current user
- Calculate **Days in Previous Stage:**
  ```
  days_in_stage = (stage_change_date - stage_entry_date).days
  ```
- Store in stage history

**Step 4: Update Probability**
- Get default probability for new stage
- Update opportunity.probability
- Recalculate weighted amount
- If manually set probability: Keep override, but flag it

**Step 5: Create Stage History Record**
```
INSERT INTO opportunity_stage_history (
    opportunity_id,
    from_stage,
    to_stage,
    change_date,
    changed_by,
    days_in_previous_stage
)
```

**Step 6: Create Activity**
- Type: "Stage Change"
- Description: "Stage changed from [Old] to [New Stage] by [User]"
- Include reason if provided

**Step 7: Check for Stage Actions**
- Query stage configuration for automated actions
- Execute all configured actions:
   - Create tasks
   - Send emails
   - Update fields
   - Call webhooks

**Step 8: Update Forecast**
- If probability changed significantly:
   - Recalculate weighted pipeline
   - Update forecast category if needed
   - Refresh team forecasts

**Step 9: Check Alerts/Thresholds**
- If moved to high-value stage (e.g., Negotiation):
   - Notify manager of progress
- If moved to Closed Lost:
   - Trigger loss analysis workflow

**Step 10: Send Notifications**
- If stage = Closed Won:
   - Notify opportunity owner: "Congratulations!"
   - Notify account owner
   - Notify sales manager
   - Trigger celebration workflow
- If stage = Closed Lost:
   - Notify opportunity owner
   - Request loss reason
   - Schedule follow-up for future

**Step 11: Update Dashboards**
- Refresh pipeline charts
- Update stage distribution
- Recalculate metrics

---

#### Stage Gates

**Purpose:** Ensure quality and completeness before advancing.

**Gate Concept:**
- "Checkpoint" before entering stage
- Must meet criteria to pass gate
- Enforces sales process discipline

**Example Gates:**

**Before Proposal Stage:**
- Requirements document completed ✓
- Budget confirmed ✓
- Decision maker identified ✓
- Demo scheduled ✓
- If any unchecked: Cannot enter Proposal stage

**Before Negotiation Stage:**
- Proposal sent ✓
- Customer feedback received ✓
- Pricing approved by management ✓
- Legal review completed ✓

**Before Closed Won:**
- Contract signed ✓
- Payment received OR payment terms agreed ✓
- PO number received ✓
- Customer onboarding scheduled ✓

**Gate Implementation:**

**Configuration:**
- For each stage, define entry requirements
- Required fields
- Required checkboxes
- Required documents
- Required approvals

**On Attempt to Change Stage:**
```
FUNCTION validate_stage_gate(opportunity, new_stage):
    gate_requirements = GET_GATE_REQUIREMENTS(new_stage)
    
    failures = []
    
    FOR EACH requirement IN gate_requirements:
        IF requirement.type == "field":
            IF opportunity[requirement.field] IS NULL OR EMPTY:
                failures.ADD("Required field missing: " + requirement.field)
        
        IF requirement.type == "activity":
            activities = GET_ACTIVITIES(opportunity, requirement.activity_type)
            IF activities.COUNT == 0:
                failures.ADD("Required activity missing: " + requirement.activity_type)
        
        IF requirement.type == "approval":
            approval = GET_APPROVAL(opportunity, requirement.approval_type)
            IF approval.status != "Approved":
                failures.ADD("Approval required: " + requirement.approval_type)
    
    IF failures.LENGTH > 0:
        RETURN ERROR(failures)
    ELSE:
        RETURN SUCCESS
```

**Gate Failure Modal:**
```
⚠ Cannot Advance to Proposal Stage

The following requirements must be met:

✗ Budget Amount: Not specified
✗ Primary Contact: Not assigned
✗ Demo Activity: Not logged
✓ Next Step: Defined

Please complete these requirements before advancing.

[Complete Requirements]  [Cancel]  [Override (Manager Only)]
```

---

#### Stage Duration Tracking

**Purpose:** Identify stagnation and delays.

**Tracking:**
- **Current Stage Duration:**
   - Days in current stage
   - Calculate: NOW() - stage_entry_date
   - Update real-time

- **Expected Duration:**
   - From stage configuration
   - Example: Proposal stage = 10-14 days expected

**Stagnation Detection:**
```
IF days_in_current_stage > (expected_duration × 1.5):
    status = "Stagnant"
    alert_owner()
```

**Visual Indicators:**
- Green: Within expected duration
- Yellow: Approaching expected duration (>80%)
- Orange: Exceeded expected duration
- Red: Significantly exceeded (>2× expected)

**Alerts:**
- Email at 100% of expected duration
- Email at 150% of expected duration
- Manager alert at 200% of expected duration

**Example:**
```
Stage: Proposal
Expected Duration: 14 days
Current Duration: 20 days
Status: Stagnant (143% of expected)

Alert: "Opportunity stagnating in Proposal stage"
Action: "Schedule follow-up with customer"
```

---

## 3.3 Pipeline Visualization

### Feature: Kanban Pipeline View

**Purpose:** Visual drag-and-drop pipeline management.

#### Layout

**Horizontal Columns:**
- One column per stage
- Columns arranged left to right in stage order
- Example:
  ```
  [Qualification] [Needs Analysis] [Proposal] [Negotiation] [Closed Won]
  ```

**Column Design:**

**Column Header:**
- Stage name (bold)
- Opportunity count in stage
- Total value in stage (sum of amounts)
- Color bar (stage color)
- Collapse/expand icon

**Example:**
```
╔══════════════════════════════╗
║  Proposal             ▼      ║
║  8 opportunities             ║
║  $450,000                    ║
╠══════════════════════════════╣
║  [Opportunity Card]          ║
║  [Opportunity Card]          ║
║  [Opportunity Card]          ║
║  ...                         ║
╚══════════════════════════════╝
```

---

#### Opportunity Card Design

**Each card shows:**

**Top Section:**
- **Opportunity Name** (truncated if long)
- **Account Name** (smaller text)

**Middle Section:**
- **Amount** (large, bold)
   - Currency formatted
   - Color coded by size
- **Close Date**
   - Format: "Jan 15" or "15 days"
   - Red if overdue

**Bottom Section:**
- **Owner Avatar** (small circular photo)
- **Days in Stage** badge
   - "12 days"
   - Color: green/yellow/red based on expected
- **Warning Icons** (if applicable)
   - ⚠ No activity in 7 days
   - 🕐 Overdue
   - 📊 Stagnant

**Card Color/Border:**
- Default: White background
- High value (>$100K): Blue left border
- Stagnant: Orange left border
- Overdue close date: Red left border

**Card Interactions:**
- **Click:** Open opportunity detail
- **Drag:** Move to different stage
- **Hover:** Show tooltip with more info
   - Probability
   - Expected revenue
   - Last activity
   - Primary contact

---

#### Drag-and-Drop Functionality

**User Action:**
1. User clicks and holds opportunity card
2. Card becomes semi-transparent
3. User drags to different column
4. Drop zones highlight
5. User releases mouse
6. Card drops into new column

**Backend Logic:**
```
ON CARD DROP:
    1. Get opportunity ID from card
    2. Get new stage from column
    3. Validate stage change (gates, prerequisites)
    4. If valid:
        - Update opportunity.stage = new_stage
        - Run stage change logic (see Stage Change Logic above)
        - Move card visually to new column
        - Recalculate column totals
        - Show success animation
    5. If invalid:
        - Snap card back to original column
        - Show error message
        - Explain requirements
```

**Stage Change Confirmation:**
- If significant change (e.g., to Closed Won/Lost):
   - Show confirmation modal
   - Request additional info (won reason, lost reason)
   - Confirm action

**Example Confirmation:**
```
Move to Closed Won?

This will mark the opportunity as won.

Additional Information:
- Actual Close Date: [Today ▼]
- Actual Amount: [$125,000]
- Contract Number: [________]

[Confirm]  [Cancel]
```

---

#### Filtering & Searching

**Filter Panel (Sidebar or Top):**

**Filters:**
- **Owner:**
   - Multi-select dropdown
   - Options: All Users, My Opportunities, My Team
   - Individual user checkboxes

- **Close Date:**
   - Presets: This Week, This Month, This Quarter, This Year
   - Custom range (date pickers)

- **Amount Range:**
   - Slider: Min and Max
   - Quick filters: <$50K, $50K-$100K, >$100K

- **Account:**
   - Multi-select accounts
   - Useful for focusing on key accounts

- **Forecast Category:**
   - Pipeline, Best Case, Commit, Omitted

- **Product:**
   - Filter by product in opportunity

**Search:**
- Search box at top
- Search by:
   - Opportunity name
   - Account name
   - Opportunity ID

**Filter Application:**
- Filters apply instantly
- Cards that don't match disappear
- Column totals recalculate for filtered set
- "Clear Filters" button to reset

---

#### Column Actions

**Column Header Menu (⋮):**

**Actions:**
- **Sort:**
   - By Amount (high to low, low to high)
   - By Close Date (soonest, farthest)
   - By Age (newest, oldest)
   - By Days in Stage (most, least)

- **Bulk Actions:**
   - Select all in column (checkbox)
   - Bulk reassign owner
   - Bulk update field
   - Export to CSV

- **Column Settings:**
   - Card fields to display
   - Card size (compact, normal, expanded)
   - Cards per page

- **Stage Settings:**
   - Edit stage name, color, probability
   - Set expected duration
   - Configure entry requirements

---

#### Mobile Responsive

**On Mobile/Tablet:**
- Switch to vertical layout (stacked columns)
- Swipe between stages
- Tap to expand column
- Long-press to drag (instead of click-drag)
- Simplified card design (fewer fields)

---

### Feature: Forecast View

**Purpose:** Revenue forecasting based on weighted pipeline.

#### Forecast Calculation

**Weighted Revenue:**
```
For each opportunity:
    weighted_amount = opportunity.amount × (opportunity.probability / 100)

Total Forecast = SUM(weighted_amount for all opportunities in period)
```

**Example:**
```
Opportunity A: $100,000 × 60% = $60,000
Opportunity B: $50,000 × 80% = $40,000
Opportunity C: $200,000 × 40% = $80,000

Total Forecast: $180,000
```

---

#### Forecast Categories

**1. Pipeline:**
- All open opportunities
- Regardless of probability
- Optimistic view

**2. Best Case:**
- Opportunities with probability ≥ 50%
- Likely to close
- Realistic view

**3. Commit:**
- Opportunities with probability ≥ 70%
- High confidence
- Conservative view

**4. Closed:**
- Already Closed Won
- Actual revenue
- No forecast needed

---

#### Forecast Views

**By Time Period:**

**This Month:**
- Opportunities with close date in current month
- Shows: Forecast, Closed Won, Gap

**This Quarter:**
- Opportunities in current fiscal quarter
- Breakdown by month

**This Year:**
- Opportunities in current fiscal year
- Breakdown by quarter

**Custom Period:**
- User-defined date range

---

**By Owner:**

**Table View:**

| Owner | Open | Best Case | Commit | Closed | Quota | Achievement |
|-------|------|-----------|--------|--------|-------|-------------|
| Alice | $500K | $350K | $200K | $150K | $400K | 87.5% |
| Bob | $400K | $300K | $180K | $120K | $350K | 77.1% |
| Charlie | $600K | $450K | $250K | $200K | $500K | 90.0% |
| **Team** | **$1.5M** | **$1.1M** | **$630K** | **$470K** | **$1.25M** | **84.3%** |

**Columns Explained:**
- **Open:** Total pipeline (all open opportunities)
- **Best Case:** Weighted forecast (probability ≥ 50%)
- **Commit:** High confidence (probability ≥ 70%)
- **Closed:** Already closed won this period
- **Quota:** Sales target for period
- **Achievement:** (Closed / Quota) × 100%

---

**Forecast vs Actual:**

**Chart:**
- Line chart over time
- X-axis: Time (weeks/months/quarters)
- Y-axis: Revenue
- Lines:
   - Forecast (at beginning of period)
   - Actual (cumulative closed won)
   - Quota (target line)

**Purpose:**
- Track forecast accuracy
- Identify optimistic/pessimistic forecasting patterns
- Adjust future forecasts

---

#### Forecast Adjustments

**Manual Adjustments:**
- Manager can override forecast
- Reasons:
   - Inside information
   - Known factors not in system
   - Risk adjustment

**Adjustment Process:**
1. Manager clicks opportunity in forecast
2. Selects "Adjust Forecast"
3. Modal opens:
   ```
   Adjust Forecast
   
   Opportunity: Acme Corp Deal
   Current Amount: $100,000
   Current Probability: 60%
   Current Weighted: $60,000
   
   Adjusted Amount: [$100,000]
   Adjusted Probability: [80%]
   Adjusted Weighted: $80,000
   
   Reason (required):
   [Customer confirmed budget increase]
   
   [Save Adjustment]  [Cancel]
   ```
4. Manager enters adjusted values and reason
5. System stores:
   - Original values
   - Adjusted values
   - Reason
   - Adjusted by (user)
   - Adjusted date
6. Forecast uses adjusted values
7. Shows indicator: "Manually adjusted"

---

#### Commit Process

**Purpose:** Formalize commitment to revenue target.

**Commit Workflow:**
1. Sales rep reviews their opportunities
2. Selects opportunities to "commit" to closing
3. Marks opportunities as "Commit" forecast category
4. Submits forecast to manager
5. Manager reviews and approves/rejects
6. Approved forecast locks in commitment
7. Tracks against committed amount

**Commit Modal:**
```
Submit Forecast Commit

Period: Q1 2024

Selected Opportunities: 5
Total Value: $500,000
Weighted Value: $340,000

Committed Amount: [$300,000]

I commit to closing at least this amount in Q1 2024.

[Submit for Approval]  [Cancel]
```

**Manager Review:**
- Manager sees all team commits
- Can drill into each rep's opportunities
- Approve or reject with comments
- Track historical commit vs actual

---

## 3.4 Opportunity Close Process

### Feature: Close Won

**Purpose:** Mark opportunity as successfully won.

#### Close Won Process

**Trigger:**
- User clicks "Close Won" button
- Or drags opportunity to "Closed Won" stage in Kanban

**Step 1: Pre-Close Validation**

**Check Required Fields:**
- Contract signed date (required)
- PO number (required if configured)
- Actual amount (if different from forecasted)
- Payment terms
- Contract number/ID

**Check Stage Gates:**
- Must have met all Closed Won gate requirements
- Contract signed ✓
- Payment terms agreed ✓
- Legal approval ✓

**If Validation Fails:**
- Show error modal
- List missing requirements
- Options: Complete requirements or cancel

**Step 2: Close Won Modal**

```
Mark as Closed Won

Opportunity: Acme Corp - CRM Implementation

Required Information:
- Close Date: [01/23/2024 ▼] (Default: Today)
- Actual Amount: [$125,000] (Forecast: $125,000)
- Contract Signed Date: [01/22/2024 ▼]
- Contract Number: [CONTRACT-2024-001]
- PO Number: [PO-98765]

Optional Information:
- Won Reason: [dropdown]
  - Best Value
  - Best Product Fit
  - Relationship
  - Timing
  - Other
- Won Notes: [textarea]
  - Additional details about the win

Next Steps:
☑ Create handoff task for implementation team
☑ Send welcome email to customer
☑ Create customer success plan

[Confirm Close Won]  [Cancel]
```

**Step 3: Execute Close Won**

**Update Opportunity:**
```
opportunity.stage = "Closed Won"
opportunity.is_closed = true
opportunity.is_won = true
opportunity.probability = 100%
opportunity.close_date = user_specified_date OR today
opportunity.actual_amount = user_specified_amount OR opportunity.amount
opportunity.contract_signed_date = user_specified
opportunity.contract_number = user_specified
opportunity.po_number = user_specified
opportunity.won_reason = user_specified
opportunity.won_notes = user_specified
```

**Create Activity:**
- Type: "Opportunity Closed Won"
- Description: "Opportunity won by [User] on [Date]"
- Amount: Actual close amount
- Include: Contract number, PO number

**Update Account:**
- Add to account.total_revenue_won
- Increment account.opportunities_won_count
- Update account.last_closed_date
- Calculate account.win_rate

**Update Forecast:**
- Move from forecast to closed
- Remove weighted amount from pipeline
- Add actual amount to closed revenue
- Recalculate team metrics

**Update Quotas:**
- Add to owner's closed revenue
- Calculate quota achievement
- Update leaderboards

**Trigger Workflows:**
- Execute "Opportunity Closed Won" workflows
- Examples:
   - Create implementation project
   - Create tasks for onboarding
   - Send congratulations email to team
   - Notify customer success team
   - Generate invoice
   - Update CRM records
   - Call webhook for integrations

**Send Notifications:**
- To opportunity owner:
   - Subject: "🎉 Congratulations! You won [Opportunity Name]"
   - Details: Amount, account, close date
   - Next steps
- To account owner (if different)
- To sales manager:
   - "Team member won deal: $XXX,XXX"
- To customer success team:
   - "New customer won, prepare for onboarding"

**Create Handoff:**
- Create tasks for next steps
- Assign to appropriate teams:
   - Implementation team
   - Customer success
   - Finance (invoicing)
   - Legal (contract filing)

**Celebration:**
- Show confetti animation
- Add to "Recent Wins" feed
- Post to team chat (if integrated)
- Update win statistics

**Step 4: Post-Close Actions**

**Lock Opportunity:**
- Prevent editing of key fields
- Closed opportunities are mostly read-only
- Can still add notes, files, activities
- Require manager approval to reopen

**Generate Reports:**
- Won deal summary
- Email to stakeholders
- Add to won deals report

**Update Competitor Intelligence:**
- If competitor was involved:
   - Mark as "We Won"
   - Update win/loss stats against competitor
   - Add to competitive intelligence

**Revenue Recognition:**
- Create revenue schedule (for recurring)
- Link to accounting system
- Generate invoice (if configured)

---

### Feature: Close Lost

**Purpose:** Mark opportunity as lost and capture loss analysis.

#### Close Lost Process

**Trigger:**
- User clicks "Close Lost" button
- Or drags to "Closed Lost" stage

**Step 1: Close Lost Modal**

```
Mark as Closed Lost

Opportunity: TechStart Inc - Enterprise License

Close Date: [01/23/2024 ▼] (Default: Today)

Lost Reason (required): [dropdown ▼]
- No Budget
- Chose Competitor
- No Decision
- Timing Not Right
- Price Too High
- Product Fit Issues
- Lost to Incumbent
- Lost Contact
- Business Closed
- Other

Competitor (if applicable): [dropdown ▼]
- Salesforce
- HubSpot
- Zoho
- Microsoft Dynamics
- Other
- None

Lost Details (required):
[Textarea - Explain what happened, what we could have done differently]

Future Opportunity?
○ Yes - Follow up in [3 months ▼]
○ No - Not a good fit

Lessons Learned:
[Textarea - What can we learn from this loss?]

[Confirm Close Lost]  [Cancel]
```

**Required Information:**
- Lost reason (dropdown selection)
- Lost details (text explanation)
- Competitor (if that's the reason)

**Optional Information:**
- Lessons learned
- Follow-up date (if future opportunity)

**Step 2: Execute Close Lost**

**Update Opportunity:**
```
opportunity.stage = "Closed Lost"
opportunity.is_closed = true
opportunity.is_won = false
opportunity.probability = 0%
opportunity.close_date = user_specified_date OR today
opportunity.lost_reason = user_specified
opportunity.lost_to_competitor = user_specified_competitor
opportunity.lost_details = user_specified
opportunity.lost_notes = user_specified
```

**Create Activity:**
- Type: "Opportunity Closed Lost"
- Description: "Opportunity lost: [Reason]"
- Lost to: [Competitor]
- Details: [Lost details]

**Update Account:**
- Increment account.opportunities_lost_count
- Update account.win_rate
- Calculate account health score

**Remove from Forecast:**
- Remove from pipeline
- Remove weighted amount
- Update team forecast
- Recalculate metrics

**Update Competitor Stats:**
- If lost to competitor:
   - Increment competitor.wins_against_us
   - Update win/loss ratio
   - Add to competitive intelligence

**Trigger Workflows:**
- Execute "Opportunity Closed Lost" workflows
- Examples:
   - Create follow-up task (if future opportunity)
   - Send survey to understand why lost
   - Notify manager for review
   - Update competitor analysis

**Send Notifications:**
- To opportunity owner:
   - "Opportunity marked as lost"
   - "Schedule debrief with manager"
- To sales manager:
   - "Team member lost deal: [Opportunity]"
   - "Reason: [Lost Reason]"
   - "Competitor: [Competitor]"

**Schedule Follow-Up:**
- If "Future Opportunity" selected:
   - Create task for future date
   - Task: "Follow up with [Account] about [Opportunity]"
   - Assign to opportunity owner
   - Due date: User-specified follow-up date

**Loss Analysis:**
- Store in loss analysis database
- Aggregate stats:
   - Most common loss reasons
   - Win/loss rate by competitor
   - Loss rate by product, industry, deal size
   - Trends over time

**Step 3: Post-Close Actions**

**Lock Opportunity:**
- Prevent editing (similar to Closed Won)
- Can still add notes and activities
- Require manager approval to reopen

**Debrief:**
- Encourage team debrief
- What went wrong?
- What could be done differently?
- Lessons learned

**Competitor Analysis:**
- Update battle card
- Why did they win?
- How to compete better next time?

**Reopen Option:**
- If circumstances change:
   - Manager can reopen opportunity
   - Provide reason for reopening
   - Restores to previous stage
   - Creates activity "Opportunity Reopened"

---

## 3.5 Opportunity Products & Pricing

### Feature: Product Catalog

**Purpose:** Central repository of products/services that can be sold.

#### Product Object

**Product Fields:**

**Basic Information:**
- **Product Name** (Text, required)
   - Example: "CRM Professional License"
- **Product Code/SKU** (Text, unique)
   - Example: "CRM-PRO-001"
- **Product Description** (Rich text)
   - Detailed description
   - Features and benefits
- **Product Family** (Dropdown)
   - Group related products
   - Example: "CRM Software", "Professional Services"

**Pricing:**
- **List Price** (Currency)
   - Standard retail price
- **Cost** (Currency)
   - Cost to deliver/manufacture
   - Used for margin calculations
- **Currency** (Dropdown)
   - Default currency for product

**Classification:**
- **Product Category** (Dropdown)
   - Software, Hardware, Service, Subscription
- **Active** (Checkbox)
   - Is product available for sale?
- **Taxable** (Checkbox)
   - Subject to tax?
- **Tax Category** (Dropdown)
   - GST Rate: 0%, 5%, 12%, 18%, 28%
   - VAT, Sales Tax, etc.

**Inventory (if applicable):**
- **Quantity on Hand**
- **Quantity Available**
- **Reorder Point**

**Additional:**
- **Specifications** (Text)
- **Manufacturer** (Text)
- **Support Terms** (Text)
- **Delivery Time** (Days)

---

#### Price Books

**Purpose:** Different pricing for different customer segments.

**Price Book Concept:**
- Standard Price Book (default)
- Custom price books for:
   - Geographic regions
   - Customer types (Enterprise, SMB)
   - Partners/resellers
   - Promotional pricing
   - Volume discounts

**Price Book Entry:**
- Product
- Price Book
- Price
- Active

**Example:**
```
Product: CRM Professional License
- Standard Price Book: $100/user/month
- Enterprise Price Book: $85/user/month
- Partner Price Book: $60/user/month
- Promotional Price Book: $75/user/month
```

---

### Feature: Add Products to Opportunity

**Purpose:** Build opportunity with specific products and pricing.

#### Add Product Process

**Step 1: Select Price Book**
- On opportunity detail, click "Add Product"
- If multiple price books:
   - Select which price book to use
   - Based on account type, region, etc.
   - Example: "Select Price Book: [Enterprise ▼]"

**Step 2: Search/Select Product**
- Product search/browse interface
- **Search:**
   - By product name
   - By product code
   - By description keywords
- **Browse:**
   - By product family
   - By category
   - A-Z listing
- **Display:**
   - Product name
   - Product code
   - Description (first 100 chars)
   - List price (from selected price book)
   - Thumbnail image
- **Select product(s):**
   - Checkboxes for multiple selection
   - Or click product for single add

**Step 3: Configure Product**

**For Each Selected Product:**

```
Configure Product: CRM Professional License

Quantity: [___10___] units

Sales Price: [$85.00] per unit
(List Price: $100.00, Price Book: Enterprise)

Discount:
○ Percentage: [___15___] %
○ Amount: [$_______]

Line Total Before Discount: $850.00
Discount Amount: -$127.50
Line Total: $722.50

Product Description:
[Auto-filled from product, editable]

Additional Details:
- Start Date: [02/01/2024 ▼]
- End Date: [01/31/2025 ▼]
- Billing Frequency: [Monthly ▼]

[Add to Opportunity]  [Cancel]
```

**Fields:**

**Quantity:**
- Number of units
- Default: 1
- Must be positive integer
- For subscriptions: Number of licenses/users

**Sales Price:**
- Pre-filled from price book
- Editable (rep can adjust)
- Show list price for reference
- Price per unit

**Discount:**
- Choice: Percentage OR fixed amount
- Calculate discount amount
- Validate discount limits (see Discount Approval)

**Line Total:**
- Calculate: Quantity × Sales Price × (1 - Discount%)
- Update in real-time as values change

**Product Description:**
- Pre-filled from product catalog
- Editable on opportunity
- Allows customization for this deal

**Additional Details:**
- Start/End dates (for subscriptions/services)
- Billing frequency (Monthly, Quarterly, Annual, One-time)
- Custom fields (product-specific)

**Step 4: Add to Opportunity**
- Product added to opportunity products table
- Line item created
- Totals recalculated

---

#### Opportunity Product Line Items

**Display:** Table on Opportunity Products tab

**Table Columns:**
1. **Product Name** (link to product)
2. **Product Code**
3. **Quantity**
4. **Sales Price** (per unit)
5. **Discount** (% and amount)
6. **Line Total** (Qty × Price × (1 - Discount%))
7. **Actions** (Edit, Delete)

**Table Footer:**
```
                          Subtotal: $10,000.00
               Overall Discount -5%: -$500.00
                                    ___________
                  Subtotal After:    $9,500.00
                      Tax (18%):    +$1,710.00
                         Shipping:    +$100.00
                                    ___________
                     Total Amount:   $11,310.00
```

**Actions:**
- **Edit Line Item:**
   - Click edit icon
   - Modify quantity, price, discount
   - Save changes
   - Recalculate totals
- **Delete Line Item:**
   - Click delete icon
   - Confirmation: "Remove this product?"
   - Delete and recalculate
- **Clone Line Item:**
   - Duplicate for similar configurations
- **Reorder Lines:**
   - Drag and drop to reorder
   - For logical grouping on quotes/proposals

---

#### Product Bundles

**Purpose:** Sell multiple products together as a package.

**Bundle Definition:**
- Bundle name (e.g., "Startup Package")
- Bundle price (often discounted)
- Included products with quantities
- Bundle description

**Adding Bundle:**
1. Click "Add Bundle"
2. Select bundle from catalog
3. Bundle expands to show all products
4. Can adjust quantities of bundle components
5. Bundle discount applied
6. All products added as separate line items (grouped)

**Bundle Display:**
```
🎁 Startup Package Bundle
├─ CRM Professional License (5 users) @ $85 = $425.00
├─ Onboarding Service (1) @ $500 = $500.00
└─ Training (5 hours) @ $100 = $500.00
                       Bundle Total: $1,425.00
                      Bundle Discount (-10%): -$142.50
                        Bundle Price: $1,282.50
```

---

#### Discount Management

**Discount Types:**

**1. Line Item Discount:**
- Applied to individual product
- Percentage or fixed amount
- Shown in product line item

**2. Opportunity-Level Discount:**
- Applied to entire opportunity
- Calculated on subtotal
- Before tax
- Examples:
   - Volume discount
   - Loyalty discount
   - Promotional discount

**Discount Approval Workflow:**

**Approval Thresholds:**
- Discount 0-10%: Auto-approved (rep can apply)
- Discount 10-20%: Manager approval required
- Discount 20-30%: Director approval required
- Discount >30%: VP approval required

**Approval Process:**
1. Rep enters discount exceeding threshold
2. System detects: "This discount requires approval"
3. Modal appears:
   ```
   Discount Approval Required
   
   Product: CRM Professional License
   List Price: $100
   Proposed Price: $70
   Discount: 30% ($30)
   
   Approval Required From: Director
   
   Justification (required):
   [Competitor offering lower price, customer has budget constraints, strategic account]
   
   [Submit for Approval]  [Cancel]
   ```
4. Rep enters justification
5. Submits for approval
6. Notification sent to approver
7. Approver reviews:
   - Sees discount details
   - Sees opportunity details
   - Reviews justification
8. Approver actions:
   - **Approve:** Discount allowed, opportunity can proceed
   - **Reject:** Discount denied, rep must revise
   - **Request More Info:** Ask rep for clarification
9. Rep notified of decision
10. If approved: Discount locked in
11. If rejected: Rep must adjust or escalate further

**Approval Status:**
- Pending Approval (orange)
- Approved (green checkmark)
- Rejected (red X)
- Opportunity cannot be closed won until all discounts approved

---

#### Tax Calculation

**Tax Logic:**

**GST (India):**
- Intra-state (within same state):
   - CGST: Central GST (9%)
   - SGST: State GST (9%)
   - Total: 18%
- Inter-state (different states):
   - IGST: Integrated GST (18%)

**Calculation:**
```
IF account.state == opportunity.shipping_state:
    // Intra-state
    cgst_rate = product.gst_rate / 2
    sgst_rate = product.gst_rate / 2
    cgst_amount = subtotal × cgst_rate
    sgst_amount = subtotal × sgst_rate
    total_tax = cgst_amount + sgst_amount
ELSE:
    // Inter-state
    igst_rate = product.gst_rate
    igst_amount = subtotal × igst_rate
    total_tax = igst_amount
```

**Tax on Quote/Invoice:**
```
Products Subtotal:     $10,000.00
CGST @ 9%:                $900.00
SGST @ 9%:                $900.00
                       ___________
Total:                 $11,800.00
```

**HSN/SAC Codes:**
- HSN (Harmonized System of Nomenclature): For goods
- SAC (Services Accounting Code): For services
- Required on invoices for GST compliance
- Stored on product record
- Displayed on quotes/invoices

**Tax Exemptions:**
- Some products tax-exempt
- Export sales: Zero-rated
- Special economic zones
- Flag on product: "Tax Exempt"
- If exempt: Tax = $0

---

#### Recurring Revenue Products

**Subscription Products:**
- Billing frequency:
   - Monthly
   - Quarterly
   - Semi-Annual
   - Annual
- Subscription term:
   - Start date
   - End date
   - Auto-renewal

**Revenue Recognition:**
- Opportunity amount = Total contract value (TCV)
- Example:
   - $100/month × 12 months = $1,200 TCV
- Annual Recurring Revenue (ARR):
   - Monthly × 12 = ARR
   - $100/month × 12 = $1,200 ARR

**Multi-Year Deals:**
- Contract for multiple years
- Example:
   - Year 1: $100/month = $1,200
   - Year 2: $110/month = $1,320
   - Year 3: $121/month = $1,452
   - TCV: $3,972

**Renewal Opportunities:**
- Auto-create renewal opportunity
- 90 days before end date
- Pre-fill with current products
- Assign to account owner

---

## 3.6 Opportunity Forecast & Analytics

### Feature: Revenue Forecasting

**Purpose:** Predict expected revenue based on pipeline.

#### Forecast Methods

**1. Weighted Pipeline:**
- Most common method
- Formula: `Sum of (Amount × Probability)`
- Example:
  ```
  Opp A: $100K × 60% = $60K
  Opp B: $50K × 80% = $40K
  Opp C: $200K × 20% = $40K
  Forecast: $140K
  ```

**2. Historical Win Rate:**
- Use actual win rates by stage
- More accurate than static probabilities
- Formula:
  ```
  For each stage:
      historical_win_rate = (won_opps_from_stage / total_opps_in_stage)
      forecast_from_stage = Sum(amount × historical_win_rate)
  ```

**3. Regression Analysis:**
- AI/ML model
- Factors:
   - Stage
   - Amount
   - Age
   - Activity level
   - Account characteristics
   - Owner's historical performance
- Predicts win probability

**4. Three-Scenario Forecast:**
- **Best Case:** All open opportunities close
- **Most Likely:** Weighted pipeline
- **Worst Case:** Only high-probability opps close

---

#### Forecast Reports

**Forecast Summary:**
```
Q1 2024 Forecast

Pipeline (All Open):        $2,500,000
Weighted Forecast:          $1,400,000
High Confidence (>70%):       $800,000
Closed Won (So Far):          $600,000
                            ___________
Total Forecast:             $2,000,000
Quota:                      $2,000,000
Achievement:                     100%
Gap to Quota:                     $0
```

**By Sales Rep:**
| Rep | Pipeline | Forecast | Closed | Quota | % to Quota |
|-----|----------|----------|--------|-------|------------|
| Alice | $800K | $500K | $200K | $500K | 140% |
| Bob | $600K | $400K | $150K | $400K | 137.5% |
| Charlie | $750K | $450K | $180K | $450K | 140% |
| David | $350K | $200K | $70K | $300K | 90% |
| **Total** | **$2.5M** | **$1.55M** | **$600K** | **$1.65M** | **131%** |

**By Product Line:**
| Product | Pipeline | Forecast | Closed |
|---------|----------|----------|--------|
| CRM Software | $1.2M | $700K | $300K |
| Consulting | $800K | $450K | $200K |
| Training | $500K | $250K | $100K |

**By Opportunity Stage:**
| Stage | Count | Total Value | Weighted | Avg Age |
|-------|-------|-------------|----------|---------|
| Qualification | 15 | $500K | $50K | 12 days |
| Needs Analysis | 12 | $600K | $120K | 18 days |
| Proposal | 10 | $800K | $320K | 15 days |
| Negotiation | 8 | $600K | $360K | 22 days |

---

#### Forecast Accuracy

**Tracking:**
- Compare forecast to actual closed revenue
- Calculate accuracy percentage
- Identify patterns:
   - Consistently over-forecasting?
   - Consistently under-forecasting?
   - Which reps most/least accurate?

**Accuracy Calculation:**
```
Forecast Accuracy = (Actual Closed / Forecasted) × 100%

Example:
Forecasted: $1,000,000
Actual: $950,000
Accuracy: 95%
```

**Accuracy Dashboard:**
| Period | Forecasted | Actual | Accuracy | Variance |
|--------|------------|--------|----------|----------|
| Q4 2023 | $1.5M | $1.42M | 95% | -$80K |
| Q1 2024 | $1.8M | $1.95M | 108% | +$150K |
| Q2 2024 | $2.0M | TBD | TBD | TBD |

**By Sales Rep:**
| Rep | Avg Accuracy | Trend |
|-----|--------------|-------|
| Alice | 98% | ↑ Improving |
| Bob | 92% | → Stable |
| Charlie | 105% | ↓ Declining |

---

### Feature: Opportunity Analytics

**Purpose:** Insights and trends from opportunity data.

#### Key Metrics

**Pipeline Metrics:**
- Total Pipeline Value
- Number of Opportunities
- Average Deal Size
- Pipeline by Stage
- Pipeline Velocity (how fast moving through)
- Pipeline Coverage (pipeline / quota)

**Conversion Metrics:**
- Lead to Opportunity conversion rate
- Opportunity to Win conversion rate (win rate)
- Win rate by stage
- Win rate by product
- Win rate by rep
- Win rate by industry

**Time Metrics:**
- Average Sales Cycle Length (days from create to close)
- Average Time in Each Stage
- Age of Open Opportunities
- Time to First Activity

**Revenue Metrics:**
- Closed Won Revenue (actual)
- Average Deal Size (won deals)
- Revenue by Product
- Revenue by Rep
- Revenue by Region
- Revenue Growth Rate

**Activity Metrics:**
- Activities per Opportunity
- Activity types distribution
- Correlation: Activity volume vs win rate
- Response time

---

#### Analytics Reports

**1. Win/Loss Analysis**

**Overall:**
- Total Closed: 100
- Won: 65 (65% win rate)
- Lost: 35 (35% loss rate)

**By Loss Reason:**
| Reason | Count | % of Losses |
|--------|-------|-------------|
| Price Too High | 12 | 34% |
| Chose Competitor | 10 | 29% |
| No Budget | 8 | 23% |
| Timing Not Right | 5 | 14% |

**By Competitor:**
| Competitor | Opps Competed | We Won | They Won | Win Rate |
|------------|---------------|--------|----------|----------|
| Salesforce | 25 | 15 | 10 | 60% |
| HubSpot | 20 | 12 | 8 | 60% |
| Zoho | 15 | 10 | 5 | 67% |

**Insight:** Price sensitivity is top loss reason → Review pricing strategy

---

**2. Sales Funnel Analysis**

```
Funnel:
Leads: 1,000
  ↓ 20% conversion
Qualified Leads: 200
  ↓ 50% conversion
Opportunities: 100
  ↓ 65% win rate
Closed Won: 65

Conversion Rates:
- Lead to Qualified: 20%
- Qualified to Opportunity: 50%
- Opportunity to Won: 65%
- Overall (Lead to Won): 6.5%
```

**Stage-by-Stage Conversion:**
```
Qualification: 100 opps
  ↓ 90% progress
Needs Analysis: 90 opps
  ↓ 85% progress
Proposal: 77 opps
  ↓ 75% progress
Negotiation: 58 opps
  ↓ 70% progress
Verbal: 41 opps
  ↓ 90% close
Closed Won: 37 opps

Loss Points:
- Biggest drop: Proposal to Negotiation (25% loss)
- Focus on improving proposal effectiveness
```

---

**3. Sales Velocity**

**Formula:**
```
Sales Velocity = (Number of Opps × Win Rate × Avg Deal Size) / Sales Cycle Length

Example:
- Opps in Pipeline: 50
- Win Rate: 60%
- Avg Deal Size: $50,000
- Avg Sales Cycle: 60 days

Velocity = (50 × 0.6 × $50,000) / 60 = $25,000/day
```

**Improving Velocity:**
- Increase number of opportunities
- Increase win rate
- Increase deal size
- Decrease sales cycle length

**Velocity by Rep:**
| Rep | Opps | Win Rate | Avg Deal | Cycle | Velocity |
|-----|------|----------|----------|-------|----------|
| Alice | 20 | 70% | $60K | 50 days | $16.8K/day |
| Bob | 15 | 65% | $55K | 55 days | $9.8K/day |

---

**4. Pipeline Coverage**

**Formula:**
```
Pipeline Coverage = Total Pipeline / Quota

Healthy Coverage: 3-4× quota
```

**Example:**
- Quota: $1,000,000
- Pipeline: $3,500,000
- Coverage: 3.5×
- Status: Healthy ✓

**By Rep:**
| Rep | Quota | Pipeline | Coverage | Status |
|-----|-------|----------|----------|--------|
| Alice | $400K | $1.4M | 3.5× | ✓ Healthy |
| Bob | $350K | $900K | 2.6× | ⚠ Low |
| Charlie | $450K | $1.8M | 4.0× | ✓ Healthy |

**Insight:** Bob needs to generate more pipeline

---

**5. Deal Size Distribution**

**Histogram:**
```
< $25K:    ████████████ (45%)
$25K-$50K: ██████████ (30%)
$50K-$100K: ████ (15%)
$100K+:    ██ (10%)
```

**Insight:** Focus on moving upmarket to larger deals

---

**6. Time-to-Close Analysis**

**By Deal Size:**
| Deal Size | Avg Days to Close |
|-----------|-------------------|
| < $25K | 30 days |
| $25K-$50K | 45 days |
| $50K-$100K | 60 days |
| $100K+ | 90 days |

**By Stage Duration:**
| Stage | Avg Days | Longest | Shortest |
|-------|----------|---------|----------|
| Qualification | 12 | 45 | 3 |
| Needs Analysis | 18 | 60 | 7 |
| Proposal | 14 | 50 | 5 |
| Negotiation | 21 | 90 | 7 |

**Insight:** Negotiation stage taking too long → Improve negotiation skills

---

This completes the detailed Module 3 specification. The file is ready with comprehensive business logic for Opportunity Management!
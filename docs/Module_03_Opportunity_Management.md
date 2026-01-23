# Module 3: Opportunity Management

## Overview
Track sales opportunities from qualification through close, manage pipeline, forecast revenue.

---

## 3.1 Opportunity Creation

### Feature: Create Opportunity

**Fields:**
- **Opportunity Info:** Name (required), Account (lookup), Contact (lookup), Amount (required), Close Date (required), Stage (required), Probability (%), Owner
- **Classification:** Type (New Business/Renewal), Lead Source, Category (Product/Service), Product Line
- **Additional:** Next Step, Description, Competitors, Budget Confirmed, Discovery Completed
- **System:** Opportunity ID (OPP-YYYY-MM-XXXXX), Age (days), Days in Stage

**Validation:**
- Amount must be positive
- Close date cannot be in past (warning)
- Account and contact must be from same account
- Probability auto-set based on stage

**Business Logic:**
1. Generate Opportunity ID
2. Set probability from stage mapping
3. Link to account and contact
4. Create activity log
5. Send notification to owner
6. Update forecast calculations

---

## 3.2 Opportunity Stages

### Default Sales Stages

**1. Qualification (10%):** Initial discussion, needs understanding
**2. Needs Analysis (20%):** Deep requirements gathering
**3. Proposal/Demo (40%):** Solution presented
**4. Negotiation (60%):** Terms discussion
**5. Verbal Commitment (80%):** Customer verbally agreed
**6. Closed Won (100%):** Deal won, contract signed
**7. Closed Lost (0%):** Deal lost

**Stage Properties:**
- Name, Order, Probability %, Type (Open/Closed Won/Closed Lost)
- Required Fields (must fill before advancing)
- Expected Duration (days in stage)

**Stage Gates:**
- Qualification: Budget confirmed checkbox
- Needs Analysis: Needs documented
- Proposal: Proposal document attached
- Negotiation: Quote created
- Verbal: Contract sent
- Closed Won: Contract signed date, PO number

---

## 3.3 Visual Pipeline (Kanban)

### Feature: Drag-and-Drop Pipeline

**Layout:**
- Vertical columns for each stage
- Opportunity cards in each column
- Drag card to move between stages

**Card Display:**
- Opportunity name
- Account name
- Amount (with currency)
- Close date
- Owner avatar
- Days in stage
- Warning icon if overdue

**Column Header:**
- Stage name
- Opportunity count
- Total value in stage
- Color coding

**Interactions:**
- Drag card to new column → Update stage
- Click card → Open detail page
- Filter by owner, product, date range
- Sort by amount, close date, age

---

## 3.4 Deal Management

### Feature: Opportunity Detail Page

**Sections:**
1. **Header:** Name, stage indicator, amount, close date, age
2. **Key Info:** Account, contact, owner, probability, next step
3. **Activity Feed:** Recent activities, quick actions
4. **Team Members:** Collaborators on deal
5. **Products:** Line items with quantities, prices
6. **Competitors:** Identified competition
7. **Contacts:** All involved from account
8. **Files:** Proposals, contracts
9. **Notes:** Internal notes

### Feature: Deal Health Indicators

**Health Factors:**

**Engagement:** 
- No activity in 7 days: Yellow
- No activity in 14 days: Red
- Recent activity: Green

**Timeline Risk:**
- Close date past: Red
- Close date within 7 days, stage < Negotiation: Yellow
- Appropriate for stage: Green

**Stagnation:**
- In stage > expected duration: Yellow
- In stage > 2x duration: Red

**Missing Info:**
- Budget not confirmed: Warning
- No next step: Warning

**Visual:**
- Traffic light icon (Green/Yellow/Red)
- Health score (0-100)
- Risk badges ("Stale", "Overdue", "At Risk")

---

## 3.5 Products & Pricing

### Feature: Product Catalog

**Product Fields:**
- Code, Name, Category, Family
- Description, Specifications
- List Price, Cost, Currency
- Tax Category, GST Rate
- Stock info (if applicable)
- Active status

### Feature: Add Products to Opportunity

**Process:**
1. Click "Add Product" on opportunity
2. Search/select from catalog
3. Enter quantity, sales price
4. Apply discount (% or amount)
5. System calculates:
   - Line Total = Qty × Price × (1 - Discount%)
   - Tax = Line Total × GST Rate
   - Final Total = Line Total + Tax

**Product Line Items:**
- Table showing all products
- Columns: Name, Qty, Price, Discount, Tax, Total
- Editable inline
- Remove products
- Subtotal, Tax Total, Grand Total

**Discount Approval:**
- If discount > 10%: Manager approval
- If discount > 20%: Director approval
- Track approval status

### Feature: Price Books

**Purpose:** Different pricing for segments.

**Types:**
- Standard Price Book
- Partner Pricing
- Volume Pricing
- Regional Pricing

**Logic:**
- Select price book on opportunity
- Products pull prices from selected book
- Can override individual prices

---

## 3.6 Forecasting

### Feature: Weighted Forecast

**Calculation:**
```
Weighted Amount = Opportunity Amount × Stage Probability

Example:
- Opportunity: $100,000
- Stage: Negotiation (60%)
- Weighted: $60,000
```

**Forecast Views:**

**By Owner:**
- Each rep's pipeline
- Best Case (all open)
- Most Likely (weighted)
- Worst Case (80%+ only)

**By Time Period:**
- This Month/Quarter/Year
- Custom date range

**Forecast Report:**
- Owner, Open Count, Total Pipeline, Weighted Pipeline, Closed Won, Achievement %

---

## 3.7 Opportunity Close

### Close Won Process

**Requirements:**
- All required stage gates passed
- Contract signed date entered
- PO number entered (if applicable)
- Products added (if required)

**Actions:**
1. User sets stage to "Closed Won"
2. System prompts for:
   - Contract Signed Date
   - PO Number
   - Actual Amount (if different from forecast)
3. User confirms
4. System:
   - Updates stage, probability to 100%
   - Sets close date to today
   - Creates "Opportunity Won" activity
   - Sends notifications
   - Updates forecast
   - Triggers workflows (customer onboarding, etc.)

### Close Lost Process

**Requirements:**
- Lost Reason (required dropdown)
- Competitor (who won?)
- Lost Details (text explanation)

**Actions:**
1. User sets stage to "Closed Lost"
2. Modal prompts for reason
3. User provides details
4. System:
   - Updates stage, probability to 0%
   - Stores lost reason/details
   - Creates activity
   - Removes from forecast
   - Optional: Create follow-up task (6 months out)


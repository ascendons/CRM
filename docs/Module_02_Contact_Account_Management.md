# Module 2: Contact & Account Management

## Overview
Manage individual contacts and company accounts with 360° view and relationship mapping.

---

## 2.1 Contact Management

### Feature: Contact Creation

**Fields:**
- **Basic Info:** Salutation, First Name, Last Name, Job Title, Department
- **Contact Details:** Email (primary, secondary), Phone (mobile, office), LinkedIn
- **Account Link:** Account Name (required lookup)
- **Reporting Structure:** Reports To (lookup to other contacts)
- **Role:** Contact Role (Decision Maker, Influencer, User, Gatekeeper)
- **Address:** Mailing address fields
- **Additional:** Birthday, Assistant Name/Phone, Lead Source
- **System:** Contact ID (CONT-YYYY-MM-XXXXX), Created/Modified dates

**Business Logic:**
1. Validate required fields (First, Last Name, Account, Email)
2. Check email uniqueness
3. Generate Contact ID
4. Link to account (must exist)
5. Create initial activity log
6. Send notification to contact owner

### Feature: Contact 360° View

**Page Sections:**
1. **Header:** Photo, name, title, company, owner, last activity
2. **Quick Stats:** Opportunities (count, value), Activities count, Response time
3. **Contact Details Tab:** All fields, inline editing
4. **Activity Timeline:** All interactions chronologically
5. **Opportunities Tab:** All linked deals
6. **Files Tab:** Documents, proposals
7. **Related Contacts:** Others from same account
8. **Notes Tab:** Sticky notes

### Feature: Contact Hierarchy

**Purpose:** Map reporting structure within organization.

**Logic:**
- "Reports To" field links contacts in hierarchy
- Tree visualization showing org chart
- Identify decision chain
- Prevent circular reporting
- Maximum 10 levels deep

**Use Cases:**
- Identify decision-making chain
- Understand influence network
- Map account organizational structure

---

## 2.2 Account Management

### Feature: Account (Company) Creation

**Fields:**
- **Account Info:** Name (unique), Number (auto), Type (Customer/Prospect/Partner), Industry, Owner, Parent Account
- **Contact Info:** Phone, Fax, Website
- **Address:** Billing and Shipping addresses
- **Financial:** Annual Revenue, Employees, Ownership, Ticker Symbol
- **India-Specific:** GST Number, PAN Number
- **Additional:** Description, SIC Code, Rating (Hot/Warm/Cold)

**Business Logic:**
1. Check account name uniqueness
2. Generate Account ID (ACC-YYYY-MM-XXXXX)
3. Validate GST/PAN format
4. Link to parent account if specified
5. Create account record
6. Index for search

### Feature: Account Hierarchy

**Purpose:** Manage parent-child relationships (HQ-subsidiaries).

**Logic:**
- Parent Account field creates hierarchy
- Tree view visualization
- Cannot create circular relationships
- Maximum 5 levels depth
- Rollup calculations (revenue, employees from children)

### Feature: Account 360° View

**Sections:**
1. **Header:** Logo, name, industry, type, rating, owner
2. **Key Metrics:** Total revenue, open opportunities, contacts, last activity
3. **Account Details:** All information, inline editing
4. **Contacts Tab:** All contacts at account
5. **Opportunities Tab:** All deals
6. **Activity Timeline:** Across all contacts
7. **Hierarchy Tab:** Parent/child accounts
8. **Files Tab:** Contracts, documents

### Feature: Account Health Score

**Purpose:** Measure account health and engagement (0-100).

**Scoring Factors:**

**Engagement (40 points):**
- Recent activity (last 30 days): 15 pts
- Email response rate: 15 pts
- Meeting attendance: 10 pts

**Opportunity Health (30 points):**
- Active opportunities: 10 pts
- Opportunity progression rate: 10 pts
- Win rate: 10 pts

**Product Usage (15 points):**
- Login frequency: 8 pts
- Feature adoption: 7 pts

**Financial (15 points):**
- Revenue trend: 10 pts
- Payment history: 5 pts

**Calculation Logic:**
1. Query all account activities (last 90 days)
2. Count activities by type
3. Calculate response rates
4. Get opportunity metrics
5. Sum points per category
6. Cap at 100 total

**Health Grades:**
- 80-100: Healthy (Green)
- 60-79: At Risk (Yellow)
- 40-59: Unhealthy (Orange)
- 0-39: Critical (Red)

**Alerts:**
- If score drops below 60 → Notify account owner
- Weekly health report to managers
- Flag accounts for review

---

## 2.3 Contact-Account Relationships

### Contact Roles

**Purpose:** Define contact's role in organization and buying process.

**Role Types:**
- **Decision Maker:** Final approval authority
- **Influencer:** Influences decision
- **Champion:** Internal advocate for your solution
- **Gatekeeper:** Controls access
- **End User:** Will use product
- **Blocker:** Opposes your solution

**Logic:**
- Set role on contact record
- Multiple contacts per account with different roles
- Filter contacts by role
- Report on coverage (do we have decision maker contact?)

### Primary Contact

**Purpose:** Designate main contact at account.

**Logic:**
- Checkbox: "Is Primary Contact"
- Only one primary per account
- When setting new primary, unset previous
- Primary contact shows in account summary


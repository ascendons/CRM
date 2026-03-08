# 🚀 CRM Customer Onboarding Guide

Welcome to your CRM! This guide will help you get started in **under 30 minutes**.

---

## 📋 Table of Contents

1. [Getting Started](#getting-started)
2. [Understanding the System](#understanding-the-system)
3. [Your First Customer - Step by Step](#your-first-customer---step-by-step)
4. [Daily Workflows](#daily-workflows)
5. [Pro Tips & Best Practices](#pro-tips--best-practices)
6. [User & Access Management](#user--access-management) 🆕
7. [Quick Reference](#quick-reference)
8. [FAQs](#faqs)

---

## 🎯 Getting Started

### **What You Need to Know**

Your CRM has **7 main sections**:

| Section | Purpose | When to Use |
|---------|---------|-------------|
| 📊 **Dashboard** | Overview of your business | Check daily metrics, upcoming tasks |
| 🎯 **Leads** | Potential customers | Track new prospects before they buy |
| 🏢 **Accounts** | Companies (customers) | Store company information |
| 👥 **Contacts** | People at companies | Individual contacts at each company |
| 💼 **Opportunities** | Sales deals | Track active sales pipelines |
| 📅 **Activities** | Tasks & interactions | Log calls, meetings, emails, tasks |
| 🔐 **Admin** | User & access management | Manage users, roles, and permissions (Admin only) |

### **First Login Checklist**

- [ ] Login with your credentials
- [ ] Explore the Dashboard
- [ ] Check out each section (Leads, Accounts, Contacts, Opportunities, Activities)
- [ ] Check if you have Admin access (Admin section in navigation - admins only)
- [ ] Update your profile (if available)
- [ ] Bookmark the application
- [ ] Understand your role and permissions (ask admin if unclear)

---

## 🧭 Understanding the System

### **The Customer Journey**

```
┌─────────┐      ┌─────────┐      ┌──────────┐      ┌──────────────┐
│  LEAD   │ ───> │QUALIFY  │ ───> │ CONVERT  │ ───> │   CUSTOMER   │
│ (NEW)   │      │(FOLLOW  │      │(TO ACCT) │      │  (ACCOUNT)   │
│         │      │  UP)    │      │          │      │              │
└─────────┘      └─────────┘      └──────────┘      └──────────────┘
                                                              │
                                                              ▼
                                                     ┌─────────────────┐
                                                     │  OPPORTUNITIES  │
                                                     │  (TRACK DEALS)  │
                                                     └─────────────────┘
```

### **Key Concepts**

#### **Lead vs Contact vs Account**

- **Lead** 🎯: A potential customer (prospect) who hasn't bought yet
  - Example: "John from ABC Corp reached out on our website"
  - Status: NEW → CONTACTED → QUALIFIED

- **Account** 🏢: A company/organization (customer or prospect)
  - Example: "ABC Corporation"
  - One company = One account

- **Contact** 👤: A person who works at an Account
  - Example: "John Smith, CEO at ABC Corporation"
  - Multiple contacts can belong to one account

- **Opportunity** 💼: An active sales deal
  - Example: "ABC Corp - Annual License Deal - $50,000"
  - Tracks the deal from proposal to close

#### **The Conversion Process**

When a Lead becomes a customer:
1. **Lead Status** changes to "QUALIFIED"
2. Click **"Convert to Account"** button
3. System automatically creates:
   - ✅ Account (the company)
   - ✅ Contact (the person)
4. Lead is marked as "Converted"

---

## 👨‍🎓 Your First Customer - Step by Step

Let's walk through a complete example: **Adding a new customer called "TechStart Inc"**

---

### **Option A: Starting with a Lead (Recommended for New Prospects)**

Use this when someone reaches out but hasn't purchased yet.

#### **Step 1: Create the Lead (2 minutes)**

1. Click **"Leads"** in the navigation menu
2. Click **"Add New Lead"** button (top right)
3. Fill in the form:

   **Required Information:**
   ```
   First Name: Sarah
   Last Name: Johnson
   Email: sarah@techstart.com
   ```

   **Additional Details:**
   ```
   Company Name: TechStart Inc
   Phone: +1 555-0123
   Mobile: +1 555-0124

   Lead Source: Website
   Lead Status: NEW
   Lead Score: 50

   Street: 123 Innovation Drive
   City: San Francisco
   State: CA
   Postal Code: 94102
   Country: USA
   ```

4. Click **"Create Lead"**

**✅ Result**: Lead created! You'll see Sarah Johnson in your leads list.

---

#### **Step 2: Qualify the Lead (5-10 minutes)**

Track your interactions with Sarah:

1. Click on **"Sarah Johnson"** to open the lead detail page
2. Log your first activity:
   - Click **"Activities"** in the sidebar
   - Click **"Create Activity"**
   - Fill in:
     ```
     Subject: Initial discovery call with Sarah
     Type: CALL
     Status: COMPLETED
     Priority: MEDIUM
     Due Date: Today
     Description: Discussed their needs for project management software.
                  Company has 45 employees, budget approved for Q1.
     ```
   - Click **"Create Activity"**

3. Update the Lead Score:
   - Go back to lead detail page
   - Click **"Edit"**
   - Change Lead Score: 50 → 80 (high interest!)
   - Click **"Save"**

4. Schedule a follow-up:
   - Create another activity:
     ```
     Subject: Product demo with Sarah and team
     Type: MEETING
     Status: PENDING
     Priority: HIGH
     Due Date: Tomorrow 2:00 PM
     Description: Demo project management features.
                  Attendees: Sarah (CEO), Mike (CTO)
     ```

5. Update Lead Status as you progress:
   - Edit the lead
   - Change Status: NEW → CONTACTED → QUALIFIED
   - Click **"Save"**

**✅ Result**: Lead is qualified and ready to convert!

---

#### **Step 3: Convert to Customer (1 minute)**

1. Open Sarah Johnson's lead detail page
2. Look for **"Convert to Account"** button (top right area)
3. Click **"Convert to Account"**
4. Confirm the conversion

**✅ Result**: System automatically creates:
- ✅ Account: "TechStart Inc"
- ✅ Contact: "Sarah Johnson" (linked to TechStart Inc)
- ✅ Lead: Marked as "Converted"

---

#### **Step 4: Complete the Account Details (3 minutes)**

Now let's add more information about TechStart Inc:

1. Go to **"Accounts"** page
2. Click on **"TechStart Inc"**
3. Click **"Edit Account"**
4. Fill in additional details:

   **Basic Information:**
   ```
   Account Type: Customer (they just bought!)
   Industry: TECHNOLOGY
   Company Size: SMALL (11-50 employees)
   Annual Revenue: 5000000 (enter as number)
   Number of Employees: 45
   ```

   **Contact Information:**
   ```
   Website: https://techstart.com
   Phone: +1 555-0123
   Email: info@techstart.com
   ```

   **Financial Information:**
   ```
   Payment Terms: Net 30
   Currency: USD
   Credit Status: Good
   Credit Limit: 100000
   ```

   **Additional Information:**
   ```
   Description: Fast-growing tech startup specializing in AI solutions.
                Looking to scale their team rapidly.

   Rating: Hot

   Tags: startup, technology, ai, high-priority
   (separate tags with commas)
   ```

5. Click **"Update Account"**

**✅ Result**: TechStart Inc account is now fully set up!

---

#### **Step 5: Add More Contacts (2 minutes per contact)**

Add other people at TechStart Inc:

1. Go to **"Contacts"** page
2. Click **"New Contact"**
3. Add the CTO:

   ```
   First Name: Mike
   Last Name: Chen
   Email: mike@techstart.com

   Account: TechStart Inc (select from dropdown)
   Job Title: Chief Technology Officer
   Department: Engineering
   Phone: +1 555-0125

   Is Primary Contact: No (Sarah is primary)

   Description: Technical decision maker.
                Focused on integration capabilities.
   ```

4. Click **"Create Contact"**
5. Repeat for other key contacts (CFO, VP Sales, etc.)

**✅ Result**: All key contacts are now in the system!

---

#### **Step 6: Create a Sales Opportunity (3 minutes)**

Track the active deal:

1. Go to **"Opportunities"** page
2. Click **"New Opportunity"**
3. Fill in the deal details:

   ```
   Opportunity Name: TechStart Inc - Enterprise License 2026

   Account: TechStart Inc (select from dropdown)
   Contact: Sarah Johnson (select from dropdown)

   Amount: 50000
   Stage: PROPOSAL (select from dropdown)
   Probability: 70
   Expected Close Date: 2026-02-28 (end of month)

   Lead Source: Website

   Type: New Business

   Next Steps:
   - Send contract for legal review
   - Schedule implementation kickoff call
   - Prepare onboarding materials

   Description: Annual enterprise license for 45 users.
                Includes premium support and custom integrations.
   ```

4. Click **"Create Opportunity"**

**✅ Result**: Deal is being tracked in the pipeline!

---

#### **Step 7: Set Up Follow-Up Activities (2 minutes)**

Stay on top of next steps:

1. Go to **"Activities"** page
2. Create follow-up tasks:

   **Activity 1: Send Contract**
   ```
   Subject: Send contract to Sarah for review
   Type: TASK
   Status: PENDING
   Priority: HIGH
   Related To: TechStart Inc (Account)
   Due Date: Tomorrow
   Description: Email contract with Net 30 payment terms.
                CC Mike Chen on email.
   ```

   **Activity 2: Implementation Planning**
   ```
   Subject: Schedule implementation kickoff call
   Type: MEETING
   Status: PENDING
   Priority: MEDIUM
   Related To: TechStart Inc - Enterprise License 2026 (Opportunity)
   Due Date: Next week
   Description: 1-hour call with Sarah, Mike, and our implementation team.
                Prepare project timeline and resource allocation.
   ```

3. Click **"Create Activity"** for each

**✅ Result**: You have clear next steps and won't forget anything!

---

### **Option B: Direct Account Creation (For Existing Customers)**

Use this when adding a customer who's already purchased (e.g., migrating from another system).

#### **Quick Path: Account → Contacts → Done**

1. **Create Account** (same as Step 4 above)
   - Go to Accounts → New Account
   - Fill in all company details
   - Set Account Type: **Customer** (not Prospect)
   - Click "Create Account"

2. **Add Contacts** (same as Step 5 above)
   - Go to Contacts → New Contact
   - Link to the account
   - Add all key people

3. **Optional**: Create opportunities for upsell/renewal deals

**✅ Result**: Customer is onboarded without going through the lead process!

---

## 📅 Daily Workflows

### **Morning Routine (10 minutes)**

```
1. Check Dashboard
   ├─ Review today's activities
   ├─ Check overdue tasks
   └─ See pipeline value

2. Review Activities
   ├─ Mark completed tasks as COMPLETED
   ├─ Prioritize today's work
   └─ Reschedule if needed

3. Check Leads
   ├─ Follow up on hot leads
   ├─ Update lead scores
   └─ Convert qualified leads
```

### **After Every Customer Interaction**

```
1. Log the Activity
   ├─ Type: CALL, MEETING, EMAIL
   ├─ Add notes/outcome
   └─ Link to Account/Opportunity

2. Update Status
   ├─ Lead Status (if lead)
   ├─ Opportunity Stage (if deal)
   └─ Next Steps

3. Schedule Follow-Up
   ├─ Create next activity
   ├─ Set due date
   └─ Assign priority
```

### **Weekly Review (30 minutes)**

```
1. Pipeline Review
   ├─ Update opportunity stages
   ├─ Adjust probabilities
   └─ Update close dates

2. Lead Cleanup
   ├─ Follow up on stale leads
   ├─ Mark unqualified leads
   └─ Convert qualified leads

3. Account Maintenance
   ├─ Update account information
   ├─ Add new contacts discovered
   └─ Review account status
```

---

## 💡 Pro Tips & Best Practices

### **Data Quality**

✅ **DO:**
- Fill in all required fields
- Use consistent naming (e.g., "Inc" not "Inc." or "Incorporated")
- Update records immediately after interactions
- Add detailed notes to activities

❌ **DON'T:**
- Leave required fields empty
- Create duplicate accounts for the same company
- Forget to log customer interactions
- Use abbreviations inconsistently

### **Lead Management**

✅ **DO:**
- Update lead status after every interaction
- Log all calls, emails, and meetings
- Set realistic lead scores based on engagement
- Convert qualified leads quickly (within 1-2 days)

❌ **DON'T:**
- Let leads sit in "NEW" status for weeks
- Skip logging activities (you'll forget!)
- Set all leads to score 100 (be realistic)
- Wait too long to convert qualified leads

### **Account Organization**

✅ **DO:**
- Create one account per company
- Add all decision makers as contacts
- Link parent/subsidiary accounts
- Update financial info (payment terms, credit status)
- Use tags for segmentation

❌ **DON'T:**
- Create multiple accounts for the same company
- Only add one contact per account
- Forget to set account status (Active/Inactive)
- Leave payment terms blank

### **Opportunity Tracking**

✅ **DO:**
- Move deals through stages systematically
- Update probability as you progress (0% → 100%)
- Set realistic close dates
- Document next steps clearly
- Update amount if deal size changes

❌ **DON'T:**
- Jump from PROSPECTING to CLOSED_WON
- Keep probability at 50% forever
- Leave close dates in the past
- Forget to update when deal falls through

### **Activity Logging**

✅ **DO:**
- Log activities in real-time (right after interaction)
- Include outcome/result in description
- Set follow-up tasks immediately
- Link activities to relevant records
- Mark as COMPLETED when done

❌ **DON'T:**
- Log activities days later (you'll forget details)
- Use vague subjects ("Call with customer")
- Forget to set due dates
- Leave completed tasks in PENDING status

---

## 🔐 User & Access Management

**For Administrators Only** - This section covers how to manage users, roles, and permissions in your CRM.

---

### **Understanding Access Control**

Your CRM uses a sophisticated **Role-Based Access Control (RBAC)** system with three layers:

```
┌─────────────┐
│    USER     │ ← Individual user account
└──────┬──────┘
       │
       ├─────► ROLE ────────► Hierarchical permissions & data visibility
       │                      (CEO → Manager → Sales Rep)
       │
       └─────► PROFILE ──────► Object, field, and system permissions
                                (What they can CREATE/READ/EDIT/DELETE)
```

#### **Three Permission Layers**

1. **Role Permissions** (Hierarchical)
   - Data visibility: OWN, SUBORDINATES, ALL_USERS, ALL
   - System admin capabilities (manage users, roles, profiles)
   - Organization hierarchy (CEO → VP → Manager → Rep)

2. **Profile Permissions** (Granular)
   - **Object permissions**: Can user create/read/edit/delete Leads, Accounts, etc.?
   - **Field permissions**: Can user view/edit specific fields (e.g., Annual Revenue)?
   - **System permissions**: API access, bulk operations, reports, dashboards

3. **Record-Level Access**
   - Owner-based: Users always see their own records
   - Hierarchy-based: Managers see subordinate records
   - Sharing rules: Manual overrides for special cases (future)

---

### **User Management**

#### **Creating a New User (5 minutes)**

1. Go to **Admin → Users**
2. Click **"New User"** button
3. Fill in user details:

   **Basic Information:**
   ```
   Username: john.doe
   Email: john@yourcompany.com
   Password: (Strong password - 8+ chars, uppercase, lowercase, number, special char)
   First Name: John
   Last Name: Doe
   ```

   **Job Information:**
   ```
   Title: Sales Representative
   Department: Sales
   Phone: +1 555-1234
   ```

   **Access Control:**
   ```
   Role: Sales Representative (select from dropdown)
   Profile: Standard User (select from dropdown)
   Manager: Sarah Johnson (select from dropdown)
   User Type: STANDARD (or ADMIN, READ_ONLY)
   ```

4. Click **"Create User"**
5. User receives login credentials via email (or share manually)

**✅ Result**: New user can now log in with assigned permissions!

---

#### **Managing Existing Users**

**View All Users:**
- Go to **Admin → Users**
- See list with username, email, role, manager, status
- Use search to find specific users
- Filter by status (Active/Inactive) or role

**Edit User:**
- Click on user name → Click **"Edit"**
- Update any field (email, role, profile, manager, etc.)
- Click **"Update User"**

**Deactivate User:**
- Click on user name → Click **"Deactivate"**
- Enter reason (e.g., "Left company")
- Confirm deactivation
- User can no longer log in, but data is preserved

**Reactivate User:**
- Click on inactive user → Click **"Activate"**
- User can log in again with same permissions

---

### **Role Management**

#### **Understanding Roles**

Roles define:
- **Hierarchy**: CEO → VP → Manager → Representative
- **Data Visibility**: What records can users see?
- **Admin Rights**: Can they manage users, roles, settings?

**Example Role Hierarchy:**
```
CEO (Level 0)
 ├── VP Sales (Level 1)
 │    ├── Sales Manager (Level 2)
 │    │    ├── Sales Rep A (Level 3)
 │    │    └── Sales Rep B (Level 3)
 │    └── Sales Manager 2 (Level 2)
 ├── VP Marketing (Level 1)
 │    └── Marketing Manager (Level 2)
 └── CFO (Level 1)
```

**Data Visibility Options:**
- **OWN**: See only your own records
- **SUBORDINATES**: See your records + all subordinates' records
- **ALL_USERS**: See all user records in the organization
- **ALL**: See everything (typically CEO/Admin only)

---

#### **Creating a Role (5 minutes)**

1. Go to **Admin → Roles**
2. Click **"New Role"**
3. Fill in role details:

   **Basic Information:**
   ```
   Role Name: Sales Manager
   Description: Manages a team of sales representatives
   Parent Role: VP Sales (select from dropdown)
   ```

   **Permissions:**
   ```
   Data Visibility: SUBORDINATES (see own + team's records)

   System Permissions:
   ☐ Can Manage Users (typically No for non-admin)
   ☐ Can Manage Roles (typically No)
   ☐ Can Manage Profiles (typically No)
   ☐ Can View Setup (typically No)
   ☐ Can View Audit Log (Yes for managers)
   ☑ Can Export Data (Yes)
   ☑ Can Import Data (Yes for managers)
   ```

4. Click **"Create Role"**

**✅ Result**: Role is created in the hierarchy!

---

#### **Role Best Practices**

✅ **DO:**
- Mirror your organization structure
- Set appropriate data visibility (don't give ALL to everyone)
- Use parent-child relationships for hierarchy
- Limit admin permissions to trusted users

❌ **DON'T:**
- Create too many roles (keep it simple)
- Give all users ALL data visibility
- Make everyone an admin
- Create circular hierarchies (A reports to B, B reports to A)

---

### **Profile Management**

#### **Understanding Profiles**

Profiles define **what users can do** with specific objects and fields:

**Object-Level Permissions:**
```
LEADS:           ☑ Create  ☑ Read  ☑ Edit  ☐ Delete  ☐ View All  ☐ Modify All
ACCOUNTS:        ☑ Create  ☑ Read  ☑ Edit  ☐ Delete  ☐ View All  ☐ Modify All
OPPORTUNITIES:   ☑ Create  ☑ Read  ☑ Edit  ☐ Delete  ☐ View All  ☐ Modify All
CONTACTS:        ☑ Create  ☑ Read  ☑ Edit  ☐ Delete  ☐ View All  ☐ Modify All
```

**Field-Level Permissions:**
```
ACCOUNT.annualRevenue:    ☐ Can Read  ☐ Can Edit  ☑ Is Hidden
ACCOUNT.creditLimit:      ☑ Can Read  ☐ Can Edit  ☐ Is Hidden
OPPORTUNITY.amount:       ☑ Can Read  ☑ Can Edit  ☐ Is Hidden
```

**System Permissions:**
```
☑ Can Access API (Rate Limit: 1000 requests/min)
☑ Can Access Mobile App
☑ Can Access Reports
☑ Can Access Dashboards
☐ Can Bulk Update (dangerous!)
☐ Can Bulk Delete (dangerous!)
☐ Can Mass Email
☐ Can Bypass Validation
```

---

#### **Creating a Profile (10 minutes)**

1. Go to **Admin → Profiles**
2. Click **"New Profile"**
3. Fill in basic info:

   ```
   Profile Name: Standard Sales User
   Description: Standard permissions for sales representatives
   ```

4. Configure **Object Permissions** (for each object):

   **Example: Leads Object**
   ```
   Object Name: LEAD
   ☑ Can Create      - User can create new leads
   ☑ Can Read        - User can view leads
   ☑ Can Edit        - User can update leads
   ☐ Can Delete      - User CANNOT delete leads
   ☐ Can View All    - User only sees accessible records (based on role)
   ☐ Can Modify All  - User CANNOT edit all records
   ```

   Repeat for: ACCOUNT, CONTACT, OPPORTUNITY, ACTIVITY, ROLE, PROFILE

5. Configure **Field Permissions** (optional):

   **Hide sensitive fields from certain users:**
   ```
   Object: ACCOUNT
   Field: annualRevenue
   ☐ Can Read
   ☐ Can Edit
   ☑ Is Hidden (field won't appear in UI for this profile)
   ```

6. Configure **System Permissions:**

   ```
   ☑ Can Access API (Rate Limit: 1000/min)
   ☑ Can Access Mobile App
   ☑ Can Access Reports
   ☑ Can Access Dashboards
   ☐ Can Bulk Update
   ☐ Can Bulk Delete
   ☐ Can Mass Email
   ☐ Can Bypass Validation
   ☐ Can Run Apex
   ```

7. Click **"Create Profile"**

**✅ Result**: Profile is ready to assign to users!

---

#### **Common Profile Templates**

**1. System Administrator**
```
Object Permissions: ALL objects - Create, Read, Edit, Delete, View All, Modify All
Field Permissions: All fields visible and editable
System Permissions: ALL enabled
```

**2. Sales Manager**
```
Object Permissions:
  - LEAD, ACCOUNT, CONTACT, OPPORTUNITY: Create, Read, Edit (no Delete)
  - USER, ROLE, PROFILE: Read only
Field Permissions: View sensitive fields (revenue, credit limit)
System Permissions: Reports, Dashboards, Export Data, Import Data
```

**3. Sales Representative**
```
Object Permissions:
  - LEAD, ACCOUNT, CONTACT, OPPORTUNITY: Create, Read, Edit (no Delete)
  - USER, ROLE, PROFILE: No access
Field Permissions: Most fields visible, sensitive fields hidden
System Permissions: Reports, Dashboards
```

**4. Read-Only User**
```
Object Permissions: Read only on all objects
Field Permissions: View all non-sensitive fields
System Permissions: Reports, Dashboards only
```

**5. External Partner**
```
Object Permissions: Read ACCOUNT, CONTACT (no create/edit/delete)
Field Permissions: Hide all sensitive fields (revenue, internal notes)
System Permissions: Minimal (no API, limited reports)
```

---

### **Permission Checking Flow**

When a user tries to perform an action:

```
1. Does user have required PROFILE permission?
   └─ No → ❌ Access Denied
   └─ Yes → Continue to step 2

2. Does user's ROLE allow seeing this record?
   └─ No → ❌ Access Denied (record not visible)
   └─ Yes → Continue to step 3

3. Is user the owner OR can they see via hierarchy?
   └─ No → ❌ Access Denied (not their record)
   └─ Yes → ✅ Access Granted
```

**Example Scenario:**

Sarah (Sales Rep) tries to edit an Account:

1. **Profile Check**: Does "Standard Sales User" profile have "Edit" on ACCOUNT?
   - ✅ Yes (profile allows)

2. **Role Check**: Does "Sales Rep" role allow seeing this account?
   - Check data visibility: SUBORDINATES
   - Check account owner: John (Sarah's peer)
   - ❌ No (John is not Sarah's subordinate)

3. **Result**: ❌ Access Denied - Sarah cannot edit John's account

**But if Sarah's manager tries:**

1. **Profile Check**: "Sales Manager" profile → ✅ Can Edit
2. **Role Check**: "Sales Manager" role → SUBORDINATES visibility
   - Sarah reports to this manager
   - Sarah owns the account
   - ✅ Manager can see subordinate's records
3. **Result**: ✅ Access Granted - Manager can edit Sarah's account

---

### **Common Scenarios**

#### **Scenario 1: New Employee Onboarding**

**Goal**: Add a new sales representative

**Steps:**
1. Create user account (Admin → Users → New User)
2. Assign Role: "Sales Representative"
3. Assign Profile: "Standard Sales User"
4. Set Manager: Their direct manager
5. Set User Type: STANDARD
6. Activate user

**Result**: New employee can log in and only see/edit their own records.

---

#### **Scenario 2: Promotion**

**Goal**: Promote sales rep to sales manager

**Steps:**
1. Edit user (Admin → Users → [User] → Edit)
2. Change Role: "Sales Representative" → "Sales Manager"
3. Change Profile: "Standard Sales User" → "Sales Manager Profile"
4. Update Manager: Report to VP Sales
5. Save changes

**Result**: User now sees their team's records and has manager permissions.

---

#### **Scenario 3: Lock Down Sensitive Data**

**Goal**: Hide annual revenue from junior sales reps

**Steps:**
1. Edit Profile: "Standard Sales User" (Admin → Profiles → [Profile] → Edit)
2. Add Field Permission:
   ```
   Object: ACCOUNT
   Field: annualRevenue
   ☐ Can Read
   ☐ Can Edit
   ☑ Is Hidden
   ```
3. Save profile

**Result**: Junior reps no longer see annual revenue field on accounts.

---

#### **Scenario 4: Temporary Access**

**Goal**: Give contractor read-only access to accounts for 3 months

**Steps:**
1. Create Role: "Contractor" (no hierarchy, OWN visibility)
2. Create Profile: "Contractor Access" (Read-only on ACCOUNT, CONTACT)
3. Create User with Role + Profile
4. Set calendar reminder to deactivate in 3 months

**Result**: Contractor has limited, read-only access.

---

### **Security Best Practices**

#### **User Security**

✅ **DO:**
- Enforce strong passwords (8+ chars, mixed case, numbers, symbols)
- Deactivate users immediately when they leave
- Review user list quarterly (remove inactive users)
- Use principle of least privilege (only give access needed)
- Assign managers to establish hierarchy

❌ **DON'T:**
- Share login credentials
- Keep inactive users active
- Give everyone admin access
- Use weak passwords
- Leave users without assigned roles/profiles

---

#### **Role Security**

✅ **DO:**
- Mirror actual org structure
- Limit "ALL" data visibility to executives only
- Review role hierarchy quarterly
- Document role purposes
- Test role changes before deploying

❌ **DON'T:**
- Create overlapping roles
- Give everyone SUBORDINATES visibility
- Make circular hierarchies
- Delete roles still assigned to users
- Change role permissions without testing

---

#### **Profile Security**

✅ **DO:**
- Start with minimal permissions, add as needed
- Hide sensitive fields (salary, SSN, credit cards)
- Limit bulk operations to managers
- Restrict API access appropriately
- Document what each profile can do

❌ **DON'T:**
- Give DELETE permissions to everyone
- Enable "Modify All" unless absolutely necessary
- Allow bulk delete for junior users
- Bypass validation rules
- Give API access without rate limits

---

### **Troubleshooting Access Issues**

#### **User Can't See a Record**

**Possible Causes:**
1. **Profile**: Doesn't have READ permission on that object
2. **Role**: Data visibility doesn't include that record's owner
3. **Ownership**: Record owned by someone outside their hierarchy

**Solution:**
- Check user's profile → Object permissions → Ensure READ is enabled
- Check user's role → Data visibility → Verify appropriate level
- Check record owner → Verify ownership chain

---

#### **User Can't Edit a Record**

**Possible Causes:**
1. **Profile**: Has READ but not EDIT permission
2. **Field-Level**: Specific field is marked as read-only or hidden
3. **Record-Level**: Can see record but can't modify (no ownership)

**Solution:**
- Check profile → Object permissions → Ensure EDIT is enabled
- Check profile → Field permissions → Verify field is editable
- Check role hierarchy → Ensure user has modify rights on this record

---

#### **User Sees Too Much Data**

**Possible Causes:**
1. **Role**: Data visibility set too high (e.g., ALL instead of OWN)
2. **Profile**: Has "View All" enabled on objects

**Solution:**
- Reduce role data visibility (ALL → SUBORDINATES → OWN)
- Disable "View All" in profile object permissions

---

#### **User Can't Access Admin Section**

**Expected Behavior**: Only users with appropriate system permissions can access admin features.

**Solution:**
- Check role → System permissions → Enable "Can Manage Users/Roles/Profiles"
- Or: Assign user to Admin role
- Note: Most users should NOT have admin access

---

### **Admin Quick Reference**

#### **User Management Shortcuts**

| I Want To... | Go Here | Action |
|--------------|---------|--------|
| Add new user | Admin → Users | Click "New User" |
| Deactivate user | Users → [User] | Click "Deactivate" |
| Change user's role | Users → [User] → Edit | Select new role |
| Reset password | Users → [User] | Click "Reset Password" (future) |
| View user's permissions | Users → [User] | See Role + Profile details |

#### **Role Management Shortcuts**

| I Want To... | Go Here | Action |
|--------------|---------|--------|
| Create role | Admin → Roles | Click "New Role" |
| Edit role | Roles → [Role] → Edit | Update permissions |
| See role hierarchy | Roles → [Role] | View parent/child roles |
| Delete role | Roles → [Role] | Click "Delete" (only if no users) |

#### **Profile Management Shortcuts**

| I Want To... | Go Here | Action |
|--------------|---------|--------|
| Create profile | Admin → Profiles | Click "New Profile" |
| Edit permissions | Profiles → [Profile] → Edit | Update permissions |
| Clone profile | Profiles → [Profile] | Copy & modify (future) |
| See who has profile | Profiles → [Profile] | View assigned users (future) |

---

## 📖 Quick Reference

### **Common Actions**

| I Want To... | Go Here | Click This |
|--------------|---------|------------|
| Add a new prospect | Leads | "Add New Lead" |
| Convert a qualified lead | Lead Detail Page | "Convert to Account" |
| Add a company | Accounts | "New Account" |
| Add a person | Contacts | "New Contact" |
| Track a sales deal | Opportunities | "New Opportunity" |
| Log a call/meeting | Activities | "Create Activity" |
| See my dashboard | Top navigation | "Dashboard" |
| Edit any record | Record Detail Page | "Edit" button |
| Delete a record | Record Detail Page | "Delete" button |

### **Lead Status Flow**

```
NEW → CONTACTED → QUALIFIED → [Convert to Account]
  ↓
UNQUALIFIED (if not a fit)
```

### **Opportunity Stages**

```
PROSPECTING → QUALIFICATION → NEEDS_ANALYSIS →
PROPOSAL → NEGOTIATION → CLOSED_WON ✅
                          ↓
                     CLOSED_LOST ❌
```

### **Activity Types**

| Type | Use For |
|------|---------|
| TASK | To-dos, reminders, follow-ups |
| CALL | Phone conversations |
| MEETING | In-person or virtual meetings |
| EMAIL | Email communications |
| NOTE | General notes/observations |

### **Activity Status**

| Status | Meaning |
|--------|---------|
| PENDING | Not started yet |
| IN_PROGRESS | Currently working on it |
| COMPLETED | Finished ✅ |
| CANCELLED | No longer needed ❌ |

### **Activity Priority**

| Priority | Use For |
|----------|---------|
| LOW | Can wait, no rush |
| MEDIUM | Normal priority |
| HIGH | Important, do soon |
| URGENT | Drop everything, do now! 🚨 |

### **Industry Options**

```
TECHNOLOGY, MANUFACTURING, HEALTHCARE, FINANCE, RETAIL,
EDUCATION, REAL_ESTATE, E_COMMERCE, CONSULTING,
PROFESSIONAL_SERVICES, TELECOMMUNICATIONS, TRANSPORTATION,
HOSPITALITY, AGRICULTURE, ENERGY, GOVERNMENT, NON_PROFIT, OTHER
```

### **Company Size Options**

```
MICRO       → 1-10 employees
SMALL       → 11-50 employees
MEDIUM      → 51-200 employees
LARGE       → 201-500 employees
ENTERPRISE  → 500+ employees
```

---

## ❓ FAQs

### **General Questions**

**Q: What's the difference between a Lead and a Contact?**
- **Lead**: Someone who hasn't bought yet (potential customer)
- **Contact**: A person at a company that's already in your system (linked to an Account)

**Q: Do I need to create a Lead first, or can I go straight to Account?**
- **For new prospects**: Use Leads → track qualification → convert
- **For existing customers**: Go straight to Accounts (skip the lead stage)

**Q: Can one person be at multiple companies?**
- In this system, create separate contact records for each company
- Example: If John works at both Company A and Company B, create two contact records

**Q: What happens when I convert a Lead?**
- System creates an Account (company) and Contact (person)
- The original Lead is marked as "Converted"
- All lead information is transferred to the new records

---

### **Lead Management**

**Q: When should I mark a Lead as QUALIFIED?**
- They have budget (can afford your product)
- They have authority (decision maker or can influence decision)
- They have need (your product solves their problem)
- They have timeline (ready to buy within reasonable timeframe)

**Q: What's a good Lead Score?**
- 0-30: Cold/Low interest
- 31-60: Moderate interest
- 61-80: High interest
- 81-100: Hot lead, very engaged

**Q: Should I delete UNQUALIFIED leads?**
- No! Mark them as UNQUALIFIED but keep the record
- They might become qualified later
- Useful for reporting and analysis

---

### **Account & Contact Management**

**Q: How many contacts should I add per account?**
- Add all decision makers and key influencers
- Typical: 2-5 contacts per account
- Large enterprises: Could be 10+ contacts

**Q: What's a Primary Contact?**
- The main point of contact at that company
- Usually the first person you work with
- Only one primary contact per account (recommended)

**Q: Should I update accounts regularly?**
- Yes! Update when:
  - Company changes (new address, phone, website)
  - Financial terms change
  - Account status changes (Active ↔ Inactive)
  - New information discovered

---

### **Opportunity Management**

**Q: When do I create an Opportunity?**
- When there's an active sales deal being tracked
- Has a specific dollar value and close date
- Example: "Annual license renewal" or "New product purchase"

**Q: Can I have multiple opportunities for one account?**
- Yes! One account can have many opportunities
- Example: "Annual License" and "Consulting Services" can be separate opportunities

**Q: What's the difference between Amount and Probability?**
- **Amount**: Total deal value (e.g., $50,000)
- **Probability**: % chance of winning (e.g., 70%)
- Expected value = Amount × Probability (e.g., $50,000 × 70% = $35,000)

**Q: When should I mark an opportunity as CLOSED_WON?**
- Contract is signed ✅
- Payment is received or guaranteed
- Deal is 100% done, no backing out

---

### **Activity Management**

**Q: Do I need to log every single interaction?**
- Yes, for important interactions (calls, meetings, emails with customers)
- No, for internal team chats or quick messages
- Rule of thumb: If it moves the deal forward, log it!

**Q: Can I edit or delete activities?**
- Yes! Click on the activity → Edit → Make changes → Save
- Delete if created by mistake

**Q: How far in advance can I schedule activities?**
- As far as you need!
- Common: 1 week to 1 month in advance
- For renewals: Can schedule 6-12 months ahead

---

### **Data & Reporting**

**Q: Can I export my data?**
- Not currently built into the UI
- Contact your system administrator for data export options

**Q: How do I see my sales pipeline value?**
- Check the Dashboard for overview
- Go to Opportunities page to see all active deals
- Total pipeline = sum of all open opportunity amounts

**Q: Can I bulk update records?**
- Yes! On the Leads page, use the checkbox column to select multiple leads
- Click "Bulk Actions" to delete selected leads
- More bulk actions may be added in future updates

---

### **User & Access Management**

**Q: Who can access the Admin section?**
- Only users with appropriate system permissions (canManageUsers, canManageRoles, canManageProfiles)
- Typically only System Administrators and HR managers
- Check with your admin if you need access

**Q: What's the difference between Role and Profile?**
- **Role**: Defines hierarchy and data visibility (WHO can see WHAT records)
- **Profile**: Defines object/field permissions (WHAT actions can users perform)
- Every user needs both a role AND a profile

**Q: Can I have multiple roles?**
- No, each user is assigned exactly ONE role
- But roles inherit permissions from parent roles in the hierarchy

**Q: How do I know what permissions I have?**
- Check your user detail page (Admin → Users → Your Name)
- Your assigned Role and Profile determine your permissions
- Ask your admin if you need specific access

**Q: Why can't I see someone else's records?**
- Your role's data visibility setting controls this
- OWN = only your records
- SUBORDINATES = your records + team members' records
- Check with admin if you need broader access

**Q: Can I delete users?**
- Users are soft-deleted (deactivated) rather than permanently deleted
- This preserves historical data and audit trails
- Only admins can deactivate users

**Q: What happens to a user's data when deactivated?**
- All their records remain in the system
- Records are still visible to users with appropriate permissions
- Ownership can be transferred to another user if needed

**Q: How do I restrict access to sensitive fields?**
- Use field-level permissions in profiles
- Mark sensitive fields as "Hidden" for specific profiles
- Examples: annual revenue, credit limit, internal notes

---

### **Troubleshooting**

**Q: I can't find a record I just created. Where is it?**
- Check if you're on the right page (Leads vs Accounts vs Contacts)
- Use the search box at the top of each list page
- Check filters (clear any active filters)

**Q: I accidentally deleted something. Can I recover it?**
- Currently no undo/restore feature
- Be careful when clicking delete!
- Always confirm you want to delete before clicking OK

**Q: The page is loading slowly. What should I do?**
- Refresh the page
- Clear browser cache
- Contact your system administrator if it persists

**Q: I converted a Lead but can't find the Account. Where did it go?**
- Go to Accounts page
- Look for the company name (same as lead's company)
- Use search if you have many accounts

---

### **Best Practices**

**Q: How often should I update the CRM?**
- **Real-time**: Log activities right after interactions
- **Daily**: Check dashboard, review tasks
- **Weekly**: Update opportunity stages, clean up leads
- **Monthly**: Review overall data quality

**Q: What's the minimum information I need to enter?**
- **For Leads**: First name, last name, email
- **For Accounts**: Account name
- **For Contacts**: First name, last name, email, linked account
- **For Opportunities**: Name, account, amount, stage, close date

**Q: How do I keep data clean?**
- Use consistent naming conventions
- Check for duplicates before creating new records
- Update records when information changes
- Delete test/demo data
- Use tags for better organization

---

## 🎓 Training Checklist

Track your onboarding progress:

### **Week 1: Basics**
- [ ] Completed first login
- [ ] Explored all 6 main sections
- [ ] Created first lead
- [ ] Logged first activity
- [ ] Converted first lead to account
- [ ] Added multiple contacts to an account

### **Week 2: Daily Usage**
- [ ] Log in daily and check dashboard
- [ ] Create and manage leads regularly
- [ ] Log all customer interactions as activities
- [ ] Update lead/opportunity status after meetings
- [ ] Complete daily tasks

### **Week 3: Advanced Features**
- [ ] Created first opportunity
- [ ] Used bulk actions on leads
- [ ] Organized accounts with tags
- [ ] Scheduled activities 1 week in advance
- [ ] Updated financial info on accounts

### **Week 4: Mastery**
- [ ] Can create any record type without referencing guide
- [ ] Daily routine is second nature
- [ ] Pipeline is organized and up-to-date
- [ ] All customer interactions are logged
- [ ] Using CRM to drive business decisions

### **For Administrators Only**
- [ ] Understand Role vs Profile differences
- [ ] Created first user account
- [ ] Created or modified a role
- [ ] Created or modified a profile
- [ ] Understand permission checking flow
- [ ] Know how to troubleshoot access issues
- [ ] Deactivated a test user successfully

---

## 🆘 Getting Help

### **Need More Help?**

1. **Re-read this guide** - Most questions are answered here!
2. **Ask your team** - Colleagues can share tips
3. **Contact support** - Reach out to your system administrator
4. **Practice** - The more you use it, the easier it gets!

**For Permission Issues:**
- Check the [User & Access Management](#user--access-management) section
- Verify your assigned role and profile with your admin
- Review the [Permission Checking Flow](#permission-checking-flow) diagram
- Contact your administrator to request additional access

### **Quick Start Video (Coming Soon)**

We're working on video tutorials to make onboarding even easier. Stay tuned!

---

## 🎉 You're Ready!

Congratulations! You now know how to:

✅ Create and manage leads
✅ Convert leads to customers
✅ Organize accounts and contacts
✅ Track sales opportunities
✅ Log activities and stay organized
✅ Follow daily best practices
✅ **[Admins]** Manage users, roles, and permissions
✅ **[Admins]** Configure hierarchical access control
✅ **[Admins]** Secure sensitive data with field-level permissions

**Now go build those customer relationships!** 💪

**For Administrators:** Ensure your team has appropriate access levels and train them on the permission system!

---

## 📞 Quick Help

| Issue | Solution |
|-------|----------|
| Can't login | Check username/password, contact admin |
| Page not loading | Refresh browser, clear cache |
| Don't see data | Check filters, verify you're on correct page |
| Accidentally deleted | Contact admin (no undo currently) |
| Need training | Re-read this guide, ask colleague |
| Found a bug | Contact system administrator |
| Can't access Admin | Check with admin - requires special permissions |
| Can't see colleague's records | Check your role's data visibility setting |
| Can't edit a field | May be hidden or read-only in your profile |
| Access denied error | Contact admin to review your permissions |

---

**Last Updated**: January 2026
**Version**: 2.0 (Added User & Access Management - Phase 2)
**CRM Version**: Next.js 15 + Spring Boot 4.1

### **What's New in Version 2.0**
- ✨ Comprehensive User & Access Management system
- 🔐 Role-Based Access Control (RBAC) with hierarchical roles
- 👥 Granular permissions (object, field, and system levels)
- 🏢 Organization hierarchy support (manager-subordinate relationships)
- 📊 Data visibility controls (OWN, SUBORDINATES, ALL_USERS, ALL)
- 🛡️ Field-level security (hide sensitive fields from certain users)
- 🔑 Permission caching for performance
- 🎯 Profile-based access control for precise permission management

---

*Happy CRM-ing! 🚀*

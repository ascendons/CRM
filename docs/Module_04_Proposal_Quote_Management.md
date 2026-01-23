# Module 4: Proposal & Quote Management - Complete Detailed Specification

## Overview
Create, manage, track, and deliver professional proposals and quotes with pricing, approvals, e-signatures, and engagement analytics.

---

## 4.1 Quote Creation

### Feature: Generate Quote from Opportunity

**Purpose:** Create formal price quote document for customer based on opportunity.

#### Quote Form Fields

**Header Information (Required):**
- **Quote Number** (Auto-generated: QTE-YYYY-MM-XXXXX)
   - Unique identifier
   - Sequential numbering
   - Example: QTE-2024-01-00234
- **Quote Name** (Text, max 120 chars, Required)
   - Descriptive name
   - Format: "[Account Name] - [Products/Service]"
   - Example: "Acme Corp - CRM Implementation Quote"
- **Opportunity** (Lookup to Opportunities, Required)
   - Must link to existing opportunity
   - Auto-fills related data
- **Account** (Lookup, Auto-filled from opportunity)
   - Billing account
   - Cannot edit (derived from opportunity)
- **Contact** (Lookup, Optional)
   - Primary contact for quote
   - Filter: Contacts from account only
   - Can add multiple contacts

**Status:**
- **Quote Status** (Dropdown, Auto-managed)
   - Draft (being prepared)
   - In Review (internal review)
   - Approved (ready to send)
   - Sent (emailed to customer)
   - Viewed (customer opened)
   - Accepted (customer accepted/signed)
   - Rejected (customer declined)
   - Expired (past expiration date)
   - Cancelled (withdrawn by us)

**Dates:**
- **Quote Date** (Date, Required, defaults to today)
   - Date quote prepared
- **Expiration Date** (Date, Required, defaults to +30 days)
   - When quote expires
   - Auto-calculated: Quote Date + 30 days
   - Customer must accept before this date
- **Valid Until** (Calculated, read-only)
   - Days remaining until expiration
   - Example: "Valid for 23 days"

**Billing Information:**
- **Bill To**
   - Name (from account)
   - Address (from account billing address)
   - GST Number (if applicable)
   - PAN Number (if applicable)
- **Ship To** (Optional, for physical goods)
   - Name
   - Address
   - Checkbox: "Same as Bill To" (auto-copies)

**Payment Terms:**
- **Payment Terms** (Dropdown)
   - Net 15 (payment due in 15 days)
   - Net 30 (30 days)
   - Net 45 (45 days)
   - Net 60 (60 days)
   - Due on Receipt (immediate)
   - 50% Advance, 50% on Delivery
   - Custom
- **Payment Method** (Dropdown)
   - Bank Transfer
   - Credit Card
   - Check
   - Online Payment
   - Other

**Pricing Summary (Auto-calculated):**
- **Subtotal** (Sum of line items before discount)
- **Discount** (Overall quote discount, % or amount)
- **Tax** (GST/VAT calculated)
- **Shipping/Handling** (if applicable)
- **Total Amount** (Final amount due)

**Additional Information:**
- **Description** (Rich text)
   - Quote summary
   - Special notes
   - Scope of work
- **Terms and Conditions** (Rich text)
   - Legal terms
   - Warranty information
   - Service level agreements
   - Cancellation policy
- **Internal Notes** (Textarea)
   - Private notes (not visible to customer)
   - Pricing strategy
   - Negotiation points
- **Public Notes** (Textarea)
   - Visible to customer on quote
   - Special instructions
   - Implementation notes

**System Fields:**
- **Created Date & Time**
- **Created By**
- **Last Modified Date & Time**
- **Last Modified By**
- **Sent Date** (when first emailed)
- **Viewed Date** (when first opened by customer)
- **Accepted Date** (when accepted)
- **Owner** (User, defaults to opportunity owner)

---

#### Validation Logic

**Field Validations:**

**1. Quote Name:**
- Required
- Minimum 3 characters
- Maximum 120 characters

**2. Opportunity:**
- Required
- Must be existing, active opportunity
- Cannot link to closed opportunity (warning)

**3. Quote Date:**
- Required
- Cannot be more than 30 days in past (warning)
- Cannot be in future (error)

**4. Expiration Date:**
- Required
- Must be after Quote Date
- Validation: expiration_date > quote_date
- If > 90 days from quote date: Warning "Long validity period"

**5. Line Items:**
- Must have at least 1 line item
- Each line item must have:
   - Product/description
   - Quantity > 0
   - Price ≥ 0

**6. Totals:**
- Subtotal must equal sum of line items
- Tax calculation must be correct
- Total must equal: Subtotal - Discount + Tax + Shipping

**7. Bill To Address:**
- Required
- Must have complete address

**8. Payment Terms:**
- Required
- Must select from list

---

#### Business Logic Flow

**On Quote Creation:**

**Step 1: Initiate from Opportunity**
- User on opportunity detail page
- Clicks "Create Quote" button
- System checks:
   - Opportunity must have products
   - If no products: Show error "Add products to opportunity first"

**Step 2: Auto-Fill Data**
- **From Opportunity:**
   - Account
   - Primary Contact
   - Products (all opportunity products copied)
   - Amount
   - Owner
   - Description

- **From Account:**
   - Bill To Name
   - Bill To Address (billing address)
   - Ship To Address (if applicable)
   - GST Number
   - PAN Number
   - Payment Terms (if default set)

**Step 3: Generate Quote Number**
- Format: QTE-YYYY-MM-XXXXX
- YYYY = Current year
- MM = Current month
- XXXXX = Auto-increment sequence
- Example: QTE-2024-01-00089

**Step 4: Set Default Dates**
- Quote Date = Today
- Expiration Date = Today + 30 days
- Valid Until = 30 days (calculated)

**Step 5: Copy Products**
- Query opportunity products
- For each product:
  ```
  INSERT INTO quote_line_items (
      quote_id,
      product_id,
      product_name,
      product_code,
      description,
      quantity,
      list_price,
      sales_price,
      discount_percent,
      discount_amount,
      line_total,
      sort_order
  )
  ```
- Maintain same order as opportunity
- Copy all product details
- Copy discounts

**Step 6: Calculate Totals**
```
subtotal = SUM(line_item.line_total)
discount_amount = subtotal × (discount_percent / 100)
subtotal_after_discount = subtotal - discount_amount
tax_amount = calculate_tax(subtotal_after_discount, bill_to_address, products)
total = subtotal_after_discount + tax_amount + shipping
```

**Step 7: Set Initial Status**
- Status = "Draft"
- Quote can be edited
- Not yet ready to send

**Step 8: Set System Fields**
- created_date = now
- created_by = current_user
- owner = opportunity.owner
- tenant_id = current_tenant

**Step 9: Create Quote Record**
- Insert into quotes table
- Link to opportunity
- Link to account

**Step 10: Create Activity**
- On opportunity
- Type: "Quote Created"
- Description: "Quote [Number] created"

**Step 11: Return Response**
- Redirect to quote detail page
- Success message: "Quote created successfully"
- Show quote number

---

### Feature: Quote Detail Page

**Purpose:** View and manage all quote information.

#### Page Layout

**Header Section:**

**Left Side:**
- **Quote Number** (Large, prominent)
- **Quote Name** (editable)
- **Status Badge** (Color-coded)
   - Draft: Gray
   - In Review: Blue
   - Approved: Green
   - Sent: Purple
   - Accepted: Dark Green
   - Expired: Red
   - Rejected: Red

**Right Side:**
- **Total Amount** (Large, formatted currency)
- **Expiration Date**
   - Show days until expiration
   - "Expires in 23 days"
   - Or "Expired 5 days ago" (red)
- **Quote Owner** (Avatar and name)

**Quick Actions Bar:**
- **Edit** (if status = Draft)
- **Submit for Review** (if Draft)
- **Approve** (if In Review and user is approver)
- **Send to Customer** (if Approved)
- **View PDF** (preview)
- **Download PDF**
- **Clone Quote** (create copy)
- **Convert to Invoice** (if Accepted)
- **Delete** (soft delete)
- **More** (dropdown)

---

**Main Content - Tabs:**

**Tab 1: Quote Details**

**Left Column:**

**Quote Information:**
- Quote Number (read-only)
- Quote Name (editable)
- Opportunity (link)
- Account (link)
- Status
- Quote Date
- Expiration Date
- Days Valid
- Payment Terms

**Billing Information:**
- Bill To:
   - Name
   - Address (multi-line)
   - GST Number
   - PAN Number
- Ship To:
   - Checkbox: Same as Billing
   - Name
   - Address

**Right Column:**

**Pricing Summary:**
```
Line Items Subtotal:    $100,000.00
Quote Discount (-5%):     -$5,000.00
                        ____________
Subtotal After:          $95,000.00
CGST (9%):                $8,550.00
SGST (9%):                $8,550.00
Shipping:                    $500.00
                        ____________
Total Amount:           $112,600.00
```

**Description:**
- Rich text editor
- Executive summary
- Value proposition
- Implementation approach

**Terms & Conditions:**
- Rich text editor
- Default terms pre-filled
- Editable per quote
- Warranty info
- Cancellation policy

**Internal Notes:**
- Private notes
- Not visible to customer
- Pricing strategy
- Negotiation room

---

**Tab 2: Products/Line Items**

**Display:** Editable table

**Columns:**
1. **Sort** (drag handle to reorder)
2. **Product Name** (link to product or text)
3. **Description** (expandable)
4. **Quantity** (editable)
5. **List Price** (per unit)
6. **Sales Price** (editable, per unit)
7. **Discount** (% or $, editable)
8. **Line Total** (calculated)
9. **Actions** (Edit, Delete)

**Add Line Item:**
- Button: "Add Product"
- Modal opens:
   - Search product catalog OR
   - Add custom line item (for services, one-time items)

**Custom Line Item:**
- Product Name (text)
- Description (textarea)
- Quantity
- Unit Price
- Discount

**Product Groups/Sections:**
- Organize products into sections
- Example:
   - **Software Licenses**
      - CRM Professional (10 users)
      - Mobile App (10 users)
   - **Professional Services**
      - Implementation (40 hours)
      - Training (20 hours)
   - **Annual Support**
      - Technical Support
      - Software Updates

**Group Subtotals:**
- Show subtotal for each section
- Helps customer understand pricing structure

**Inline Editing:**
- Click any editable cell
- Update value
- Totals recalculate automatically
- Save changes

**Discount Types:**
- Line-level discount (per product)
- Quote-level discount (overall)
- Both can be applied

---

**Tab 3: Preview**

**Purpose:** See what customer will see.

**Display:**
- Rendered HTML preview of PDF
- Exact layout customer receives
- Company logo and branding
- All content formatted
- Signature block (if e-sign enabled)

**Actions:**
- "Refresh Preview" (after changes)
- "Download PDF"
- "Send Preview to Me" (email)

---

**Tab 4: Activity & Tracking**

**Purpose:** All activities and customer engagement.

**Engagement Metrics:**

**Sent Information:**
- Sent Date: Jan 15, 2024 at 2:30 PM
- Sent To: john.doe@acme.com, jane.smith@acme.com
- Sent By: Sarah Johnson

**Engagement:**
- First Opened: Jan 15, 2024 at 3:45 PM (1hr 15min after send)
- Total Opens: 5
- Last Opened: Jan 18, 2024 at 10:20 AM
- Unique Recipients Who Opened: 2
- Time Spent Viewing: 18 minutes total
- PDF Downloads: 2

**Engagement Timeline:**
```
Jan 18, 2024 10:20 AM - john.doe@acme.com opened quote (4th time)
Jan 17, 2024 3:15 PM - jane.smith@acme.com downloaded PDF
Jan 16, 2024 9:30 AM - john.doe@acme.com opened quote
Jan 15, 2024 4:00 PM - jane.smith@acme.com opened quote
Jan 15, 2024 3:45 PM - john.doe@acme.com opened quote (first open)
Jan 15, 2024 2:30 PM - Quote sent to 2 recipients
```

**Engagement Score:**
- High: Opened 3+ times, downloaded PDF, >10 min viewing
- Medium: Opened 1-2 times, 5-10 min viewing
- Low: Opened once, <5 min viewing
- None: Not opened

**Visual Indicators:**
- 🔥 Hot (high engagement)
- ⚠️ Warm (medium engagement)
- ❄️ Cold (low/no engagement)

**Activities:**
- All activities related to quote
- Emails sent/received about quote
- Calls discussing quote
- Meetings where quote presented
- Notes added

**Quick Actions:**
- "Log Activity" button
- "Send Follow-up Email"
- "Schedule Call"

---

**Tab 5: Approval History**

**Purpose:** Track approval process (if required).

**Approval Flow:**
```
1. Created by: Sarah Johnson
   Status: Draft
   Date: Jan 14, 2024

2. Submitted for Review: Sarah Johnson
   Status: In Review
   Date: Jan 14, 2024 3:00 PM

3. Reviewed by: Mike Chen (Sales Manager)
   Status: Approved
   Comments: "Pricing looks good. Approve discount."
   Date: Jan 14, 2024 4:30 PM

4. Sent to Customer: Sarah Johnson
   Status: Sent
   Date: Jan 15, 2024 2:30 PM
```

**If Rejected:**
```
3. Reviewed by: Mike Chen (Sales Manager)
   Status: Rejected
   Comments: "Discount too high. Reduce to 15% or get Director approval."
   Date: Jan 14, 2024 4:30 PM

4. Revised by: Sarah Johnson
   Changes: Reduced discount to 15%
   Status: Draft
   Date: Jan 14, 2024 5:00 PM

5. Resubmitted for Review
   ...
```

---

**Tab 6: Version History**

**Purpose:** Track all changes and revisions.

**Versions:**
```
v3 (Current) - Jan 16, 2024 3:00 PM by Sarah Johnson
   Status: Sent
   Total: $112,600
   Changes: Added shipping charges
   [View PDF] [Compare to Previous]

v2 - Jan 15, 2024 10:00 AM by Sarah Johnson
   Status: Draft
   Total: $112,100
   Changes: Reduced discount from 10% to 5%
   [View PDF] [Compare to Previous]

v1 (Original) - Jan 14, 2024 2:00 PM by Sarah Johnson
   Status: Draft
   Total: $110,000
   [View PDF]
```

**Version Comparison:**
- Side-by-side diff
- Highlight changes:
   - Line items added/removed
   - Prices changed
   - Discounts adjusted
   - Terms modified

**Restore Previous Version:**
- Can clone previous version
- Creates new version based on old
- Preserves history

---

## 4.2 Quote Templates

### Feature: PDF Template Design

**Purpose:** Branded, professional-looking quote documents.

#### Template Structure

**Template Components:**

**1. Header:**
- **Company Logo** (image, top left or center)
- **Company Information:**
   - Company Name
   - Address
   - Phone
   - Email
   - Website
   - GST Number (if applicable)

**2. Quote Information Block:**
```
QUOTE

Quote Number: QTE-2024-01-00089
Quote Date: January 15, 2024
Expiration Date: February 14, 2024
Valid For: 30 Days
```

**3. Customer Information:**
```
BILL TO:                    SHIP TO:
Acme Corporation            Acme Corporation
123 Business Street         456 Warehouse Road
Mumbai, Maharashtra         Pune, Maharashtra
India 400001                India 411001
GST: 27AABCU9603R1ZM        
PAN: AABCU9603R
```

**4. Salutation:**
```
Dear John Doe,

Thank you for your interest in our CRM solution. We are pleased to present
this quote for your review. This quote is valid until February 14, 2024.
```

**5. Line Items Table:**
```
┌──────────────────────────────────────────────────────────────────────┐
│ ITEM  DESCRIPTION          QTY   UNIT PRICE   DISCOUNT    LINE TOTAL │
├──────────────────────────────────────────────────────────────────────┤
│ Software Licenses                                                    │
│ 1.    CRM Professional     10    $100.00      10%        $900.00     │
│       Per user/month                                                 │
│                                                                       │
│ 2.    Mobile App Access    10    $25.00       10%        $225.00     │
│       Per user/month                                                 │
│                                                                       │
│ Professional Services                                                │
│ 3.    Implementation       40    $150.00      -          $6,000.00   │
│       Hours                                                          │
│                                                                       │
│ 4.    Training            20    $100.00      -          $2,000.00   │
│       Hours                                                          │
└──────────────────────────────────────────────────────────────────────┘
```

**6. Pricing Summary:**
```
                              Subtotal:   $9,125.00
                     Discount (10%):     -$912.50
                                      ____________
                   Subtotal After:      $8,212.50
                        CGST (9%):        $739.13
                        SGST (9%):        $739.13
                          Shipping:        $100.00
                                      ____________
                      TOTAL AMOUNT:     $9,790.76
```

**7. Payment Terms:**
```
PAYMENT TERMS
- Payment Due: Net 30 days from invoice date
- Payment Methods: Bank Transfer, Credit Card, Check
- Late Payment: 2% monthly interest on overdue amounts

BANK DETAILS
Bank Name: HDFC Bank
Account Number: 1234567890
IFSC Code: HDFC0001234
Account Name: Your Company Pvt Ltd
```

**8. Terms & Conditions:**
```
TERMS & CONDITIONS

1. Validity: This quote is valid for 30 days from the quote date.

2. Acceptance: Customer acceptance required before expiration date.

3. Delivery: Software access provided within 48 hours of payment.
   Implementation begins within 5 business days.

4. Warranty: 90-day warranty on implementation services.
   Software covered by annual subscription.

5. Cancellation: 30-day cancellation notice required after go-live.

[Full terms continued...]
```

**9. Signature Block:**
```
ACCEPTANCE

I/We accept the terms and conditions outlined in this quote.

Customer Signature: _____________________   Date: _____________

Name: ______________________________

Title: ______________________________

Company Stamp:


[Digital signature field if e-signature enabled]
```

**10. Footer:**
```
Page 1 of 2                Quote #QTE-2024-01-00089
___________________________________________________________________
Your Company Name | www.yourcompany.com | support@yourcompany.com
```

---

#### Template Configuration

**Template Settings (Admin):**

**Layout Options:**
- **Page Size:** A4, Letter, Legal
- **Orientation:** Portrait, Landscape
- **Margins:** Top, Bottom, Left, Right (in mm or inches)
- **Font:** Arial, Helvetica, Times New Roman, Custom
- **Font Size:** Body text, Headers, Line items

**Branding:**
- **Logo Upload:**
   - Maximum 500 KB
   - PNG or JPG
   - Recommended size: 300x100 pixels
   - Position: Left, Center, Right
- **Color Scheme:**
   - Primary Color (headers, accents)
   - Secondary Color (table headers)
   - Text Color
   - Background Color
- **Company Information:**
   - Company Name
   - Address (multi-line)
   - Phone
   - Email
   - Website
   - GST Number
   - PAN Number

**Content Sections:**
- **Enable/Disable Sections:**
   - Salutation (Yes/No)
   - Product Descriptions (Show/Hide)
   - Discount Column (Show/Hide)
   - Shipping Address (Show/Hide)
   - Payment Terms (Show/Hide)
   - Signature Block (Show/Hide)

**Default Text:**
- **Salutation Template:**
  ```
  Dear {{contact.first_name}},
  
  Thank you for your interest in {{company.name}}. We are pleased to 
  present this quote for your review.
  ```
- **Thank You Message:**
  ```
  We look forward to working with you. Please contact us if you have
  any questions about this quote.
  ```
- **Footer Text:**
   - Legal disclaimers
   - Confidentiality notice

---

#### Merge Fields/Variables

**Available Merge Fields:**

**Quote Fields:**
- `{{quote.number}}` → QTE-2024-01-00089
- `{{quote.name}}` → Acme Corp - CRM Implementation
- `{{quote.date}}` → January 15, 2024
- `{{quote.expiration_date}}` → February 14, 2024
- `{{quote.valid_days}}` → 30
- `{{quote.subtotal}}` → $9,125.00
- `{{quote.discount}}` → $912.50
- `{{quote.tax}}` → $1,478.26
- `{{quote.total}}` → $9,790.76

**Company Fields:**
- `{{company.name}}` → Your Company Name
- `{{company.address}}` → 123 Main Street
- `{{company.phone}}` → +91-22-1234-5678
- `{{company.email}}` → info@company.com
- `{{company.website}}` → www.company.com
- `{{company.gst}}` → 27AABCU9603R1ZM

**Account Fields:**
- `{{account.name}}` → Acme Corporation
- `{{account.billing_address}}` → Full address
- `{{account.shipping_address}}` → Full address
- `{{account.gst}}` → 27AABCU9603R1ZM
- `{{account.pan}}` → AABCU9603R

**Contact Fields:**
- `{{contact.first_name}}` → John
- `{{contact.last_name}}` → Doe
- `{{contact.full_name}}` → John Doe
- `{{contact.title}}` → VP of Sales
- `{{contact.email}}` → john@acme.com
- `{{contact.phone}}` → +91-98765-43210

**User Fields (Quote Owner):**
- `{{user.name}}` → Sarah Johnson
- `{{user.title}}` → Account Executive
- `{{user.email}}` → sarah@company.com
- `{{user.phone}}` → +91-22-9876-5432

**Dynamic Tables:**
- `{{product_table}}` → Full line items table
- `{{terms_and_conditions}}` → T&C text
- `{{payment_terms}}` → Payment terms text

---

#### Multiple Templates

**Template Types:**

**Standard Quote Template:**
- Default template
- Used for most quotes
- Clean, professional design

**Enterprise Quote Template:**
- For large deals
- More detailed
- Includes SOW outline
- Multiple stakeholder sections

**Simplified Quote Template:**
- For small deals
- Minimal information
- 1-page format
- Quick turnaround

**Services Quote Template:**
- For consulting/services
- Hour-based pricing
- Resource allocation table
- Timeline/milestones

**Subscription Quote Template:**
- For SaaS/recurring revenue
- Monthly/annual pricing
- Renewal terms prominent
- Auto-renewal clause

**Select Template:**
- When creating quote
- Dropdown: "Select Template"
- Preview available
- Can switch templates before sending

---

#### PDF Generation Logic

**On "Generate PDF":**

**Step 1: Load Template**
- Get selected template configuration
- Load HTML template file
- Load CSS stylesheet

**Step 2: Fetch Data**
- Query quote data
- Query related objects (account, contact, opportunity)
- Query line items
- Query company information

**Step 3: Populate Merge Fields**
```
FOR EACH merge_field IN template:
    value = get_field_value(merge_field)
    template = template.replace(merge_field, value)
```

**Step 4: Build Product Table**
```
product_table_html = ""
FOR EACH line_item IN quote.line_items:
    row_html = build_row(line_item)
    product_table_html += row_html

// Add subtotals
product_table_html += build_totals_section(quote)
```

**Step 5: Calculate Page Breaks**
- Determine if content fits on one page
- If not, insert page breaks appropriately
- Ensure table rows not split across pages
- Add page numbers

**Step 6: Render HTML to PDF**
- Use PDF library (wkhtmltopdf, Puppeteer, PDFKit)
- Convert HTML + CSS to PDF
- Set page size, margins
- Embed fonts

**Step 7: Add Metadata**
- PDF title = Quote Name
- PDF author = Company Name
- PDF subject = Quote Number
- Creation date

**Step 8: Save PDF**
- Store in cloud storage (S3, Google Cloud)
- Generate download URL
- Set expiration on URL (24 hours for security)
- Link PDF to quote record

**Step 9: Return PDF**
- Return PDF as:
   - File download
   - Email attachment
   - Embedded viewer
- Store file reference in database

---

## 4.3 Send Quote to Customer

### Feature: Email Quote Delivery

**Purpose:** Send quote PDF to customer via email with tracking.

#### Send Quote Process

**Step 1: Validate Quote**
- Check status:
   - Must be "Approved" to send
   - If "Draft": Error "Submit for approval first"
   - If "Expired": Error "Quote expired, create new version"
- Check required fields:
   - Primary contact email exists
   - PDF generated
   - All line items complete

**Step 2: Open Send Modal**

```
Send Quote to Customer

Quote: QTE-2024-01-00089
Account: Acme Corporation

Recipients:
To: [john.doe@acme.com, jane.smith@acme.com]
    [+ Add Recipient]

Cc: [mike@company.com]
    [+ Add Cc]

Bcc: [sarah@company.com] (optional, for tracking)

Subject: [Quote for CRM Implementation - Acme Corporation]
    [Editable, pre-filled]

Message:
┌────────────────────────────────────────────┐
│ Dear John,                                 │
│                                            │
│ Please find attached our quote for the    │
│ CRM Implementation project.                │
│                                            │
│ This quote is valid until Feb 14, 2024.   │
│                                            │
│ Key highlights:                            │
│ • CRM Professional licenses for 10 users  │
│ • Full implementation services            │
│ • Training for your team                  │
│ • Total investment: $9,790.76             │
│                                            │
│ Please review and let me know if you have │
│ any questions. I'm happy to discuss       │
│ further.                                   │
│                                            │
│ Best regards,                              │
│ Sarah Johnson                              │
│ Account Executive                          │
│ Your Company                               │
│ sarah@company.com | +91-22-9876-5432      │
└────────────────────────────────────────────┘

Attachments:
☑ Quote PDF (QTE-2024-01-00089.pdf - 245 KB)
☐ Product Brochure (optional)
☐ Case Study (optional)
☐ Implementation Guide (optional)

Options:
☑ Track email opens
☑ Track PDF views
☑ Track link clicks
☑ Request read receipt
☐ Send me a copy

Schedule:
○ Send Now
○ Schedule for Later: [Date/Time Picker]

[Send Quote]  [Save as Draft]  [Cancel]
```

**Pre-filled Content:**
- To: Primary contact email
- Subject: "Quote [Number] from [Company] - [Account Name]"
- Body: Template with merge fields filled

**Step 3: Validate Recipients**
- Check email format for all recipients
- Verify emails not bounced previously
- Check not unsubscribed
- Warn if no To recipients

**Step 4: Embed Tracking**

**Email Tracking:**
- Insert 1×1 transparent tracking pixel in email
- Unique URL: `https://tracking.company.com/quote/QTE-2024-01-00089/open.gif?recipient=john`
- When image loads, logs "email opened"

**PDF Tracking:**
- Generate unique PDF URL for this send
- URL: `https://company.com/quotes/QTE-2024-01-00089/view?token=abc123`
- Track when PDF opened
- Track time spent viewing
- Track pages viewed

**Link Tracking:**
- Replace all links in email with tracking redirects
- Original: `https://company.com/pricing`
- Tracked: `https://track.company.com/r?url=pricing&quote=QTE-2024-01-00089`
- Redirects to original after logging click

**Step 5: Generate PDF (if not already done)**
- Use latest version of quote
- Generate with current data
- Store PDF

**Step 6: Send Email**

**Via Email Service (SMTP or API):**
```
TO: john.doe@acme.com, jane.smith@acme.com
CC: mike@company.com
BCC: sarah@company.com
FROM: sarah@company.com
REPLY-TO: sarah@company.com
SUBJECT: Quote for CRM Implementation - Acme Corporation

BODY (HTML):
<html>
  [Formatted email with tracking pixel]
  <img src="https://tracking.../open.gif" width="1" height="1" />
</html>

ATTACHMENTS:
- QTE-2024-01-00089.pdf (245 KB)
- Additional attachments if selected
```

**Step 7: Update Quote Status**
- Set status = "Sent"
- Set sent_date = now
- Set sent_by = current_user
- Store recipients list

**Step 8: Create Activity**
- On quote
- Type: "Quote Sent"
- Description: "Quote sent to john.doe@acme.com, jane.smith@acme.com"
- Timestamp

**Step 9: Create Activity on Opportunity**
- Type: "Quote Sent"
- Description: "Quote [Number] sent to customer"
- Link to quote

**Step 10: Send Notifications**
- To quote owner (if different from sender):
   - "Quote sent to customer"
- To sales manager:
   - "Team member sent quote: [Account] - $X,XXX"

**Step 11: Schedule Follow-up**
- Auto-create task (if configured)
- Task: "Follow up on quote with [Account]"
- Due date: Sent date + 3 business days
- Assign to quote owner

**Step 12: Return Confirmation**
- Show success message
- "Quote sent successfully to 2 recipients"
- Link to view email sent
- Link to view tracking

---

#### Email Templates

**Template Types:**

**Standard Quote Email:**
```
Subject: Quote for {{opportunity.name}} - {{account.name}}

Dear {{contact.first_name}},

Please find attached our quote for {{opportunity.name}}.

This quote is valid until {{quote.expiration_date}}.

Key Points:
• [Highlight 1]
• [Highlight 2]
• [Highlight 3]

Total Investment: {{quote.total}}

Please review and let me know if you have any questions.

Best regards,
{{user.signature}}
```

**Follow-up Email (if no response):**
```
Subject: Following up on Quote {{quote.number}}

Hi {{contact.first_name}},

I wanted to follow up on the quote I sent on {{quote.sent_date}}.

Have you had a chance to review it? I'd be happy to discuss any
questions or concerns you may have.

The quote is valid until {{quote.expiration_date}}, so we have
[X days] remaining.

When would be a good time for a quick call?

Best regards,
{{user.signature}}
```

**Reminder Email (near expiration):**
```
Subject: Reminder: Quote {{quote.number}} expires soon

Hi {{contact.first_name}},

This is a friendly reminder that quote {{quote.number}} will expire
on {{quote.expiration_date}}, which is [X days] from now.

If you need more time or would like to discuss any changes, please
let me know. I'm happy to extend the validity or revise as needed.

Total: {{quote.total}}

Looking forward to working together!

Best regards,
{{user.signature}}
```

---

### Feature: Email & PDF Tracking

**Purpose:** Track customer engagement with quote.

#### Tracking Events

**Email Events:**

**1. Email Sent:**
- Timestamp: When email sent
- Recipients: List of email addresses
- Sent by: User who sent

**2. Email Delivered:**
- Timestamp: When email server accepted
- Status: Delivered successfully

**3. Email Bounced:**
- Timestamp: When bounce received
- Bounce type: Hard bounce or soft bounce
- Reason: Invalid address, mailbox full, etc.

**4. Email Opened:**
- Timestamp: When tracking pixel loaded
- Recipient: Which email address (if identifiable)
- Device: Desktop, mobile, tablet
- Location: City, Country (from IP)
- Email client: Gmail, Outlook, Apple Mail, etc.

**5. Link Clicked:**
- Timestamp: When link clicked
- Link: Which link was clicked
- Recipient: Who clicked
- Device: Desktop, mobile

---

**PDF Events:**

**1. PDF Viewed:**
- Timestamp: When PDF opened (URL accessed)
- Recipient: Who viewed (from token)
- Device: Desktop, mobile
- Location: City, Country

**2. PDF Downloaded:**
- Timestamp: When PDF downloaded
- Recipient: Who downloaded

**3. Time Spent:**
- Total time: How long viewing PDF
- Pages viewed: Which pages
- Scrolling behavior: How far scrolled

**4. PDF Shared:**
- If recipient forwards PDF link
- New viewers tracked separately

---

#### Tracking Dashboard

**On Quote Detail Page - Tracking Tab:**

**Summary Cards:**

**Card 1: Delivery Status**
- Status: Delivered ✓
- Sent to: 2 recipients
- Delivered: 2
- Bounced: 0
- Opened: 2 (100%)

**Card 2: Engagement**
- Total Opens: 7
- Unique Opens: 2
- PDF Views: 5
- Time Spent: 23 minutes

**Card 3: Engagement Level**
- Score: 85/100
- Level: 🔥 High
- Likelihood: Very Interested

**Card 4: Last Activity**
- Last Opened: 2 hours ago
- By: john.doe@acme.com
- Action: Viewed PDF (3rd time)

---

**Detailed Timeline:**
```
Jan 18, 2024 10:30 AM
📄 john.doe@acme.com viewed PDF (3 min)
   Device: Desktop, Chrome
   Location: Mumbai, India

Jan 18, 2024 10:15 AM
📧 john.doe@acme.com opened email (5th time)
   Device: Desktop, Gmail

Jan 17, 2024 4:45 PM
📄 jane.smith@acme.com downloaded PDF
   Device: Mobile, Safari
   Location: Mumbai, India

Jan 17, 2024 4:40 PM
🔗 jane.smith@acme.com clicked link "View Product Demo"
   Device: Mobile

Jan 17, 2024 3:20 PM
📧 jane.smith@acme.com opened email (2nd time)
   Device: Mobile, Gmail

Jan 16, 2024 11:15 AM
📄 john.doe@acme.com viewed PDF (8 min)
   Device: Desktop, Chrome

Jan 15, 2024 3:47 PM
📧 john.doe@acme.com opened email (first open!)
   Device: Desktop, Gmail
   Location: Mumbai, India
   Time: 1hr 17min after send

Jan 15, 2024 2:30 PM
📤 Quote sent to john.doe@acme.com, jane.smith@acme.com
   By: Sarah Johnson
```

---

**Recipient Breakdown:**

**john.doe@acme.com:**
- Email Opens: 5
- PDF Views: 2
- Time Spent: 11 minutes
- Links Clicked: 0
- Last Activity: 2 hours ago
- Engagement: 🔥 High

**jane.smith@acme.com:**
- Email Opens: 2
- PDF Views: 3
- Time Spent: 12 minutes
- Links Clicked: 1
- Downloads: 1
- Last Activity: 1 day ago
- Engagement: ⚠️ Medium

---

#### Engagement Scoring

**Scoring Logic:**
```
Email Opens:
  First open within 1 hour: +10 points
  First open within 24 hours: +5 points
  Each additional open: +2 points (max 20 points)

PDF Views:
  First view: +15 points
  Each additional view: +5 points (max 30 points)
  
Time Spent Viewing:
  < 2 minutes: 0 points
  2-5 minutes: +10 points
  5-10 minutes: +20 points
  > 10 minutes: +30 points

PDF Downloaded: +10 points

Link Clicked: +10 points per unique link (max 20 points)

Recency:
  Activity within 24 hours: +10 points
  Activity within 48 hours: +5 points
  No activity in 7 days: -10 points

Total Score: 0-100
```

**Engagement Levels:**
- 80-100: 🔥 High (Hot lead, follow up now)
- 60-79: ⚠️ Medium (Warm lead, follow up soon)
- 40-59: ❄️ Low (Cold lead, nurture)
- 0-39: 💤 None (Not interested or missed email)

---

#### Alerts & Notifications

**Real-Time Alerts:**

**Quote Opened (First Time):**
- In-app notification (popup)
- Desktop notification (if enabled)
- "🎉 john.doe@acme.com just opened your quote!"
- Link to quote
- Quick actions: Call, Email

**High Engagement Detected:**
- Trigger: Score crosses 80 threshold
- Notification: "🔥 High engagement on quote for Acme Corp"
- Action: "Schedule follow-up call now"

**PDF Downloaded:**
- Notification: "john.doe@acme.com downloaded the quote PDF"
- Indication of serious interest

**No Activity in 3 Days:**
- Automated email to quote owner
- "Reminder: No activity on quote for Acme Corp"
- Suggest: "Send follow-up email"
- Draft follow-up provided

**Quote Expiring Soon:**
- 7 days before expiration
- Email to quote owner
- "Quote expires in 7 days. Follow up?"
- Option to extend validity

---

## 4.4 Quote Approval Workflow

### Feature: Multi-Level Approval

**Purpose:** Ensure quotes meet company standards before sending to customer.

#### Approval Rules

**Approval Triggers:**

**1. Discount Threshold:**
- Discount ≤ 10%: No approval needed
- Discount 10-20%: Manager approval
- Discount 20-30%: Director approval
- Discount > 30%: VP approval

**2. Deal Size Threshold:**
- Amount < $50K: No approval needed
- Amount $50K-$100K: Manager approval
- Amount $100K-$500K: Director approval
- Amount > $500K: VP and CFO approval

**3. Custom Terms:**
- Non-standard payment terms: Manager approval
- Extended warranty: Director approval
- Custom SLA: Director approval

**4. Unusual Configurations:**
- Custom pricing: Manager review
- Non-standard products: Product approval
- Beta/unreleased features: Product VP approval

**Multiple Approvals:**
- If triggers multiple rules:
   - All approvals required
   - Processed sequentially or in parallel
   - Example: $500K deal with 25% discount:
      - Director (deal size)
      - Director (discount)
      - VP (deal size)
      - CFO (deal size)

---

#### Approval Process Flow

**Step 1: Submit for Approval**

**User Action:**
- On quote detail page
- Clicks "Submit for Approval"
- Quote status: Draft → In Review

**Validation:**
- Check quote complete (all fields filled)
- Check line items present
- Check no errors

**Step 2: Determine Approvers**

**Logic:**
```
approvers = []

// Check discount
IF quote.total_discount_percent > 30%:
    approvers.ADD(VP_Sales)
ELSE IF quote.total_discount_percent > 20%:
    approvers.ADD(Director_Sales)
ELSE IF quote.total_discount_percent > 10%:
    approvers.ADD(Manager_Sales)

// Check deal size
IF quote.total_amount > $500K:
    approvers.ADD(VP_Sales)
    approvers.ADD(CFO)
ELSE IF quote.total_amount > $100K:
    approvers.ADD(Director_Sales)
ELSE IF quote.total_amount > $50K:
    approvers.ADD(Manager_Sales)

// Check custom terms
IF quote.payment_terms == "Custom":
    approvers.ADD(Finance_Manager)

// Remove duplicates
approvers = UNIQUE(approvers)

RETURN approvers
```

**Step 3: Create Approval Requests**

**For Each Approver:**
```
INSERT INTO approval_requests (
    quote_id,
    approver_id,
    approval_type,
    status,
    requested_date,
    due_date
)

VALUES (
    quote.id,
    approver.id,
    "Quote Approval",
    "Pending",
    NOW(),
    NOW() + 2 business days
)
```

**Step 4: Notify Approvers**

**Email to Each Approver:**
```
Subject: Quote Approval Request: Acme Corp - $112,600

Hi Mike,

Sarah Johnson has submitted a quote for your approval.

Quote Details:
- Quote Number: QTE-2024-01-00089
- Account: Acme Corporation
- Amount: $112,600
- Discount: 15%
- Valid Until: Feb 14, 2024

Approval Required Because:
- Discount exceeds 10% threshold

Please review and approve or reject:
[Approve] [Reject] [View Quote]

Due Date: Jan 16, 2024
```

**In-App Notification:**
- Notification badge on bell icon
- "You have 1 pending approval"
- Link to approvals page

---

**Step 5: Approver Reviews**

**Approvals Dashboard:**

**My Pending Approvals:**
| Quote | Account | Amount | Discount | Submitted | Due |
|-------|---------|--------|----------|-----------|-----|
| QTE-..089 | Acme | $112K | 15% | Jan 14 | Jan 16 |
| QTE-..090 | Tech | $55K | 12% | Jan 15 | Jan 17 |

**Click Quote to Review:**

**Approval Modal:**
```
Review Quote Approval

Quote: QTE-2024-01-00089
Account: Acme Corporation
Total Amount: $112,600

Approval Required For:
☑ Discount (15%) - Exceeds 10% threshold

Quote Summary:
- Products: CRM Licenses (10), Implementation, Training
- Subtotal: $100,000
- Discount: $15,000 (15%)
- Tax: $15,300
- Total: $112,600

Opportunity Details:
- Stage: Proposal
- Close Date: Feb 28, 2024
- Win Probability: 60%

Submitter Justification:
"Customer has budget approval. Competitor offering similar discount.
Strategic account with high growth potential. Can upsell additional
users in Q2."

Competitive Situation:
- Competing against: Salesforce
- Their pricing: ~$115/user (estimated)
- Our pricing: $100/user (after discount)

[View Full Quote PDF]
[View Opportunity]
[View Account]

Action:
○ Approve
○ Reject
○ Request Changes

Comments (optional):
[_____________________________________________]

[Submit Decision]  [Cancel]
```

---

**Step 6: Approver Decision**

**Option A: Approve**
- Approver clicks "Approve"
- Enters optional comments
- Submits

**Logic:**
```
UPDATE approval_requests
SET status = "Approved",
    approved_date = NOW(),
    approver_comments = comments
WHERE id = approval_request.id

// Check if all approvals complete
pending_approvals = COUNT(approval_requests 
                    WHERE quote_id = quote.id 
                    AND status = "Pending")

IF pending_approvals == 0:
    // All approved
    quote.status = "Approved"
    NOTIFY quote_owner("Quote approved, ready to send")
ELSE:
    // Still waiting on others
    NOTIFY quote_owner("Approval received from [Approver], 
                        waiting on [X] more")
```

**Notification to Quote Owner:**
```
Subject: Quote Approved by Mike Chen

Great news! Your quote for Acme Corp has been approved by Mike Chen.

Approval Details:
- Approved by: Mike Chen (Sales Manager)
- Approved on: Jan 15, 2024 at 10:30 AM
- Comments: "Pricing looks good. Approve discount. 
             Good strategic fit."

Remaining Approvals: None
Status: Approved - Ready to Send

You can now send the quote to the customer.

[Send Quote]  [View Quote]
```

---

**Option B: Reject**
- Approver clicks "Reject"
- Must enter rejection reason (required)
- Submits

**Logic:**
```
UPDATE approval_requests
SET status = "Rejected",
    rejected_date = NOW(),
    approver_comments = rejection_reason
WHERE id = approval_request.id

// Entire quote rejected (one reject = all reject)
quote.status = "Rejected"

// Cancel other pending approvals
UPDATE approval_requests
SET status = "Cancelled"
WHERE quote_id = quote.id 
AND status = "Pending"

NOTIFY quote_owner("Quote rejected by [Approver]")
```

**Notification to Quote Owner:**
```
Subject: Quote Rejected by Mike Chen

Your quote for Acme Corp has been rejected.

Rejected by: Mike Chen (Sales Manager)
Rejected on: Jan 15, 2024 at 10:30 AM

Reason:
"Discount too high for this deal size. Please reduce to 10% or
get additional justification from customer. Also verify they are
comparing apples-to-apples with competitor pricing."

Next Steps:
1. Review rejection reason
2. Revise quote as needed
3. Resubmit for approval

[Revise Quote]  [View Quote]
```

---

**Option C: Request Changes**
- Approver wants revisions before approving
- Enters requested changes
- Quote goes back to owner
- Status: "Changes Requested"

**Logic:**
```
UPDATE approval_requests
SET status = "Changes Requested",
    requested_changes = changes,
    request_date = NOW()
WHERE id = approval_request.id

quote.status = "Changes Requested"

NOTIFY quote_owner("Changes requested on quote")
```

**Notification:**
```
Subject: Changes Requested on Quote by Mike Chen

Mike Chen has requested changes to your quote for Acme Corp.

Requested Changes:
"Please add a breakdown of implementation hours by phase.
Customer wants to see the project plan in the quote.

Also, can we add an optional add-on for advanced reporting?
Customer mentioned interest."

[Revise Quote]  [View Quote]  [Reply to Approver]
```

**Quote Owner Revises:**
- Makes requested changes
- Resubmits for approval
- Goes back to same approver
- Approval process restarts

---

#### Approval History

**Track All Approval Actions:**

**Approval Log:**
```
Jan 15, 2024 10:30 AM - APPROVED
Approver: Mike Chen (Sales Manager)
Comments: "Pricing looks good. Strategic account."

Jan 15, 2024 9:00 AM - SUBMITTED
By: Sarah Johnson
Approvers: Mike Chen (Manager)
Reason: Discount (15%) exceeds threshold
```

**With Rejection:**
```
Jan 15, 2024 3:00 PM - APPROVED
Approver: Mike Chen (Sales Manager)
Comments: "Discount now acceptable at 10%."

Jan 15, 2024 2:30 PM - RESUBMITTED
By: Sarah Johnson
Changes Made: Reduced discount from 15% to 10%

Jan 15, 2024 10:30 AM - REJECTED
Approver: Mike Chen (Sales Manager)
Reason: "Discount too high. Reduce to 10%."

Jan 15, 2024 9:00 AM - SUBMITTED
By: Sarah Johnson
```

**Display on Quote Detail:**
- Full approval history
- Expandable timeline
- Who approved/rejected
- When
- Comments
- Changes made between versions

---

#### Approval Escalation

**Auto-Escalation Rules:**

**If Not Approved Within SLA:**
- SLA: 2 business days
- If not responded:
   - Escalate to next level
   - Example: Manager → Director
   - Notification to original approver
   - Notification to escalated approver

**Example:**
```
Approval Request Created: Jan 15, 9:00 AM
Approver: Mike Chen (Manager)
Due Date: Jan 17, 9:00 AM

Jan 17, 9:00 AM - No response
↓ Auto-escalate
Escalated To: Jennifer Lee (Director)
Notification: "Approval request escalated due to no response"

Jan 17, 10:30 AM
Jennifer approves
```

---

#### Parallel vs Sequential Approvals

**Sequential:**
- One approver at a time
- Order matters
- Example:
   1. Manager approves first
   2. Then Director reviews
   3. Then VP reviews
- Slower but more controlled

**Parallel:**
- All approvers notified at once
- Any order
- Faster
- All must approve

**Configuration:**
- Admin sets approval flow
- Per approval type
- Can mix (some sequential, some parallel)

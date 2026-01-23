# Module 4: Proposal & Quote Management

## Overview
Create, send, and track proposals and quotes with pricing, approvals, and e-signatures.

---

## 4.1 Quote Creation

### Feature: Generate Quote from Opportunity

**Quote Fields:**
- **Header:** Quote Number (QTE-YYYY-MM-XXXXX), Name, Opportunity (lookup), Account, Contact, Quote Date, Expiration Date (default +30 days)
- **Status:** Draft, Sent, Accepted, Rejected, Expired
- **Billing:** Bill To, Ship To, Payment Terms (Net 15/30/45/60), PO Number
- **Pricing:** Subtotal, Discount (% or amount), Tax, Shipping, Total
- **Additional:** Terms & Conditions, Internal Notes, Public Notes

**Line Items:**
- Import from opportunity products
- Or add products manually
- Editable quantities and prices
- Group by category

**Business Logic:**
1. Create quote linked to opportunity
2. Copy products from opportunity
3. Calculate totals with tax
4. Generate quote PDF
5. Store PDF in cloud storage

---

## 4.2 Quote Templates

### Feature: PDF Templates

**Components:**
- Company logo and branding
- Header (company name, address, contact)
- Quote number and dates
- Bill To / Ship To
- Product table with columns
- Pricing summary
- Terms & conditions
- Signature block
- Footer

**Merge Fields:**
- {{company_name}}, {{quote_number}}, {{quote_date}}
- {{customer_name}}, {{customer_address}}
- {{product_table}}, {{subtotal}}, {{tax}}, {{total}}

**Template Management:**
- Create HTML/CSS template
- Upload company logo
- Customize colors, fonts
- Preview before saving
- Set default template
- Multiple templates for different purposes

**PDF Generation Logic:**
1. Load template HTML
2. Replace merge fields with actual data
3. Render to PDF using library
4. Store PDF file
5. Return download link

---

## 4.3 Send Quote

### Feature: Email Quote to Customer

**Send Process:**
1. User reviews quote
2. Clicks "Send Quote"
3. Popup opens:
   - **To:** Contact email (pre-filled)
   - **CC:** Additional recipients
   - **Subject:** Pre-filled, editable
   - **Message:** Email body template
   - **Attach:** Quote PDF (checked)
   - **Additional Attachments:** File upload
4. User clicks "Send"

**Email Tracking:**
- Embed tracking pixel
- Track email opens
- Track PDF views
- Track time spent viewing
- Notify quote owner when viewed

**Status Updates:**
- When sent: Status = "Sent", record sent date
- When viewed: Status = "Viewed", log activity
- When expired: Auto-update to "Expired"

---

## 4.4 Quote Approval

### Feature: Multi-Level Approval

**Approval Rules:**
- Total > $50K: Manager approval
- Total > $100K: Director approval
- Discount > 15%: Manager approval
- Discount > 25%: Director approval

**Approval Process:**
1. User creates quote
2. System checks if approval needed
3. If yes: Status = "Pending Approval"
4. Notification to approver
5. Approver reviews quote
6. Approver actions:
   - **Approve:** Status = "Approved", can send
   - **Reject:** Status = "Rejected", with comments
   - **Request Changes:** Status = "Needs Revision"

**Approval Chain:**
- Hierarchical (manager → director → VP)
- Parallel (multiple approvers same level)
- Auto-escalation if not approved in X days

**Approver Interface:**
- "My Approvals" page
- List of pending quotes
- Quote details snapshot
- Previous approval comments
- Approve/Reject/Reassign buttons

---

## 4.5 E-Signature

### Feature: Electronic Signature

**Process:**
1. Customer receives quote with "Sign" button
2. Clicks to open signature pad
3. Signs on screen (draw, type, or upload image)
4. System captures:
   - Signature image
   - Signatory name and email
   - Timestamp
   - IP address
5. Signature embedded in PDF
6. Signed PDF sent back to sales rep
7. Quote status updated to "Signed"

**Legal Compliance:**
- Capture acceptance timestamp
- Record IP address
- Store audit trail
- Generate legally compliant PDF

**Integration Options:**
- Native signature capture
- Or integrate: DocuSign, Adobe Sign, PandaDoc

---

## 4.6 Proposal Management

### Feature: Proposal Document Builder

**Sections:**
- Cover Page
- Executive Summary
- Customer Needs/Challenges
- Proposed Solution
- Implementation Plan
- Timeline/Milestones
- Pricing
- Terms & Conditions
- Case Studies
- Team Bios
- Appendix

**Building Process:**
1. Drag-and-drop section ordering
2. Rich text editor per section
3. Insert images, charts, tables
4. Reusable content blocks
5. Variables for dynamic content

**Content Library:**
- Store reusable snippets
- Tag by industry, use case
- Search and insert
- Version control

**Collaboration:**
- Multiple team members edit
- Assign sections to people
- Comments and suggestions
- Review and approval

**PDF Generation:**
1. Compile all sections
2. Apply template styling
3. Replace variables
4. Generate PDF
5. Store and share

---

## 4.7 Proposal Analytics

### Feature: Engagement Tracking

**Tracked Metrics:**
- Date/time sent
- First opened
- Number of times opened
- Total time viewing
- Sections viewed
- Pages viewed most
- Device (desktop/mobile)
- Location (IP-based)

**Engagement Scoring:**
- High: Viewed 3+ times, >10 min
- Medium: Viewed 2 times, 5-10 min
- Low: Viewed once, <5 min
- None: Not opened

**Alerts:**
- Notify when first opened
- Alert if not viewed in 3 days
- Alert on high engagement

**Dashboard:**
- All sent proposals
- Engagement metrics
- Color-coded by level
- Sort by last viewed


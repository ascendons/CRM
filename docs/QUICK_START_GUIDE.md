# CRM Platform - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Prerequisites
- ✅ MongoDB running on localhost:27017
- ✅ Java 17+ installed
- ✅ Node.js 18+ installed

---

## Step 1: Start Backend (Terminal 1)

```bash
cd /Users/pankajthakur/IdeaProjects/CRM/backend
./mvnw spring-boot:run
```

**Wait for:** "Started BackendApplication in X seconds"

**Backend URL:** http://localhost:8080/api/v1

---

## Step 2: Start Frontend (Terminal 2)

```bash
cd /Users/pankajthakur/IdeaProjects/CRM/frontend
npm run dev
```

**Wait for:** "Ready in X ms"

**Frontend URL:** http://localhost:3000

---

## Step 3: Access the Application

### Open Browser
Navigate to: **http://localhost:3000**

### Login with Test Account
- **Email:** sales@crm.com
- **Password:** SalesPass@123

---

## 🎯 Quick Tour

### 1. Dashboard (Homepage)
- View lead statistics
- See quick actions
- Check user information

### 2. View All Leads
Click **"View All Leads"** or navigate to `/leads`

**You'll see:**
- 2 existing leads (John Doe, Jane Smith)
- Statistics cards
- Search bar
- Status filter

**Try:**
- Search for "John"
- Filter by status "CONTACTED"
- Click "View" on any lead

### 3. Create New Lead
Click **"+ New Lead"** or navigate to `/leads/new`

**Fill the form:**
```
First Name: Sarah
Last Name: Johnson
Email: sarah.johnson@techstart.com
Phone: +919876543212
Company: TechStart Inc
Job Title: CEO
Industry: TECHNOLOGY
Company Size: ENTERPRISE
Lead Source: REFERRAL
Expected Revenue: 100000
Description: Met at tech conference, very interested
```

Click **"Create Lead"**

**Result:**
- Lead created with ID: LEAD-2026-01-00003
- Auto-calculated score (CEO = 15, Enterprise = 15, Tech = 10 = 40 points, Grade C)
- Redirected to lead detail page

### 4. View Lead Details
**On the detail page you'll see:**
- Lead name with status badge
- Score and grade (D, C, B, or A)
- Contact information
- Company information
- All form data you entered

**Try these actions:**
- Click "Change Status" → Select "QUALIFIED" → Update
- Click "Convert to Opportunity" (now available)
- Confirm conversion
- See status changed to "CONVERTED"

### 5. Search & Filter
Navigate back to `/leads`

**Try:**
- Search: "sarah" → Finds Sarah Johnson
- Search: "techstart" → Finds by company
- Filter: Status = "CONVERTED" → Shows converted leads
- Clear search → See all leads

---

## 📊 Sample Data

### Existing Leads

**Lead 1:**
- Name: John Doe
- Company: Acme Corporation
- Job Title: CTO
- Email: john.doe@acme.com
- Status: CONTACTED
- Score: 37 (Grade D)
- Lead ID: LEAD-2026-01-00001

**Lead 2:**
- Name: Jane Smith
- Company: TechCorp Inc
- Job Title: VP of Engineering
- Email: jane.smith@techcorp.com
- Status: NEW
- Score: 37 (Grade D)
- Lead ID: LEAD-2026-01-00002

---

## 🎨 UI Features to Try

### Status Badges (Color-Coded)
- **NEW:** Blue
- **CONTACTED:** Yellow
- **QUALIFIED:** Green
- **CONVERTED:** Emerald
- **LOST:** Red

### Lead Grades (A-D)
- **A (80-100):** Hot lead - Green badge
- **B (60-79):** Warm lead - Blue badge
- **C (40-59):** Cold lead - Yellow badge
- **D (0-39):** Very cold - Gray badge

### Interactive Elements
- Click status badges to filter
- Click email addresses to open mailto
- Click phone numbers to call
- Click website URLs to visit
- Search updates instantly (no page reload)

---

## 🧪 Test Scenarios

### Scenario 1: Create High-Score Lead
```
Create a lead with:
- Job Title: CEO (15 points)
- Company Size: ENTERPRISE (15 points)
- Industry: TECHNOLOGY (10 points)

Expected: Score = 40, Grade = C
```

### Scenario 2: Lead Lifecycle
```
1. Create lead → Status: NEW
2. Change status → CONTACTED
3. Change status → QUALIFIED
4. Convert → Status: CONVERTED
5. View statistics → Converted count +1
```

### Scenario 3: Search Functionality
```
1. Create 3 leads with different companies
2. Search by first name → Finds specific lead
3. Search by company → Finds leads from that company
4. Search by email domain → Finds all leads from domain
5. Clear search → Shows all leads
```

### Scenario 4: Filter by Status
```
1. Create leads with different statuses
2. Filter: NEW → Shows only new leads
3. Filter: CONTACTED → Shows only contacted
4. Filter: ALL → Shows all leads again
```

---

## 🔧 Troubleshooting

### Backend won't start?
```bash
# Check if MongoDB is running
mongosh

# If not, start MongoDB
mongod

# Check if port 8080 is available
lsof -i :8080
```

### Frontend won't start?
```bash
# Check if port 3000 is available
lsof -i :3000

# If occupied, kill the process
kill -9 <PID>

# Or use a different port
PORT=3001 npm run dev
```

### Can't login?
```bash
# Register a new user via API
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test@123",
    "fullName": "Test User"
  }'
```

### API errors?
- Check backend console for error messages
- Verify JWT token is being sent (check browser DevTools → Network)
- Ensure backend URL is correct in `.env.local`

---

## 📁 Project Structure

```
CRM/
├── backend/          # Spring Boot API
│   ├── src/main/java/com/ultron/backend/
│   │   ├── controller/   # REST endpoints
│   │   ├── service/      # Business logic
│   │   ├── repository/   # Data access
│   │   ├── domain/       # Entities & enums
│   │   └── dto/          # Request/Response objects
│   └── pom.xml
│
├── frontend/         # Next.js UI
│   ├── app/
│   │   ├── leads/        # Lead pages
│   │   ├── dashboard/    # Dashboard
│   │   ├── login/        # Auth pages
│   │   └── register/
│   ├── lib/              # API services
│   ├── types/            # TypeScript types
│   └── package.json
│
└── docs/            # Documentation
    ├── Module_01_Lead_Management.md
    ├── PHASE_2_IMPLEMENTATION_SUMMARY.md
    └── FRONTEND_LEAD_MANAGEMENT_SUMMARY.md
```

---

## 🎯 Key URLs

| Page | URL | Description |
|------|-----|-------------|
| Login | http://localhost:3000/login | User authentication |
| Dashboard | http://localhost:3000/dashboard | Main dashboard |
| Leads List | http://localhost:3000/leads | All leads |
| New Lead | http://localhost:3000/leads/new | Create lead |
| Lead Detail | http://localhost:3000/leads/[id] | View/edit lead |

---

## 🔑 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /auth/register | Create account |
| POST | /auth/login | Login |
| POST | /leads | Create lead |
| GET | /leads | Get all leads |
| GET | /leads/{id} | Get lead by ID |
| GET | /leads/search?q={term} | Search leads |
| PUT | /leads/{id}/status?status={status} | Update status |
| POST | /leads/{id}/convert | Convert to opportunity |
| DELETE | /leads/{id} | Delete lead |
| GET | /leads/stats | Get statistics |

---

## 📈 What's Next?

### Try These Features:
1. ✅ Create multiple leads
2. ✅ Update lead statuses
3. ✅ Convert qualified leads
4. ✅ Search and filter
5. ✅ View statistics dashboard

### Coming Soon:
- Contact & Account Management
- Opportunity Pipeline
- Email Integration
- Activity Tracking
- Advanced Reporting

---

## 🎉 You're All Set!

The CRM platform is fully functional with:
- ✅ User authentication (JWT)
- ✅ Lead Management (CRUD + more)
- ✅ Search & Filter
- ✅ Status workflow
- ✅ Lead scoring
- ✅ Statistics dashboard
- ✅ Responsive design

**Enjoy exploring your new CRM! 🚀**

---

## 💡 Pro Tips

1. **Keyboard Shortcuts:**
   - Search leads: Just start typing in the search box
   - Quick create: Use "New Lead" button anywhere

2. **Scoring System:**
   - CEO/CTO/CFO = 15 points
   - VP = 12 points
   - Director = 10 points
   - Enterprise company = 15 points
   - Large company = 12 points

3. **Best Practices:**
   - Always qualify leads before converting
   - Use descriptive notes in the description field
   - Tag leads for easy categorization
   - Update status regularly

4. **Data Quality:**
   - Use valid email formats
   - Include country code in phone numbers (+91...)
   - Fill company size for better scoring
   - Add job titles for accurate lead grading

---

**Need Help?**
- Check the `/docs` folder for detailed documentation
- Review backend logs for API issues
- Check browser console for frontend errors
- All features are tested and working!

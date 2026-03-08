# ZOLOTO MRP PDF Extractor - Quick Start Guide

## What Was Built

A complete PDF-to-CSV extractor integrated into your CRM that:
- ✅ Uploads ZOLOTO MRP Price List PDFs
- ✅ Extracts product data (Art No, Name, HSN, Size, Price)
- ✅ Displays data in interactive table with search
- ✅ Downloads extracted data as CSV
- ✅ Shows statistics (products found, total rows, HSN codes, variants)

## Files Created

### Backend (Java)
1. `backend/pom.xml` - Added Apache PDFBox dependency
2. `backend/src/main/java/com/ultron/backend/dto/response/ZolotoProductDTO.java`
3. `backend/src/main/java/com/ultron/backend/dto/response/ZolotoExtractionResponse.java`
4. `backend/src/main/java/com/ultron/backend/service/ZolotoPdfExtractorService.java`
5. `backend/src/main/java/com/ultron/backend/controller/ZolotoController.java`

### Frontend (Next.js)
1. `frontend/app/zoloto/page.tsx` - Main extractor page
2. `frontend/components/ui/table.tsx` - Table component
3. `frontend/components/ui/alert.tsx` - Alert component

### Documentation
1. `ZOLOTO_EXTRACTOR_IMPLEMENTATION.md` - Complete technical documentation
2. `ZOLOTO_QUICKSTART.md` - This file

## Quick Test (3 Steps)

### Step 1: Start Backend
```bash
cd backend
mvn clean install
mvn spring-boot:run
```

Backend will start on: `http://localhost:8080`

### Step 2: Start Frontend
```bash
cd frontend
npm install  # if not already installed
npm run dev
```

Frontend will start on: `http://localhost:3000`

### Step 3: Test the Extractor
1. Login to your CRM: `http://localhost:3000/login`
2. Navigate to: `http://localhost:3000/zoloto`
3. Upload a ZOLOTO PDF file
4. Click "Extract Data" to preview
5. Click "Download CSV" to get the file

## API Endpoints

### 1. Extract as JSON
```bash
POST /api/v1/zoloto/extract
Content-Type: multipart/form-data
Authorization: Bearer <token>
Body: file=<pdf-file>
```

### 2. Download as CSV
```bash
POST /api/v1/zoloto/extract-csv
Content-Type: multipart/form-data
Authorization: Bearer <token>
Body: file=<pdf-file>
```

### 3. Health Check
```bash
GET /api/v1/zoloto/health
```

## Test with cURL

```bash
# Get your auth token first
TOKEN="your-jwt-token"

# Test health endpoint
curl http://localhost:8080/api/v1/zoloto/health

# Extract PDF as JSON
curl -X POST http://localhost:8080/api/v1/zoloto/extract \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@path/to/ZOLOTO-MRP-List.pdf"

# Download CSV
curl -X POST http://localhost:8080/api/v1/zoloto/extract-csv \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@path/to/ZOLOTO-MRP-List.pdf" \
  -o output.csv
```

## Expected CSV Output

```csv
Art. No.,Product Name,HSN Code,Size (Inches),Size (mm),Price/Piece (INR)
1001,Bronze Globe Valve (Screwed),84819090,1/4,8,909
1001,Bronze Globe Valve (Screwed),84819090,3/8,10,909
1001,Bronze Globe Valve (Screwed),84819090,1/2,15,909
1001,Bronze Globe Valve (Screwed),84819090,3/4,20,1311
1001,Bronze Globe Valve (Screwed),84819090,1,25,1722
1001A,Bronze Angle Globe Valve No.4 (Screwed),84819090,1/2,15,979
1008B,Forged Brass Ball Valve (Screwed),84818090,1/4,8,578
```

## How It Works

### PDF Structure Expected
```
1001 ZOLOTO
Bronze Globe Valve (Screwed)
HSN Code : 84819090
1/4  8    909      1 1/2  40   3,748
3/8  10   909      2      50   5,466
1/2  15   909      2 1/2  65   9,371
```

### Extraction Process
1. **Text Extraction** - PDFBox reads all pages
2. **Block Splitting** - Regex finds `\d{4}[A-Z]? ZOLOTO` patterns
3. **Product Parsing** - Extracts name, HSN code, sizes, prices
4. **CSV Generation** - Flattens to one row per size variant
5. **Response** - Returns data + statistics

## Features

### Frontend UI
- 📤 Drag-and-drop or click to upload
- 📊 Real-time statistics display
- 🔍 Search/filter products
- 📥 One-click CSV download
- 🎨 Clean, responsive design

### Backend Service
- 🔒 Secure (requires authentication + permissions)
- ⚡ Fast (processes in memory, no file storage)
- 🛡️ Validated (checks file type, size, format)
- 📝 Logged (tracks all operations)
- 🔧 Maintainable (clean separation of concerns)

## Permissions Required

Users need the **PRODUCT:READ** permission to access the extractor.

To grant permission:
1. Go to: `http://localhost:3000/admin/roles`
2. Select user role
3. Enable "Product" → "Read" permission

## Troubleshooting

### "Permission Denied"
**Fix:** Grant user `PRODUCT:READ` permission in admin panel

### "File must be a PDF"
**Fix:** Ensure file has `.pdf` extension

### "No products found"
**Fix:** Verify PDF is a ZOLOTO MRP Price List with expected format

### "Failed to load PDF"
**Fix:** Check if PDF is password-protected or corrupted

### Backend won't start
**Fix:** Run `mvn clean install` to download PDFBox dependency

## Sample Data

The extractor parses:
- **Article Numbers**: 1001, 1001A, 1008B, 1078K
- **Product Names**: Full descriptions with specifications
- **HSN Codes**: 8-digit tax codes
- **Sizes**: Inches (1/4, 1 1/2, etc.) and mm (8, 40, etc.)
- **Prices**: Indian format (909, 1,311, 1,96,189) → cleaned integers

## Next Steps

### Add to Navigation
Edit your navigation menu to include the ZOLOTO page:

```tsx
{
  title: "ZOLOTO Extractor",
  href: "/zoloto",
  icon: FileText,
  permission: "PRODUCT:READ"
}
```

### Customize Permissions
Change the required permission in `ZolotoController.java`:

```java
@PreAuthorize("hasPermission('ZOLOTO', 'EXTRACT')")
```

### Extend Features
- Import extracted products to database
- Schedule periodic PDF processing
- Email notifications on completion
- Export to Excel (XLSX)
- Batch processing multiple PDFs

## Support

For questions or issues:
1. Check logs: `backend/logs/application.log`
2. Enable debug: `logging.level.com.ultron.backend.service.ZolotoPdfExtractorService=DEBUG`
3. Review: `ZOLOTO_EXTRACTOR_IMPLEMENTATION.md`

---

**Status:** ✅ Ready to Use
**Version:** 1.0.0
**Date:** March 6, 2026

# ZOLOTO API Access Guide

## ✅ Fixed Issues
1. Frontend now uses `/crm-backend/*` proxy path (not `/api/v1/*`)
2. Auth token is `auth_token` (not `token`)

## API URL Options

Your Next.js app has a proxy configured:
- **Proxy Rule:** `/crm-backend/*` → `http://localhost:8080/api/v1/*`

### Option 1: Through Frontend Proxy (Recommended)
```bash
curl -X POST 'http://localhost:3000/crm-backend/zoloto/extract' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -F 'file=@ZOLOTO-MRP-List.pdf'
```

### Option 2: Direct to Backend
```bash
curl -X POST 'http://localhost:8080/api/v1/zoloto/extract' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -F 'file=@ZOLOTO-MRP-List.pdf'
```

## Test Commands

### 1. Health Check (No Auth Required)
```bash
# Through proxy
curl http://localhost:3000/crm-backend/zoloto/health

# Direct to backend
curl http://localhost:8080/api/v1/zoloto/health
```

### 2. Extract PDF (JSON Response)
Replace `YOUR_TOKEN` with your actual JWT token from cookies:

```bash
# Get your token from browser cookies
TOKEN="eyJhbGciOiJIUzUxMiJ9.eyJyb2xlIjoiQURNSU4iLCJ0ZW5hbnRJZCI6IjY5OWYzMzMzNmI2ZmNiNmQyOGIzNTc0NyIsInVzZXJJZCI6IjY5OWYzMzM0NmI2ZmNiNmQyOGIzNTc1MSIsImVtYWlsIjoibG9jYWxAbG9jYWwuY29tIiwic3ViIjoiNjk5ZjMzMzQ2YjZmY2I2ZDI4YjM1NzUxIiwiaWF0IjoxNzcyNzkzODU4LCJleHAiOjE3NzI4ODAyNTh9.GzDHIqh9qf9CT0oiKsOLD11t_KU09PQ0OODa-YsSxCyp4wuXlJI4O_C661KFraTkw0yw2NP6uAwVRzletL2qKA"

# Through proxy
curl -X POST 'http://localhost:3000/crm-backend/zoloto/extract' \
  -H "Authorization: Bearer $TOKEN" \
  -F 'file=@ZOLOTO-MRP-List.pdf'

# Direct to backend
curl -X POST 'http://localhost:8080/api/v1/zoloto/extract' \
  -H "Authorization: Bearer $TOKEN" \
  -F 'file=@ZOLOTO-MRP-List.pdf'
```

### 3. Download CSV
```bash
# Through proxy
curl -X POST 'http://localhost:3000/crm-backend/zoloto/extract-csv' \
  -H "Authorization: Bearer $TOKEN" \
  -F 'file=@ZOLOTO-MRP-List.pdf' \
  -o output.csv

# Direct to backend
curl -X POST 'http://localhost:8080/api/v1/zoloto/extract-csv' \
  -H "Authorization: Bearer $TOKEN" \
  -F 'file=@ZOLOTO-MRP-List.pdf' \
  -o output.csv
```

## Frontend Usage

The frontend page is now correctly configured:

```typescript
// Extract data
const response = await fetch('/crm-backend/zoloto/extract', {
  method: 'POST',
  body: formData,
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
  },
});

// Download CSV
const response = await fetch('/crm-backend/zoloto/extract-csv', {
  method: 'POST',
  body: formData,
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
  },
});
```

## Getting Your Auth Token

### From Browser DevTools:
1. Open DevTools (F12)
2. Go to Application → Cookies → `http://localhost:3000`
3. Find `auth_token` value
4. Copy the token

### From Browser Console:
```javascript
localStorage.getItem('auth_token')
```

## Common Errors & Solutions

### ❌ 404 Not Found
**Wrong:**
```bash
curl http://localhost:3000/api/v1/zoloto/extract
```

**Correct:**
```bash
curl http://localhost:3000/crm-backend/zoloto/extract
# OR
curl http://localhost:8080/api/v1/zoloto/extract
```

### ❌ 401 Unauthorized
**Problem:** Missing or invalid token

**Solution:**
1. Login to the app
2. Get fresh token from browser cookies
3. Use the full token in Authorization header

### ❌ 403 Forbidden
**Problem:** User doesn't have `PRODUCT:READ` permission

**Solution:**
1. Go to Admin → Roles
2. Grant `PRODUCT:READ` permission to user's role

## Testing the Full Flow

### 1. Start Services
```bash
# Terminal 1: Backend
cd backend
./mvnw spring-boot:run

# Terminal 2: Frontend
cd frontend
npm run dev
```

### 2. Login & Get Token
```bash
# Login
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "local@local.com",
    "password": "yourpassword"
  }'

# Copy the token from response
```

### 3. Test Health Endpoint
```bash
curl http://localhost:8080/api/v1/zoloto/health
```

Should return:
```json
{
  "success": true,
  "message": "ZOLOTO PDF extractor is running",
  "data": "OK"
}
```

### 4. Test PDF Upload
```bash
TOKEN="your-token-here"

curl -X POST http://localhost:8080/api/v1/zoloto/extract \
  -H "Authorization: Bearer $TOKEN" \
  -F 'file=@path/to/ZOLOTO-MRP-List.pdf'
```

### 5. Use Frontend UI
```
http://localhost:3000/zoloto
```

## URL Mapping Reference

| Frontend Call | Proxied To | Description |
|--------------|------------|-------------|
| `http://localhost:3000/crm-backend/zoloto/extract` | `http://localhost:8080/api/v1/zoloto/extract` | Extract PDF as JSON |
| `http://localhost:3000/crm-backend/zoloto/extract-csv` | `http://localhost:8080/api/v1/zoloto/extract-csv` | Download CSV |
| `http://localhost:3000/crm-backend/zoloto/health` | `http://localhost:8080/api/v1/zoloto/health` | Health check |

## Notes

- ✅ Frontend automatically adds `Authorization` header
- ✅ Frontend automatically adds `X-Tenant-ID` header
- ✅ Proxy handles CORS issues
- ✅ Auth token is automatically refreshed
- ⚠️ Token expires after ~24 hours - re-login if needed
- ⚠️ Max file size: Check `spring.servlet.multipart.max-file-size` in backend

---

**Updated:** March 6, 2026
**Status:** ✅ Ready to use

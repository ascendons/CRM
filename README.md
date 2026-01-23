# Enterprise CRM Platform

A scalable, production-ready CRM platform built with Spring Boot (Backend) and Next.js (Frontend).

## Tech Stack

### Backend
- Java 17+
- Spring Boot 4.1.0-M1
- Spring Security with JWT
- MongoDB
- Maven

### Frontend
- Next.js 16+ (App Router)
- TypeScript
- Tailwind CSS
- React 19+

## Project Structure

```
CRM/
├── backend/                 # Spring Boot Backend
│   ├── src/main/java/com/ultron/backend/
│   │   ├── controller/     # REST Controllers
│   │   ├── service/        # Business Logic
│   │   ├── repository/     # Data Access Layer
│   │   ├── domain/         # Entities & Enums
│   │   ├── dto/            # Data Transfer Objects
│   │   ├── security/       # JWT & Security Config
│   │   └── exception/      # Exception Handling
│   └── src/main/resources/
│       └── application.properties
│
├── frontend/               # Next.js Frontend
│   ├── app/               # App Router Pages
│   │   ├── login/        # Login Page
│   │   ├── register/     # Registration Page
│   │   └── dashboard/    # Protected Dashboard
│   ├── lib/              # Utilities
│   │   ├── api-client.ts # API Client with JWT
│   │   └── auth.ts       # Auth Service
│   └── types/            # TypeScript Definitions
│
└── docs/                  # Module Specifications
    ├── Module_01_Lead_Management.md
    ├── Module_02_Contact_Account_Management.md
    ├── Module_03_Opportunity_Management.md
    └── Module_04_Proposal_Quote_Management.md
```

## Getting Started

### Prerequisites
- Java 17 or higher
- Node.js 18 or higher
- MongoDB 5.0 or higher

### Backend Setup

1. Navigate to backend directory:
   ```bash
   cd backend
   ```

2. Configure MongoDB in `src/main/resources/application.properties`:
   ```properties
   spring.data.mongodb.uri=mongodb://localhost:27017/crm_db
   ```

3. Build and run:
   ```bash
   ./mvnw clean install
   ./mvnw spring-boot:run
   ```

   Backend will start at: `http://localhost:8080`

### Frontend Setup

1. Navigate to frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env.local` file (already created):
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
   ```

4. Run development server:
   ```bash
   npm run dev
   ```

   Frontend will start at: `http://localhost:3000`

## Authentication System (Phase 1 - ✅ Complete)

### Backend APIs

#### Register User
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "fullName": "John Doe"
}

Response (201 Created):
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "userId": "...",
    "email": "user@example.com",
    "fullName": "John Doe",
    "role": "USER",
    "token": "eyJhbG..."
  }
}
```

#### Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}

Response (200 OK):
{
  "success": true,
  "message": "Login successful",
  "data": {
    "userId": "...",
    "email": "user@example.com",
    "fullName": "John Doe",
    "role": "USER",
    "token": "eyJhbG..."
  }
}
```

### Security Features

- **Password Security**: BCrypt hashing with salt
- **JWT Authentication**: Stateless token-based auth
- **Token Expiration**: 24 hours (configurable)
- **Role-Based Access Control**: ADMIN, MANAGER, SALES_REP, USER
- **CORS Configuration**: Configurable allowed origins
- **Global Exception Handling**: Consistent error responses
- **Input Validation**: Jakarta Validation annotations

### Frontend Features

- **Client-Side Routing**: Next.js App Router
- **Protected Routes**: Middleware-based authentication
- **Token Storage**: localStorage (can be upgraded to HttpOnly cookies)
- **Auto Token Injection**: Automatic JWT header inclusion
- **401 Handling**: Automatic logout and redirect
- **Form Validation**: Client-side + Server-side validation
- **Error Display**: Field-level and global error messages

## API Documentation

### Base URL
```
Development: http://localhost:8080/api/v1
```

### Authentication Header
```
Authorization: Bearer <jwt_token>
```

### Error Response Format
```json
{
  "success": false,
  "message": "Error message",
  "errors": {
    "field1": "Error for field1",
    "field2": "Error for field2"
  }
}
```

### HTTP Status Codes
- `200 OK`: Success
- `201 Created`: Resource created
- `400 Bad Request`: Validation error
- `401 Unauthorized`: Invalid credentials
- `403 Forbidden`: Account inactive
- `409 Conflict`: Resource already exists
- `500 Internal Server Error`: Server error

## Testing the System

### Manual Testing

1. Start MongoDB:
   ```bash
   mongod
   ```

2. Start Backend:
   ```bash
   cd backend && ./mvnw spring-boot:run
   ```

3. Start Frontend:
   ```bash
   cd frontend && npm run dev
   ```

4. Open browser: `http://localhost:3000`

5. Test Flow:
   - Visit root → Auto-redirect to `/login`
   - Click "create a new account" → `/register`
   - Register with valid credentials
   - Auto-redirect to `/dashboard`
   - Verify user information displayed
   - Click "Logout" → Redirect to `/login`
   - Login with credentials → Dashboard

### Using cURL

Register:
```bash
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#",
    "fullName": "Test User"
  }'
```

Login:
```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#"
  }'
```

## Next Steps (Phase 2)

After authentication is confirmed, implement CRM modules in this order:

1. **Module 01**: Lead Management
2. **Module 02**: Contact & Account Management
3. **Module 03**: Opportunity Management
4. **Module 04**: Proposal & Quote Management
5. **Modules 05-10**: Additional features

## Environment Variables

### Backend (`application.properties`)
```properties
# Server
server.port=8080

# MongoDB
spring.data.mongodb.uri=mongodb://localhost:27017/crm_db

# JWT
jwt.secret=<your-secret-key>
jwt.expiration=86400000

# CORS
cors.allowed-origins=http://localhost:3000
```

### Frontend (`.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
```

## Production Considerations

### Backend
- [ ] Use environment-specific configuration
- [ ] Implement refresh tokens
- [ ] Add rate limiting
- [ ] Set up logging (ELK stack)
- [ ] Configure MongoDB replica set
- [ ] Implement caching (Redis)
- [ ] Add API documentation (Swagger/OpenAPI)
- [ ] Set up health checks and metrics

### Frontend
- [ ] Implement HttpOnly cookie storage
- [ ] Add request/response interceptors
- [ ] Implement retry logic
- [ ] Add loading states and skeletons
- [ ] Optimize bundle size
- [ ] Implement error boundaries
- [ ] Add analytics
- [ ] Set up monitoring (Sentry)

## License

Proprietary - All rights reserved

## Support

For issues or questions, contact the development team.

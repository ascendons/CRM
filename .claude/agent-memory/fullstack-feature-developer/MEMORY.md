# CRM Project Memory

## Timezone Implementation (IST - Asia/Kolkata)

**Date**: February 21, 2026
**Status**: Implemented across entire project

### Backend Timezone Configuration

1. **TimeZoneConfig.java** - Sets JVM default timezone to IST on startup
   - Location: `/backend/src/main/java/com/ultron/backend/config/TimeZoneConfig.java`
   - Configures `TimeZone.setDefault()` to Asia/Kolkata

2. **JacksonConfig.java** - Configures JSON serialization for IST
   - Location: `/backend/src/main/java/com/ultron/backend/config/JacksonConfig.java`
   - All LocalDateTime serialized/deserialized in IST

3. **MongoConfig.java** - MongoDB date converters for IST
   - Custom converters: LocalDateTimeToDateConverter, DateToLocalDateTimeConverter
   - Ensures MongoDB stores dates in IST format

4. **DateTimeUtil.java** - Centralized utility for date operations
   - Location: `/backend/src/main/java/com/ultron/backend/util/DateTimeUtil.java`
   - Use `DateTimeUtil.now()` instead of `LocalDateTime.now()`

### Frontend Timezone Configuration

1. **Date Utility Module** - `/frontend/lib/utils/date.ts`
   - Uses `date-fns` and `date-fns-tz` packages
   - All date formatting functions work in IST timezone

2. **Key Functions**:
   - `formatDateIST()` - DD/MM/YYYY
   - `formatDateTimeIST()` - DD/MM/YYYY HH:mm
   - `formatLocaleIST()` - en-IN locale format
   - `formatRelativeTimeIST()` - "5 minutes ago"
   - `formatSmartDateIST()` - Smart contextual formatting

3. **Updated Components**:
   - AuditLogTimeline.tsx
   - EntityActivities.tsx
   - ProposalComments.tsx
   - ProposalVersionHistory.tsx
   - ProposalSnapshotModal.tsx
   - Dashboard page
   - Analytics page
   - Activities detail page

### Best Practices

**Backend**:
- Always use `DateTimeUtil.now()` instead of `LocalDateTime.now()`
- Use DateTimeUtil helper methods for date calculations
- Avoid direct date manipulation without timezone consideration

**Frontend**:
- Import date utilities from `@/lib/utils/date`
- Use `formatLocaleIST()` for general date display
- Use `formatRelativeTimeIST()` for activity feeds
- Never use `new Date().toLocaleString()` directly

### Documentation

Full implementation guide: `/TIMEZONE_IST_IMPLEMENTATION.md`

## Project Structure

### Backend (Java/Spring Boot)
- Base package: `com.ultron.backend`
- Config directory: `/backend/src/main/java/com/ultron/backend/config/`
- Utils directory: `/backend/src/main/java/com/ultron/backend/util/`
- MongoDB used for data persistence

### Frontend (Next.js)
- App directory structure (Next.js 13+ App Router)
- Utilities: `/frontend/lib/utils/`
- Components: `/frontend/components/`
- Type definitions: `/frontend/types/`

## Common Patterns

### Date Formatting in Components
```typescript
import { formatLocaleIST, formatRelativeTimeIST } from '@/lib/utils/date';

// Display timestamp
<time dateTime={timestamp}>{formatLocaleIST(timestamp)}</time>

// Display relative time
<time dateTime={timestamp}>{formatRelativeTimeIST(timestamp)}</time>
```

### Backend Date Operations
```java
import com.ultron.backend.util.DateTimeUtil;

// Get current time
LocalDateTime now = DateTimeUtil.now();

// Format date
String formatted = DateTimeUtil.formatDateTime(now);
```

## Dependencies

### Backend
- Spring Boot
- MongoDB Driver
- Jackson (JSON serialization)

### Frontend
- Next.js 13+
- date-fns: ^4.1.0
- date-fns-tz: ^3.x.x
- TypeScript

## Notes

- All timestamps are in IST (Asia/Kolkata timezone)
- User entity has timezone field defaulting to "Asia/Kolkata"
- MongoDB stores dates as UTC but conversions handle IST
- Consistent date format across application: DD/MM/YYYY for Indian users

# IST (Indian Standard Time) Timezone Implementation Guide

## Overview

This CRM application has been configured to use **IST (Indian Standard Time - Asia/Kolkata)** as the default timezone across both backend and frontend. This ensures consistent date/time handling throughout the application.

## Backend Implementation (Java/Spring Boot)

### 1. Timezone Configuration (`TimeZoneConfig.java`)

Location: `/backend/src/main/java/com/ultron/backend/config/TimeZoneConfig.java`

**Purpose**: Sets the JVM default timezone to IST on application startup.

```java
@Configuration
@Slf4j
public class TimeZoneConfig {
    public static final String DEFAULT_TIMEZONE = "Asia/Kolkata";
    public static final ZoneId DEFAULT_ZONE_ID = ZoneId.of(DEFAULT_TIMEZONE);

    @PostConstruct
    public void init() {
        TimeZone.setDefault(TimeZone.getTimeZone(DEFAULT_ZONE_ID));
        log.info("Application timezone set to: {} (IST - Indian Standard Time)", DEFAULT_TIMEZONE);
    }
}
```

### 2. Jackson Configuration (`JacksonConfig.java`)

Location: `/backend/src/main/java/com/ultron/backend/config/JacksonConfig.java`

**Purpose**: Configures Jackson ObjectMapper to serialize/deserialize dates in IST timezone.

**Key Features**:
- Serializes `LocalDateTime` in ISO format with IST timezone
- Deserializes date strings to `LocalDateTime` in IST
- Disables timestamp-based serialization (uses ISO string format)

### 3. MongoDB Configuration (`MongoConfig.java`)

Location: `/backend/src/main/java/com/ultron/backend/config/MongoConfig.java`

**Purpose**: Provides custom converters for MongoDB date handling in IST.

**Converters**:
- `LocalDateTimeToDateConverter`: Converts `LocalDateTime` to `Date` using IST
- `DateToLocalDateTimeConverter`: Converts `Date` from MongoDB to `LocalDateTime` in IST

### 4. Date Utility Class (`DateTimeUtil.java`)

Location: `/backend/src/main/java/com/ultron/backend/util/DateTimeUtil.java`

**Purpose**: Centralized utility for consistent date/time operations in IST.

**Key Methods**:

```java
// Get current date/time in IST
LocalDateTime now = DateTimeUtil.now();

// Get current date in IST
LocalDate today = DateTimeUtil.today();

// Format dates
String formatted = DateTimeUtil.formatDateTime(dateTime);

// Parse dates
LocalDateTime parsed = DateTimeUtil.parseISO(dateString);

// Date calculations
long days = DateTimeUtil.daysBetween(start, end);
LocalDateTime future = DateTimeUtil.addDays(now, 7);

// Date range helpers
LocalDateTime[] range = DateTimeUtil.getDateRange("THIS_MONTH");
```

### 5. Application Properties

Location: `/backend/src/main/resources/application.properties`

```properties
# Timezone Configuration (IST - Indian Standard Time)
spring.jackson.time-zone=Asia/Kolkata
user.timezone=Asia/Kolkata
```

## Frontend Implementation (Next.js/TypeScript)

### 1. Date Utility Module (`date.ts`)

Location: `/frontend/lib/utils/date.ts`

**Purpose**: Centralized date formatting and timezone conversion for IST.

**Key Functions**:

#### Basic Formatting

```typescript
import { formatDateIST, formatDateTimeIST, formatTimeIST } from '@/lib/utils/date';

// Format date: "21/02/2026"
const date = formatDateIST(dateString);

// Format date-time: "21/02/2026 14:30"
const dateTime = formatDateTimeIST(dateString);

// Format time: "14:30"
const time = formatTimeIST(dateString);
```

#### Relative Time

```typescript
import { formatRelativeTimeIST } from '@/lib/utils/date';

// "5 minutes ago"
const relative = formatRelativeTimeIST(dateString);
```

#### Locale Formatting

```typescript
import { formatLocaleIST } from '@/lib/utils/date';

// "21 Feb 2026, 2:30 pm" (en-IN locale)
const locale = formatLocaleIST(dateString);
```

#### Smart Formatting

```typescript
import { formatSmartDateIST } from '@/lib/utils/date';

// Today: "Today, 14:30"
// Yesterday: "Yesterday, 14:30"
// This week: "Monday, 14:30"
// This year: "21 Feb, 14:30"
// Other: "21 Feb 2026, 14:30"
const smart = formatSmartDateIST(dateString);
```

#### Timezone Conversion

```typescript
import { toIST, parseToIST } from '@/lib/utils/date';

// Convert to IST
const istDate = toIST(dateString);

// Parse to IST
const parsed = parseToIST(isoString);
```

#### Date Checking

```typescript
import { isTodayIST, isYesterdayIST } from '@/lib/utils/date';

// Check if today
if (isTodayIST(dateString)) {
  // ...
}
```

### 2. Updated Components

The following components have been updated to use the IST date utilities:

1. **AuditLogTimeline** (`/frontend/components/common/AuditLogTimeline.tsx`)
   - Uses `formatLocaleIST()` for audit log timestamps

2. **EntityActivities** (`/frontend/components/common/EntityActivities.tsx`)
   - Uses `formatRelativeTimeIST()` for activity timestamps

3. **ProposalComments** (`/frontend/components/proposals/ProposalComments.tsx`)
   - Uses `formatDateTimeLongIST()` for comment timestamps

4. **ProposalVersionHistory** (`/frontend/components/proposals/ProposalVersionHistory.tsx`)
   - Uses `formatDateTimeLongIST()` for version history timestamps

5. **ProposalSnapshotModal** (`/frontend/components/proposals/ProposalSnapshotModal.tsx`)
   - Uses `formatLocaleIST()` and `formatDateIST()` for snapshot details

### 3. Dependencies

```json
{
  "date-fns": "^4.1.0",
  "date-fns-tz": "^3.x.x"
}
```

## Migration Guide

### For Backend Developers

#### Before (Incorrect)

```java
// DON'T use this - uses JVM default timezone which may vary
LocalDateTime now = LocalDateTime.now();
```

#### After (Correct)

```java
// Use the DateTimeUtil for consistent IST timestamps
import com.ultron.backend.util.DateTimeUtil;

LocalDateTime now = DateTimeUtil.now();
```

### For Frontend Developers

#### Before (Incorrect)

```typescript
// DON'T use this - uses browser's timezone
const formatted = new Date(dateString).toLocaleString();

// DON'T use this - doesn't consider timezone
import { formatDistanceToNow } from 'date-fns';
const relative = formatDistanceToNow(new Date(dateString));
```

#### After (Correct)

```typescript
// Use the IST utilities
import { formatLocaleIST, formatRelativeTimeIST } from '@/lib/utils/date';

const formatted = formatLocaleIST(dateString);
const relative = formatRelativeTimeIST(dateString);
```

## Testing

### Backend

```java
@Test
public void testTimezone() {
    LocalDateTime now = DateTimeUtil.now();
    ZonedDateTime zoned = DateTimeUtil.nowZoned();

    // Should be Asia/Kolkata timezone
    assertEquals("Asia/Kolkata", zoned.getZone().getId());
}
```

### Frontend

```typescript
import { nowIST, formatDateTimeIST } from '@/lib/utils/date';

// Current time in IST
const now = nowIST();
console.log(formatDateTimeIST(now)); // "21/02/2026 14:30"
```

## Common Patterns

### 1. Displaying Timestamps

```typescript
// In React components
import { formatRelativeTimeIST, formatLocaleIST } from '@/lib/utils/date';

<time dateTime={timestamp}>
  {formatRelativeTimeIST(timestamp)} {/* "5 minutes ago" */}
</time>

<time dateTime={timestamp}>
  {formatLocaleIST(timestamp)} {/* "21 Feb 2026, 2:30 pm" */}
</time>
```

### 2. Date Input Fields

```typescript
import { formatForDateTimeInputIST, parseToIST } from '@/lib/utils/date';

// Convert to input format
<input
  type="datetime-local"
  value={formatForDateTimeInputIST(date)}
  onChange={(e) => {
    const istDate = parseToIST(e.target.value);
    // Use istDate
  }}
/>
```

### 3. API Requests

```typescript
import { formatForAPIIST } from '@/lib/utils/date';

// When sending dates to backend
const payload = {
  scheduledDate: formatForAPIIST(selectedDate),
  // Backend will receive ISO format in IST
};
```

## Benefits

1. **Consistency**: All timestamps across the application use IST
2. **User Experience**: Indian users see dates in familiar format (DD/MM/YYYY)
3. **No Ambiguity**: All team members see the same timestamps
4. **Backend Alignment**: Frontend and backend use the same timezone
5. **Audit Trail**: Clear, consistent timestamps in logs and audit trails

## Important Notes

1. **Database Storage**: MongoDB stores dates as UTC internally, but our converters ensure read/write operations use IST
2. **API Responses**: All API responses include dates in IST timezone
3. **Browser Timezone**: User's browser timezone is ignored; IST is enforced
4. **Deployment**: Ensure server timezone is set to IST or properly configured

## Troubleshooting

### Issue: Dates showing wrong timezone

**Solution**: Ensure you're using the utility functions, not direct `new Date()` or `LocalDateTime.now()`

### Issue: Date parsing errors

**Solution**: Use `parseToIST()` or `DateTimeUtil.parseISO()` for parsing date strings

### Issue: Inconsistent date formats

**Solution**: Use standardized formatting functions from the utility modules

## Future Enhancements

1. Support for user-specific timezones (store in user preferences)
2. Timezone selector in user settings
3. Display timezone abbreviation (IST) next to timestamps
4. Automated tests for timezone consistency

## Support

For issues or questions about timezone handling:
1. Check this documentation
2. Review the utility source code
3. Consult with the development team

---

**Last Updated**: February 21, 2026
**Maintainer**: Development Team

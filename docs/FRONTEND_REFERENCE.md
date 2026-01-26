# Frontend Reference Guide

**Last Updated:** January 2026  
**Framework:** Next.js 16.1.4 (App Router)  
**Language:** TypeScript 5  
**Styling:** Tailwind CSS v4  
**React:** 19.2.3

---

## 📁 Project Structure

```
frontend/
├── app/                          # Next.js App Router
│   ├── components/              # Reusable components
│   │   └── Navigation.tsx      # Main navigation component
│   ├── accounts/               # Account module pages
│   │   ├── page.tsx           # List page
│   │   ├── new/page.tsx       # Create page
│   │   └── [id]/              # Detail & edit pages
│   ├── contacts/               # Contact module pages
│   ├── leads/                 # Lead module pages
│   ├── opportunities/          # Opportunity module pages
│   ├── dashboard/              # Dashboard page
│   ├── login/                 # Authentication
│   ├── register/
│   ├── layout.tsx             # Root layout
│   ├── globals.css            # Global styles & theme
│   └── page.tsx               # Home/redirect page
│
├── lib/                        # API services & utilities
│   ├── api-client.ts          # Base API client with JWT
│   ├── auth.ts                # Authentication service
│   ├── leads.ts               # Lead API service
│   ├── contacts.ts            # Contact API service
│   ├── accounts.ts            # Account API service
│   └── opportunities.ts       # Opportunity API service
│
├── types/                      # TypeScript type definitions
│   ├── auth.ts                # User & auth types
│   ├── lead.ts                # Lead types & enums
│   ├── contact.ts             # Contact types
│   ├── account.ts             # Account types
│   └── opportunity.ts         # Opportunity types
│
├── middleware.ts              # Route protection
├── package.json               # Dependencies
└── tsconfig.json             # TypeScript config
```

---

## 🎨 Theme & Styling System

### Color Palette

**Primary Colors:**
- Primary: `#3780f6` (Blue)
- Background Light: `#f5f7f8`
- Background Dark: `#101722`
- Text Primary Light: `#0d131c`
- Text Primary Dark: `#e2e8f0`
- Text Secondary Light: `#64748b`
- Text Secondary Dark: `#94a3b8`
- Border Light: `#e2e8f0`
- Border Dark: `#1e293b`
- Card Light: `#ffffff`
- Card Dark: `#0f172a`

**Accent Colors:**
- Blue: `#2563eb` (Leads)
- Purple: `#9333ea` (Contacts)
- Emerald: `#059669` (Accounts)
- Amber: `#d97706` (Opportunities)
- Rose: `#e11d48` (Errors/Destructive)

### CSS Utility Classes

All theme colors are available as utility classes in `globals.css`:

```css
.bg-background-light      /* Light background */
.bg-card-light            /* White card background */
.text-text-primary-light  /* Dark text */
.text-text-secondary-light /* Gray text */
.border-border-light      /* Light border */
.bg-primary              /* Primary blue */
.text-primary            /* Primary blue text */
.border-primary          /* Primary blue border */
```

### Typography

- **Font Family:** Inter (loaded via Google Fonts)
- **Font Weights:** 400, 500, 600, 700
- **Font Variable:** `--font-inter`

### Border Radius

- Default: `0.25rem` (4px)
- Large: `0.5rem` (8px)
- XL: `0.75rem` (12px)
- Full: `9999px` (circular)

---

## 🏗️ Architecture Patterns

### 1. Service Layer Pattern

**Location:** `lib/*.ts`

Each module has a service file that encapsulates all API calls:

```typescript
// Example: lib/leads.ts
export const leadsService = {
  async createLead(data: CreateLeadRequest): Promise<Lead> {
    return await api.post<Lead>('/leads', data);
  },
  async getAllLeads(): Promise<Lead[]> {
    return await api.get<Lead[]>('/leads');
  },
  // ... more methods
};
```

**Pattern:**
- One service per domain (leads, contacts, accounts, opportunities)
- All methods return typed Promises
- Uses centralized `api-client.ts` for HTTP requests
- Automatic JWT token injection

### 2. Type Definitions Pattern

**Location:** `types/*.ts`

Each module has a type file containing:
- Enums (Status, Source, Industry, etc.)
- Main entity interface
- Request/Response DTOs
- Helper functions (color coding, formatting)

**Example Structure:**
```typescript
// types/lead.ts
export enum LeadStatus { ... }
export interface Lead { ... }
export interface CreateLeadRequest { ... }
export function getLeadStatusColor(status: LeadStatus): string { ... }
```

### 3. Page Structure Pattern

**Standard Page Structure:**
```typescript
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/auth';
import { moduleService } from '@/lib/module';
import Navigation from '@/app/components/Navigation';

export default function ModulePage() {
  const router = useRouter();
  const [data, setData] = useState<Type[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push('/login');
      return;
    }
    loadData();
  }, [router]);

  const loadData = async () => {
    try {
      setLoading(true);
      const result = await moduleService.getAll();
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingState />;
  }

  return (
    <div className="min-h-screen bg-background-light">
      <Navigation />
      {/* Page content */}
    </div>
  );
}
```

### 4. API Client Pattern

**Location:** `lib/api-client.ts`

Centralized API client with:
- Automatic JWT token injection
- 401 handling (auto logout)
- Error handling
- Type-safe requests/responses

**Usage:**
```typescript
import { api } from './api-client';

// GET request
const data = await api.get<Type>('/endpoint');

// POST request
const result = await api.post<Type>('/endpoint', requestData);

// PUT request
const updated = await api.put<Type>('/endpoint', updateData);

// DELETE request
await api.delete<void>('/endpoint');
```

---

## 🔧 Common Components

### Navigation Component

**Location:** `app/components/Navigation.tsx`

**Features:**
- Automatic active page highlighting
- User info display
- Logout functionality
- Responsive design

**Usage:**
```typescript
import Navigation from '@/app/components/Navigation';

// In any page component
<Navigation />
```

---

## 📝 Type Definitions

### Standard Entity Structure

All entities follow this pattern:

```typescript
export interface Entity {
  id: string;                    // MongoDB ID
  entityId: string;              // Human-readable ID (LEAD-YYYY-MM-XXXXX)
  
  // Domain fields
  // ...
  
  // System fields
  createdAt: string;
  createdBy: string;
  modifiedAt: string;
  modifiedBy: string;
  isDeleted: boolean;
}
```

### Enum Patterns

All enums are exported as TypeScript enums:

```typescript
export enum EntityStatus {
  VALUE1 = 'VALUE1',
  VALUE2 = 'VALUE2',
}
```

---

## 🎯 Common Patterns

### 1. Loading States

```typescript
if (loading) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background-light">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-text-secondary-light">Loading...</p>
      </div>
    </div>
  );
}
```

### 2. Error Display

```typescript
{error && (
  <div className="mb-4 p-4 bg-rose-50 border border-rose-200 rounded-lg">
    <p className="text-rose-600">{error}</p>
  </div>
)}
```

### 3. Empty States

```typescript
{data.length === 0 ? (
  <div className="px-6 py-12 text-center text-text-secondary-light">
    No items found. Create your first item!
  </div>
) : (
  // Data display
)}
```

### 4. Form Input Pattern

```typescript
<input
  type="text"
  value={value}
  onChange={(e) => setValue(e.target.value)}
  className="w-full px-4 py-2 border border-border-light bg-card-light rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary text-text-primary-light placeholder-text-secondary-light transition-all"
  placeholder="Enter value..."
/>
```

### 5. Button Patterns

**Primary Button:**
```typescript
<button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20">
  Action
</button>
```

**Secondary Button:**
```typescript
<button className="px-4 py-2 border border-border-light rounded-lg text-text-primary-light hover:bg-slate-50 transition-colors">
  Cancel
</button>
```

**Destructive Button:**
```typescript
<button className="px-4 py-2 text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors">
  Delete
</button>
```

### 6. Card Pattern

```typescript
<div className="bg-card-light rounded-xl border border-border-light shadow-sm p-6">
  {/* Card content */}
</div>
```

### 7. Table Pattern

```typescript
<div className="bg-card-light rounded-xl border border-border-light shadow-sm overflow-hidden">
  <table className="min-w-full divide-y divide-border-light">
    <thead className="bg-slate-50">
      <tr>
        <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary-light uppercase">
          Column
        </th>
      </tr>
    </thead>
    <tbody className="bg-card-light divide-y divide-border-light">
      {/* Rows */}
    </tbody>
  </table>
</div>
```

### 8. Status Badge Pattern

```typescript
<span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-50 text-blue-700">
  Status
</span>
```

---

## 🔐 Authentication Flow

### Auth Service

**Location:** `lib/auth.ts`

**Methods:**
- `register(data)` - Register new user
- `login(data)` - Login user
- `logout()` - Clear auth and redirect
- `isAuthenticated()` - Check if user is logged in
- `getUser()` - Get current user from localStorage
- `getToken()` - Get JWT token

### Protected Routes

**Location:** `middleware.ts`

All routes except `/login` and `/register` are protected:
- `/dashboard/*`
- `/leads/*`
- `/contacts/*`
- `/accounts/*`
- `/opportunities/*`

**Flow:**
1. Middleware checks for `auth_token` cookie
2. If missing → redirect to `/login`
3. If present → allow access

---

## 📡 API Integration

### Base URL

```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';
```

### Standard API Response

```typescript
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: Record<string, string>;
}
```

### Error Handling

```typescript
try {
  const data = await service.method();
} catch (err) {
  if (err instanceof ApiError) {
    setError(err.message);
    if (err.errors) {
      setFieldErrors(err.errors);
    }
  } else {
    setError('An unexpected error occurred');
  }
}
```

---

## 🎨 Module Color Themes

Each module has a distinct color theme:

- **Leads:** Blue (`blue-50`, `blue-600`, `blue-700`)
- **Contacts:** Purple (`purple-50`, `purple-600`, `purple-700`)
- **Accounts:** Emerald (`emerald-50`, `emerald-600`, `emerald-700`)
- **Opportunities:** Amber (`amber-50`, `amber-600`, `amber-700`)

---

## 📋 Standard Page Types

### 1. List Page Pattern

**Structure:**
- Navigation header
- Page header (title + action buttons)
- Statistics cards (optional)
- Search & filters
- Data table
- Empty states
- Loading states

**Example:** `app/leads/page.tsx`

### 2. Create Page Pattern

**Structure:**
- Navigation header
- Page header (title + cancel button)
- Multi-section form
- Validation
- Submit button
- Error display

**Example:** `app/leads/new/page.tsx`

### 3. Detail Page Pattern

**Structure:**
- Navigation header
- Page header (title + action buttons)
- Main content (left column)
- Sidebar (right column)
- Action buttons (Edit, Delete, etc.)

**Example:** `app/leads/[id]/page.tsx`

### 4. Edit Page Pattern

**Structure:**
- Navigation header
- Page header (title + cancel button)
- Pre-populated form (same as create)
- Update button
- Error display

**Example:** `app/leads/[id]/edit/page.tsx`

---

## 🛠️ Common Utilities

### Formatting Functions

**Currency:**
```typescript
const formatCurrency = (value: number | undefined) => {
  if (!value) return '-';
  return new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency: 'USD' 
  }).format(value);
};
```

**Date:**
```typescript
const formatDate = (dateString: string | undefined) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString();
};
```

### Color Helper Functions

**Status Colors:**
```typescript
export function getStatusColor(status: Status): string {
  const colors = {
    [Status.VALUE1]: 'bg-blue-50 text-blue-700',
    [Status.VALUE2]: 'bg-green-50 text-green-700',
    // ...
  };
  return colors[status] || 'bg-slate-100 text-slate-600';
}
```

---

## 🔄 State Management

### Standard State Pattern

```typescript
const [data, setData] = useState<Type[]>([]);
const [filteredData, setFilteredData] = useState<Type[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
const [searchQuery, setSearchQuery] = useState('');
```

### Filtering Pattern

```typescript
useEffect(() => {
  filterData();
}, [searchQuery, statusFilter, data]);

const filterData = () => {
  let filtered = [...data];
  
  if (searchQuery) {
    filtered = filtered.filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }
  
  if (statusFilter !== 'ALL') {
    filtered = filtered.filter(item => item.status === statusFilter);
  }
  
  setFilteredData(filtered);
};
```

---

## 🧪 Testing Considerations

### Test Coverage Areas

1. **Service Layer** - API calls and error handling
2. **Components** - Rendering and user interactions
3. **Forms** - Validation and submission
4. **Navigation** - Route protection and redirects
5. **State Management** - Data loading and filtering

---

## 📦 Dependencies

### Core
- `next`: 16.1.4
- `react`: 19.2.3
- `react-dom`: 19.2.3
- `typescript`: ^5

### Styling
- `tailwindcss`: ^4
- `@tailwindcss/postcss`: ^4

### Development
- `eslint`: ^9
- `eslint-config-next`: 16.1.4
- `@types/node`: ^20
- `@types/react`: ^19
- `@types/react-dom`: ^19

---

## 🚀 Development Workflow

### Running the App

```bash
# Development
npm run dev

# Build
npm run build

# Production
npm start

# Lint
npm run lint
```

### Environment Variables

```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
```

---

## 📚 Key Files Reference

### Core Files
- `app/layout.tsx` - Root layout with Inter font
- `app/globals.css` - Theme colors and utilities
- `lib/api-client.ts` - Base API client
- `lib/auth.ts` - Authentication service
- `middleware.ts` - Route protection

### Module Files (per module)
- `types/{module}.ts` - Type definitions
- `lib/{module}.ts` - API service
- `app/{module}/page.tsx` - List page
- `app/{module}/new/page.tsx` - Create page
- `app/{module}/[id]/page.tsx` - Detail page
- `app/{module}/[id]/edit/page.tsx` - Edit page

---

## ✅ Code Quality Standards

### TypeScript
- Strict type checking enabled
- All functions typed
- No `any` types (use `unknown` if needed)
- Interfaces for all data structures

### React
- Functional components only
- Hooks for state management
- `'use client'` directive for client components
- Proper dependency arrays in useEffect

### Styling
- Tailwind utility classes only
- Custom utilities in `globals.css`
- Consistent spacing (4px grid)
- Responsive design (mobile-first)

### Error Handling
- Try-catch blocks for all async operations
- User-friendly error messages
- Field-level error display
- Loading states for all async operations

---

## 🔍 Common Issues & Solutions

### Issue: Black background/black text
**Solution:** Use utility classes from `globals.css` instead of custom Tailwind classes

### Issue: Navigation not showing
**Solution:** Import and use `<Navigation />` component

### Issue: 401 errors
**Solution:** Check token in localStorage, ensure middleware is working

### Issue: Type errors
**Solution:** Ensure types match backend DTOs exactly

---

## 📖 Additional Resources

- **Backend API Docs:** See `docs/PHASE_*_COMPLETE.md` files
- **Module Specifications:** See `docs/Module_*.md` files
- **Quick Start:** See `QUICK_START_GUIDE.md`

---

**This document should be updated whenever new patterns or conventions are established.**

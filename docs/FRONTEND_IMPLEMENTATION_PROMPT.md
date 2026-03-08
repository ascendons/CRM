# Frontend Implementation Guide: Products & Proposals Enhancement

## Overview
The backend has been enhanced with new features for Products and Proposals management. This document outlines all the frontend changes needed to support these backend improvements.

---

## 🎯 IMPLEMENTATION TASKS

### **TASK 1: Add Proposal Update Functionality**

#### **Priority: HIGH**

#### Backend Changes:
- New endpoint: `PUT /api/v1/proposals/{id}` - Update DRAFT proposals
- Only DRAFT status proposals can be updated
- Supports partial updates (all fields optional except in line items)

#### Frontend Requirements:

**1.1 Create/Update UpdateProposalRequest Type**
```typescript
// types/proposal.ts

export interface UpdateProposalRequest {
  title?: string;
  description?: string;
  validUntil?: string; // ISO date string (YYYY-MM-DD)
  lineItems?: LineItemDTO[];
  discount?: DiscountConfigDTO;
  paymentTerms?: string;
  deliveryTerms?: string;
  notes?: string;
}

// LineItemDTO and DiscountConfigDTO remain the same as CreateProposalRequest
```

**1.2 Add Update API Method**
```typescript
// lib/proposals.ts

export async function updateProposal(
  id: string,
  data: UpdateProposalRequest
): Promise<ApiResponse<ProposalResponse>> {
  const response = await fetch(`${API_BASE_URL}/proposals/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    throw new Error('Failed to update proposal');
  }

  return response.json();
}
```

**1.3 Update Proposal Form Component**

Add edit mode to the proposal form:

```typescript
// components/proposals/ProposalForm.tsx

interface ProposalFormProps {
  mode: 'create' | 'edit';
  proposalId?: string; // Required for edit mode
  initialData?: ProposalResponse; // Pre-populate form in edit mode
  onSuccess?: (proposal: ProposalResponse) => void;
}

// Implementation notes:
// - In edit mode, pre-populate all form fields with initialData
// - Show "Update Proposal" instead of "Create Proposal" button
// - Only show edit form if proposal.status === 'DRAFT'
// - Call updateProposal() API instead of createProposal()
// - Handle partial updates (only send changed fields if possible)
```

**1.4 Add Edit Button to Proposal Detail Page**

```typescript
// pages/proposals/[id].tsx or components/proposals/ProposalDetail.tsx

// Show edit button only if:
// - proposal.status === 'DRAFT'
// - User has PROPOSAL:EDIT permission

<Button
  onClick={() => router.push(`/proposals/${proposal.id}/edit`)}
  disabled={proposal.status !== 'DRAFT'}
>
  Edit Proposal
</Button>
```

**1.5 Create Proposal Edit Page**

```typescript
// pages/proposals/[id]/edit.tsx

// - Fetch existing proposal data
// - Pass to ProposalForm in edit mode
// - Redirect to detail page after successful update
// - Show error if proposal is not DRAFT
```

---

### **TASK 2: Implement Pagination for All List Views**

#### **Priority: HIGH**

#### Backend Changes:
- All list endpoints now support optional pagination via query params
- Query params: `page` (0-indexed), `size` (items per page), `sort` (field,direction)
- Returns `Page<T>` object when paginated: `{ content: T[], totalElements, totalPages, number, size }`
- Returns `List<T>` when not paginated (backward compatible)

#### Affected Endpoints:
**Products:**
- `GET /api/v1/products?page=0&size=10&sort=productName,asc`
- `GET /api/v1/products/category/{category}?page=0&size=10`
- `GET /api/v1/products/search?q=query&page=0&size=10`

**Proposals:**
- `GET /api/v1/proposals?page=0&size=10&sort=createdAt,desc`
- `GET /api/v1/proposals/source/{source}/{sourceId}?page=0&size=10`
- `GET /api/v1/proposals/status/{status}?page=0&size=10`
- `GET /api/v1/proposals/owner/{ownerId}?page=0&size=10`

#### Frontend Requirements:

**2.1 Add Page Type Definition**
```typescript
// types/common.ts

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number; // Current page number (0-indexed)
  size: number;   // Page size
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface PaginationParams {
  page?: number;
  size?: number;
  sort?: string; // e.g., "productName,asc" or "createdAt,desc"
}
```

**2.2 Update API Methods to Support Pagination**

```typescript
// lib/products.ts

export async function getAllProducts(
  activeOnly: boolean = false,
  pagination?: PaginationParams
): Promise<ApiResponse<Page<ProductResponse> | ProductResponse[]>> {
  const params = new URLSearchParams({ activeOnly: String(activeOnly) });

  if (pagination) {
    if (pagination.page !== undefined) params.append('page', String(pagination.page));
    if (pagination.size !== undefined) params.append('size', String(pagination.size));
    if (pagination.sort) params.append('sort', pagination.sort);
  }

  const response = await fetch(`${API_BASE_URL}/products?${params}`, {
    headers: { 'Authorization': `Bearer ${getToken()}` }
  });

  return response.json();
}

// Apply same pattern to:
// - getProductsByCategory()
// - searchProducts()
// - getAllProposals()
// - getProposalsBySource()
// - getProposalsByStatus()
// - getProposalsByOwner()
```

**2.3 Create Reusable Pagination Component**

```typescript
// components/common/Pagination.tsx

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalElements: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export function Pagination({
  currentPage,
  totalPages,
  totalElements,
  pageSize,
  onPageChange,
  onPageSizeChange
}: PaginationProps) {
  // Implementation:
  // - Show page numbers (with ellipsis for many pages)
  // - Previous/Next buttons
  // - Page size selector (10, 25, 50, 100)
  // - Show "Showing X-Y of Z items"
  // - Disable Previous on first page, Next on last page

  return (
    <div className="pagination">
      {/* Implement pagination UI */}
    </div>
  );
}
```

**2.4 Update List Components**

```typescript
// components/products/ProductList.tsx

export function ProductList() {
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [pagination, setPagination] = useState({
    currentPage: 0,
    totalPages: 0,
    totalElements: 0,
    pageSize: 10
  });
  const [loading, setLoading] = useState(false);

  const fetchProducts = async (page: number, size: number, sort?: string) => {
    setLoading(true);
    try {
      const response = await getAllProducts(false, { page, size, sort });

      if (response.success) {
        // Check if paginated response
        if ('content' in response.data) {
          setProducts(response.data.content);
          setPagination({
            currentPage: response.data.number,
            totalPages: response.data.totalPages,
            totalElements: response.data.totalElements,
            pageSize: response.data.size
          });
        } else {
          // Non-paginated response (backward compatibility)
          setProducts(response.data);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(0, 10, 'productName,asc');
  }, []);

  return (
    <div>
      {/* Product table/grid */}
      <ProductTable products={products} loading={loading} />

      {/* Pagination controls */}
      {pagination.totalPages > 1 && (
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          totalElements={pagination.totalElements}
          pageSize={pagination.pageSize}
          onPageChange={(page) => fetchProducts(page, pagination.pageSize)}
          onPageSizeChange={(size) => fetchProducts(0, size)}
        />
      )}
    </div>
  );
}

// Apply same pattern to:
// - ProposalList.tsx
// - CategoryProductList.tsx
// - ProductSearchResults.tsx
// - etc.
```

**2.5 Add Sorting Support**

```typescript
// Add sortable column headers

interface SortableColumnHeaderProps {
  label: string;
  field: string;
  currentSort?: string;
  onSort: (field: string, direction: 'asc' | 'desc') => void;
}

export function SortableColumnHeader({
  label,
  field,
  currentSort,
  onSort
}: SortableColumnHeaderProps) {
  const [sortField, sortDirection] = currentSort?.split(',') || [];
  const isActive = sortField === field;
  const direction = isActive ? sortDirection : 'asc';

  const handleClick = () => {
    const newDirection = isActive && direction === 'asc' ? 'desc' : 'asc';
    onSort(field, newDirection);
  };

  return (
    <th onClick={handleClick} className="cursor-pointer">
      {label}
      {isActive && (
        <span>{direction === 'asc' ? ' ↑' : ' ↓'}</span>
      )}
    </th>
  );
}
```

---

### **TASK 3: Add Audit Log Viewer**

#### **Priority: MEDIUM**

#### Backend Changes:
- New `AuditLog` entity created
- Tracks all proposal state transitions (CREATED, SENT, ACCEPTED, REJECTED, DELETED, UPDATED)
- Can be queried by entity type, entity ID, user, action, or time range

#### Frontend Requirements:

**3.1 Add AuditLog Type**
```typescript
// types/auditLog.ts

export interface AuditLog {
  id: string;
  entityType: string;  // "PROPOSAL", "PRODUCT", etc.
  entityId: string;
  entityName: string;
  action: string;      // "CREATED", "SENT", "ACCEPTED", "REJECTED", etc.
  description: string;
  oldValue: string | null;
  newValue: string | null;
  userId: string;
  userName: string;
  timestamp: string;   // ISO datetime
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}
```

**3.2 Add Audit Log API Methods**
```typescript
// lib/auditLogs.ts

export async function getEntityAuditLogs(
  entityType: string,
  entityId: string,
  pagination?: PaginationParams
): Promise<ApiResponse<Page<AuditLog> | AuditLog[]>> {
  // GET /api/v1/audit-logs/entity/{entityType}/{entityId}?page=0&size=20
  // Note: You may need to create this endpoint in backend or use existing pattern
}

export async function getUserAuditLogs(
  userId: string,
  pagination?: PaginationParams
): Promise<ApiResponse<Page<AuditLog> | AuditLog[]>> {
  // GET /api/v1/audit-logs/user/{userId}?page=0&size=20
}
```

**3.3 Create Audit Log Component**

```typescript
// components/auditLogs/AuditLogTimeline.tsx

interface AuditLogTimelineProps {
  entityType: string;
  entityId: string;
}

export function AuditLogTimeline({ entityType, entityId }: AuditLogTimelineProps) {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAuditLogs();
  }, [entityType, entityId]);

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const response = await getEntityAuditLogs(entityType, entityId);
      if (response.success) {
        const data = 'content' in response.data ? response.data.content : response.data;
        setAuditLogs(data);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="audit-log-timeline">
      <h3>Activity History</h3>
      {loading ? (
        <Spinner />
      ) : (
        <div className="timeline">
          {auditLogs.map((log) => (
            <AuditLogEntry key={log.id} log={log} />
          ))}
        </div>
      )}
    </div>
  );
}
```

**3.4 Create Audit Log Entry Component**

```typescript
// components/auditLogs/AuditLogEntry.tsx

interface AuditLogEntryProps {
  log: AuditLog;
}

export function AuditLogEntry({ log }: AuditLogEntryProps) {
  const getActionIcon = (action: string) => {
    switch (action) {
      case 'CREATED': return '✨';
      case 'SENT': return '📤';
      case 'ACCEPTED': return '✅';
      case 'REJECTED': return '❌';
      case 'DELETED': return '🗑️';
      case 'UPDATED': return '📝';
      default: return '•';
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATED': return 'text-blue-600';
      case 'SENT': return 'text-purple-600';
      case 'ACCEPTED': return 'text-green-600';
      case 'REJECTED': return 'text-red-600';
      case 'DELETED': return 'text-gray-600';
      case 'UPDATED': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="audit-log-entry">
      <div className="flex items-start gap-3">
        <div className={`text-2xl ${getActionColor(log.action)}`}>
          {getActionIcon(log.action)}
        </div>
        <div className="flex-1">
          <div className="font-medium">{log.description}</div>
          {log.oldValue && log.newValue && (
            <div className="text-sm text-gray-600 mt-1">
              Changed from <span className="font-mono bg-gray-100 px-1">{log.oldValue}</span>
              {' '}to <span className="font-mono bg-gray-100 px-1">{log.newValue}</span>
            </div>
          )}
          {log.metadata?.reason && (
            <div className="text-sm text-gray-600 mt-1">
              Reason: {log.metadata.reason}
            </div>
          )}
          <div className="text-xs text-gray-500 mt-2">
            {log.userName} • {formatDateTime(log.timestamp)}
          </div>
        </div>
      </div>
    </div>
  );
}
```

**3.5 Add to Proposal Detail Page**

```typescript
// pages/proposals/[id].tsx

// Add a new tab or section to show audit logs
<Tabs>
  <TabsList>
    <TabsTrigger value="details">Details</TabsTrigger>
    <TabsTrigger value="line-items">Line Items</TabsTrigger>
    <TabsTrigger value="history">Activity History</TabsTrigger>
  </TabsList>

  <TabsContent value="history">
    <AuditLogTimeline
      entityType="PROPOSAL"
      entityId={proposal.id}
    />
  </TabsContent>
</Tabs>
```

---

### **TASK 4: Update Validation Feedback**

#### **Priority: MEDIUM**

#### Backend Changes:
- New validation: `validUntil` cannot be more than 12 months in the future
- Discount percentage cannot exceed 100%
- Fixed discount amount cannot exceed line subtotal/total
- Product deletion prevented if used in active proposals

#### Frontend Requirements:

**4.1 Update Form Validations**

```typescript
// components/proposals/ProposalForm.tsx

// Add client-side validation for validUntil
const validateValidUntil = (date: Date) => {
  const today = new Date();
  const maxDate = new Date();
  maxDate.setMonth(maxDate.getMonth() + 12);

  if (date <= today) {
    return 'Valid until date must be in the future';
  }

  if (date > maxDate) {
    return 'Valid until date cannot be more than 12 months in the future';
  }

  return null; // Valid
};

// Add discount validation
const validateDiscount = (
  discountType: DiscountType,
  discountValue: number,
  subtotal: number
) => {
  if (discountType === 'PERCENTAGE') {
    if (discountValue > 100) {
      return 'Discount percentage cannot exceed 100%';
    }
  } else if (discountType === 'FIXED_AMOUNT') {
    if (discountValue > subtotal) {
      return `Discount amount cannot exceed subtotal (${formatCurrency(subtotal)})`;
    }
  }
  return null;
};
```

**4.2 Add Date Picker Constraints**

```typescript
// When using a date picker component

<DatePicker
  value={validUntil}
  onChange={setValidUntil}
  minDate={new Date()} // Today
  maxDate={addMonths(new Date(), 12)} // 12 months from today
  errorMessage={validUntilError}
/>
```

**4.3 Update Error Handling**

```typescript
// Handle backend validation errors gracefully

const handleSubmit = async (data: CreateProposalRequest) => {
  try {
    await createProposal(data);
    toast.success('Proposal created successfully');
  } catch (error: any) {
    // Show specific validation errors
    if (error.response?.status === 400) {
      const message = error.response.data?.message;

      if (message.includes('Valid until date')) {
        setFieldError('validUntil', message);
      } else if (message.includes('discount')) {
        setFieldError('discount', message);
      } else {
        toast.error(message);
      }
    } else {
      toast.error('Failed to create proposal');
    }
  }
};
```

**4.4 Product Deletion Feedback**

```typescript
// components/products/ProductActions.tsx

const handleDelete = async (productId: string) => {
  if (!confirm('Are you sure you want to delete this product?')) {
    return;
  }

  try {
    await deleteProduct(productId);
    toast.success('Product deleted successfully');
    router.push('/products');
  } catch (error: any) {
    if (error.response?.status === 400) {
      const message = error.response.data?.message;

      if (message.includes('active proposal')) {
        // Show detailed error with link to proposals
        toast.error(
          <div>
            <p>{message}</p>
            <button onClick={() => router.push(`/proposals?productId=${productId}`)}>
              View Proposals
            </button>
          </div>,
          { duration: 5000 }
        );
      } else {
        toast.error(message);
      }
    } else {
      toast.error('Failed to delete product');
    }
  }
};
```

---

### **TASK 5: Update Permission Handling**

#### **Priority: LOW**

#### Backend Changes:
- New granular permissions:
  - `PROPOSAL:SEND` - Send proposal to customer
  - `PROPOSAL:APPROVE` - Accept proposal (manager/customer only)
  - `PROPOSAL:REJECT` - Reject proposal (manager/customer only)
- Existing `PROPOSAL:EDIT` can still send, but not approve/reject

#### Frontend Requirements:

**5.1 Update Permission Checks**

```typescript
// hooks/usePermissions.ts

export function usePermissions() {
  const { user } = useAuth();

  const hasPermission = (resource: string, action: string): boolean => {
    // Check user's permissions
    return user?.permissions?.includes(`${resource}:${action}`) || false;
  };

  const canSendProposal = (): boolean => {
    return hasPermission('PROPOSAL', 'SEND') || hasPermission('PROPOSAL', 'EDIT');
  };

  const canApproveProposal = (): boolean => {
    return hasPermission('PROPOSAL', 'APPROVE');
  };

  const canRejectProposal = (): boolean => {
    return hasPermission('PROPOSAL', 'REJECT');
  };

  return {
    hasPermission,
    canSendProposal,
    canApproveProposal,
    canRejectProposal
  };
}
```

**5.2 Update UI Components**

```typescript
// components/proposals/ProposalActions.tsx

export function ProposalActions({ proposal }: { proposal: ProposalResponse }) {
  const { canSendProposal, canApproveProposal, canRejectProposal } = usePermissions();

  return (
    <div className="proposal-actions">
      {/* Send button - only for DRAFT proposals */}
      {proposal.status === 'DRAFT' && canSendProposal() && (
        <Button onClick={handleSend}>
          Send to Customer
        </Button>
      )}

      {/* Approve button - only for SENT proposals, requires APPROVE permission */}
      {proposal.status === 'SENT' && canApproveProposal() && (
        <Button onClick={handleApprove} variant="success">
          Accept Proposal
        </Button>
      )}

      {/* Reject button - only for SENT proposals, requires REJECT permission */}
      {proposal.status === 'SENT' && canRejectProposal() && (
        <Button onClick={handleReject} variant="danger">
          Reject Proposal
        </Button>
      )}
    </div>
  );
}
```

**5.3 Add Permission-based Route Guards**

```typescript
// components/guards/PermissionGuard.tsx

interface PermissionGuardProps {
  resource: string;
  action: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function PermissionGuard({
  resource,
  action,
  fallback,
  children
}: PermissionGuardProps) {
  const { hasPermission } = usePermissions();

  if (!hasPermission(resource, action)) {
    return fallback || <div>You don't have permission to view this.</div>;
  }

  return <>{children}</>;
}

// Usage:
<PermissionGuard resource="PROPOSAL" action="APPROVE">
  <Button onClick={handleApprove}>Accept Proposal</Button>
</PermissionGuard>
```

---

### **TASK 6: UI/UX Improvements**

#### **Priority: LOW**

**6.1 Add Loading States**
- Show skeleton loaders while fetching data
- Disable buttons during API calls
- Show progress indicators for pagination

**6.2 Add Empty States**
- Show friendly messages when no data exists
- Provide action buttons to create first item
- Show helpful tips for getting started

**6.3 Add Confirmation Dialogs**
- Confirm before deleting products/proposals
- Confirm before rejecting proposals (with reason input)
- Confirm before sending proposals

**6.4 Add Success/Error Notifications**
- Toast notifications for all CRUD operations
- Clear error messages with actionable suggestions
- Success messages with next steps

**6.5 Add Status Badges**
```typescript
// components/proposals/ProposalStatusBadge.tsx

export function ProposalStatusBadge({ status }: { status: ProposalStatus }) {
  const getStatusColor = (status: ProposalStatus) => {
    switch (status) {
      case 'DRAFT': return 'bg-gray-200 text-gray-800';
      case 'SENT': return 'bg-blue-200 text-blue-800';
      case 'ACCEPTED': return 'bg-green-200 text-green-800';
      case 'REJECTED': return 'bg-red-200 text-red-800';
      case 'EXPIRED': return 'bg-yellow-200 text-yellow-800';
    }
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
      {status}
    </span>
  );
}
```

---

## 📋 TESTING CHECKLIST

### **Proposal Update**
- [ ] Can edit DRAFT proposal and save changes
- [ ] Cannot edit SENT/ACCEPTED/REJECTED proposal
- [ ] Form pre-populates with existing data
- [ ] Validation errors display correctly
- [ ] Success message shows after update

### **Pagination**
- [ ] Product list shows 10 items per page by default
- [ ] Can navigate between pages
- [ ] Can change page size (10, 25, 50, 100)
- [ ] Shows correct "X-Y of Z items" count
- [ ] Works with search and filters
- [ ] Sorting changes are reflected correctly
- [ ] Pagination works for all list views (products, proposals, etc.)

### **Audit Logs**
- [ ] Audit log timeline shows on proposal detail page
- [ ] Shows all state transitions in chronological order
- [ ] Displays user name and timestamp
- [ ] Shows old value → new value for state changes
- [ ] Shows rejection reason when proposal rejected
- [ ] Timeline auto-updates after actions

### **Validations**
- [ ] Cannot select validUntil more than 12 months ahead
- [ ] Cannot set discount percentage > 100%
- [ ] Cannot set fixed discount > subtotal
- [ ] Cannot delete product used in active proposals
- [ ] Error messages are clear and actionable
- [ ] Client-side validation prevents invalid submissions
- [ ] Backend validation errors display properly

### **Permissions**
- [ ] Send button only shows if user has PROPOSAL:SEND or PROPOSAL:EDIT
- [ ] Accept button only shows if user has PROPOSAL:APPROVE
- [ ] Reject button only shows if user has PROPOSAL:REJECT
- [ ] Users without permissions see appropriate messages
- [ ] Permission checks work on routes and components

---

## 🎨 UI/UX GUIDELINES

### **Design Consistency**
- Use existing component library (shadcn/ui, Material-UI, etc.)
- Follow existing color scheme and typography
- Maintain consistent spacing and layout
- Use icons from existing icon library

### **Responsive Design**
- All new components must be mobile-responsive
- Tables should scroll horizontally on mobile
- Forms should stack vertically on small screens
- Pagination controls should adapt to screen size

### **Accessibility**
- All interactive elements must be keyboard accessible
- Use semantic HTML elements
- Add ARIA labels where needed
- Ensure sufficient color contrast

### **Performance**
- Lazy load components where possible
- Debounce search inputs
- Cache API responses when appropriate
- Optimize images and assets

---

## 🔧 TECHNICAL NOTES

### **State Management**
- Use React Query/SWR for data fetching and caching
- Implement optimistic updates where appropriate
- Handle loading/error states consistently

### **Form Handling**
- Use React Hook Form or Formik for complex forms
- Implement proper validation (client + server)
- Show field-level errors clearly
- Preserve form state on errors

### **API Integration**
- Centralize API calls in `lib/` directory
- Use TypeScript for type safety
- Handle authentication tokens properly
- Implement proper error handling

### **Testing**
- Write unit tests for utility functions
- Write integration tests for forms
- Test pagination edge cases
- Test permission-based rendering

---

## 📚 REFERENCE LINKS

### **Backend API Documentation**
- Swagger/OpenAPI docs: `http://localhost:8080/swagger-ui.html`
- Postman collection: [Link if available]

### **Existing Components**
- Product list: `/components/products/ProductList.tsx`
- Proposal form: `/components/proposals/ProposalForm.tsx`
- API client: `/lib/api.ts`

### **Design System**
- Component library: [shadcn/ui, MUI, etc.]
- Color palette: [Link to design system]
- Icons: [Lucide, Heroicons, etc.]

---

## ❓ FAQ

**Q: Do I need to implement all tasks at once?**
A: No, prioritize HIGH priority tasks first, then MEDIUM, then LOW.

**Q: What if the API endpoint for audit logs doesn't exist yet?**
A: Check with backend team. They may need to expose REST endpoints for the AuditLogService.

**Q: Should pagination be enabled by default?**
A: Yes, use page=0, size=10 as defaults for better performance.

**Q: Can users with PROPOSAL:EDIT still approve proposals?**
A: No, approval requires PROPOSAL:APPROVE permission (prevents conflict of interest).

**Q: What happens to existing code when I add pagination?**
A: The API is backward compatible - if no pagination params sent, returns simple array.

---

## 🚀 GETTING STARTED

1. **Review this document thoroughly**
2. **Set up development environment**
3. **Test backend APIs with Postman**
4. **Start with Task 1 (Proposal Update) - HIGH priority**
5. **Implement Task 2 (Pagination) - HIGH priority**
6. **Continue with remaining tasks in priority order**
7. **Test each feature thoroughly**
8. **Submit for code review**

---

## 📞 SUPPORT

If you encounter issues or need clarification:
- Check backend API documentation
- Review existing similar implementations
- Ask backend team about API behavior
- Consult design team about UI/UX decisions

---

**Good luck with the implementation! 🎉**

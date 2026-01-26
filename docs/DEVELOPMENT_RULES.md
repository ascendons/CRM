# Development Rules & Best Practices

**Last Updated:** January 2026  
**Purpose:** Guidelines for consistent, high-quality development

---

## 🎯 Core Principles

### 1. Code Reusability First
**Rule:** Before implementing any new feature, check if similar code already exists.

**Process:**
1. Search the codebase for similar functionality
2. If found, reuse and extend existing code
3. If not found, create reusable components/services
4. Document new reusable patterns for future use

**Examples:**
- ✅ Reuse `Navigation` component instead of duplicating nav code
- ✅ Reuse `api-client.ts` for all API calls
- ✅ Reuse form patterns from existing create/edit pages
- ✅ Reuse type definitions and helper functions

### 2. Multiple Approaches - Discuss First
**Rule:** When multiple solutions exist, discuss with the team before implementing.

**Process:**
1. Identify the problem
2. Research possible approaches
3. List pros/cons of each approach
4. Discuss with team/lead developer
5. Choose approach together
6. Document decision rationale

**When to Discuss:**
- Architecture decisions
- New patterns or conventions
- Breaking changes
- Performance optimizations
- Third-party library choices

### 3. Quality Over Speed
**Rule:** One step at a time, but correctly.

**Process:**
1. Understand requirements fully
2. Plan the implementation
3. Write clean, maintainable code
4. Test thoroughly
5. Review and refactor if needed
6. Document as needed

**Quality Checklist:**
- [ ] Code follows existing patterns
- [ ] Types are properly defined
- [ ] Error handling is comprehensive
- [ ] Loading states are implemented
- [ ] Empty states are handled
- [ ] Responsive design verified
- [ ] No console errors/warnings
- [ ] Code is readable and well-structured

### 4. Plan → Scan → Implement
**Rule:** For any new change or bug fix, follow this sequence.

**Step 1: Plan**
- Understand the requirement/bug
- Identify affected areas
- List dependencies
- Estimate effort
- Identify risks

**Step 2: Scan Repository**
- Search for existing similar code
- Check related modules
- Review documentation
- Understand data flow
- Identify integration points

**Step 3: Implement**
- Follow existing patterns
- Write tests if applicable
- Update documentation
- Verify integration
- Test thoroughly

**Example Workflow:**
```
Bug: "Navigation not showing on contacts page"

1. PLAN:
   - Understand: Navigation component exists but not used
   - Affected: contacts/page.tsx
   - Solution: Import and use Navigation component
   - Risk: Low

2. SCAN:
   - Check: How is Navigation used in leads/page.tsx?
   - Check: Is Navigation component complete?
   - Check: Any dependencies needed?

3. IMPLEMENT:
   - Import Navigation in contacts/page.tsx
   - Add <Navigation /> component
   - Test: Verify navigation appears
   - Verify: Active state works correctly
```

### 5. Best Development Practices

#### Code Organization
- ✅ One component per file
- ✅ Services in `lib/` directory
- ✅ Types in `types/` directory
- ✅ Components in `app/components/` directory
- ✅ Pages in `app/{module}/` directory

#### Naming Conventions
- ✅ PascalCase for components: `Navigation.tsx`
- ✅ camelCase for functions: `loadData()`
- ✅ camelCase for variables: `searchQuery`
- ✅ UPPER_CASE for constants: `API_URL`
- ✅ kebab-case for files: `api-client.ts`

#### TypeScript
- ✅ Strict typing - no `any`
- ✅ Interfaces for data structures
- ✅ Enums for fixed value sets
- ✅ Type imports from `types/` directory
- ✅ Generic types for reusable functions

#### React Patterns
- ✅ Functional components only
- ✅ Hooks for state management
- ✅ `useEffect` with proper dependencies
- ✅ `'use client'` for client components
- ✅ Error boundaries for error handling

#### API Integration
- ✅ Use service layer (`lib/*.ts`)
- ✅ Type-safe requests/responses
- ✅ Error handling with try-catch
- ✅ Loading states for async operations
- ✅ 401 handling (auto logout)

#### Styling
- ✅ Tailwind utility classes
- ✅ Custom utilities in `globals.css`
- ✅ Consistent spacing (4px grid)
- ✅ Theme colors from CSS variables
- ✅ Responsive design (mobile-first)

### 6. Maximum Test Coverage

#### Testing Strategy
- **Unit Tests:** Service functions, utilities, helpers
- **Component Tests:** React components, user interactions
- **Integration Tests:** API integration, data flow
- **E2E Tests:** Critical user flows

#### Test Coverage Goals
- Minimum 80% code coverage
- 100% coverage for critical paths
- All API services tested
- All form validations tested
- All error paths tested

#### Testing Tools
- Jest for unit tests
- React Testing Library for components
- Playwright/Cypress for E2E (future)

#### What to Test
- ✅ API service methods
- ✅ Form validation
- ✅ User interactions
- ✅ Error handling
- ✅ Loading states
- ✅ Navigation flows
- ✅ Authentication flows

---

## 🔄 Development Workflow

### For New Features

1. **Requirement Analysis**
   - Read requirements carefully
   - Ask clarifying questions
   - Identify edge cases

2. **Repository Scan**
   - Search for existing code
   - Check similar implementations
   - Review related modules
   - Understand data structures

3. **Design Discussion**
   - Present approach to team
   - Discuss alternatives
   - Get approval
   - Document decision

4. **Implementation**
   - Follow existing patterns
   - Write clean code
   - Add error handling
   - Implement loading states

5. **Testing**
   - Unit tests
   - Integration tests
   - Manual testing
   - Edge case testing

6. **Documentation**
   - Update code comments
   - Update reference docs
   - Update API docs if needed

### For Bug Fixes

1. **Reproduce Bug**
   - Understand the issue
   - Reproduce consistently
   - Identify root cause

2. **Scan Repository**
   - Check related code
   - Find similar patterns
   - Understand data flow

3. **Fix Implementation**
   - Fix the root cause
   - Don't create workarounds
   - Follow existing patterns
   - Test thoroughly

4. **Verify**
   - Bug is fixed
   - No regressions
   - Code quality maintained

---

## 📋 Code Review Checklist

### Before Submitting Code

- [ ] Code follows existing patterns
- [ ] No code duplication
- [ ] Types are properly defined
- [ ] Error handling is comprehensive
- [ ] Loading states implemented
- [ ] Empty states handled
- [ ] Responsive design verified
- [ ] No console errors/warnings
- [ ] No TypeScript errors
- [ ] Tests written (if applicable)
- [ ] Documentation updated

### Code Quality Standards

- **Readability:** Code is easy to understand
- **Maintainability:** Easy to modify and extend
- **Performance:** No unnecessary re-renders
- **Security:** No XSS vulnerabilities
- **Accessibility:** Basic a11y considerations

---

## 🚫 Anti-Patterns to Avoid

### ❌ Don't Do This

1. **Code Duplication**
   ```typescript
   // ❌ BAD: Duplicating navigation code
   <nav>...</nav> // In every page
   
   // ✅ GOOD: Reuse component
   <Navigation />
   ```

2. **Hardcoded Values**
   ```typescript
   // ❌ BAD
   const API_URL = 'http://localhost:8080/api/v1';
   
   // ✅ GOOD
   const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';
   ```

3. **Any Types**
   ```typescript
   // ❌ BAD
   const data: any = await api.get('/endpoint');
   
   // ✅ GOOD
   const data: Lead = await api.get<Lead>('/endpoint');
   ```

4. **Missing Error Handling**
   ```typescript
   // ❌ BAD
   const data = await service.getData();
   
   // ✅ GOOD
   try {
     const data = await service.getData();
   } catch (err) {
     setError(err.message);
   }
   ```

5. **Missing Loading States**
   ```typescript
   // ❌ BAD
   const data = await service.getData();
   setData(data);
   
   // ✅ GOOD
   setLoading(true);
   try {
     const data = await service.getData();
     setData(data);
   } finally {
     setLoading(false);
   }
   ```

---

## 📝 Documentation Requirements

### Code Comments
- Complex logic should have comments
- Public APIs should have JSDoc comments
- Non-obvious code should be explained

### Documentation Updates
- Update `FRONTEND_REFERENCE.md` for new patterns
- Update module docs for new features
- Update README for setup changes

---

## 🔍 Repository Scanning Checklist

Before implementing any feature, scan for:

- [ ] Similar functionality in other modules
- [ ] Reusable components
- [ ] Existing utilities/helpers
- [ ] Type definitions
- [ ] API service patterns
- [ ] Form patterns
- [ ] Styling patterns
- [ ] Error handling patterns

---

## ✅ Definition of Done

Code is considered "done" when:

- [ ] Feature works as specified
- [ ] Follows existing patterns
- [ ] No code duplication
- [ ] Error handling implemented
- [ ] Loading states implemented
- [ ] Empty states handled
- [ ] Responsive design verified
- [ ] No console errors/warnings
- [ ] No TypeScript errors
- [ ] Tests written (if applicable)
- [ ] Code reviewed
- [ ] Documentation updated

---

## 🤝 Pair Programming Approach

### Working as a Team

- **Communication:** Discuss approaches, not just implement
- **Code Review:** Review each other's code
- **Knowledge Sharing:** Document decisions and patterns
- **Collaboration:** Work together on complex problems
- **Learning:** Learn from each other's approaches

### When to Ask for Help

- Architecture decisions
- Performance issues
- Complex bugs
- Integration challenges
- Pattern inconsistencies

---

## 📚 Reference Documents

- **Frontend Reference:** `docs/FRONTEND_REFERENCE.md`
- **Module Docs:** `docs/Module_*.md`
- **Phase Summaries:** `docs/PHASE_*_COMPLETE.md`
- **Quick Start:** `QUICK_START_GUIDE.md`

---

**Remember: Quality, Reusability, and Collaboration are key to building a maintainable codebase.**

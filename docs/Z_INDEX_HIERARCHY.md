# Z-Index Hierarchy - Complete Reference

**Date**: 2026-03-08
**Purpose**: Define clear z-index layering to prevent overlap issues

---

## 🎯 Z-Index Stack Order (Low to High)

### **Layer 1: Page Content** (z-0 to z-19)
```
z-0   : Default page content
z-10  : Minor UI elements (badges, tooltips)
```

### **Layer 2: Sticky Elements** (z-20 to z-29)
```
z-20  : Page sticky headers (Leads, Opportunities, Contacts, etc.)
        - Fixed to top of scroll container
        - Should stay below TopBar
```

### **Layer 3: Navigation** (z-30 to z-39)
```
z-30  : Sidebar navigation
        - Fixed position on left
        - Desktop: 240px wide (collapsed: 60px)
        - Mobile: Slide-out with backdrop
```

### **Layer 4: Top Bar** (z-40 to z-49)
```
z-40  : TopBar (header)
        - Sticky at top
        - Contains mobile menu, search, chat, notifications, user menu
        - Must be above sticky headers
```

### **Layer 5: Overlays & Panels** (z-50 to z-59)
```
z-50  : Chat Panel (Dialog)
z-50  : Notification Panel (Dialog)
        - Slide-out panels from TopBar
        - Should cover all content below
```

### **Layer 6: Dropdowns** (z-60 to z-69)
```
z-[60]: UserMenu backdrop
        - Invisible click target to close menu
        - Covers entire screen

z-[70]: UserMenu dropdown
        - Profile menu from TopBar
        - Must appear above everything except modals
```

### **Layer 7: Modals** (z-70+)
```
z-[60]: Create Group Modal (in ChatPanel)
z-[100]: Confirm modals, dialogs
         - Full-screen overlays
         - Highest priority UI elements
```

---

## 📋 Component Reference

### **Sidebar** (`frontend/app/components/Sidebar.tsx`)
```typescript
// Desktop sidebar
<aside className="... z-30">

// Mobile sidebar backdrop
<div className="fixed inset-0 bg-slate-900/80 z-50">

// Mobile sidebar panel
<Dialog.Panel className="... z-50">
```

### **TopBar** (`frontend/app/components/TopBar.tsx`)
```typescript
<header className="... sticky top-0 z-40">
```

### **Page Sticky Headers**
```typescript
// Example: Leads, Opportunities, Contacts pages
<div className="sticky top-0 z-20 bg-white/80 backdrop-blur-lg">
```

### **UserMenu** (`frontend/components/UserMenu.tsx`)
```typescript
// Backdrop
<div className="fixed inset-0 z-[60]">

// Dropdown menu
<div className="absolute right-0 ... z-[70]">
```

### **ChatPanel** (`frontend/app/components/ChatPanel.tsx`)
```typescript
<Dialog as="div" className="relative z-50">
```

### **NotificationPanel** (`frontend/app/components/NotificationPanel.tsx`)
```typescript
<Dialog as="div" className="relative z-50">
```

---

## 🐛 Common Issues & Solutions

### **Issue 1: Dropdown Hidden Behind Sticky Header**
**Symptom**: UserMenu or other dropdown gets cut off when page scrolls

**Solution**:
- Ensure TopBar has higher z-index than sticky headers
- TopBar: `z-40`
- Sticky headers: `z-20`
- Dropdowns: `z-[60]` or higher

### **Issue 2: Modal Not Covering Sidebar**
**Symptom**: Sidebar visible through modal backdrop

**Solution**:
- Modals should use `z-[100]` or higher
- Sidebar uses `z-30`
- Ensure modal backdrop has proper opacity

### **Issue 3: Mobile Sidebar Not Appearing**
**Symptom**: Mobile sidebar doesn't overlay content

**Solution**:
- Mobile sidebar should use `z-50` (same as panels)
- Ensure backdrop has proper `inset-0` and `fixed` positioning

---

## ✅ Best Practices

### **1. Use Standard Z-Index Values**
Stick to the defined layers:
```typescript
// Good ✅
z-20, z-30, z-40, z-50, z-[60], z-[70]

// Bad ❌
z-25, z-35, z-999
```

### **2. Custom Values Only When Needed**
Use bracket notation `z-[60]` only for:
- Fine-tuned layering
- Values not in Tailwind's default scale

### **3. Document Custom Z-Index**
If you add a new z-index value:
```typescript
// Example: Special overlay
<div className="z-[65]"> {/* Above UserMenu backdrop (60) but below dropdown (70) */}
```

### **4. Test Overlap Scenarios**
Always test:
- [ ] Dropdown with sticky header scrolled
- [ ] Modal with sidebar open
- [ ] Mobile menu with notifications
- [ ] Nested dialogs (if any)

---

## 🔍 Debugging Z-Index Issues

### **1. Inspect Element**
```
1. Right-click → Inspect
2. Check computed z-index value
3. Look at stacking context (parent elements)
```

### **2. Visual Debugging**
Add temporary backgrounds:
```typescript
className="... bg-red-500/20" // See the layer
```

### **3. Common Pitfalls**

**Pitfall 1: Stacking Context**
```typescript
// Parent with transform creates new stacking context
<div className="transform"> {/* ❌ Breaks z-index */}
  <div className="z-[999]"> {/* Won't work as expected */}
```

**Pitfall 2: Position Not Set**
```typescript
// z-index requires position
<div className="z-50"> {/* ❌ No effect */}
<div className="relative z-50"> {/* ✅ Works */}
<div className="fixed z-50"> {/* ✅ Works */}
```

---

## 📊 Current Layer Visualization

```
┌─────────────────────────────────────┐
│ z-[100]+ Modals & Dialogs          │ ← Top
├─────────────────────────────────────┤
│ z-[70]   UserMenu Dropdown          │
├─────────────────────────────────────┤
│ z-[60]   UserMenu Backdrop          │
├─────────────────────────────────────┤
│ z-50     Chat/Notification Panels   │
├─────────────────────────────────────┤
│ z-40     TopBar                     │
├─────────────────────────────────────┤
│ z-30     Sidebar                    │
├─────────────────────────────────────┤
│ z-20     Page Sticky Headers        │
├─────────────────────────────────────┤
│ z-10     Minor UI Elements          │
├─────────────────────────────────────┤
│ z-0      Page Content               │ ← Bottom
└─────────────────────────────────────┘
```

---

## 🚀 Quick Reference Card

| Component          | Z-Index | Position   | Notes                    |
|--------------------|---------|------------|--------------------------|
| Page Content       | 0       | relative   | Default                  |
| Sticky Headers     | 20      | sticky     | In scroll containers     |
| Sidebar (Desktop)  | 30      | fixed      | Left navigation          |
| TopBar             | 40      | sticky     | Top header bar           |
| Chat/Notifications | 50      | fixed      | Slide-out panels         |
| UserMenu Backdrop  | 60      | fixed      | Click-to-close overlay   |
| UserMenu Dropdown  | 70      | absolute   | Profile menu             |
| Modals             | 100+    | fixed      | Full-screen overlays     |

---

## 🔄 Change Log

### **2026-03-08 - Initial Fix**
- ✅ Increased TopBar from `z-20` to `z-40`
- ✅ Increased UserMenu backdrop from `z-40` to `z-[60]`
- ✅ Increased UserMenu dropdown from `z-50` to `z-[70]`
- ✅ Fixed profile dropdown being hidden behind sticky headers

**Reason**: After sidebar implementation, TopBar and sticky headers had same z-index (20), causing dropdowns to be hidden when scrolling.

---

**Status**: ✅ All z-index conflicts resolved

Use this document as the single source of truth for z-index values across the application.


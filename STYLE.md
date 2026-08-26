# E-Commerce Application Design & Style Guide (STYLE.md)

This document establishes the official design system, visual standards, and layout conventions for all panels (**Admin, Manager, Sales, and User**) across the application. Any future page generation or UI refactoring must strictly adhere to these rules.

---

## 1. Primary Design Directives

### A. Primary Theme Color (from globals.css)
- **Primary Brand Tokens**: Defined directly in `src/app/globals.css` (`--color-primary: #73976A;`, `--color-primary-dark: #607E59;`, `--color-primary-light: #a2ba9c;`).
- **Primary Tailwind Classes**: Top navigation bars, sidebars, active badges, key buttons, and stat card icons MUST use CSS classes `bg-primary`, `text-primary`, `border-primary`, `hover:bg-primary-dark` from `globals.css` rather than JS variable declarations (`const themeColor = ...`).
- **Text & Contrast**: High-contrast white (`#FFFFFF`) or slate-900 (`#0F172A`) against primary color backgrounds.

### B. Sharp & Square Geometry (Zero Rounded Classes)
- **STRICT RULE**: **0 `rounded-*` classes permitted.**
- All UI elements MUST feature sharp, square 90-degree corners:
  - Cards, modals, containers: `border border-slate-200 shadow-sm` (No `rounded-xl`, `rounded-2xl`, `rounded-full`, etc.)
  - Input fields, selects, textareas: `px-3 py-2 bg-white border border-slate-200 text-xs text-slate-800 outline-none`
  - Action buttons: `px-4 py-2.5 text-white text-xs font-bold transition shadow-sm cursor-pointer`
  - Image thumbnails: `w-10 h-10 object-cover border border-slate-200`
  - Badges & Tags: `px-1.5 py-0.5 text-[9px] font-bold uppercase border`

---

## 2. Zero Horizontal Page Overflow & Responsive Tables

### A. Table Layout Rule
- **DO NOT** wrap `<table>` inside `overflow-x-auto` or scrollable containers.
- Tables must seamlessly fit 100% width of any screen (`w-full text-left border-collapse text-xs`).

### B. Responsive Column Visibility Breakpoints
Instead of horizontal scrolling, hide non-essential columns on smaller screens using Tailwind column visibility rules on both `<th>` and `<td>`:

| Screen Width | Visible Columns |
| :--- | :--- |
| **Mobile (`<640px`)** | Primary ID (Order/Item/Customer), Main Name, Total Price, Status Badge, Actions Menu |
| **Small (`sm:`)** | + Date, Phone Number, Subtotal, Category Name |
| **Medium (`md:`)** | + Courier Name, Barcode, Brand Name, Payment Method, Purchase Price |
| **Large (`lg:`)** | + Product Item Count, Full Address, Hierarchy, Registration Timestamps |

---

## 3. Color Palette & Status Badges

### A. Palette Tokens
- **Canvas / Page Background**: `bg-slate-50`
- **Container / Card Background**: `bg-white`
- **Borders**: `border-slate-200` (Header dividers: `border-slate-100`)
- **Primary Text**: `text-slate-800` / `text-slate-900`
- **Secondary Text**: `text-slate-500` / `text-slate-400`
- **Monospace Code/IDs**: `font-mono text-slate-500`

### B. Status Badges
All status badges use sharp square borders with light background tints:
- **Completed / Active / Verified / In-Stock**:
  `bg-emerald-50 text-emerald-700 border border-emerald-200`
- **Pending / Low Stock / Warning**:
  `bg-amber-50 text-amber-700 border border-amber-200`
- **Cancelled / Returned / Banned / Out of Stock / Danger**:
  `bg-rose-50 text-rose-700 border border-rose-200`
- **Processing / Out for Delivery / Open**:
  `bg-sky-50 text-sky-700 border border-sky-200`

---

## 4. Component Patterns

### A. Page Header Standard
```jsx
<div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-4 gap-4">
  <div>
    <h1 className="text-xl md:text-2xl font-bold text-slate-800 flex items-center gap-2">
      <BiIcon style={{ color: themeColor }} /> Page Title
    </h1>
    <p className="text-xs text-slate-500 mt-0.5">Descriptive subtitle text here.</p>
  </div>
  <button
    className="px-4 py-2.5 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
    style={{ backgroundColor: themeColor }}
  >
    <BiPlus /> Action Label
  </button>
</div>
```

### B. Stat / Metric Card Standard
```jsx
<div className="bg-white border border-slate-200 p-5 shadow-sm flex items-center justify-between">
  <div>
    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Metric Title</p>
    <h3 className="text-lg font-bold text-slate-800 mt-0.5">Value Count</h3>
  </div>
  <div className="w-10 h-10 text-white flex items-center justify-center text-xl shrink-0 font-bold" style={{ backgroundColor: themeColor }}>
    <BiIcon />
  </div>
</div>
```

### C. Search & Filter Bar Standard
```jsx
<div className="flex items-center gap-3 bg-white p-4 border border-slate-200 shadow-sm">
  <div className="flex-1 max-w-md flex items-center gap-2 bg-slate-50 px-3 py-2 border border-slate-200">
    <BiSearch className="text-slate-400 text-base shrink-0" />
    <input 
      type="text"
      placeholder="Search query..."
      className="w-full text-xs text-slate-800 bg-transparent outline-none"
    />
  </div>
</div>
```

### D. Table Standard
```jsx
<div className="bg-white border border-slate-200 shadow-sm">
  <table className="w-full text-left border-collapse text-xs">
    <thead className="bg-slate-100/80 text-slate-650 font-bold border-b border-slate-200">
      <tr>
        <th className="px-3 md:px-4 py-3">Column 1</th>
        <th className="hidden sm:table-cell px-3 md:px-4 py-3">Column 2</th>
        <th className="hidden md:table-cell px-3 md:px-4 py-3">Column 3</th>
        <th className="px-3 md:px-4 py-3 text-right">Actions</th>
      </tr>
    </thead>
    <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
      {/* Table rows */}
    </tbody>
  </table>
</div>
```

### E. Three-Dot Action Menu Standard
All table action columns across sales desks and order lists MUST use a unified three-dot action menu (`BiDotsVerticalRounded`) rather than multiple scattered action buttons:
```jsx
<td className="px-2 sm:px-3 py-3 text-center relative action-menu-container">
  <button
    onClick={(e) => {
      e.stopPropagation()
      setOpenMenuId(isMenuOpen ? null : order.order_id)
    }}
    className="p-1.5 hover:bg-slate-100 text-slate-700 transition cursor-pointer border border-slate-200 shadow-xs"
  >
    <BiDotsVerticalRounded className="text-lg" />
  </button>

  {isMenuOpen && (
    <div className="absolute right-2 top-11 w-44 bg-white border border-slate-200 shadow-lg z-30 flex flex-col divide-y divide-slate-100 py-1 text-left">
      <button onClick={() => router.push(`/dashboard/orders/${order.order_id}`)} className="w-full px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2">
        <BiShow className="text-slate-500 text-base" /> Preview
      </button>
      <button onClick={() => openPaymentModal(order, 'confirmed')} className="w-full px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-50 flex items-center gap-2">
        <BiCheckCircle className="text-emerald-600 text-base" /> Confirm
      </button>
      <button onClick={() => openPaymentModal(order, 'delivered')} className="w-full px-3 py-2 text-xs font-bold text-sky-700 hover:bg-sky-50 flex items-center gap-2">
        <BiSolidTruck className="text-sky-600 text-base" /> Deliver
      </button>
      <button onClick={() => printReceipt(order, website)} className="w-full px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2">
        <BiPrinter className="text-slate-500 text-base" /> Print Receipt
      </button>
      <button onClick={() => handleCancelOrder(order.order_id)} className="w-full px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2">
        <BiXCircle className="text-rose-600 text-base" /> Cancel
      </button>
    </div>
  )}
</td>
```

---

## 5. Domain Business Rules & Features

- **Pagination**: Default 20 orders/items per page across all order desks.
- **Action Columns**: Unified 3-dot vertical dropdown menu (`BiDotsVerticalRounded`) for Preview, Confirm, Deliver, Print Receipt, Return, Cancel, Delete.
- **Order Return Policy**:
  - Restores all product quantities back into stock (`addStockBack()`).
  - Sets all financial amounts (`subtotal_amount`, `total_discount_amount`, `delivery_charge`, `total_amount`, `due_amount`) to `0`.
- **Order Cancel Policy**:
  - Restores product stock quantities into inventory, updates status to `cancelled`, and bypasses payment registration.
- **Payment Collection on Confirm & Deliver**:
  - Clicking Confirm or Deliver opens a payment modal popup to record `payment_amount`, `payment_method`, and note.

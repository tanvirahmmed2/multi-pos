# E-Commerce & In-Store POS Console Platform

A full-stack, enterprise-grade E-Commerce platform and Point of Sale (POS) console built with **Next.js (App Router)**, **PostgreSQL**, **TailwindCSS**, and **JWT Authentication**.

This system seamlessly unifies online customer storefront operations with in-store brick-and-mortar retail transactions, offering real-time inventory synchronization, role-based back-office dashboards (Admin, Manager, Sales Staff), supplier purchasing workflows, automated invoice generation, and Excel reporting.

---

## 📋 Table of Contents

- [System Architecture](#-system-architecture)
- [Key Modules & Business Logic Workflows](#-key-modules--business-logic-workflows)
  - [1. Customer Storefront & Checkout](#1-customer-storefront--checkout)
  - [2. Point-of-Sale (POS) Retail Console](#2-point-of-sale-pos-retail-console)
  - [3. Order Lifecycle & Stock State Machine](#3-order-lifecycle--stock-state-machine)
  - [4. Purchasing & Inventory Receiving](#4-purchasing--inventory-receiving)
  - [5. Support Ticket & Internal Messaging Systems](#5-support-ticket--internal-messaging-systems)
  - [6. Reporting & Analytics Export](#6-reporting--analytics-export)
- [Role-Based Access Control (RBAC)](#-role-based-access-control-rbac)
- [Database Schema & Data Model](#-database-schema--data-model)
- [API Route Specification](#-api-route-specification)
- [Directory & File Layout](#-directory--file-layout)
- [Environment Variables](#-environment-variables)
- [Installation & Setup](#-installation--setup)

---

## 🏗️ System Architecture

- **Frontend & App Framework**: [Next.js 16 (App Router)](https://nextjs.org/) using Server-side API endpoints, Client Components, and React 19.
- **Styling**: [TailwindCSS v4](https://tailwindcss.com/) with custom typography, dynamic themes, and responsive design systems.
- **Database Layer**: [PostgreSQL](https://www.postgresql.org/) powered by node-postgres (`pg`) connection pooling (`src/lib/db.js`).
- **Authentication & Middleware**: JSON Web Tokens (`jsonwebtoken`), `bcryptjs` password hashing, HTTP-Only Cookies (`ecom_token`), and Next.js middleware protection (`src/proxy.js`).
- **Media Management**: [Cloudinary](https://cloudinary.com/) SDK integration (`src/lib/cloudinary.js`) for uploading category, brand, and product variant media.
- **Transactional Mailer**: [Brevo SMTP API](https://www.brevo.com/) (`src/lib/mailer.js`) for user email verification and account recovery.
- **Document & Receipt Generation**: Thermal/Paper invoice printer helper (`src/lib/printreceipt.js`) and Excel spreadsheet exporter using `xlsx` (`src/app/api/report/export/route.js`).
- **Rich Text Editing**: [TipTap Editor](https://tiptap.dev/) (`src/component/helper/RichTextEditor.jsx`) for rich HTML product descriptions.

---

## ⚙️ Key Modules & Business Logic Workflows

### 1. Customer Storefront & Checkout
- **Dynamic Catalog Navigation**: Parent-child category tree hierarchy with auto-generated slugs.
- **Product Exploration**: Filtering by category, brand, search queries, and dynamic pricing display handling active discounts and sale markdowns.
- **Cart & Stock Safeguards**: Client-side cart backed by `localStorage` and managed via React Context (`src/component/helper/Context.jsx`). Prevents adding quantities exceeding real-time variant stock levels.
- **Storefront Checkout Engine**:
  - Calculates dynamic delivery surcharges (**70 BDT** for Dhaka city, **130 BDT** for external locations).
  - Automatically creates or updates customer profiles via phone number lookup.
  - Submits orders with initial `pending` status and Cash-On-Delivery (`cod`) payment mode.

### 2. Point-of-Sale (POS) Retail Console
- **Dual-Pane POS Grid**: Cart, customer details, and checkout controls on the left; product search, barcode scanner integration, and quick-add catalog grid on the right.
- **Instant Barcode Scanning**: Automatic product/variant lookup using hardware/virtual barcode scanners (`src/component/helper/BarScanner.jsx`).
- **Smart Customer Lookup**: Instant autocomplete match by customer phone. Automatically registers a guest profile if no match is found.
- **Atomic Stock Deduction**: Instantly deducts inventory upon transaction approval.
- **Multi-Payment & Receipt Printing**: Supports Cash, Card, and Mobile Financial Services (MFS) payments, calculates exact cash change, and pops up a print-ready formatted invoice (`src/lib/printreceipt.js`).

### 3. Order Lifecycle & Stock State Machine
The platform enforces strict inventory state transitions during order processing to prevent stock duplication or overselling:

```
[Pending] ──> [Confirmed] ──> [Processing] ──> [Shipped] ──> [Out for Delivery] ──> [Delivered]
    │              │
    └──────────────┴──> [Cancelled / Returned] (Restocks inventory)
```

- **Stock Deduction Trigger**: Stock is deducted from `product_variants` when an order transitions to `confirmed`, `processing`, `shipped`, `out_for_delivery`, or `delivered`.
- **Restock Trigger**: If a confirmed/shipped order is `cancelled` or `returned`, inventory is automatically added back to the respective variant SKUs.
- **Payment Settlement**: Changing an order status to `delivered` automatically creates a completed payment entry in `public.payments` and resets `due_amount` to zero.

### 4. Purchasing & Inventory Receiving
- **Supplier Directory**: Manages supplier company info, contact phone, and email records.
- **Purchase Order Receipts**: Allows stock managers to log incoming inventory batches, apply extra discounts, specify supplier invoice numbers, and make partial or full initial payments.
- **Inventory Audit Logging**: Every purchase auto-increments variant stock levels and logs an entry in `inventory_logs` with type `purchase`.

### 5. Support Ticket & Internal Messaging Systems
- **Customer Support Tickets**: Customers can open tickets with customizable priority (`low`, `medium`, `high`, `urgent`) and view resolution status (`pending`, `open`, `in_progress`, `resolved`, `closed`).
- **Public Contact Inquiries**: Web contact form submissions generate inquiries that managers can review and reply to directly.
- **Internal Staff Issues**: Dedicated staff/admin issue messaging system backed by PostgreSQL database view (`issues_view`) for cross-role communication.

### 6. Reporting & Analytics Export
- Staff with `admin` or `manager` roles can export database records into formatted `.xlsx` Excel spreadsheets:
  - **Sales Report**: Includes customer details, order financial breakdown, and product line item summaries.
  - **Products Report**: Export full catalog with SKUs, barcodes, cost prices, retail prices, and stock levels.
  - **Purchases Report**: Supplier invoices, subtotal, discount, total paid, and balance due.
  - **Customers Report**: Directory of all registered customer profiles.
  - **Payments Report**: Master transaction ledger.

---

## 🔐 Role-Based Access Control (RBAC)

User clearance levels are controlled via the `role` column in `users` and enforced in `src/lib/auth.js` & `src/proxy.js`:

| Role | Access Permissions & Responsibilities |
| :--- | :--- |
| **👑 Admin** | Full system control: Manage staff accounts, change user roles, ban/unban users, configure store branding & hero banners (`websites`), view payment ledgers, system reports, and resolve staff issues. |
| **📦 Manager** | Catalog & Stock control: Create/edit products, variants, barcodes, categories, and brands; manage suppliers and purchase invoices; review low stock alerts; handle returns; respond to contact/support inquiries. |
| **💸 Sales** | Front-desk operations: Access POS console, manage order queues (confirm, dispatch, ship), record payments, and print invoice receipts. |
| **👤 User** | Customer portal: View order history, update personal profile details, submit support tickets, submit product reviews, track order status. |

---

## 🗄️ Database Schema & Data Model

The PostgreSQL database schema is structured around 17 primary entities:

```
                  +-------------------+
                  |       users       |
                  +-------------------+
                            | 1:N
     +----------------------+----------------------+
     |                      |                      |
+----+----+            +----+----+            +----+----+
| reviews |            | supports|            | issues  |
+---------+            +----+----+            +---------+
                            | 1:N
                       +----+----+
                       | support_|
                       | messages|
                       +---------+

+-------------------+          +--------------------+          +-------------------+
|    categories     |          |       brands       |          |     suppliers     |
+---------+---------+          +---------+----------+          +---------+---------+
          | 1:N                          | 1:N                           | 1:N
          +------------------+-----------+                               |
                             |                                           |
                    +--------v--------+                         +--------v--------+
                    |    products     |                         |    purchases    |
                    +--------+--------+                         +--------+--------+
                             | 1:N                                       | 1:N
                    +--------v--------+                         +--------v--------+
                    | product_variants|                         | purchase_items  |
                    +---+----------+--+                         +-----------------+
                        |          |
                        | 1:N      +---------------------------------+
                        |                                            |
               +--------v--------+                                   |
               |   order_items   |                                   |
               +--------^--------+                                   |
                        | 1:N                                        |
               +--------+--------+                                   |
               |     orders      | <--- 1:N ---> [ payments ]        |
               +--------^--------+                                   |
                        | 1:N                                        |
               +--------+--------+                                   |
               |    customers    |                                   |
               +-----------------+                                   |
                                                                     |
               +-----------------+                                   |
               |  inventory_logs | <---------------------------------+
               +-----------------+
```

### Table Breakdown

1. **`users`**: User account credentials, email verification status, password hash, role (`admin`, `manager`, `sales`, `user`), active/banned status.
2. **`customers`**: Customer profiles identified by phone number, name, email, and address.
3. **`categories`**: Product categories with hierarchical self-referencing `parent_id`, slug, and Cloudinary image details.
4. **`brands`**: Brand entries with logo, description, and status.
5. **`products`**: Core product entries linked to category and brand.
6. **`product_variants`**: Specific SKUs holding barcodes, cost price (`purchase_price`), retail/sale price, discount price, wholesale price, dealer price, unit, weight, and individual stock counts.
7. **`suppliers`**: Supplier contact and company directory.
8. **`purchases`**: Supplier purchase invoices tracking total amounts, extra discount, payment status, and transaction references.
9. **`purchase_items`**: Line items per purchase invoice.
10. **`purchase_payments`**: Partial or full payment logs towards purchase invoices.
11. **`public.orders`**: Sales orders containing shipping address, courier info (`courier_name`, `courier_tracking_id`), order status, subtotal, discount, delivery charge, grand total, due amount, and payment type (`cod`, `prepaid`).
12. **`order_items`**: Individual items ordered with captured unit price.
13. **`public.payments`**: Payment transaction logs for sales orders.
14. **`inventory_logs`**: Audit logs recording stock updates (`purchase`, `sale`, `adjustment`, `return`).
15. **`refunds`**: Order refund claims and approval states.
16. **`reviews`**: Product ratings (1-5 stars) and review comments.
17. **`contacts` & `contact_replies`**: Public contact form messages and staff replies.
18. **`supports` & `support_messages`**: Support ticket threads.
19. **`issues` & `issues_view`**: Internal communications between staff members.
20. **`websites`**: Global site settings (branding, hero text, contact info).

---

## 📡 API Route Specification

### Authentication & User Management (`/api/user`)
- `GET /api/user` - Fetch authenticated user session.
- `POST /api/user` - User account registration (triggers Brevo email verification).
- `PUT /api/user` - Update user profile information.
- `POST /api/user/login` - Authenticate credentials and issue `ecom_token` cookie.
- `POST /api/user/logout` - Clear session token cookie.
- `GET /api/user/verify-account` - Verify token from email registration link.
- `POST /api/user/recover-account` - Request password reset link.

### Catalog Management (`/api/product`, `/api/category`, `/api/brand`)
- `GET /api/product` - List products with total variant stock calculations and optional category filters.
- `POST /api/product` - [Manager/Admin] Create product with multi-variant configuration, image uploads, and barcode generation.
- `GET /api/product/[slug]` - Retrieve detailed product info with variants and category breadcrumbs.
- `PUT /api/product/[slug]` - [Manager/Admin] Update product or variant details.
- `DELETE /api/product/[slug]` - [Manager/Admin] Remove product and associated images.
- `GET /api/category` - Retrieve categories list / tree structure.
- `POST /api/category` - [Manager/Admin] Add new parent category or subcategory.
- `GET /api/brand` - List active store brands.

### Sales & POS Operations (`/api/sale`)
- `GET /api/sale` - Fetch orders list with status filtering.
- `POST /api/sale` - Create POS transaction or customer checkout order.
- `GET /api/sale/[orderId]` - Fetch specific order details and line items.
- `PUT /api/sale/[orderId]` - Update order status (triggers stock deduction/restock logic and delivery payments).
- `GET /api/sale/history` - Fetch customer or store order history.
- `GET /api/sale/payments` - Retrieve sales payment transactions ledger.

### Purchasing & Suppliers (`/api/purchase`, `/api/supplier`)
- `GET /api/purchase` - [Manager/Admin] List purchase receiving invoices.
- `POST /api/purchase` - [Manager/Admin] Receive purchase order, increment variant stock, and log inventory transaction.
- `POST /api/purchase/[id]/payment` - [Manager/Admin] Record payment to supplier against purchase invoice.
- `GET/POST /api/supplier` - Supplier directory endpoints.

### Customer Management & Reports (`/api/customer`, `/api/people`, `/api/report`)
- `GET /api/customer` - List customer registry with spending metrics.
- `GET /api/people` - [Admin] Staff account directory listing.
- `PUT /api/people/[id]` - [Admin] Update user role, toggle active state, or ban/unban user.
- `GET /api/report/export?type={type}` - [Manager/Admin] Export Excel reports (`sales`, `products`, `purchases`, `customers`, `payments`).
- `GET /api/dashboard/stats` - Consolidated metrics overview for staff dashboard.

### Support, Contact & Communications (`/api/support`, `/api/contact`, `/api/issue`)
- `GET/POST /api/support` - Customer support ticket creation and retrieval.
- `POST /api/support/[id]/message` - Append reply to support ticket thread.
- `GET/POST /api/contact` - General web inquiry handler and staff replies.
- `GET/POST /api/issue` - Staff internal communication ticketing.
- `GET/PUT /api/settings` - Storefront branding, hero section text, and store contact info.

---

## 📁 Directory & File Layout

```
ecom/
├── schema.psql                # Full PostgreSQL database schema definition
├── db_migrate.js              # Database table migration & alter script
├── next.config.mjs            # Next.js configuration
├── package.json               # Node.js dependencies & scripts
├── src/
│   ├── proxy.js               # Route protection middleware
│   ├── lib/
│   │   ├── auth.js            # Authentication & RBAC helper routines
│   │   ├── db.js              # PostgreSQL pool connection instance
│   │   ├── secret.js          # Centralized environment variable exports
│   │   ├── cloudinary.js      # Cloudinary file upload & deletion SDK
│   │   ├── mailer.js          # Brevo SMTP email transmission module
│   │   ├── barcode.js         # Sequential unique barcode generator
│   │   └── printreceipt.js    # Formatted printable receipt window generator
│   ├── component/
│   │   ├── bars/              # Navigation bars, Sidebars, Cart drawer, Footers
│   │   ├── cards/             # Product grid cards, Review widgets
│   │   ├── forms/             # Registration, Login, Contact forms
│   │   ├── manager/           # Form modals for Products, Categories, Brands, Suppliers
│   │   ├── pages/             # Storefront section views (Hero, Top Sales, Reviews)
│   │   └── helper/            # Context provider, Barcode Scanner, TipTap Editor
│   └── app/
│       ├── (home)/            # Public storefront pages (Products, Checkout, Track Order)
│       ├── (user)/            # Customer user portal (/user)
│       ├── (dashboard)/       # Role-protected dashboard routes
│       │   └── dashboard/
│       │       ├── admin/     # Admin management & system configuration
│       │       ├── manager/   # Product, inventory, supplier & stock control
│       │       └── sales/     # POS console & live sales processing
│       └── api/               # 40+ REST API endpoints
```

---

## 🔑 Environment Variables

Create a `.env` file in the project root directory with the following configurations:

```env
# Database Credentials (PostgreSQL)
PG_HOST=localhost
PG_PORT=5432
PG_USER=your_pg_user
PG_PASSWORD=your_pg_password
PG_DB=ecom_db

# Security & JWT Token
JWT_SECRET=super_secret_jwt_key_here
NEXT_PUBLIC_API_URL=http://localhost:3000

# Cloudinary Storage Configuration
CLOUDINARY_NAME=your_cloud_name
CLOUDINARY_API=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Email Service (Brevo SMTP API)
BREVO_API_KEY=your_brevo_api_key
BREVO_SENDER_EMAIL=noreply@yourdomain.com
BREVO_SENDER_NAME="Ecom Storefront"
```

---

## 🛠️ Installation & Setup

### 1. Repository Setup
```bash
git clone https://github.com/tanvirahmmed2/ecom.git
cd ecom
npm install
```

### 2. Database Initialization
1. Ensure your PostgreSQL database server is running.
2. Execute `schema.psql` against your PostgreSQL target database:
   ```bash
   psql -h localhost -U your_pg_user -d ecom_db -f schema.psql
   ```
3. Run the migration script to apply latest schema alters and views:
   ```bash
   node db_migrate.js
   ```

### 3. Running Locally
Start the Next.js development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Production Build
```bash
npm run build
npm start
```
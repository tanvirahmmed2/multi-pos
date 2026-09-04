'use client'
import React, { useContext } from 'react'
import Link from 'next/link'
import { Context } from '@/component/helper/Context'
import { ROLE_PERMISSIONS } from '../layout'
import { 
  BiCart,
  BiTime,
  BiCheckCircle,
  BiDollarCircle,
  BiHistory,
  BiMessageSquareDetail,
  BiChevronRight,
  BiLoaderAlt,
  BiSolidTruck,
  BiUndo,
  BiHome,
  BiStoreAlt,
  BiUser,
  BiCategory,
  BiTag,
  BiPackage,
  BiFile,
  BiCloudDownload,
  BiCog,
  BiUserVoice,
  BiListUl,
  BiShieldQuarter,
  BiGridAlt
} from 'react-icons/bi'

const ROLE_TITLES = {
  admin: 'Administrator Console',
  manager: 'Manager Console',
  sales: 'Sales Desk Console',
  staff: 'Staff Console'
}

const ROLE_CENTER_NAMES = {
  admin: 'Administrator Navigation Center',
  manager: 'Manager Navigation Center',
  sales: 'Sales Agent Navigation Center',
  staff: 'Staff Navigation Center'
}

const ALL_MODULE_CARDS = {
  balance: {
    key: 'balance',
    name: 'Balance Management',
    description: 'View current available balance, total income/expenses breakdown, and manage manual deposits.',
    path: '/dashboard/balance',
    icon: <BiDollarCircle />
  },
  overview: {
    key: 'overview',
    name: 'System Overview',
    description: 'View real-time analytics, overall revenue statistics, order metrics, and business summaries.',
    path: '/dashboard/overview',
    icon: <BiHome />
  },
  branches: {
    key: 'branches',
    name: 'Branch Outlets',
    description: 'Manage store branches, outlet locations, contact info, and operational settings.',
    path: '/dashboard/branches',
    icon: <BiStoreAlt />
  },
  people: {
    key: 'people',
    name: 'People & Accounts',
    description: 'Manage staff user accounts, role assignments, access permissions, and user profiles.',
    path: '/dashboard/people',
    icon: <BiUser />
  },
  category: {
    key: 'category',
    name: 'Product Categories',
    description: 'Organize catalog categories, sub-categories, taxonomies, and visual site groups.',
    path: '/dashboard/category',
    icon: <BiCategory />
  },
  brands: {
    key: 'brands',
    name: 'Brands & Manufacturers',
    description: 'Manage product brand lists, manufacturer details, logos, and vendor affiliations.',
    path: '/dashboard/brands',
    icon: <BiTag />
  },
  product: {
    key: 'product',
    name: 'Products Catalog',
    description: 'Create and update products, manage pricing, inventory SKUs, and product assets.',
    path: '/dashboard/product',
    icon: <BiPackage />
  },
  stock: {
    key: 'stock',
    name: 'Stock & Inventory',
    description: 'Monitor stock levels, low inventory warnings, reorder thresholds, and adjustments.',
    path: '/dashboard/stock',
    icon: <BiPackage />
  },
  purchase: {
    key: 'purchase',
    name: 'Purchases & Procurement',
    description: 'Create purchase orders, track inbound inventory shipments, and vendor invoices.',
    path: '/dashboard/purchase',
    icon: <BiDollarCircle />
  },
  supplier: {
    key: 'supplier',
    name: 'Suppliers Directory',
    description: 'Manage vendor contacts, supplier profiles, purchase terms, and supply contracts.',
    path: '/dashboard/supplier',
    icon: <BiStoreAlt />
  },
  customers: {
    key: 'customers',
    name: 'Customer Directory',
    description: 'View registered customer profiles, purchase history, loyalty metrics, and contacts.',
    path: '/dashboard/customers',
    icon: <BiUser />
  },
  support: {
    key: 'support',
    name: 'Support Tickets',
    description: 'Handle customer helpdesk tickets, customer service requests, and issue logs.',
    path: '/dashboard/support',
    icon: <BiMessageSquareDetail />
  },
  contact: {
    key: 'contact',
    name: 'Contact Messages',
    description: 'Review web contact form submissions, customer inquiries, and lead communications.',
    path: '/dashboard/contact',
    icon: <BiMessageSquareDetail />
  },
  reviews: {
    key: 'reviews',
    name: 'Customer Reviews',
    description: 'Moderate product ratings, customer feedback, and store experience reviews.',
    path: '/dashboard/reviews',
    icon: <BiUserVoice />
  },
  payments: {
    key: 'payments',
    name: 'Register Payments',
    description: 'Post direct cash collections, mobile banking payments, and invoice receipts.',
    path: '/dashboard/payments',
    icon: <BiDollarCircle />
  },
  return: {
    key: 'return',
    name: 'Returns & Refunds',
    description: 'Process product returns, restock inventory items, and log customer refunds.',
    path: '/dashboard/return',
    icon: <BiUndo />
  },
  report: {
    key: 'report',
    name: 'Reports & Analytics',
    description: 'Generate comprehensive financial, sales performance, and operational reports.',
    path: '/dashboard/report',
    icon: <BiFile />
  },
  backup: {
    key: 'backup',
    name: 'System Backups',
    description: 'Export database snapshots, system data archives, and recovery backups.',
    path: '/dashboard/backup',
    icon: <BiCloudDownload />
  },
  settings: {
    key: 'settings',
    name: 'Platform Settings',
    description: 'Configure store parameters, tax policies, payment methods, and system preferences.',
    path: '/dashboard/settings',
    icon: <BiCog />
  },
  sale: {
    key: 'sale',
    name: 'Create Invoice Sale',
    description: 'Generate new POS checkouts, assign customer cards, and register transactions.',
    path: '/dashboard/sale',
    icon: <BiCart />
  },
  'pending-sale': {
    key: 'pending-sale',
    name: 'Pending Sales Orders',
    description: 'Review cash-on-delivery orders waiting for dispatch confirmation or payments.',
    path: '/dashboard/pending-sale',
    icon: <BiTime />
  },
  'confirmed-sale': {
    key: 'confirmed-sale',
    name: 'Confirmed Orders',
    description: 'Review and process confirmed orders, dispatch for delivery, or fulfill directly.',
    path: '/dashboard/confirmed-sale',
    icon: <BiCheckCircle />
  },
  out_for_delivery: {
    key: 'out_for_delivery',
    name: 'Out for Delivery',
    description: 'Manage orders currently with couriers. Update delivery status or process returns.',
    path: '/dashboard/out_for_delivery',
    icon: <BiSolidTruck />
  },
  'completed-sale': {
    key: 'completed-sale',
    name: 'Completed Orders',
    description: 'Track finalized invoices, transaction receipts, and order histories.',
    path: '/dashboard/completed-sale',
    icon: <BiCheckCircle />
  },
  'returned-sale': {
    key: 'returned-sale',
    name: 'Returned Orders',
    description: 'Review returned sales orders where products were restocked and order amounts set to zero.',
    path: '/dashboard/returned-sale',
    icon: <BiUndo />
  },
  history: {
    key: 'history',
    name: 'My Sales History',
    description: 'Check personal checkouts ledger history and transaction logs.',
    path: '/dashboard/history',
    icon: <BiHistory />
  },
  issue: {
    key: 'issue',
    name: 'Report Technical Issue',
    description: 'Submit issue tickets, system bugs, or catalog reports to management board.',
    path: '/dashboard/issue',
    icon: <BiMessageSquareDetail />
  },
  profile: {
    key: 'profile',
    name: 'My Account Profile',
    description: 'View and update personal profile, security details, and staff credentials.',
    path: '/dashboard/profile',
    icon: <BiUser />
  },
  orders: {
    key: 'orders',
    name: 'Order Management',
    description: 'Browse, filter, and track all incoming customer order statuses and updates.',
    path: '/dashboard/orders',
    icon: <BiListUl />
  },
  'activity-logs': {
    key: 'activity-logs',
    name: 'Login & Activity Logs',
    description: 'Audit system login history, staff access logs, client IP addresses, and device user-agents.',
    path: '/dashboard/activity-logs',
    icon: <BiShieldQuarter />
  },
  investor: {
    key: 'investor',
    name: 'Investors Management',
    description: 'Manage capital investors, funding profiles, contact details, and account statuses.',
    path: '/dashboard/investor',
    icon: <BiUser />
  },
  investments: {
    key: 'investments',
    name: 'Investments System',
    description: 'Record capital injections, bank transfers, and investor equity additions.',
    path: '/dashboard/investments',
    icon: <BiDollarCircle />
  },
  withdrawals: {
    key: 'withdrawals',
    name: 'Capital Withdrawals',
    description: 'Track money withdrawals, profit distributions, and capital returns.',
    path: '/dashboard/withdrawals',
    icon: <BiUndo />
  },
  profits: {
    key: 'profits',
    name: 'Investor Profits',
    description: 'Manage daily gross profit allocations based on equity share percentages.',
    path: '/dashboard/profits',
    icon: <BiDollarCircle />
  },
  salaries: {
    key: 'salaries',
    name: 'Salary Structures',
    description: 'Configure grade structures, base salary levels, allowances, and deductions.',
    path: '/dashboard/salaries',
    icon: <BiDollarCircle />
  },
  'staff-salaries': {
    key: 'staff-salaries',
    name: 'Staff Salary Assignments',
    description: 'Assign salary structures to staff members and manage effective dates.',
    path: '/dashboard/staff-salaries',
    icon: <BiUser />
  },
  'salary-payments': {
    key: 'salary-payments',
    name: 'Salary Payments Management',
    description: 'Disburse staff salaries, generate monthly payroll entries, and record payments.',
    path: '/dashboard/salary-payments',
    icon: <BiFile />
  },
  'my-salary': {
    key: 'my-salary',
    name: 'My Salary & Payments',
    description: 'View your assigned salary structure, allowance breakdown, and payment history.',
    path: '/dashboard/my-salary',
    icon: <BiDollarCircle />
  }
}

export default function DashboardModulesPage() {
  const { user, loading, dashSidebar, logout } = useContext(Context)

  if (loading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-2">
          <BiLoaderAlt className="animate-spin text-4xl text-slate-800" />
          <p className="text-slate-600 text-sm font-semibold animate-pulse">Loading module center...</p>
        </div>
      </div>
    )
  }

  const role = user?.role || 'staff'
  const allowedKeys = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.staff
  const centerName = ROLE_CENTER_NAMES[role] || 'Staff Navigation Center'

  const moduleCards = allowedKeys
    .map(key => ALL_MODULE_CARDS[key])
    .filter(Boolean)

  return (
    <div className={`w-full min-h-screen bg-slate-50 pt-20 pb-12 px-4 md:px-8 transition-all duration-300 ${dashSidebar ? 'lg:pl-64' : 'lg:pl-8'}`}>
      <div className="w-full flex flex-col gap-8">
        
        <div className="bg-white border border-slate-200 shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary text-white flex items-center justify-center text-2xl font-bold">
              <BiGridAlt />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                Module Navigation Center
              </h1>
              <p className="text-xs text-slate-500 font-mono mt-0.5">{user?.name || 'Staff'} ({user?.role?.toUpperCase()})</p>
            </div>
          </div>

          <div className="flex flex-col gap-1 border-t md:border-t-0 md:border-l border-slate-200 pt-4 md:pt-0 md:pl-6 text-xs text-slate-500 font-medium">
            <div><span className="font-bold text-slate-700">Email:</span> {user?.email || 'N/A'}</div>
            <div><span className="font-bold text-slate-700">Phone:</span> {user?.phone || 'N/A'}</div>
            <button 
              onClick={() => logout()}
              className="mt-2 text-xs font-bold text-rose-600 hover:underline text-left cursor-pointer"
            >
              Logout Session
            </button>
          </div>
        </div>

        <div>
          <h2 className="text-base font-bold text-slate-800 mb-6">{centerName}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {moduleCards.map((link) => (
              <div 
                key={link.key}
                className="bg-white border border-slate-200 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition group"
              >
                <div>
                  <div className="w-10 h-10 flex items-center justify-center text-xl mb-4 text-white font-bold bg-primary">
                    {link.icon}
                  </div>
                  <h3 className="font-bold text-slate-800 text-base">{link.name}</h3>
                  <p className="text-slate-500 text-xs mt-2 leading-relaxed">
                    {link.description}
                  </p>
                </div>
                
                <Link 
                  href={link.path} 
                  className="mt-6 flex items-center gap-1.5 font-bold text-xs hover:gap-2.5 transition-all text-primary"
                >
                  Access Module <BiChevronRight className="text-base" />
                </Link>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}

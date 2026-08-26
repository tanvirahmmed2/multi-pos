'use client'
import React, { useContext, useEffect, useState } from 'react'
import Link from 'next/link'
import axios from 'axios'
import { Context } from '@/component/helper/Context'
import { 
  BiCategory, 
  BiTag, 
  BiPackage, 
  BiDollarCircle,
  BiMessageSquareDetail,
  BiStoreAlt,
  BiUser,
  BiSupport,
  BiEnvelope,
  BiArrowBack,
  BiFile,
  BiHome,
  BiChevronRight,
  BiLoaderAlt,
  BiShieldQuarter
} from 'react-icons/bi'

export default function DashboardManagerPage() {
  const { dashSidebar, user, loading: userLoading, logout, website } = useContext(Context)
  const themeColor = website?.theme_color || '#73976A'
  const [stats, setStats] = useState({ categories: 0, brands: 0, products: 0 })
  const [statsLoading, setStatsLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get('/api/dashboard/stats')
        setStats(res.data)
      } catch (err) {
        console.error("Failed to fetch dashboard stats", err)
      } finally {
        setStatsLoading(false)
      }
    }
    fetchStats()
  }, [])

  if (userLoading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-2">
          <BiLoaderAlt className="animate-spin text-4xl text-slate-800" />
          <p className="text-slate-600 text-sm font-semibold animate-pulse">Loading manager dashboard...</p>
        </div>
      </div>
    )
  }

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : 'MN'

  const managerLinks = [
    {
      name: 'Overview Dashboard',
      description: "Analyze key sales trends, inventory valuations, and order volumes.",
      path: '/dashboard/manager/overview',
      icon: <BiHome />
    },
    {
      name: 'Categories Catalog',
      description: "Manage classification groups, add nesting, and upload category banners.",
      path: '/dashboard/manager/category',
      icon: <BiCategory />
    },
    {
      name: 'Brands Catalog',
      description: "Define manufacturer names, upload logos, and toggle active status.",
      path: '/dashboard/manager/brands',
      icon: <BiTag />
    },
    {
      name: 'Products Catalog',
      description: "Update pricing tiers, define product variants, images, and description details.",
      path: '/dashboard/manager/product',
      icon: <BiPackage />
    },
    {
      name: 'Issues Logbook',
      description: "Submit and review internal announcements and team reports.",
      path: '/dashboard/manager/issues',
      icon: <BiMessageSquareDetail />
    },
    {
      name: 'Purchases Desk',
      description: "Manage vendor purchases, create orders, and check invoices.",
      path: '/dashboard/manager/purchase',
      icon: <BiDollarCircle />
    },
    {
      name: 'Sales Ledger',
      description: "Review client order checkouts, confirm transactions, and track shipping.",
      path: '/dashboard/manager/sales',
      icon: <BiDollarCircle />
    },
    {
      name: 'Stock Valuations',
      description: "Audit item transactions, inventory log entries, and adjust units.",
      path: '/dashboard/manager/stock',
      icon: <BiPackage />
    },
    {
      name: 'Suppliers Catalog',
      description: "Register wholesale supply contacts, companies, and billing details.",
      path: '/dashboard/manager/supplier',
      icon: <BiStoreAlt />
    },
    {
      name: 'Customers Registry',
      description: "Review customer logs, account activities, and address checklists.",
      path: '/dashboard/manager/customers',
      icon: <BiUser />
    },
    {
      name: 'Support Tickets',
      description: "Access customer support inquiries, reply to tickets, and update status.",
      path: '/dashboard/manager/support',
      icon: <BiSupport />
    },
    {
      name: 'Contact Messages',
      description: "Inspect generic queries, write responses, and send client email updates.",
      path: '/dashboard/manager/contact',
      icon: <BiEnvelope />
    },
    {
      name: 'Reviews Moderation',
      description: "Approve customer product feedback and reviews or reject inappropriate posts.",
      path: '/dashboard/manager/reviews',
      icon: <BiSupport />
    },
    {
      name: 'Payments Audit',
      description: "Audit order invoices, transaction numbers, and due balances.",
      path: '/dashboard/manager/payments',
      icon: <BiDollarCircle />
    },
    {
      name: 'Returns & Refunds',
      description: "Track return logs, log damage assessments, and approve cash refunds.",
      path: '/dashboard/manager/return',
      icon: <BiArrowBack />
    },
    {
      name: 'Reports Center',
      description: "Generate sales taxesheets, stock audits, and performance records.",
      path: '/dashboard/manager/report',
      icon: <BiFile />
    }
  ]

  return (
    <div className={`w-full min-h-screen bg-slate-50 pt-20 pb-12 px-4 md:px-8 transition-all duration-300 ${dashSidebar ? 'lg:pl-68' : 'lg:pl-8'}`}>
      <div className="max-w-6xl mx-auto flex flex-col gap-8">
        
        {/* Profile Card Banner */}
        <div className="bg-white border border-slate-200 shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-slate-900 text-white text-xl font-bold flex items-center justify-center shadow-sm">
              {initials}
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">{user.name}</h1>
              <p className="text-xs text-slate-500 font-mono mt-0.5">{user.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="px-2.5 py-0.5 text-xxs font-bold uppercase border" style={{ color: themeColor, borderColor: themeColor + '40', backgroundColor: themeColor + '10' }}>
                  Manager Dashboard
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1 border-t md:border-t-0 md:border-l border-slate-200 pt-4 md:pt-0 md:pl-6 text-xs text-slate-500 font-medium">
            <div><span className="font-bold text-slate-700">Phone:</span> {user.phone || 'N/A'}</div>
            <div className="mt-1"><span className="font-bold text-slate-700">Member Since:</span> {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</div>
            <button 
              onClick={() => logout()}
              className="mt-3 text-left font-bold text-rose-600 hover:underline cursor-pointer"
            >
              Sign Out Account
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Categories Card */}
          <div className="bg-white p-6 border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition">
            <div className="flex flex-col gap-1">
              <span className="text-slate-500 text-sm font-medium">Total Categories</span>
              <span className="text-3xl font-bold text-slate-800">
                {statsLoading ? <span className="animate-pulse">...</span> : stats.categories}
              </span>
            </div>
            <div className="w-12 h-12 text-white flex items-center justify-center text-2xl font-bold" style={{ backgroundColor: themeColor }}>
              <BiCategory />
            </div>
          </div>

          {/* Brands Card */}
          <div className="bg-white p-6 border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition">
            <div className="flex flex-col gap-1">
              <span className="text-slate-500 text-sm font-medium">Total Brands</span>
              <span className="text-3xl font-bold text-slate-800">
                {statsLoading ? <span className="animate-pulse">...</span> : stats.brands}
              </span>
            </div>
            <div className="w-12 h-12 text-white flex items-center justify-center text-2xl font-bold" style={{ backgroundColor: themeColor }}>
              <BiTag />
            </div>
          </div>

          {/* Products Card */}
          <div className="bg-white p-6 border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition">
            <div className="flex flex-col gap-1">
              <span className="text-slate-500 text-sm font-medium">Total Products</span>
              <span className="text-3xl font-bold text-slate-800">
                {statsLoading ? <span className="animate-pulse">...</span> : stats.products}
              </span>
            </div>
            <div className="w-12 h-12 text-white flex items-center justify-center text-2xl font-bold" style={{ backgroundColor: themeColor }}>
              <BiPackage />
            </div>
          </div>
        </div>

        {/* Manager Links */}
        <div>
          <h2 className="text-base font-bold text-slate-800 mb-6">Manager Navigation Center</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {managerLinks.map((link) => (
              <div 
                key={link.path}
                className="bg-white border border-slate-200 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition group"
              >
                <div>
                  <div className="w-10 h-10 flex items-center justify-center text-xl mb-4 text-white font-bold" style={{ backgroundColor: themeColor }}>
                    {link.icon}
                  </div>
                  <h3 className="font-bold text-slate-800 text-base">{link.name}</h3>
                  <p className="text-slate-500 text-xs mt-2 leading-relaxed">
                    {link.description}
                  </p>
                </div>
                
                <Link 
                  href={link.path} 
                  className="mt-6 flex items-center gap-1.5 font-bold text-xs hover:gap-2.5 transition-all"
                  style={{ color: themeColor }}
                >
                  Manage Module <BiChevronRight className="text-base" />
                </Link>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}


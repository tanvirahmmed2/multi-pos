'use client'
import React, { useContext } from 'react'
import Link from 'next/link'
import { Context } from '@/component/helper/Context'
import { 
  BiHome,
  BiUser,
  BiDollarCircle,
  BiPackage,
  BiUserVoice,
  BiMessageSquareDetail,
  BiFile,
  BiCog,
  BiChevronRight,
  BiShieldQuarter,
  BiLoaderAlt
} from 'react-icons/bi'

export default function DashboardAdminPage() {
  const { user, loading, dashSidebar, logout, website } = useContext(Context)
  const themeColor = website?.theme_color || '#73976A'

  if (loading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-2">
          <BiLoaderAlt className="animate-spin text-4xl text-slate-800" />
          <p className="text-slate-600 text-sm font-semibold animate-pulse">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : 'AD'

  const adminLinks = [
    {
      name: 'Overview stats',
      description: "Monitor catalog indicators, transaction counts, and store performance trends.",
      path: '/dashboard/admin/overview',
      icon: <BiHome />
    },
    {
      name: 'People (Accounts)',
      description: "Manage system credentials. Deactivate or ban accounts and configure role levels.",
      path: '/dashboard/admin/people',
      icon: <BiUser />
    },
    {
      name: 'Sales Ledger',
      description: "Review comprehensive sales records, receipts, and order statuses.",
      path: '/dashboard/admin/sales',
      icon: <BiDollarCircle />
    },
    {
      name: 'Stock Inventory',
      description: "Track inventory, log adjustments, and identify low stock levels.",
      path: '/dashboard/admin/stock',
      icon: <BiPackage />
    },
    {
      name: 'Payments Audit',
      description: "Inspect customer transaction invoices, processing logs, and payment receipts.",
      path: '/dashboard/admin/payments',
      icon: <BiDollarCircle />
    },
    {
      name: 'User Reviews',
      description: "Inspect customer reviews, check scores, and update approval status.",
      path: '/dashboard/admin/reviews',
      icon: <BiUserVoice />
    },
    {
      name: 'Issue Log Logbook',
      description: "Review logs, technical errors, and messages submitted by store staff.",
      path: '/dashboard/admin/issue',
      icon: <BiMessageSquareDetail />
    },
    {
      name: 'Analytics Reports',
      description: "Generate sales tax sheets, stock checklists, and business summaries.",
      path: '/dashboard/admin/report',
      icon: <BiFile />
    },
    {
      name: 'Global Settings',
      description: "Update store banner texts, logo, contact points, and theme colors.",
      path: '/dashboard/admin/settings',
      icon: <BiCog />
    }
  ]

  return (
    <div className={`w-full min-h-screen bg-slate-50 pt-20 pb-12 px-4 md:px-8 transition-all duration-300 ${dashSidebar ? 'lg:pl-64' : 'lg:pl-8'}`}>
      <div className="w-full max-w-6xl mx-auto flex flex-col gap-6 md:gap-8">
        
        {/* Profile Card Banner */}
        <div className="bg-white border border-slate-200 shadow-sm p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 md:w-16 md:h-16 bg-slate-900 text-white text-lg md:text-xl font-bold flex items-center justify-center shadow-sm shrink-0">
              {initials}
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold text-slate-800">{user?.name}</h1>
              <p className="text-xs text-slate-500 font-mono mt-0.5">{user?.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="px-2.5 py-0.5 text-[10px] md:text-xs font-bold uppercase border" style={{ color: themeColor, borderColor: themeColor + '40', backgroundColor: themeColor + '10' }}>
                  Administrator Console
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1 border-t md:border-t-0 md:border-l border-slate-200 pt-4 md:pt-0 md:pl-6 text-xs text-slate-600 font-medium">
            <div><span className="font-bold text-slate-800">Phone:</span> {user?.phone || 'N/A'}</div>
            <div className="mt-1"><span className="font-bold text-slate-800">Member Since:</span> {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</div>
            <button 
              onClick={() => logout()}
              className="mt-3 text-left font-bold text-rose-600 hover:underline cursor-pointer"
            >
              Sign Out Account
            </button>
          </div>
        </div>

        {/* Available Modules */}
        <div>
          <h2 className="text-base font-bold text-slate-800 mb-4 md:mb-6">Administrator Navigation Center</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {adminLinks.map((link) => (
              <div 
                key={link.path}
                className="bg-white border border-slate-200 shadow-sm p-5 md:p-6 flex flex-col justify-between hover:shadow-md transition group"
              >
                <div>
                  <div className="w-10 h-10 flex items-center justify-center text-xl mb-4 text-white font-bold" style={{ backgroundColor: themeColor }}>
                    {link.icon}
                  </div>
                  <h3 className="font-bold text-slate-800 text-sm md:text-base transition-colors">{link.name}</h3>
                  <p className="text-slate-500 text-xs mt-2 leading-relaxed">
                    {link.description}
                  </p>
                </div>
                
                <Link 
                  href={link.path} 
                  className="mt-6 flex items-center gap-1.5 font-bold text-xs hover:gap-2.5 transition-all"
                  style={{ color: themeColor }}
                >
                  Configure Module <BiChevronRight className="text-base" />
                </Link>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}



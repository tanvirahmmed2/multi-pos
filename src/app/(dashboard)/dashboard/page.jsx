'use client'
import React, { useContext } from 'react'
import Link from 'next/link'
import { Context } from '@/component/helper/Context'
import { 
  BiCart,
  BiTime,
  BiCheckCircle,
  BiDollarCircle,
  BiHistory,
  BiMessageSquareDetail,
  BiChevronRight,
  BiShieldQuarter,
  BiLoaderAlt,
  BiSolidTruck,
  BiUndo
} from 'react-icons/bi'

export default function DashboardSalesPage() {
  const { user, loading, dashSidebar, logout, website } = useContext(Context)
  const themeColor = website?.theme_color || '#73976A'

  if (loading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-2">
          <BiLoaderAlt className="animate-spin text-4xl text-slate-800" />
          <p className="text-slate-600 text-sm font-semibold animate-pulse">Loading sales dashboard...</p>
        </div>
      </div>
    )
  }

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : 'SL'

  const salesLinks = [
    {
      name: 'Create Invoice Sale',
      description: "Generate new POS checkouts, assign customer cards, and register transactions.",
      path: '/dashboard/sale',
      icon: <BiCart />
    },
    {
      name: 'Pending Sales Order',
      description: "Review cash-on-delivery orders waiting for dispatch confirmation or payments.",
      path: '/dashboard/pending-sale',
      icon: <BiTime />
    },
    {
      name: 'Confirmed Orders',
      description: "Review and process confirmed orders, dispatch them for delivery, or deliver them directly.",
      path: '/dashboard/confirmed-sale',
      icon: <BiCheckCircle />
    },
    {
      name: 'Out for Delivery',
      description: "Manage orders currently with the courier. Update statuses to delivered or process returns.",
      path: '/dashboard/out_for_delivery',
      icon: <BiSolidTruck />
    },
    {
      name: 'Completed Orders',
      description: "Track finalized invoices, transaction receipts, and order histories.",
      path: '/dashboard/completed-sale',
      icon: <BiCheckCircle />
    },
    {
      name: 'Returned Orders',
      description: "Review returned sales orders where products were restocked and order amounts set to zero.",
      path: '/dashboard/returned-sale',
      icon: <BiUndo />
    },
    {
      name: 'Register Payments',
      description: "Post direct cash collections or mobile banking payments against invoices.",
      path: '/dashboard/payments',
      icon: <BiDollarCircle />
    },
    {
      name: 'My Sales History',
      description: "Check your personal checkouts ledger history and transaction logs.",
      path: '/dashboard/history',
      icon: <BiHistory />
    },
    {
      name: 'Report Technical Issue',
      description: "Submit issue tickets, system bugs, or catalog reports to the management board.",
      path: '/dashboard/issue',
      icon: <BiMessageSquareDetail />
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
                  Sales Desk Console
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

        {/* Available Modules */}
        <div>
          <h2 className="text-base font-bold text-slate-800 mb-6">Sales Agent Navigation Center</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {salesLinks.map((link) => (
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


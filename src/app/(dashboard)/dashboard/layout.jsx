'use client'
import React, { useContext } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Context } from '@/component/helper/Context'
import Navbar from '@/component/bars/Navbar'
import Sidebar from '@/component/bars/Sidebar'
import { BiShieldX, BiLoaderAlt, BiHome } from 'react-icons/bi'

export const ROLE_PERMISSIONS = {
  admin: [
    'branches', 'people', 'category', 'brands', 'product', 'stock',
    'purchase', 'supplier', 'customers', 'support', 'contact', 'reviews',
    'payments', 'return', 'report', 'backup', 'settings', 'sale',
    'pending-sale', 'confirmed-sale', 'out_for_delivery', 'completed-sale',
    'returned-sale', 'history', 'issue', 'profile', 'orders', 'overview', 'activity-logs', 'login-logs', 'investor', 'investments', 'withdrawls', 'withdrawals', 'salaries', 'staff-salaries', 'salary-payments', 'shares', 'expenses', 'profits'
  ],
  manager: [
    'sale', 'pending-sale', 'confirmed-sale', 'out_for_delivery',
    'completed-sale', 'returned-sale', 'payments', 'history', 'issue',
    'profile', 'orders', 'overview', 'purchase', 'return', 'stock', 'customers', 'activity-logs', 'login-logs', 'investor', 'investments', 'withdrawls', 'withdrawals', 'salaries', 'staff-salaries', 'salary-payments', 'expenses', 'profits'
  ],
  sales: [
    'sale', 'pending-sale', 'confirmed-sale', 'out_for_delivery',
    'completed-sale', 'returned-sale', 'payments', 'history', 'issue',
    'profile', 'orders', 'overview'
  ],
  staff: [
    'profile', 'issue', 'orders', 'overview'
  ]
}

export default function DashboardLayout({ children }) {
  const { user, loading } = useContext(Context)
  const pathname = usePathname()

  if (loading) {
    return (
      <div className="w-full min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-2">
        <BiLoaderAlt className="animate-spin text-4xl text-slate-800" />
        <p className="text-slate-600 text-sm font-semibold animate-pulse">Authenticating staff session...</p>
      </div>
    )
  }

  const segments = pathname.split('/').filter(Boolean)
  const moduleName = segments[1] 
  const role = user?.role || 'staff'
  const allowedModules = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.staff
  const isAllowed = !moduleName || moduleName === 'profile' || allowedModules.includes(moduleName)

  return (
    <>
      <Navbar />
      <Sidebar />
      {!isAllowed ? (
        <div className="w-full min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4 pt-20">
          <div className="bg-white border border-slate-200 shadow-xl rounded-3xl p-8 max-w-md w-full text-center flex flex-col items-center gap-4 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center text-3xl font-bold border border-rose-100">
              <BiShieldX />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Access Restricted</h2>
              <p className="text-slate-500 text-xs mt-1.5 leading-relaxed">
                Your staff role (<span className="font-bold uppercase text-slate-800">{role}</span>) does not have authorization to access the <span className="font-bold text-slate-800">/{moduleName}</span> console.
              </p>
            </div>
            <Link
              href="/dashboard"
              className="mt-2 px-6 py-2.5 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer bg-primary hover:bg-primary-dark"
            >
              <BiHome className="text-base" /> Return to Dashboard
            </Link>
          </div>
        </div>
      ) : (
        children
      )}
    </>
  )
}

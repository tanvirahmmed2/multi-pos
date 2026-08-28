'use client'
import React, { useContext } from 'react'
import { Context } from '../helper/Context'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ROLE_PERMISSIONS } from '@/app/(dashboard)/dashboard/layout'
import { 
  BiCategory, 
  BiTag, 
  BiPackage, 
  BiMessageSquareDetail, 
  BiLogOut, 
  BiChevronRight,
  BiHome,
  BiUser,
  BiDollarCircle,
  BiFile,
  BiCog,
  BiUserVoice,
  BiCart,
  BiHistory,
  BiTime,
  BiCheckCircle,
  BiStoreAlt,
  BiSolidTruck,
  BiCloudDownload,
  BiListUl,
  BiUndo,
  BiShieldQuarter,
  BiKey
} from 'react-icons/bi'

export const MODULE_LINKS = {
  overview: { name: 'Overview', path: '/dashboard/overview', icon: <BiHome /> },
  branches: { name: 'Branches', path: '/dashboard/branches', icon: <BiStoreAlt /> },
  people: { name: 'People (Accounts)', path: '/dashboard/people', icon: <BiUser /> },
  category: { name: 'Categories', path: '/dashboard/category', icon: <BiCategory /> },
  brands: { name: 'Brands', path: '/dashboard/brands', icon: <BiTag /> },
  product: { name: 'Products', path: '/dashboard/product', icon: <BiPackage /> },
  stock: { name: 'Stock', path: '/dashboard/stock', icon: <BiPackage /> },
  purchase: { name: 'Purchases', path: '/dashboard/purchase', icon: <BiDollarCircle /> },
  supplier: { name: 'Suppliers', path: '/dashboard/supplier', icon: <BiStoreAlt /> },
  customers: { name: 'Customers', path: '/dashboard/customers', icon: <BiUser /> },
  support: { name: 'Support Tickets', path: '/dashboard/support', icon: <BiMessageSquareDetail /> },
  contact: { name: 'Contact Messages', path: '/dashboard/contact', icon: <BiMessageSquareDetail /> },
  reviews: { name: 'Reviews', path: '/dashboard/reviews', icon: <BiUserVoice /> },
  payments: { name: 'Payments', path: '/dashboard/payments', icon: <BiDollarCircle /> },
  return: { name: 'Returns', path: '/dashboard/return', icon: <BiUndo /> },
  report: { name: 'Reports', path: '/dashboard/report', icon: <BiFile /> },
  backup: { name: 'Backup', path: '/dashboard/backup', icon: <BiCloudDownload /> },
  settings: { name: 'Settings', path: '/dashboard/settings', icon: <BiCog /> },
  sale: { name: 'Create Sale', path: '/dashboard/sale', icon: <BiCart /> },
  'pending-sale': { name: 'Pending Sales', path: '/dashboard/pending-sale', icon: <BiTime /> },
  'confirmed-sale': { name: 'Confirmed Sales', path: '/dashboard/confirmed-sale', icon: <BiCheckCircle /> },
  out_for_delivery: { name: 'Out for Delivery', path: '/dashboard/out_for_delivery', icon: <BiSolidTruck /> },
  'completed-sale': { name: 'Completed Sales', path: '/dashboard/completed-sale', icon: <BiCheckCircle /> },
  'returned-sale': { name: 'Returned Sales', path: '/dashboard/returned-sale', icon: <BiUndo /> },
  history: { name: 'History', path: '/dashboard/history', icon: <BiHistory /> },
  issue: { name: 'Report Issue', path: '/dashboard/issue', icon: <BiMessageSquareDetail /> },
  profile: { name: 'My Profile', path: '/dashboard/profile', icon: <BiUser /> },
  orders: { name: 'Orders', path: '/dashboard/orders', icon: <BiListUl /> },
  'activity-logs': { name: 'Activity Logs', path: '/dashboard/activity-logs', icon: <BiShieldQuarter /> },
  'login-logs': { name: 'Login Logs', path: '/dashboard/login-logs', icon: <BiKey /> },
  investor: { name: 'Investors', path: '/dashboard/investor', icon: <BiUser /> },
  investments: { name: 'Investments', path: '/dashboard/investments', icon: <BiDollarCircle /> },
  withdrawals: { name: 'Withdrawals', path: '/dashboard/withdrawals', icon: <BiUndo /> },
  salaries: { name: 'Salary Structures', path: '/dashboard/salaries', icon: <BiDollarCircle /> },
  'staff-salaries': { name: 'Staff Salaries', path: '/dashboard/staff-salaries', icon: <BiUser /> },
  'salary-payments': { name: 'Salary Payments', path: '/dashboard/salary-payments', icon: <BiFile /> }
}

const Sidebar = () => {
    const { dashSidebar, logout, user } = useContext(Context)
    const pathname = usePathname()

    const isActive = (path) => pathname === path || pathname.startsWith(path + '/')

    const role = user?.role || 'staff'
    const allowedKeys = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.staff
    const links = allowedKeys
      .map(key => MODULE_LINKS[key])
      .filter(Boolean)
      .sort((a, b) => a.name.localeCompare(b.name))

    return (
        <aside 
          className={`${dashSidebar ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out w-64 h-[calc(100vh-3.5rem)] fixed top-14 left-0 bg-primary text-white flex flex-col justify-between p-4 z-30 shadow-xl border-r border-black/10`}
        >
            
            <div className="w-full flex-1 flex flex-col gap-1.5 overflow-y-auto pr-1">
                {links.map((link) => {
                  const active = isActive(link.path)
                  return (
                    <Link 
                      key={link.path}
                      href={link.path} 
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                        active 
                          ? 'bg-black/25 text-white shadow-sm border border-white/30' 
                          : 'text-white/90 hover:bg-black/15 hover:text-white border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-base text-white">{link.icon}</span>
                        <span>{link.name}</span>
                      </div>
                      <BiChevronRight className={`text-xs transition ${active ? 'text-white translate-x-0.5' : 'text-white/60'}`} />
                    </Link>
                  )
                })}
            </div>

            <div className="w-full pt-3 mt-2 border-t border-white/20 flex flex-col gap-1.5 shrink-0">
                <button 
                  onClick={() => logout()} 
                  className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-left hover:bg-black/20 text-white/80 hover:text-white transition cursor-pointer"
                >
                    <BiLogOut className="text-base text-white" />
                    <span>Log out</span>
                </button>
            </div>

        </aside>
    )
}

export default Sidebar
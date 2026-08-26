'use client'
import React, { useContext } from 'react'
import { Context } from '../helper/Context'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
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
  BiArrowBack,
  BiTime,
  BiCheckCircle,
  BiStoreAlt,
  BiSolidTruck,
  BiCloudDownload
} from 'react-icons/bi'

const Sidebar = () => {
    const { dashSidebar, logout, user } = useContext(Context)
    const pathname = usePathname()

    const isActive = (path) => pathname === path || pathname.startsWith(path + '/')

    const adminLinks = [
      { name: 'Overview', path: '/dashboard/admin/overview', icon: <BiHome /> },
      { name: 'Branches', path: '/dashboard/admin/branches', icon: <BiStoreAlt /> },
      { name: 'People (Accounts)', path: '/dashboard/admin/people', icon: <BiUser /> },
      { name: 'Sales', path: '/dashboard/admin/sales', icon: <BiDollarCircle /> },
      { name: 'Stock', path: '/dashboard/admin/stock', icon: <BiPackage /> },
      { name: 'Payments', path: '/dashboard/admin/payments', icon: <BiDollarCircle /> },
      { name: 'Reviews', path: '/dashboard/admin/reviews', icon: <BiUserVoice /> },
      { name: 'Issue Log', path: '/dashboard/admin/issue', icon: <BiMessageSquareDetail /> },
      { name: 'Reports', path: '/dashboard/admin/report', icon: <BiFile /> },
      { name: 'Backup', path: '/dashboard/admin/backup', icon: <BiCloudDownload /> },
      { name: 'Settings', path: '/dashboard/admin/settings', icon: <BiCog /> },
      { name: 'My Profile', path: '/dashboard/profile', icon: <BiUser /> },
    ]

    const managerLinks = [
      { name: 'Overview', path: '/dashboard/manager/overview', icon: <BiHome /> },
      { name: 'Categories', path: '/dashboard/manager/category', icon: <BiCategory /> },
      { name: 'Brands', path: '/dashboard/manager/brands', icon: <BiTag /> },
      { name: 'Products', path: '/dashboard/manager/product', icon: <BiPackage /> },
      { name: 'Issues', path: '/dashboard/manager/issues', icon: <BiMessageSquareDetail /> },
      { name: 'Purchases', path: '/dashboard/manager/purchase', icon: <BiDollarCircle /> },
      { name: 'Sales', path: '/dashboard/manager/sales', icon: <BiDollarCircle /> },
      { name: 'Stock', path: '/dashboard/manager/stock', icon: <BiPackage /> },
      { name: 'Suppliers', path: '/dashboard/manager/supplier', icon: <BiStoreAlt /> },
      { name: 'Customers', path: '/dashboard/manager/customers', icon: <BiUser /> },
      { name: 'Support Tickets', path: '/dashboard/manager/support', icon: <BiMessageSquareDetail /> },
      { name: 'Contact Messages', path: '/dashboard/manager/contact', icon: <BiMessageSquareDetail /> },
      { name: 'Reviews', path: '/dashboard/manager/reviews', icon: <BiUserVoice /> },
      { name: 'Payments', path: '/dashboard/manager/payments', icon: <BiDollarCircle /> },
      { name: 'Returns', path: '/dashboard/manager/return', icon: <BiArrowBack /> },
      { name: 'Reports', path: '/dashboard/manager/report', icon: <BiFile /> },
      { name: 'My Profile', path: '/dashboard/profile', icon: <BiUser /> },
    ]

    const salesLinks = [
      { name: 'Create Sale', path: '/dashboard/sales/sale', icon: <BiCart /> },
      { name: 'Pending Sales', path: '/dashboard/sales/pending-sale', icon: <BiTime /> },
      { name: 'Confirmed Sales', path: '/dashboard/sales/confirmed-sale', icon: <BiCheckCircle /> },
      { name: 'Out for Delivery', path: '/dashboard/sales/out_for_delivery', icon: <BiSolidTruck /> },
      { name: 'Completed Sales', path: '/dashboard/sales/completed-sale', icon: <BiCheckCircle /> },
      { name: 'Returned Sales', path: '/dashboard/sales/returned-sale', icon: <BiArrowBack /> },
      { name: 'Payments', path: '/dashboard/sales/payments', icon: <BiDollarCircle /> },
      { name: 'History', path: '/dashboard/sales/history', icon: <BiHistory /> },
      { name: 'Report Issue', path: '/dashboard/sales/issue', icon: <BiMessageSquareDetail /> },
      { name: 'My Profile', path: '/dashboard/profile', icon: <BiUser /> },
    ]

    let links = []
    if (user?.role === 'admin') {
      links = adminLinks
    } else if (user?.role === 'manager') {
      links = managerLinks
    } else if (user?.role === 'sales') {
      links = salesLinks
    } else if (user) {
      links = [{ name: 'My Profile', path: '/dashboard/profile', icon: <BiUser /> }]
    }

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
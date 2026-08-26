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
      { name: 'Overview', path: '/dashboard/overview', icon: <BiHome /> },
      { name: 'Branches', path: '/dashboard/branches', icon: <BiStoreAlt /> },
      { name: 'Categories', path: '/dashboard/category', icon: <BiCategory /> },
      { name: 'Brands', path: '/dashboard/brands', icon: <BiTag /> },
      { name: 'Products', path: '/dashboard/product', icon: <BiPackage /> },
      { name: 'People (Accounts)', path: '/dashboard/people', icon: <BiUser /> },
      { name: 'Stock', path: '/dashboard/stock', icon: <BiPackage /> },
      { name: 'Payments', path: '/dashboard/payments', icon: <BiDollarCircle /> },
      { name: 'Reviews', path: '/dashboard/reviews', icon: <BiUserVoice /> },
      { name: 'Issue Log', path: '/dashboard/issue', icon: <BiMessageSquareDetail /> },
      { name: 'Reports', path: '/dashboard/report', icon: <BiFile /> },
      { name: 'Backup', path: '/dashboard/backup', icon: <BiCloudDownload /> },
      { name: 'Settings', path: '/dashboard/settings', icon: <BiCog /> },
      { name: 'My Profile', path: '/dashboard/profile', icon: <BiUser /> },
    ]

    const managerLinks = [
      { name: 'Overview', path: '/dashboard/overview', icon: <BiHome /> },
      { name: 'Categories', path: '/dashboard/category', icon: <BiCategory /> },
      { name: 'Brands', path: '/dashboard/brands', icon: <BiTag /> },
      { name: 'Products', path: '/dashboard/product', icon: <BiPackage /> },
      { name: 'Issues Log', path: '/dashboard/issue', icon: <BiMessageSquareDetail /> },
      { name: 'Purchases', path: '/dashboard/purchase', icon: <BiDollarCircle /> },
      { name: 'Stock', path: '/dashboard/stock', icon: <BiPackage /> },
      { name: 'Suppliers', path: '/dashboard/supplier', icon: <BiStoreAlt /> },
      { name: 'Customers', path: '/dashboard/customers', icon: <BiUser /> },
      { name: 'Support Tickets', path: '/dashboard/support', icon: <BiMessageSquareDetail /> },
      { name: 'Contact Messages', path: '/dashboard/contact', icon: <BiMessageSquareDetail /> },
      { name: 'Reviews', path: '/dashboard/reviews', icon: <BiUserVoice /> },
      { name: 'Payments', path: '/dashboard/payments', icon: <BiDollarCircle /> },
      { name: 'Returns', path: '/dashboard/return', icon: <BiArrowBack /> },
      { name: 'Reports', path: '/dashboard/report', icon: <BiFile /> },
      { name: 'My Profile', path: '/dashboard/profile', icon: <BiUser /> },
    ]

    const salesLinks = [
      { name: 'Create Sale', path: '/dashboard/sale', icon: <BiCart /> },
      { name: 'Pending Sales', path: '/dashboard/pending-sale', icon: <BiTime /> },
      { name: 'Confirmed Sales', path: '/dashboard/confirmed-sale', icon: <BiCheckCircle /> },
      { name: 'Out for Delivery', path: '/dashboard/out_for_delivery', icon: <BiSolidTruck /> },
      { name: 'Completed Sales', path: '/dashboard/completed-sale', icon: <BiCheckCircle /> },
      { name: 'Returned Sales', path: '/dashboard/returned-sale', icon: <BiArrowBack /> },
      { name: 'Payments', path: '/dashboard/payments', icon: <BiDollarCircle /> },
      { name: 'History', path: '/dashboard/history', icon: <BiHistory /> },
      { name: 'Report Issue', path: '/dashboard/issue', icon: <BiMessageSquareDetail /> },
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
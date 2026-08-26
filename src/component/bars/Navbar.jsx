'use client'
import React, { useContext } from 'react'
import { BiMenu, BiShieldAlt2, BiHomeAlt } from 'react-icons/bi'
import { Context } from '../helper/Context'
import Link from 'next/link'

const Navbar = () => {
  const { user, dashSidebar, setDashSidebar } = useContext(Context)

  return (
    <header 
      className="w-full h-14 fixed top-0 z-40 bg-primary text-white flex items-center justify-between px-4 border-b border-black/10 shadow-md"
    >
      <div className="flex items-center gap-3">
        <button 
          onClick={() => setDashSidebar(!dashSidebar)}
          className="p-1.5 rounded-xl text-white hover:bg-black/10 transition cursor-pointer"
          title="Toggle Navigation Sidebar"
        >
          <BiMenu className="text-2xl" />
        </button> 
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-sm tracking-tight text-white hover:opacity-90 transition">
          <span className="font-semibold tracking-tight">Management Console</span>
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          {user?.name && (
            <Link href="/dashboard/profile" className="flex items-center gap-2 hover:opacity-90 transition cursor-pointer">
              <span className="text-xs font-bold text-white hidden sm:inline">{user.name}</span>
              {user.role && (
                <span className="text-[10px] uppercase font-extrabold bg-white/20 px-2 py-0.5 rounded-full tracking-wider text-white">
                  {user.role}
                </span>
              )}
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}

export default Navbar
'use client'
import React, { useContext, useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  BiMenu,
  BiSearch,
  BiX,
  BiChevronRight,
  BiShieldAlt2,
  BiCommand
} from 'react-icons/bi'
import { Context } from '../helper/Context'
import { ROLE_PERMISSIONS } from '@/app/(dashboard)/dashboard/layout'
import { MODULE_LINKS } from './Sidebar'

const Navbar = () => {
  const { user, dashSidebar, setDashSidebar } = useContext(Context)
  const router = useRouter()

  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)

  const searchRef = useRef(null)
  const inputRef = useRef(null)

  const role = user?.role || 'staff'
  const allowedKeys = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.staff

  const allowedModules = allowedKeys
    .map(key => ({ key, ...MODULE_LINKS[key] }))
    .filter(item => item && item.name && item.path)

  const searchResults = query.trim() === ''
    ? []
    : allowedModules.filter(item => {
      const term = query.toLowerCase().trim()
      const nameMatch = item.name.toLowerCase().includes(term)
      const pathMatch = item.path.toLowerCase().includes(term)
      const keyMatch = item.key.toLowerCase().includes(term)
      return nameMatch || pathMatch || keyMatch
    })

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
        setIsOpen(true)
      } else if (e.key === 'Escape') {
        setIsOpen(false)
        inputRef.current?.blur()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelectResult = (path) => {
    setQuery('')
    setIsOpen(false)
    router.push(path)
  }

  const handleInputKeyDown = (e) => {
    if (searchResults.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => (prev + 1) % searchResults.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => (prev - 1 + searchResults.length) % searchResults.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (searchResults[selectedIndex]) {
        handleSelectResult(searchResults[selectedIndex].path)
      }
    }
  }

  return (
    <header className="w-full h-14 fixed top-0 z-40 bg-primary text-white flex items-center justify-between px-3 md:px-5 border-b border-black/10 shadow-md">

      <div className="flex items-center gap-3">
        <button
          onClick={() => setDashSidebar(!dashSidebar)}
          className="p-1.5 rounded-xl text-white hover:bg-black/10 transition cursor-pointer"
          title="Toggle Navigation Sidebar"
        >
          <BiMenu className="text-2xl" />
        </button>
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-sm tracking-tight text-white hover:opacity-90 transition">
          <span className="font-semibold tracking-tight hidden sm:inline">Management Console</span>
        </Link>
      </div>

      <div ref={searchRef} className="relative w-full max-w-xs sm:max-w-md mx-2">
        <div className="relative flex items-center">
          <BiSearch className="absolute left-3 text-white/70 text-base pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onFocus={() => setIsOpen(true)}
            onChange={(e) => {
              setQuery(e.target.value)
              setSelectedIndex(0)
              setIsOpen(true)
            }}
            onKeyDown={handleInputKeyDown}
            placeholder={`Search folders/modules... (${role})`}
            className="w-full pl-9 pr-14 py-1.5 bg-white text-black  border border-white/20 text-xs font-semibold rounded-xl outline-none transition shadow-inner"
          />
          {query ? (
            <button
              onClick={() => {
                setQuery('')
                setIsOpen(false)
              }}
              className="absolute right-2.5 p-0.5 text-white/70 hover:text-white transition cursor-pointer"
            >
              <BiX className="text-base" />
            </button>
          ) : (
            <span className="absolute right-2.5 hidden md:flex items-center gap-0.5 px-1.5 py-0.5 text-black text-[10px] font-mono font-bold  rounded border border-white/15 pointer-events-none select-none">
              Ctrl K
            </span>
          )}
        </div>

        {isOpen && query.trim().length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white text-slate-800 border border-slate-200 shadow-2xl rounded-2xl overflow-hidden z-50 animate-fadeIn flex flex-col">
            <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Matching Modules ({searchResults.length})
              </span>
            </div>

            <div className="max-h-72 overflow-y-auto p-1 flex flex-col gap-0.5">
              {searchResults.length > 0 ? (
                searchResults.map((item, idx) => {
                  const isSelected = idx === selectedIndex
                  return (
                    <button
                      key={item.path}
                      type="button"
                      onClick={() => handleSelectResult(item.path)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition text-left cursor-pointer ${isSelected
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/60 shadow-xs'
                          : 'text-slate-700 hover:bg-slate-50 border border-transparent'
                        }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`p-1.5 rounded-lg text-sm shrink-0 ${isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                          {item.icon}
                        </div>
                        <div className="text-slate-800 font-bold leading-tight">{item.name}</div>
                      </div>
                      <BiChevronRight className={`text-xs ${isSelected ? 'text-emerald-700' : 'text-slate-400'}`} />
                    </button>
                  )
                })
              ) : (
                <div className="p-4 text-center text-xs font-semibold text-slate-400 flex flex-col items-center gap-1">
                  <span>No matching folder/module found</span>
                  <span className="text-[10px] text-slate-400">Search is restricted to your role ({role}) permissions</span>
                </div>
              )}
            </div>
          </div>
        )}
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
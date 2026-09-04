'use client'
import React from 'react'
import Link from 'next/link'
import { BiPieChartAlt2, BiCog, BiLockAlt } from 'react-icons/bi'

export default function ShareInvestmentDisabled({ moduleName = 'Share Investment Module' }) {
  return (
    <div className="w-full flex flex-col items-center justify-center py-20 px-4">
      <div className="bg-white border border-slate-200 shadow-sm max-w-md w-full p-8 text-center flex flex-col items-center gap-4">
        <div className="w-16 h-16 bg-slate-100 border border-slate-200 text-slate-500 flex items-center justify-center text-3xl font-bold">
          <BiLockAlt />
        </div>

        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center justify-center gap-2">
            <BiPieChartAlt2 className="text-primary text-xl" />
            {moduleName} Disabled
          </h2>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
            The Share Investment & Equity system is currently turned OFF. Enable it in Website Settings to activate investor equity tracking, daily sales profit allocations, and automated cash flow balance management.
          </p>
        </div>

        <Link
          href="/dashboard/settings"
          className="mt-2 px-5 py-2.5 text-white text-xs font-bold transition shadow-sm cursor-pointer flex items-center gap-2 bg-primary hover:bg-primary-dark"
        >
          <BiCog className="text-base" /> Enable Share Investment System
        </Link>
      </div>
    </div>
  )
}

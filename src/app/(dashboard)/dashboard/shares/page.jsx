'use client'
import React, { useContext, useEffect, useState } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Context } from '@/component/helper/Context'
import { 
  BiPieChartAlt2, 
  BiSearch, 
  BiLoaderAlt, 
  BiUser, 
  BiRefresh
} from 'react-icons/bi'


export default function DashboardSharesPage() {
  const { dashSidebar } = useContext(Context)
  const [shares, setShares] = useState([])
  const [investors, setInvestors] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const fetchSharesAndSettings = async () => {
    setLoading(true)
    try {
      const [sharesRes, investorsRes] = await Promise.all([
        axios.get('/api/shares'),
        axios.get('/api/investor').catch(() => ({ data: [] }))
      ])
      setShares(Array.isArray(sharesRes.data) ? sharesRes.data : [])
      setInvestors(Array.isArray(investorsRes.data) ? investorsRes.data : [])
    } catch (err) {
      toast.error('Failed to fetch share data')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSharesAndSettings()
  }, [])

  const filteredShares = shares.filter(item => {
    const matchesSearch = item.investor_name?.toLowerCase().includes(search.toLowerCase()) ||
                          item.investor_phone?.toLowerCase().includes(search.toLowerCase()) ||
                          item.note?.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Summary Metrics
  const totalAllocatedPct = shares
    .filter(s => s.status === 'active')
    .reduce((acc, curr) => acc + parseFloat(curr.share_percentage || 0), 0)
  const unallocatedPct = Math.max(0, 100 - totalAllocatedPct)
  const activeShareholdersCount = new Set(shares.filter(s => s.status === 'active').map(s => s.investor_id)).size

  return (
    <div className={`w-full min-h-screen bg-slate-50 pt-20 pb-12 px-4 md:px-8 transition-all duration-300 ${dashSidebar ? 'lg:pl-68' : 'lg:pl-8'}`}>
      <div className="max-w-6xl mx-auto flex flex-col gap-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-4 gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-800 flex items-center gap-2.5">
              <BiPieChartAlt2 className="text-primary text-3xl" />
              Share Allocations & Equity Distribution
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-1">
              View Equity Ownership and Investor Share Percentages
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={fetchSharesAndSettings}
              className="p-2.5 bg-white border border-slate-200 text-slate-700 text-xs font-bold shadow-sm hover:bg-slate-100 transition cursor-pointer"
              title="Refresh"
            >
              <BiRefresh className={`text-lg ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 p-5 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Allocated Equity</p>
              <h3 className="text-lg font-bold text-slate-800 mt-0.5">{totalAllocatedPct.toFixed(2)}%</h3>
            </div>
            <div className="w-10 h-10 text-white flex items-center justify-center text-xl shrink-0 font-bold bg-primary">
              <BiPieChartAlt2 />
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-5 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Unallocated Equity</p>
              <h3 className="text-lg font-bold text-slate-800 mt-0.5">{unallocatedPct.toFixed(2)}%</h3>
            </div>
            <div className="w-10 h-10 bg-slate-100 text-slate-600 border border-slate-200 flex items-center justify-center text-xl shrink-0 font-bold">
              <BiPieChartAlt2 />
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-5 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Active Shareholders</p>
              <h3 className="text-lg font-bold text-slate-800 mt-0.5">{activeShareholdersCount}</h3>
            </div>
            <div className="w-10 h-10 text-white flex items-center justify-center text-xl shrink-0 font-bold bg-emerald-600">
              <BiUser />
            </div>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="bg-white p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <div className="relative w-full sm:w-72">
              <BiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base" />
              <input
                type="text"
                placeholder="Search investor name, phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-56 px-3.5 py-2.5 bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
            <span>Showing {filteredShares.length} record(s)</span>
          </div>
        </div>

        {/* Shares Table */}
        <div className="bg-white border border-slate-200 shadow-sm">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <BiLoaderAlt className="text-3xl text-primary animate-spin" />
              <p className="text-xs font-medium text-slate-500">Loading share allocations...</p>
            </div>
          ) : filteredShares.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-2 text-slate-400">
              <BiPieChartAlt2 className="text-4xl" />
              <p className="text-sm font-semibold text-slate-600">No share allocation records found</p>
              <p className="text-xs">
                Record capital investments for active investors to calculate shares automatically.
              </p>
            </div>
          ) : (
            <div className="w-full">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-100/80 text-slate-650 font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-3 md:px-4 py-3">Investor</th>
                    <th className="px-3 md:px-4 py-3">Share Percentage</th>
                    <th className="hidden sm:table-cell px-3 md:px-4 py-3">Status</th>
                    <th className="hidden md:table-cell px-3 md:px-4 py-3">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
                  {filteredShares.map((item) => {
                    const pct = parseFloat(item.share_percentage || 0)

                    return (
                      <tr key={item.share_id} className="hover:bg-slate-50/80 transition">
                        <td className="px-3 md:px-4 py-3 font-semibold">
                          <div className="font-bold text-slate-900 flex items-center gap-2">
                            <BiUser className="text-slate-400 text-base" />
                            {item.investor_name || `Investor #${item.investor_id}`}
                          </div>
                          {item.investor_phone && (
                            <div className="text-[10px] text-slate-400 font-normal mt-0.5 ml-6">
                              {item.investor_phone}
                            </div>
                          )}
                        </td>

                        <td className="px-3 md:px-4 py-3">
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-slate-900 min-w-[45px]">
                              {pct.toFixed(2)}%
                            </span>
                            <div className="w-32 h-2 bg-slate-100 border border-slate-200 shrink-0">
                              <div 
                                className={`h-full ${item.status === 'active' ? 'bg-primary' : 'bg-slate-400'}`} 
                                style={{ width: `${Math.min(pct, 100)}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>

                        <td className="hidden sm:table-cell px-3 md:px-4 py-3">
                          <span className={`inline-block px-2 py-0.5 text-[9px] font-bold uppercase border ${
                            item.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}>
                            {item.status}
                          </span>
                        </td>

                        <td className="hidden md:table-cell px-3 md:px-4 py-3 text-slate-500 max-w-xs truncate">
                          {item.note || '-'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}


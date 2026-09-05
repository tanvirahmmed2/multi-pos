'use client'
import React, { useContext, useEffect, useState } from 'react'
import Link from 'next/link'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Context } from '@/component/helper/Context'
import { 
  BiUndo, 
  BiPlus, 
  BiSearch, 
  BiLoaderAlt, 
  BiEdit, 
  BiTrash, 
  BiUser, 
  BiCalendar, 
  BiReceipt, 
  BiX, 
  BiCheckCircle,
  BiRefresh,
  BiDollarCircle,
  BiInfoCircle
} from 'react-icons/bi'

export default function DashboardWithdrawalsPage() {
  const { dashSidebar, formatCurrency, currencySymbol } = useContext(Context)
  const [withdrawals, setWithdrawals] = useState([])
  const [investors, setInvestors] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedInvestorFilter, setSelectedInvestorFilter] = useState('')

  const [isShareInvestment, setIsShareInvestment] = useState(true)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [settingsRes, wRes, investorRes] = await Promise.all([
        axios.get('/api/settings'),
        axios.get('/api/withdrawals'),
        axios.get('/api/investor').catch(() => ({ data: [] }))
      ])
      const isEnabled = settingsRes.data && settingsRes.data.is_share_investment !== false
      setIsShareInvestment(isEnabled)
      setWithdrawals(Array.isArray(wRes.data) ? wRes.data : [])
      setInvestors(Array.isArray(investorRes.data) ? investorRes.data : [])
    } catch (err) {
      toast.error('Failed to load withdrawals data')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this withdrawal record?')) return
    try {
      await axios.delete(`/api/withdrawals/${id}`)
      toast.success('Withdrawal record deleted')
      fetchData()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete withdrawal record')
      console.error(err)
    }
  }

  const filteredWithdrawals = withdrawals.filter((w) => {
    const term = search.toLowerCase()
    const matchesSearch = (
      (w.investor_display_name && w.investor_display_name.toLowerCase().includes(term)) ||
      (w.payment_method && w.payment_method.toLowerCase().includes(term)) ||
      (w.status && w.status.toLowerCase().includes(term)) ||
      (w.account_details && w.account_details.toLowerCase().includes(term)) ||
      (w.note && w.note.toLowerCase().includes(term)) ||
      String(w.amount).includes(term)
    )
    const matchesInvestor = !selectedInvestorFilter || String(w.investor_id) === String(selectedInvestorFilter)
    return matchesSearch && matchesInvestor
  })

  const totalAmountWithdrawn = filteredWithdrawals.reduce((sum, w) => sum + parseFloat(w.amount || 0), 0)

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  if (loading) {
    return (
      <div className={`w-full min-h-screen bg-slate-50 pt-20 pb-12 px-4 md:px-8 flex items-center justify-center transition-all duration-300 ${dashSidebar ? 'lg:pl-68' : 'lg:pl-8'}`}>
        <div className="flex items-center gap-2 text-slate-500 font-semibold">
          <BiLoaderAlt className="animate-spin text-2xl text-slate-800" />
          <span>Loading withdrawals records...</span>
        </div>
      </div>
    )
  }

  return (
    <div className={`w-full min-h-screen bg-slate-50 pt-20 pb-12 px-4 md:px-8 transition-all duration-300 ${dashSidebar ? 'lg:pl-68' : 'lg:pl-8'}`}>
      <div className="max-w-6xl mx-auto flex flex-col gap-6">

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2.5">
              <BiUndo className="text-amber-600 text-3xl" /> Capital & Balance Withdrawals
            </h1>
            <p className="text-slate-500 text-xs mt-1 font-medium">
              Track money withdrawals, admin direct balance payouts, and equity profit distributions.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => fetchData()}
              className="p-2.5 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-sm hover:bg-slate-100 transition cursor-pointer"
              title="Refresh"
            >
              <BiRefresh className={`text-lg ${loading ? 'animate-spin' : ''}`} />
            </button>
            <Link
              href="/dashboard/withdrawals/create"
              className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 text-white text-xs font-bold rounded-xl shadow-md hover:bg-amber-700 transition cursor-pointer"
            >
              <BiPlus className="text-lg" /> Record Withdrawal
            </Link>
          </div>
        </div>



        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <div className="relative w-full sm:w-72">
              <BiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base" />
              <input
                type="text"
                placeholder="Search by investor, details, status..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition"
              />
            </div>

            {isShareInvestment && investors.length > 0 && (
              <select
                value={selectedInvestorFilter}
                onChange={(e) => setSelectedInvestorFilter(e.target.value)}
                className="w-full sm:w-56 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-amber-500 transition cursor-pointer"
              >
                <option value="">All Investors</option>
                {investors.map((inv) => (
                  <option key={inv.investor_id} value={inv.investor_id}>
                    {inv.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200/60 px-4 py-2 rounded-xl">
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Filtered Total:</span>
            <span className="text-sm font-black font-mono text-amber-900">{formatCurrency ? formatCurrency(totalAmountWithdrawn) : `${currencySymbol}${totalAmountWithdrawn.toFixed(2)}`}</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          {filteredWithdrawals.length === 0 ? (
            <div className="p-12 text-center text-slate-400 font-medium text-xs">
              No withdrawal records found matching your search.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4">Withdrawal ID</th>
                    <th className="py-3 px-4">Investor / Recipient</th>
                    <th className="py-3 px-4">Method</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredWithdrawals.map((w) => (
                    <tr key={w.withdrawal_id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">#{w.withdrawal_id}</td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800">{w.investor_display_name || w.investor_name || 'Admin Balance Withdrawal'}</div>
                        {w.investor_phone_contact && (
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">{w.investor_phone_contact}</div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-bold uppercase rounded font-mono">
                          {w.payment_method}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-extrabold text-slate-900">
                        {formatCurrency ? formatCurrency(w.amount) : `${currencySymbol}${parseFloat(w.amount).toFixed(2)}`}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded-md border ${
                          w.status === 'completed' 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {w.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                        {formatDate(w.created_at || w.withdrawal_date)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenModal(w)}
                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                            title="Edit Record"
                          >
                            <BiEdit className="text-base" />
                          </button>
                          <button
                            onClick={() => handleDelete(w.withdrawal_id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Delete Record"
                          >
                            <BiTrash className="text-base" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

'use client'
import React, { useState, useEffect } from 'react'
import { 
  BiPieChartAlt2, 
  BiDollarCircle, 
  BiPlus, 
  BiRefresh, 
  BiTransferAlt, 
  BiUser, 
  BiHistory, 
  BiSearch, 
  BiX, 
  BiLockAlt, 
  BiWallet,
  BiCheckCircle
} from 'react-icons/bi'
import { toast } from 'react-hot-toast'
import ShareInvestmentDisabled from '@/component/helper/ShareInvestmentDisabled'

export default function ProfitsPage() {
  const [isDisabled, setIsDisabled] = useState(false)
  const [loading, setLoading] = useState(true)
  const [profitLogs, setProfitLogs] = useState([])
  const [investorSummary, setInvestorSummary] = useState([])
  const [grandTotalProfit, setGrandTotalProfit] = useState(0)
  const [availableBalance, setAvailableBalance] = useState(0)
  const [search, setSearch] = useState('')

  // Transfer Modal State
  const [isTransferOpen, setIsTransferOpen] = useState(false)
  const [selectedInvestor, setSelectedInvestor] = useState(null)
  const [transferAmount, setTransferAmount] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Manual Allocation Modal State
  const [isAllocateOpen, setIsAllocateOpen] = useState(false)
  const [allocateAmount, setAllocateAmount] = useState('')
  const [allocateNote, setAllocateNote] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const settingsRes = await fetch('/api/settings')
      if (settingsRes.ok) {
        const sData = await settingsRes.json()
        if (!sData.is_share_investment) {
          setIsDisabled(true)
          setLoading(false)
          return
        }
      }

      const [profitRes, balRes] = await Promise.all([
        fetch('/api/profits'),
        fetch('/api/available-balance')
      ])

      if (profitRes.status === 403) {
        setIsDisabled(true)
        setLoading(false)
        return
      }

      if (profitRes.ok) {
        const data = await profitRes.json()
        setProfitLogs(data.logs || [])
        setInvestorSummary(data.investor_summary || [])
        setGrandTotalProfit(data.grand_total_profit || 0)
      }

      if (balRes.ok) {
        const bData = await balRes.json()
        setAvailableBalance(bData.available_balance || 0)
      }
    } catch (error) {
      console.error('Error fetching profit data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTransfer = async (e) => {
    e.preventDefault()
    if (!selectedInvestor) return
    const amt = parseFloat(transferAmount)
    if (isNaN(amt) || amt <= 0) {
      toast.error('Valid transfer amount is required')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/profits/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          investor_id: selectedInvestor.investor_id,
          amount: amt
        })
      })

      if (res.ok) {
        toast.success(`Transferred ৳${amt} profits to capital investment for ${selectedInvestor.investor_name}!`)
        setIsTransferOpen(false)
        setSelectedInvestor(null)
        setTransferAmount('')
        fetchData()
      } else {
        const err = await res.json()
        toast.error(err.error || 'Failed to transfer profit')
      }
    } catch (error) {
      toast.error('Error transferring profit')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleManualAllocation = async (e) => {
    e.preventDefault()
    const amt = parseFloat(allocateAmount)
    if (isNaN(amt) || amt <= 0) {
      toast.error('Valid profit allocation amount is required')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/profits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profit_amount: amt,
          note: allocateNote || 'Manual gross profit allocation'
        })
      })

      if (res.ok) {
        toast.success(`Allocated ৳${amt} gross profit across all active investors!`)
        setIsAllocateOpen(false)
        setAllocateAmount('')
        setAllocateNote('')
        fetchData()
      } else {
        const err = await res.json()
        toast.error(err.error || 'Failed to allocate profit')
      }
    } catch (error) {
      toast.error('Error allocating profit')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isDisabled) {
    return <ShareInvestmentDisabled moduleName="Investor Profits System" />
  }

  const filteredLogs = profitLogs.filter(log =>
    log.investor_name?.toLowerCase().includes(search.toLowerCase()) ||
    log.note?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="w-full min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8 pt-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <BiPieChartAlt2 className="text-primary" /> Investor Profit Allocations
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track daily gross profit allocations based on equity share percentages and rollover profits into capital investments.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            className="p-2.5 bg-white border border-slate-200 text-slate-600 hover:text-slate-800 transition cursor-pointer shadow-sm"
            title="Refresh Data"
          >
            <BiRefresh className="text-lg" />
          </button>
          <button
            onClick={() => setIsAllocateOpen(true)}
            className="px-4 py-2.5 bg-primary hover:bg-primary-dark text-white font-bold text-xs sm:text-sm shadow-sm transition flex items-center gap-2 cursor-pointer"
          >
            <BiPlus className="text-lg" /> Allocate Daily Profit
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Accumulated Profit</span>
            <div className="w-8 h-8 bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center text-lg">
              <BiPieChartAlt2 />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-emerald-600 mt-2">
            ৳{grandTotalProfit.toLocaleString('en-BD', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-slate-400">Sum of all investor profit allocations</span>
        </div>

        <div className="bg-white border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Investors</span>
            <div className="w-8 h-8 bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center text-lg">
              <BiUser />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-slate-800 mt-2">
            {investorSummary.length}
          </p>
          <span className="text-[10px] text-slate-400">Investors with share allocations</span>
        </div>

        <div className="bg-white border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Available Balance</span>
            <div className="w-8 h-8 bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center text-lg">
              <BiWallet />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-slate-800 mt-2">
            ৳{availableBalance.toLocaleString('en-BD', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-slate-400">System liquid cash balance</span>
        </div>
      </div>

      {/* Investor Profit Balances Grid */}
      <div className="mb-8">
        <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">
          Investor Profit Accounts & Transfer Actions
        </h2>

        {investorSummary.length === 0 ? (
          <div className="bg-white border border-slate-200 p-6 text-center text-slate-400 text-xs shadow-sm">
            No investors found. Add investors on the Investors page to begin profit allocations.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {investorSummary.map((inv) => {
              const profitAmt = parseFloat(inv.total_accumulated_profit || 0)
              const pct = parseFloat(inv.share_percentage || 0)

              return (
                <div key={inv.investor_id} className="bg-white border border-slate-200 p-4 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                        <BiUser className="text-primary" /> {inv.investor_name}
                      </h3>
                      <span className="px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 text-[11px] font-bold">
                        {pct.toFixed(2)}% Share
                      </span>
                    </div>

                    <div className="mt-3">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Accumulated Profit Balance</span>
                      <p className="text-lg font-bold text-emerald-600">
                        ৳{profitAmt.toLocaleString('en-BD', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end">
                    <button
                      onClick={() => {
                        setSelectedInvestor(inv)
                        setTransferAmount(profitAmt > 0 ? profitAmt.toString() : '')
                        setIsTransferOpen(true)
                      }}
                      disabled={profitAmt <= 0}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 disabled:opacity-40 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <BiTransferAlt className="text-sm" /> Transfer to Investment
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Profit Distribution Logs Table */}
      <div className="bg-white border border-slate-200 shadow-sm">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <BiHistory className="text-slate-500" /> Daily Profit Distribution Logs
          </h3>
          <div className="relative w-full sm:w-64">
            <BiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base" />
            <input
              type="text"
              placeholder="Search profit log..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 focus:bg-white focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4">Log ID</th>
                <th className="py-3 px-4">Investor</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Allocated Amount</th>
                <th className="py-3 px-4">Note / Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">Loading profit logs...</td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">No profit log entries found.</td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const isNegative = parseFloat(log.amount) < 0
                  return (
                    <tr key={log.profit_id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-mono text-slate-500">#{log.profit_id}</td>
                      <td className="py-3 px-4 font-bold text-slate-800">{log.investor_name || `Investor #${log.investor_id}`}</td>
                      <td className="py-3 px-4 text-slate-500">
                        {log.profit_date ? new Date(log.profit_date).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className={`py-3 px-4 text-right font-bold ${isNegative ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {isNegative ? '-' : '+'}৳{Math.abs(parseFloat(log.amount || 0)).toLocaleString('en-BD', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-slate-500 italic">{log.note || 'Sales profit distribution'}</td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transfer Profit to Investment Modal */}
      {isTransferOpen && selectedInvestor && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <BiTransferAlt className="text-primary" /> Transfer Profit to Investment
              </h2>
              <button onClick={() => setIsTransferOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                <BiX className="text-2xl" />
              </button>
            </div>

            <form onSubmit={handleTransfer} className="space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-200 text-xs space-y-1">
                <div className="font-bold text-slate-800">{selectedInvestor.investor_name}</div>
                <div className="text-slate-500">Share: {parseFloat(selectedInvestor.share_percentage || 0).toFixed(2)}%</div>
                <div className="text-emerald-600 font-bold">
                  Available Accumulated Profit: ৳{parseFloat(selectedInvestor.total_accumulated_profit || 0).toFixed(2)}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Transfer Amount (৳) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  max={parseFloat(selectedInvestor.total_accumulated_profit || 0)}
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 focus:bg-white focus:border-primary focus:outline-none"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  This amount will be deducted from investor profit balance and added to capital investments, automatically recalculating equity shares.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-200 pt-4">
                <button
                  type="button"
                  onClick={() => setIsTransferOpen(false)}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-primary hover:bg-primary-dark text-white text-xs font-bold cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Processing...' : 'Confirm Transfer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Daily Profit Allocation Modal */}
      {isAllocateOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <BiPlus className="text-primary" /> Allocate Gross Sales Profit
              </h2>
              <button onClick={() => setIsAllocateOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                <BiX className="text-2xl" />
              </button>
            </div>

            <form onSubmit={handleManualAllocation} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Total Gross Profit Amount to Allocate (৳) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 5000.00"
                  value={allocateAmount}
                  onChange={(e) => setAllocateAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 focus:bg-white focus:border-primary focus:outline-none"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Profit will be divided automatically among active investors based on their equity share percentages.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Allocation Note / Reference</label>
                <input
                  type="text"
                  placeholder="e.g. Daily sales profit for 04/09/2026"
                  value={allocateNote}
                  onChange={(e) => setAllocateNote(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 focus:bg-white focus:border-primary focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-200 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAllocateOpen(false)}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-primary hover:bg-primary-dark text-white text-xs font-bold cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Allocating...' : 'Distribute Profits'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

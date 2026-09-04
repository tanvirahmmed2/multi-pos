'use client'
import React, { useContext, useEffect, useState } from 'react'
import Link from 'next/link'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Context } from '@/component/helper/Context'
import { 
  BiWallet, 
  BiPlus, 
  BiRefresh, 
  BiShieldX, 
  BiHome, 
  BiLoaderAlt, 
  BiTrendingUp, 
  BiTrendingDown, 
  BiDollarCircle, 
  BiInfoCircle,
  BiX,
  BiReceipt,
  BiCreditCard,
  BiTrash
} from 'react-icons/bi'

export default function DashboardBalancePage() {
  const { dashSidebar, user, loading: userLoading } = useContext(Context)
  
  const [data, setData] = useState({
    is_share_investment: false,
    available_balance: 0,
    total_manual_added: 0,
    total_sales_payments: 0,
    total_purchases: 0,
    total_expenses: 0,
    total_withdrawals: 0,
    total_salaries: 0,
    balance_transactions: []
  })

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    amount: '',
    payment_method: 'cash',
    reference_no: '',
    note: ''
  })

  const fetchData = async () => {
    try {
      const res = await axios.get('/api/balance')
      setData(res.data)
    } catch (err) {
      console.error('Error loading balance data:', err)
      toast.error('Failed to load balance records')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    if (userLoading) return
    if (user && user.role === 'admin') {
      fetchData()
    } else {
      setLoading(false)
    }
  }, [user, userLoading])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchData()
  }

  const handleOpenModal = () => {
    if (data.is_share_investment) {
      toast.error('Manual balance addition is disabled when Share Investment mode is enabled')
      return
    }
    setFormData({
      amount: '',
      payment_method: 'cash',
      reference_no: '',
      note: ''
    })
    setIsModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const amt = parseFloat(formData.amount)
    if (isNaN(amt) || amt <= 0) {
      toast.error('Please enter a valid positive amount')
      return
    }

    setSubmitting(true)
    try {
      await axios.post('/api/balance', formData)
      toast.success('Balance added successfully!')
      setIsModalOpen(false)
      fetchData()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add balance')
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteTx = async (txId, amount) => {
    if (!window.confirm(`Are you sure you want to delete balance transaction #${txId}? This will deduct ৳${parseFloat(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} from the available balance.`)) {
      return
    }

    try {
      await axios.delete(`/api/balance/${txId}`)
      toast.success('Transaction deleted and balance updated!')
      fetchData()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete transaction')
      console.error(err)
    }
  }

  if (userLoading || loading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <BiLoaderAlt className="animate-spin text-4xl text-slate-800" />
          <p className="text-slate-600 text-sm font-semibold animate-pulse">Loading balance console...</p>
        </div>
      </div>
    )
  }

  if (user && user.role !== 'admin') {
    return (
      <div className={`w-full min-h-screen bg-slate-50 pt-20 pb-12 px-4 md:px-8 transition-all duration-300 ${dashSidebar ? 'lg:pl-64' : 'lg:pl-8'}`}>
        <div className="bg-white border border-slate-200 shadow-sm p-8 max-w-md mx-auto text-center flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-rose-50 text-rose-600 flex items-center justify-center text-3xl font-bold border border-rose-100">
            <BiShieldX />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Access Restricted</h2>
            <p className="text-slate-500 text-xs mt-1.5 leading-relaxed">
              Only Administrators have authorization to access the Balance Management console.
            </p>
          </div>
          <Link href="/dashboard" className="mt-2 px-6 py-2.5 text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer bg-primary hover:bg-primary-dark shadow-sm">
            <BiHome className="text-base" /> Return to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  const formatMoney = (val) => {
    const num = parseFloat(val || 0)
    return `৳${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const formatDate = (d) => {
    if (!d) return 'N/A'
    return new Date(d).toLocaleString('en-GB', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className={`w-full min-h-screen bg-slate-50 pt-20 pb-12 px-2 sm:px-4 md:px-8 transition-all duration-300 ${dashSidebar ? 'lg:pl-64' : 'lg:pl-8'}`}>
      <div className="w-full flex flex-col gap-6 md:gap-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-4 gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
              <BiWallet className="text-primary" /> Balance Management
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Monitor real-time store balance, manual capital deposits, and transaction ledgers.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 transition cursor-pointer shadow-sm disabled:opacity-50"
              title="Refresh Balance Data"
            >
              <BiRefresh className={`text-xl ${refreshing ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={handleOpenModal}
              disabled={data.is_share_investment}
              className={`px-4 py-2.5 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm ${
                data.is_share_investment
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed border border-slate-300'
                  : 'bg-primary hover:bg-primary-dark cursor-pointer'
              }`}
              title={data.is_share_investment ? 'Disabled in Share Investment Mode' : 'Add Cash/Balance'}
            >
              <BiPlus className="text-base" /> Add Balance
            </button>
          </div>
        </div>

        {/* Share Investment Mode Alert Banner */}
        {data.is_share_investment && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 shadow-sm flex items-center gap-3">
            <BiInfoCircle className="text-xl shrink-0 text-amber-600" />
            <div className="text-xs leading-relaxed">
              <span className="font-bold">Share Investment Mode is enabled.</span> Manual balance addition is disabled because store capital and equity funding are managed via the Share Investments module.
            </div>
          </div>
        )}

        {/* Summary KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          
          <div className="bg-white border border-slate-200 p-5 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Current Balance</p>
              <h2 className="text-xl font-bold text-slate-900 mt-1">{formatMoney(data.available_balance)}</h2>
              <p className="text-[10px] text-slate-500 mt-0.5">Net Available Cash</p>
            </div>
            <div className="w-11 h-11 text-white flex items-center justify-center text-2xl shrink-0 font-bold bg-primary">
              <BiWallet />
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-5 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Manual Added Balance</p>
              <h2 className="text-xl font-bold text-emerald-700 mt-1">{formatMoney(data.total_manual_added)}</h2>
              <p className="text-[10px] text-slate-500 mt-0.5">Direct Deposits Logged</p>
            </div>
            <div className="w-11 h-11 bg-emerald-600 text-white flex items-center justify-center text-2xl shrink-0 font-bold">
              <BiTrendingUp />
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-5 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Sales Collections</p>
              <h2 className="text-xl font-bold text-slate-800 mt-1">{formatMoney(data.total_sales_payments)}</h2>
              <p className="text-[10px] text-slate-500 mt-0.5">Customer Payments Received</p>
            </div>
            <div className="w-11 h-11 bg-blue-600 text-white flex items-center justify-center text-2xl shrink-0 font-bold">
              <BiDollarCircle />
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-5 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Purchase Outflow</p>
              <h2 className="text-xl font-bold text-rose-700 mt-1">{formatMoney(data.total_purchases)}</h2>
              <p className="text-[10px] text-slate-500 mt-0.5">Supplier Payments Made</p>
            </div>
            <div className="w-11 h-11 bg-rose-600 text-white flex items-center justify-center text-2xl shrink-0 font-bold">
              <BiTrendingDown />
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-5 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Expenses Outflow</p>
              <h2 className="text-xl font-bold text-rose-700 mt-1">{formatMoney(data.total_expenses)}</h2>
              <p className="text-[10px] text-slate-500 mt-0.5">Operating Expenses Paid</p>
            </div>
            <div className="w-11 h-11 bg-amber-600 text-white flex items-center justify-center text-2xl shrink-0 font-bold">
              <BiReceipt />
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-5 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Salary Outflow</p>
              <h2 className="text-xl font-bold text-rose-700 mt-1">{formatMoney(data.total_salaries)}</h2>
              <p className="text-[10px] text-slate-500 mt-0.5">Staff Payroll Disbursed</p>
            </div>
            <div className="w-11 h-11 bg-purple-600 text-white flex items-center justify-center text-2xl shrink-0 font-bold">
              <BiCreditCard />
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-5 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Withdrawals Outflow</p>
              <h2 className="text-xl font-bold text-rose-700 mt-1">{formatMoney(data.total_withdrawals)}</h2>
              <p className="text-[10px] text-slate-500 mt-0.5">Capital & Profit Withdrawals</p>
            </div>
            <div className="w-11 h-11 bg-sky-600 text-white flex items-center justify-center text-2xl shrink-0 font-bold">
              <BiTrendingDown />
            </div>
          </div>

        </div>

        {/* Balance Additions Table */}
        <div className="bg-white border border-slate-200 shadow-sm p-4 sm:p-6 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Manual Balance Additions Ledger</h3>
              <p className="text-xs text-slate-500 mt-0.5">History of all direct cash additions and deposits added to available balance.</p>
            </div>
            <button
              onClick={handleOpenModal}
              disabled={data.is_share_investment}
              className={`px-3 py-1.5 text-xs font-bold transition flex items-center gap-1 shadow-sm ${
                data.is_share_investment
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-primary hover:bg-primary-dark text-white cursor-pointer'
              }`}
            >
              <BiPlus /> Add Balance
            </button>
          </div>

          {data.balance_transactions.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-10">No manual balance additions recorded yet.</p>
          ) : (
            <div className="w-full border border-slate-200">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-2.5 text-center">ID</th>
                    <th className="px-3 py-2.5">Added By</th>
                    <th className="px-3 py-2.5">Type</th>
                    <th className="hidden sm:table-cell px-3 py-2.5">Method</th>
                    <th className="hidden md:table-cell px-3 py-2.5">Reference / Trx No</th>
                    <th className="hidden lg:table-cell px-3 py-2.5">Note</th>
                    <th className="px-3 py-2.5 text-right">Amount</th>
                    <th className="hidden sm:table-cell px-3 py-2.5 text-center">Date & Time</th>
                    <th className="px-3 py-2.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {data.balance_transactions.map((tx) => (
                    <tr key={tx.transaction_id} className="hover:bg-slate-50 transition">
                      <td className="px-3 py-2.5 text-center font-mono font-bold text-slate-800">#{tx.transaction_id}</td>
                      <td className="px-3 py-2.5 font-semibold text-slate-800">{tx.staff_name || 'Admin'}</td>
                      <td className="px-3 py-2.5 font-medium uppercase text-slate-600">
                        <span className="px-2 py-0.5 text-[9px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {tx.type || 'Deposit'}
                        </span>
                      </td>
                      <td className="hidden sm:table-cell px-3 py-2.5 uppercase font-medium text-slate-600">{tx.payment_method || 'Cash'}</td>
                      <td className="hidden md:table-cell px-3 py-2.5 font-mono text-slate-500">{tx.reference_no || 'N/A'}</td>
                      <td className="hidden lg:table-cell px-3 py-2.5 text-slate-500 max-w-[200px] truncate">{tx.note || '—'}</td>
                      <td className="px-3 py-2.5 text-right font-bold text-emerald-700">+{formatMoney(tx.amount)}</td>
                      <td className="hidden sm:table-cell px-3 py-2.5 text-center text-slate-500">{formatDate(tx.created_at)}</td>
                      <td className="px-3 py-2.5 text-center">
                        <button
                          onClick={() => handleDeleteTx(tx.transaction_id, tx.amount)}
                          className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition cursor-pointer"
                          title="Delete Transaction & Deduct Balance"
                        >
                          <BiTrash className="text-sm" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* Add Balance Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 shadow-xl max-w-md w-full p-6 flex flex-col gap-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <BiPlus className="text-primary text-lg" /> Add Balance / Capital
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <BiX className="text-xl" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Amount (৳) <span className="text-rose-600">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="e.g. 50000"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 text-xs text-slate-800 outline-none focus:border-primary font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Payment Method</label>
                <select
                  value={formData.payment_method}
                  onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 text-xs text-slate-800 outline-none focus:border-primary font-semibold"
                >
                  <option value="cash">Cash</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="mobile_banking">Mobile Banking (bKash/Nagad/Rocket)</option>
                  <option value="cheque">Cheque</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Reference / Trx No (Optional)</label>
                <input
                  type="text"
                  placeholder="Bank Reference or Transaction ID"
                  value={formData.reference_no}
                  onChange={(e) => setFormData({ ...formData, reference_no: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 text-xs text-slate-800 outline-none focus:border-primary font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Note (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Reason or description for adding balance..."
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 text-xs text-slate-800 outline-none focus:border-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-primary hover:bg-primary-dark text-white text-xs font-bold transition shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {submitting ? <BiLoaderAlt className="animate-spin text-base" /> : <BiPlus className="text-base" />}
                  Confirm Add Balance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}

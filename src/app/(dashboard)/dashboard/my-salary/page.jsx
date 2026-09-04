'use client'
import React, { useContext, useEffect, useState } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Context } from '@/component/helper/Context'
import { 
  BiDollarCircle, 
  BiCalendar, 
  BiReceipt, 
  BiCheckCircle, 
  BiTime, 
  BiRefresh, 
  BiUser, 
  BiCreditCard, 
  BiFile, 
  BiSearch, 
  BiLoaderAlt,
  BiTrendingUp,
  BiMinusCircle,
  BiPlusCircle
} from 'react-icons/bi'

export default function MySalaryPage() {
  const { dashSidebar, formatCurrency, user } = useContext(Context)
  const [data, setData] = useState({
    staff: null,
    salary_structure: null,
    payments: []
  })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const fetchMySalary = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/api/my-salary')
      setData(res.data)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to fetch personal salary history')
      console.error('Error loading personal salary history:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMySalary()
  }, [])

  const structure = data.salary_structure
  const payments = data.payments || []

  const completedPayments = payments.filter(p => (p.status || '').toLowerCase() === 'completed')
  const pendingPayments = payments.filter(p => (p.status || '').toLowerCase() === 'pending')

  const totalEarned = completedPayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0)
  const totalPending = pendingPayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0)

  const filteredPayments = payments.filter((p) => {
    const term = search.toLowerCase()
    return (
      (p.payment_month && p.payment_month.toLowerCase().includes(term)) ||
      (p.payment_method && p.payment_method.toLowerCase().includes(term)) ||
      (p.transaction_id && p.transaction_id.toLowerCase().includes(term)) ||
      (p.status && p.status.toLowerCase().includes(term)) ||
      (p.note && p.note.toLowerCase().includes(term)) ||
      String(p.amount).includes(term)
    )
  })

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <div className={`w-full min-h-screen bg-slate-50 pt-20 pb-12 px-4 md:px-8 transition-all duration-300 ${dashSidebar ? 'lg:pl-68' : 'lg:pl-8'}`}>
      <div className="w-full flex flex-col gap-6">

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-4 gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2.5">
              <BiDollarCircle className="text-primary text-3xl" /> My Salary & Payment History
            </h1>
            <p className="text-slate-500 text-xs mt-1 font-medium">
              View your assigned monthly salary structure, allowance breakdown, and received payment history.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={fetchMySalary}
              className="p-2.5 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-sm hover:bg-slate-100 transition cursor-pointer"
              title="Refresh Salary Data"
            >
              <BiRefresh className={`text-lg ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Stat Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 p-5 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Monthly Net Salary</p>
              <h3 className="text-lg font-bold text-slate-800 mt-0.5">
                {structure ? formatCurrency(structure.net_salary) : 'Not Assigned'}
              </h3>
            </div>
            <div className="w-10 h-10 text-white flex items-center justify-center text-xl shrink-0 font-bold bg-primary">
              <BiDollarCircle />
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-5 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Received</p>
              <h3 className="text-lg font-bold text-emerald-600 mt-0.5">
                {formatCurrency(totalEarned)}
              </h3>
            </div>
            <div className="w-10 h-10 text-white flex items-center justify-center text-xl shrink-0 font-bold bg-emerald-600">
              <BiCheckCircle />
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-5 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Pending Disbursals</p>
              <h3 className="text-lg font-bold text-amber-600 mt-0.5">
                {formatCurrency(totalPending)}
              </h3>
            </div>
            <div className="w-10 h-10 bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center text-xl shrink-0 font-bold">
              <BiTime />
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-5 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Payments</p>
              <h3 className="text-lg font-bold text-slate-800 mt-0.5">
                {completedPayments.length} Completed
              </h3>
            </div>
            <div className="w-10 h-10 bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center text-xl shrink-0 font-bold">
              <BiFile />
            </div>
          </div>
        </div>

        {/* Assigned Salary Structure Details */}
        <div className="bg-white border border-slate-200 shadow-sm p-6">
          <div className="border-b border-slate-100 pb-3 mb-4 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <BiUser className="text-primary text-lg" /> Assigned Salary Structure
            </h2>
            {structure && (
              <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                {structure.salary_title} ({structure.assignment_status || 'active'})
              </span>
            )}
          </div>

          {!structure ? (
            <div className="py-6 text-center text-xs text-slate-400 font-medium">
              No salary structure has been assigned to your staff account yet. Please contact your administrator.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 text-xs">
              <div className="bg-slate-50 border border-slate-200 p-3.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Base Salary</span>
                <span className="text-sm font-bold text-slate-800 mt-1 block">{formatCurrency(structure.base_salary)}</span>
              </div>

              <div className="bg-emerald-50/60 border border-emerald-100 p-3.5">
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block flex items-center gap-1">
                  <BiPlusCircle /> Allowance
                </span>
                <span className="text-sm font-bold text-emerald-700 mt-1 block">+{formatCurrency(structure.allowance)}</span>
              </div>

              <div className="bg-blue-50/60 border border-blue-100 p-3.5">
                <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block flex items-center gap-1">
                  <BiTrendingUp /> Performance Bonus
                </span>
                <span className="text-sm font-bold text-blue-700 mt-1 block">+{formatCurrency(structure.bonus)}</span>
              </div>

              <div className="bg-rose-50/60 border border-rose-100 p-3.5">
                <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block flex items-center gap-1">
                  <BiMinusCircle /> Deductions
                </span>
                <span className="text-sm font-bold text-rose-700 mt-1 block">-{formatCurrency(structure.deduction)}</span>
              </div>

              <div className="bg-primary/10 border border-primary/20 p-3.5 col-span-2 sm:col-span-1">
                <span className="text-[10px] font-bold text-primary uppercase tracking-wider block">Net Monthly Salary</span>
                <span className="text-sm font-black text-primary mt-1 block">{formatCurrency(structure.net_salary)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white p-4 border border-slate-200 shadow-sm flex items-center justify-between gap-4">
          <div className="relative w-full md:w-96">
            <BiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base" />
            <input
              type="text"
              placeholder="Search by month, method, transaction ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
            />
          </div>
          <div className="text-xs font-bold text-slate-500 hidden md:block">
            Showing <span className="text-slate-800">{filteredPayments.length}</span> payment records
          </div>
        </div>

        {/* Payments Ledger Table */}
        <div className="bg-white border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <BiLoaderAlt className="text-3xl text-primary animate-spin" />
              <p className="text-xs font-medium text-slate-500">Loading your salary payment history...</p>
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-2 text-slate-400">
              <BiReceipt className="text-4xl" />
              <p className="text-sm font-semibold text-slate-600">No salary payments recorded</p>
              <p className="text-xs">Once salary disbursements are posted by management, they will appear here.</p>
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-100/80 text-slate-650 font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-3 md:px-4 py-3">Payment Month</th>
                    <th className="px-3 md:px-4 py-3">Payment Date</th>
                    <th className="px-3 md:px-4 py-3">Payment Method</th>
                    <th className="hidden sm:table-cell px-3 md:px-4 py-3">Account / Trx Ref</th>
                    <th className="px-3 md:px-4 py-3 text-right">Amount Received</th>
                    <th className="px-3 md:px-4 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
                  {filteredPayments.map((p) => {
                    const statusLower = (p.status || '').toLowerCase()

                    return (
                      <tr key={p.payment_id} className="hover:bg-slate-50/80 transition">
                        <td className="px-3 md:px-4 py-3 font-bold text-slate-900">
                          <span className="flex items-center gap-1.5">
                            <BiCalendar className="text-slate-400" /> {p.payment_month || 'N/A'}
                          </span>
                        </td>

                        <td className="px-3 md:px-4 py-3 text-slate-600 font-medium whitespace-nowrap">
                          {formatDate(p.payment_date || p.created_at)}
                        </td>

                        <td className="px-3 md:px-4 py-3 uppercase text-slate-600 font-medium">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 border border-slate-200 text-[11px]">
                            <BiCreditCard className="text-slate-400" /> {p.payment_method ? p.payment_method.replace('_', ' ') : 'Bank Transfer'}
                          </span>
                        </td>

                        <td className="hidden sm:table-cell px-3 md:px-4 py-3 font-mono text-[11px] text-slate-600">
                          {p.transaction_id || p.account_details || '-'}
                        </td>

                        <td className="px-3 md:px-4 py-3 text-right font-bold text-emerald-600 whitespace-nowrap text-sm">
                          {formatCurrency(p.amount)}
                        </td>

                        <td className="px-3 md:px-4 py-3 text-center whitespace-nowrap">
                          <span className={`inline-block px-2.5 py-0.5 text-[9px] font-bold uppercase border ${
                            statusLower === 'completed'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : statusLower === 'pending'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}>
                            {p.status || 'Completed'}
                          </span>
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

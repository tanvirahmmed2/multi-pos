'use client'
import React, { useContext, useEffect, useState } from 'react'
import Link from 'next/link'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Context } from '@/component/helper/Context'
import { 
  BiDollarCircle, 
  BiSearch, 
  BiLoaderAlt, 
  BiReceipt, 
  BiShow,
  BiCalendar,
  BiUser,
  BiCreditCard,
  BiStore,
  BiFilterAlt
} from 'react-icons/bi'

export default function DashboardPurchasePaymentsPage() {
  const { dashSidebar, formatCurrency } = useContext(Context)
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [methodFilter, setMethodFilter] = useState('all')

  const fetchPayments = async () => {
    try {
      const res = await axios.get('/api/purchase-payments')
      setPayments(res.data)
    } catch (err) {
      toast.error('Failed to load purchase payments ledger')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPayments()
  }, [])

  const filteredPayments = payments.filter((p) => {
    const term = search.toLowerCase()
    const matchesSearch = (
      (p.invoice_no && p.invoice_no.toLowerCase().includes(term)) ||
      (p.supplier_name && p.supplier_name.toLowerCase().includes(term)) ||
      (p.supplier_phone && p.supplier_phone.toLowerCase().includes(term)) ||
      (p.transaction_id && p.transaction_id.toLowerCase().includes(term)) ||
      (p.branch_name && p.branch_name.toLowerCase().includes(term)) ||
      String(p.payment_id).includes(term) ||
      String(p.purchase_id).includes(term)
    )

    const matchesMethod = methodFilter === 'all' || 
      (p.payment_method && p.payment_method.toLowerCase() === methodFilter.toLowerCase())

    return matchesSearch && matchesMethod
  })

  const totalAmountPaid = filteredPayments.reduce((sum, p) => sum + (parseFloat(p.amount_paid) || 0), 0)
  const cashPaidTotal = filteredPayments
    .filter(p => (p.payment_method || '').toLowerCase() === 'cash')
    .reduce((sum, p) => sum + (parseFloat(p.amount_paid) || 0), 0)
  const digitalPaidTotal = filteredPayments
    .filter(p => (p.payment_method || '').toLowerCase() !== 'cash')
    .reduce((sum, p) => sum + (parseFloat(p.amount_paid) || 0), 0)

  return (
    <div className={`w-full min-h-screen bg-slate-50 pt-20 pb-12 px-4 md:px-8 transition-all duration-300 ${dashSidebar ? 'lg:pl-68' : 'lg:pl-8'}`}>
      <div className="w-full flex flex-col gap-6">
        
        {/* Header Card */}
        <div className="bg-white border border-slate-200 shadow-sm p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <BiDollarCircle className="text-primary text-2xl" />
              Purchase Payments Ledger
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">Track supplier payment histories, transaction references, and procurement disbursements.</p>
          </div>
          <Link
            href="/dashboard/purchase"
            className="bg-primary hover:bg-primary-dark text-white font-bold text-xs px-4 py-2.5 transition cursor-pointer shadow-sm flex items-center justify-center gap-1.5 self-start sm:self-auto"
          >
            <BiReceipt className="text-base" /> Purchase Invoices
          </Link>
        </div>

        {/* Financial Overview Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white border border-slate-200 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition">
            <div className="w-10 h-10 flex items-center justify-center text-xl mb-4 text-white font-bold bg-primary">
              <BiDollarCircle />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Disbursements</span>
              <h3 className="text-2xl font-extrabold text-slate-800 mt-1">{formatCurrency(totalAmountPaid)}</h3>
              <p className="text-slate-500 text-xs mt-1">{filteredPayments.length} logged payments</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition">
            <div className="w-10 h-10 flex items-center justify-center text-xl mb-4 text-white font-bold bg-emerald-600">
              <BiCreditCard />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cash Payments</span>
              <h3 className="text-2xl font-extrabold text-emerald-700 mt-1">{formatCurrency(cashPaidTotal)}</h3>
              <p className="text-slate-500 text-xs mt-1">Direct cash disbursements</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition">
            <div className="w-10 h-10 flex items-center justify-center text-xl mb-4 text-white font-bold bg-slate-800">
              <BiStore />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Card / Digital Payments</span>
              <h3 className="text-2xl font-extrabold text-slate-800 mt-1">{formatCurrency(digitalPaidTotal)}</h3>
              <p className="text-slate-500 text-xs mt-1">Bank & Mobile Banking</p>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex-1 w-full relative">
            <BiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base" />
            <input
              type="text"
              placeholder="Search by payment ID, invoice #, supplier name or txn..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 focus:bg-white focus:border-primary focus:outline-none transition"
            />
          </div>

          <div className="w-full sm:w-56 shrink-0 flex items-center gap-2">
            <BiFilterAlt className="text-slate-400 text-base hidden sm:inline" />
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 focus:bg-white focus:border-primary focus:outline-none cursor-pointer"
            >
              <option value="all">All Payment Methods</option>
              <option value="cash">Cash</option>
              <option value="card">Credit/Debit Card</option>
              <option value="mobile banking">Mobile Banking</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="w-full h-64 bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-500 gap-2">
            <BiLoaderAlt className="animate-spin text-xl text-primary" />
            <span className="text-xs font-medium">Loading payment records...</span>
          </div>
        ) : filteredPayments.length > 0 ? (
          <div className="bg-white border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs text-slate-600">
                <thead className="bg-slate-100/70 text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th scope="col" className="px-4 py-3">Payment ID / Date</th>
                    <th scope="col" className="px-4 py-3">Invoice #</th>
                    <th scope="col" className="px-4 py-3">Supplier</th>
                    <th scope="col" className="px-4 py-3">Branch</th>
                    <th scope="col" className="px-4 py-3">Method & Reference</th>
                    <th scope="col" className="px-4 py-3">Amount Paid</th>
                    <th scope="col" className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 border-t border-slate-100 font-medium">
                  {filteredPayments.map((pm) => (
                    <tr key={pm.payment_id} className="border-b border-slate-200 text-xs text-slate-700 hover:bg-slate-50 transition">
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800 text-xs">
                            #PAY-{pm.payment_id}
                          </span>
                          <span className="text-slate-400 text-[11px] flex items-center gap-1 mt-0.5">
                            <BiCalendar className="text-slate-400" />
                            {new Date(pm.payment_date).toLocaleString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/dashboard/purchase/${pm.purchase_id}`}
                          className="font-bold text-primary hover:underline text-xs"
                        >
                          {pm.invoice_no ? `#${pm.invoice_no}` : `INV-PR-${pm.purchase_id}`}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800 flex items-center gap-1 text-xs">
                            <BiUser className="text-slate-400 text-xs" />
                            {pm.supplier_name || 'Walk-in Supplier'}
                          </span>
                          {pm.supplier_phone && (
                            <span className="text-slate-400 text-[11px] mt-0.5">{pm.supplier_phone}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-bold text-slate-700 text-[11px] bg-slate-100 border border-slate-200 px-2 py-0.5 inline-block">
                          {pm.branch_name ? `${pm.branch_name}${pm.branch_code ? ` (${pm.branch_code})` : ''}` : 'Main Branch'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800 text-xs flex items-center gap-1">
                            <BiCreditCard className="text-slate-400" />
                            {pm.payment_method || 'Cash'}
                          </span>
                          {pm.transaction_id && (
                            <span className="text-slate-400 font-mono text-[10px] mt-0.5">
                              Txn: {pm.transaction_id}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-bold text-emerald-700 text-xs font-mono">
                          {formatCurrency(pm.amount_paid)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/dashboard/purchase/${pm.purchase_id}`}
                          title="View Invoice & Details"
                          className="p-1.5 hover:bg-slate-100 text-slate-600 transition cursor-pointer border border-slate-200 shadow-xs inline-block"
                        >
                          <BiShow className="text-base" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="w-full py-16 bg-white border border-slate-200 shadow-sm flex flex-col items-center justify-center text-slate-400 gap-2">
            <BiReceipt className="text-4xl text-slate-300" />
            <p className="font-bold text-slate-600 text-sm">No purchase payment records found</p>
            <p className="text-xs text-slate-400">Try adjusting your search query or filter settings.</p>
          </div>
        )}

      </div>
    </div>
  )
}

'use client'
import React, { useContext, useEffect, useState } from 'react'
import Link from 'next/link'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Context } from '@/component/helper/Context'
import { 
  BiSearch, 
  BiDollarCircle, 
  BiLoaderAlt, 
  BiShieldQuarter, 
  BiRefresh, 
  BiCheckCircle, 
  BiChevronRight 
} from 'react-icons/bi'

export default function SalesPaymentsPage() {
  const { dashSidebar, user, loading: userLoading, website } = useContext(Context)
  const themeColor = website?.theme_color || '#73976A'
  
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const fetchPayments = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/api/sale/payments')
      setPayments(res.data)
    } catch (err) {
      console.error('Failed to load transaction ledger:', err)
      toast.error('Failed to fetch payments database')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (userLoading) return
    if (user && ['admin', 'manager', 'sales'].includes(user.role)) {
      fetchPayments()
    }
  }, [user, userLoading])

  if (userLoading || (loading && payments.length === 0)) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-2">
          <BiLoaderAlt className="animate-spin text-4xl text-slate-800" />
          <p className="text-slate-600 text-sm font-semibold animate-pulse">Loading payments ledger...</p>
        </div>
      </div>
    )
  }

  // Filter payments by search
  const filteredPayments = payments.filter(pay => {
    const matchesSearch = 
      pay.payment_id.toString().includes(search) ||
      pay.order_id.toString().includes(search) ||
      (pay.customer_name && pay.customer_name.toLowerCase().includes(search.toLowerCase())) ||
      (pay.order_phone && pay.order_phone.includes(search)) ||
      (pay.payment_method && pay.payment_method.toLowerCase().includes(search.toLowerCase()))
    return matchesSearch
  })

  // Calculate gross paid total
  const grossPaid = filteredPayments.reduce((acc, curr) => acc + parseFloat(curr.amount || 0), 0)

  return (
    <div className={`w-full min-h-screen bg-slate-50 pt-20 pb-12 px-2 sm:px-4 md:px-8 transition-all duration-300 ${dashSidebar ? 'lg:pl-68' : 'lg:pl-8'}`}>
      <div className="w-full flex flex-col gap-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-4 gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Payments & Invoices Logbook</h1>
            <p className="text-xs text-slate-500 mt-1">Audit customer payments, invoices transaction IDs, COD settlement reports, and net payments cleared.</p>
          </div>
          <button
            onClick={fetchPayments}
            disabled={loading}
            className="p-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 transition cursor-pointer shadow-sm disabled:opacity-40"
          >
            <BiRefresh className={`text-xl ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Aggregate Overview Card */}
        <div className="bg-white border border-slate-200 p-5 shadow-sm flex items-center gap-4 max-w-sm">
          <div className="w-10 h-10 text-white flex items-center justify-center text-lg font-bold shrink-0" style={{ backgroundColor: themeColor }}>
            <BiDollarCircle />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Filtered Revenue Settled</p>
            <h3 className="text-base font-black text-slate-800 mt-0.5">৳{grossPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 bg-white px-3 py-2 border border-slate-200 w-full md:w-80 shadow-sm">
            <BiSearch className="text-slate-400 text-lg" />
            <input 
              type="text"
              placeholder="Search by Payment/Order ID, method, client..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs text-slate-800 bg-transparent outline-none"
            />
          </div>
        </div>

        {/* Payments List Table */}
        {loading ? (
          <div className="w-full py-20 flex flex-col items-center justify-center gap-2">
            <BiLoaderAlt className="animate-spin text-4xl text-slate-800" />
            <p className="text-slate-500 text-sm font-semibold animate-pulse">Loading transaction logs...</p>
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="w-full bg-white border border-slate-200 py-16 px-6 text-center shadow-sm">
            <h3 className="font-bold text-slate-800 text-base">No Payments Found</h3>
            <p className="text-slate-500 text-xs mt-1">There are no payment receipt records logged matching your active criteria.</p>
          </div>
        ) : (
          <div className="w-full bg-white border border-slate-200 shadow-sm">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-100/80 text-slate-650 font-bold border-b border-slate-200">
                <tr>
                  <th className="px-2 sm:px-3 py-3 text-center">Receipt ID</th>
                  <th className="hidden sm:table-cell px-2 sm:px-3 py-3">Transaction Date</th>
                  <th className="px-2 sm:px-3 py-3 text-center">Order Ref</th>
                  <th className="px-2 sm:px-3 py-3">Customer</th>
                  <th className="hidden md:table-cell px-2 sm:px-3 py-3">Phone</th>
                  <th className="hidden lg:table-cell px-2 sm:px-3 py-3">Sample Item</th>
                  <th className="hidden md:table-cell px-2 sm:px-3 py-3 text-center">Method</th>
                  <th className="px-2 sm:px-3 py-3 text-right">Amount Paid</th>
                  <th className="px-2 sm:px-3 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
                {filteredPayments.map(pay => (
                  <tr key={pay.payment_id} className="hover:bg-slate-50/50 transition">
                    <td className="px-2 sm:px-3 py-3.5 text-center font-bold text-slate-800">#{pay.payment_id}</td>
                    <td className="hidden sm:table-cell px-2 sm:px-3 py-3.5 whitespace-nowrap text-slate-500">{new Date(pay.paid_at).toLocaleString()}</td>
                    <td className="px-2 sm:px-3 py-3.5 text-center font-bold text-slate-800">
                      <Link href={`/dashboard/sales/sale/${pay.order_id}`} className="hover:underline text-slate-900 cursor-pointer">
                        #{pay.order_id}
                      </Link>
                    </td>
                    <td className="px-2 sm:px-3 py-3.5 font-semibold text-slate-800 max-w-[120px] truncate" title={pay.customer_name || 'Guest'}>{pay.customer_name || 'Guest'}</td>
                    <td className="hidden md:table-cell px-2 sm:px-3 py-3.5 font-medium text-slate-600">{pay.order_phone || 'N/A'}</td>
                    <td className="hidden lg:table-cell px-2 sm:px-3 py-3.5 text-slate-500 max-w-[140px] truncate" title={pay.sample_product_name || 'In-store Items'}>{pay.sample_product_name || 'In-store Items'}</td>
                    <td className="hidden md:table-cell px-2 sm:px-3 py-3.5 text-center"><span className="px-1.5 py-0.5 bg-slate-50 text-slate-700 font-bold uppercase text-[9px] border border-slate-200">{pay.payment_method}</span></td>
                    <td className="px-2 sm:px-3 py-3.5 text-right font-bold text-emerald-600">৳{parseFloat(pay.amount).toFixed(2)}</td>
                    <td className="px-2 sm:px-3 py-3.5 text-center">
                      <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase border border-emerald-200 bg-emerald-50 text-emerald-700">
                        {pay.payment_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  )
}


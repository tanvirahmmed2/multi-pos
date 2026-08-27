'use client'
import React, { useState, useEffect, useContext } from 'react'
import { Context } from '@/component/helper/Context'
import Link from 'next/link'
import axios from 'axios'
import toast from 'react-hot-toast'
import { 
  BiRefresh, 
  BiSearch, 
  BiLoaderAlt, 
  BiDollarCircle
} from 'react-icons/bi'

export default function AdminPaymentsPage() {
  const { dashSidebar } = useContext(Context)

  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  const fetchPayments = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/api/sale/payments')
      setPayments(res.data)
    } catch (err) {
      console.error('Failed to load payments:', err)
      toast.error('Failed to fetch payments logs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPayments()
  }, [])

  const filteredPayments = payments.filter(pay => {
    const matchesSearch = 
      pay.payment_id.toString().includes(searchTerm) ||
      pay.order_id.toString().includes(searchTerm) ||
      (pay.customer_name && pay.customer_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (pay.order_phone && pay.order_phone.includes(searchTerm)) ||
      (pay.payment_method && pay.payment_method.toLowerCase().includes(searchTerm.toLowerCase()))
    return matchesSearch
  })

  return (
    <div className={`w-full min-h-screen bg-[#F1F5F9] pt-20 pb-12 px-4 md:px-8 transition-all duration-300 ${dashSidebar ? 'lg:pl-64' : 'lg:pl-8'}`}>
      <div className="w-full max-w-7xl mx-auto flex flex-col gap-6">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-4 gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">Admin Payments Desk</h1>
            <p className="text-xs text-slate-500 mt-1">Global administrative desk for settled receipts, mobile/COD payments, and reference tracking.</p>
          </div>
          <button
            onClick={fetchPayments}
            disabled={loading}
            className="p-2.5 bg-white hover:bg-slate-50 text-slate-700 rounded-xl border border-slate-200 transition cursor-pointer shadow-xs disabled:opacity-40"
          >
            <BiRefresh className={`text-xl ${loading ? 'animate-spin text-[#73976A]' : ''}`} />
          </button>
        </div>

        <div className="flex justify-end">
          <div className="flex items-center gap-2 bg-white px-3 py-2 border border-slate-200 rounded-xl w-full sm:w-80 shadow-xs">
            <BiSearch className="text-slate-400 text-lg shrink-0" />
            <input className="input-style border-none focus:ring-0 shadow-none px-0 bg-transparent text-xs"
              type="text"
              placeholder="Search receipt, order, phone or method..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="w-full py-20 flex flex-col items-center justify-center gap-2">
            <BiLoaderAlt className="animate-spin text-4xl text-[#73976A]" />
            <p className="text-slate-500 text-sm font-semibold animate-pulse">Loading payments logs...</p>
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="w-full bg-white border border-slate-200 rounded-2xl py-16 px-6 text-center flex flex-col items-center gap-3 shadow-xs">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-2xl">
              <BiDollarCircle />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">No Payments Recorded</h3>
              <p className="text-slate-500 text-xs mt-1">There are no order payment transactions that match your search query.</p>
            </div>
          </div>
        ) : (
          <div className="w-full overflow-x-auto bg-white border border-slate-200 rounded-2xl shadow-xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-[#F1F5F9] text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="px-3 md:px-4 py-3">Receipt ID</th>
                  <th className="px-3 md:px-4 py-3 hidden md:table-cell">Date Logged</th>
                  <th className="px-3 md:px-4 py-3">Order Ref</th>
                  <th className="px-3 md:px-4 py-3">Customer Details</th>
                  <th className="px-3 md:px-4 py-3 hidden lg:table-cell">Sample Product</th>
                  <th className="px-3 md:px-4 py-3 hidden sm:table-cell">Method</th>
                  <th className="px-3 md:px-4 py-3 text-right">Settled Amount</th>
                  <th className="px-3 md:px-4 py-3 text-center">Status</th>
                  <th className="px-3 md:px-4 py-3 hidden xl:table-cell">Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
                {filteredPayments.map((p) => (
                  <tr key={p.payment_id} className="hover:bg-slate-50 transition">
                    <td className="px-3 md:px-4 py-3.5">
                      <div className="font-bold text-slate-800 font-mono text-[11px] md:text-xs">#PAY-{p.payment_id}</div>
                    </td>
                    <td className="px-3 md:px-4 py-3.5 font-mono text-slate-500 text-[11px] md:text-xs whitespace-nowrap hidden md:table-cell">
                      {p.paid_at ? new Date(p.paid_at).toLocaleString() : 'N/A'}
                    </td>
                    <td className="px-3 md:px-4 py-3.5">
                      <Link href={`/track-order?id=${p.order_id}`} target="_blank" className="inline-flex items-center text-[#73976A] hover:underline font-bold text-xs">
                        #ORD-{p.order_id}
                      </Link>
                    </td>
                    <td className="px-3 md:px-4 py-3.5">
                      <div className="font-bold text-slate-800 text-xs max-w-[100px] sm:max-w-[140px] truncate">{p.customer_name || 'Guest'}</div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[120px]">{p.order_phone}</div>
                    </td>
                    <td className="px-3 md:px-4 py-3.5 max-w-[160px] truncate text-slate-500 text-xs hidden lg:table-cell" title={p.sample_product_name || 'N/A'}>
                      {p.sample_product_name || 'General Order Billing'}
                    </td>
                    <td className="px-3 md:px-4 py-3.5 hidden sm:table-cell">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider">
                        {p.payment_method || 'Cash'}
                      </span>
                    </td>
                    <td className="px-3 md:px-4 py-3.5 text-right font-bold text-[#73976A] text-xs md:text-sm">
                      ৳{parseFloat(p.amount || 0).toFixed(2)}
                    </td>
                    <td className="px-3 md:px-4 py-3.5 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-wider ${
                        p.payment_status === 'completed' ? 'bg-[#73976A]/10 text-[#73976A] border border-[#73976A]/20' :
                        ['failed', 'refunded'].includes(p.payment_status) ? 'bg-[#BD4444]/10 text-[#BD4444] border border-[#BD4444]/20' :
                        'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {p.payment_status}
                      </span>
                    </td>
                    <td className="px-3 md:px-4 py-3.5 text-slate-400 text-xs italic max-w-[140px] truncate hidden xl:table-cell" title={p.note || ''}>
                      {p.note || 'No notes'}
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


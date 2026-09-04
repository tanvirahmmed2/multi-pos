'use client'
import React, { useContext, useEffect, useState } from 'react'
import Link from 'next/link'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Context } from '@/component/helper/Context'
import { 
  BiPlus, 
  BiSearch, 
  BiTrash, 
  BiLoaderAlt, 
  BiReceipt, 
  BiShow,
  BiCalendar,
  BiUser,
  BiDollarCircle
} from 'react-icons/bi'

export default function DashboardManagerPurchasePage() {
  const { dashSidebar } = useContext(Context)
  const [purchases, setPurchases] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [deletingId, setDeletingId] = useState(null)

  const fetchPurchases = async () => {
    try {
      const res = await axios.get('/api/purchase')
      setPurchases(res.data)
    } catch (err) {
      toast.error('Failed to load purchases')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPurchases()
  }, [])

  const handleDelete = async (id) => {
    if (!window.confirm('WARNING: Deleting this purchase will REVERT the ingested stocks of variant items and delete all associated payments. Are you sure you want to continue?')) {
      return
    }
    setDeletingId(id)
    try {
      await axios.delete(`/api/purchase/${id}`)
      toast.success('Purchase invoice deleted and stock reverted')
      fetchPurchases()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete purchase')
      console.error(err)
    } finally {
      setDeletingId(null)
    }
  }

  const filteredPurchases = purchases.filter((p) => {
    const term = search.toLowerCase()
    return (
      (p.invoice_no && p.invoice_no.toLowerCase().includes(term)) ||
      (p.supplier_name && p.supplier_name.toLowerCase().includes(term)) ||
      (p.supplier_phone && p.supplier_phone.toLowerCase().includes(term)) ||
      (p.branch_name && p.branch_name.toLowerCase().includes(term)) ||
      String(p.purchase_id).includes(term)
    )
  })

  const formatCurrency = (val) => {
    const num = parseFloat(val) || 0
    return `৳${num.toFixed(2)}`
  }

  return (
    <div className={`w-full min-h-screen bg-slate-50 pt-20 pb-12 px-4 md:px-8 transition-all duration-300 ${dashSidebar ? 'lg:pl-68' : 'lg:pl-8'}`}>
      <div className="w-full flex flex-col gap-6">
        
        {/* Header Card */}
        <div className="bg-white border border-slate-200 shadow-sm p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <BiReceipt className="text-primary text-2xl" />
              Procurement & Purchase Invoices
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">Record goods ingestion, track supplier billing, and manage payments.</p>
          </div>
          <Link
            href="/dashboard/purchase/create"
            className="bg-primary hover:bg-primary-dark text-white font-bold text-xs px-4 py-2.5 transition cursor-pointer shadow-sm flex items-center justify-center gap-1.5 self-start sm:self-auto"
          >
            <BiPlus className="text-base" /> New Purchase Invoice
          </Link>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white p-4 border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="flex-1 max-w-md relative">
            <BiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base" />
            <input
              type="text"
              placeholder="Search by invoice #, supplier name or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 focus:bg-white focus:border-primary focus:outline-none transition"
            />
          </div>
        </div>

        {loading ? (
          <div className="w-full h-64 bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-500 gap-2">
            <BiLoaderAlt className="animate-spin text-xl text-primary" />
            <span className="text-xs font-medium">Loading purchases...</span>
          </div>
        ) : filteredPurchases.length > 0 ? (
          <div className="bg-white border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs text-slate-600">
                <thead className="bg-slate-100/70 text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th scope="col" className="px-4 py-3">Invoice # / Date</th>
                    <th scope="col" className="px-4 py-3">Branch</th>
                    <th scope="col" className="px-4 py-3">Supplier</th>
                    <th scope="col" className="px-4 py-3">Financials</th>
                    <th scope="col" className="px-4 py-3">Payments</th>
                    <th scope="col" className="px-4 py-3">Dues</th>
                    <th scope="col" className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 border-t border-slate-100 font-medium">
                  {filteredPurchases.map((purchase) => {
                    const due = parseFloat(purchase.due_amount) || 0
                    const isFullyPaid = due <= 0
                    
                    return (
                      <tr key={purchase.purchase_id} className="border-b border-slate-200 text-xs text-slate-700 hover:bg-slate-50 transition">
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-800 text-xs">
                              {purchase.invoice_no ? `#${purchase.invoice_no}` : `INV-PR-${purchase.purchase_id}`}
                            </span>
                            <span className="text-slate-400 text-[11px] flex items-center gap-1 mt-0.5">
                              <BiCalendar className="text-slate-400" />
                              {new Date(purchase.created_at).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-bold text-slate-700 text-[11px] bg-slate-100 border border-slate-200 px-2 py-0.5 inline-block">
                            {purchase.branch_name ? `${purchase.branch_name}${purchase.branch_code ? ` (${purchase.branch_code})` : ''}` : 'Main Branch'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-800 flex items-center gap-1">
                              <BiUser className="text-slate-400 text-xs" />
                              {purchase.supplier_name || 'Walk-in Supplier'}
                            </span>
                            {purchase.supplier_phone && (
                              <span className="text-slate-400 text-[11px] mt-0.5">{purchase.supplier_phone}</span>
                            )}
                            <span className="text-slate-400 text-[10px] mt-0.5 font-semibold">
                              Created by: {purchase.staff_name ? `${purchase.staff_name} (${purchase.staff_role || 'Staff'})` : 'System'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col text-xs gap-0.5">
                            <span className="text-slate-500">Subtotal: {formatCurrency(purchase.subtotal_amount)}</span>
                            {parseFloat(purchase.extra_discount) > 0 && (
                              <span className="text-rose-600">Discount: -{formatCurrency(purchase.extra_discount)}</span>
                            )}
                            <span className="font-bold text-slate-800 text-xs mt-0.5">
                              Total: {formatCurrency(purchase.total_amount)}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="font-bold text-primary text-xs">
                              {formatCurrency(purchase.total_paid)}
                            </span>
                            <span className="text-slate-400 text-[10px] uppercase font-semibold">
                              via {purchase.payment_method || 'Cash'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {isFullyPaid ? (
                            <span className="inline-block px-2 py-0.5 text-[10px] font-bold uppercase border bg-emerald-50 text-emerald-700 border-emerald-200">
                              Paid
                            </span>
                          ) : (
                            <div className="flex flex-col">
                              <span className="font-bold text-amber-600 text-xs">
                                {formatCurrency(purchase.due_amount)}
                              </span>
                              <span className="inline-block px-2 py-0.5 text-[10px] font-bold uppercase border bg-amber-50 text-amber-700 border-amber-200 mt-1 w-fit">
                                Unpaid Balance
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link
                              href={`/dashboard/purchase/${purchase.purchase_id}`}
                              title="View Invoice & Payments"
                              className="p-1.5 hover:bg-slate-100 text-slate-600 transition cursor-pointer border border-slate-200 shadow-xs"
                            >
                              <BiShow className="text-base" />
                            </Link>
                            <button
                              onClick={() => handleDelete(purchase.purchase_id)}
                              disabled={deletingId === purchase.purchase_id}
                              title="Delete Purchase & Revert Stock"
                              className="p-1.5 hover:bg-rose-50 text-slate-500 hover:text-rose-600 transition cursor-pointer border border-slate-200 shadow-xs disabled:opacity-50"
                            >
                              {deletingId === purchase.purchase_id ? (
                                <BiLoaderAlt className="animate-spin text-base" />
                              ) : (
                                <BiTrash className="text-base" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="w-full py-16 bg-white border border-slate-200 shadow-sm flex flex-col items-center justify-center text-slate-400 gap-2">
            <BiReceipt className="text-4xl text-slate-300" />
            <p className="font-bold text-slate-600 text-sm">No purchases found</p>
            <p className="text-xs text-slate-400">Try a different search query or add a purchase invoice above.</p>
          </div>
        )}

      </div>
    </div>
  )
}

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
      String(p.purchase_id).includes(term)
    )
  })

  // Format currency
  const formatCurrency = (val) => {
    const num = parseFloat(val) || 0
    return `৳${num.toFixed(2)}`
  }

  return (
    <div className={`w-full min-h-screen bg-slate-50 pt-20 pb-12 px-4 md:px-8 transition-all duration-300 ${dashSidebar ? 'lg:pl-68' : 'lg:pl-8'}`}>
      <div className="max-w-6xl mx-auto flex flex-col gap-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2 animate-fade-in">
              <BiReceipt className="text-emerald-600" />
              Procurement & Purchase Invoices
            </h1>
            <p className="text-slate-500 text-sm mt-0.5 animate-fade-in">Record goods ingestion, track supplier billing, and manage payments.</p>
          </div>
          <Link
            href="/dashboard/purchase/create"
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2 shadow-sm shadow-emerald-600/10 cursor-pointer self-start sm:self-auto"
          >
            <BiPlus className="text-lg" /> New Purchase Invoice
          </Link>
        </div>

        {/* Search bar */}
        <div className="flex items-center gap-3 bg-white p-4 rounded-xl border border-slate-100 shadow-sm animate-fade-in">
          <div className="flex-1 max-w-md relative">
            <BiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg" />
            <input className="input-style"
              type="text"
              placeholder="Search by invoice #, supplier name or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <div className="w-full h-64 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center justify-center text-slate-500 gap-2">
            <BiLoaderAlt className="animate-spin text-xl text-emerald-600" />
            <span>Loading purchases...</span>
          </div>
        ) : filteredPurchases.length > 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden animate-fade-in">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm text-slate-500">
                <thead className="bg-slate-50/75 text-xs font-semibold text-slate-700 uppercase border-b border-slate-100">
                  <tr>
                    <th scope="col" className="px-6 py-4">Invoice # / Date</th>
                    <th scope="col" className="px-6 py-4">Supplier</th>
                    <th scope="col" className="px-6 py-4">Financials</th>
                    <th scope="col" className="px-6 py-4">Payments</th>
                    <th scope="col" className="px-6 py-4">Dues</th>
                    <th scope="col" className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 border-t border-slate-100">
                  {filteredPurchases.map((purchase) => {
                    const due = parseFloat(purchase.due_amount) || 0
                    const isFullyPaid = due <= 0
                    
                    return (
                      <tr key={purchase.purchase_id} className="hover:bg-slate-50/50 transition">
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-800 text-sm">
                              {purchase.invoice_no ? `#${purchase.invoice_no}` : `INV-PR-${purchase.purchase_id}`}
                            </span>
                            <span className="text-slate-400 text-xs flex items-center gap-1 mt-0.5">
                              <BiCalendar className="text-slate-400" />
                              {new Date(purchase.created_at).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-medium text-slate-800 flex items-center gap-1">
                              <BiUser className="text-slate-400 text-xs" />
                              {purchase.supplier_name || 'Walk-in Supplier'}
                            </span>
                            {purchase.supplier_phone && (
                              <span className="text-slate-400 text-xs mt-0.5">{purchase.supplier_phone}</span>
                            )}
                            <span className="text-slate-400 text-[10px] mt-1 font-semibold">
                              Created by: {purchase.staff_name ? `${purchase.staff_name} (${purchase.staff_role || 'Staff'})` : 'System'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col text-xs gap-0.5">
                            <span className="text-slate-650">Subtotal: {formatCurrency(purchase.subtotal_amount)}</span>
                            {parseFloat(purchase.extra_discount) > 0 && (
                              <span className="text-rose-600">Discount: -{formatCurrency(purchase.extra_discount)}</span>
                            )}
                            <span className="font-semibold text-slate-800 text-sm mt-0.5">
                              Total: {formatCurrency(purchase.total_amount)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-semibold text-emerald-700 text-sm">
                              {formatCurrency(purchase.total_paid)}
                            </span>
                            <span className="text-slate-450 text-xxs mt-0.5 font-medium uppercase tracking-wider">
                              via {purchase.payment_method || 'Cash'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {isFullyPaid ? (
                            <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                              Paid
                            </span>
                          ) : (
                            <div className="flex flex-col">
                              <span className="font-semibold text-amber-600 text-sm">
                                {formatCurrency(purchase.due_amount)}
                              </span>
                              <span className="inline-flex w-fit px-1.5 py-0.2 mt-0.5 rounded text-xxs font-semibold bg-amber-50 text-amber-700">
                                Unpaid Balance
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/dashboard/purchase/${purchase.purchase_id}`}
                              title="View Invoice & Payments"
                              className="p-2 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-lg transition"
                            >
                              <BiShow className="text-xl" />
                            </Link>
                            <button
                              onClick={() => handleDelete(purchase.purchase_id)}
                              disabled={deletingId === purchase.purchase_id}
                              title="Delete Purchase & Revert Stock"
                              className="p-2 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition disabled:opacity-50"
                            >
                              {deletingId === purchase.purchase_id ? (
                                <BiLoaderAlt className="animate-spin text-lg" />
                              ) : (
                                <BiTrash className="text-lg" />
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
          <div className="w-full py-16 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-slate-400 gap-2 animate-fade-in">
            <BiReceipt className="text-4xl text-slate-300" />
            <p className="font-semibold text-slate-600">No purchases found</p>
            <p className="text-xs text-slate-400 mt-0.5">Try a different search query or add a purchase invoice above.</p>
          </div>
        )}

      </div>
    </div>
  )
}

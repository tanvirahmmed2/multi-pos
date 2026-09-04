'use client'
import React, { useContext, useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Context } from '@/component/helper/Context'
import { 
  BiChevronLeft, 
  BiPrinter, 
  BiTrash, 
  BiLoaderAlt, 
  BiDollarCircle, 
  BiPlusCircle,
  BiCalendar,
  BiUser,
  BiCreditCard,
  BiDetail,
  BiStore
} from 'react-icons/bi'

export default function PurchaseDetailPage() {
  const { dashSidebar, currencySymbol, formatCurrency } = useContext(Context)
  const router = useRouter()
  const params = useParams()
  const { id } = params

  const [purchase, setPurchase] = useState(null)
  const [fetching, setFetching] = useState(true)
  const [deleting, setDeleting] = useState(false)

  const [amountPaid, setAmountPaid] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('Cash')
  const [transactionId, setTransactionId] = useState('')
  const [paying, setPaying] = useState(false)

  const fetchPurchaseDetails = async () => {
    if (!id) return
    try {
      const res = await axios.get(`/api/purchase/${id}`)
      setPurchase(res.data)
      const due = parseFloat(res.data.due_amount) || 0
      setAmountPaid(due > 0 ? String(due) : '')
    } catch (err) {
      toast.error('Failed to load purchase invoice details')
      console.error(err)
    } finally {
      setFetching(false)
    }
  }

  useEffect(() => {
    fetchPurchaseDetails()
  }, [id])

  const handleDelete = async () => {
    if (!window.confirm('WARNING: Deleting this invoice will REVERT stock levels of the purchase items and delete all associated payments. Are you sure you want to proceed?')) {
      return
    }
    setDeleting(true)
    try {
      await axios.delete(`/api/purchase/${id}`)
      toast.success('Purchase invoice deleted successfully')
      router.push('/dashboard/purchase')
      router.refresh()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete purchase invoice')
      console.error(err)
    } finally {
      setDeleting(false)
    }
  }

  const handleLogPayment = async (e) => {
    e.preventDefault()
    const amt = parseFloat(amountPaid)
    if (isNaN(amt) || amt <= 0) {
      toast.error('Please enter a valid positive payment amount')
      return
    }

    const due = parseFloat(purchase.due_amount) || 0
    if (amt > due + 0.01) {
      toast.error(`Payment exceeds remaining due of ${formatCurrency(due)}`)
      return
    }

    setPaying(true)
    try {
      await axios.post(`/api/purchase/${id}/payment`, {
        amount_paid: amt,
        payment_method: paymentMethod,
        transaction_id: transactionId
      })
      toast.success('Payment logged successfully')
      setTransactionId('')
      fetchPurchaseDetails()
      router.refresh()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to record subsequent payment')
      console.error(err)
    } finally {
      setPaying(false)
    }
  }

  if (fetching) {
    return (
      <div className={`w-full min-h-screen bg-slate-50 pt-20 pb-12 px-4 md:px-8 transition-all duration-300 ${dashSidebar ? 'lg:pl-68' : 'lg:pl-8'} flex items-center justify-center print:hidden`}>
        <div className="flex items-center gap-2 text-slate-500 font-semibold">
          <BiLoaderAlt className="animate-spin text-xl text-primary" />
          <span>Fetching invoice details...</span>
        </div>
      </div>
    )
  }

  if (!purchase) {
    return (
      <div className={`w-full min-h-screen bg-slate-50 pt-20 pb-12 px-4 md:px-8 transition-all duration-300 ${dashSidebar ? 'lg:pl-68' : 'lg:pl-8'} flex items-center justify-center print:hidden`}>
        <div className="text-slate-400 font-semibold text-center">Purchase invoice not found.</div>
      </div>
    )
  }

  const due = parseFloat(purchase.due_amount) || 0
  const isFullyPaid = due <= 0

  return (
    <div className={`w-full min-h-screen bg-slate-50 pt-20 pb-12 px-4 md:px-8 transition-all duration-300 ${
      dashSidebar ? 'lg:pl-68' : 'lg:pl-8'
    } print:bg-white print:p-0 print:pt-0`}>
      <div className="max-w-4xl mx-auto flex flex-col gap-6">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 print:hidden">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/purchase" className="p-2 bg-white hover:bg-slate-55 border border-slate-200 rounded-xl transition text-slate-500 hover:text-slate-800">
              <BiChevronLeft className="text-xl" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-slate-800 flex items-center gap-1.5">
                <BiDetail className="text-primary" />
                Invoice Detail
              </h1>
              <p className="text-slate-500 text-xs mt-0.5">Invoice ID: #{purchase.purchase_id}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-semibold transition border border-slate-200 shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <BiPrinter className="text-lg" /> Print Invoice
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-sm font-semibold transition border border-rose-200 shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {deleting ? (
                <BiLoaderAlt className="animate-spin" />
              ) : (
                <BiTrash className="text-lg" />
              )}
              Delete & Revert
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 md:p-8 flex flex-col gap-6 relative overflow-hidden print:shadow-none print:border-none">
          
          <div className="absolute top-4 right-4 print:hidden">
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
              isFullyPaid ? 'bg-primary/10 text-primary-dark border border-primary/20' : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}>
              {isFullyPaid ? 'Fully Paid' : 'Due Outstanding'}
            </span>
          </div>

          <div className="flex flex-col md:flex-row justify-between gap-4 border-b border-slate-100 pb-6">
            <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">E-COMMERCE SYSTEM</h2>
              <p className="text-slate-450 text-xs mt-0.5">Procurement Management Division</p>
            </div>
            <div className="text-left md:text-right">
              <h3 className="text-slate-450 text-xs font-bold uppercase tracking-wider">Purchase Invoice</h3>
              <p className="font-mono text-slate-800 text-lg font-bold mt-0.5">
                {purchase.invoice_no ? `#${purchase.invoice_no}` : `INV-PR-${purchase.purchase_id}`}
              </p>
              <p className="text-slate-450 text-xs mt-1 flex md:justify-end items-center gap-1">
                <BiCalendar />
                {new Date(purchase.created_at).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50 p-5 rounded-2xl border border-slate-200/50 print:bg-white print:border-slate-100 print:p-2">
            <div>
              <h4 className="text-xxs font-bold text-slate-400 uppercase tracking-widest">Target Branch</h4>
              <p className="font-bold text-slate-850 mt-1 flex items-center gap-1.5 text-xs">
                <BiStore className="text-primary text-sm" />
                {purchase.branch_name ? `${purchase.branch_name}${purchase.branch_code ? ` (${purchase.branch_code})` : ''}` : 'Main Branch'}
              </p>
            </div>

            <div>
              <h4 className="text-xxs font-bold text-slate-400 uppercase tracking-widest">Billing From (Supplier)</h4>
              <p className="font-bold text-slate-850 mt-1 flex items-center gap-1.5 text-xs">
                <BiUser className="text-slate-400" />
                {purchase.supplier_name || 'Walk-in Supplier'}
              </p>
              {purchase.supplier_phone && (
                <p className="text-xs text-slate-500 mt-1">Phone: {purchase.supplier_phone}</p>
              )}
            </div>
            
            <div>
              <h4 className="text-xxs font-bold text-slate-400 uppercase tracking-widest">Created & Processed By</h4>
              <p className="font-bold text-slate-800 mt-1 flex items-center gap-1.5 text-xs">
                <BiUser className="text-primary" />
                {purchase.staff_name ? `${purchase.staff_name} (${purchase.staff_role || 'Staff'})` : 'System Administrator'}
              </p>
              {purchase.staff_email && (
                <p className="text-xs text-slate-500 mt-0.5 font-mono">{purchase.staff_email}</p>
              )}
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">Line Items</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-semibold text-xs border-b border-slate-200 uppercase print:bg-white print:border-b-2 print:border-slate-300">
                    <th scope="col" className="px-4 py-2.5">Product Asset / Details</th>
                    <th scope="col" className="px-4 py-2.5 text-center">Quantity</th>
                    <th scope="col" className="px-4 py-2.5 text-right">Cost Price</th>
                    <th scope="col" className="px-4 py-2.5 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {purchase.items?.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/20">
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-800">{item.product_name || 'Deleted Product'}</span>
                          {item.variant_name && (
                            <span className="text-slate-500 text-xs mt-0.5">Variant: {item.variant_name}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center text-slate-700">{item.quantity}</td>
                      <td className="px-4 py-3 text-right text-slate-700">{formatCurrency(item.purchase_price)}</td>
                      <td className="px-4 py-3 text-right font-medium text-slate-850">
                        {formatCurrency(parseFloat(item.quantity) * parseFloat(item.purchase_price))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <div className="w-full md:w-80 flex flex-col gap-2.5 text-sm text-slate-650">
              <div className="flex justify-between">
                <span>Subtotal Invoice:</span>
                <span className="font-medium text-slate-850">{formatCurrency(purchase.subtotal_amount)}</span>
              </div>
              {parseFloat(purchase.extra_discount) > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>Extra Discount:</span>
                  <span>-{formatCurrency(purchase.extra_discount)}</span>
                </div>
              )}
              <hr className="border-slate-100" />
              <div className="flex justify-between text-base font-bold text-slate-800">
                <span>Total Amount:</span>
                <span>{formatCurrency(purchase.total_amount)}</span>
              </div>
              <div className="flex justify-between text-primary-dark font-semibold">
                <span>Total Amount Paid:</span>
                <span>{formatCurrency(purchase.total_paid)}</span>
              </div>
              
              <div className="flex justify-between p-2 rounded-xl bg-slate-55 bg-slate-50/75 border border-slate-150 items-center">
                <span className="font-semibold text-slate-700">Remaining Balance:</span>
                <span className={`text-base font-bold ${due > 0 ? 'text-amber-600' : 'text-primary-dark'}`}>
                  {formatCurrency(purchase.due_amount)}
                </span>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6 mt-2">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">Payments Ledger</h4>
            {purchase.payments && purchase.payments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100 uppercase print:bg-white print:border-b-2 print:border-slate-200">
                      <th scope="col" className="px-3 py-2">Payment Date</th>
                      <th scope="col" className="px-3 py-2">Method</th>
                      <th scope="col" className="px-3 py-2">Transaction ID</th>
                      <th scope="col" className="px-3 py-2 text-right">Amount Paid</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {purchase.payments.map((p) => (
                      <tr key={p.payment_id}>
                        <td className="px-3 py-2.5 text-slate-650">
                          {new Date(p.payment_date).toLocaleString()}
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="font-medium text-slate-800">{p.payment_method || 'Cash'}</span>
                        </td>
                        <td className="px-3 py-2.5 text-slate-500 font-mono">
                          {p.transaction_id || 'N/A'}
                        </td>
                        <td className="px-3 py-2.5 text-right font-semibold text-primary-dark">
                          {formatCurrency(p.amount_paid)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-slate-450 italic">No payment record found for this invoice.</p>
            )}
          </div>

        </div>

        {!isFullyPaid && (
          <form onSubmit={handleLogPayment} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col gap-4 print:hidden animate-fade-in">
            <div className="border-b border-slate-50 pb-2 flex items-center gap-1.5">
              <BiPlusCircle className="text-primary text-lg" />
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Log Invoice Payment</h2>
            </div>
            
            <p className="text-slate-500 text-xs">
              Log an incremental payment received by the supplier against the outstanding due balance of <span className="font-bold text-amber-600">{formatCurrency(due)}</span>.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase">Payment Amount *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-450 text-xs">{currencySymbol}</span>
                  <input className="input-style pl-7"
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={due}
                    required
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-850 text-sm focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
                >
                  <option value="Cash">Cash</option>
                  <option value="Card">Credit/Debit Card</option>
                  <option value="Mobile Banking">Mobile Banking</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase">Transaction ID</label>
                <input className="input-style"
                  type="text"
                  placeholder="Optional reference ID"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-4 border-t border-slate-100 pt-4">
              <button
                type="submit"
                disabled={paying}
                className="px-5 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl text-sm font-semibold transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-sm shadow-primary/10"
              >
                {paying ? (
                  <>
                    <BiLoaderAlt className="animate-spin text-lg" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <BiDollarCircle className="text-lg" /> Log Payment
                  </>
                )}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  )
}

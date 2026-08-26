'use client'
import React, { useState, useEffect, useContext } from 'react'
import { Context } from '@/component/helper/Context'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import toast from 'react-hot-toast'
import { printReceipt } from '@/lib/printreceipt'
import { 
  BiCheckCircle, 
  BiSolidTruck, 
  BiRefresh, 
  BiLoaderAlt,
  BiPrinter,
  BiTrash,
  BiUndo,
  BiDotsVerticalRounded,
  BiShow,
  BiXCircle,
  BiX,
  BiDollarCircle
} from 'react-icons/bi'

export default function ConfirmedSalesPage() {
  const router = useRouter()
  const { dashSidebar, website } = useContext(Context)

  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [courierNames, setCourierNames] = useState({})
  const [courierTrackingIds, setCourierTrackingIds] = useState({})
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20

  // 3-dot dropdown menu state
  const [openMenuId, setOpenMenuId] = useState(null)

  // Payment modal state
  const [paymentModalOrder, setPaymentModalOrder] = useState(null)
  const [paymentTargetStatus, setPaymentTargetStatus] = useState('')
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [paymentNote, setPaymentNote] = useState('')
  const [submittingPayment, setSubmittingPayment] = useState(false)

  const handleCourierChange = (orderId, field, value) => {
    if (field === 'name') {
      setCourierNames(prev => ({ ...prev, [orderId]: value }))
    } else {
      setCourierTrackingIds(prev => ({ ...prev, [orderId]: value }))
    }
  }

  const fetchConfirmedOrders = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/api/sale?status=confirmed')
      setOrders(res.data || [])
      setCurrentPage(1)
    } catch (err) {
      console.error('Failed to load confirmed orders:', err)
      toast.error('Failed to fetch confirmed orders')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchConfirmedOrders()
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.action-menu-container')) {
        setOpenMenuId(null)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  const handleUpdateStatus = async (orderId, newStatus) => {
    const confirmMsg = `Change order status to "${newStatus}"?`
    if (!window.confirm(confirmMsg)) return

    const toastId = toast.loading(`Updating order #${orderId} status...`)
    try {
      const payload = { status: newStatus }
      if (newStatus === 'out_for_delivery') {
        payload.courier_name = courierNames[orderId] || '';
        payload.courier_tracking_id = courierTrackingIds[orderId] || '';
      }
      await axios.put(`/api/sale/${orderId}`, payload)
      toast.success(`Order #${orderId} status changed to ${newStatus}`, { id: toastId })
      fetchConfirmedOrders()
    } catch (err) {
      console.error('Failed to update order status:', err)
      toast.error(err.response?.data?.error || `Failed to update status to ${newStatus}`, { id: toastId })
    }
  }

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm(`Are you sure you want to cancel order #${orderId}? Items will be restocked and no payment will be recorded.`)) return
    const toastId = toast.loading(`Cancelling order #${orderId}...`)
    try {
      await axios.put(`/api/sale/${orderId}`, { status: 'cancelled' })
      toast.success(`Order #${orderId} marked as cancelled & restocked`, { id: toastId })
      fetchConfirmedOrders()
    } catch (err) {
      console.error('Failed to cancel order:', err)
      toast.error(err.response?.data?.error || 'Failed to cancel order', { id: toastId })
    }
  }

  const openPaymentModal = (order, targetStatus) => {
    setPaymentModalOrder(order)
    setPaymentTargetStatus(targetStatus)
    setPaymentAmount(order.due_amount || order.total_amount || 0)
    setPaymentMethod('cash')
    setPaymentNote('')
    setOpenMenuId(null)
  }

  const handlePaymentSubmit = async (e) => {
    e.preventDefault()
    if (!paymentModalOrder) return

    const toastId = toast.loading(`Processing order #${paymentModalOrder.order_id}...`)
    setSubmittingPayment(true)
    try {
      await axios.put(`/api/sale/${paymentModalOrder.order_id}`, {
        status: paymentTargetStatus,
        payment_amount: paymentAmount ? parseFloat(paymentAmount) : 0,
        payment_method: paymentMethod,
        note: paymentNote
      })
      toast.success(`Order #${paymentModalOrder.order_id} marked as ${paymentTargetStatus}`, { id: toastId })
      setPaymentModalOrder(null)
      fetchConfirmedOrders()
    } catch (err) {
      console.error('Failed to update order payment:', err)
      toast.error(err.response?.data?.error || 'Failed to process update', { id: toastId })
    } finally {
      setSubmittingPayment(false)
    }
  }

  const handleReturnOrder = async (orderId) => {
    if (!window.confirm(`Are you sure you want to mark order #${orderId} as returned? Items will be restocked.`)) return
    const toastId = toast.loading(`Processing return for order #${orderId}...`)
    try {
      await axios.put(`/api/sale/${orderId}`, { status: 'returned' })
      toast.success(`Order #${orderId} marked as returned`, { id: toastId })
      fetchConfirmedOrders()
    } catch (err) {
      console.error('Failed to return order:', err)
      toast.error(err.response?.data?.error || 'Failed to process return', { id: toastId })
    }
  }

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm(`Are you sure you want to delete order #${orderId}? This action cannot be undone.`)) return
    const toastId = toast.loading(`Deleting order #${orderId}...`)
    try {
      await axios.delete(`/api/sale/${orderId}`)
      toast.success(`Order #${orderId} deleted successfully`, { id: toastId })
      fetchConfirmedOrders()
    } catch (err) {
      console.error('Failed to delete order:', err)
      toast.error(err.response?.data?.error || 'Failed to delete order', { id: toastId })
    }
  }

  const totalPages = Math.ceil(orders.length / itemsPerPage) || 1
  const startIndex = (currentPage - 1) * itemsPerPage
  const currentOrders = orders.slice(startIndex, startIndex + itemsPerPage)

  return (
    <div className={`w-full min-h-screen bg-slate-50 pt-20 pb-12 px-2 sm:px-4 md:px-8 transition-all duration-300 ${dashSidebar ? 'lg:pl-68' : 'lg:pl-8'}`}>
      <div className="w-full flex flex-col gap-6">
        
        {/* Header section */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">Confirmed Orders Desk</h1>
            <p className="text-xs text-slate-500 mt-0.5">Review orders that are confirmed and ready for dispatch or delivery.</p>
          </div>
          <button
            onClick={fetchConfirmedOrders}
            disabled={loading}
            className="p-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 transition cursor-pointer shadow-sm disabled:opacity-40"
            title="Refresh Orders"
          >
            <BiRefresh className={`text-lg ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Orders list container */}
        {loading ? (
          <div className="w-full py-20 flex flex-col items-center justify-center gap-2">
            <BiLoaderAlt className="animate-spin text-4xl text-slate-800" />
            <p className="text-slate-500 text-xs font-semibold animate-pulse">Fetching confirmed orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="w-full bg-white border border-slate-200 py-16 px-6 text-center flex flex-col items-center gap-3 shadow-sm">
            <div className="w-12 h-12 bg-slate-100 flex items-center justify-center text-slate-400 text-2xl">
              <BiCheckCircle />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">No Confirmed Orders</h3>
              <p className="text-slate-500 text-xs mt-1">There are no orders currently sitting in the confirmed queue.</p>
            </div>
          </div>
        ) : (
          <div className="w-full bg-white border border-slate-200 shadow-sm">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-100/80 text-slate-650 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-2 sm:px-3 py-3 text-center">Order ID</th>
                  <th className="hidden sm:table-cell px-2 sm:px-3 py-3">Date</th>
                  <th className="px-2 sm:px-3 py-3">Customer</th>
                  <th className="hidden lg:table-cell px-2 sm:px-3 py-3">Products</th>
                  <th className="hidden 2xl:table-cell px-2 sm:px-3 py-3 text-right">Subtotal</th>
                  <th className="hidden 2xl:table-cell px-2 sm:px-3 py-3 text-right">Discount</th>
                  <th className="hidden 2xl:table-cell px-2 sm:px-3 py-3 text-right">Shipping</th>
                  <th className="px-2 sm:px-3 py-3 text-right">Total</th>
                  <th className="hidden xl:table-cell px-2 sm:px-3 py-3 text-right">Paid</th>
                  <th className="hidden xl:table-cell px-2 sm:px-3 py-3 text-right">Due</th>
                  <th className="hidden md:table-cell px-2 sm:px-3 py-3">Courier Dispatch</th>
                  <th className="px-2 sm:px-3 py-3 text-center">Status</th>
                  <th className="px-2 sm:px-3 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
                {currentOrders.map((order) => {
                  const productsSummary = order.items
                    ? order.items.map(item => `${item.product_name}${item.variant_name ? ` (${item.variant_name})` : ''} x${item.quantity}`).join(', ')
                    : 'N/A'
                  const paidAmount = parseFloat(order.total_amount || 0) - parseFloat(order.due_amount || 0)
                  const isMenuOpen = openMenuId === order.order_id

                  return (
                    <tr key={order.order_id} className="hover:bg-slate-50/70 transition">
                      <td className="px-2 sm:px-3 py-3.5 text-center font-bold font-mono text-slate-800">#{order.order_id}</td>
                      <td className="hidden sm:table-cell px-2 sm:px-3 py-3.5 whitespace-nowrap text-slate-500 font-mono text-[11px]">{new Date(order.created_at).toLocaleDateString()}</td>
                      <td className="px-2 sm:px-3 py-3.5">
                        <div className="font-semibold text-slate-800">{order.customer_name || 'Guest'}</div>
                        <div className="text-[10px] font-mono text-slate-500">{order.phone}</div>
                        <div className="hidden sm:block text-[10px] text-slate-400 truncate max-w-[130px]" title={order.shipping_address}>{order.shipping_address}</div>
                        {order.note && (
                          <div className="text-[9px] text-rose-500 italic mt-0.5" title={order.note}>Note: "{order.note}"</div>
                        )}
                      </td>
                      <td className="hidden lg:table-cell px-2 sm:px-3 py-3.5 text-slate-500 max-w-[150px] truncate" title={productsSummary}>
                        {productsSummary}
                      </td>
                      <td className="hidden 2xl:table-cell px-2 sm:px-3 py-3.5 text-right font-medium">৳{parseFloat(order.subtotal_amount || 0).toFixed(2)}</td>
                      <td className="hidden 2xl:table-cell px-2 sm:px-3 py-3.5 text-right text-rose-500">৳{parseFloat(order.total_discount_amount || 0).toFixed(2)}</td>
                      <td className="hidden 2xl:table-cell px-2 sm:px-3 py-3.5 text-right">৳{parseFloat(order.delivery_charge || 0).toFixed(2)}</td>
                      <td className="px-2 sm:px-3 py-3.5 text-right font-bold text-slate-900">৳{parseFloat(order.total_amount || 0).toFixed(2)}</td>
                      <td className="hidden xl:table-cell px-2 sm:px-3 py-3.5 text-right text-emerald-600 font-bold">৳{paidAmount.toFixed(2)}</td>
                      <td className="hidden xl:table-cell px-2 sm:px-3 py-3.5 text-right text-rose-600 font-bold">৳{parseFloat(order.due_amount || 0).toFixed(2)}</td>
                      <td className="hidden md:table-cell px-2 sm:px-3 py-3.5">
                        <div className="flex flex-col gap-1 w-36">
                          <input 
                            type="text"
                            placeholder="Courier Name"
                            value={courierNames[order.order_id] || order.courier_name || ''}
                            onChange={(e) => handleCourierChange(order.order_id, 'name', e.target.value)}
                            className="px-2 py-1 border border-slate-200 text-slate-800 text-[10px] outline-none bg-white"
                          />
                          <input 
                            type="text"
                            placeholder="Tracking ID"
                            value={courierTrackingIds[order.order_id] || order.courier_tracking_id || ''}
                            onChange={(e) => handleCourierChange(order.order_id, 'tracking', e.target.value)}
                            className="px-2 py-1 border border-slate-200 text-slate-800 text-[10px] outline-none bg-white"
                          />
                        </div>
                      </td>
                      <td className="px-2 sm:px-3 py-3.5 text-center">
                        <span className="px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold uppercase border border-emerald-200 bg-emerald-50 text-emerald-700">
                          {order.status}
                        </span>
                      </td>
                      <td className="px-2 sm:px-3 py-3.5 text-center relative action-menu-container">
                        
                        {/* 3-Dot Action Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setOpenMenuId(isMenuOpen ? null : order.order_id)
                          }}
                          className="p-1.5 hover:bg-slate-100 text-slate-700 transition cursor-pointer border border-slate-200 shadow-xs"
                          title="Actions Menu"
                        >
                          <BiDotsVerticalRounded className="text-lg" />
                        </button>

                        {/* Dropdown Menu */}
                        {isMenuOpen && (
                          <div className="absolute right-2 top-11 w-44 bg-white border border-slate-200 shadow-lg z-30 flex flex-col divide-y divide-slate-100 py-1 text-left">
                            <button
                              onClick={() => {
                                setOpenMenuId(null)
                                router.push(`/dashboard/orders/${order.order_id}`)
                              }}
                              className="w-full px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition cursor-pointer"
                            >
                              <BiShow className="text-slate-500 text-base" /> Preview
                            </button>

                            <button
                              onClick={() => {
                                setOpenMenuId(null)
                                handleUpdateStatus(order.order_id, 'out_for_delivery')
                              }}
                              className="w-full px-3 py-2 text-xs font-bold text-sky-700 hover:bg-sky-50 flex items-center gap-2 transition cursor-pointer"
                            >
                              <BiSolidTruck className="text-sky-600 text-base" /> Dispatch Courier
                            </button>

                            <button
                              onClick={() => openPaymentModal(order, 'delivered')}
                              className="w-full px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-50 flex items-center gap-2 transition cursor-pointer"
                            >
                              <BiCheckCircle className="text-emerald-600 text-base" /> Deliver Direct
                            </button>

                            <button
                              onClick={() => {
                                setOpenMenuId(null)
                                printReceipt(order, website)
                              }}
                              className="w-full px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition cursor-pointer"
                            >
                              <BiPrinter className="text-slate-500 text-base" /> Print Receipt
                            </button>

                            <button
                              onClick={() => {
                                setOpenMenuId(null)
                                handleReturnOrder(order.order_id)
                              }}
                              className="w-full px-3 py-2 text-xs font-bold text-amber-700 hover:bg-amber-50 flex items-center gap-2 transition cursor-pointer"
                            >
                              <BiUndo className="text-amber-600 text-base" /> Return Order
                            </button>

                            <button
                              onClick={() => {
                                setOpenMenuId(null)
                                handleCancelOrder(order.order_id)
                              }}
                              className="w-full px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition cursor-pointer"
                            >
                              <BiXCircle className="text-rose-600 text-base" /> Cancel
                            </button>

                            <button
                              onClick={() => {
                                setOpenMenuId(null)
                                handleDeleteOrder(order.order_id)
                              }}
                              className="w-full px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 flex items-center gap-2 transition cursor-pointer"
                            >
                              <BiTrash className="text-rose-700 text-base" /> Delete
                            </button>
                          </div>
                        )}

                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {/* Simple Pagination Bar */}
            {orders.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-slate-200 bg-slate-50/50 text-xs">
                <div className="text-slate-500">
                  Showing <span className="font-semibold text-slate-700">{startIndex + 1}</span> to <span className="font-semibold text-slate-700">{Math.min(startIndex + itemsPerPage, orders.length)}</span> of <span className="font-semibold text-slate-700">{orders.length}</span> orders
                </div>
                
                {totalPages > 1 && (
                  <div className="flex items-center gap-1 flex-wrap">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer font-medium"
                    >
                      Previous
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(page => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
                      .map((page, index, array) => {
                        const showEllipsisBefore = index > 0 && page - array[index - 1] > 1
                        return (
                          <React.Fragment key={page}>
                            {showEllipsisBefore && <span className="px-1 text-slate-400">...</span>}
                            <button
                              onClick={() => setCurrentPage(page)}
                              className={`px-3 py-1.5 border text-xs font-semibold transition cursor-pointer ${
                                currentPage === page
                                  ? 'bg-slate-900 text-white border-slate-900'
                                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              {page}
                            </button>
                          </React.Fragment>
                        )
                      })}

                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer font-medium"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* PAYMENT MODAL */}
      {paymentModalOrder && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-md border border-slate-200 shadow-xl flex flex-col">
            
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <BiDollarCircle className="text-primary text-xl" />
                <h3 className="font-bold text-slate-800 text-sm capitalize">
                  {paymentTargetStatus} Order #{paymentModalOrder.order_id}
                </h3>
              </div>
              <button 
                onClick={() => setPaymentModalOrder(null)}
                className="p-1 hover:bg-slate-200 text-slate-500 transition cursor-pointer"
              >
                <BiX className="text-xl" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handlePaymentSubmit} className="p-5 flex flex-col gap-4">
              
              {/* Order Info Summary */}
              <div className="bg-slate-50 border border-slate-200 p-3.5 flex flex-col gap-1.5 text-xs text-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-500">Customer:</span>
                  <span className="font-bold text-slate-800">{paymentModalOrder.customer_name || 'Guest'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Order Amount:</span>
                  <span className="font-mono font-bold text-slate-900">৳{parseFloat(paymentModalOrder.total_amount || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Current Due Balance:</span>
                  <span className="font-mono font-bold text-rose-600">৳{parseFloat(paymentModalOrder.due_amount || 0).toFixed(2)}</span>
                </div>
              </div>

              {/* Payment Amount Input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase">
                  Payment Received Amount (৳)
                </label>
                <input 
                  type="number"
                  step="0.01"
                  min="0"
                  max={paymentModalOrder.due_amount || paymentModalOrder.total_amount || 999999}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full text-xs text-slate-800 bg-white border border-slate-200 px-3 py-2 font-mono outline-none"
                  placeholder="Enter amount collected..."
                />
                <span className="text-[10px] text-slate-400">Leave at 0 if no payment collected at this stage.</span>
              </div>

              {/* Payment Method Select */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full text-xs text-slate-800 bg-white border border-slate-200 px-3 py-2 outline-none cursor-pointer"
                >
                  <option value="cash">Cash Payment</option>
                  <option value="bkash">bKash Mobile Banking</option>
                  <option value="nagad">Nagad Mobile Banking</option>
                  <option value="rocket">Rocket Mobile Banking</option>
                  <option value="card">Debit / Credit Card</option>
                  <option value="bank_transfer">Bank Wire Transfer</option>
                </select>
              </div>

              {/* Optional Payment Note */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase">
                  Payment Note (Optional)
                </label>
                <input
                  type="text"
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  className="w-full text-xs text-slate-800 bg-white border border-slate-200 px-3 py-2 outline-none"
                  placeholder="Transaction ref or note..."
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => setPaymentModalOrder(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPayment}
                  className="px-4 py-2 bg-primary hover:bg-primary-dark text-white text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  {submittingPayment ? (
                    <>
                      <BiLoaderAlt className="animate-spin text-sm" /> Processing...
                    </>
                  ) : (
                    `Save & Set ${paymentTargetStatus}`
                  )}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  )
}

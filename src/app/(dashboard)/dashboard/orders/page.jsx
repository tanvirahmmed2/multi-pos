'use client'
import React, { useContext, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Context } from '@/component/helper/Context'
import { printReceipt } from '@/lib/printreceipt'
import { 
  BiSearch, 
  BiPrinter, 
  BiLoaderAlt, 
  BiShieldQuarter, 
  BiRefresh,
  BiTrash,
  BiUndo,
  BiDotsVerticalRounded,
  BiShow,
  BiPlus,
  BiFilterAlt,
  BiCheckCircle,
  BiTimeFive,
  BiXCircle,
  BiPackage,
  BiSolidTruck
} from 'react-icons/bi'

export default function OrdersPage() {
  const router = useRouter()
  const { dashSidebar, user, loading: userLoading, website } = useContext(Context)
  
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 15

  const [openMenuId, setOpenMenuId] = useState(null)
  const [updatingId, setUpdatingId] = useState(null)

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const statusParam = statusFilter !== 'all' ? `?status=${statusFilter}` : ''
      const res = await axios.get(`/api/sale${statusParam}`)
      setOrders(res.data || [])
      setCurrentPage(1)
    } catch (err) {
      console.error('Failed to load orders:', err)
      toast.error('Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (userLoading) return
    if (user && ['admin', 'manager', 'sales'].includes(user.role)) {
      fetchOrders()
    }
  }, [user, userLoading, statusFilter])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.action-menu-container')) {
        setOpenMenuId(null)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdatingId(orderId)
    const toastId = toast.loading(`Updating order #${orderId} status...`)
    try {
      await axios.put(`/api/sale/${orderId}`, { status: newStatus })
      toast.success(`Order #${orderId} status set to ${newStatus.replace(/_/g, ' ')}`, { id: toastId })
      setOrders(prev => prev.map(o => o.order_id === orderId ? { ...o, status: newStatus } : o))
    } catch (err) {
      console.error('Failed to update status:', err)
      toast.error(err.response?.data?.error || 'Failed to update order status', { id: toastId })
    } finally {
      setUpdatingId(null)
    }
  }

  const handleReturnOrder = async (orderId) => {
    if (!window.confirm(`Are you sure you want to mark order #${orderId} as returned? Items will be restocked.`)) return
    const toastId = toast.loading(`Processing return for order #${orderId}...`)
    try {
      await axios.put(`/api/sale/${orderId}`, { status: 'returned' })
      toast.success(`Order #${orderId} marked as returned & restocked`, { id: toastId })
      fetchOrders()
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
      fetchOrders()
    } catch (err) {
      console.error('Failed to delete order:', err)
      toast.error(err.response?.data?.error || 'Failed to delete order', { id: toastId })
    }
  }

  if (userLoading || (loading && orders.length === 0)) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-2">
          <BiLoaderAlt className="animate-spin text-4xl text-slate-800" />
          <p className="text-slate-600 text-xs font-semibold animate-pulse">Loading orders...</p>
        </div>
      </div>
    )
  }

  if (!user || !['admin', 'manager', 'sales'].includes(user.role)) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center max-w-md">
          <BiShieldQuarter className="text-5xl text-rose-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-slate-900 mb-1">Access Restricted</h2>
          <p className="text-slate-500 text-sm mb-4">You do not have permission to view orders desk.</p>
          <Link href="/dashboard" className="inline-block px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold">
            Return to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  const filteredOrders = orders.filter(order => {
    const query = search.toLowerCase().trim()
    if (!query) return true
    return (
      order.order_id.toString().includes(query) ||
      (order.customer_name && order.customer_name.toLowerCase().includes(query)) ||
      (order.phone && order.phone.includes(query)) ||
      (order.branch_name && order.branch_name.toLowerCase().includes(query))
    )
  })

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage) || 1
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  return (
    <div className={`w-full min-h-screen bg-slate-50/50 pt-20 pb-12 px-4 md:px-6 transition-all duration-300 ${dashSidebar ? 'lg:pl-68' : 'lg:pl-8'}`}>
      <div className="w-full  flex flex-col gap-6">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              All Orders Desk
            </h1>
            <p className="text-slate-500 text-xs mt-0.5">Manage, track, process, and print receipt slips for all customer orders across branches.</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchOrders}
              disabled={loading}
              className="p-2 border border-slate-200 hover:bg-slate-100 bg-white rounded-lg text-slate-700 transition cursor-pointer"
              title="Refresh orders"
            >
              <BiRefresh className={`text-lg ${loading ? 'animate-spin' : ''}`} />
            </button>
            <Link 
              href="/dashboard/sale"
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs transition cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <BiPlus className="text-base" /> POS Sale
            </Link>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
          
          <div className="relative w-full md:w-80">
            <BiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base" />
            <input 
              type="text" 
              placeholder="Search by Order ID, customer, phone..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-400 focus:bg-white transition"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1"><BiFilterAlt /> Filter Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 cursor-pointer focus:outline-none focus:border-slate-400 capitalize"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="out_for_delivery">Out for Delivery</option>
              <option value="delivered">Delivered</option>
              <option value="returned">Returned</option>
              <option value="cancelled">Cancelled</option>
              <option value="failed">Failed</option>
            </select>
          </div>

        </div>

        <div className=" rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto min-h-screen">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-bold text-[11px] uppercase border-b border-slate-200 tracking-wider">
                  <th className="px-4 py-3 text-center">Order ID</th>
                  <th className="px-4 py-3">Branch</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3 text-center">Items</th>
                  <th className="px-4 py-3 text-right">Total Amount</th>
                  <th className="px-4 py-3 text-center">Order Status</th>
                  <th className="px-4 py-3 text-center">Date</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {paginatedOrders.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-slate-400">
                      No orders found matching criteria.
                    </td>
                  </tr>
                ) : (
                  paginatedOrders.map((order) => {
                    const isMenuOpen = openMenuId === order.order_id
                    const itemsCount = order.items ? order.items.reduce((acc, i) => acc + (parseInt(i.quantity, 10) || 1), 0) : 0
                    
                    return (
                      <tr key={order.order_id} className="hover:bg-slate-50/80 transition">
                        
                        <td className="px-4 py-3.5 text-center font-mono font-extrabold text-slate-900">
                          #ORD-{order.order_id}
                        </td>

                        <td className="px-4 py-3.5 font-semibold text-slate-700">
                          {order.branch_name || 'Main Branch'}
                        </td>

                        <td className="px-4 py-3.5 font-bold text-slate-900">
                          {order.customer_name || 'Customer'}
                        </td>

                        <td className="px-4 py-3.5 font-mono text-slate-600">
                          {order.phone || 'N/A'}
                        </td>

                        <td className="px-4 py-3.5 text-center font-bold text-slate-700">
                          {itemsCount}
                        </td>

                        <td className="px-4 py-3.5 text-right font-mono font-extrabold text-slate-900">
                          ৳{parseFloat(order.total_amount || 0).toFixed(2)}
                        </td>

                        <td className="px-4 py-3.5 text-center">
                          <select
                            value={order.status || 'pending'}
                            onChange={(e) => handleStatusChange(order.order_id, e.target.value)}
                            disabled={updatingId === order.order_id}
                            className={`px-2.5 py-1 rounded-lg text-xs font-extrabold cursor-pointer border focus:outline-none transition capitalize ${
                              order.status === 'delivered' ? 'bg-emerald-50 text-emerald-700 border-emerald-300' :
                              order.status === 'out_for_delivery' ? 'bg-blue-50 text-blue-700 border-blue-300' :
                              order.status === 'shipped' ? 'bg-indigo-50 text-indigo-700 border-indigo-300' :
                              order.status === 'processing' ? 'bg-amber-50 text-amber-700 border-amber-300' :
                              order.status === 'confirmed' ? 'bg-sky-50 text-sky-700 border-sky-300' :
                              order.status === 'returned' ? 'bg-purple-50 text-purple-700 border-purple-300' :
                              order.status === 'cancelled' || order.status === 'failed' ? 'bg-rose-50 text-rose-700 border-rose-300' :
                              'bg-slate-100 text-slate-700 border-slate-300'
                            }`}
                          >
                            <option value="pending" className="bg-white text-slate-800 font-semibold">Pending</option>
                            <option value="confirmed" className="bg-white text-slate-800 font-semibold">Confirmed</option>
                            <option value="processing" className="bg-white text-slate-800 font-semibold">Processing</option>
                            <option value="shipped" className="bg-white text-slate-800 font-semibold">Shipped</option>
                            <option value="out_for_delivery" className="bg-white text-slate-800 font-semibold">Out for Delivery</option>
                            <option value="delivered" className="bg-white text-slate-800 font-semibold">Delivered</option>
                            <option value="returned" className="bg-white text-slate-800 font-semibold">Returned</option>
                            <option value="cancelled" className="bg-white text-slate-800 font-semibold">Cancelled</option>
                            <option value="failed" className="bg-white text-slate-800 font-semibold">Failed</option>
                          </select>
                        </td>

                        <td className="px-4 py-3.5 text-center text-slate-500 text-[11px] whitespace-nowrap">
                          {order.created_at ? new Date(order.created_at).toLocaleDateString() : 'N/A'}
                        </td>

                        <td className="px-4 py-3.5 text-center relative action-menu-container">
                          <div className="flex items-center justify-center gap-1">
                            
                            <button
                              onClick={() => printReceipt(order, website)}
                              className="p-1.5 border border-slate-200 hover:bg-slate-100 rounded text-slate-700 transition cursor-pointer"
                              title="Print Receipt"
                            >
                              <BiPrinter className="text-base" />
                            </button>

                            <button
                              onClick={() => setOpenMenuId(isMenuOpen ? null : order.order_id)}
                              className="p-1.5 border border-slate-200 hover:bg-slate-100 rounded text-slate-700 transition cursor-pointer"
                              title="More Options"
                            >
                              <BiDotsVerticalRounded className="text-base" />
                            </button>

                          </div>

                          {/* Dropdown Menu */}
                          {isMenuOpen && (
                            <div className="absolute right-4 top-12 z-50 w-44 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 text-left text-xs animate-in fade-in zoom-in-95 duration-100">
                              <button
                                onClick={() => {
                                  setOpenMenuId(null)
                                  router.push(`/dashboard/orders/${order.order_id}`)
                                }}
                                className="w-full px-3 py-2 text-slate-700 hover:bg-slate-50 font-semibold flex items-center gap-2 cursor-pointer"
                              >
                                <BiShow className="text-slate-400 text-sm" /> Preview Details
                              </button>

                              <button
                                onClick={() => {
                                  setOpenMenuId(null)
                                  printReceipt(order, website)
                                }}
                                className="w-full px-3 py-2 text-slate-700 hover:bg-slate-50 font-semibold flex items-center gap-2 cursor-pointer"
                              >
                                <BiPrinter className="text-slate-400 text-sm" /> Print Invoice
                              </button>

                              {order.status !== 'returned' && order.status !== 'cancelled' && (
                                <button
                                  onClick={() => {
                                    setOpenMenuId(null)
                                    handleReturnOrder(order.order_id)
                                  }}
                                  className="w-full px-3 py-2 text-amber-600 hover:bg-amber-50 font-semibold flex items-center gap-2 cursor-pointer"
                                >
                                  <BiUndo className="text-amber-500 text-sm" /> Process Return
                                </button>
                              )}

                              {['admin', 'manager'].includes(user.role) && (
                                <button
                                  onClick={() => {
                                    setOpenMenuId(null)
                                    handleDeleteOrder(order.order_id)
                                  }}
                                  className="w-full px-3 py-2 text-rose-600 hover:bg-rose-50 font-semibold flex items-center gap-2 cursor-pointer border-t border-slate-100"
                                >
                                  <BiTrash className="text-rose-500 text-sm" /> Delete Order
                                </button>
                              )}
                            </div>
                          )}
                        </td>

                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <div>
                Showing page <span className="font-bold text-slate-800">{currentPage}</span> of <span className="font-bold text-slate-800">{totalPages}</span> ({filteredOrders.length} total orders)
              </div>
              <div className="flex gap-1">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className="px-3 py-1 bg-white border border-slate-200 rounded font-semibold text-slate-700 disabled:opacity-40 hover:bg-slate-100 cursor-pointer"
                >
                  Previous
                </button>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className="px-3 py-1 bg-white border border-slate-200 rounded font-semibold text-slate-700 disabled:opacity-40 hover:bg-slate-100 cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  )
}

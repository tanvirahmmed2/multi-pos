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
  BiShow
} from 'react-icons/bi'

export default function SalesHistoryPage() {
  const router = useRouter()
  const { dashSidebar, user, loading: userLoading, website } = useContext(Context)
  
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20

  const [openMenuId, setOpenMenuId] = useState(null)

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const statusParam = statusFilter !== 'all' ? `?status=${statusFilter}` : ''
      const res = await axios.get(`/api/sale${statusParam}`)
      setOrders(res.data || [])
      setCurrentPage(1)
    } catch (err) {
      console.error('Failed to load orders history:', err)
      toast.error('Failed to load orders history')
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
          <p className="text-slate-600 text-xs font-semibold animate-pulse">Loading orders history...</p>
        </div>
      </div>
    )
  }

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.order_id.toString().includes(search) ||
      (order.customer_name && order.customer_name.toLowerCase().includes(search.toLowerCase())) ||
      (order.phone && order.phone.includes(search)) ||
      (order.shipping_address && order.shipping_address.toLowerCase().includes(search.toLowerCase()))
    return matchesSearch
  })

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage) || 1
  const startIndex = (currentPage - 1) * itemsPerPage
  const currentOrders = filteredOrders.slice(startIndex, startIndex + itemsPerPage)

  return (
    <div className={`w-full min-h-screen bg-slate-50 pt-20 pb-12 px-2 sm:px-4 md:px-8 transition-all duration-300 ${dashSidebar ? 'lg:pl-68' : 'lg:pl-8'}`}>
      <div className="w-full flex flex-col gap-6">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-4 gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">Sales Orders History</h1>
            <p className="text-xs text-slate-500 mt-0.5">Review past system transactions, client invoices, shipping addresses, and download or print invoice slips.</p>
          </div>
          <button
            onClick={fetchOrders}
            disabled={loading}
            className="p-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 transition cursor-pointer shadow-sm disabled:opacity-40"
            title="Refresh History"
          >
            <BiRefresh className={`text-lg ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            {['all', 'pending', 'confirmed', 'out_for_delivery', 'delivered', 'cancelled', 'returned'].map(status => (
              <button
                key={status}
                onClick={() => { setStatusFilter(status); setCurrentPage(1); }}
                className={`px-3 py-1.5 text-xs font-bold transition cursor-pointer border uppercase tracking-wider ${
                  statusFilter === status 
                    ? 'bg-slate-900 text-white border-slate-900' 
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                {status.replace(/_/g, ' ')}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 bg-white px-3 py-2 border border-slate-200 w-full md:w-80 shadow-sm">
            <BiSearch className="text-slate-400 text-base" />
            <input 
              type="text"
              placeholder="Search by ID, name, phone..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="w-full text-xs text-slate-800 bg-transparent outline-none"
            />
          </div>
        </div>

        {loading ? (
          <div className="w-full py-20 flex flex-col items-center justify-center gap-2">
            <BiLoaderAlt className="animate-spin text-4xl text-slate-800" />
            <p className="text-slate-500 text-xs font-semibold animate-pulse">Loading orders history...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="w-full bg-white border border-slate-200 py-16 px-6 text-center shadow-sm">
            <h3 className="font-bold text-slate-800 text-base">No Orders Logged</h3>
            <p className="text-slate-500 text-xs mt-1">There are no order records that match your filters or search terms.</p>
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
                  <th className="hidden md:table-cell px-2 sm:px-3 py-3">Courier</th>
                  <th className="px-2 sm:px-3 py-3 text-center">Status</th>
                  <th className="px-2 sm:px-3 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
                {currentOrders.map(order => {
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
                      <td className="hidden md:table-cell px-2 sm:px-3 py-3.5 text-slate-500">
                        {order.courier_name ? (
                          <div>
                            <div className="font-semibold text-slate-800">{order.courier_name}</div>
                            {order.courier_tracking_id && <div className="text-[10px] text-slate-400 font-mono">ID: {order.courier_tracking_id}</div>}
                          </div>
                        ) : 'N/A'}
                      </td>
                      <td className="px-2 sm:px-3 py-3.5 text-center">
                        <span className="px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold uppercase border bg-slate-100 text-slate-700 border-slate-200">
                          {order.status}
                        </span>
                      </td>
                      <td className="px-2 sm:px-3 py-3.5 text-center relative action-menu-container">
                        
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
                                printReceipt(order, website)
                              }}
                              className="w-full px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition cursor-pointer"
                            >
                              <BiPrinter className="text-slate-500 text-base" /> Print Receipt
                            </button>

                            {order.status !== 'returned' && (
                              <button
                                onClick={() => {
                                  setOpenMenuId(null)
                                  handleReturnOrder(order.order_id)
                                }}
                                className="w-full px-3 py-2 text-xs font-bold text-amber-700 hover:bg-amber-50 flex items-center gap-2 transition cursor-pointer"
                              >
                                <BiUndo className="text-amber-600 text-base" /> Return Order
                              </button>
                            )}

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

            {filteredOrders.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-slate-200 bg-slate-50/50 text-xs">
                <div className="text-slate-500">
                  Showing <span className="font-semibold text-slate-700">{startIndex + 1}</span> to <span className="font-semibold text-slate-700">{Math.min(startIndex + itemsPerPage, filteredOrders.length)}</span> of <span className="font-semibold text-slate-700">{filteredOrders.length}</span> orders
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
    </div>
  )
}

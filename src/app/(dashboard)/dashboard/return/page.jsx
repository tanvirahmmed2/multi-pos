'use client'
import React, { useContext, useEffect, useState } from 'react'
import Link from 'next/link'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Context } from '@/component/helper/Context'
import { 
  BiSearch, 
  BiUndo, 
  BiLoaderAlt, 
  BiShieldQuarter, 
  BiCheckCircle, 
  BiXCircle, 
  BiInfoCircle,
  BiUser,
  BiMap,
  BiPhone
} from 'react-icons/bi'

export default function ManagerReturnDeskPage() {
  const { dashSidebar, user, loading: userLoading } = useContext(Context)
  
  const [returnedOrders, setReturnedOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchOrderId, setSearchOrderId] = useState('')
  const [searchedOrder, setSearchedOrder] = useState(null)
  const [searching, setSearching] = useState(false)
  const [processingId, setProcessingId] = useState(null)

  const fetchReturns = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/api/sale?status=returned')
      setReturnedOrders(res.data)
    } catch (err) {
      console.error('Failed to load return logs:', err)
      toast.error('Failed to fetch returns history')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (userLoading) return
    if (user && ['manager', 'admin'].includes(user.role)) {
      fetchReturns()
    }
  }, [user, userLoading])

  const handleSearchOrder = async (e) => {
    e.preventDefault()
    if (!searchOrderId.trim()) return

    setSearching(true)
    setSearchedOrder(null)
    try {
      const cleanId = searchOrderId.replace(/[^0-9]/g, '')
      if (!cleanId) {
        toast.error('Invalid Order ID format. Please use numerical digits.')
        return
      }
      const res = await axios.get(`/api/sale/${cleanId}`)
      setSearchedOrder(res.data)
    } catch (err) {
      console.error(err)
      toast.error(err.response?.data?.error || 'Order record not found.')
    } finally {
      setSearching(false)
    }
  }

  const handleProcessReturn = async (orderId) => {
    if (!window.confirm('Are you sure you want to mark this order as RETURNED? This will return items to inventory stock.')) {
      return
    }

    setProcessingId(orderId)
    try {
      await axios.put(`/api/sale/${orderId}`, { status: 'returned' })
      toast.success('Order processed as returned successfully!')
      setSearchedOrder(null)
      setSearchOrderId('')
      fetchReturns()
    } catch (err) {
      console.error(err)
      toast.error(err.response?.data?.error || 'Failed to process return status.')
    } finally {
      setProcessingId(null)
    }
  }

  if (userLoading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-2">
          <BiLoaderAlt className="animate-spin text-4xl text-slate-800" />
          <p className="text-slate-600 text-sm font-semibold animate-pulse">Loading return desk...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`w-full min-h-screen bg-slate-50 pt-20 pb-12 px-2 sm:px-4 md:px-8 transition-all duration-300 ${dashSidebar ? 'lg:pl-68' : 'lg:pl-8'}`}>
      <div className="w-full flex flex-col gap-6">
        
        <div className="border-b border-slate-200 pb-4">
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Returns Processing Desk</h1>
          <p className="text-xs text-slate-500 mt-1">Audit returns, refund clients, restore inventory levels, and check order validity.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="flex flex-col gap-5 lg:col-span-1">
            
            <div className="bg-white border border-slate-200 p-6 shadow-sm flex flex-col gap-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Lookup Order for Return</h3>
              <form onSubmit={handleSearchOrder} className="flex gap-2">
                <input 
                  type="text"
                  placeholder="Enter Order ID (e.g. 5)"
                  value={searchOrderId}
                  onChange={(e) => setSearchOrderId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 text-xs text-slate-800 outline-none"
                />
                <button
                  type="submit"
                  disabled={searching}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center justify-center cursor-pointer disabled:opacity-40"
                >
                  {searching ? <BiLoaderAlt className="animate-spin text-sm" /> : <BiSearch />}
                </button>
              </form>
            </div>

            {searchedOrder && (
              <div className="bg-white border border-slate-200 p-6 shadow-sm flex flex-col gap-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <h3 className="text-xs font-bold text-slate-900">#{searchedOrder.order_id} Details</h3>
                  <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase border text-primary border-primary/30 bg-primary/10">
                    {searchedOrder.status}
                  </span>
                </div>

                <div className="flex flex-col gap-2 text-xs text-slate-600 font-medium">
                  <div className="flex gap-1.5 items-center"><BiUser className="text-slate-400" /> <span>{searchedOrder.customer_name || 'Guest'}</span></div>
                  <div className="flex gap-1.5 items-center"><BiPhone className="text-slate-400" /> <span>{searchedOrder.phone}</span></div>
                  <div className="flex gap-1.5 items-start"><BiMap className="text-slate-400 mt-0.5" /> <span className="leading-tight">{searchedOrder.shipping_address || 'In-Store POS'}</span></div>
                  <div className="border-t border-slate-100 my-2 pt-2 flex justify-between items-center">
                    <span className="font-bold text-slate-500">Payable Total:</span>
                    <span className="text-sm font-black text-slate-900">৳{parseFloat(searchedOrder.total_amount).toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 border-t border-slate-100 pt-3">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Ordered Items</span>
                  <div className="flex flex-col gap-1">
                    {searchedOrder.items?.map((item, index) => (
                      <div key={index} className="text-xs text-slate-600 flex justify-between">
                        <span className="truncate max-w-[150px]">{item.product_name} {item.variant_name ? `(${item.variant_name})` : ''}</span>
                        <span className="font-bold text-slate-500">x{item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {searchedOrder.status === 'returned' ? (
                  <div className="p-3 bg-amber-50 text-amber-800 border border-amber-200 text-xs flex gap-2 items-center">
                    <BiInfoCircle className="text-sm shrink-0" />
                    <span>This order has already been marked as returned and items were restocked.</span>
                  </div>
                ) : searchedOrder.status === 'cancelled' ? (
                  <div className="p-3 bg-rose-50 text-rose-800 border border-rose-200 text-xs flex gap-2 items-center">
                    <BiXCircle className="text-sm shrink-0" />
                    <span>This order was cancelled. Restocking is not applicable for cancelled stubs.</span>
                  </div>
                ) : (
                  <button
                    onClick={() => handleProcessReturn(searchedOrder.order_id)}
                    disabled={processingId !== null}
                    className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    {processingId === searchedOrder.order_id ? (
                      <BiLoaderAlt className="animate-spin text-sm" />
                    ) : (
                      <>
                        <BiUndo className="text-sm" /> Mark Order as Returned
                      </>
                    )}
                  </button>
                )}
              </div>
            )}

          </div>

          <div className="bg-white border border-slate-200 p-6 shadow-sm flex flex-col gap-4 lg:col-span-2">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide border-b border-slate-100 pb-2">Returned Transactions Register</h3>
            
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-2">
                <BiLoaderAlt className="animate-spin text-4xl text-slate-800" />
                <p className="text-slate-500 text-xs font-semibold animate-pulse">Fetching returns archive...</p>
              </div>
            ) : returnedOrders.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-12">No returned orders have been logged yet.</p>
            ) : (
              <div className="w-full bg-white border border-slate-200 shadow-sm">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-100/80 text-slate-650 font-bold border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-2 text-center">ID</th>
                      <th className="px-3 py-2">Customer</th>
                      <th className="hidden sm:table-cell px-3 py-2">Phone</th>
                      <th className="hidden md:table-cell px-3 py-2">Items Summary</th>
                      <th className="px-3 py-2 text-right">Refund Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {returnedOrders.map(order => {
                      const itemSummary = order.items
                        ? order.items.map(item => `${item.product_name} x${item.quantity}`).join(', ')
                        : 'N/A'
                      return (
                        <tr key={order.order_id} className="hover:bg-slate-50/50 transition">
                          <td className="px-3 py-2.5 text-center font-bold text-slate-800">#{order.order_id}</td>
                          <td className="px-3 py-2.5 font-bold text-slate-800 truncate max-w-[100px]" title={order.customer_name || 'Guest'}>{order.customer_name || 'Guest'}</td>
                          <td className="hidden sm:table-cell px-3 py-2.5 font-semibold text-slate-500">{order.phone}</td>
                          <td className="hidden md:table-cell px-3 py-2.5 text-slate-500 truncate max-w-[150px]" title={itemSummary}>{itemSummary}</td>
                          <td className="px-3 py-2.5 text-right font-black text-rose-600">৳{parseFloat(order.total_amount).toFixed(2)}</td>
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
    </div>
  )
}


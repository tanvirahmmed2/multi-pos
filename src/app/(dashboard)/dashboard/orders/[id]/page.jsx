'use client'
import React, { useState, useEffect, useContext } from 'react'
import { useParams, useRouter } from 'next/navigation'
import axios from 'axios'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { Context } from '@/component/helper/Context'
import { printReceipt } from '@/lib/printreceipt'
import { 
  BiPrinter, 
  BiArrowBack, 
  BiLoaderAlt, 
  BiUser, 
  BiPhone, 
  BiMap, 
  BiRefresh, 
  BiCalendar,
  BiPackage,
  BiDollarCircle,
  BiCheckCircle,
  BiTime,
  BiXCircle,
  BiUndo
} from 'react-icons/bi'

export default function OrderPreviewPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.id

  const { user, loading: userLoading, dashSidebar, website } = useContext(Context)

  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchOrderDetails = async () => {
    setLoading(true)
    try {
      const res = await axios.get(`/api/sale/${orderId}`)
      setOrder(res.data)
    } catch (err) {
      console.error(err)
      toast.error('Failed to load order details')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user && ['admin', 'manager', 'sales'].includes(user.role)) {
      fetchOrderDetails()
    }
  }, [user, orderId])

  if (userLoading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-slate-50">
        <BiLoaderAlt className="animate-spin text-4xl text-slate-800" />
      </div>
    )
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'confirmed':
        return <span className="px-2 py-1 text-xs font-bold uppercase border bg-emerald-50 text-emerald-700 border-emerald-200">Confirmed</span>
      case 'delivered':
        return <span className="px-2 py-1 text-xs font-bold uppercase border bg-emerald-50 text-emerald-700 border-emerald-200">Delivered</span>
      case 'out_for_delivery':
        return <span className="px-2 py-1 text-xs font-bold uppercase border bg-sky-50 text-sky-700 border-sky-200">Out For Delivery</span>
      case 'pending':
        return <span className="px-2 py-1 text-xs font-bold uppercase border bg-amber-50 text-amber-700 border-amber-200">Pending</span>
      case 'cancelled':
        return <span className="px-2 py-1 text-xs font-bold uppercase border bg-rose-50 text-rose-700 border-rose-200">Cancelled</span>
      case 'returned':
        return <span className="px-2 py-1 text-xs font-bold uppercase border bg-rose-50 text-rose-700 border-rose-200">Returned</span>
      default:
        return <span className="px-2 py-1 text-xs font-bold uppercase border bg-slate-100 text-slate-700 border-slate-200">{status}</span>
    }
  }

  return (
    <div className={`w-full min-h-screen bg-slate-50 pt-20 pb-12 px-2 sm:px-4 md:px-8 transition-all duration-300 ${dashSidebar ? 'lg:pl-68' : 'lg:pl-8'}`}>
      <div className="w-full max-w-6xl mx-auto flex flex-col gap-6">
        
        {/* Header bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => router.back()} 
              className="p-2 border border-slate-200 hover:bg-slate-100 bg-white text-slate-700 transition cursor-pointer flex items-center justify-center shadow-sm"
              title="Go Back"
            >
              <BiArrowBack className="text-base" />
            </button>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                Order Preview #{orderId}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">Comprehensive checkout order breakdown and financial summary.</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchOrderDetails}
              disabled={loading}
              className="p-2.5 border border-slate-200 hover:bg-slate-50 bg-white text-slate-700 transition cursor-pointer shadow-sm disabled:opacity-40"
              title="Refresh Details"
            >
              <BiRefresh className={`text-base ${loading ? 'animate-spin' : ''}`} />
            </button>
            {order && (
              <button
                onClick={() => printReceipt(order, website)}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <BiPrinter className="text-sm" /> Print Invoice
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="h-96 flex flex-col items-center justify-center text-slate-400 gap-2 bg-white border border-slate-200 shadow-sm">
            <BiLoaderAlt className="animate-spin text-3xl text-slate-800" />
            <span className="text-xs font-semibold text-slate-500 animate-pulse">Fetching order records...</span>
          </div>
        ) : order ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left 8 columns: Items & Breakdown */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              
              {/* Product Listing Card */}
              <div className="bg-white border border-slate-200 shadow-sm p-5 flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2">
                    <BiPackage className="text-primary text-base" /> Ordered Items ({order.items?.length || 0})
                  </h3>
                  {getStatusBadge(order.status)}
                </div>
                
                <div className="flex flex-col divide-y divide-slate-100">
                  {order.items && order.items.map((item, idx) => (
                    <div 
                      key={idx}
                      className="py-3 flex items-center justify-between gap-4 first:pt-0 last:pb-0"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
                          <img 
                            src={item.product_image || '/product.jpeg'} 
                            alt={item.product_name} 
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div className="flex flex-col gap-0.5 min-w-0">
                          <h4 className="font-bold text-slate-800 text-xs truncate">
                            {item.product_name}
                          </h4>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500">
                            {item.variant_name && (
                              <span className="font-bold bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600 border border-slate-200">
                                {item.variant_name}
                              </span>
                            )}
                            <span className="font-mono">৳{parseFloat(item.price).toFixed(2)} × {item.quantity}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-bold text-slate-900 font-mono block">
                          ৳{(parseFloat(item.price) * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Invoice Calculations Summary */}
              <div className="bg-white border border-slate-200 shadow-sm p-5 flex flex-col gap-3">
                <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-2">
                  <BiDollarCircle className="text-primary text-base" /> Invoice Financial Breakdown
                </h3>

                <div className="flex flex-col gap-2.5 text-xs">
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Subtotal</span>
                    <span className="font-mono font-medium text-slate-800">৳{parseFloat(order.subtotal_amount || 0).toFixed(2)}</span>
                  </div>
                  
                  {parseFloat(order.total_discount_amount || 0) > 0 && (
                    <div className="flex justify-between items-center text-rose-600 font-medium">
                      <span>Discount</span>
                      <span className="font-mono">-৳{parseFloat(order.total_discount_amount || 0).toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-slate-600">
                    <span>Delivery Charge</span>
                    <span className="font-mono font-medium text-slate-800">৳{parseFloat(order.delivery_charge || 0).toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between items-center border-t border-slate-200 pt-3">
                    <span className="font-bold text-slate-900">Total Net Amount</span>
                    <span className="font-mono font-black text-slate-900 text-sm">
                      ৳{parseFloat(order.total_amount || 0).toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-emerald-600 font-bold border-t border-slate-100 pt-2">
                    <span>Paid Amount</span>
                    <span className="font-mono">
                      ৳{(parseFloat(order.total_amount || 0) - parseFloat(order.due_amount || 0)).toFixed(2)}
                    </span>
                  </div>

                  {parseFloat(order.due_amount || 0) > 0 && (
                    <div className="flex justify-between items-center text-rose-600 font-bold border-t border-slate-100 pt-2">
                      <span>Balance Due</span>
                      <span className="font-mono">৳{parseFloat(order.due_amount || 0).toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Right 4 columns: Customer Information */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              
              <div className="bg-white border border-slate-200 shadow-sm p-5 flex flex-col gap-4">
                <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-2">
                  <BiUser className="text-primary text-base" /> Customer Profile
                </h3>

                <div className="flex flex-col gap-3.5 text-xs text-slate-700">
                  <div className="flex items-start gap-2.5">
                    <BiUser className="text-slate-400 text-base shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Name</span>
                      <span className="font-bold text-slate-800">{order.customer_name || 'Guest Customer'}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 border-t border-slate-100 pt-3">
                    <BiPhone className="text-slate-400 text-base shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Phone Number</span>
                      <span className="font-mono font-bold text-slate-800">{order.phone || 'N/A'}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 border-t border-slate-100 pt-3">
                    <BiMap className="text-slate-400 text-base shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Delivery Address</span>
                      <span className="font-medium text-slate-800 leading-relaxed block mt-0.5">
                        {order.shipping_address}, {order.shipping_city} {order.shipping_area ? `(${order.shipping_area})` : ''}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 border-t border-slate-100 pt-3">
                    <BiCalendar className="text-slate-400 text-base shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Order Timestamp</span>
                      <span className="font-mono text-slate-600">{new Date(order.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {order.note && (
                <div className="bg-amber-50 border border-amber-200 p-4 text-xs text-amber-800 leading-relaxed italic">
                  <span className="font-bold uppercase not-italic block text-[10px] text-amber-700 mb-1">Customer Note:</span>
                  "{order.note}"
                </div>
              )}

            </div>

          </div>
        ) : (
          <div className="h-80 flex flex-col items-center justify-center text-slate-400 gap-2 bg-white border border-slate-200 shadow-sm">
            <BiXCircle className="text-4xl text-rose-500" />
            <span className="text-sm font-bold text-slate-700">Order Not Found</span>
            <p className="text-xs text-slate-400">Order #{orderId} does not exist in database system.</p>
          </div>
        )}

      </div>
    </div>
  )
}

'use client'
import React, { useState, useEffect, useContext } from 'react'
import { useParams, useRouter } from 'next/navigation'
import axios from 'axios'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { Context } from '@/component/helper/Context'
import { printReceipt } from '@/lib/printreceipt'
import { 
  BiReceipt, 
  BiPrinter, 
  BiChevronLeft, 
  BiLoaderAlt, 
  BiUser, 
  BiPhone, 
  BiMap, 
  BiPlus, 
  BiRefresh, 
  BiShieldQuarter, 
  BiCalendar,
  BiCart
} from 'react-icons/bi'

export default function POSOrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.orderId

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
      <div className="w-full min-h-screen flex items-center justify-center bg-white">
        <BiLoaderAlt className="animate-spin text-2xl text-slate-800" />
      </div>
    )
  }



  return (
    <div className={`w-full min-h-screen bg-slate-50/50 pt-20 pb-12 px-4 md:px-6 transition-all duration-300 ${dashSidebar ? 'lg:pl-68' : 'lg:pl-8'}`}>
      <div className="w-full max-w-6xl mx-auto flex flex-col gap-6">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4">
          <div className="flex items-center gap-2">
            <Link 
              href="/dashboard/sale" 
              className="p-1.5 border border-slate-200 hover:bg-slate-100 bg-white rounded-lg text-slate-650 transition cursor-pointer flex items-center justify-center"
            >
              <BiChevronLeft className="text-lg" />
            </Link>
            <div>
              <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                Sale Order #ORD-{orderId}
              </h1>
              <p className="text-slate-450 text-xs">POS sales desk dashboard overview</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchOrderDetails}
              disabled={loading}
              className="p-2 border border-slate-200 hover:bg-slate-50 bg-white rounded-lg text-slate-550 transition cursor-pointer"
            >
              <BiRefresh className={loading ? 'animate-spin' : ''} />
            </button>
            <Link 
              href="/dashboard/sale"
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs transition cursor-pointer flex items-center gap-1 shadow-sm"
            >
              <BiPlus className="text-sm" /> New POS Sale
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="h-96 flex flex-col items-center justify-center text-slate-400 gap-2 bg-white border border-slate-200 rounded-xl">
            <BiLoaderAlt className="animate-spin text-xl text-slate-900" />
            <span className="text-xs font-medium">Fetching order records...</span>
          </div>
        ) : order ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            
            {/* LEFT: Order items list & summary (2 columns) */}
            <div className="md:col-span-2 flex flex-col gap-6">
              
              {/* Product Listing Card */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col gap-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block border-b border-slate-100 pb-2">
                  Items Summary
                </span>
                
                <div className="flex flex-col gap-3">
                  {order.items && order.items.map((item, idx) => (
                    <div 
                      key={idx}
                      className="flex items-center gap-3 border-b border-slate-100 pb-3 last:border-0 last:pb-0"
                    >
                      {/* Product Image */}
                      <div className="w-12 h-12 rounded-lg border border-slate-100 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
                        <img 
                          src={item.product_image || '/product.jpeg'} 
                          alt={item.product_name} 
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                        <h4 className="font-semibold text-slate-800 text-xs truncate leading-tight">
                          {item.product_name}
                        </h4>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                          {item.variant_name && (
                            <span className="font-bold bg-slate-100 px-1 rounded text-slate-500 text-[9px] leading-none py-0.5">
                              {item.variant_name}
                            </span>
                          )}
                          <span>৳{parseFloat(item.price).toFixed(2)} each</span>
                        </div>
                      </div>

                      {/* Quantity & line total */}
                      <div className="text-right shrink-0">
                        <span className="text-xs font-bold text-slate-900 block font-mono">
                          ৳{(parseFloat(item.price) * item.quantity).toFixed(2)}
                        </span>
                        <span className="text-[9px] text-slate-450 block font-medium">
                          Qty: {item.quantity}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Calculations Summary */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col gap-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block border-b border-slate-100 pb-2">
                  Invoice Breakdown
                </span>

                <div className="flex flex-col gap-2.5 text-xs">
                  <div className="flex justify-between items-center text-slate-500 font-semibold">
                    <span>Subtotal</span>
                    <span className="font-mono text-slate-700">৳{parseFloat(order.subtotal_amount).toFixed(2)}</span>
                  </div>
                  {parseFloat(order.total_discount_amount) > 0 && (
                    <div className="flex justify-between items-center text-rose-500 font-bold">
                      <span>Discount</span>
                      <span className="font-mono">-৳{parseFloat(order.total_discount_amount).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-slate-500 font-semibold">
                    <span>Delivery/Shipping</span>
                    <span className="font-mono text-slate-700">৳{parseFloat(order.delivery_charge).toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between items-center border-t border-slate-100 pt-2.5">
                    <span className="text-xs font-bold text-slate-800">Net Invoice Amount</span>
                    <span className="font-mono text-slate-900 font-extrabold text-sm">
                      ৳{parseFloat(order.total_amount).toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-emerald-600 font-bold border-t border-slate-50 pt-2">
                    <span>Amount Paid</span>
                    <span className="font-mono">৳{(parseFloat(order.total_amount) - parseFloat(order.due_amount)).toFixed(2)}</span>
                  </div>

                  {parseFloat(order.due_amount) > 0 && (
                    <div className="flex justify-between items-center text-rose-600 font-bold border-t border-slate-50 pt-2">
                      <span>Remaining Balance Due</span>
                      <span className="font-mono">৳{parseFloat(order.due_amount).toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT: Customer details & action sidebar (1 column) */}
            <div className="flex flex-col gap-6">
              
              {/* Customer Info Card */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col gap-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block border-b border-slate-100 pb-2">
                  Client Attributes
                </span>

                <div className="flex flex-col gap-3">
                  <div className="flex items-start gap-2 text-xs">
                    <BiUser className="text-slate-400 mt-0.5 text-base shrink-0" />
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Customer Name</span>
                      <span className="font-bold text-slate-800 mt-0.5">{order.customer_name || 'Guest'}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 text-xs border-t border-slate-100 pt-3">
                    <BiPhone className="text-slate-400 mt-0.5 text-base shrink-0" />
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Phone Number</span>
                      <span className="font-bold text-slate-800 mt-0.5">{order.phone}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 text-xs border-t border-slate-100 pt-3">
                    <BiMap className="text-slate-400 mt-0.5 text-base shrink-0" />
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Shipping Address</span>
                      <span className="font-bold text-slate-800 mt-0.5">
                        {order.shipping_address}, {order.shipping_city} {order.shipping_area ? `(${order.shipping_area})` : ''}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 text-xs border-t border-slate-100 pt-3">
                    <BiCalendar className="text-slate-400 mt-0.5 text-base shrink-0" />
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Purchase Date</span>
                      <span className="font-bold text-slate-800 mt-0.5">
                        {new Date(order.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 text-xs border-t border-slate-100 pt-3">
                    <BiShieldQuarter className="text-emerald-600 mt-0.5 text-base shrink-0" />
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Processed By (Staff)</span>
                      <span className="font-bold text-slate-800 mt-0.5">
                        {order.staff_name ? `${order.staff_name} (${order.staff_role || 'Staff'})` : 'Storefront POS / Online'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Status & Actions */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col gap-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block border-b border-slate-100 pb-2">
                  Staff Actions
                </span>

                <div className="flex flex-col gap-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-450 uppercase">Order Status</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      order.status === 'delivered' ? 'bg-emerald-50 text-emerald-700' :
                      ['cancelled', 'failed'].includes(order.status) ? 'bg-rose-50 text-rose-600' :
                      order.status === 'returned' ? 'bg-amber-50 text-amber-700' :
                      'bg-blue-50 text-blue-600'
                    }`}>
                      {order.status}
                    </span>
                  </div>

                  <button
                    onClick={() => printReceipt(order, website)}
                    className="w-full py-2.5 text-white bg-slate-900 hover:bg-slate-850 text-xs font-bold rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm mt-2"
                  >
                    <BiPrinter className="text-sm" /> Print Invoice Receipt
                  </button>
                </div>
              </div>
              
              {/* Order Note */}
              {order.note && (
                <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-4 text-xxs text-amber-800 leading-normal italic font-medium">
                  Note: "{order.note}"
                </div>
              )}

            </div>

          </div>
        ) : (
          <div className="h-96 flex flex-col items-center justify-center text-slate-400 gap-1.5 bg-white border border-slate-200 rounded-xl">
            <span className="text-xs font-bold text-slate-600">Order not found</span>
          </div>
        )}

      </div>
    </div>
  )
}

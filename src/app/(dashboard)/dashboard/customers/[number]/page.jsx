'use client'
import React, { useContext, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Context } from '@/component/helper/Context'
import { 
  BiUser, 
  BiPhone, 
  BiEnvelope, 
  BiMapPin, 
  BiCalendar, 
  BiShoppingBag, 
  BiDollarCircle, 
  BiCheckCircle, 
  BiUndo, 
  BiTime, 
  BiArrowBack, 
  BiLoaderAlt, 
  BiShieldQuarter, 
  BiPrinter, 
  BiReceipt,
  BiChevronDown,
  BiChevronUp
} from 'react-icons/bi'

export default function CustomerProfilePage() {
  const params = useParams()
  const customerId = params?.number

  const { dashSidebar, user, loading: userLoading } = useContext(Context)

  const [customerData, setCustomerData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [expandedOrderId, setExpandedOrderId] = useState(null)

  const fetchCustomerProfile = async () => {
    if (!customerId) return
    setLoading(true)
    try {
      const res = await axios.get(`/api/customer/${customerId}`)
      setCustomerData(res.data)
    } catch (err) {
      console.error('Failed to load customer profile:', err)
      toast.error('Failed to load customer profile details')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (userLoading) return
    if (user && ['manager', 'admin', 'sales'].includes(user.role)) {
      fetchCustomerProfile()
    }
  }, [customerId, user, userLoading])

  const toggleExpandOrder = (orderId) => {
    setExpandedOrderId(prev => prev === orderId ? null : orderId)
  }

  const handlePrintCustomerOrders = () => {
    if (!customerData) return
    const printWindow = window.open('', '_blank', 'width=900,height=900')
    if (!printWindow) return

    const { customer, stats, orders } = customerData
    const today = new Date().toLocaleDateString()

    const orderRows = orders.map(ord => `
      <tr>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">#ORD-${ord.order_id}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0;">${new Date(ord.created_at).toLocaleDateString()}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-transform: uppercase; font-weight: 600;">${ord.status}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: right;">৳${parseFloat(ord.total_amount || 0).toFixed(2)}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 600;">৳${parseFloat(ord.due_amount || 0).toFixed(2)}</td>
      </tr>
    `).join('')

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Customer Order Statement - ${customer.name}</title>
          <style>
            body { font-family: system-ui, sans-serif; color: #1e293b; padding: 40px; line-height: 1.5; }
            .header { border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 24px; }
            .title { font-size: 22px; font-weight: 900; color: #0f172a; text-transform: uppercase; }
            .meta { font-size: 12px; color: #64748b; margin-top: 4px; }
            .box { background: #f8fafc; border: 1px solid #cbd5e1; padding: 16px; margin-bottom: 24px; font-size: 12px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 20px; }
            th { background-color: #f1f5f9; font-weight: 700; padding: 10px 12px; border-bottom: 2px solid #cbd5e1; text-transform: uppercase; font-size: 10px; color: #475569; text-align: left; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">Customer Statement & Order Log</div>
            <div class="meta">Generated: ${today} | Profile Ref: #${customer.customer_id}</div>
          </div>

          <div class="box">
            <strong>Customer:</strong> ${customer.name}<br/>
            <strong>Phone:</strong> ${customer.phone || 'N/A'}<br/>
            <strong>Email:</strong> ${customer.email || 'N/A'}<br/>
            <strong>Address:</strong> ${customer.address || 'N/A'}<br/>
            <strong>Total Orders:</strong> ${stats.totalOrders} | <strong>Total Spent:</strong> ৳${stats.totalSpent.toFixed(2)} | <strong>Outstanding Due:</strong> ৳${stats.totalDue.toFixed(2)}
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Order Ref</th>
                <th>Date</th>
                <th>Status</th>
                <th style="text-align: right;">Total Amount</th>
                <th style="text-align: right;">Due Amount</th>
              </tr>
            </thead>
            <tbody>
              ${orderRows || '<tr><td colspan="5" style="text-align: center; padding: 12px;">No order transactions recorded.</td></tr>'}
            </tbody>
          </table>

          <script>
            window.onload = function() {
              window.focus();
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  if (userLoading || loading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-2">
          <BiLoaderAlt className="animate-spin text-4xl text-slate-800" />
          <p className="text-slate-600 text-sm font-semibold animate-pulse">Loading customer profile & order history...</p>
        </div>
      </div>
    )
  }

  if (!customerData || !customerData.customer) {
    return (
      <div className={`w-full min-h-screen bg-slate-50 pt-20 pb-12 px-4 md:px-8 transition-all duration-300 ${dashSidebar ? 'lg:pl-64' : 'lg:pl-8'}`}>
        <div className="w-full max-w-md bg-white border border-slate-200 p-8 flex flex-col gap-4 text-center shadow-sm mx-auto my-12">
          <BiUser className="text-5xl text-slate-400 mx-auto" />
          <h1 className="text-xl font-bold text-slate-800">Customer Not Found</h1>
          <p className="text-slate-500 text-xs">No client record matches ID #{customerId}.</p>
          <Link href="/dashboard/customers" className="mt-2 px-6 py-2.5 bg-slate-900 text-white text-xs font-bold transition shadow-sm">
            Back to Customer Directory
          </Link>
        </div>
      </div>
    )
  }

  const { customer, stats, orders } = customerData
  const initials = customer.name
    ? customer.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : 'CU'

  return (
    <div className={`w-full min-h-screen bg-slate-50 pt-20 pb-12 px-2 sm:px-4 md:px-8 transition-all duration-300 ${dashSidebar ? 'lg:pl-64' : 'lg:pl-8'}`}>
      <div className="w-full flex flex-col gap-6">
        
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-4 gap-4">
          <div className="flex items-center gap-3">
            <Link 
              href="/dashboard/customers" 
              className="p-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition shadow-sm"
              title="Back to Customer Directory"
            >
              <BiArrowBack className="text-lg" />
            </Link>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
                <BiUser className="text-primary" />
                {customer.name}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">Customer Profile Ref: <span className="font-mono font-bold text-slate-700">#{customer.customer_id}</span></p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintCustomerOrders}
              className="px-4 py-2.5 bg-primary hover:bg-primary-dark text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <BiPrinter className="text-sm" /> Print Customer Statement
            </button>
          </div>
        </div>

        {/* Top Summary Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Total Spent */}
          <div className="bg-white border border-slate-200 p-5 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Gross Purchases</p>
              <h3 className="text-lg font-bold text-slate-800 mt-0.5">৳{stats.totalSpent.toFixed(2)}</h3>
            </div>
            <div className="w-10 h-10 bg-primary text-white flex items-center justify-center text-xl shrink-0 font-bold">
              <BiDollarCircle />
            </div>
          </div>

          {/* Total Orders */}
          <div className="bg-white border border-slate-200 p-5 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Orders</p>
              <h3 className="text-lg font-bold text-slate-800 mt-0.5">{stats.totalOrders} Orders</h3>
            </div>
            <div className="w-10 h-10 bg-blue-600 text-white flex items-center justify-center text-xl shrink-0 font-bold">
              <BiShoppingBag />
            </div>
          </div>

          {/* Outstanding Due */}
          <div className="bg-white border border-slate-200 p-5 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Outstanding Due</p>
              <h3 className={`text-lg font-bold mt-0.5 ${stats.totalDue > 0 ? 'text-amber-700' : 'text-slate-800'}`}>
                ৳{stats.totalDue.toFixed(2)}
              </h3>
            </div>
            <div className={`w-10 h-10 text-white flex items-center justify-center text-xl shrink-0 font-bold ${stats.totalDue > 0 ? 'bg-amber-500' : 'bg-slate-700'}`}>
              <BiReceipt />
            </div>
          </div>

          {/* Delivered vs Returned */}
          <div className="bg-white border border-slate-200 p-5 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Fulfillment Rate</p>
              <h3 className="text-xs font-bold text-slate-800 mt-1 flex items-center gap-2">
                <span className="text-emerald-600">{stats.deliveredCount} Delivered</span>
                <span>•</span>
                <span className="text-rose-600">{stats.returnedCount} Returned</span>
              </h3>
            </div>
            <div className="w-10 h-10 bg-emerald-600 text-white flex items-center justify-center text-xl shrink-0 font-bold">
              <BiCheckCircle />
            </div>
          </div>

        </div>

        {/* Customer Information & Order Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Side: Profile Card */}
          <div className="lg:col-span-4 bg-white border border-slate-200 p-5 md:p-6 shadow-sm flex flex-col gap-5">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-1.5">
              <BiUser className="text-primary text-base" /> Profile Specifications
            </h2>

            <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
              <div className="w-14 h-14 bg-primary text-white text-xl font-bold flex items-center justify-center shrink-0 shadow-sm">
                {initials}
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-slate-900 text-base leading-tight truncate">{customer.name}</h3>
                <span className="text-[10px] font-mono text-slate-500 block mt-0.5">Ref ID: #{customer.customer_id}</span>
              </div>
            </div>

            <div className="flex flex-col gap-3 text-xs">
              
              <div className="flex items-start gap-2.5">
                <BiPhone className="text-slate-400 text-base shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Phone Number</span>
                  <a href={`tel:${customer.phone}`} className="font-bold text-slate-800 hover:underline">
                    {customer.phone || 'N/A'}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <BiEnvelope className="text-slate-400 text-base shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Email Address</span>
                  <span className="font-mono text-slate-700">{customer.email || 'N/A'}</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <BiMapPin className="text-slate-400 text-base shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Default Shipping Address</span>
                  <span className="text-slate-700 leading-relaxed">{customer.address || 'No address specified'}</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <BiCalendar className="text-slate-400 text-base shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Registration Timestamp</span>
                  <span className="font-mono text-slate-600">
                    {customer.created_at ? new Date(customer.created_at).toLocaleString() : 'N/A'}
                  </span>
                </div>
              </div>

            </div>
          </div>

          {/* Right Side: Order Transactions Ledger */}
          <div className="lg:col-span-8 bg-white border border-slate-200 p-5 md:p-6 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <BiShoppingBag className="text-primary text-base" /> Customer Order History ({orders.length})
              </h2>
            </div>

            {orders.length === 0 ? (
              <div className="py-12 text-center text-slate-400 border-2 border-dashed border-slate-200 p-6">
                <BiShoppingBag className="text-4xl mx-auto text-slate-300" />
                <p className="font-bold text-slate-600 text-xs mt-2">No Order History</p>
                <p className="text-[10px] text-slate-400">This customer has no recorded transactions in the system.</p>
              </div>
            ) : (
              <div className="w-full bg-white border border-slate-200 shadow-sm">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-100/80 text-slate-650 font-bold border-b border-slate-200">
                    <tr>
                      <th className="px-3 md:px-4 py-3">Order Ref</th>
                      <th className="hidden sm:table-cell px-3 md:px-4 py-3">Date</th>
                      <th className="hidden md:table-cell px-3 md:px-4 py-3">Courier</th>
                      <th className="px-3 md:px-4 py-3 text-right">Total</th>
                      <th className="px-3 md:px-4 py-3 text-center">Status</th>
                      <th className="px-3 md:px-4 py-3 text-right">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
                    {orders.map((ord) => {
                      const isExpanded = expandedOrderId === ord.order_id
                      const itemsList = Array.isArray(ord.items) ? ord.items : []

                      return (
                        <React.Fragment key={ord.order_id}>
                          <tr className="hover:bg-slate-50 transition">
                            <td className="px-3 md:px-4 py-3.5">
                              <Link 
                                href={`/dashboard/sale/${ord.order_id}`}
                                className="font-bold font-mono hover:underline block text-primary"
                              >
                                #ORD-{ord.order_id}
                              </Link>
                              <span className="text-[10px] text-slate-400 block sm:hidden font-mono mt-0.5">
                                {new Date(ord.created_at).toLocaleDateString()}
                              </span>
                            </td>

                            <td className="hidden sm:table-cell px-3 md:px-4 py-3.5 font-mono text-[10px] text-slate-500">
                              {new Date(ord.created_at).toLocaleDateString()}
                            </td>

                            <td className="hidden md:table-cell px-3 md:px-4 py-3.5 font-semibold text-slate-600">
                              {ord.courier_name ? (
                                <span className="uppercase text-[10px]">{ord.courier_name}</span>
                              ) : (
                                <span className="text-slate-400">N/A</span>
                              )}
                            </td>

                            <td className="px-3 md:px-4 py-3.5 text-right font-bold text-slate-900">
                              ৳{parseFloat(ord.total_amount || 0).toFixed(2)}
                              {parseFloat(ord.due_amount || 0) > 0 && (
                                <span className="block text-[9px] text-amber-700 font-normal">
                                  Due: ৳{parseFloat(ord.due_amount).toFixed(2)}
                                </span>
                              )}
                            </td>

                            <td className="px-3 md:px-4 py-3.5 text-center">
                              <span className={`px-1.5 py-0.5 text-[9px] font-bold uppercase border ${
                                ord.status === 'delivered' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                ord.status === 'returned' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                ord.status === 'cancelled' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                'bg-sky-50 text-sky-700 border-sky-200'
                              }`}>
                                {ord.status}
                              </span>
                            </td>

                            <td className="px-3 md:px-4 py-3.5 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={() => toggleExpandOrder(ord.order_id)}
                                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold transition flex items-center gap-1 border border-slate-200 cursor-pointer"
                                >
                                  {itemsList.length} Items {isExpanded ? <BiChevronUp /> : <BiChevronDown />}
                                </button>
                                <Link 
                                  href={`/dashboard/sale/${ord.order_id}`}
                                  className="p-1 text-slate-500 hover:text-slate-900 border border-slate-200 bg-white hover:bg-slate-100 transition"
                                  title="View Order Invoice"
                                >
                                  <BiReceipt className="text-sm" />
                                </Link>
                              </div>
                            </td>
                          </tr>

                          {/* Expanded Items Sub-row */}
                          {isExpanded && (
                            <tr className="bg-slate-50/80">
                              <td colSpan={6} className="p-4 border-b border-slate-200">
                                <div className="flex flex-col gap-2">
                                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Ordered Products Breakdown:</span>
                                  
                                  {itemsList.length === 0 ? (
                                    <span className="text-xs text-slate-400 italic">No line items detailed for this order.</span>
                                  ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                      {itemsList.map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-3 bg-white p-2.5 border border-slate-200">
                                          <img src={item.product_image || '/product.jpeg'} alt={item.product_name} className="w-10 h-10 object-cover border border-slate-200 shrink-0 overflow-hidden" />
                                          <div className="min-w-0 flex-1">
                                            <div className="font-bold text-slate-800 text-xs truncate">{item.product_name}</div>
                                            <div className="text-[10px] text-slate-500">
                                              {item.variant_name ? `Variant: ${item.variant_name} | ` : ''}
                                              Qty: {item.quantity} × ৳{parseFloat(item.price || 0).toFixed(2)}
                                            </div>
                                          </div>
                                          <div className="font-bold text-slate-900 text-xs shrink-0">
                                            ৳{(item.quantity * parseFloat(item.price || 0)).toFixed(2)}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  {/* Shipping Details */}
                                  {(ord.shipping_address || ord.shipping_city) && (
                                    <div className="mt-2 text-[11px] text-slate-600 bg-white p-2.5 border border-slate-200">
                                      <span className="font-bold text-slate-800">Shipping Destination: </span>
                                      {ord.shipping_address}, {ord.shipping_area || ''} {ord.shipping_city || ''}
                                    </div>
                                  )}

                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
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


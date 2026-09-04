'use client'
import React, { useContext, useEffect, useState } from 'react'
import Link from 'next/link'
import axios from 'axios'
import { Context } from '@/component/helper/Context'
import { 
  BiGridAlt, 
  BiChevronRight, 
  BiLoaderAlt, 
  BiCart, 
  BiDollarCircle, 
  BiPackage, 
  BiStoreAlt, 
  BiUser, 
  BiShieldQuarter, 
  BiHistory, 
  BiHome, 
  BiWallet, 
  BiFile, 
  BiCog,
  BiTrendingUp,
  BiTime,
  BiCheckCircle,
  BiBuilding,
  BiPlus
} from 'react-icons/bi'

export default function DashboardHomePage() {
  const { user, loading: userLoading, dashSidebar, logout } = useContext(Context)

  const [sales, setSales] = useState([])
  const [purchases, setPurchases] = useState([])
  const [activities, setActivities] = useState([])
  const [logins, setLogins] = useState([])
  const [loadingData, setLoadingData] = useState(true)

  const role = user?.role || 'staff'
  const userBranchId = user?.branch_id

  useEffect(() => {
    if (userLoading || !user) return

    const loadData = async () => {
      setLoadingData(true)
      try {
        const promises = [
          axios.get('/api/sale').catch(() => ({ data: [] })),
          axios.get('/api/purchase').catch(() => ({ data: [] }))
        ]

        if (role === 'admin' || role === 'manager') {
          promises.push(axios.get('/api/activity-logs?type=activity').catch(() => ({ data: [] })))
          promises.push(axios.get('/api/activity-logs?type=login').catch(() => ({ data: [] })))
        }

        const results = await Promise.all(promises)
        setSales(Array.isArray(results[0].data) ? results[0].data : [])
        setPurchases(Array.isArray(results[1].data) ? results[1].data : [])

        if (role === 'admin' || role === 'manager') {
          setActivities(Array.isArray(results[2]?.data) ? results[2].data : [])
          setLogins(Array.isArray(results[3]?.data) ? results[3].data : [])
        }
      } catch (err) {
        console.error('Error loading dashboard home data:', err)
      } finally {
        setLoadingData(false)
      }
    }

    loadData()
  }, [user, userLoading, role])

  if (userLoading || loadingData) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <BiLoaderAlt className="animate-spin text-4xl text-slate-800" />
          <p className="text-slate-600 text-sm font-semibold animate-pulse">Loading dashboard home...</p>
        </div>
      </div>
    )
  }

  const formatMoney = (val) => {
    const num = parseFloat(val || 0)
    return `৳${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const formatDate = (d) => {
    if (!d) return 'N/A'
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const getStatusBadge = (status) => {
    const st = (status || '').toLowerCase()
    if (['completed', 'delivered', 'approved', 'active', 'success'].includes(st)) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    }
    if (['pending', 'partial', 'processing', 'confirmed', 'shipped'].includes(st)) {
      return 'bg-amber-50 text-amber-700 border-amber-200'
    }
    if (['cancelled', 'rejected', 'failed', 'banned', 'returned'].includes(st)) {
      return 'bg-rose-50 text-rose-700 border-rose-200'
    }
    return 'bg-slate-50 text-slate-700 border-slate-200'
  }

  // Branch filtering for manager/sales
  const branchSales = userBranchId 
    ? sales.filter(s => String(s.branch_id) === String(userBranchId))
    : sales
  const branchPurchases = userBranchId 
    ? purchases.filter(p => String(p.branch_id) === String(userBranchId))
    : purchases

  return (
    <div className={`w-full min-h-screen bg-slate-50 pt-20 pb-12 px-2 sm:px-4 md:px-8 transition-all duration-300 ${dashSidebar ? 'lg:pl-64' : 'lg:pl-8'}`}>
      <div className="w-full flex flex-col gap-6 md:gap-8">
        
        {/* User Info Header & Module Center Callout (ALL ROLES) */}
        <div className="bg-white border border-slate-200 shadow-sm p-5 md:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-primary text-white flex items-center justify-center text-2xl font-bold shrink-0">
              <BiUser />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-800">{user?.name || 'Staff User'}</h1>
                <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase bg-primary/10 text-primary border border-primary/20">
                  {role}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono mt-1">
                {user?.email || 'N/A'} {user?.phone ? `• ${user.phone}` : ''}
              </p>
            </div>
          </div>

          {/* Module Center CTA Card */}
          <Link
            href="/dashboard/modules"
            className="p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition flex items-center justify-between gap-4 group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary text-white flex items-center justify-center text-xl shrink-0 font-bold">
                <BiGridAlt />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-xs sm:text-sm">Explore Module Center</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Access all store tools, catalogs, reports, and settings</p>
              </div>
            </div>
            <BiChevronRight className="text-xl text-slate-400 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* ========================================================= */}
        {/* ADMIN DASHBOARD VIEW                                      */}
        {/* ========================================================= */}
        {role === 'admin' && (
          <div className="flex flex-col gap-6 md:gap-8">
            
            {/* Quick Links Bar */}
            <div className="bg-white border border-slate-200 p-5 shadow-sm flex flex-col gap-3">
              <h2 className="text-xs uppercase font-bold text-slate-400 tracking-wider">Important Admin Shortcuts</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
                <Link href="/dashboard/overview" className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-center text-xs font-bold text-slate-700 flex flex-col items-center gap-1.5 transition">
                  <BiHome className="text-lg text-primary" />
                  <span>Overview</span>
                </Link>
                <Link href="/dashboard/balance" className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-center text-xs font-bold text-slate-700 flex flex-col items-center gap-1.5 transition">
                  <BiWallet className="text-lg text-primary" />
                  <span>Balance</span>
                </Link>
                <Link href="/dashboard/product" className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-center text-xs font-bold text-slate-700 flex flex-col items-center gap-1.5 transition">
                  <BiPackage className="text-lg text-primary" />
                  <span>Products</span>
                </Link>
                <Link href="/dashboard/people" className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-center text-xs font-bold text-slate-700 flex flex-col items-center gap-1.5 transition">
                  <BiUser className="text-lg text-primary" />
                  <span>People</span>
                </Link>
                <Link href="/dashboard/history" className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-center text-xs font-bold text-slate-700 flex flex-col items-center gap-1.5 transition">
                  <BiHistory className="text-lg text-primary" />
                  <span>Sales</span>
                </Link>
                <Link href="/dashboard/purchase" className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-center text-xs font-bold text-slate-700 flex flex-col items-center gap-1.5 transition">
                  <BiDollarCircle className="text-lg text-primary" />
                  <span>Purchases</span>
                </Link>
                <Link href="/dashboard/report" className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-center text-xs font-bold text-slate-700 flex flex-col items-center gap-1.5 transition">
                  <BiFile className="text-lg text-primary" />
                  <span>Reports</span>
                </Link>
                <Link href="/dashboard/settings" className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-center text-xs font-bold text-slate-700 flex flex-col items-center gap-1.5 transition">
                  <BiCog className="text-lg text-primary" />
                  <span>Settings</span>
                </Link>
              </div>
            </div>

            {/* Admin Tables: Purchases & Sales */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Latest Purchases */}
              <div className="bg-white border border-slate-200 p-5 shadow-sm flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-800">Latest Procurement Purchases</h3>
                  <Link href="/dashboard/purchase" className="text-xs font-bold text-primary hover:underline flex items-center gap-0.5">
                    View All <BiChevronRight />
                  </Link>
                </div>
                {purchases.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">No recent purchases.</p>
                ) : (
                  <div className="w-full border border-slate-200">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                        <tr>
                          <th className="px-3 py-2 text-center">ID</th>
                          <th className="px-3 py-2">Supplier</th>
                          <th className="px-3 py-2 text-right">Total</th>
                          <th className="px-3 py-2 text-center">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {purchases.slice(0, 5).map(p => (
                          <tr key={p.purchase_id} className="hover:bg-slate-50 transition">
                            <td className="px-3 py-2 text-center font-mono font-bold text-slate-800">#{p.purchase_id}</td>
                            <td className="px-3 py-2 font-semibold text-slate-800 truncate max-w-[120px]">{p.supplier_name || 'Supplier'}</td>
                            <td className="px-3 py-2 text-right font-bold text-slate-900">{formatMoney(p.total_amount)}</td>
                            <td className="px-3 py-2 text-center text-slate-500">{formatDate(p.created_at)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Latest Sales */}
              <div className="bg-white border border-slate-200 p-5 shadow-sm flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-800">Latest Sales Orders</h3>
                  <Link href="/dashboard/history" className="text-xs font-bold text-primary hover:underline flex items-center gap-0.5">
                    View All <BiChevronRight />
                  </Link>
                </div>
                {sales.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">No recent sales.</p>
                ) : (
                  <div className="w-full border border-slate-200">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                        <tr>
                          <th className="px-3 py-2 text-center">Order ID</th>
                          <th className="px-3 py-2">Customer</th>
                          <th className="px-3 py-2 text-right">Amount</th>
                          <th className="px-3 py-2 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {sales.slice(0, 5).map(s => (
                          <tr key={s.order_id} className="hover:bg-slate-50 transition">
                            <td className="px-3 py-2 text-center font-mono font-bold text-slate-800">#{s.order_id}</td>
                            <td className="px-3 py-2 font-semibold text-slate-800 truncate max-w-[120px]">{s.customer_name || 'Walk-in'}</td>
                            <td className="px-3 py-2 text-right font-bold text-slate-900">{formatMoney(s.total_amount)}</td>
                            <td className="px-3 py-2 text-center">
                              <span className={`px-2 py-0.5 text-[9px] font-bold uppercase border ${getStatusBadge(s.status)}`}>
                                {s.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>

            {/* Staff Activity Logs */}
            <div className="bg-white border border-slate-200 p-5 shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <BiShieldQuarter className="text-primary" /> Staff Activity Logs
                </h3>
                <Link href="/dashboard/activity-logs" className="text-xs font-bold text-primary hover:underline flex items-center gap-0.5">
                  View Full Audit <BiChevronRight />
                </Link>
              </div>
              {activities.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">No recent staff activity logged.</p>
              ) : (
                <div className="w-full border border-slate-200">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="px-3 py-2 text-center">ID</th>
                        <th className="px-3 py-2">Staff</th>
                        <th className="px-3 py-2">Action</th>
                        <th className="hidden md:table-cell px-3 py-2">Details</th>
                        <th className="px-3 py-2 text-center">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {activities.slice(0, 5).map(act => (
                        <tr key={act.activity_id} className="hover:bg-slate-50 transition">
                          <td className="px-3 py-2 text-center font-mono text-slate-500">#{act.activity_id}</td>
                          <td className="px-3 py-2 font-bold text-slate-800">{act.staff_name || 'System'}</td>
                          <td className="px-3 py-2 font-semibold text-slate-700">{act.action}</td>
                          <td className="hidden md:table-cell px-3 py-2 text-slate-500 truncate max-w-[250px]">{act.details || '—'}</td>
                          <td className="px-3 py-2 text-center text-slate-500">{formatDate(act.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        )}

        {/* ========================================================= */}
        {/* MANAGER DASHBOARD VIEW                                    */}
        {/* ========================================================= */}
        {role === 'manager' && (
          <div className="flex flex-col gap-6 md:gap-8">
            
            {/* Branch Summary Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200 p-5 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Branch Sales Orders</p>
                  <h3 className="text-xl font-bold text-slate-800 mt-1">{branchSales.length} Invoices</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">Logged Sales</p>
                </div>
                <div className="w-11 h-11 bg-primary text-white flex items-center justify-center text-2xl font-bold">
                  <BiCart />
                </div>
              </div>

              <div className="bg-white border border-slate-200 p-5 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Branch Purchases</p>
                  <h3 className="text-xl font-bold text-slate-800 mt-1">{branchPurchases.length} Orders</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">Procurement Orders</p>
                </div>
                <div className="w-11 h-11 bg-blue-600 text-white flex items-center justify-center text-2xl font-bold">
                  <BiDollarCircle />
                </div>
              </div>

              <div className="bg-white border border-slate-200 p-5 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Store Staff Logs</p>
                  <h3 className="text-xl font-bold text-slate-800 mt-1">{activities.length} Entries</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">Operational Activity</p>
                </div>
                <div className="w-11 h-11 bg-amber-600 text-white flex items-center justify-center text-2xl font-bold">
                  <BiShieldQuarter />
                </div>
              </div>

              <div className="bg-white border border-slate-200 p-5 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Quick Checkout</p>
                  <Link href="/dashboard/sale" className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary-dark text-white text-xs font-bold transition">
                    <BiPlus /> POS Checkout
                  </Link>
                </div>
                <div className="w-11 h-11 bg-emerald-600 text-white flex items-center justify-center text-2xl font-bold">
                  <BiStoreAlt />
                </div>
              </div>
            </div>

            {/* Manager Branch Sales & Staff Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              <div className="bg-white border border-slate-200 p-5 shadow-sm flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-800">Branch Recent Sales</h3>
                  <Link href="/dashboard/history" className="text-xs font-bold text-primary hover:underline flex items-center gap-0.5">
                    View Sales <BiChevronRight />
                  </Link>
                </div>
                {branchSales.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">No sales recorded for this branch.</p>
                ) : (
                  <div className="w-full border border-slate-200">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                        <tr>
                          <th className="px-3 py-2 text-center">ID</th>
                          <th className="px-3 py-2">Customer</th>
                          <th className="px-3 py-2 text-right">Amount</th>
                          <th className="px-3 py-2 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {branchSales.slice(0, 5).map(s => (
                          <tr key={s.order_id} className="hover:bg-slate-50 transition">
                            <td className="px-3 py-2 text-center font-mono font-bold text-slate-800">#{s.order_id}</td>
                            <td className="px-3 py-2 font-semibold text-slate-800 truncate max-w-[120px]">{s.customer_name || 'Walk-in'}</td>
                            <td className="px-3 py-2 text-right font-bold text-slate-900">{formatMoney(s.total_amount)}</td>
                            <td className="px-3 py-2 text-center">
                              <span className={`px-2 py-0.5 text-[9px] font-bold uppercase border ${getStatusBadge(s.status)}`}>
                                {s.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="bg-white border border-slate-200 p-5 shadow-sm flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-800">Branch Staff Activity</h3>
                  <Link href="/dashboard/activity-logs" className="text-xs font-bold text-primary hover:underline flex items-center gap-0.5">
                    View Logs <BiChevronRight />
                  </Link>
                </div>
                {activities.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">No store activity recorded.</p>
                ) : (
                  <div className="w-full border border-slate-200">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                        <tr>
                          <th className="px-3 py-2">Staff</th>
                          <th className="px-3 py-2">Action</th>
                          <th className="px-3 py-2 text-center">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {activities.slice(0, 5).map(act => (
                          <tr key={act.activity_id} className="hover:bg-slate-50 transition">
                            <td className="px-3 py-2 font-bold text-slate-800">{act.staff_name || 'Staff'}</td>
                            <td className="px-3 py-2 font-medium text-slate-700">{act.action}</td>
                            <td className="px-3 py-2 text-center text-slate-500">{formatDate(act.created_at)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

        {/* ========================================================= */}
        {/* SALES AGENT & STAFF DASHBOARD VIEW                       */}
        {/* ========================================================= */}
        {(role === 'sales' || role === 'staff') && (
          <div className="flex flex-col gap-6 md:gap-8">
            
            {/* Quick Actions & Desk Shortcuts */}
            <div className="bg-white border border-slate-200 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-800">Sales Desk & Fulfillment</h2>
                <p className="text-xs text-slate-500 mt-0.5">Process new checkout orders, inspect inventory, and view your sales ledger.</p>
              </div>
              <div className="flex items-center gap-2">
                <Link 
                  href="/dashboard/sale"
                  className="px-4 py-2.5 bg-primary hover:bg-primary-dark text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                >
                  <BiCart className="text-base" /> Create Invoice Sale
                </Link>
                <Link 
                  href="/dashboard/history"
                  className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                >
                  <BiHistory className="text-base" /> Sales History
                </Link>
              </div>
            </div>

            {/* Recent Orders List */}
            <div className="bg-white border border-slate-200 p-5 shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-800">Store Latest Sales Orders</h3>
                <Link href="/dashboard/orders" className="text-xs font-bold text-primary hover:underline flex items-center gap-0.5">
                  View Orders <BiChevronRight />
                </Link>
              </div>
              {sales.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8">No recent orders recorded.</p>
              ) : (
                <div className="w-full border border-slate-200">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="px-3 py-2.5 text-center">Order ID</th>
                        <th className="px-3 py-2.5">Customer Name</th>
                        <th className="hidden sm:table-cell px-3 py-2.5">Phone</th>
                        <th className="px-3 py-2.5 text-right">Amount</th>
                        <th className="px-3 py-2.5 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {sales.slice(0, 5).map(order => (
                        <tr key={order.order_id} className="hover:bg-slate-50 transition">
                          <td className="px-3 py-2.5 text-center font-mono font-bold text-slate-800">#{order.order_id}</td>
                          <td className="px-3 py-2.5 font-semibold text-slate-800">{order.customer_name || 'Walk-in Customer'}</td>
                          <td className="hidden sm:table-cell px-3 py-2.5 font-medium text-slate-500">{order.phone}</td>
                          <td className="px-3 py-2.5 text-right font-bold text-slate-900">{formatMoney(order.total_amount)}</td>
                          <td className="px-3 py-2.5 text-center">
                            <span className={`px-2 py-0.5 text-[9px] font-bold uppercase border ${getStatusBadge(order.status)}`}>
                              {order.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  )
}

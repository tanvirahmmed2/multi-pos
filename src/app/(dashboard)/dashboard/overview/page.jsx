'use client'
import React, { useContext, useEffect, useState } from 'react'
import Link from 'next/link'
import axios from 'axios'
import { Context } from '@/component/helper/Context'
import { 
  BiDollarCircle, 
  BiWallet,
  BiCart, 
  BiUserCheck, 
  BiPackage, 
  BiTrendingUp,
  BiStoreAlt,
  BiBuilding,
  BiRefresh,
  BiChevronRight,
  BiCog,
  BiLoaderAlt,
  BiShieldX,
  BiHome
} from 'react-icons/bi'

export default function AdminOverviewPage() {
  const { dashSidebar, user, loading: userLoading } = useContext(Context)
  
  const [stats, setStats] = useState({
    currentBalance: 0,
    stockBalance: 0,
    stockItems: 0,
    totalItems: 0,
    totalBranch: 0,
    totalStaff: 0,
    latestSales: [],
    latestPayments: [],
    latestWithdrawals: [],
    latestPurchasePayments: [],
    latestSalaryPayments: [],
    latestExpenses: []
  })

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState('sales')

  const fetchData = async () => {
    try {
      const res = await axios.get('/api/dashboard/stats')
      setStats(res.data)
    } catch (err) {
      console.error('Error fetching admin overview data:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    if (userLoading) return
    if (user && user.role === 'admin') {
      fetchData()
    } else {
      setLoading(false)
    }
  }, [user, userLoading])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchData()
  }

  if (userLoading || loading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <BiLoaderAlt className="animate-spin text-4xl text-slate-800" />
          <p className="text-slate-600 text-sm font-semibold animate-pulse">Loading overview console...</p>
        </div>
      </div>
    )
  }

  if (user && user.role !== 'admin') {
    return (
      <div className={`w-full min-h-screen bg-slate-50 pt-20 pb-12 px-4 md:px-8 transition-all duration-300 ${dashSidebar ? 'lg:pl-64' : 'lg:pl-8'}`}>
        <div className="bg-white border border-slate-200 shadow-sm p-8 max-w-md mx-auto text-center flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-rose-50 text-rose-600 flex items-center justify-center text-3xl font-bold border border-rose-100">
            <BiShieldX />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Access Restricted</h2>
            <p className="text-slate-500 text-xs mt-1.5 leading-relaxed">
              Only Administrators have authorization to access the Overview dashboard.
            </p>
          </div>
          <Link href="/dashboard" className="mt-2 px-6 py-2.5 text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer bg-primary hover:bg-primary-dark shadow-sm">
            <BiHome className="text-base" /> Return to Dashboard
          </Link>
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

  const tabs = [
    { id: 'sales', label: 'Latest Sales', count: stats.latestSales?.length || 0, link: '/dashboard/history' },
    { id: 'payments', label: 'Order Payments', count: stats.latestPayments?.length || 0, link: '/dashboard/payments' },
    { id: 'withdrawals', label: 'Withdrawals', count: stats.latestWithdrawals?.length || 0, link: '/dashboard/withdrawals' },
    { id: 'purchases', label: 'Purchase Payments', count: stats.latestPurchasePayments?.length || 0, link: '/dashboard/purchase-payments' },
    { id: 'salaries', label: 'Salary Payments', count: stats.latestSalaryPayments?.length || 0, link: '/dashboard/salary-payments' },
    { id: 'expenses', label: 'Expenses', count: stats.latestExpenses?.length || 0, link: '/dashboard/expenses' }
  ]

  return (
    <div className={`w-full min-h-screen bg-slate-50 pt-20 pb-12 px-2 sm:px-4 md:px-8 transition-all duration-300 ${dashSidebar ? 'lg:pl-64' : 'lg:pl-8'}`}>
      <div className="w-full flex flex-col gap-6 md:gap-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-4 gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
              <BiHome className="text-primary" /> Admin Overview
            </h1>
            <p className="text-xs text-slate-500 mt-1">Real-time financial indicators, inventory metrics, and recent transaction ledgers.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 transition cursor-pointer shadow-sm disabled:opacity-50"
              title="Refresh Stats"
            >
              <BiRefresh className={`text-xl ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <Link 
              href="/dashboard/settings"
              className="px-4 py-2.5 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm bg-primary hover:bg-primary-dark"
            >
              <BiCog className="text-base" /> Settings
            </Link>
          </div>
        </div>

        {/* 6 Summary KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          
          <div className="bg-white border border-slate-200 p-4 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Current Balance</p>
              <h2 className="text-lg font-bold text-slate-900 mt-1">{formatMoney(stats.currentBalance)}</h2>
              <p className="text-[10px] text-slate-500 mt-0.5">Available Funds</p>
            </div>
            <div className="w-10 h-10 text-white flex items-center justify-center text-xl shrink-0 font-bold bg-primary">
              <BiWallet />
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-4 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Stock Balance</p>
              <h2 className="text-lg font-bold text-slate-800 mt-1">{formatMoney(stats.stockBalance)}</h2>
              <p className="text-[10px] text-slate-500 mt-0.5">Retail Stock Value</p>
            </div>
            <div className="w-10 h-10 bg-emerald-600 text-white flex items-center justify-center text-xl shrink-0 font-bold">
              <BiTrendingUp />
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-4 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Stock Items</p>
              <h2 className="text-lg font-bold text-slate-800 mt-1">{stats.stockItems.toLocaleString()} Units</h2>
              <p className="text-[10px] text-slate-500 mt-0.5">Inventory Count</p>
            </div>
            <div className="w-10 h-10 bg-amber-600 text-white flex items-center justify-center text-xl shrink-0 font-bold">
              <BiPackage />
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-4 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Items</p>
              <h2 className="text-lg font-bold text-slate-800 mt-1">{stats.totalItems.toLocaleString()} Products</h2>
              <p className="text-[10px] text-slate-500 mt-0.5">Catalog Products</p>
            </div>
            <div className="w-10 h-10 bg-blue-600 text-white flex items-center justify-center text-xl shrink-0 font-bold">
              <BiStoreAlt />
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-4 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Branch</p>
              <h2 className="text-lg font-bold text-slate-800 mt-1">{stats.totalBranch} Outlets</h2>
              <p className="text-[10px] text-slate-500 mt-0.5">Store Locations</p>
            </div>
            <div className="w-10 h-10 bg-sky-600 text-white flex items-center justify-center text-xl shrink-0 font-bold">
              <BiBuilding />
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-4 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Staff</p>
              <h2 className="text-lg font-bold text-slate-800 mt-1">{stats.totalStaff} Members</h2>
              <p className="text-[10px] text-slate-500 mt-0.5">Staff Accounts</p>
            </div>
            <div className="w-10 h-10 bg-purple-600 text-white flex items-center justify-center text-xl shrink-0 font-bold">
              <BiUserCheck />
            </div>
          </div>

        </div>

        {/* Recent Transactions Section */}
        <div className="bg-white border border-slate-200 shadow-sm p-4 sm:p-6 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Recent Transaction Ledgers</h3>
              <p className="text-xs text-slate-500 mt-0.5">Inspect the 10 latest activities across sales, collections, withdrawals, purchasing, payroll, and expenses.</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link 
                href={tabs.find(t => t.id === activeTab)?.link || '/dashboard'} 
                className="text-xs font-bold text-primary hover:text-primary-dark flex items-center gap-0.5 transition"
              >
                View Full Module <BiChevronRight className="text-base" />
              </Link>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto border-b border-slate-200 pb-1 scrollbar-none">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-2 text-xs font-bold whitespace-nowrap transition cursor-pointer border-b-2 ${
                  activeTab === tab.id
                    ? 'border-primary text-primary bg-slate-50'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {tab.label}
                <span className={`ml-1.5 px-1.5 py-0.2 text-[10px] ${
                  activeTab === tab.id ? 'bg-primary text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Tab 1: Latest Sales */}
          {activeTab === 'sales' && (
            <div className="w-full border border-slate-200">
              {stats.latestSales.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8">No recent sales records.</p>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-2.5 text-center">Order ID</th>
                      <th className="px-3 py-2.5">Customer</th>
                      <th className="hidden sm:table-cell px-3 py-2.5">Phone</th>
                      <th className="px-3 py-2.5 text-right">Amount</th>
                      <th className="px-3 py-2.5 text-center">Status</th>
                      <th className="hidden md:table-cell px-3 py-2.5 text-center">Date</th>
                      <th className="px-3 py-2.5 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {stats.latestSales.map(item => (
                      <tr key={item.order_id} className="hover:bg-slate-50 transition">
                        <td className="px-3 py-2.5 text-center font-mono font-bold text-slate-800">#{item.order_id}</td>
                        <td className="px-3 py-2.5 font-semibold text-slate-800 max-w-[140px] truncate">{item.customer_name || 'Walk-in Customer'}</td>
                        <td className="hidden sm:table-cell px-3 py-2.5 font-medium text-slate-500">{item.phone}</td>
                        <td className="px-3 py-2.5 text-right font-bold text-slate-900">{formatMoney(item.total_amount)}</td>
                        <td className="px-3 py-2.5 text-center">
                          <span className={`px-2 py-0.5 text-[9px] font-bold uppercase border ${getStatusBadge(item.status)}`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="hidden md:table-cell px-3 py-2.5 text-center text-slate-500">{formatDate(item.created_at)}</td>
                        <td className="px-3 py-2.5 text-center">
                          <Link href={`/dashboard/sale/${item.order_id}`} className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold transition">
                            Details
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Tab 2: Order Payments */}
          {activeTab === 'payments' && (
            <div className="w-full border border-slate-200">
              {stats.latestPayments.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8">No order payment logs.</p>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-2.5 text-center">Payment ID</th>
                      <th className="px-3 py-2.5">Customer / Phone</th>
                      <th className="hidden sm:table-cell px-3 py-2.5">Method</th>
                      <th className="px-3 py-2.5 text-right">Amount</th>
                      <th className="px-3 py-2.5 text-center">Status</th>
                      <th className="hidden md:table-cell px-3 py-2.5 text-center">Paid Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {stats.latestPayments.map(item => (
                      <tr key={item.payment_id} className="hover:bg-slate-50 transition">
                        <td className="px-3 py-2.5 text-center font-mono font-bold text-slate-800">#{item.payment_id} (Order #{item.order_id})</td>
                        <td className="px-3 py-2.5 font-semibold text-slate-800">
                          {item.customer_name || 'Customer'}
                          <span className="block text-[10px] text-slate-400 font-normal">{item.phone}</span>
                        </td>
                        <td className="hidden sm:table-cell px-3 py-2.5 font-medium uppercase text-slate-600">{item.payment_method || 'Cash'}</td>
                        <td className="px-3 py-2.5 text-right font-bold text-slate-900">{formatMoney(item.amount)}</td>
                        <td className="px-3 py-2.5 text-center">
                          <span className={`px-2 py-0.5 text-[9px] font-bold uppercase border ${getStatusBadge(item.payment_status)}`}>
                            {item.payment_status}
                          </span>
                        </td>
                        <td className="hidden md:table-cell px-3 py-2.5 text-center text-slate-500">{formatDate(item.paid_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Tab 3: Withdrawals */}
          {activeTab === 'withdrawals' && (
            <div className="w-full border border-slate-200">
              {stats.latestWithdrawals.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8">No withdrawal logs.</p>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-2.5 text-center">ID</th>
                      <th className="px-3 py-2.5">Investor</th>
                      <th className="hidden sm:table-cell px-3 py-2.5">Type</th>
                      <th className="hidden sm:table-cell px-3 py-2.5">Method</th>
                      <th className="px-3 py-2.5 text-right">Amount</th>
                      <th className="px-3 py-2.5 text-center">Status</th>
                      <th className="hidden md:table-cell px-3 py-2.5 text-center">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {stats.latestWithdrawals.map(item => (
                      <tr key={item.withdrawal_id} className="hover:bg-slate-50 transition">
                        <td className="px-3 py-2.5 text-center font-mono font-bold text-slate-800">#{item.withdrawal_id}</td>
                        <td className="px-3 py-2.5 font-semibold text-slate-800">{item.investor_display_name}</td>
                        <td className="hidden sm:table-cell px-3 py-2.5 font-medium uppercase text-slate-500">{item.withdrawal_type}</td>
                        <td className="hidden sm:table-cell px-3 py-2.5 uppercase text-slate-500">{item.payment_method}</td>
                        <td className="px-3 py-2.5 text-right font-bold text-rose-700">{formatMoney(item.amount)}</td>
                        <td className="px-3 py-2.5 text-center">
                          <span className={`px-2 py-0.5 text-[9px] font-bold uppercase border ${getStatusBadge(item.status)}`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="hidden md:table-cell px-3 py-2.5 text-center text-slate-500">{formatDate(item.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Tab 4: Purchase Payments */}
          {activeTab === 'purchases' && (
            <div className="w-full border border-slate-200">
              {stats.latestPurchasePayments.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8">No purchase payment logs.</p>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-2.5 text-center">Payment ID</th>
                      <th className="px-3 py-2.5">Invoice / Supplier</th>
                      <th className="hidden sm:table-cell px-3 py-2.5">Method</th>
                      <th className="px-3 py-2.5 text-right">Amount Paid</th>
                      <th className="hidden md:table-cell px-3 py-2.5 text-center">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {stats.latestPurchasePayments.map(item => (
                      <tr key={item.payment_id} className="hover:bg-slate-50 transition">
                        <td className="px-3 py-2.5 text-center font-mono font-bold text-slate-800">#{item.payment_id}</td>
                        <td className="px-3 py-2.5 font-semibold text-slate-800">
                          {item.supplier_name || 'Supplier'}
                          <span className="block text-[10px] text-slate-400 font-mono">Invoice: {item.invoice_no || 'N/A'}</span>
                        </td>
                        <td className="hidden sm:table-cell px-3 py-2.5 uppercase text-slate-500">{item.payment_method}</td>
                        <td className="px-3 py-2.5 text-right font-bold text-slate-900">{formatMoney(item.amount_paid)}</td>
                        <td className="hidden md:table-cell px-3 py-2.5 text-center text-slate-500">{formatDate(item.payment_date)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Tab 5: Salary Payments */}
          {activeTab === 'salaries' && (
            <div className="w-full border border-slate-200">
              {stats.latestSalaryPayments.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8">No salary payment logs.</p>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-2.5 text-center">Payment ID</th>
                      <th className="px-3 py-2.5">Staff Name</th>
                      <th className="hidden sm:table-cell px-3 py-2.5">Month</th>
                      <th className="hidden sm:table-cell px-3 py-2.5">Method</th>
                      <th className="px-3 py-2.5 text-right">Amount</th>
                      <th className="px-3 py-2.5 text-center">Status</th>
                      <th className="hidden md:table-cell px-3 py-2.5 text-center">Payment Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {stats.latestSalaryPayments.map(item => (
                      <tr key={item.payment_id} className="hover:bg-slate-50 transition">
                        <td className="px-3 py-2.5 text-center font-mono font-bold text-slate-800">#{item.payment_id}</td>
                        <td className="px-3 py-2.5 font-semibold text-slate-800">
                          {item.staff_name || 'Staff'}
                          <span className="block text-[10px] text-slate-400 uppercase">{item.staff_role}</span>
                        </td>
                        <td className="hidden sm:table-cell px-3 py-2.5 font-medium text-slate-600">{item.payment_month}</td>
                        <td className="hidden sm:table-cell px-3 py-2.5 uppercase text-slate-500">{item.payment_method}</td>
                        <td className="px-3 py-2.5 text-right font-bold text-slate-900">{formatMoney(item.amount)}</td>
                        <td className="px-3 py-2.5 text-center">
                          <span className={`px-2 py-0.5 text-[9px] font-bold uppercase border ${getStatusBadge(item.status)}`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="hidden md:table-cell px-3 py-2.5 text-center text-slate-500">{formatDate(item.payment_date)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Tab 6: Expenses */}
          {activeTab === 'expenses' && (
            <div className="w-full border border-slate-200">
              {stats.latestExpenses.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8">No expense records.</p>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-2.5 text-center">ID</th>
                      <th className="px-3 py-2.5">Title / Category</th>
                      <th className="hidden sm:table-cell px-3 py-2.5">Branch</th>
                      <th className="px-3 py-2.5 text-right">Total</th>
                      <th className="px-3 py-2.5 text-right">Paid</th>
                      <th className="px-3 py-2.5 text-center">Status</th>
                      <th className="hidden md:table-cell px-3 py-2.5 text-center">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {stats.latestExpenses.map(item => (
                      <tr key={item.expense_id} className="hover:bg-slate-50 transition">
                        <td className="px-3 py-2.5 text-center font-mono font-bold text-slate-800">#{item.expense_id}</td>
                        <td className="px-3 py-2.5 font-semibold text-slate-800">
                          {item.title}
                          <span className="block text-[10px] text-slate-400 font-normal">{item.category}</span>
                        </td>
                        <td className="hidden sm:table-cell px-3 py-2.5 text-slate-500">{item.branch_name || 'Main Branch'}</td>
                        <td className="px-3 py-2.5 text-right font-bold text-slate-900">{formatMoney(item.total_amount)}</td>
                        <td className="px-3 py-2.5 text-right font-semibold text-emerald-700">{formatMoney(item.paid_amount)}</td>
                        <td className="px-3 py-2.5 text-center">
                          <span className={`px-2 py-0.5 text-[9px] font-bold uppercase border ${getStatusBadge(item.status)}`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="hidden md:table-cell px-3 py-2.5 text-center text-slate-500">{formatDate(item.expense_date)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

        </div>

        {/* Quick Admin Actions Grid */}
        <div className="bg-white border border-slate-200 p-5 md:p-6 shadow-sm flex flex-col gap-4">
          <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2.5">
            Quick Admin Management Modules
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <Link href="/dashboard/history" className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition font-bold text-xs text-slate-700 flex items-center justify-between group">
              <span>Sales History</span>
              <BiChevronRight className="text-base text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link href="/dashboard/payments" className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition font-bold text-xs text-slate-700 flex items-center justify-between group">
              <span>Order Payments</span>
              <BiChevronRight className="text-base text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link href="/dashboard/withdrawals" className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition font-bold text-xs text-slate-700 flex items-center justify-between group">
              <span>Withdrawals</span>
              <BiChevronRight className="text-base text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link href="/dashboard/purchase-payments" className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition font-bold text-xs text-slate-700 flex items-center justify-between group">
              <span>Purchase Payments</span>
              <BiChevronRight className="text-base text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link href="/dashboard/salary-payments" className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition font-bold text-xs text-slate-700 flex items-center justify-between group">
              <span>Salary Payments</span>
              <BiChevronRight className="text-base text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link href="/dashboard/expenses" className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition font-bold text-xs text-slate-700 flex items-center justify-between group">
              <span>Expenses</span>
              <BiChevronRight className="text-base text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>

      </div>
    </div>
  )
}

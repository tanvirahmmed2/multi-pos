'use client'
import React, { useContext, useEffect, useState } from 'react'
import Link from 'next/link'
import axios from 'axios'
import { Context } from '@/component/helper/Context'
import { 
  BiDollarCircle, 
  BiCart, 
  BiUserCheck, 
  BiPackage, 
  BiShieldQuarter,
  BiTrendingUp,
  BiStoreAlt,
  BiRefresh,
  BiChevronRight,
  BiCog,
  BiLoaderAlt,
  BiTimeFive,
  BiCheckCircle
} from 'react-icons/bi'

export default function AdminOverviewPage() {
  const { dashSidebar, user, loading: userLoading } = useContext(Context)
  
  const [stats, setStats] = useState({
    staff: 0,
    customers: 0,
    products: 0,
    totalStock: 0,
    stockValue: 0,
    stockCost: 0,
    orders: 0,
    revenue: 0,
    pendingOrders: 0,
    completedOrders: 0,
    categories: 0,
    brands: 0
  })
  const [recentOrders, setRecentOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = async () => {
    try {
      const [statsRes, salesRes] = await Promise.all([
        axios.get('/api/dashboard/stats'),
        axios.get('/api/sale')
      ])
      setStats(statsRes.data)
      setRecentOrders(salesRes.data.slice(0, 5))
    } catch (err) {
      console.error('Error fetching admin overview data:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    if (userLoading) return
    if (user) {
      fetchData()
    }
  }, [user, userLoading])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchData()
  }

  if (userLoading || (loading && !user)) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <BiLoaderAlt className="animate-spin text-4xl text-slate-800" />
          <p className="text-slate-600 text-sm font-semibold animate-pulse">Loading overview...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`w-full min-h-screen bg-slate-50 pt-20 pb-12 px-2 sm:px-4 md:px-8 transition-all duration-300 ${dashSidebar ? 'lg:pl-64' : 'lg:pl-8'}`}>
      <div className="w-full flex flex-col gap-6 md:gap-8">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-4 gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">Admin Overview</h1>
            <p className="text-xs text-slate-500 mt-1">Simple key indicators: Staff, Products, Sales, Stock, Stock Price, Total Orders, Pending Orders, and Completed Orders.</p>
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
              <BiCog className="text-base" /> Store Settings
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          
          <div className="bg-white border border-slate-200 p-5 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Staff</p>
              <h2 className="text-2xl font-bold text-slate-800 mt-1">{stats.staff} Members</h2>
              <p className="text-[11px] text-slate-500 mt-0.5">Admins, Managers & Sales</p>
            </div>
            <div className="w-12 h-12 text-white flex items-center justify-center text-2xl shrink-0 font-bold bg-primary">
              <BiUserCheck />
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-5 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Product</p>
              <h2 className="text-2xl font-bold text-slate-800 mt-1">{stats.products} Products</h2>
              <p className="text-[11px] text-slate-500 mt-0.5">{stats.categories} Categories / {stats.brands} Brands</p>
            </div>
            <div className="w-12 h-12 bg-blue-600 text-white flex items-center justify-center text-2xl shrink-0 font-bold">
              <BiStoreAlt />
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-5 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Sales</p>
              <h2 className="text-2xl font-bold text-slate-900 mt-1">
                ৳{stats.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">Settled Gross Earnings</p>
            </div>
            <div className="w-12 h-12 text-white flex items-center justify-center text-2xl shrink-0 font-bold bg-primary">
              <BiDollarCircle />
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-5 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Stock</p>
              <h2 className="text-2xl font-bold text-slate-800 mt-1">{stats.totalStock.toLocaleString()} Units</h2>
              <p className="text-[11px] text-slate-500 mt-0.5">Physical Inventory Count</p>
            </div>
            <div className="w-12 h-12 bg-amber-600 text-white flex items-center justify-center text-2xl shrink-0 font-bold">
              <BiPackage />
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-5 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Stock Price</p>
              <h2 className="text-2xl font-bold text-slate-800 mt-1">
                ৳{stats.stockValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">Retail Inventory Value</p>
            </div>
            <div className="w-12 h-12 text-white flex items-center justify-center text-2xl shrink-0 font-bold bg-primary">
              <BiTrendingUp />
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-5 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Order</p>
              <h2 className="text-2xl font-bold text-slate-800 mt-1">{stats.orders} Orders</h2>
              <p className="text-[11px] text-slate-500 mt-0.5">All Time Orders Logged</p>
            </div>
            <div className="w-12 h-12 bg-sky-600 text-white flex items-center justify-center text-2xl shrink-0 font-bold">
              <BiCart />
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-5 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Pending Order</p>
              <h2 className="text-2xl font-bold text-amber-700 mt-1">{stats.pendingOrders} Orders</h2>
              <p className="text-[11px] text-slate-500 mt-0.5">Awaiting Processing</p>
            </div>
            <div className="w-12 h-12 bg-amber-500 text-white flex items-center justify-center text-2xl shrink-0 font-bold">
              <BiTimeFive />
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-5 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Completed Order</p>
              <h2 className="text-2xl font-bold text-slate-800 mt-1">{stats.completedOrders} Orders</h2>
              <p className="text-[11px] text-slate-500 mt-0.5">Delivered Successfully</p>
            </div>
            <div className="w-12 h-12 text-white flex items-center justify-center text-2xl shrink-0 font-bold bg-primary">
              <BiCheckCircle />
            </div>
          </div>

        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="lg:col-span-2 bg-white border border-slate-200 p-5 md:p-6 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800">Recent Customer Orders</h3>
              <Link href="/dashboard/history" className="text-xs font-bold text-slate-800 hover:text-slate-600 flex items-center gap-0.5 transition">
                View Sales History <BiChevronRight className="text-base" />
              </Link>
            </div>

            {recentOrders.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">No recent orders recorded.</p>
            ) : (
              <div className="w-full bg-white border border-slate-200 shadow-sm">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-100/80 text-slate-650 font-bold border-b border-slate-200">
                    <tr>
                      <th className="px-2.5 sm:px-3 py-2.5 text-center">ID</th>
                      <th className="px-2.5 sm:px-3 py-2.5">Customer</th>
                      <th className="hidden sm:table-cell px-2.5 sm:px-3 py-2.5">Phone</th>
                      <th className="px-2.5 sm:px-3 py-2.5 text-right">Amount</th>
                      <th className="px-2.5 sm:px-3 py-2.5 text-center">Status</th>
                      <th className="px-2.5 sm:px-3 py-2.5 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {recentOrders.map(order => (
                      <tr key={order.order_id} className="hover:bg-slate-50 transition">
                        <td className="px-2.5 sm:px-3 py-2.5 text-center font-bold text-slate-800">#{order.order_id}</td>
                        <td className="px-2.5 sm:px-3 py-2.5 font-semibold text-slate-800 max-w-[100px] sm:max-w-[140px] truncate">{order.customer_name || 'Guest'}</td>
                        <td className="hidden sm:table-cell px-2.5 sm:px-3 py-2.5 font-medium text-slate-500">{order.phone}</td>
                        <td className="px-2.5 sm:px-3 py-2.5 text-right font-bold text-slate-900">৳{parseFloat(order.total_amount).toFixed(2)}</td>
                        <td className="px-2.5 sm:px-3 py-2.5 text-center">
                          <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase border text-primary bg-primary/10 border-primary/30">
                            {order.status}
                          </span>
                        </td>
                        <td className="px-2.5 sm:px-3 py-2.5 text-center">
                          <Link href={`/dashboard/sale/${order.order_id}`} className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold transition cursor-pointer">
                            Details
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-200 p-5 md:p-6 shadow-sm flex flex-col gap-4">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2.5">
              Quick Admin Actions
            </h3>
            
            <div className="grid grid-cols-1 gap-2.5">
              <Link href="/dashboard/people" className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition font-bold text-xs text-slate-700 flex items-center justify-between group">
                <span>Accounts & Staff Roles</span>
                <BiChevronRight className="text-base text-slate-400" />
              </Link>
              <Link href="/dashboard/stock" className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition font-bold text-xs text-slate-700 flex items-center justify-between group">
                <span>Warehouse Stock Inventory</span>
                <BiChevronRight className="text-base text-slate-400" />
              </Link>
              <Link href="/dashboard/sale" className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition font-bold text-xs text-slate-700 flex items-center justify-between group">
                <span>Global Sales Desk</span>
                <BiChevronRight className="text-base text-slate-400" />
              </Link>
              <Link href="/dashboard/payments" className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition font-bold text-xs text-slate-700 flex items-center justify-between group">
                <span>Payments Audit Ledger</span>
                <BiChevronRight className="text-base text-slate-400" />
              </Link>
              <Link href="/dashboard/report" className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition font-bold text-xs text-slate-700 flex items-center justify-between group">
                <span>Analytics Reports & Trends</span>
                <BiChevronRight className="text-base text-slate-400" />
              </Link>
            </div>
          </div>

        </div>

      </div>
    </div>
  )
}



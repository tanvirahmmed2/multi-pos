'use client'
import React, { useContext, useEffect, useState } from 'react'
import Link from 'next/link'
import axios from 'axios'
import { Context } from '@/component/helper/Context'
import { 
  BiDollarCircle, 
  BiCart, 
  BiTimeFive, 
  BiPackage, 
  BiTag, 
  BiCategory, 
  BiLoaderAlt, 
  BiShieldQuarter,
  BiPlusCircle,
  BiTrendingUp,
  BiStore,
  BiUser
} from 'react-icons/bi'

export default function ManagerOverviewPage() {
  const { dashSidebar, user, loading: userLoading, website } = useContext(Context)
  const themeColor = website?.theme_color || '#73976A'
  
  const [stats, setStats] = useState({
    categories: 0,
    brands: 0,
    products: 0,
    users: 0,
    orders: 0,
    revenue: 0,
    pendingOrders: 0
  })
  const [recentOrders, setRecentOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (userLoading) return

    const fetchData = async () => {
      try {
        const [statsRes, salesRes] = await Promise.all([
          axios.get('/api/dashboard/stats'),
          axios.get('/api/sale')
        ])
        setStats(statsRes.data)
        setRecentOrders(salesRes.data.slice(0, 5))
      } catch (err) {
        console.error('Error fetching manager overview data:', err)
      } finally {
        setLoading(false)
      }
    }

    if (user && ['manager', 'admin'].includes(user.role)) {
      fetchData()
    }
  }, [user, userLoading])

  if (userLoading || (loading && !user)) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-2">
          <BiLoaderAlt className="animate-spin text-4xl text-slate-800" />
          <p className="text-slate-600 text-sm font-semibold animate-pulse">Loading manager overview...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`w-full min-h-screen bg-slate-50 pt-20 pb-12 px-2 sm:px-4 md:px-8 transition-all duration-300 ${dashSidebar ? 'lg:pl-68' : 'lg:pl-8'}`}>
      <div className="w-full flex flex-col gap-8">
        
        {/* Header */}
        <div className="border-b border-slate-200 pb-4">
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Manager Overview</h1>
          <p className="text-xs text-slate-500 mt-1">Review operational performance metrics, catalog statistics, and manage inventory.</p>
        </div>

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1 */}
          <div className="bg-white border border-slate-200 p-5 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Sales</p>
              <h2 className="text-xl font-bold text-slate-800 mt-0.5">৳{stats.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
            </div>
            <div className="w-12 h-12 text-white flex items-center justify-center text-2xl shrink-0 font-bold" style={{ backgroundColor: themeColor }}>
              <BiDollarCircle />
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white border border-slate-200 p-5 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Orders</p>
              <h2 className="text-xl font-bold text-slate-800 mt-0.5">{stats.orders}</h2>
            </div>
            <div className="w-12 h-12 bg-blue-600 text-white flex items-center justify-center text-2xl shrink-0 font-bold">
              <BiCart />
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white border border-slate-200 p-5 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Pending Orders</p>
              <h2 className="text-xl font-bold text-amber-700 mt-0.5">{stats.pendingOrders}</h2>
            </div>
            <div className="w-12 h-12 bg-amber-500 text-white flex items-center justify-center text-2xl shrink-0 font-bold">
              <BiTimeFive />
            </div>
          </div>

          {/* Card 4 */}
          <div className="bg-white border border-slate-200 p-5 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Products Catalog</p>
              <h2 className="text-xl font-bold text-slate-800 mt-0.5">{stats.products} Items</h2>
            </div>
            <div className="w-12 h-12 bg-purple-600 text-white flex items-center justify-center text-2xl shrink-0 font-bold">
              <BiPackage />
            </div>
          </div>
        </div>

        {/* Quick Operations and Catalog Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions Panel */}
          <div className="bg-white border border-slate-200 p-6 shadow-sm flex flex-col gap-4">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">Quick Actions</h3>
            <div className="grid grid-cols-1 gap-2.5">
              <Link href="/dashboard/manager/product/create" className="flex items-center gap-2 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 px-4 py-2.5 border border-slate-200 transition cursor-pointer">
                <BiPlusCircle className="text-base text-slate-500" /> Create New Product
              </Link>
              <Link href="/dashboard/manager/category/create" className="flex items-center gap-2 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 px-4 py-2.5 border border-slate-200 transition cursor-pointer">
                <BiPlusCircle className="text-base text-slate-500" /> Create New Category
              </Link>
              <Link href="/dashboard/manager/brands/create" className="flex items-center gap-2 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 px-4 py-2.5 border border-slate-200 transition cursor-pointer">
                <BiPlusCircle className="text-base text-slate-500" /> Create New Brand
              </Link>
              <Link href="/dashboard/manager/stock" className="flex items-center gap-2 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 px-4 py-2.5 border border-slate-200 transition cursor-pointer">
                <BiPackage className="text-base text-slate-500" /> Stock Inventory Levels
              </Link>
              <Link href="/dashboard/manager/purchase" className="flex items-center gap-2 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 px-4 py-2.5 border border-slate-200 transition cursor-pointer">
                <BiStore className="text-base text-slate-500" /> Purchases & Restock Desk
              </Link>
            </div>
          </div>

          {/* Catalog Breakdown */}
          <div className="bg-white border border-slate-200 p-6 shadow-sm flex flex-col gap-4 lg:col-span-2">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">Catalog Structure</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
              <div className="bg-slate-50 p-4 border border-slate-200 text-center">
                <BiCategory className="text-2xl text-slate-400 mx-auto" />
                <h4 className="text-sm font-bold text-slate-800 mt-2">{stats.categories}</h4>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">Categories</p>
              </div>
              <div className="bg-slate-50 p-4 border border-slate-200 text-center">
                <BiTag className="text-2xl text-slate-400 mx-auto" />
                <h4 className="text-sm font-bold text-slate-800 mt-2">{stats.brands}</h4>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">Brands</p>
              </div>
              <div className="bg-slate-50 p-4 border border-slate-200 text-center">
                <BiUser className="text-2xl text-slate-400 mx-auto" />
                <h4 className="text-sm font-bold text-slate-800 mt-2">{stats.users}</h4>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">Registered Clients</p>
              </div>
            </div>
            <div className="bg-slate-50 border border-slate-200 p-4 flex gap-3 items-center mt-auto">
              <BiTrendingUp className="text-xl text-slate-600 shrink-0" />
              <p className="text-xs text-slate-600 leading-normal font-medium">
                Inventory data aggregates and catalog structural points are synced automatically with the cloud inventory system. Check supplier configurations to edit brand listings.
              </p>
            </div>
          </div>
        </div>

        {/* Recent Orders Panel */}
        <div className="bg-white border border-slate-200 p-6 shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-sm font-bold text-slate-800">Recent Store Orders</h3>
            <Link href="/dashboard/manager/sales" className="text-xs font-bold text-slate-800 hover:text-slate-600">
              View All Orders &rarr;
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-6">No orders have been recorded in the store yet.</p>
          ) : (
            <div className="w-full bg-white border border-slate-200 shadow-sm">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-100/80 text-slate-650 font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-2 text-center">ID</th>
                    <th className="px-3 py-2">Customer</th>
                    <th className="hidden sm:table-cell px-3 py-2">Phone</th>
                    <th className="px-3 py-2 text-right">Amount</th>
                    <th className="px-3 py-2 text-center">Status</th>
                    <th className="px-3 py-2 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {recentOrders.map(order => (
                    <tr key={order.order_id} className="hover:bg-slate-50/50 transition">
                      <td className="px-3 py-2.5 text-center font-bold text-slate-800">#{order.order_id}</td>
                      <td className="px-3 py-2.5 font-semibold text-slate-800">{order.customer_name || 'Guest'}</td>
                      <td className="hidden sm:table-cell px-3 py-2.5 font-medium text-slate-500">{order.phone}</td>
                      <td className="px-3 py-2.5 text-right font-bold text-slate-900">৳{parseFloat(order.total_amount).toFixed(2)}</td>
                      <td className="px-3 py-2.5 text-center">
                        <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase border" style={{ color: themeColor, backgroundColor: themeColor + '10', borderColor: themeColor + '30' }}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <Link href={`/dashboard/sales/sale/${order.order_id}`} className="px-2 py-1 bg-slate-900 text-white text-[10px] font-bold hover:bg-slate-800 cursor-pointer">
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

      </div>
    </div>
  )
}


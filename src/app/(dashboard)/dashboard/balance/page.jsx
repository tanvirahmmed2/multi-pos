'use client'
import React, { useContext, useEffect, useState } from 'react'
import Link from 'next/link'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Context } from '@/component/helper/Context'
import { 
  BiWallet, 
  BiPlus, 
  BiRefresh, 
  BiShieldX, 
  BiHome, 
  BiLoaderAlt, 
  BiTrendingUp, 
  BiTrendingDown, 
  BiDollarCircle, 
  BiInfoCircle,
  BiX,
  BiReceipt,
  BiCreditCard,
  BiTrash
} from 'react-icons/bi'

export default function DashboardBalancePage() {
  const { dashSidebar, user, loading: userLoading } = useContext(Context)
  
  const [data, setData] = useState({
    is_share_investment: false,
    available_balance: 0,
    total_manual_added: 0,
    total_sales_payments: 0,
    total_purchases: 0,
    total_expenses: 0,
    total_withdrawals: 0,
    total_salaries: 0,
    balance_transactions: []
  })

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = async () => {
    try {
      const res = await axios.get('/api/balance')
      setData(res.data)
    } catch (err) {
      console.error('Error loading balance data:', err)
      toast.error('Failed to load balance records')
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

  const handleDeleteTx = async (txId, amount) => {
    if (!window.confirm(`Are you sure you want to delete balance transaction #${txId}? This will deduct ৳${parseFloat(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} from the available balance.`)) {
      return
    }

    try {
      await axios.delete(`/api/balance/${txId}`)
      toast.success('Transaction deleted and balance updated!')
      fetchData()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete transaction')
      console.error(err)
    }
  }

  if (userLoading || loading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <BiLoaderAlt className="animate-spin text-4xl text-slate-800" />
          <p className="text-slate-600 text-sm font-semibold animate-pulse">Loading balance console...</p>
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
              Only Administrators have authorization to access the Balance Management console.
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
    return new Date(d).toLocaleString('en-GB', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className={`w-full min-h-screen bg-slate-50 pt-20 pb-12 px-2 sm:px-4 md:px-8 transition-all duration-300 ${dashSidebar ? 'lg:pl-64' : 'lg:pl-8'}`}>
      <div className="w-full flex flex-col gap-6 md:gap-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-4 gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
              <BiWallet className="text-primary" /> Balance Management
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Monitor real-time store balance, sales collections, purchases, expenses, and withdrawals.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 transition cursor-pointer shadow-sm disabled:opacity-50 flex items-center gap-1.5 text-xs font-bold"
              title="Refresh Balance Data"
            >
              <BiRefresh className={`text-xl ${refreshing ? 'animate-spin' : ''}`} /> Refresh Balance
            </button>
          </div>
        </div>

        {/* Summary KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
          
          <div className="bg-white border border-slate-200 p-5 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Current Balance</p>
              <h2 className="text-xl font-bold text-slate-900 mt-1">{formatMoney(data.available_balance)}</h2>
              <p className="text-[10px] text-slate-500 mt-0.5">Net Available Cash</p>
            </div>
            <div className="w-11 h-11 text-white flex items-center justify-center text-2xl shrink-0 font-bold bg-primary">
              <BiWallet />
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-5 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Sales Collections</p>
              <h2 className="text-xl font-bold text-slate-800 mt-1">{formatMoney(data.total_sales_payments)}</h2>
              <p className="text-[10px] text-slate-500 mt-0.5">Customer Payments Received</p>
            </div>
            <div className="w-11 h-11 bg-blue-600 text-white flex items-center justify-center text-2xl shrink-0 font-bold">
              <BiDollarCircle />
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-5 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Purchase Outflow</p>
              <h2 className="text-xl font-bold text-rose-700 mt-1">{formatMoney(data.total_purchases)}</h2>
              <p className="text-[10px] text-slate-500 mt-0.5">Supplier Payments Made</p>
            </div>
            <div className="w-11 h-11 bg-rose-600 text-white flex items-center justify-center text-2xl shrink-0 font-bold">
              <BiTrendingDown />
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-5 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Expenses Outflow</p>
              <h2 className="text-xl font-bold text-rose-700 mt-1">{formatMoney(data.total_expenses)}</h2>
              <p className="text-[10px] text-slate-500 mt-0.5">Operating Expenses Paid</p>
            </div>
            <div className="w-11 h-11 bg-amber-600 text-white flex items-center justify-center text-2xl shrink-0 font-bold">
              <BiReceipt />
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-5 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Salary Outflow</p>
              <h2 className="text-xl font-bold text-rose-700 mt-1">{formatMoney(data.total_salaries)}</h2>
              <p className="text-[10px] text-slate-500 mt-0.5">Staff Payroll Disbursed</p>
            </div>
            <div className="w-11 h-11 bg-purple-600 text-white flex items-center justify-center text-2xl shrink-0 font-bold">
              <BiCreditCard />
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-5 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Withdrawals Outflow</p>
              <h2 className="text-xl font-bold text-rose-700 mt-1">{formatMoney(data.total_withdrawals)}</h2>
              <p className="text-[10px] text-slate-500 mt-0.5">Capital & Profit Withdrawals</p>
            </div>
            <div className="w-11 h-11 bg-sky-600 text-white flex items-center justify-center text-2xl shrink-0 font-bold">
              <BiTrendingDown />
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

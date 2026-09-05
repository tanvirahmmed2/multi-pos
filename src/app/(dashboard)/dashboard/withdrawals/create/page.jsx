'use client'
import React, { useState, useEffect, useContext } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Context } from '@/component/helper/Context'
import { 
  BiUndo, 
  BiChevronLeft, 
  BiLoaderAlt, 
  BiCheckCircle, 
  BiUser, 
  BiDollarCircle, 
  BiInfoCircle, 
  BiErrorCircle, 
  BiShieldQuarter, 
  BiTrendingDown,
  BiCheck
} from 'react-icons/bi'

export default function CreateWithdrawalPage() {
  const router = useRouter()
  const { dashSidebar, currencySymbol } = useContext(Context)

  const [investors, setInvestors] = useState([])
  const [systemAvailableBalance, setSystemAvailableBalance] = useState(0)
  const [loading, setLoading] = useState(true)

  const [selectedInvestorId, setSelectedInvestorId] = useState('')
  const [selectedInvestor, setSelectedInvestor] = useState(null)
  
  const [amount, setAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [accountDetails, setAccountDetails] = useState('')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [invRes, balRes] = await Promise.all([
          axios.get('/api/investor'),
          axios.get('/api/available-balance').catch(() => ({ data: { total_available_balance: 0 } }))
        ])
        setInvestors(Array.isArray(invRes.data) ? invRes.data : [])
        const rawBal = balRes.data?.total_available_balance ?? balRes.data?.available_balance ?? 0
        setSystemAvailableBalance(parseFloat(rawBal) || 0)
      } catch (err) {
        toast.error('Failed to load initial data')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleInvestorSelect = (e) => {
    const invId = e.target.value
    setSelectedInvestorId(invId)
    if (!invId) {
      setSelectedInvestor(null)
      return
    }
    const found = investors.find(i => i.investor_id.toString() === invId.toString())
    setSelectedInvestor(found || null)
  }

  const numAmount = parseFloat(amount) || 0
  const profitBal = parseFloat(selectedInvestor?.profit_balance || 0)
  const investBal = parseFloat(selectedInvestor?.investment_balance || selectedInvestor?.total_investment || 0)
  const totalBal = profitBal + investBal

  const exceedsProfit = numAmount > profitBal
  const capitalReduction = exceedsProfit ? (numAmount - profitBal) : 0
  const newProfitBal = Math.max(0, profitBal - numAmount)
  const newInvestBal = Math.max(0, investBal - capitalReduction)

  const exceedsTotalFunds = numAmount > totalBal
  const exceedsStoreCash = numAmount > systemAvailableBalance

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!selectedInvestorId) {
      toast.error('Please select an investor first')
      return
    }
    if (numAmount <= 0) {
      toast.error('Please enter a valid withdrawal amount greater than zero')
      return
    }
    if (exceedsStoreCash) {
      toast.error(`Withdrawal amount (${currencySymbol || '৳'}${numAmount.toLocaleString()}) exceeds available store cash balance`)
      return
    }
    if (exceedsTotalFunds) {
      toast.error(`Withdrawal amount (${currencySymbol || '৳'}${numAmount.toLocaleString()}) exceeds investor's total available balance`)
      return
    }

    setSubmitting(true)
    try {
      await axios.post('/api/withdrawals', {
        investor_id: selectedInvestorId,
        amount: numAmount,
        payment_method: paymentMethod,
        account_details: accountDetails,
        note: note,
        withdrawal_type: exceedsProfit ? 'investment' : 'profit'
      })

      toast.success('Withdrawal recorded successfully!')
      router.push('/dashboard/withdrawals')
    } catch (err) {
      console.error(err)
      toast.error(err.response?.data?.error || 'Failed to record withdrawal')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className={`w-full min-h-screen bg-slate-50 pt-20 pb-12 px-4 md:px-8 transition-all duration-300 ${dashSidebar ? 'lg:pl-68' : 'lg:pl-8'} flex items-center justify-center`}>
        <div className="flex items-center gap-2 text-slate-500 font-semibold text-sm">
          <BiLoaderAlt className="animate-spin text-2xl text-amber-600" />
          <span>Loading investor details...</span>
        </div>
      </div>
    )
  }

  return (
    <div className={`w-full min-h-screen bg-slate-50/50 pt-20 pb-16 px-4 md:px-8 transition-all duration-300 ${dashSidebar ? 'lg:pl-68' : 'lg:pl-8'}`}>
      <div className="max-w-4xl mx-auto flex flex-col gap-6">

        {/* Top Header & Breadcrumb */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/withdrawals"
              className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-100 transition shadow-xs cursor-pointer"
              title="Back to Withdrawals List"
            >
              <BiChevronLeft className="text-xl" />
            </Link>
            <div>
              <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                <BiUndo className="text-amber-600 text-2xl" /> Record Investor Withdrawal
              </h1>
              <p className="text-slate-500 text-xs mt-0.5 font-medium">
                Withdraw investor earnings or capital investment with real-time balance checks.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">

          {/* Step 1: Investor Selection Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <BiUser className="text-amber-600 text-xl" />
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Step 1: Select Investor</h2>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase">
                Investor Name *
              </label>
              <select
                required
                value={selectedInvestorId}
                onChange={handleInvestorSelect}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition cursor-pointer"
              >
                <option value="">-- Choose an Investor --</option>
                {investors.map((inv) => (
                  <option key={inv.investor_id} value={inv.investor_id}>
                    {inv.name} {inv.phone ? `(${inv.phone})` : ''}
                  </option>
                ))}
              </select>
              {investors.length === 0 && (
                <p className="text-xs text-rose-600 font-semibold mt-1">
                  No investors found. Please create an investor in the Investors section first.
                </p>
              )}
            </div>
          </div>

          {/* Step 2: Investor Balance Breakdown Cards (Shown when investor selected) */}
          {selectedInvestor && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col gap-4 animate-fade-in">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <BiDollarCircle className="text-emerald-600 text-xl" />
                  <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                    Step 2: Available Balances for {selectedInvestor.name}
                  </h2>
                </div>
                {selectedInvestor.share_percentage > 0 && (
                  <span className="px-3 py-1 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold rounded-lg">
                    Equity Share: {selectedInvestor.share_percentage}%
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* 1. Profit Balance */}
                <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-xl p-4 flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">
                    Available Profit
                  </span>
                  <span className="text-lg font-black text-emerald-800 font-mono">
                    {currencySymbol || '৳'}{profitBal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-[10px] text-emerald-600 font-medium">Accumulated earnings</span>
                </div>

                {/* 2. Capital Investment Balance */}
                <div className="bg-indigo-50/60 border border-indigo-200/80 rounded-xl p-4 flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-widest">
                    Capital Investment
                  </span>
                  <span className="text-lg font-black text-indigo-800 font-mono">
                    {currencySymbol || '৳'}{investBal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-[10px] text-indigo-600 font-medium">Invested principal</span>
                </div>

                {/* 3. Total Investor Funds */}
                <div className="bg-teal-50/60 border border-teal-200/80 rounded-xl p-4 flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-teal-700 uppercase tracking-widest">
                    Total Investor Balance
                  </span>
                  <span className="text-lg font-black text-teal-900 font-mono">
                    {currencySymbol || '৳'}{totalBal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-[10px] text-teal-600 font-medium">Profit + Capital</span>
                </div>

                {/* 4. Store Cash Available */}
                <div className="bg-slate-100/80 border border-slate-200 rounded-xl p-4 flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                    Store Cash Balance
                  </span>
                  <span className="text-lg font-black text-slate-800 font-mono">
                    {currencySymbol || '৳'}{systemAvailableBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium font-mono">Available cash in store</span>
                </div>

              </div>
            </div>
          )}

          {/* Step 3: Withdrawal Amount & Details Card */}
          {selectedInvestor && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col gap-5 animate-fade-in">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <BiUndo className="text-amber-600 text-xl" />
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Step 3: Withdrawal Details</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* Withdrawal Amount */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase">
                    Withdrawal Amount ({currencySymbol || '৳'}) *
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-slate-400 font-bold text-sm pointer-events-none font-mono">
                      {currencySymbol || '৳'}
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-mono transition"
                    />
                  </div>
                </div>

                {/* Payment Method */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition cursor-pointer"
                  >
                    <option value="cash">Cash Payment</option>
                    <option value="bank">Bank Transfer</option>
                    <option value="mobile_banking">Mobile Banking (bKash / Nagad / Rocket)</option>
                    <option value="cheque">Cheque</option>
                  </select>
                </div>

              </div>

              {/* Dynamic Warning Alert Box */}
              {numAmount > 0 && (
                <div className="mt-2">
                  {exceedsTotalFunds ? (
                    <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3 text-rose-800 animate-fade-in">
                      <BiErrorCircle className="text-xl text-rose-600 shrink-0 mt-0.5" />
                      <div className="flex flex-col gap-1">
                        <h4 className="text-xs font-bold uppercase tracking-wide">Exceeds Total Investor Balance</h4>
                        <p className="text-xs leading-relaxed">
                          The requested withdrawal of <strong>{currencySymbol || '৳'}{numAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong> exceeds the total available funds of <strong>{selectedInvestor.name}</strong> ({currencySymbol || '৳'}{totalBal.toLocaleString(undefined, { minimumFractionDigits: 2 })}).
                        </p>
                      </div>
                    </div>
                  ) : exceedsStoreCash ? (
                    <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3 text-rose-800 animate-fade-in">
                      <BiErrorCircle className="text-xl text-rose-600 shrink-0 mt-0.5" />
                      <div className="flex flex-col gap-1">
                        <h4 className="text-xs font-bold uppercase tracking-wide">Exceeds Store Cash Balance</h4>
                        <p className="text-xs leading-relaxed">
                          The requested withdrawal of <strong>{currencySymbol || '৳'}{numAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong> exceeds the store's available cash balance of <strong>{currencySymbol || '৳'}{systemAvailableBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>.
                        </p>
                      </div>
                    </div>
                  ) : exceedsProfit ? (
                    <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex items-start gap-3.5 text-amber-900 shadow-sm animate-fade-in">
                      <BiTrendingDown className="text-2xl text-amber-600 shrink-0 mt-0.5" />
                      <div className="flex flex-col gap-1.5">
                        <h4 className="text-xs font-black uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                          ⚠️ Capital Investment Will Be Reduced
                        </h4>
                        <p className="text-xs leading-relaxed text-amber-900">
                          Withdrawal amount of <strong>{currencySymbol || '৳'}{numAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong> exceeds available profit balance (<strong>{currencySymbol || '৳'}{profitBal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>).
                        </p>
                        <div className="bg-amber-100/70 border border-amber-200/80 rounded-lg p-2.5 text-xs text-amber-900 font-mono flex flex-col gap-1">
                          <div>
                            • Profit portion deducted: <strong>{currencySymbol || '৳'}{profitBal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong> (Profit balance → <strong>{currencySymbol || '৳'}0.00</strong>)
                          </div>
                          <div>
                            • Capital investment reduction: <strong className="text-rose-700">-{currencySymbol || '৳'}{capitalReduction.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong> (Capital investment: {currencySymbol || '৳'}{investBal.toLocaleString()} → <strong className="text-amber-900">{currencySymbol || '৳'}{newInvestBal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>)
                          </div>
                        </div>
                        <p className="text-[11px] text-amber-800 font-medium italic mt-0.5">
                          Note: Reducing capital investment will also automatically recalculate the investor's equity share percentage.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3 text-emerald-900 animate-fade-in">
                      <BiCheckCircle className="text-xl text-emerald-600 shrink-0 mt-0.5" />
                      <div className="flex flex-col gap-1">
                        <h4 className="text-xs font-bold uppercase tracking-wide">Profit Payout (100% Covered by Profit)</h4>
                        <p className="text-xs leading-relaxed">
                          This withdrawal of <strong>{currencySymbol || '৳'}{numAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong> is fully covered by accumulated profit. Investor's capital investment remains unchanged at <strong>{currencySymbol || '৳'}{investBal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong> (Remaining profit: {currencySymbol || '৳'}{newProfitBal.toLocaleString(undefined, { minimumFractionDigits: 2 })}).
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Account Details & Note */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase">
                    Account Details / Reference (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Bank Account No, TrxID, Cheque No..."
                    value={accountDetails}
                    onChange={(e) => setAccountDetails(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase">
                    Note / Purpose (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Provide details or reason for this withdrawal..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition"
                  />
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4 mt-2">
                <Link
                  href="/dashboard/withdrawals"
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={submitting || !selectedInvestorId || numAmount <= 0 || exceedsStoreCash || exceedsTotalFunds}
                  className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-2 disabled:opacity-50 shadow-md shadow-amber-600/10"
                >
                  {submitting ? (
                    <>
                      <BiLoaderAlt className="animate-spin text-base" /> Processing...
                    </>
                  ) : (
                    <>
                      <BiCheck className="text-base text-white" /> Complete Withdrawal
                    </>
                  )}
                </button>
              </div>

            </div>
          )}

        </form>

      </div>
    </div>
  )
}

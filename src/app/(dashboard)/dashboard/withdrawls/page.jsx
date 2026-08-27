'use client'
import React, { useContext, useEffect, useState } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Context } from '@/component/helper/Context'
import { 
  BiUndo, 
  BiPlus, 
  BiSearch, 
  BiLoaderAlt, 
  BiEdit, 
  BiTrash, 
  BiUser, 
  BiCalendar, 
  BiReceipt, 
  BiX, 
  BiCheckCircle,
  BiRefresh,
  BiDollarCircle
} from 'react-icons/bi'

export default function DashboardWithdrawalsPage() {
  const { dashSidebar, formatCurrency, currencySymbol } = useContext(Context)
  const [withdrawals, setWithdrawals] = useState([])
  const [investors, setInvestors] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedInvestorFilter, setSelectedInvestorFilter] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingWithdrawal, setEditingWithdrawal] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    investor_id: '',
    investor_name: '',
    amount: '',
    payment_method: 'cash',
    account_details: '',
    status: 'completed',
    note: ''
  })

  const fetchData = async () => {
    setLoading(true)
    try {
      const [wRes, investorRes] = await Promise.all([
        axios.get('/api/withdrawals'),
        axios.get('/api/investor')
      ])
      setWithdrawals(wRes.data)
      setInvestors(investorRes.data)
    } catch (err) {
      toast.error('Failed to load withdrawals data')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleOpenModal = (withdrawal = null) => {
    if (withdrawal) {
      setEditingWithdrawal(withdrawal)
      setFormData({
        investor_id: withdrawal.investor_id || '',
        investor_name: withdrawal.investor_name || withdrawal.investor_display_name || '',
        amount: withdrawal.amount || '',
        payment_method: withdrawal.payment_method || 'cash',
        account_details: withdrawal.account_details || '',
        status: withdrawal.status || 'completed',
        note: withdrawal.note || ''
      })
    } else {
      setEditingWithdrawal(null)
      setFormData({
        investor_id: '',
        investor_name: '',
        amount: '',
        payment_method: 'cash',
        account_details: '',
        status: 'completed',
        note: ''
      })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingWithdrawal(null)
  }

  const handleInvestorSelect = (e) => {
    const invId = e.target.value
    if (!invId) {
      setFormData({ ...formData, investor_id: '', investor_name: '' })
      return
    }

    const selectedInv = investors.find(i => String(i.investor_id) === String(invId))
    setFormData({
      ...formData,
      investor_id: invId,
      investor_name: selectedInv ? selectedInv.name : ''
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      return toast.error('Please enter a valid withdrawal amount')
    }

    setSubmitting(true)
    try {
      if (editingWithdrawal) {
        await axios.put(`/api/withdrawals/${editingWithdrawal.withdrawal_id}`, formData)
        toast.success('Withdrawal record updated successfully')
      } else {
        await axios.post('/api/withdrawals', formData)
        toast.success('Withdrawal recorded successfully')
      }
      handleCloseModal()
      fetchData()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save withdrawal')
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this withdrawal record?')) return

    try {
      await axios.delete(`/api/withdrawals/${id}`)
      toast.success('Withdrawal record deleted successfully')
      fetchData()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete withdrawal')
      console.error(err)
    }
  }

  const filteredWithdrawals = withdrawals.filter((w) => {
    const term = search.toLowerCase()
    const matchesSearch = (
      (w.investor_display_name && w.investor_display_name.toLowerCase().includes(term)) ||
      (w.payment_method && w.payment_method.toLowerCase().includes(term)) ||
      (w.status && w.status.toLowerCase().includes(term)) ||
      (w.account_details && w.account_details.toLowerCase().includes(term)) ||
      (w.note && w.note.toLowerCase().includes(term)) ||
      String(w.amount).includes(term)
    )
    const matchesInvestor = !selectedInvestorFilter || String(w.investor_id) === String(selectedInvestorFilter)
    return matchesSearch && matchesInvestor
  })

  const totalAmountWithdrawn = filteredWithdrawals.reduce((sum, w) => sum + parseFloat(w.amount || 0), 0)

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <div className={`w-full min-h-screen bg-slate-50 pt-20 pb-12 px-4 md:px-8 transition-all duration-300 ${dashSidebar ? 'lg:pl-68' : 'lg:pl-8'}`}>
      <div className="max-w-6xl mx-auto flex flex-col gap-6">

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2.5">
              <BiUndo className="text-amber-600 text-3xl" /> Capital Withdrawals
            </h1>
            <p className="text-slate-500 text-xs mt-1 font-medium">
              Track money withdrawals, profit distributions, and capital returns to investors or staff.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => fetchData()}
              className="p-2.5 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-sm hover:bg-slate-100 transition cursor-pointer"
              title="Refresh"
            >
              <BiRefresh className={`text-lg ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 text-white text-xs font-bold rounded-xl shadow-md hover:bg-amber-700 transition cursor-pointer"
            >
              <BiPlus className="text-lg" /> Record Withdrawal
            </button>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <div className="relative w-full sm:w-72">
              <BiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base" />
              <input
                type="text"
                placeholder="Search by investor, details, status..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition"
              />
            </div>

            <select
              value={selectedInvestorFilter}
              onChange={(e) => setSelectedInvestorFilter(e.target.value)}
              className="w-full sm:w-56 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            >
              <option value="">All Investors / Direct</option>
              {investors.map(inv => (
                <option key={inv.investor_id} value={inv.investor_id}>
                  {inv.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3 bg-amber-50/70 border border-amber-100 px-4 py-2 rounded-xl text-amber-800 self-start md:self-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600">Total Filtered:</span>
            <span className="text-base font-black">{formatCurrency(totalAmountWithdrawn)}</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <BiLoaderAlt className="text-3xl text-amber-600 animate-spin" />
              <p className="text-xs font-medium text-slate-500">Loading withdrawal records...</p>
            </div>
          ) : filteredWithdrawals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-2 text-slate-400">
              <BiUndo className="text-4xl" />
              <p className="text-sm font-semibold text-slate-600">No withdrawal records found</p>
              <p className="text-xs">Record a new withdrawal to start tracking.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4">Investor / Recipient</th>
                    <th className="py-3.5 px-4">Payment Method</th>
                    <th className="py-3.5 px-4">Account Details</th>
                    <th className="py-3.5 px-4 text-right">Amount</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredWithdrawals.map((w) => (
                    <tr key={w.withdrawal_id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 font-medium">
                        <span className="flex items-center gap-1.5">
                          <BiCalendar className="text-slate-400" /> {formatDate(w.created_at)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-800">
                        <div className="flex items-center gap-1.5">
                          <BiUser className="text-slate-400 shrink-0" />
                          <span>{w.investor_display_name || w.investor_name || 'General Withdrawal'}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-[11px] font-medium capitalize">
                          {w.payment_method ? w.payment_method.replace('_', ' ') : 'Cash'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate" title={w.account_details}>
                        {w.account_details || '-'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-black text-amber-600 text-sm whitespace-nowrap">
                        {formatCurrency(w.amount)}
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 font-bold text-[11px] rounded-full uppercase ${
                          w.status === 'completed' || w.status === 'approved'
                            ? 'bg-emerald-50 text-emerald-700'
                            : w.status === 'pending'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}>
                          {w.status || 'completed'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenModal(w)}
                            className="p-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-sm transition cursor-pointer"
                            title="Edit Withdrawal"
                          >
                            <BiEdit />
                          </button>
                          <button
                            onClick={() => handleDelete(w.withdrawal_id)}
                            className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg text-sm transition cursor-pointer"
                            title="Delete Withdrawal"
                          >
                            <BiTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-fade-in flex flex-col gap-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <BiUndo className="text-amber-600 text-xl" />
                  {editingWithdrawal ? 'Edit Withdrawal Record' : 'Record Capital Withdrawal'}
                </h3>
                <button
                  onClick={handleCloseModal}
                  className="p-1 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 text-lg transition cursor-pointer"
                >
                  <BiX />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Select Investor (Optional)</label>
                  <select
                    value={formData.investor_id}
                    onChange={handleInvestorSelect}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  >
                    <option value="">-- General / Non-Investor Withdrawal --</option>
                    {investors.map(inv => (
                      <option key={inv.investor_id} value={inv.investor_id}>
                        {inv.name} {inv.phone ? `(${inv.phone})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Recipient Name</label>
                  <input
                    type="text"
                    placeholder="e.g. John Doe (or leave blank if investor selected)"
                    value={formData.investor_name}
                    onChange={(e) => setFormData({ ...formData, investor_name: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Withdrawal Amount (৳) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      placeholder="0.00"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Payment Method</label>
                    <select
                      value={formData.payment_method}
                      onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    >
                      <option value="cash">Cash</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="cheque">Cheque</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Bank / Account Details</label>
                    <input
                      type="text"
                      placeholder="e.g. Bank Asia Acc #4920"
                      value={formData.account_details}
                      onChange={(e) => setFormData({ ...formData, account_details: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Withdrawal Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    >
                      <option value="completed">Completed</option>
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Notes / Internal Description</label>
                  <textarea
                    rows={2}
                    placeholder="Reason for withdrawal or profit payout notes..."
                    value={formData.note}
                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 mt-2">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer flex items-center gap-1.5"
                  >
                    {submitting ? <BiLoaderAlt className="animate-spin text-sm" /> : <BiCheckCircle className="text-sm" />}
                    {editingWithdrawal ? 'Update Withdrawal' : 'Save Withdrawal'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

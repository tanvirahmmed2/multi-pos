'use client'
import React, { useContext, useEffect, useState } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Context } from '@/component/helper/Context'
import { 
  BiDollarCircle, 
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
  BiCreditCard
} from 'react-icons/bi'

export default function DashboardInvestmentsPage() {
  const { dashSidebar, formatCurrency, currencySymbol } = useContext(Context)
  const [investments, setInvestments] = useState([])
  const [investors, setInvestors] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedInvestorFilter, setSelectedInvestorFilter] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingInvestment, setEditingInvestment] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    investor_id: '',
    investor_name: '',
    amount: '',
    payment_method: 'bank_transfer',
    reference_no: '',
    investment_date: new Date().toISOString().split('T')[0],
    note: ''
  })

  const fetchData = async () => {
    setLoading(true)
    try {
      const [invRes, investorRes] = await Promise.all([
        axios.get('/api/investments'),
        axios.get('/api/investor')
      ])
      setInvestments(invRes.data)
      setInvestors(investorRes.data)
    } catch (err) {
      toast.error('Failed to load investments data')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleOpenModal = (investment = null) => {
    if (investment) {
      setEditingInvestment(investment)
      setFormData({
        investor_id: investment.investor_id || '',
        investor_name: investment.investor_name || investment.investor_display_name || '',
        amount: investment.amount || '',
        payment_method: investment.payment_method || 'bank_transfer',
        reference_no: investment.reference_no || '',
        investment_date: investment.investment_date ? new Date(investment.investment_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        note: investment.note || ''
      })
    } else {
      setEditingInvestment(null)
      setFormData({
        investor_id: '',
        investor_name: '',
        amount: '',
        payment_method: 'bank_transfer',
        reference_no: '',
        investment_date: new Date().toISOString().split('T')[0],
        note: ''
      })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingInvestment(null)
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
      return toast.error('Please enter a valid investment amount')
    }
    if (!formData.investor_id && !formData.investor_name.trim()) {
      return toast.error('Please select or specify an investor')
    }

    setSubmitting(true)
    try {
      if (editingInvestment) {
        await axios.put(`/api/investments/${editingInvestment.investment_id}`, formData)
        toast.success('Investment updated successfully')
      } else {
        await axios.post('/api/investments', formData)
        toast.success('Investment recorded successfully')
      }
      handleCloseModal()
      fetchData()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save investment')
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this investment record?')) return

    try {
      await axios.delete(`/api/investments/${id}`)
      toast.success('Investment record deleted successfully')
      fetchData()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete investment')
      console.error(err)
    }
  }

  const filteredInvestments = investments.filter((inv) => {
    const term = search.toLowerCase()
    const matchesSearch = (
      (inv.investor_display_name && inv.investor_display_name.toLowerCase().includes(term)) ||
      (inv.reference_no && inv.reference_no.toLowerCase().includes(term)) ||
      (inv.payment_method && inv.payment_method.toLowerCase().includes(term)) ||
      (inv.note && inv.note.toLowerCase().includes(term)) ||
      String(inv.amount).includes(term)
    )
    const matchesInvestor = !selectedInvestorFilter || String(inv.investor_id) === String(selectedInvestorFilter)
    return matchesSearch && matchesInvestor
  })

  const totalAmountInvested = filteredInvestments.reduce((sum, inv) => sum + parseFloat(inv.amount || 0), 0)

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
              <BiDollarCircle className="text-emerald-600 text-3xl" /> Investment Records
            </h1>
            <p className="text-slate-500 text-xs mt-1 font-medium">
              Record capital injections, bank deposits, and investor equity additions.
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
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-md hover:bg-emerald-700 transition cursor-pointer"
            >
              <BiPlus className="text-lg" /> Record Investment
            </button>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <div className="relative w-full sm:w-72">
              <BiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base" />
              <input
                type="text"
                placeholder="Search by investor, reference, amount..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
              />
            </div>

            <select
              value={selectedInvestorFilter}
              onChange={(e) => setSelectedInvestorFilter(e.target.value)}
              className="w-full sm:w-56 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              <option value="">All Investors</option>
              {investors.map(inv => (
                <option key={inv.investor_id} value={inv.investor_id}>
                  {inv.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3 bg-emerald-50/70 border border-emerald-100 px-4 py-2 rounded-xl text-emerald-800 self-start md:self-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Total Filtered:</span>
            <span className="text-base font-black">{formatCurrency(totalAmountInvested)}</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <BiLoaderAlt className="text-3xl text-emerald-600 animate-spin" />
              <p className="text-xs font-medium text-slate-500">Loading investment records...</p>
            </div>
          ) : filteredInvestments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-2 text-slate-400">
              <BiDollarCircle className="text-4xl" />
              <p className="text-sm font-semibold text-slate-600">No investment records found</p>
              <p className="text-xs">Record a new investment to start tracking.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4">Investor</th>
                    <th className="py-3.5 px-4">Payment Method</th>
                    <th className="py-3.5 px-4">Ref / Txn No.</th>
                    <th className="py-3.5 px-4 text-right">Amount</th>
                    <th className="py-3.5 px-4">Staff / Branch</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredInvestments.map((inv) => (
                    <tr key={inv.investment_id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 font-medium">
                        <span className="flex items-center gap-1.5">
                          <BiCalendar className="text-slate-400" /> {formatDate(inv.investment_date || inv.created_at)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-800">
                        <div className="flex items-center gap-1.5">
                          <BiUser className="text-slate-400 shrink-0" />
                          <span>{inv.investor_display_name || inv.investor_name}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-[11px] font-medium capitalize">
                          {inv.payment_method ? inv.payment_method.replace('_', ' ') : 'Cash'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">
                        {inv.reference_no ? (
                          <span className="flex items-center gap-1">
                            <BiReceipt className="text-slate-400" /> {inv.reference_no}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right font-black text-emerald-600 text-sm whitespace-nowrap">
                        {formatCurrency(inv.amount)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                        <p className="font-semibold text-slate-700">{inv.staff_name || 'Admin'}</p>
                        {inv.branch_name && <p className="text-slate-400">{inv.branch_name}</p>}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenModal(inv)}
                            className="p-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-sm transition cursor-pointer"
                            title="Edit Investment"
                          >
                            <BiEdit />
                          </button>
                          <button
                            onClick={() => handleDelete(inv.investment_id)}
                            className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg text-sm transition cursor-pointer"
                            title="Delete Investment"
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
                  <BiDollarCircle className="text-emerald-600 text-xl" />
                  {editingInvestment ? 'Edit Investment Record' : 'Record New Investment'}
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
                  <label className="block text-xs font-bold text-slate-700 mb-1">Select Registered Investor</label>
                  <select
                    value={formData.investor_id}
                    onChange={handleInvestorSelect}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    <option value="">-- Custom / Direct Investor --</option>
                    {investors.map(inv => (
                      <option key={inv.investor_id} value={inv.investor_id}>
                        {inv.name} {inv.phone ? `(${inv.phone})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Investor Display Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    value={formData.investor_name}
                    onChange={(e) => setFormData({ ...formData, investor_name: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Investment Amount ({currencySymbol || '৳'}) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      placeholder="0.00"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Payment Method</label>
                    <select
                      value={formData.payment_method}
                      onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    >
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="cash">Cash</option>
                      <option value="cheque">Cheque</option>
                      <option value="online_gateway">Online Gateway</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Reference / Cheque / Txn ID</label>
                    <input
                      type="text"
                      placeholder="e.g. TXN-99882"
                      value={formData.reference_no}
                      onChange={(e) => setFormData({ ...formData, reference_no: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Investment Date</label>
                    <input
                      type="date"
                      value={formData.investment_date}
                      onChange={(e) => setFormData({ ...formData, investment_date: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Notes / Description</label>
                  <textarea
                    rows={2}
                    placeholder="Details about agreement or bank account deposited to..."
                    value={formData.note}
                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
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
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer flex items-center gap-1.5"
                  >
                    {submitting ? <BiLoaderAlt className="animate-spin text-sm" /> : <BiCheckCircle className="text-sm" />}
                    {editingInvestment ? 'Update Investment' : 'Save Investment'}
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

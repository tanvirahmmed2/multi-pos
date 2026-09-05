'use client'
import React, { useContext, useEffect, useState } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Context } from '@/component/helper/Context'
import { 
  BiUser, 
  BiPlus, 
  BiSearch, 
  BiLoaderAlt, 
  BiEdit, 
  BiTrash, 
  BiDollarCircle, 
  BiUndo, 
  BiPhone, 
  BiEnvelope, 
  BiMapPin, 
  BiIdCard, 
  BiX, 
  BiCheckCircle,
  BiRefresh,
  BiPieChartAlt2
} from 'react-icons/bi'



export default function DashboardInvestorPage() {
  const { dashSidebar, formatCurrency } = useContext(Context)
  const [investors, setInvestors] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingInvestor, setEditingInvestor] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  // Website settings flag
  const [isShareInvestment, setIsShareInvestment] = useState(false)

  // Investment Modal State
  const [isInvestmentModalOpen, setIsInvestmentModalOpen] = useState(false)
  const [selectedInvestorForInvestment, setSelectedInvestorForInvestment] = useState(null)
  const [investmentSubmitting, setInvestmentSubmitting] = useState(false)
  const [investmentFormData, setInvestmentFormData] = useState({
    investor_id: '',
    amount: '',
    payment_method: 'bank_transfer',
    reference_no: '',
    investment_date: new Date().toISOString().split('T')[0],
    note: ''
  })

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    nid_passport: '',
    is_active: true,
    note: ''
  })

  const fetchInvestorsAndSettings = async () => {
    setLoading(true)
    try {
      const invRes = await axios.get('/api/investor')
      setInvestors(Array.isArray(invRes.data) ? invRes.data : [])
    } catch (err) {
      toast.error('Failed to fetch investor data')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInvestorsAndSettings()
  }, [])

  const handleOpenModal = (investor = null) => {
    if (investor) {
      setEditingInvestor(investor)
      setFormData({
        name: investor.name || '',
        phone: investor.phone || '',
        email: investor.email || '',
        address: investor.address || '',
        nid_passport: investor.nid_passport || '',
        is_active: investor.is_active !== false,
        note: investor.note || ''
      })
    } else {
      setEditingInvestor(null)
      setFormData({
        name: '',
        phone: '',
        email: '',
        address: '',
        nid_passport: '',
        is_active: true,
        note: ''
      })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingInvestor(null)
  }

  const handleOpenInvestmentModal = (investor = null) => {
    if (investor) {
      setSelectedInvestorForInvestment(investor)
      setInvestmentFormData({
        investor_id: String(investor.investor_id),
        amount: '',
        payment_method: 'bank_transfer',
        reference_no: '',
        investment_date: new Date().toISOString().split('T')[0],
        note: ''
      })
    } else {
      setSelectedInvestorForInvestment(null)
      setInvestmentFormData({
        investor_id: '',
        amount: '',
        payment_method: 'bank_transfer',
        reference_no: '',
        investment_date: new Date().toISOString().split('T')[0],
        note: ''
      })
    }
    setIsInvestmentModalOpen(true)
  }

  const handleCloseInvestmentModal = () => {
    setIsInvestmentModalOpen(false)
    setSelectedInvestorForInvestment(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      return toast.error('Investor name is required')
    }

    setSubmitting(true)
    try {
      if (editingInvestor) {
        await axios.put(`/api/investor/${editingInvestor.investor_id}`, formData)
        toast.success('Investor updated successfully')
      } else {
        await axios.post('/api/investor', formData)
        toast.success('Investor created successfully')
      }
      handleCloseModal()
      fetchInvestorsAndSettings()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save investor')
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleInvestmentSubmit = async (e) => {
    e.preventDefault()
    if (!investmentFormData.investor_id) {
      return toast.error('Please select an investor')
    }
    const amt = parseFloat(investmentFormData.amount)
    if (isNaN(amt) || amt <= 0) {
      return toast.error('Please enter a valid investment amount')
    }

    setInvestmentSubmitting(true)
    try {
      await axios.post('/api/investments', investmentFormData)
      toast.success('Investment recorded & shares recalculated successfully!')
      handleCloseInvestmentModal()
      fetchInvestorsAndSettings()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to record investment')
      console.error(err)
    } finally {
      setInvestmentSubmitting(false)
    }
  }

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete investor "${name}"?`)) return

    try {
      await axios.delete(`/api/investor/${id}`)
      toast.success('Investor deleted successfully')
      fetchInvestorsAndSettings()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete investor')
      console.error(err)
    }
  }

  const filteredInvestors = investors.filter((inv) => {
    const term = search.toLowerCase()
    return (
      (inv.name && inv.name.toLowerCase().includes(term)) ||
      (inv.phone && inv.phone.toLowerCase().includes(term)) ||
      (inv.email && inv.email.toLowerCase().includes(term)) ||
      (inv.nid_passport && inv.nid_passport.toLowerCase().includes(term))
    )
  })

  const totalInvestors = investors.length
  const grandTotalInvestment = investors.reduce((sum, inv) => sum + parseFloat(inv.total_investment || 0), 0)
  const grandTotalWithdrawal = investors.reduce((sum, inv) => sum + parseFloat(inv.total_withdrawal || 0), 0)
  const grandNetCapital = grandTotalInvestment - grandTotalWithdrawal

  return (
    <div className={`w-full min-h-screen bg-slate-50 pt-20 pb-12 px-4 md:px-8 transition-all duration-300 ${dashSidebar ? 'lg:pl-68' : 'lg:pl-8'}`}>
      <div className="max-w-6xl mx-auto flex flex-col gap-6">

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-4 gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-800 flex items-center gap-2.5">
              <BiUser className="text-primary text-3xl" /> Investor Management
            </h1>
            <p className="text-slate-500 text-xs mt-1 font-medium">
              Manage capital investors, track funding, and view active equity shares.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => fetchInvestorsAndSettings()}
              className="p-2.5 bg-white border border-slate-200 text-slate-700 text-xs font-bold shadow-sm hover:bg-slate-100 transition cursor-pointer"
              title="Refresh"
            >
              <BiRefresh className={`text-lg ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={() => handleOpenInvestmentModal()}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 text-white text-xs font-bold shadow-sm hover:bg-emerald-700 transition cursor-pointer"
            >
              <BiDollarCircle className="text-lg" /> Record Investment
            </button>

            <button
              onClick={() => handleOpenModal()}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-primary text-white text-xs font-bold shadow-sm hover:bg-primary-dark transition cursor-pointer"
            >
              <BiPlus className="text-lg" /> Add Investor
            </button>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Investors</p>
              <h3 className="text-xl font-bold text-slate-800 mt-0.5">{totalInvestors}</h3>
            </div>
            <div className="w-10 h-10 bg-primary/10 text-primary flex items-center justify-center rounded-xl text-xl">
              <BiUser />
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Capital Raised</p>
              <h3 className="text-xl font-bold text-emerald-600 mt-0.5">{formatCurrency(grandTotalInvestment)}</h3>
            </div>
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 flex items-center justify-center rounded-xl text-xl">
              <BiDollarCircle />
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Withdrawals</p>
              <h3 className="text-xl font-bold text-amber-600 mt-0.5">{formatCurrency(grandTotalWithdrawal)}</h3>
            </div>
            <div className="w-10 h-10 bg-amber-50 text-amber-600 flex items-center justify-center rounded-xl text-xl">
              <BiUndo />
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Net Active Capital</p>
              <h3 className="text-xl font-bold text-slate-800 mt-0.5">{formatCurrency(grandNetCapital)}</h3>
            </div>
            <div className="w-10 h-10 bg-slate-100 text-slate-700 flex items-center justify-center rounded-xl text-xl">
              <BiPieChartAlt2 />
            </div>
          </div>
        </div>

        {/* Filter and Table Card */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-4">
            <div className="relative max-w-xs w-full">
              <BiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base" />
              <input
                type="text"
                placeholder="Search investors..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:border-primary font-medium"
              />
            </div>
            <span className="text-xs text-slate-500 font-medium hidden sm:inline">
              Showing {filteredInvestors.length} of {totalInvestors} investors
            </span>
          </div>

          {loading ? (
            <div className="p-12 flex flex-col items-center justify-center gap-3 text-slate-500">
              <BiLoaderAlt className="animate-spin text-2xl text-primary" />
              <span className="text-xs font-semibold">Loading investor directory...</span>
            </div>
          ) : filteredInvestors.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <p className="text-sm font-semibold">No investors found.</p>
              <p className="text-xs text-slate-400 mt-1">Try matching search terms or add a new investor.</p>
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-100/80 text-slate-650 font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-3 md:px-4 py-3">Investor Name</th>
                    <th className="px-3 md:px-4 py-3">Auto Share %</th>
                    <th className="hidden sm:table-cell px-3 md:px-4 py-3">Contact Info</th>
                    <th className="hidden md:table-cell px-3 md:px-4 py-3">NID / Passport</th>
                    <th className="px-3 md:px-4 py-3 text-right">Total Invested</th>
                    <th className="hidden lg:table-cell px-3 md:px-4 py-3 text-right">Net Balance</th>
                    <th className="hidden sm:table-cell px-3 md:px-4 py-3 text-center">Status</th>
                    <th className="px-3 md:px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
                  {filteredInvestors.map((inv) => {
                    const sharePct = parseFloat(inv.share_percentage || 0)

                    return (
                      <tr key={inv.investor_id} className="hover:bg-slate-50/80 transition">
                        <td className="px-3 md:px-4 py-3 font-bold text-slate-900">
                          <div>
                            <p className="text-xs font-bold">{inv.name}</p>
                            {inv.address && (
                              <p className="text-[10px] text-slate-400 font-normal flex items-center gap-1 mt-0.5">
                                <BiMapPin /> {inv.address}
                              </p>
                            )}
                          </div>
                        </td>

                        <td className="px-3 md:px-4 py-3 font-bold">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 text-[11px] font-mono">
                            <BiPieChartAlt2 /> {sharePct.toFixed(2)}%
                          </span>
                        </td>

                        <td className="hidden sm:table-cell px-3 md:px-4 py-3 font-medium text-slate-600">
                          {inv.phone && (
                            <p className="flex items-center gap-1">
                              <BiPhone className="text-slate-400 shrink-0" /> {inv.phone}
                            </p>
                          )}
                          {inv.email && (
                            <p className="flex items-center gap-1 text-[11px] text-slate-400">
                              <BiEnvelope className="shrink-0" /> {inv.email}
                            </p>
                          )}
                        </td>

                        <td className="hidden md:table-cell px-3 md:px-4 py-3 font-mono text-[11px] text-slate-600">
                          {inv.nid_passport || '-'}
                        </td>

                        <td className="px-3 md:px-4 py-3 text-right font-bold text-emerald-600 whitespace-nowrap">
                          {formatCurrency(inv.total_investment)}
                        </td>

                        <td className="hidden lg:table-cell px-3 md:px-4 py-3 text-right font-bold text-slate-800 whitespace-nowrap">
                          {formatCurrency(inv.net_balance)}
                        </td>

                        <td className="hidden sm:table-cell px-3 md:px-4 py-3 text-center whitespace-nowrap">
                          <span className={`inline-block px-2 py-0.5 text-[9px] font-bold uppercase border ${
                            inv.is_active
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}>
                            {inv.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>

                        <td className="px-3 md:px-4 py-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenInvestmentModal(inv)}
                              className="p-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition cursor-pointer text-xs font-bold flex items-center gap-1"
                              title="Add Investment for Investor"
                            >
                              <BiDollarCircle className="text-base" />
                              <span className="hidden sm:inline">+ Invest</span>
                            </button>

                            <button
                              onClick={() => handleOpenModal(inv)}
                              className="p-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 transition cursor-pointer"
                              title="Edit Investor"
                            >
                              <BiEdit className="text-base" />
                            </button>
                            <button
                              onClick={() => handleDelete(inv.investor_id, inv.name)}
                              className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 transition cursor-pointer"
                              title="Delete Investor"
                            >
                              <BiTrash className="text-base" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add / Edit Investor Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 max-w-lg w-full p-6 shadow-2xl flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <BiUser className="text-primary text-xl" />
                  {editingInvestor ? 'Edit Investor' : 'Add New Investor'}
                </h3>
                <button
                  onClick={handleCloseModal}
                  className="p-1 text-slate-400 hover:text-slate-600 transition"
                >
                  <BiX className="text-xl" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:bg-white focus:border-primary"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                    <input
                      type="text"
                      placeholder="e.g. +1 555-0192"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:bg-white focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      placeholder="e.g. investor@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:bg-white focus:border-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">NID / Passport No.</label>
                    <input
                      type="text"
                      placeholder="e.g. NID-84930219"
                      value={formData.nid_passport}
                      onChange={(e) => setFormData({ ...formData, nid_passport: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:bg-white focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Account Status</label>
                    <select
                      value={formData.is_active ? 'active' : 'inactive'}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'active' })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:bg-white focus:border-primary cursor-pointer"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Address</label>
                  <input
                    type="text"
                    placeholder="e.g. 123 Financial District, Suite 400"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:bg-white focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Notes / Internal Remarks</label>
                  <textarea
                    rows={2}
                    placeholder="Optional notes regarding investment agreement..."
                    value={formData.note}
                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:bg-white focus:border-primary"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 mt-1">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-bold border border-slate-200 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 text-white text-xs font-bold transition shadow-sm flex items-center gap-1.5 cursor-pointer bg-primary hover:bg-primary-dark disabled:opacity-50"
                  >
                    {submitting ? <BiLoaderAlt className="animate-spin text-sm" /> : <BiCheckCircle className="text-sm" />}
                    {editingInvestor ? 'Update Investor' : 'Save Investor'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Investment Modal */}
        {isInvestmentModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 max-w-md w-full p-6 shadow-2xl flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <BiDollarCircle className="text-emerald-600 text-xl" />
                  Record New Investment
                </h3>
                <button
                  onClick={handleCloseInvestmentModal}
                  className="p-1 text-slate-400 hover:text-slate-600 transition"
                >
                  <BiX className="text-xl" />
                </button>
              </div>

              <form onSubmit={handleInvestmentSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Investor *</label>
                  <select
                    required
                    value={investmentFormData.investor_id}
                    onChange={(e) => setInvestmentFormData({ ...investmentFormData, investor_id: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:bg-white focus:border-primary cursor-pointer"
                  >
                    <option value="">Select Investor</option>
                    {investors.map(inv => (
                      <option key={inv.investor_id} value={inv.investor_id}>
                        {inv.name} {inv.phone ? `(${inv.phone})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Investment Amount *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    placeholder="0.00"
                    value={investmentFormData.amount}
                    onChange={(e) => setInvestmentFormData({ ...investmentFormData, amount: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-primary"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Payment Method</label>
                    <select
                      value={investmentFormData.payment_method}
                      onChange={(e) => setInvestmentFormData({ ...investmentFormData, payment_method: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:bg-white focus:border-primary cursor-pointer"
                    >
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="cash">Cash</option>
                      <option value="cheque">Cheque</option>
                      <option value="mfs">MFS (Bkash/Nagad)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Investment Date</label>
                    <input
                      type="date"
                      value={investmentFormData.investment_date}
                      onChange={(e) => setInvestmentFormData({ ...investmentFormData, investment_date: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:bg-white focus:border-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Reference / Trx No.</label>
                  <input
                    type="text"
                    placeholder="e.g. TRX-948201"
                    value={investmentFormData.reference_no}
                    onChange={(e) => setInvestmentFormData({ ...investmentFormData, reference_no: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:bg-white focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Notes</label>
                  <textarea
                    rows={2}
                    placeholder="Investment details..."
                    value={investmentFormData.note}
                    onChange={(e) => setInvestmentFormData({ ...investmentFormData, note: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:bg-white focus:border-primary"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 mt-1">
                  <button
                    type="button"
                    onClick={handleCloseInvestmentModal}
                    className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-bold border border-slate-200 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={investmentSubmitting}
                    className="px-5 py-2 text-white text-xs font-bold transition shadow-sm flex items-center gap-1.5 cursor-pointer bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {investmentSubmitting ? <BiLoaderAlt className="animate-spin text-sm" /> : <BiCheckCircle className="text-sm" />}
                    Save Investment
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

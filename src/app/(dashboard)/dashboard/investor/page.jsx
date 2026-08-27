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
  BiRefresh
} from 'react-icons/bi'

export default function DashboardInvestorPage() {
  const { dashSidebar, formatCurrency, currencySymbol } = useContext(Context)
  const [investors, setInvestors] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingInvestor, setEditingInvestor] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    nid_passport: '',
    is_active: true,
    note: ''
  })

  const fetchInvestors = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/api/investor')
      setInvestors(res.data)
    } catch (err) {
      toast.error('Failed to fetch investors')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInvestors()
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
      fetchInvestors()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save investor')
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete investor "${name}"?`)) return

    try {
      await axios.delete(`/api/investor/${id}`)
      toast.success('Investor deleted successfully')
      fetchInvestors()
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

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2.5">
              <BiUser className="text-primary text-3xl" /> Investor Management
            </h1>
            <p className="text-slate-500 text-xs mt-1 font-medium">
              Manage capital investors, track funding, and view active portfolios.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => fetchInvestors()}
              className="p-2.5 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-sm hover:bg-slate-100 transition cursor-pointer"
              title="Refresh"
            >
              <BiRefresh className={`text-lg ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white text-xs font-bold rounded-xl shadow-md hover:bg-primary/95 transition cursor-pointer"
            >
              <BiPlus className="text-lg" /> Add New Investor
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-2xl font-bold border border-blue-100">
              <BiUser />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Investors</p>
              <h3 className="text-2xl font-black text-slate-800 mt-0.5">{totalInvestors}</h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-2xl font-bold border border-emerald-100">
              <BiDollarCircle />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Invested</p>
              <h3 className="text-xl font-black text-emerald-600 mt-0.5">{formatCurrency(grandTotalInvestment)}</h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-2xl font-bold border border-amber-100">
              <BiUndo />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Withdrawn</p>
              <h3 className="text-xl font-black text-amber-600 mt-0.5">{formatCurrency(grandTotalWithdrawal)}</h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-2xl font-bold border border-indigo-100">
              <BiDollarCircle />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Net Capital</p>
              <h3 className="text-xl font-black text-indigo-600 mt-0.5">{formatCurrency(grandNetCapital)}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between gap-4">
          <div className="relative w-full md:w-96">
            <BiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base" />
            <input
              type="text"
              placeholder="Search by name, phone, email, NID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
            />
          </div>
          <div className="text-xs font-bold text-slate-500 hidden md:block">
            Showing <span className="text-slate-800">{filteredInvestors.length}</span> investors
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <BiLoaderAlt className="text-3xl text-primary animate-spin" />
              <p className="text-xs font-medium text-slate-500">Loading investors...</p>
            </div>
          ) : filteredInvestors.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-2 text-slate-400">
              <BiUser className="text-4xl" />
              <p className="text-sm font-semibold text-slate-600">No investors found</p>
              <p className="text-xs">Add a new investor or search using different keywords.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Investor Name</th>
                    <th className="py-3.5 px-4">Contact Info</th>
                    <th className="py-3.5 px-4">NID / Passport</th>
                    <th className="py-3.5 px-4 text-right">Total Invested</th>
                    <th className="py-3.5 px-4 text-right">Total Withdrawn</th>
                    <th className="py-3.5 px-4 text-right">Net Balance</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredInvestors.map((inv) => (
                    <tr key={inv.investor_id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 font-bold text-slate-800">
                        <div>
                          <p className="text-sm">{inv.name}</p>
                          {inv.address && (
                            <p className="text-[11px] text-slate-400 font-normal flex items-center gap-1 mt-0.5">
                              <BiMapPin /> {inv.address}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-600">
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
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">
                        {inv.nid_passport ? (
                          <span className="flex items-center gap-1">
                            <BiIdCard className="text-slate-400 shrink-0" /> {inv.nid_passport}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-emerald-600 whitespace-nowrap">
                        {formatCurrency(inv.total_investment)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-amber-600 whitespace-nowrap">
                        {formatCurrency(inv.total_withdrawal)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-black text-slate-800 whitespace-nowrap">
                        {formatCurrency(inv.net_balance)}
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {inv.is_active ? (
                          <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 font-bold text-[11px] rounded-full">
                            Active
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 bg-slate-100 text-slate-500 font-bold text-[11px] rounded-full">
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenModal(inv)}
                            className="p-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-sm transition cursor-pointer"
                            title="Edit Investor"
                          >
                            <BiEdit />
                          </button>
                          <button
                            onClick={() => handleDelete(inv.investor_id, inv.name)}
                            className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg text-sm transition cursor-pointer"
                            title="Delete Investor"
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
                  <BiUser className="text-primary text-xl" />
                  {editingInvestor ? 'Edit Investor' : 'Add New Investor'}
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
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
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
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      placeholder="e.g. investor@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
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
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Account Status</label>
                    <select
                      value={formData.is_active ? 'active' : 'inactive'}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'active' })}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
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
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Notes / Internal Remarks</label>
                  <textarea
                    rows={2}
                    placeholder="Optional notes regarding investment agreement..."
                    value={formData.note}
                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
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
                    className="px-5 py-2 bg-primary hover:bg-primary/95 text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer flex items-center gap-1.5"
                  >
                    {submitting ? <BiLoaderAlt className="animate-spin text-sm" /> : <BiCheckCircle className="text-sm" />}
                    {editingInvestor ? 'Update Investor' : 'Save Investor'}
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

'use client'
import React, { useContext, useEffect, useState } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Context } from '@/component/helper/Context'
import { 
  BiPieChartAlt2, 
  BiPlus, 
  BiSearch, 
  BiLoaderAlt, 
  BiEdit, 
  BiTrash, 
  BiUser, 
  BiX, 
  BiRefresh,
  BiCheckCircle,
  BiDotsVerticalRounded,
  BiInfoCircle
} from 'react-icons/bi'
import ShareInvestmentDisabled from '@/component/helper/ShareInvestmentDisabled'

export default function DashboardSharesPage() {
  const { dashSidebar } = useContext(Context)
  const [shares, setShares] = useState([])
  const [investors, setInvestors] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const [isShareInvestment, setIsShareInvestment] = useState(false)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingShare, setEditingShare] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const [openMenuId, setOpenMenuId] = useState(null)

  const [formData, setFormData] = useState({
    investor_id: '',
    share_percentage: '',
    status: 'active',
    note: ''
  })

  const fetchSharesAndSettings = async () => {
    setLoading(true)
    try {
      const settingsRes = await axios.get('/api/settings')
      const isEnabled = settingsRes.data && settingsRes.data.is_share_investment === true
      setIsShareInvestment(isEnabled)
      if (isEnabled) {
        const [sharesRes, investorsRes] = await Promise.all([
          axios.get('/api/shares'),
          axios.get('/api/investor')
        ])
        setShares(sharesRes.data)
        setInvestors(investorsRes.data)
      }
    } catch (err) {
      if (err.response?.status === 403) {
        setIsShareInvestment(false)
      } else {
        toast.error('Failed to fetch share data')
        console.error(err)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSharesAndSettings()
  }, [])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.action-menu-container')) {
        setOpenMenuId(null)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  const handleOpenModal = (share = null) => {
    setOpenMenuId(null)
    if (share) {
      setEditingShare(share)
      setFormData({
        investor_id: share.investor_id ? String(share.investor_id) : '',
        share_percentage: share.share_percentage || '',
        status: share.status || 'active',
        note: share.note || ''
      })
    } else {
      setEditingShare(null)
      setFormData({
        investor_id: '',
        share_percentage: '',
        status: 'active',
        note: ''
      })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingShare(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.investor_id) {
      return toast.error('Please select an investor')
    }
    if (formData.share_percentage === '') {
      return toast.error('Share percentage is required')
    }

    const pct = parseFloat(formData.share_percentage)
    if (isNaN(pct) || pct < 0 || pct > 100) {
      return toast.error('Share percentage must be between 0 and 100')
    }

    setSubmitting(true)
    try {
      if (editingShare) {
        await axios.put(`/api/shares/${editingShare.share_id}`, formData)
        toast.success('Share allocation updated successfully')
      } else {
        await axios.post('/api/shares', formData)
        toast.success('Share allocation created successfully')
      }
      handleCloseModal()
      fetchSharesAndSettings()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Operation failed')
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingId) return
    setDeleting(true)
    try {
      await axios.delete(`/api/shares/${deletingId}`)
      toast.success('Share allocation deleted successfully')
      setDeleteModalOpen(false)
      setDeletingId(null)
      fetchSharesAndSettings()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete share record')
    } finally {
      setDeleting(false)
    }
  }

  const filteredShares = shares.filter(item => {
    const matchesSearch = item.investor_name?.toLowerCase().includes(search.toLowerCase()) ||
                          item.investor_phone?.toLowerCase().includes(search.toLowerCase()) ||
                          item.note?.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Summary Metrics
  const totalAllocatedPct = shares
    .filter(s => s.status === 'active')
    .reduce((acc, curr) => acc + parseFloat(curr.share_percentage || 0), 0)
  const unallocatedPct = Math.max(0, 100 - totalAllocatedPct)
  const activeShareholdersCount = new Set(shares.filter(s => s.status === 'active').map(s => s.investor_id)).size

  if (!loading && !isShareInvestment) {
    return <ShareInvestmentDisabled moduleName="Share Allocation & Equity System" />
  }

  return (
    <div className={`w-full min-h-screen bg-slate-50 pt-20 pb-12 px-4 md:px-8 transition-all duration-300 ${dashSidebar ? 'lg:pl-68' : 'lg:pl-8'}`}>
      <div className="max-w-6xl mx-auto flex flex-col gap-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-4 gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-800 flex items-center gap-2.5">
              <BiPieChartAlt2 className="text-primary text-3xl" />
              Share Allocations & Equity Distribution
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Admin Console for Managing Equity Ownership and Investor Share Percentages
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={fetchSharesAndSettings}
              className="p-2.5 bg-white border border-slate-200 text-slate-700 text-xs font-bold shadow-sm hover:bg-slate-100 transition cursor-pointer"
              title="Refresh"
            >
              <BiRefresh className={`text-lg ${loading ? 'animate-spin' : ''}`} />
            </button>
            {!isShareInvestment && (
              <button
                onClick={() => handleOpenModal()}
                className="px-4 py-2.5 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer bg-primary hover:bg-primary-dark"
              >
                <BiPlus className="text-lg" />
                Add Share Allocation
              </button>
            )}
          </div>
        </div>

        {/* Feature Flag Banner */}
        {isShareInvestment && (
          <div className="p-3.5 bg-blue-50 border border-blue-200 flex items-center justify-between gap-3 text-xs font-medium text-blue-800">
            <div className="flex items-center gap-2">
              <BiInfoCircle className="text-xl text-blue-600 shrink-0" />
              <span>
                <strong>Automated Share Calculation Active:</strong> Share percentages are dynamically derived from investor capital investments recorded in the Investor module.
              </span>
            </div>
          </div>
        )}

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 p-5 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Allocated Equity</p>
              <h3 className="text-lg font-bold text-slate-800 mt-0.5">{totalAllocatedPct.toFixed(2)}%</h3>
            </div>
            <div className="w-10 h-10 text-white flex items-center justify-center text-xl shrink-0 font-bold bg-primary">
              <BiPieChartAlt2 />
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-5 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Unallocated Equity</p>
              <h3 className="text-lg font-bold text-slate-800 mt-0.5">{unallocatedPct.toFixed(2)}%</h3>
            </div>
            <div className="w-10 h-10 bg-slate-100 text-slate-600 border border-slate-200 flex items-center justify-center text-xl shrink-0 font-bold">
              <BiPieChartAlt2 />
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-5 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Active Shareholders</p>
              <h3 className="text-lg font-bold text-slate-800 mt-0.5">{activeShareholdersCount}</h3>
            </div>
            <div className="w-10 h-10 text-white flex items-center justify-center text-xl shrink-0 font-bold bg-emerald-600">
              <BiUser />
            </div>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="bg-white p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <div className="relative w-full sm:w-72">
              <BiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base" />
              <input
                type="text"
                placeholder="Search investor name, phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-56 px-3.5 py-2.5 bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
            <span>Showing {filteredShares.length} record(s)</span>
          </div>
        </div>

        {/* Shares Table */}
        <div className="bg-white border border-slate-200 shadow-sm">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <BiLoaderAlt className="text-3xl text-primary animate-spin" />
              <p className="text-xs font-medium text-slate-500">Loading share allocations...</p>
            </div>
          ) : filteredShares.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-2 text-slate-400">
              <BiPieChartAlt2 className="text-4xl" />
              <p className="text-sm font-semibold text-slate-600">No share allocation records found</p>
              <p className="text-xs">
                {isShareInvestment
                  ? 'Record investments for active investors to calculate shares.'
                  : 'Add a new share allocation to start tracking investor equity.'}
              </p>
            </div>
          ) : (
            <div className="w-full">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-100/80 text-slate-650 font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-3 md:px-4 py-3">Investor</th>
                    <th className="px-3 md:px-4 py-3">Share Percentage</th>
                    <th className="hidden sm:table-cell px-3 md:px-4 py-3">Status</th>
                    <th className="hidden md:table-cell px-3 md:px-4 py-3">Notes</th>
                    <th className="px-3 md:px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
                  {filteredShares.map((item) => {
                    const pct = parseFloat(item.share_percentage || 0)
                    const isMenuOpen = openMenuId === item.share_id

                    return (
                      <tr key={item.share_id} className="hover:bg-slate-50/80 transition">
                        <td className="px-3 md:px-4 py-3 font-semibold">
                          <div className="font-bold text-slate-900 flex items-center gap-2">
                            <BiUser className="text-slate-400 text-base" />
                            {item.investor_name || `Investor #${item.investor_id}`}
                          </div>
                          {item.investor_phone && (
                            <div className="text-[10px] text-slate-400 font-normal mt-0.5 ml-6">
                              {item.investor_phone}
                            </div>
                          )}
                        </td>

                        <td className="px-3 md:px-4 py-3">
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-slate-900 min-w-[45px]">
                              {pct.toFixed(2)}%
                            </span>
                            <div className="w-32 h-2 bg-slate-100 border border-slate-200 shrink-0">
                              <div 
                                className={`h-full ${item.status === 'active' ? 'bg-primary' : 'bg-slate-400'}`} 
                                style={{ width: `${Math.min(pct, 100)}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>

                        <td className="hidden sm:table-cell px-3 md:px-4 py-3">
                          <span className={`inline-block px-2 py-0.5 text-[9px] font-bold uppercase border ${
                            item.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}>
                            {item.status}
                          </span>
                        </td>

                        <td className="hidden md:table-cell px-3 md:px-4 py-3 text-slate-500 max-w-xs truncate">
                          {item.note || '-'}
                        </td>

                        <td className="px-3 md:px-4 py-3 text-right relative action-menu-container">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setOpenMenuId(isMenuOpen ? null : item.share_id)
                            }}
                            className="p-1.5 hover:bg-slate-100 text-slate-700 transition cursor-pointer border border-slate-200 shadow-xs"
                            title="Options"
                          >
                            <BiDotsVerticalRounded className="text-lg" />
                          </button>

                          {isMenuOpen && (
                            <div className="absolute right-3 top-10 w-36 bg-white border border-slate-200 shadow-lg z-30 flex flex-col py-1 text-left">
                              <button
                                onClick={() => handleOpenModal(item)}
                                className="w-full px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                              >
                                <BiEdit className="text-slate-500 text-base" /> Edit
                              </button>
                              <button
                                onClick={() => {
                                  setOpenMenuId(null)
                                  setDeletingId(item.share_id)
                                  setDeleteModalOpen(true)
                                }}
                                className="w-full px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                              >
                                <BiTrash className="text-rose-600 text-base" /> Delete
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* Add / Edit Share Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <BiPieChartAlt2 className="text-primary text-xl" />
                {editingShare ? 'Edit Share Allocation' : 'Add Share Allocation'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-1 text-slate-400 hover:text-slate-600 transition"
              >
                <BiX className="text-xl" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Investor *</label>
                <select
                  required
                  value={formData.investor_id}
                  onChange={(e) => setFormData({ ...formData, investor_id: e.target.value })}
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
                <label className="block text-xs font-bold text-slate-700 mb-1">Share Percentage (%) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  required
                  placeholder="e.g. 25.00"
                  value={formData.share_percentage}
                  onChange={(e) => setFormData({ ...formData, share_percentage: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:bg-white focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:bg-white focus:border-primary cursor-pointer"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Note / Agreement Details</label>
                <textarea
                  rows="3"
                  placeholder="Details regarding this equity allocation..."
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:bg-white focus:border-primary"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
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
                  className="px-5 py-2 text-white text-xs font-bold transition shadow-sm flex items-center gap-2 cursor-pointer bg-primary hover:bg-primary-dark disabled:opacity-50"
                >
                  {submitting && <BiLoaderAlt className="animate-spin text-sm" />}
                  {editingShare ? 'Save Changes' : 'Allocate Share'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 max-w-sm w-full p-6 shadow-2xl text-center">
            <div className="w-12 h-12 border border-rose-200 bg-rose-50 text-rose-600 flex items-center justify-center text-2xl font-bold mx-auto mb-3">
              <BiTrash />
            </div>
            <h3 className="text-base font-bold text-slate-800">Delete Share Allocation?</h3>
            <p className="text-xs text-slate-500 mt-1 mb-6">
              This action will remove the selected equity share record permanently.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-bold border border-slate-200 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {deleting && <BiLoaderAlt className="animate-spin text-sm" />}
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

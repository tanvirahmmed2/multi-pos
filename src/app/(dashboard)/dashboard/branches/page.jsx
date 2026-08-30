'use client'
import React, { useState, useEffect, useContext } from 'react'
import { Context } from '@/component/helper/Context'
import axios from 'axios'
import toast from 'react-hot-toast'
import { 
  BiStoreAlt, 
  BiPlus, 
  BiSearch, 
  BiRefresh, 
  BiEdit, 
  BiTrash, 
  BiCheckCircle, 
  BiXCircle, 
  BiLoaderAlt, 
  BiPhone, 
  BiEnvelope, 
  BiMapPin,
  BiUserCheck,
  BiX
} from 'react-icons/bi'

export default function AdminBranchesPage() {
  const { dashSidebar } = useContext(Context)

  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingBranch, setEditingBranch] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    address: '',
    phone: '',
    email: '',
    is_active: true
  })

  const fetchBranches = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/api/branch')
      setBranches(res.data)
    } catch (err) {
      console.error('Error fetching branches:', err)
      toast.error('Failed to load branches')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBranches()
  }, [])

  const handleOpenCreate = () => {
    setEditingBranch(null)
    setFormData({
      name: '',
      code: '',
      address: '',
      phone: '',
      email: '',
      is_active: true
    })
    setIsModalOpen(true)
  }

  const handleOpenEdit = (branch) => {
    setEditingBranch(branch)
    setFormData({
      name: branch.name || '',
      code: branch.code || '',
      address: branch.address || '',
      phone: branch.phone || '',
      email: branch.email || '',
      is_active: branch.is_active !== false
    })
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    if (submitting) return
    setIsModalOpen(false)
    setEditingBranch(null)
  }

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmitForm = async (e) => {
    e.preventDefault()
    if (submitting) return

    if (!formData.name.trim()) {
      toast.error('Branch name is required')
      return
    }

    setSubmitting(true)
    const toastId = toast.loading(editingBranch ? 'Updating branch...' : 'Creating branch...')

    try {
      if (editingBranch) {
        const res = await axios.put(`/api/branch/${editingBranch.branch_id}`, formData)
        toast.success(res.data.message || 'Branch updated successfully!', { id: toastId })
      } else {
        const res = await axios.post('/api/branch', formData)
        toast.success(res.data.message || 'Branch created successfully!', { id: toastId })
      }
      fetchBranches()
      handleCloseModal()
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to save branch'
      toast.error(errorMsg, { id: toastId })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteBranch = async (branchId, branchName) => {
    if (!window.confirm(`Are you sure you want to delete branch "${branchName}"?`)) return

    const toastId = toast.loading('Deleting branch...')
    try {
      const res = await axios.delete(`/api/branch/${branchId}`)
      toast.success(res.data.message || 'Branch deleted successfully!', { id: toastId })
      fetchBranches()
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to delete branch'
      toast.error(errorMsg, { id: toastId })
    }
  }

  const handleToggleStatus = async (branch) => {
    const newStatus = !branch.is_active
    const toastId = toast.loading(`${newStatus ? 'Activating' : 'Deactivating'} branch...`)

    try {
      const res = await axios.put(`/api/branch/${branch.branch_id}`, {
        ...branch,
        is_active: newStatus
      })
      toast.success(res.data.message || 'Branch status updated!', { id: toastId })
      fetchBranches()
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to update branch status'
      toast.error(errorMsg, { id: toastId })
    }
  }

  const filteredBranches = branches.filter((b) => {
    const matchesSearch =
      b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.code && b.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (b.phone && b.phone.includes(searchTerm)) ||
      (b.email && b.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (b.address && b.address.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'active' && b.is_active) ||
      (filterStatus === 'inactive' && !b.is_active)

    return matchesSearch && matchesStatus
  })

  const stats = {
    total: branches.length,
    active: branches.filter((b) => b.is_active).length,
    inactive: branches.filter((b) => !b.is_active).length,
    totalStaff: branches.reduce((sum, b) => sum + (parseInt(b.staff_count, 10) || 0), 0)
  }

  return (
    <div className={`w-full min-h-screen bg-slate-50 pt-20 pb-12 px-4 md:px-8 transition-all duration-300 ${dashSidebar ? 'lg:pl-68' : 'lg:pl-8'}`}>
      <div className="max-w-6xl mx-auto flex flex-col gap-6">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/60 pb-4">
          <div>
            <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              <BiStoreAlt className="text-primary" />
              Store Branches Management
            </h1>
            <p className="text-slate-500 text-xs md:text-sm mt-0.5">Create, view, update, and manage all physical and online store branches.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchBranches}
              disabled={loading}
              className="p-2.5 bg-white hover:bg-slate-50 text-slate-700 rounded-xl border border-slate-200 transition cursor-pointer shadow-sm disabled:opacity-40"
              title="Refresh branches"
            >
              <BiRefresh className={`text-xl ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleOpenCreate}
              className="px-4 py-2.5 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer bg-primary hover:bg-primary-dark"
            >
              <BiPlus className="text-lg" /> New Branch
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Branches</p>
            <h4 className="text-xl font-bold text-slate-800 mt-1">{stats.total}</h4>
          </div>
          <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Active Branches</p>
            <h4 className="text-xl font-bold text-emerald-700 mt-1">{stats.active}</h4>
          </div>
          <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-wider text-rose-500">Inactive Branches</p>
            <h4 className="text-xl font-bold text-rose-600 mt-1">{stats.inactive}</h4>
          </div>
          <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Assigned Staff</p>
            <h4 className="text-xl font-bold text-slate-800 mt-1">{stats.totalStaff}</h4>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 border border-slate-200 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 border border-slate-200 rounded-xl w-full sm:w-80">
            <BiSearch className="text-slate-400 text-lg" />
            <input
              type="text"
              placeholder="Search branch name, code, phone, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent text-xs text-slate-800 outline-none w-full font-medium"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <span className="text-xs font-bold text-slate-500">Status:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="w-full py-20 flex flex-col items-center justify-center gap-2 bg-white rounded-2xl border border-slate-200">
            <BiLoaderAlt className="animate-spin text-4xl text-slate-800" />
            <p className="text-slate-500 text-xs font-semibold animate-pulse">Loading branches...</p>
          </div>
        ) : filteredBranches.length === 0 ? (
          <div className="w-full bg-white border border-slate-200 rounded-2xl py-16 px-6 text-center flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-2xl">
              <BiStoreAlt />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">No Branches Found</h3>
              <p className="text-slate-500 text-xs mt-1">No store branches match your search parameters or filter criteria.</p>
            </div>
          </div>
        ) : (
          <div className="w-full overflow-x-auto bg-white border border-slate-200 rounded-2xl shadow-sm">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3.5">Branch Code</th>
                  <th className="px-4 py-3.5">Branch Name</th>
                  <th className="px-4 py-3.5">Contact Info</th>
                  <th className="px-4 py-3.5">Address</th>
                  <th className="px-4 py-3.5 text-center">Staff Count</th>
                  <th className="px-4 py-3.5 text-center">Status</th>
                  <th className="px-4 py-3.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredBranches.map((b) => (
                  <tr key={b.branch_id} className="hover:bg-slate-50/50 transition">
                    <td className="px-4 py-3.5 font-mono font-bold text-slate-600">
                      {b.code ? <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-slate-800">{b.code}</span> : '-'}
                    </td>
                    <td className="px-4 py-3.5 font-bold text-slate-800 text-sm">
                      {b.name}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-col gap-0.5 text-xs">
                        {b.phone && <span className="flex items-center gap-1 text-slate-700"><BiPhone className="text-slate-400" /> {b.phone}</span>}
                        {b.email && <span className="flex items-center gap-1 text-slate-500 font-mono text-[11px]"><BiEnvelope className="text-slate-400" /> {b.email}</span>}
                        {!b.phone && !b.email && <span className="text-slate-400 italic">No contact info</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 max-w-[200px] truncate text-slate-600" title={b.address}>
                      {b.address ? <span className="flex items-center gap-1"><BiMapPin className="text-slate-400 shrink-0" /> {b.address}</span> : '-'}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-100 font-bold text-slate-700 text-xs border border-slate-200">
                        {b.staff_count || 0}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <button
                        onClick={() => handleToggleStatus(b)}
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase cursor-pointer border transition ${
                          b.is_active
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                        }`}
                      >
                        {b.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenEdit(b)}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition cursor-pointer"
                          title="Edit branch"
                        >
                          <BiEdit className="text-base" />
                        </button>
                        <button
                          onClick={() => handleDeleteBranch(b.branch_id, b.name)}
                          className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition cursor-pointer"
                          title="Delete branch"
                        >
                          <BiTrash className="text-base" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in">
              
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <BiStoreAlt className="text-primary" />
                  {editingBranch ? 'Update Store Branch' : 'Create New Store Branch'}
                </h3>
                <button
                  onClick={handleCloseModal}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition cursor-pointer"
                >
                  <BiX className="text-2xl" />
                </button>
              </div>

              <form onSubmit={handleSubmitForm} className="p-6 flex flex-col gap-4">
                
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="name" className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Branch Name *
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    placeholder="e.g. Uttara Main Branch"
                    value={formData.name}
                    onChange={handleFormChange}
                    className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-slate-400 transition"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="phone" className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Phone Number
                    </label>
                    <input
                      id="phone"
                      name="phone"
                      type="text"
                      placeholder="+8801700000000"
                      value={formData.phone}
                      onChange={handleFormChange}
                      className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-slate-400 transition"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="email" className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Email Address
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="branch@store.com"
                      value={formData.email}
                      onChange={handleFormChange}
                      className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-slate-400 transition"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="address" className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Physical Address
                  </label>
                  <textarea
                    id="address"
                    name="address"
                    rows="3"
                    placeholder="House, Road, Area, City..."
                    value={formData.address}
                    onChange={handleFormChange}
                    className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-slate-400 transition resize-none"
                  ></textarea>
                </div>

                <div className="flex items-center gap-2 mt-1">
                  <input
                    id="is_active"
                    name="is_active"
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={handleFormChange}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                  />
                  <label htmlFor="is_active" className="text-xs font-semibold text-slate-700 cursor-pointer">
                    Active Branch (available for stock & orders)
                  </label>
                </div>

                <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    disabled={submitting}
                    className="px-4 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 bg-primary hover:bg-primary-dark"
                  >
                    {submitting ? (
                      <>
                        <BiLoaderAlt className="animate-spin text-base" /> {editingBranch ? 'Saving...' : 'Creating...'}
                      </>
                    ) : (
                      <>{editingBranch ? 'Update Branch' : 'Create Branch'}</>
                    )}
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

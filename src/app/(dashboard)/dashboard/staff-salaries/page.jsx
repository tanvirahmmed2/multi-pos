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
  BiX, 
  BiRefresh,
  BiDollarCircle,
  BiCheckCircle,
  BiXCircle
} from 'react-icons/bi'

export default function DashboardStaffSalariesPage() {
  const { dashSidebar, formatCurrency } = useContext(Context)
  const [assignments, setAssignments] = useState([])
  const [staffList, setStaffList] = useState([])
  const [salariesList, setSalariesList] = useState([])
  
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    staff_id: '',
    salary_id: '',
    effective_date: new Date().toISOString().split('T')[0],
    status: 'active',
    note: ''
  })

  const fetchData = async () => {
    setLoading(true)
    try {
      const [ssRes, staffRes, salRes] = await Promise.all([
        axios.get('/api/staff-salaries'),
        axios.get('/api/staff'),
        axios.get('/api/salaries')
      ])

      if (ssRes.data && Array.isArray(ssRes.data)) setAssignments(ssRes.data)
      if (staffRes.data && Array.isArray(staffRes.data)) setStaffList(staffRes.data)
      if (salRes.data && Array.isArray(salRes.data)) setSalariesList(salRes.data)
    } catch (err) {
      toast.error('Failed to load staff salary assignments')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleOpenAddModal = () => {
    setEditingItem(null)
    setFormData({
      staff_id: staffList[0]?.staff_id || '',
      salary_id: salariesList[0]?.salary_id || '',
      effective_date: new Date().toISOString().split('T')[0],
      status: 'active',
      note: ''
    })
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (item) => {
    setEditingItem(item)
    setFormData({
      staff_id: item.staff_id || '',
      salary_id: item.salary_id || '',
      effective_date: item.effective_date ? new Date(item.effective_date).toISOString().split('T')[0] : '',
      status: item.status || 'active',
      note: item.note || ''
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove salary assignment for ${name}?`)) return
    try {
      await axios.delete(`/api/staff-salaries/${id}`)
      toast.success('Staff salary assignment deleted!')
      fetchData()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete assignment')
      console.error(err)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.staff_id || !formData.salary_id) {
      toast.error('Please select both staff member and salary grade')
      return
    }

    setSubmitting(true)
    try {
      if (editingItem) {
        await axios.put(`/api/staff-salaries/${editingItem.staff_salary_id}`, formData)
        toast.success('Staff salary assignment updated!')
      } else {
        await axios.post('/api/staff-salaries', formData)
        toast.success('Staff salary assigned successfully!')
      }
      setIsModalOpen(false)
      fetchData()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save staff salary assignment')
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const filteredAssignments = assignments.filter((item) => {
    const term = search.toLowerCase()
    return (
      (item.staff_name && item.staff_name.toLowerCase().includes(term)) ||
      (item.staff_email && item.staff_email.toLowerCase().includes(term)) ||
      (item.salary_title && item.salary_title.toLowerCase().includes(term)) ||
      (item.status && item.status.toLowerCase().includes(term))
    )
  })

  // Selected salary details preview
  const selectedSalary = salariesList.find(s => String(s.salary_id) === String(formData.salary_id))

  return (
    <div className={`w-full min-h-screen bg-slate-50 pt-20 pb-12 px-4 md:px-8 transition-all duration-300 ${dashSidebar ? 'lg:pl-68' : 'lg:pl-8'}`}>
      <div className="max-w-6xl mx-auto flex flex-col gap-6">

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2.5">
              <BiUser className="text-blue-600 text-3xl" /> Staff Salaries
            </h1>
            <p className="text-slate-500 text-xs mt-1 font-medium">
              Assign salary structures to registered staff members and maintain pay history.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={fetchData}
              className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
              title="Refresh"
            >
              <BiRefresh className="text-lg" />
            </button>
            <button
              onClick={handleOpenAddModal}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <BiPlus className="text-lg" /> Assign Salary
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <BiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search staff name or salary grade..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
            />
          </div>
          <span className="text-xs font-bold text-slate-500">
            Showing {filteredAssignments.length} of {assignments.length} assignments
          </span>
        </div>

        {/* Staff Salaries Table */}
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
          {loading ? (
            <div className="p-12 flex flex-col items-center justify-center text-slate-400 gap-2 font-medium">
              <BiLoaderAlt className="animate-spin text-2xl text-blue-600" />
              <span className="text-xs">Loading staff salaries...</span>
            </div>
          ) : filteredAssignments.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs font-medium">
              No staff salary assignments found. Click "+ Assign Salary" to add one.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-black uppercase text-slate-500 tracking-wider">
                    <th className="py-3.5 px-4">Staff Member</th>
                    <th className="py-3.5 px-4">Assigned Pay Grade</th>
                    <th className="py-3.5 px-4">Effective Date</th>
                    <th className="py-3.5 px-4">Net Monthly Pay</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                  {filteredAssignments.map((item) => (
                    <tr key={item.staff_salary_id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{item.staff_name || `Staff #${item.staff_id}`}</div>
                        <div className="text-[10px] font-mono text-slate-400">{item.staff_email || item.staff_role}</div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-800">
                        {item.salary_title || `Structure #${item.salary_id}`}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 font-mono">
                        {item.effective_date ? new Date(item.effective_date).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-black text-emerald-700 text-sm">
                        {formatCurrency(item.net_salary || 0)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          item.status === 'active' 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}>
                          {item.status === 'active' ? <BiCheckCircle /> : <BiXCircle />}
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal(item)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition cursor-pointer"
                            title="Edit Assignment"
                          >
                            <BiEdit className="text-base" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.staff_salary_id, item.staff_name)}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition cursor-pointer"
                            title="Delete Assignment"
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
        </div>

        {/* Modal Form */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
            <div className="bg-white border border-slate-200 w-full max-w-md p-6 rounded-2xl shadow-2xl flex flex-col gap-4">
              
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <BiUser className="text-blue-600 text-lg" />
                  {editingItem ? 'Edit Staff Salary Assignment' : 'Assign Salary to Staff'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer"
                >
                  <BiX />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Select Staff Member *</label>
                  <select
                    required
                    value={formData.staff_id}
                    onChange={(e) => setFormData({ ...formData, staff_id: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="">-- Choose Staff --</option>
                    {staffList.map((st) => (
                      <option key={st.staff_id} value={st.staff_id}>
                        {st.name} ({st.role || st.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Select Salary Structure Grade *</label>
                  <select
                    required
                    value={formData.salary_id}
                    onChange={(e) => setFormData({ ...formData, salary_id: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="">-- Choose Structure --</option>
                    {salariesList.map((sal) => (
                      <option key={sal.salary_id} value={sal.salary_id}>
                        {sal.title} - Net: {formatCurrency(sal.net_salary)}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedSalary && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col gap-1 text-xs">
                    <div className="flex justify-between text-slate-600 font-semibold">
                      <span>Base Salary:</span>
                      <span>{formatCurrency(selectedSalary.base_salary)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600 font-semibold">
                      <span>Net Pay per Month:</span>
                      <span className="font-bold text-emerald-700">{formatCurrency(selectedSalary.net_salary)}</span>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Effective Date</label>
                    <input
                      type="date"
                      value={formData.effective_date}
                      onChange={(e) => setFormData({ ...formData, effective_date: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Notes</label>
                  <textarea
                    rows={2}
                    value={formData.note}
                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                    placeholder="Optional details..."
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {submitting ? 'Saving...' : editingItem ? 'Update Assignment' : 'Assign Salary'}
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

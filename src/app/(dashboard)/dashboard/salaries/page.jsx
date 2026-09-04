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
  BiX, 
  BiCheckCircle,
  BiRefresh,
  BiBriefcase
} from 'react-icons/bi'

export default function DashboardSalariesPage() {
  const { dashSidebar, formatCurrency } = useContext(Context)
  const [salaries, setSalaries] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSalary, setEditingSalary] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    title: '',
    base_salary: '',
    bonus: '0',
    allowance: '0',
    deduction: '0',
    note: ''
  })

  const fetchSalaries = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/api/salaries')
      if (res.data && Array.isArray(res.data)) {
        setSalaries(res.data)
      }
    } catch (err) {
      toast.error('Failed to load salary structures')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSalaries()
  }, [])

  const handleOpenAddModal = () => {
    setEditingSalary(null)
    setFormData({
      title: '',
      base_salary: '',
      bonus: '0',
      allowance: '0',
      deduction: '0',
      note: ''
    })
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (sal) => {
    setEditingSalary(sal)
    setFormData({
      title: sal.title || '',
      base_salary: sal.base_salary || '',
      bonus: sal.bonus || '0',
      allowance: sal.allowance || '0',
      deduction: sal.deduction || '0',
      note: sal.note || ''
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete salary structure "${title}"?`)) return
    try {
      await axios.delete(`/api/salaries/${id}`)
      toast.success('Salary structure deleted successfully!')
      fetchSalaries()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete salary structure')
      console.error(err)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.title || formData.base_salary === '') {
      toast.error('Please enter title and base salary')
      return
    }

    setSubmitting(true)
    try {
      if (editingSalary) {
        await axios.put(`/api/salaries/${editingSalary.salary_id}`, formData)
        toast.success('Salary structure updated successfully!')
      } else {
        await axios.post('/api/salaries', formData)
        toast.success('Salary structure created successfully!')
      }
      setIsModalOpen(false)
      fetchSalaries()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save salary structure')
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const filteredSalaries = salaries.filter((sal) => {
    const term = search.toLowerCase()
    return (
      (sal.title && sal.title.toLowerCase().includes(term)) ||
      (sal.note && sal.note.toLowerCase().includes(term)) ||
      String(sal.base_salary).includes(term) ||
      String(sal.net_salary).includes(term)
    )
  })

  // Calculate live preview net salary for form
  const calcBase = parseFloat(formData.base_salary) || 0
  const calcBonus = parseFloat(formData.bonus) || 0
  const calcAllowance = parseFloat(formData.allowance) || 0
  const calcDeduction = parseFloat(formData.deduction) || 0
  const calcNet = calcBase + calcBonus + calcAllowance - calcDeduction

  return (
    <div className={`w-full min-h-screen bg-slate-50 pt-20 pb-12 px-4 md:px-8 transition-all duration-300 ${dashSidebar ? 'lg:pl-68' : 'lg:pl-8'}`}>
      <div className="w-full flex flex-col gap-6">

        {/* Header Card */}
        <div className="bg-white border border-slate-200 shadow-sm p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <BiBriefcase className="text-primary text-2xl" /> Salary Structures
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure payroll pay grades, base salaries, allowances, and deductions.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchSalaries}
              className="p-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs shadow-sm transition cursor-pointer"
              title="Refresh"
            >
              <BiRefresh className="text-base" />
            </button>
            <button
              onClick={handleOpenAddModal}
              className="px-4 py-2 bg-primary hover:bg-primary-dark text-white font-bold text-xs shadow-sm transition flex items-center gap-1.5 cursor-pointer"
            >
              <BiPlus className="text-base" /> Create Structure
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white border border-slate-200 shadow-sm p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <BiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title or amount..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 focus:bg-white focus:border-primary focus:outline-none transition"
            />
          </div>
          <span className="text-xs font-semibold text-slate-500">
            Showing {filteredSalaries.length} of {salaries.length} pay grades
          </span>
        </div>

        {/* Salaries Table */}
        <div className="bg-white border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 flex flex-col items-center justify-center text-slate-400 gap-2 font-medium">
              <BiLoaderAlt className="animate-spin text-2xl text-primary" />
              <span className="text-xs">Loading salary structures...</span>
            </div>
          ) : filteredSalaries.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs font-medium">
              No salary structures found. Click "+ Create Structure" to add one.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs text-slate-600">
                <thead className="bg-slate-100/70 text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Pay Grade Title</th>
                    <th className="py-3 px-4">Base Salary</th>
                    <th className="py-3 px-4">Bonus</th>
                    <th className="py-3 px-4">Allowance</th>
                    <th className="py-3 px-4">Deduction</th>
                    <th className="py-3 px-4">Net Monthly Pay</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 border-t border-slate-100 font-medium">
                  {filteredSalaries.map((sal) => (
                    <tr key={sal.salary_id} className="border-b border-slate-200 text-xs text-slate-700 hover:bg-slate-50 transition">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800">{sal.title}</div>
                        {sal.note && <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{sal.note}</div>}
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold">{formatCurrency(sal.base_salary)}</td>
                      <td className="py-3 px-4 font-mono text-emerald-600">+{formatCurrency(sal.bonus || 0)}</td>
                      <td className="py-3 px-4 font-mono text-blue-600">+{formatCurrency(sal.allowance || 0)}</td>
                      <td className="py-3 px-4 font-mono text-rose-600">-{formatCurrency(sal.deduction || 0)}</td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-700 text-xs">
                        {formatCurrency(sal.net_salary)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal(sal)}
                            className="p-1.5 hover:bg-slate-100 text-slate-600 transition cursor-pointer border border-slate-200 shadow-xs"
                            title="Edit Structure"
                          >
                            <BiEdit className="text-base" />
                          </button>
                          <button
                            onClick={() => handleDelete(sal.salary_id, sal.title)}
                            className="p-1.5 hover:bg-rose-50 text-slate-500 hover:text-rose-600 transition cursor-pointer border border-slate-200 shadow-xs"
                            title="Delete Structure"
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

        {/* Modal Form for Create / Edit */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white border border-slate-200 w-full max-w-lg p-6 shadow-xl flex flex-col gap-4">
              
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <BiBriefcase className="text-primary text-xl" />
                  {editingSalary ? 'Edit Salary Structure' : 'Create Salary Structure'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 text-xl cursor-pointer"
                >
                  <BiX />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Structure / Grade Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Senior Manager, Full-time Sales"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 focus:bg-white focus:border-primary focus:outline-none transition"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Base Salary *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={formData.base_salary}
                      onChange={(e) => setFormData({ ...formData, base_salary: e.target.value })}
                      placeholder="e.g. 25000"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-xs font-mono font-medium text-slate-800 focus:bg-white focus:border-primary focus:outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Bonus</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.bonus}
                      onChange={(e) => setFormData({ ...formData, bonus: e.target.value })}
                      placeholder="0"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-xs font-mono font-medium text-slate-800 focus:bg-white focus:border-primary focus:outline-none transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Allowance</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.allowance}
                      onChange={(e) => setFormData({ ...formData, allowance: e.target.value })}
                      placeholder="0"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-xs font-mono font-medium text-slate-800 focus:bg-white focus:border-primary focus:outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Deduction</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.deduction}
                      onChange={(e) => setFormData({ ...formData, deduction: e.target.value })}
                      placeholder="0"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-xs font-mono font-medium text-slate-800 focus:bg-white focus:border-primary focus:outline-none transition"
                    />
                  </div>
                </div>

                {/* Net Calculation Live Banner */}
                <div className="p-3 bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">Estimated Net Salary:</span>
                  <span className="text-xs font-mono font-bold text-emerald-700">
                    {formatCurrency(calcNet)}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Notes / Description</label>
                  <textarea
                    rows={2}
                    value={formData.note}
                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                    placeholder="Optional details or terms..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 focus:bg-white focus:border-primary focus:outline-none transition resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-slate-200 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-primary hover:bg-primary-dark text-white text-xs font-bold cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {submitting ? 'Saving...' : editingSalary ? 'Update Structure' : 'Create Structure'}
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

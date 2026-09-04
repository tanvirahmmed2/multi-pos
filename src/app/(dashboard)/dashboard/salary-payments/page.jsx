'use client'
import React, { useContext, useEffect, useState } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Context } from '@/component/helper/Context'
import { 
  BiFile, 
  BiPlus, 
  BiSearch, 
  BiLoaderAlt, 
  BiEdit, 
  BiTrash, 
  BiX, 
  BiRefresh,
  BiCreditCard,
  BiCheckCircle,
  BiTimeFive,
  BiXCircle
} from 'react-icons/bi'

export default function DashboardSalaryPaymentsPage() {
  const { dashSidebar, formatCurrency } = useContext(Context)
  const [payments, setPayments] = useState([])
  const [staffSalariesList, setStaffSalariesList] = useState([])
  
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const defaultMonth = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })

  const [formData, setFormData] = useState({
    staff_salary_id: '',
    staff_id: '',
    amount: '',
    payment_month: defaultMonth,
    payment_method: 'bank_transfer',
    account_details: '',
    transaction_id: '',
    status: 'completed',
    payment_date: new Date().toISOString().split('T')[0],
    note: ''
  })

  const fetchData = async () => {
    setLoading(true)
    try {
      const [payRes, ssRes] = await Promise.all([
        axios.get('/api/salary-payments'),
        axios.get('/api/staff-salaries')
      ])

      if (payRes.data && Array.isArray(payRes.data)) setPayments(payRes.data)
      if (ssRes.data && Array.isArray(ssRes.data)) setStaffSalariesList(ssRes.data)
    } catch (err) {
      toast.error('Failed to load salary payment records')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleSelectStaffSalary = (ssId) => {
    const found = staffSalariesList.find(s => String(s.staff_salary_id) === String(ssId))
    if (found) {
      setFormData(prev => ({
        ...prev,
        staff_salary_id: found.staff_salary_id,
        staff_id: found.staff_id,
        amount: found.net_salary || prev.amount
      }))
    } else {
      setFormData(prev => ({ ...prev, staff_salary_id: ssId }))
    }
  }

  const handleOpenAddModal = () => {
    setEditingItem(null)
    const firstSS = staffSalariesList[0]
    setFormData({
      staff_salary_id: firstSS?.staff_salary_id || '',
      staff_id: firstSS?.staff_id || '',
      amount: firstSS?.net_salary || '',
      payment_month: defaultMonth,
      payment_method: 'bank_transfer',
      account_details: '',
      transaction_id: '',
      status: 'completed',
      payment_date: new Date().toISOString().split('T')[0],
      note: ''
    })
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (item) => {
    setEditingItem(item)
    setFormData({
      staff_salary_id: item.staff_salary_id || '',
      staff_id: item.staff_id || '',
      amount: item.amount || '',
      payment_month: item.payment_month || defaultMonth,
      payment_method: item.payment_method || 'bank_transfer',
      account_details: item.account_details || '',
      transaction_id: item.transaction_id || '',
      status: item.status || 'completed',
      payment_date: item.payment_date ? new Date(item.payment_date).toISOString().split('T')[0] : '',
      note: item.note || ''
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (id, name, month) => {
    if (!window.confirm(`Are you sure you want to delete payment record #${id} for ${name} (${month})?`)) return
    try {
      await axios.delete(`/api/salary-payments/${id}`)
      toast.success('Salary payment record deleted!')
      fetchData()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete payment record')
      console.error(err)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.staff_id || !formData.amount || !formData.payment_month) {
      toast.error('Please enter staff, amount, and payment month')
      return
    }

    setSubmitting(true)
    try {
      if (editingItem) {
        await axios.put(`/api/salary-payments/${editingItem.payment_id}`, formData)
        toast.success('Salary payment updated!')
      } else {
        await axios.post('/api/salary-payments', formData)
        toast.success('Salary payment disbursed!')
      }
      setIsModalOpen(false)
      fetchData()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save salary payment')
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const filteredPayments = payments.filter((p) => {
    const term = search.toLowerCase()
    return (
      (p.staff_name && p.staff_name.toLowerCase().includes(term)) ||
      (p.payment_month && p.payment_month.toLowerCase().includes(term)) ||
      (p.payment_method && p.payment_method.toLowerCase().includes(term)) ||
      (p.transaction_id && p.transaction_id.toLowerCase().includes(term)) ||
      (p.status && p.status.toLowerCase().includes(term))
    )
  })

  return (
    <div className={`w-full min-h-screen bg-slate-50 pt-20 pb-12 px-4 md:px-8 transition-all duration-300 ${dashSidebar ? 'lg:pl-68' : 'lg:pl-8'}`}>
      <div className="w-full flex flex-col gap-6">

        {/* Header Card */}
        <div className="bg-white border border-slate-200 shadow-sm p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <BiCreditCard className="text-primary text-2xl" /> Salary Payments
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Disburse monthly salaries, track payment methods, status, and transaction IDs.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchData}
              className="p-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs shadow-sm transition cursor-pointer"
              title="Refresh"
            >
              <BiRefresh className="text-base" />
            </button>
            <button
              onClick={handleOpenAddModal}
              className="px-4 py-2 bg-primary hover:bg-primary-dark text-white font-bold text-xs shadow-sm transition flex items-center gap-1.5 cursor-pointer"
            >
              <BiPlus className="text-base" /> Disburse Salary
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
              placeholder="Search staff, transaction ID, month..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 focus:bg-white focus:border-primary focus:outline-none transition"
            />
          </div>
          <span className="text-xs font-semibold text-slate-500">
            Showing {filteredPayments.length} of {payments.length} payment disbursements
          </span>
        </div>

        {/* Payments Table */}
        <div className="bg-white border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 flex flex-col items-center justify-center text-slate-400 gap-2 font-medium">
              <BiLoaderAlt className="animate-spin text-2xl text-primary" />
              <span className="text-xs">Loading salary payment history...</span>
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs font-medium">
              No salary payments found. Click "+ Disburse Salary" to record a payment.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs text-slate-600">
                <thead className="bg-slate-100/70 text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Staff Member</th>
                    <th className="py-3 px-4">Payment Month</th>
                    <th className="py-3 px-4">Amount Paid</th>
                    <th className="py-3 px-4">Method & Account</th>
                    <th className="py-3 px-4">Transaction ID</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 border-t border-slate-100 font-medium">
                  {filteredPayments.map((p) => (
                    <tr key={p.payment_id} className="border-b border-slate-200 text-xs text-slate-700 hover:bg-slate-50 transition">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800">{p.staff_name || `Staff #${p.staff_id}`}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{p.salary_title || `Assignment #${p.staff_salary_id || 'N/A'}`}</div>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-800">
                        {p.payment_month}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-700 text-xs">
                        {formatCurrency(p.amount)}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold capitalize text-slate-800">{p.payment_method?.replace('_', ' ')}</span>
                        {p.account_details && <div className="text-[10px] text-slate-400 font-mono line-clamp-1">{p.account_details}</div>}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600 font-semibold">
                        {p.transaction_id || <span className="text-slate-300 font-normal">N/A</span>}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-0.5 text-[10px] font-bold uppercase border ${
                          p.status === 'completed' 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                            : p.status === 'pending'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal(p)}
                            className="p-1.5 hover:bg-slate-100 text-slate-600 transition cursor-pointer border border-slate-200 shadow-xs"
                            title="Edit Record"
                          >
                            <BiEdit className="text-base" />
                          </button>
                          <button
                            onClick={() => handleDelete(p.payment_id, p.staff_name, p.payment_month)}
                            className="p-1.5 hover:bg-rose-50 text-slate-500 hover:text-rose-600 transition cursor-pointer border border-slate-200 shadow-xs"
                            title="Delete Record"
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
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white border border-slate-200 w-full max-w-md p-6 shadow-xl flex flex-col gap-4">
              
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <BiCreditCard className="text-primary text-xl" />
                  {editingItem ? 'Edit Salary Payment Record' : 'Disburse Salary Payment'}
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
                  <label className="block text-xs font-bold text-slate-700 mb-1">Select Staff Salary Assignment *</label>
                  <select
                    required
                    value={formData.staff_salary_id}
                    onChange={(e) => handleSelectStaffSalary(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 focus:bg-white focus:border-primary focus:outline-none transition"
                  >
                    <option value="">-- Select Staff Assignment --</option>
                    {staffSalariesList.map((ss) => (
                      <option key={ss.staff_salary_id} value={ss.staff_salary_id}>
                        {ss.staff_name} - Grade: {ss.salary_title} ({formatCurrency(ss.net_salary)})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Disbursed Amount *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      placeholder="e.g. 25000"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-xs font-mono font-medium text-slate-800 focus:bg-white focus:border-primary focus:outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Payment Month *</label>
                    <input
                      type="text"
                      required
                      value={formData.payment_month}
                      onChange={(e) => setFormData({ ...formData, payment_month: e.target.value })}
                      placeholder="e.g. January 2026"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 focus:bg-white focus:border-primary focus:outline-none transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Payment Method</label>
                    <select
                      value={formData.payment_method}
                      onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 focus:bg-white focus:border-primary focus:outline-none transition"
                    >
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="cash">Cash</option>
                      <option value="mobile_banking">Mobile Banking (bKash/Nagad)</option>
                      <option value="cheque">Cheque</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 focus:bg-white focus:border-primary focus:outline-none transition"
                    >
                      <option value="completed">Completed</option>
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="failed">Failed</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Transaction ID</label>
                    <input
                      type="text"
                      value={formData.transaction_id}
                      onChange={(e) => setFormData({ ...formData, transaction_id: e.target.value })}
                      placeholder="e.g. TXN-998823"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-xs font-mono font-medium text-slate-800 focus:bg-white focus:border-primary focus:outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Payment Date</label>
                    <input
                      type="date"
                      value={formData.payment_date}
                      onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 focus:bg-white focus:border-primary focus:outline-none transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Account Details / Bank Note</label>
                  <input
                    type="text"
                    value={formData.account_details}
                    onChange={(e) => setFormData({ ...formData, account_details: e.target.value })}
                    placeholder="e.g. A/C 123-456-7890 (DBBL)"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 focus:bg-white focus:border-primary focus:outline-none transition"
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
                    {submitting ? 'Processing...' : editingItem ? 'Update Record' : 'Disburse Payment'}
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

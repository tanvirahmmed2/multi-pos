'use client'
import React, { useState, useEffect } from 'react'
import { 
  BiDollarCircle, 
  BiPlus, 
  BiSearch, 
  BiDotsVerticalRounded, 
  BiTrash, 
  BiCreditCard, 
  BiWallet, 
  BiReceipt, 
  BiX, 
  BiCheck, 
  BiRefresh, 
  BiDetail 
} from 'react-icons/bi'
import { toast } from 'react-hot-toast'

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState([])
  const [availableBalance, setAvailableBalance] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeMenuId, setActiveMenuId] = useState(null)

  // New Expense Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('General')
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0])
  const [totalAmount, setTotalAmount] = useState('')
  const [paidAmount, setPaidAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [note, setNote] = useState('')
  const [items, setItems] = useState([{ item_name: '', quantity: 1, unit_cost: '' }])

  // Payment Modal State
  const [isPaymentOpen, setIsPaymentOpen] = useState(false)
  const [selectedExpense, setSelectedExpense] = useState(null)
  const [payAmount, setPayAmount] = useState('')
  const [payMethod, setPayMethod] = useState('cash')
  const [payNote, setPayNote] = useState('')

  // Expense Details Modal
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [detailsExpense, setDetailsExpense] = useState(null)

  useEffect(() => {
    fetchExpenses()
    fetchBalance()
  }, [])

  const fetchExpenses = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/expenses')
      if (res.ok) {
        const data = await res.json()
        setExpenses(Array.isArray(data) ? data : [])
      } else {
        toast.error('Failed to load expenses')
      }
    } catch (error) {
      console.error('Error loading expenses:', error)
      toast.error('Error connecting to server')
    } finally {
      setLoading(false)
    }
  }

  const fetchBalance = async () => {
    try {
      const res = await fetch('/api/available-balance')
      if (res.ok) {
        const data = await res.json()
        setAvailableBalance(data.available_balance || 0)
      }
    } catch (error) {
      console.error('Error loading available balance:', error)
    }
  }

  const handleAddItemRow = () => {
    setItems([...items, { item_name: '', quantity: 1, unit_cost: '' }])
  }

  const handleRemoveItemRow = (index) => {
    if (items.length === 1) return
    setItems(items.filter((_, i) => i !== index))
  }

  const handleItemChange = (index, field, value) => {
    const updated = [...items]
    updated[index][field] = value

    // Auto calculate total if line items unit cost & quantity entered
    if (field === 'unit_cost' || field === 'quantity') {
      let calcTotal = 0
      updated.forEach(item => {
        const q = parseFloat(item.quantity || 0)
        const c = parseFloat(item.unit_cost || 0)
        calcTotal += q * c
      })
      if (calcTotal > 0) {
        setTotalAmount(calcTotal.toString())
      }
    }

    setItems(updated)
  }

  const handleCreateExpense = async (e) => {
    e.preventDefault()
    if (!title.trim()) {
      toast.error('Expense title is required')
      return
    }
    const tot = parseFloat(totalAmount)
    if (isNaN(tot) || tot <= 0) {
      toast.error('Valid total amount is required')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          category,
          expense_date: expenseDate,
          total_amount: tot,
          paid_amount: parseFloat(paidAmount || 0),
          payment_method: paymentMethod,
          note,
          items: items.filter(i => i.item_name && i.item_name.trim())
        })
      })

      if (res.ok) {
        toast.success('Expense recorded successfully!')
        setIsCreateOpen(false)
        resetForm()
        fetchExpenses()
        fetchBalance()
      } else {
        const errData = await res.json()
        toast.error(errData.error || 'Failed to create expense')
      }
    } catch (error) {
      toast.error('Error submitting expense')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddPayment = async (e) => {
    e.preventDefault()
    if (!selectedExpense) return
    const amt = parseFloat(payAmount)
    if (isNaN(amt) || amt <= 0) {
      toast.error('Valid payment amount is required')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/expenses/${selectedExpense.expense_id}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amt,
          payment_method: payMethod,
          note: payNote
        })
      })

      if (res.ok) {
        toast.success('Payment added successfully!')
        setIsPaymentOpen(false)
        setSelectedExpense(null)
        setPayAmount('')
        setPayNote('')
        fetchExpenses()
        fetchBalance()
      } else {
        const errData = await res.json()
        toast.error(errData.error || 'Failed to add payment')
      }
    } catch (error) {
      toast.error('Error adding payment')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteExpense = async (id) => {
    if (!confirm('Are you sure you want to delete this expense? Any paid amount will be refunded to available balance.')) return
    try {
      const res = await fetch(`/api/expenses/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Expense deleted successfully')
        fetchExpenses()
        fetchBalance()
      } else {
        const err = await res.json()
        toast.error(err.error || 'Failed to delete expense')
      }
    } catch (error) {
      toast.error('Error deleting expense')
    } finally {
      setActiveMenuId(null)
    }
  }

  const resetForm = () => {
    setTitle('')
    setCategory('General')
    setExpenseDate(new Date().toISOString().split('T')[0])
    setTotalAmount('')
    setPaidAmount('')
    setPaymentMethod('cash')
    setNote('')
    setItems([{ item_name: '', quantity: 1, unit_cost: '' }])
  }

  const filteredExpenses = expenses.filter(exp => 
    exp.title?.toLowerCase().includes(search.toLowerCase()) ||
    exp.category?.toLowerCase().includes(search.toLowerCase())
  )

  const grandTotal = expenses.reduce((sum, e) => sum + parseFloat(e.total_amount || 0), 0)
  const grandPaid = expenses.reduce((sum, e) => sum + parseFloat(e.paid_amount || 0), 0)
  const grandDue = expenses.reduce((sum, e) => sum + parseFloat(e.due_amount || 0), 0)

  return (
    <div className="w-full min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <BiReceipt className="text-primary" /> Expense Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track business operating expenses, line items, payments, and system cash flow.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { fetchExpenses(); fetchBalance() }}
            className="p-2.5 bg-white border border-slate-200 text-slate-600 hover:text-slate-800 hover:border-slate-300 transition cursor-pointer shadow-sm"
            title="Refresh Data"
          >
            <BiRefresh className="text-lg" />
          </button>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-4 py-2.5 bg-primary hover:bg-primary-dark text-white font-bold text-xs sm:text-sm shadow-sm transition flex items-center gap-2 cursor-pointer"
          >
            <BiPlus className="text-lg" /> Add New Expense
          </button>
        </div>
      </div>

      {/* Summary Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Available Balance</span>
            <div className="w-8 h-8 bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center text-lg">
              <BiWallet />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-slate-800 mt-2">
            ৳{availableBalance.toLocaleString('en-BD', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-slate-400">System Cash Pool Balance</span>
        </div>

        <div className="bg-white border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Expenses</span>
            <div className="w-8 h-8 bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center text-lg">
              <BiReceipt />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-slate-800 mt-2">
            ৳{grandTotal.toLocaleString('en-BD', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-slate-400">{expenses.length} Records Logged</span>
        </div>

        <div className="bg-white border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Paid</span>
            <div className="w-8 h-8 bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center text-lg">
              <BiCreditCard />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-blue-700 mt-2">
            ৳{grandPaid.toLocaleString('en-BD', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-blue-500 font-medium">Deducted from balance</span>
        </div>

        <div className="bg-white border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Due</span>
            <div className="w-8 h-8 bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center text-lg">
              <BiDollarCircle />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-rose-600 mt-2">
            ৳{grandDue.toLocaleString('en-BD', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-rose-500 font-medium">Outstanding Expense Dues</span>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white border border-slate-200 shadow-sm">
        {/* Search & Filter Bar */}
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <BiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base" />
            <input
              type="text"
              placeholder="Search expenses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:border-primary focus:outline-none transition"
            />
          </div>
          <span className="text-xs font-semibold text-slate-500">
            Showing {filteredExpenses.length} of {expenses.length} entries
          </span>
        </div>

        {/* Expenses Table */}
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4">Expense Title</th>
                <th className="py-3 px-4 hidden sm:table-cell">Category</th>
                <th className="py-3 px-4 hidden md:table-cell">Date</th>
                <th className="py-3 px-4 text-right">Total Amount</th>
                <th className="py-3 px-4 text-right hidden sm:table-cell">Paid</th>
                <th className="py-3 px-4 text-right hidden md:table-cell">Due</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Loading expense records...
                  </td>
                </tr>
              ) : filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No expense records found.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => {
                  const statusColors = {
                    completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                    partial: 'bg-amber-50 text-amber-700 border-amber-200',
                    pending: 'bg-rose-50 text-rose-700 border-rose-200'
                  }

                  return (
                    <tr key={exp.expense_id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800">{exp.title}</div>
                        <div className="text-[10px] text-slate-400 sm:hidden">
                          {exp.category} • {exp.expense_date ? new Date(exp.expense_date).toLocaleDateString() : ''}
                        </div>
                      </td>
                      <td className="py-3 px-4 hidden sm:table-cell">
                        <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-bold">
                          {exp.category || 'General'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 hidden md:table-cell">
                        {exp.expense_date ? new Date(exp.expense_date).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-800">
                        ৳{parseFloat(exp.total_amount || 0).toLocaleString('en-BD', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right text-emerald-600 font-semibold hidden sm:table-cell">
                        ৳{parseFloat(exp.paid_amount || 0).toLocaleString('en-BD', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right text-rose-600 font-semibold hidden md:table-cell">
                        ৳{parseFloat(exp.due_amount || 0).toLocaleString('en-BD', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-2.5 py-0.5 border text-[10px] font-bold capitalize ${statusColors[exp.status] || statusColors.pending}`}>
                          {exp.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right relative">
                        <button
                          onClick={() => setActiveMenuId(activeMenuId === exp.expense_id ? null : exp.expense_id)}
                          className="p-1.5 hover:bg-slate-200 text-slate-600 transition cursor-pointer"
                        >
                          <BiDotsVerticalRounded className="text-lg" />
                        </button>

                        {/* Dropdown Action Menu */}
                        {activeMenuId === exp.expense_id && (
                          <div className="absolute right-4 top-10 w-44 bg-white border border-slate-200 shadow-lg z-20 py-1 text-left">
                            <button
                              onClick={() => {
                                setDetailsExpense(exp)
                                setIsDetailsOpen(true)
                                setActiveMenuId(null)
                              }}
                              className="w-full px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 flex items-center gap-2"
                            >
                              <BiDetail className="text-slate-500" /> View Details
                            </button>

                            {parseFloat(exp.due_amount || 0) > 0 && (
                              <button
                                onClick={() => {
                                  setSelectedExpense(exp)
                                  setPayAmount(parseFloat(exp.due_amount).toString())
                                  setIsPaymentOpen(true)
                                  setActiveMenuId(null)
                                }}
                                className="w-full px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 flex items-center gap-2"
                              >
                                <BiCreditCard className="text-emerald-600" /> Record Payment
                              </button>
                            )}

                            <button
                              onClick={() => handleDeleteExpense(exp.expense_id)}
                              className="w-full px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 border-t border-slate-100"
                            >
                              <BiTrash className="text-rose-500" /> Delete Expense
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create New Expense Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <BiReceipt className="text-primary" /> Create New Expense
              </h2>
              <button onClick={() => setIsCreateOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                <BiX className="text-2xl" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Expense Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Office Electricity Bill"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 focus:bg-white focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 focus:bg-white focus:border-primary focus:outline-none"
                  >
                    <option value="General">General</option>
                    <option value="Utilities">Utilities</option>
                    <option value="Rent">Rent</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Supplies">Supplies</option>
                    <option value="Transport">Transport</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Expense Date</label>
                  <input
                    type="date"
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 focus:bg-white focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Total Expense Amount (৳) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 focus:bg-white focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Paid Amount Now (৳)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 focus:bg-white focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 focus:bg-white focus:border-primary focus:outline-none"
                >
                  <option value="cash">Cash</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="mobile_banking">Mobile Banking (bKash/Nagad)</option>
                  <option value="card">Card</option>
                </select>
              </div>

              {/* Line Items Section */}
              <div className="border border-slate-200 p-4 bg-slate-50/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Line Items (Optional)</span>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="px-2.5 py-1 bg-white border border-slate-200 text-slate-700 hover:border-primary hover:text-primary text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <BiPlus /> Add Item Row
                  </button>
                </div>

                <div className="space-y-2">
                  {items.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Item name"
                        value={item.item_name}
                        onChange={(e) => handleItemChange(index, 'item_name', e.target.value)}
                        className="flex-1 px-2.5 py-1.5 bg-white border border-slate-200 text-xs font-medium text-slate-800 focus:border-primary focus:outline-none"
                      />
                      <input
                        type="number"
                        min="1"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                        className="w-16 px-2.5 py-1.5 bg-white border border-slate-200 text-xs font-medium text-slate-800 focus:border-primary focus:outline-none"
                      />
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Unit Cost"
                        value={item.unit_cost}
                        onChange={(e) => handleItemChange(index, 'unit_cost', e.target.value)}
                        className="w-24 px-2.5 py-1.5 bg-white border border-slate-200 text-xs font-medium text-slate-800 focus:border-primary focus:outline-none"
                      />
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItemRow(index)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 transition cursor-pointer"
                        >
                          <BiX className="text-lg" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Notes / Description</label>
                <textarea
                  rows="2"
                  placeholder="Additional notes..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 focus:bg-white focus:border-primary focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-200 pt-4">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-primary hover:bg-primary-dark text-white text-xs font-bold cursor-pointer disabled:opacity-50 flex items-center gap-1"
                >
                  {isSubmitting ? 'Saving...' : 'Save Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {isPaymentOpen && selectedExpense && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <BiCreditCard className="text-emerald-600" /> Record Expense Payment
              </h2>
              <button onClick={() => setIsPaymentOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                <BiX className="text-2xl" />
              </button>
            </div>

            <form onSubmit={handleAddPayment} className="space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-200 text-xs space-y-1">
                <div className="font-bold text-slate-800">{selectedExpense.title}</div>
                <div className="flex justify-between text-slate-600">
                  <span>Total Amount: ৳{parseFloat(selectedExpense.total_amount).toFixed(2)}</span>
                  <span className="text-rose-600 font-bold">Due: ৳{parseFloat(selectedExpense.due_amount).toFixed(2)}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Payment Amount (৳) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 focus:bg-white focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Payment Method</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 focus:bg-white focus:border-primary focus:outline-none"
                >
                  <option value="cash">Cash</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="mobile_banking">Mobile Banking</option>
                  <option value="card">Card</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Payment Note</label>
                <input
                  type="text"
                  placeholder="Reference or note"
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 focus:bg-white focus:border-primary focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-200 pt-4">
                <button
                  type="button"
                  onClick={() => setIsPaymentOpen(false)}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Processing...' : 'Add Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Expense Details Modal */}
      {isDetailsOpen && detailsExpense && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 shadow-xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <BiDetail className="text-primary" /> Expense Details
              </h2>
              <button onClick={() => setIsDetailsOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                <BiX className="text-2xl" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="bg-slate-50 p-3 border border-slate-200 space-y-1">
                <div className="font-bold text-slate-800 text-sm">{detailsExpense.title}</div>
                <div className="text-slate-500">Category: {detailsExpense.category}</div>
                <div className="text-slate-500">Date: {detailsExpense.expense_date ? new Date(detailsExpense.expense_date).toLocaleDateString() : 'N/A'}</div>
                {detailsExpense.note && <div className="text-slate-600 italic mt-1">"{detailsExpense.note}"</div>}
              </div>

              {/* Line Items */}
              <div>
                <h4 className="font-bold text-slate-700 mb-1 uppercase tracking-wider text-[11px]">Line Items</h4>
                {detailsExpense.items && detailsExpense.items.length > 0 ? (
                  <div className="border border-slate-200 divide-y divide-slate-100">
                    {detailsExpense.items.map((it, idx) => (
                      <div key={idx} className="p-2 flex justify-between">
                        <span>{it.item_name} ({it.quantity} x ৳{parseFloat(it.unit_cost || 0).toFixed(2)})</span>
                        <span className="font-bold">৳{parseFloat(it.total_cost || 0).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-slate-400 italic">No line items specified.</div>
                )}
              </div>

              {/* Payments History */}
              <div>
                <h4 className="font-bold text-slate-700 mb-1 uppercase tracking-wider text-[11px]">Payment History</h4>
                {detailsExpense.payments && detailsExpense.payments.length > 0 ? (
                  <div className="border border-slate-200 divide-y divide-slate-100">
                    {detailsExpense.payments.map((pm, idx) => (
                      <div key={idx} className="p-2 flex justify-between text-slate-600">
                        <span>{new Date(pm.payment_date).toLocaleDateString()} via <span className="uppercase font-semibold">{pm.payment_method}</span></span>
                        <span className="font-bold text-emerald-600">৳{parseFloat(pm.amount || 0).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-slate-400 italic">No payments recorded yet.</div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end border-t border-slate-200 pt-4 mt-6">
              <button
                onClick={() => setIsDetailsOpen(false)}
                className="px-4 py-2 bg-slate-800 text-white text-xs font-bold hover:bg-slate-900 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

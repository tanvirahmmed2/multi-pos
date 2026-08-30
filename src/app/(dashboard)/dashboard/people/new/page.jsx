'use client'
import React, { useState, useEffect, useContext } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Context } from '@/component/helper/Context'
import { 
  BiArrowBack, 
  BiUser, 
  BiMailSend, 
  BiPhone, 
  BiLockAlt, 
  BiShieldQuarter, 
  BiStoreAlt,
  BiLoaderAlt,
  BiPlus
} from 'react-icons/bi'

export default function CreateNewUserPage() {
  const router = useRouter()
  const { dashSidebar } = useContext(Context)

  const [branches, setBranches] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'sales',
    branch_id: '',
    is_active: true,
    is_varified: true
  })

  useEffect(() => {
    axios.get('/api/branch')
      .then(res => setBranches(res.data))
      .catch(err => console.error('Failed to fetch branches:', err))
  }, [])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (submitting) return

    if (!formData.name.trim() || !formData.email.trim() || !formData.password) {
      toast.error('Name, email, and password are required')
      return
    }

    if (formData.role !== 'admin' && !formData.branch_id) {
      toast.error('Branch selection is required for non-admin staff roles')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setSubmitting(true)
    const toastId = toast.loading('Creating staff account...')

    try {
      const response = await axios.post('/api/people', {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        role: formData.role,
        branch_id: formData.branch_id || undefined,
        is_active: formData.is_active,
        is_varified: formData.is_varified
      })

      toast.success(response.data.message || 'Staff account created successfully!', { id: toastId })
      router.push('/dashboard/people')
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to create staff account'
      toast.error(errorMsg, { id: toastId })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={`w-full min-h-screen bg-slate-50 pt-20 pb-12 px-2 sm:px-4 md:px-8 transition-all duration-300 ${dashSidebar ? 'lg:pl-64' : 'lg:pl-8'}`}>
      <div className="w-full max-w-2xl mx-auto flex flex-col gap-6">
        
        <div className="flex items-center justify-between">
          <Link 
            href="/dashboard/people"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition"
          >
            <BiArrowBack className="text-base" /> Back to Staff Accounts
          </Link>
        </div>

        <div className="bg-white border border-slate-200 shadow-sm p-6 md:p-8 rounded-2xl">
          <div className="flex items-center gap-3 pb-6 border-b border-slate-100 mb-6">
            <div className="w-12 h-12 rounded-xl text-white flex items-center justify-center text-2xl font-bold shadow-sm bg-primary">
              <BiUser />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold text-slate-800">Create Staff Account</h1>
              <p className="text-slate-500 text-xs mt-0.5">Create staff accounts for any role. Non-admin roles require an assigned branch.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <BiUser className="text-sm" /> Full Name *
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                placeholder="e.g. John Doe"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 outline-none focus:border-slate-400 rounded-xl transition"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <BiMailSend className="text-sm" /> Email Address *
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="e.g. staff@disibin.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 outline-none focus:border-slate-400 rounded-xl transition"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="phone" className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <BiPhone className="text-sm" /> Phone Number
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="text"
                  placeholder="e.g. +8801700000000"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 outline-none focus:border-slate-400 rounded-xl transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="role" className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <BiShieldQuarter className="text-sm" /> System Role *
                </label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 outline-none focus:border-slate-400 rounded-xl cursor-pointer transition"
                >
                  <option value="admin">Admin (Global System Privilege)</option>
                  <option value="manager">Manager (Branch Inventory & Sales)</option>
                  <option value="sales">Sales (POS & Cashier Terminal)</option>
                  <option value="staff">Staff (General Staff Member)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="branch_id" className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <BiStoreAlt className="text-sm" /> Assigned Branch {formData.role !== 'admin' ? '*' : '(Optional for Admin)'}
                </label>
                <select
                  id="branch_id"
                  name="branch_id"
                  required={formData.role !== 'admin'}
                  value={formData.branch_id}
                  onChange={handleChange}
                  className={`w-full px-3.5 py-2.5 bg-slate-50 border text-xs font-bold outline-none rounded-xl cursor-pointer transition ${
                    formData.role !== 'admin' && !formData.branch_id
                      ? 'border-rose-300 text-slate-800'
                      : 'border-slate-200 text-slate-800'
                  }`}
                >
                  <option value="">
                    {formData.role === 'admin' ? '-- No Specific Branch (Global Admin) --' : '-- Select Branch * --'}
                  </option>
                  {branches.map((b) => (
                    <option key={b.branch_id} value={b.branch_id}>
                      {b.name} ({b.code || `ID: ${b.branch_id}`}){!b.is_active ? ' [Inactive]' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <BiLockAlt className="text-sm" /> Password *
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 outline-none focus:border-slate-400 rounded-xl transition"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="confirmPassword" className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <BiLockAlt className="text-sm" /> Confirm Password *
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 outline-none focus:border-slate-400 rounded-xl transition"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6 pt-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                  className="w-4 h-4 accent-slate-900 rounded cursor-pointer"
                />
                Active Account
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                <input
                  type="checkbox"
                  name="is_varified"
                  checked={formData.is_varified}
                  onChange={handleChange}
                  className="w-4 h-4 accent-slate-900 rounded cursor-pointer"
                />
                Email Verified
              </label>
            </div>

            <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 mt-2">
              <Link
                href="/dashboard/people"
                className="px-5 py-2.5 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-100 transition"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50 hover:bg-primary-dark bg-primary"
              >
                {submitting ? (
                  <>
                    <BiLoaderAlt className="animate-spin text-base" /> Creating...
                  </>
                ) : (
                  <>
                    <BiPlus className="text-lg" /> Create Staff Account
                  </>
                )}
              </button>
            </div>

          </form>
        </div>

      </div>
    </div>
  )
}

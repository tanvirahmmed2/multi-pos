'use client'
import React, { useState, useContext } from 'react'
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
  BiCheckCircle,
  BiLoaderAlt,
  BiPlus
} from 'react-icons/bi'

export default function CreateNewUserPage() {
  const router = useRouter()
  const { dashSidebar, website } = useContext(Context)
  const themeColor = website?.theme_color || '#73976A'

  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'sales',
    is_active: true,
    is_varified: true
  })

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

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setSubmitting(true)
    const toastId = toast.loading('Creating user account...')

    try {
      const response = await axios.post('/api/people', {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        role: formData.role,
        is_active: formData.is_active,
        is_varified: formData.is_varified
      })

      toast.success(response.data.message || 'User created successfully!', { id: toastId })
      router.push('/dashboard/admin/people')
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to create user'
      toast.error(errorMsg, { id: toastId })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={`w-full min-h-screen bg-slate-50 pt-20 pb-12 px-2 sm:px-4 md:px-8 transition-all duration-300 ${dashSidebar ? 'lg:pl-64' : 'lg:pl-8'}`}>
      <div className="w-full max-w-2xl mx-auto flex flex-col gap-6">
        
        {/* Back navigation & header */}
        <div className="flex items-center justify-between">
          <Link 
            href="/dashboard/admin/people"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition"
          >
            <BiArrowBack className="text-base" /> Back to Accounts
          </Link>
        </div>

        {/* Card Form */}
        <div className="bg-white border border-slate-200 shadow-sm p-6 md:p-8 rounded-2xl">
          <div className="flex items-center gap-3 pb-6 border-b border-slate-100 mb-6">
            <div className="w-12 h-12 rounded-xl text-white flex items-center justify-center text-2xl font-bold shadow-sm" style={{ backgroundColor: themeColor }}>
              <BiUser />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold text-slate-800">Create Staff / User Account</h1>
              <p className="text-slate-500 text-xs mt-0.5">Add a new user directly to the POS system with designated access permissions.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Full Name */}
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

            {/* Email & Phone */}
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

            {/* Role Selection */}
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
                <option value="sales">Sales (Billing & Desk Terminal Access)</option>
                <option value="manager">Manager (Inventory, Reports & Catalog Control)</option>
                <option value="admin">Administrator (Full System Privilege)</option>
                <option value="user">User (Standard Account)</option>
              </select>
            </div>

            {/* Password & Confirm Password */}
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

            {/* Checkbox Toggles */}
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

            {/* Submit Button */}
            <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 mt-2">
              <Link
                href="/dashboard/admin/people"
                className="px-5 py-2.5 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-100 transition"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                style={{ backgroundColor: themeColor }}
              >
                {submitting ? (
                  <>
                    <BiLoaderAlt className="animate-spin text-base" /> Creating...
                  </>
                ) : (
                  <>
                    <BiPlus className="text-lg" /> Create User Account
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

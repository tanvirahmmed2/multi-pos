'use client'
import React, { useState, useEffect, useContext } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Context } from '@/component/helper/Context'
import { 
  BiUser, 
  BiMailSend, 
  BiPhone, 
  BiLockAlt, 
  BiShieldQuarter, 
  BiCheckCircle,
  BiLoaderAlt,
  BiSave,
  BiCalendar,
  BiBadgeCheck
} from 'react-icons/bi'

export default function UserProfilePage() {
  const { dashSidebar, user, setUser, website, loading: contextLoading } = useContext(Context)
  const themeColor = website?.theme_color || '#73976A'

  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  })

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || ''
      }))
    }
  }, [user])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (submitting) return

    if (!formData.name.trim() || !formData.email.trim()) {
      toast.error('Name and email address are required')
      return
    }

    if (formData.newPassword) {
      if (!formData.currentPassword) {
        toast.error('Please enter your current password to change your password')
        return
      }
      if (formData.newPassword !== formData.confirmNewPassword) {
        toast.error('New passwords do not match')
        return
      }
    }

    setSubmitting(true)
    const toastId = toast.loading('Updating profile...')

    try {
      const response = await axios.put('/api/user', {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        currentPassword: formData.currentPassword || undefined,
        newPassword: formData.newPassword || undefined
      })

      toast.success(response.data.message || 'Profile updated successfully!', { id: toastId })
      if (response.data.user) {
        setUser(response.data.user)
      }
      setFormData((prev) => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: ''
      }))
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to update profile'
      toast.error(errorMsg, { id: toastId })
    } finally {
      setSubmitting(false)
    }
  }

  if (contextLoading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-2">
          <BiLoaderAlt className="animate-spin text-4xl text-slate-800" />
          <p className="text-slate-600 text-sm font-semibold animate-pulse">Loading profile...</p>
        </div>
      </div>
    )
  }

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : 'US'

  return (
    <div className={`w-full min-h-screen bg-slate-50 pt-20 pb-12 px-2 sm:px-4 md:px-8 transition-all duration-300 ${dashSidebar ? 'lg:pl-64' : 'lg:pl-8'}`}>
      <div className="w-full max-w-4xl mx-auto flex flex-col gap-6">
        
        {/* Header */}
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-800 flex items-center gap-2">
            <BiUser style={{ color: themeColor }} />
            Account Profile Settings
          </h1>
          <p className="text-slate-500 text-xs md:text-sm mt-0.5">Manage your personal account information and login security credentials.</p>
        </div>

        {/* Profile Card Banner */}
        <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl text-white text-xl font-bold flex items-center justify-center shadow-md shrink-0" style={{ backgroundColor: themeColor }}>
              {initials}
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold text-slate-800">{user?.name}</h2>
              <p className="text-xs text-slate-500 font-mono mt-0.5">{user?.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="px-2.5 py-0.5 text-[10px] md:text-xs font-bold uppercase rounded-full border" style={{ color: themeColor, borderColor: themeColor + '40', backgroundColor: themeColor + '10' }}>
                  {user?.role || 'Staff'}
                </span>
                {user?.is_varified && (
                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full flex items-center gap-1">
                    <BiBadgeCheck className="text-xs" /> Verified
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 border-t md:border-t-0 md:border-l border-slate-200 pt-4 md:pt-0 md:pl-6 text-xs text-slate-600 font-medium">
            <div className="flex items-center gap-2">
              <BiPhone className="text-slate-400 text-sm" />
              <span className="font-bold text-slate-800">Phone:</span> {user?.phone || 'Not set'}
            </div>
            <div className="flex items-center gap-2">
              <BiCalendar className="text-slate-400 text-sm" />
              <span className="font-bold text-slate-800">Joined:</span> {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          
          {/* Personal Information */}
          <div className="bg-white border border-slate-200 shadow-sm p-6 md:p-8 rounded-2xl flex flex-col gap-5">
            <div className="pb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800">Personal Information</h3>
              <p className="text-slate-500 text-xs mt-0.5">Update your display name, contact email, and phone number.</p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <BiUser className="text-sm" /> Full Name *
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
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
                  placeholder="+8801700000000"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 outline-none focus:border-slate-400 rounded-xl transition"
                />
              </div>
            </div>
          </div>

          {/* Change Password */}
          <div className="bg-white border border-slate-200 shadow-sm p-6 md:p-8 rounded-2xl flex flex-col gap-5">
            <div className="pb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800">Security & Password</h3>
              <p className="text-slate-500 text-xs mt-0.5">Leave password fields blank if you do not wish to change your password.</p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="currentPassword" className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <BiLockAlt className="text-sm" /> Current Password
              </label>
              <input
                id="currentPassword"
                name="currentPassword"
                type="password"
                placeholder="Required only if setting a new password"
                value={formData.currentPassword}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 outline-none focus:border-slate-400 rounded-xl transition"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="newPassword" className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <BiLockAlt className="text-sm" /> New Password
                </label>
                <input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  placeholder="New password"
                  value={formData.newPassword}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 outline-none focus:border-slate-400 rounded-xl transition"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="confirmNewPassword" className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <BiLockAlt className="text-sm" /> Confirm New Password
                </label>
                <input
                  id="confirmNewPassword"
                  name="confirmNewPassword"
                  type="password"
                  placeholder="Confirm new password"
                  value={formData.confirmNewPassword}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 outline-none focus:border-slate-400 rounded-xl transition"
                />
              </div>
            </div>
          </div>

          {/* Submit button */}
          <div className="flex items-center justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="px-8 py-3 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50 hover:opacity-95"
              style={{ backgroundColor: themeColor }}
            >
              {submitting ? (
                <>
                  <BiLoaderAlt className="animate-spin text-lg" /> Saving Changes...
                </>
              ) : (
                <>
                  <BiSave className="text-lg" /> Save Profile Changes
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  )
}

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
  BiBadgeCheck,
  BiShieldAlt2,
  BiX,
  BiLaptop,
  BiMobileAlt,
  BiLogOut
} from 'react-icons/bi'

export default function UserProfilePage() {
  const { dashSidebar, user, setUser, setStaff, loading: contextLoading } = useContext(Context)

  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  })

  // 2FA state
  const [show2faModal, setShow2faModal] = useState(false)
  const [twoFaAction, setTwoFaAction] = useState(true) // true = enabling 2fa, false = disabling
  const [twoFaCode, setTwoFaCode] = useState('')
  const [sending2fa, setSending2fa] = useState(false)
  const [verifying2fa, setVerifying2fa] = useState(false)

  // Sessions state
  const [sessions, setSessions] = useState([])
  const [loadingSessions, setLoadingSessions] = useState(true)
  const [revokingSession, setRevokingSession] = useState(false)

  const fetchSessions = async () => {
    try {
      setLoadingSessions(true)
      const res = await axios.get('/api/staff/sessions')
      const sessList = Array.isArray(res.data.sessions) ? res.data.sessions : []
      setSessions(sessList)

      if (sessList.length === 0) {
        toast.error('No active session found. Automatically logging out...')
        if (setStaff) setStaff(null)
        if (setUser) setUser(null)
        window.location.replace('/')
      }
    } catch (err) {
      console.error('Failed to load active sessions:', err)
      if (err.response?.status === 401) {
        toast.error('Session expired or logged out. Redirecting to login...')
        if (setStaff) setStaff(null)
        if (setUser) setUser(null)
        window.location.replace('/')
      }
    } finally {
      setLoadingSessions(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchSessions()
    }
  }, [user])

  const handleRevokeSession = async (sessionId) => {
    if (revokingSession) return
    setRevokingSession(true)
    const toastId = toast.loading('Logging out device...')

    try {
      const res = await axios.delete(`/api/staff/sessions/${sessionId}`)
      toast.success(res.data.message || 'Device session logged out successfully', { id: toastId })

      if (res.data.is_current_device) {
        window.location.replace('/')
        return
      }

      setSessions(prev => prev.filter(s => s.session_id !== sessionId))
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to revoke device session', { id: toastId })
    } finally {
      setRevokingSession(false)
    }
  }

  const handleRevokeAllOtherSessions = async () => {
    if (revokingSession) return
    setRevokingSession(true)
    const toastId = toast.loading('Logging out all other devices...')

    try {
      const res = await axios.delete('/api/staff/sessions')
      toast.success(res.data.message || 'Logged out from all other devices', { id: toastId })
      setSessions(prev => prev.filter(s => s.is_current_device))
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to log out other devices', { id: toastId })
    } finally {
      setRevokingSession(false)
    }
  }

  const getDeviceLabel = (ua) => {
    if (!ua) return { label: 'Unknown Device', isMobile: false }
    const lower = ua.toLowerCase()
    if (lower.includes('mobile') || lower.includes('android') || lower.includes('iphone')) {
      let browser = 'Mobile Browser'
      if (lower.includes('chrome')) browser = 'Chrome Mobile'
      else if (lower.includes('safari')) browser = 'Safari Mobile'
      else if (lower.includes('firefox')) browser = 'Firefox Mobile'
      return { label: browser, isMobile: true }
    } else {
      let browser = 'Desktop Browser'
      if (lower.includes('chrome')) browser = 'Chrome on Desktop'
      else if (lower.includes('firefox')) browser = 'Firefox on Desktop'
      else if (lower.includes('safari')) browser = 'Safari on Mac'
      else if (lower.includes('edg')) browser = 'Edge on Desktop'
      return { label: browser, isMobile: false }
    }
  }

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

  const handleRequest2fa = async (enable) => {
    if (sending2fa) return
    setSending2fa(true)
    const toastId = toast.loading('Sending verification code to your email...')

    try {
      await axios.post('/api/staff/2fa/send')
      toast.success('Verification code sent to your email address!', { id: toastId })
      setTwoFaAction(enable)
      setTwoFaCode('')
      setShow2faModal(true)
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to send 2FA verification code'
      toast.error(errorMsg, { id: toastId })
    } finally {
      setSending2fa(false)
    }
  }

  const handleVerify2fa = async (e) => {
    e.preventDefault()
    if (!twoFaCode.trim()) {
      toast.error('Please enter the 6-digit verification code')
      return
    }
    if (verifying2fa) return

    setVerifying2fa(true)
    const toastId = toast.loading('Verifying code...')

    try {
      const res = await axios.post('/api/staff/2fa/verify', {
        code: twoFaCode.trim(),
        enable: twoFaAction
      })

      toast.success(res.data.message || '2FA setting updated successfully!', { id: toastId })
      const updatedStaff = res.data.staff || res.data.user
      if (updatedStaff) {
        if (setStaff) setStaff(updatedStaff)
        if (setUser) setUser(updatedStaff)
      }

      setShow2faModal(false)
      setTwoFaCode('')
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Verification failed. Please check code and try again.'
      toast.error(errorMsg, { id: toastId })
    } finally {
      setVerifying2fa(false)
    }
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
      const response = await axios.put('/api/staff', {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        currentPassword: formData.currentPassword || undefined,
        newPassword: formData.newPassword || undefined
      })

      toast.success(response.data.message || 'Profile updated successfully!', { id: toastId })
      const updatedStaff = response.data.staff || response.data.user;
      if (updatedStaff) {
        if (setStaff) setStaff(updatedStaff)
        else if (setUser) setUser(updatedStaff)
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

  const is2faActive = user?.['2fa_active'] === true

  return (
    <div className={`w-full min-h-screen bg-slate-50 pt-20 pb-12 px-2 sm:px-4 md:px-8 transition-all duration-300 ${dashSidebar ? 'lg:pl-64' : 'lg:pl-8'}`}>
      <div className="w-full flex flex-col gap-6">
        
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-800 flex items-center gap-2">
            <BiUser className="text-primary" />
            Account Profile Settings
          </h1>
          <p className="text-slate-500 text-xs md:text-sm mt-0.5">Manage your personal account information and login security credentials.</p>
        </div>

        <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl text-white text-xl font-bold flex items-center justify-center shadow-md shrink-0 bg-primary">
              {initials}
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold text-slate-800">{user?.name}</h2>
              <p className="text-xs text-slate-500 font-mono mt-0.5">{user?.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="px-2.5 py-0.5 text-[10px] md:text-xs font-bold uppercase rounded-full border text-primary border-primary/40 bg-primary/10">
                  {user?.role || 'Staff'}
                </span>
                {user?.is_varified && (
                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full flex items-center gap-1">
                    <BiBadgeCheck className="text-xs" /> Verified
                  </span>
                )}
                {is2faActive && (
                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-blue-50 text-blue-700 border border-blue-200 rounded-full flex items-center gap-1">
                    <BiShieldAlt2 className="text-xs" /> 2FA Active
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

        {/* Two-Factor Authentication (2FA) Card */}
        <div className="bg-white border border-slate-200 shadow-sm p-6 md:p-8 rounded-2xl flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <BiShieldQuarter className="text-lg text-slate-800" />
                <h3 className="text-base font-bold text-slate-800">Two-Factor Authentication (2FA)</h3>
              </div>
              <p className="text-slate-500 text-xs mt-1">
                Protect your staff account by requiring a 6-digit verification code sent via email whenever you log in.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 text-xs font-bold uppercase rounded-full border ${
                is2faActive 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}>
                {is2faActive ? '● 2FA Enabled' : '○ 2FA Disabled'}
              </span>

              {is2faActive ? (
                <button
                  type="button"
                  disabled={sending2fa}
                  onClick={() => handleRequest2fa(false)}
                  className="px-4 py-2 border border-rose-200 text-rose-600 bg-rose-50 hover:bg-rose-100 text-xs font-bold rounded-xl transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {sending2fa ? <BiLoaderAlt className="animate-spin text-sm" /> : null}
                  Disable 2FA
                </button>
              ) : (
                <button
                  type="button"
                  disabled={sending2fa}
                  onClick={() => handleRequest2fa(true)}
                  className="px-4 py-2 text-white bg-slate-900 hover:bg-slate-800 text-xs font-bold rounded-xl shadow-xs transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {sending2fa ? <BiLoaderAlt className="animate-spin text-sm" /> : null}
                  Enable 2FA Verification
                </button>
              )}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          
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

          <div className="flex items-center justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="px-8 py-3 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50 hover:bg-primary-dark bg-primary"
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

        {/* Logged-in Devices & Active Sessions Card */}
        <div className="bg-white border border-slate-200 shadow-sm p-6 md:p-8 rounded-2xl flex flex-col gap-5 mt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <BiLaptop className="text-xl text-slate-800" />
                <h3 className="text-base font-bold text-slate-800">Logged-in Devices & Active Sessions</h3>
              </div>
              <p className="text-slate-500 text-xs mt-0.5">
                Manage all devices and browser sessions where your staff account is currently signed in.
              </p>
            </div>

            {sessions.filter(s => !s.is_current_device).length > 0 && (
              <button
                type="button"
                disabled={revokingSession}
                onClick={handleRevokeAllOtherSessions}
                className="px-4 py-2 border border-rose-200 text-rose-600 bg-rose-50 hover:bg-rose-100 text-xs font-bold rounded-xl transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shrink-0"
              >
                <BiLogOut className="text-sm" />
                Log Out All Other Devices
              </button>
            )}
          </div>

          {loadingSessions ? (
            <div className="flex items-center justify-center py-8 text-slate-400 gap-2 text-xs font-medium">
              <BiLoaderAlt className="animate-spin text-lg text-slate-700" /> Loading active device sessions...
            </div>
          ) : sessions.length > 0 ? (
            <div className="flex flex-col divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
              {sessions.map((sess) => {
                const devInfo = getDeviceLabel(sess.user_agent)
                return (
                  <div key={sess.session_id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 transition">
                    <div className="flex items-center gap-3.5">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${
                        sess.is_current_device ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {devInfo.isMobile ? <BiMobileAlt /> : <BiLaptop />}
                      </div>

                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-800">{devInfo.label}</span>
                          {sess.is_current_device && (
                            <span className="px-2 py-0.5 text-[9px] font-extrabold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                              ● Current Device
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                          IP: {sess.ip_address || 'Unknown'} • Last Active: {sess.last_active ? new Date(sess.last_active).toLocaleString('en-GB') : 'Just now'}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={revokingSession}
                      onClick={() => handleRevokeSession(sess.session_id)}
                      className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer shrink-0 flex items-center gap-1 ${
                        sess.is_current_device
                          ? 'border border-slate-200 text-slate-600 hover:bg-slate-100'
                          : 'border border-rose-200 text-rose-600 bg-rose-50 hover:bg-rose-100'
                      }`}
                    >
                      <BiLogOut className="text-xs" />
                      {sess.is_current_device ? 'Sign Out This Device' : 'Log Out Device'}
                    </button>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-xs text-slate-400 text-center py-6">No active session history found.</p>
          )}
        </div>

      </div>

      {/* 2FA Verification Modal */}
      {show2faModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-4 animate-in fade-in duration-150">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <BiShieldQuarter className="text-xl text-primary" />
                <h3 className="font-bold text-slate-900 text-sm">
                  {twoFaAction ? 'Confirm Enable 2FA' : 'Confirm Disable 2FA'}
                </h3>
              </div>
              <button 
                onClick={() => setShow2faModal(false)}
                className="text-slate-400 hover:text-slate-700 transition cursor-pointer p-1 rounded-lg"
              >
                <BiX className="text-xl" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              A 6-digit security code has been sent to your registered email address (<span className="font-bold font-mono text-slate-800">{user?.email}</span>).
            </p>

            <form onSubmit={handleVerify2fa} className="flex flex-col gap-4 mt-1">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Enter 6-Digit Email Code *
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  autoFocus
                  placeholder="123456"
                  value={twoFaCode}
                  onChange={(e) => setTwoFaCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full text-center tracking-[0.5em] text-xl font-mono font-bold py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-primary transition text-slate-900"
                />
              </div>

              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  disabled={sending2fa}
                  onClick={() => handleRequest2fa(twoFaAction)}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 transition cursor-pointer underline"
                >
                  Resend Code
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShow2faModal(false)}
                    className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold rounded-xl transition cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={verifying2fa || twoFaCode.length < 6}
                    className="px-5 py-2 text-white bg-primary hover:bg-primary-dark text-xs font-bold rounded-xl shadow-xs transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {verifying2fa ? <BiLoaderAlt className="animate-spin text-sm" /> : null}
                    Verify & Save
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}

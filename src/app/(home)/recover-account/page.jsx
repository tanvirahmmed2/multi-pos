'use client'
import React, { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import axios from 'axios'
import toast from 'react-hot-toast'
import { FiMail, FiLock, FiKey } from 'react-icons/fi'

const RecoverAccountForm = () => {
    const searchParams = useSearchParams()
    const router = useRouter()
    const token = searchParams.get('token')

    const [email, setEmail] = useState('')
    
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')

    const [submitting, setSubmitting] = useState(false)
    const [status, setStatus] = useState('idle') 
    const [message, setMessage] = useState('')

    const handleRequestLink = async (e) => {
        e.preventDefault()
        if (submitting) return

        setSubmitting(true)
        const toastId = toast.loading('Sending reset link...')

        try {
            const response = await axios.post('/api/staff/recover-account', { email })
            setStatus('success')
            setMessage(response.data.message || 'Recovery email sent.')
            toast.success(response.data.message || 'Recovery link sent!', { id: toastId })
            setEmail('')
        } catch (error) {
            const errorMsg = error.response?.data?.error || 'Failed to send recovery link. Please try again.'
            toast.error(errorMsg, { id: toastId })
        } finally {
            setSubmitting(false)
        }
    }

    const handleResetPassword = async (e) => {
        e.preventDefault()
        if (submitting) return

        if (password !== confirmPassword) {
            toast.error('Passwords do not match!')
            return
        }

        setSubmitting(true)
        const toastId = toast.loading('Resetting password...')

        try {
            const response = await axios.put('/api/staff/recover-account', { token, password })
            setStatus('success')
            setMessage(response.data.message || 'Password reset successful.')
            toast.success(response.data.message || 'Password reset successful!', { id: toastId })
            
            setTimeout(() => {
                router.push('/')
            }, 3000)
        } catch (error) {
            const errorMsg = error.response?.data?.error || 'Failed to reset password. Link may be invalid or expired.'
            toast.error(errorMsg, { id: toastId })
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div suppressHydrationWarning className='w-full max-w-md flex flex-col gap-4 shadow-xl shadow-slate-100/40 border border-slate-100 p-8 md:p-10 rounded-2xl bg-white relative z-10 animate-fade-in'>
            <div className='flex flex-col items-center text-center mb-2'>
                <h2 className='text-2xl font-black text-secondary tracking-tight'>
                    {token ? 'Reset Password' : 'Recover Account'}
                </h2>
                <p className='text-xs text-slate-500 mt-1 font-semibold'>
                    {token ? 'Enter and confirm your new password below' : 'Enter your email to receive a password recovery link'}
                </p>
            </div>

            {status === 'success' && (
                <div className='p-4 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-center text-sm font-medium'>
                    {message}
                    {token && <div className='mt-2 text-xs text-emerald-600 font-bold'>Redirecting to login page in 3 seconds...</div>}
                </div>
            )}

            {token ? (
                <form onSubmit={handleResetPassword} suppressHydrationWarning className='flex flex-col gap-4'>
                    <div className='w-full flex flex-col gap-1.5'>
                        <label htmlFor="password" className='text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5'>
                            <FiLock className="w-3.5 h-3.5" /> New Password
                        </label>
                        <input className="input-style" 
                            type="password" 
                            required 
                            onChange={(e) => setPassword(e.target.value)} 
                            value={password} 
                            id="password" 
                        />
                    </div>

                    <div className='w-full flex flex-col gap-1.5'>
                        <label htmlFor="confirmPassword" className='text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5'>
                            <FiKey className="w-3.5 h-3.5" /> Confirm New Password
                        </label>
                        <input className="input-style" 
                            type="password" 
                            required 
                            onChange={(e) => setConfirmPassword(e.target.value)} 
                            value={confirmPassword} 
                            id="confirmPassword" 
                        />
                    </div>

                    <button 
                        type='submit' 
                        disabled={submitting || !password || !confirmPassword}
                        className={`w-full mt-4 bg-primary hover:bg-primary-light text-white font-bold text-sm py-3.5 rounded-xl cursor-pointer transition shadow-lg shadow-primary/15 hover:scale-[1.01] active:scale-[0.99] ${submitting || !password || !confirmPassword ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {submitting ? 'Resetting...' : 'Reset Password'}
                    </button>
                </form>
            ) : (
                <form onSubmit={handleRequestLink} suppressHydrationWarning className='flex flex-col gap-4'>
                    <div className='w-full flex flex-col gap-1.5'>
                        <label htmlFor="email" className='text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5'>
                            <FiMail className="w-3.5 h-3.5" /> Email Address
                        </label>
                        <input className="input-style" 
                            type="email" 
                            required 
                            onChange={(e) => setEmail(e.target.value)} 
                            value={email} 
                            id="email" 
                        />
                    </div>

                    <button 
                        type='submit' 
                        disabled={submitting || !email}
                        className={`w-full mt-4 bg-primary hover:bg-primary-light text-white font-bold text-sm py-3.5 rounded-xl cursor-pointer transition shadow-lg shadow-primary/15 hover:scale-[1.01] active:scale-[0.99] ${submitting || !email ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {submitting ? 'Sending...' : 'Send Recovery Link'}
                    </button>
                </form>
            )}

            <div className='text-center text-xs mt-3 flex justify-between items-center px-1 font-bold'>
                <Link href={'/'} className='text-primary hover:text-primary-light hover:underline transition'>Back to Login</Link>
                <Link href={'/register'} className='text-slate-450 hover:text-slate-600 hover:underline transition'>Create account</Link>
            </div>
        </div>
    )
}

const RecoverAccountPage = () => {
  return (
    <div className='w-full min-h-screen flex items-center justify-center bg-slate-50 p-4 relative overflow-hidden'>
      <Suspense fallback={<div className="text-slate-600 font-medium">Loading recovery form...</div>}>
        <RecoverAccountForm />
      </Suspense>
    </div>
  )
}

export default RecoverAccountPage

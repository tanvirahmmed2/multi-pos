'use client'
import Link from 'next/link'
import React, { useState, useContext } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Context } from '../helper/Context'
import { FiLock, FiMail, FiShield } from 'react-icons/fi'
import { STORE_NAME, STORE_TAGLINE } from '@/lib/secret'

const LoginForm = () => {
    const router = useRouter()
    const { setStaff, setUser } = useContext(Context)
    const [submitting, setSubmitting] = useState(false)
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    })

    // 2FA login state
    const [require2FA, setRequire2FA] = useState(false)
    const [userEmailFor2FA, setUserEmailFor2FA] = useState('')
    const [otpCode, setOtpCode] = useState('')

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData((data) => ({ ...data, [name]: value }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (submitting) return

        setSubmitting(true)
        const toastId = toast.loading('Logging in...')

        try {
            const response = await axios.post('/api/staff/login', formData)

            if (response.data.require_2fa) {
                toast.success(response.data.message || 'Verification code sent to your email!', { id: toastId })
                setRequire2FA(true)
                setUserEmailFor2FA(response.data.email || formData.email)
                setSubmitting(false)
                return
            }

            toast.success(response.data.message || 'Logged in successfully!', { id: toastId })
            
            const activeStaff = response.data.staff || response.data.user;
            if (activeStaff) {
                if (setStaff) setStaff(activeStaff);
                if (setUser) setUser(activeStaff);
            }

            window.location.replace('/dashboard')
        } catch (error) {
            const errorMessage = error.response?.data?.error || 'Failed to login. Please try again.'
            toast.error(errorMessage, { id: toastId })
        } finally {
            setSubmitting(false)
        }
    }

    const handleVerify2FA = async (e) => {
        e.preventDefault()
        if (!otpCode.trim()) {
            toast.error('Please enter the 6-digit verification code')
            return
        }
        if (submitting) return

        setSubmitting(true)
        const toastId = toast.loading('Verifying 2FA code...')

        try {
            const response = await axios.post('/api/staff/login/verify-2fa', {
                email: userEmailFor2FA,
                code: otpCode.trim()
            })

            toast.success(response.data.message || '2FA verification successful!', { id: toastId })

            const activeStaff = response.data.staff || response.data.user;
            if (activeStaff) {
                if (setStaff) setStaff(activeStaff);
                if (setUser) setUser(activeStaff);
            }

            window.location.replace('/dashboard')
        } catch (error) {
            const errorMessage = error.response?.data?.error || 'Invalid or expired 2FA code. Please try again.'
            toast.error(errorMessage, { id: toastId })
        } finally {
            setSubmitting(false)
        }
    }

    const handleResend2FA = async () => {
        if (submitting) return
        setSubmitting(true)
        const toastId = toast.loading('Resending verification code...')
        try {
            const response = await axios.post('/api/staff/login', formData)
            toast.success(response.data.message || 'New verification code sent to your email!', { id: toastId })
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to resend code', { id: toastId })
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className='w-full flex flex-col items-center justify-center min-h-screen p-4 relative overflow-hidden'>
          
            {require2FA ? (
                <form onSubmit={handleVerify2FA} className='w-full max-w-md flex flex-col gap-4 shadow-xl shadow-slate-100/40 border border-slate-100 p-8 md:p-10 rounded-3xl bg-white relative z-10 animate-fade-in'>
                    <div className='flex flex-col items-center text-center mb-4'>
                        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary text-xl mb-2">
                            <FiShield />
                        </div>
                        <h2 className='text-secondary font-semibold tracking-tight'>Two-Factor Authentication</h2>
                        <h1 className='text-2xl font-semibold'>{STORE_NAME}</h1>
                        <p className='text-xs text-slate-500 mt-1 font-semibold'>
                            Enter the 6-digit code sent to <span className="text-slate-800 font-bold">{userEmailFor2FA}</span>
                        </p>
                    </div>

                    <div className='w-full flex flex-col gap-1.5'>
                        <label htmlFor="otpCode" className='text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5'>
                            <FiShield className="w-3.5 h-3.5" /> 6-Digit Email Verification Code
                        </label>
                        <input 
                            type="text" 
                            id='otpCode'
                            name='otpCode'
                            maxLength={6}
                            required
                            autoFocus
                            placeholder="123456"
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                            className="w-full text-center tracking-[0.5em] text-xl font-mono font-bold py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-primary transition text-slate-900"
                        />
                    </div>

                    <div className="flex justify-between items-center text-xs font-bold mt-1">
                        <button
                            type="button"
                            onClick={() => {
                                setRequire2FA(false)
                                setOtpCode('')
                            }}
                            className="text-slate-400 hover:text-slate-700 transition cursor-pointer"
                        >
                            ← Back to Password Login
                        </button>
                        <button
                            type="button"
                            onClick={handleResend2FA}
                            disabled={submitting}
                            className="text-primary hover:underline cursor-pointer disabled:opacity-50"
                        >
                            Resend Code
                        </button>
                    </div>

                    <button 
                        type='submit' 
                        disabled={submitting || otpCode.length < 6}
                        className={`w-full mt-4 bg-primary hover:bg-primary-light text-white font-bold text-sm py-3.5 rounded-xl cursor-pointer transition shadow-lg shadow-primary/15 hover:scale-[1.01] active:scale-[0.99] ${submitting || otpCode.length < 6 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {submitting ? 'Verifying...' : 'Verify & Complete Login'}
                    </button>
                </form>
            ) : (
                <form onSubmit={handleSubmit} className='w-full max-w-md flex flex-col gap-4 shadow-xl shadow-slate-100/40 border border-slate-100 p-8 md:p-10 rounded-3xl bg-white relative z-10 animate-fade-in'>
                    <div className='flex flex-col items-center text-center mb-4'>
                       
                        <h2 className='  text-secondary font-semibold tracking-tight'>Welcome Back</h2>
                        <h1  className='text-2xl font-semibold'>{STORE_NAME}</h1>
                        <p className='text-xs text-slate-500 mt-1 font-semibold'>Access your secure dashboard</p>
                    </div>
                    
                    <div className='w-full flex flex-col gap-1.5'>
                        <label htmlFor="email" className='text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5'>
                            <FiMail className="w-3.5 h-3.5" /> Email Address
                        </label>
                        <input className="input-style" 
                            type="email" 
                            required 
                            onChange={handleChange} 
                            value={formData.email} 
                            name='email' 
                            id='email' 
                        />
                    </div>
                    
                    <div className='w-full flex flex-col gap-1.5'>
                        <label htmlFor="password" className='text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5'>
                            <FiLock className="w-3.5 h-3.5" /> Password
                        </label>
                        <input className="input-style" 
                            type="password" 
                            onChange={handleChange} 
                            value={formData.password} 
                            name='password' 
                            id='password' 
                            required
                        />
                    </div>
                    
                    <div className='w-full flex flex-row items-center justify-end text-xs font-bold mt-1'>
                        <Link href={'/recover-account'} className='text-slate-400 hover:text-slate-600 hover:underline transition'>Forgot password?</Link>
                    </div>
                    
                    <button 
                        type='submit' 
                        disabled={submitting}
                        className={`w-full mt-4 bg-primary hover:bg-primary-light text-white font-bold text-sm py-3.5 rounded-xl cursor-pointer transition shadow-lg shadow-primary/15 hover:scale-[1.01] active:scale-[0.99] ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {submitting ? 'Authenticating...' : 'Login'}
                    </button>
                </form>
            )}
        </div>
    )
}

export default LoginForm
'use client'
import Link from 'next/link'
import React, { useState, useContext } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Context } from '../helper/Context'
import { FiLock, FiMail } from 'react-icons/fi'
import { STORE_NAME, STORE_TAGLINE } from '@/lib/secret'

const LoginForm = () => {
    const router = useRouter()
    const { setUser } = useContext(Context)
    const [submitting, setSubmitting] = useState(false)
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    })

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
            const response = await axios.post('/api/user/login', formData)
            toast.success(response.data.message || 'Logged in successfully!', { id: toastId })
            
            if (response.data.user) {
                setUser(response.data.user)
            }

            window.location.replace('/dashboard')
        } catch (error) {
            const errorMessage = error.response?.data?.error || 'Failed to login. Please try again.'
            toast.error(errorMessage, { id: toastId })
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className='w-full flex flex-col items-center justify-center min-h-screen p-4 relative overflow-hidden'>
          
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
        </div>
    )
}

export default LoginForm
'use client'
import Link from 'next/link'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import toast from 'react-hot-toast'
import { FiUser, FiMail, FiPhone, FiLock } from 'react-icons/fi'

const RegisterForm = () => {
    const router = useRouter()
    const [submitting, setSubmitting] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: ''
    })

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData((data) => ({ ...data, [name]: value }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (submitting) return

        if (formData.password !== formData.confirmPassword) {
            toast.error('Passwords do not match!')
            return
        }

        setSubmitting(true)
        const toastId = toast.loading('Registering account...')

        try {
            const { name, email, phone, password } = formData
            const response = await axios.post('/api/staff', { name, email, phone, password })
            toast.success(response.data.message || 'Account registered! Please verify your email.', {
                id: toastId,
                duration: 6000
            })

            setFormData({
                name: '',
                email: '',
                phone: '',
                password: '',
                confirmPassword: ''
            })

            router.push('/')
        } catch (error) {
            const errorMessage = error.response?.data?.error || 'Registration failed. Please try again.'
            toast.error(errorMessage, { id: toastId })
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className='w-full flex flex-col items-center justify-center min-h-screen p-4 py-8 relative overflow-hidden'>
            <form onSubmit={handleSubmit} suppressHydrationWarning className='w-full max-w-md flex flex-col gap-4 shadow-xl shadow-slate-100/40 border border-slate-100 p-8 md:p-10 rounded-2xl bg-white relative z-10 animate-fade-in'>
                <div className='flex flex-col items-center text-center mb-2'>
                    <h2 className='text-2xl font-black text-secondary tracking-tight'>Create Account</h2>
                    <p className='text-xs text-slate-500 mt-1 font-semibold'>Get access to premium shopping benefits</p>
                </div>


                    <div className='w-full flex flex-col gap-1.5'>
                        <label htmlFor="name" className='text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5'>
                            <FiUser className="w-3.5 h-3.5" /> Full Name
                        </label>
                        <input className="input-style"
                            type="text"
                            required
                            onChange={handleChange}
                            value={formData.name}
                            name='name'
                            id='name'
                        />
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
                        <label htmlFor="phone" className='text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5'>
                            <FiPhone className="w-3.5 h-3.5" /> Phone Number (Optional)
                        </label>
                        <input className="input-style"
                            type="tel"
                            onChange={handleChange}
                            value={formData.phone}
                            name='phone'
                            id='phone'
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

                    <div className='w-full flex flex-col gap-1.5'>
                        <label htmlFor="confirmPassword" className='text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5'>
                            <FiLock className="w-3.5 h-3.5" /> Confirm Password
                        </label>
                        <input className="input-style"
                            type="password"
                            onChange={handleChange}
                            value={formData.confirmPassword}
                            name='confirmPassword'
                            id='confirmPassword'
                            required
                        />
                    </div>

                    <div className='w-full flex flex-row items-center justify-between text-xs font-bold mt-2'>
                        <span className='text-slate-500'>Already have an account?</span>
                        <Link href={'/'} className='text-primary hover:underline transition'>Login here</Link>
                    </div>

                    <button
                        type='submit'
                        disabled={submitting}
                        className={`w-full mt-4 bg-primary hover:bg-primary-light text-white font-bold text-sm py-3.5 rounded-xl cursor-pointer transition shadow-lg shadow-emerald-600/15 hover:scale-[1.01] active:scale-[0.99] ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {submitting ? 'Creating Account...' : 'Register'}
                    </button>
                </form>
        </div>
    )
}

export default RegisterForm

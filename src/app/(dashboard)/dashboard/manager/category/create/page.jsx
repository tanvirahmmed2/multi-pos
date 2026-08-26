'use client'
import React, { useContext, useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Context } from '@/component/helper/Context'
import CategoryForm from '@/component/manager/CategoryForm'

export default function CategoryCreatePage() {
  const { dashSidebar } = useContext(Context)
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (formData) => {
    setLoading(true)
    try {
      await axios.post('/api/category', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      toast.success('Category created successfully')
      router.push('/dashboard/manager/category')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create category')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`w-full min-h-screen bg-slate-50 pt-20 pb-12 px-4 md:px-8 transition-all duration-300 ${dashSidebar ? 'lg:pl-68' : 'lg:pl-8'}`}>
      <div className="max-w-6xl mx-auto flex items-center justify-center min-h-[70vh]">
        <CategoryForm onSubmit={handleSubmit} loading={loading} />
      </div>
    </div>
  )
}

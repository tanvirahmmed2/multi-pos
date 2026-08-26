'use client'
import React, { useContext, useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Context } from '@/component/helper/Context'
import CategoryForm from '@/component/manager/CategoryForm'
import { BiLoaderAlt } from 'react-icons/bi'

export default function CategoryEditPage() {
  const { dashSidebar } = useContext(Context)
  const router = useRouter()
  const params = useParams()
  const { id } = params

  const [category, setCategory] = useState(null)
  const [fetching, setFetching] = useState(true)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!id) return
    const fetchCategory = async () => {
      try {
        const res = await axios.get(`/api/category/${id}`)
        setCategory(res.data)
      } catch (err) {
        toast.error('Failed to load category details')
        console.error(err)
      } finally {
        setFetching(false)
      }
    }
    fetchCategory()
  }, [id])

  const handleSubmit = async (formData) => {
    setLoading(true)
    try {
      await axios.put(`/api/category/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      toast.success('Category updated successfully')
      router.push('/dashboard/manager/category')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update category')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`w-full min-h-screen bg-slate-50 pt-20 pb-12 px-4 md:px-8 transition-all duration-300 ${dashSidebar ? 'lg:pl-68' : 'lg:pl-8'}`}>
      <div className="max-w-6xl mx-auto flex items-center justify-center min-h-[70vh]">
        {fetching ? (
          <div className="flex items-center gap-2 text-slate-500 font-semibold">
            <BiLoaderAlt className="animate-spin text-xl text-emerald-600" />
            <span>Fetching category data...</span>
          </div>
        ) : category ? (
          <CategoryForm initialData={category} onSubmit={handleSubmit} loading={loading} />
        ) : (
          <div className="text-slate-400 font-semibold text-center">Category not found</div>
        )}
      </div>
    </div>
  )
}

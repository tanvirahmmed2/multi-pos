'use client'
import React, { useContext, useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Context } from '@/component/helper/Context'
import BrandForm from '@/component/manager/BrandForm'
import { BiLoaderAlt } from 'react-icons/bi'

export default function BrandEditPage() {
  const { dashSidebar } = useContext(Context)
  const router = useRouter()
  const params = useParams()
  const { id } = params

  const [brand, setBrand] = useState(null)
  const [fetching, setFetching] = useState(true)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!id) return
    const fetchBrand = async () => {
      try {
        const res = await axios.get(`/api/brand/${id}`)
        setBrand(res.data)
      } catch (err) {
        toast.error('Failed to load brand details')
        console.error(err)
      } finally {
        setFetching(false)
      }
    }
    fetchBrand()
  }, [id])

  const handleSubmit = async (formData) => {
    setLoading(true)
    try {
      await axios.put(`/api/brand/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      toast.success('Brand updated successfully')
      router.push('/dashboard/manager/brands')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update brand')
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
            <span>Fetching brand data...</span>
          </div>
        ) : brand ? (
          <BrandForm initialData={brand} onSubmit={handleSubmit} loading={loading} />
        ) : (
          <div className="text-slate-400 font-semibold text-center">Brand not found</div>
        )}
      </div>
    </div>
  )
}

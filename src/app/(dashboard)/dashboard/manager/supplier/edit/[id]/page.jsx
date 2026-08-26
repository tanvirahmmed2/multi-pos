'use client'
import React, { useContext, useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Context } from '@/component/helper/Context'
import SupplierForm from '@/component/manager/SupplierForm'
import { BiLoaderAlt } from 'react-icons/bi'

export default function SupplierEditPage() {
  const { dashSidebar } = useContext(Context)
  const router = useRouter()
  const params = useParams()
  const { id } = params

  const [supplier, setSupplier] = useState(null)
  const [fetching, setFetching] = useState(true)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!id) return
    const fetchSupplier = async () => {
      try {
        const res = await axios.get(`/api/supplier/${id}`)
        setSupplier(res.data)
      } catch (err) {
        toast.error('Failed to load supplier details')
        console.error(err)
      } finally {
        setFetching(false)
      }
    }
    fetchSupplier()
  }, [id])

  const handleSubmit = async (supplierData) => {
    setLoading(true)
    try {
      await axios.put(`/api/supplier/${id}`, supplierData)
      toast.success('Supplier updated successfully')
      router.push('/dashboard/manager/supplier')
      router.refresh()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update supplier')
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
            <span>Fetching supplier data...</span>
          </div>
        ) : supplier ? (
          <SupplierForm initialData={supplier} onSubmit={handleSubmit} loading={loading} />
        ) : (
          <div className="text-slate-400 font-semibold text-center">Supplier not found</div>
        )}
      </div>
    </div>
  )
}

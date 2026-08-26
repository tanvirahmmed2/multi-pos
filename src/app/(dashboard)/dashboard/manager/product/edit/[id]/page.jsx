'use client'
import React, { useContext, useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Context } from '@/component/helper/Context'
import ProductForm from '@/component/manager/ProductForm'
import { BiLoaderAlt } from 'react-icons/bi'

export default function ProductEditPage() {
  const { dashSidebar } = useContext(Context)
  const router = useRouter()
  const params = useParams()
  const { id } = params

  const [product, setProduct] = useState(null)
  const [fetching, setFetching] = useState(true)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!id) return
    const fetchProduct = async () => {
      try {
        const res = await axios.get(`/api/product/${id}`)
        setProduct(res.data)
      } catch (err) {
        toast.error('Failed to load product details')
        console.error(err)
      } finally {
        setFetching(false)
      }
    }
    fetchProduct()
  }, [id])

  const handleSubmit = async (formData) => {
    setLoading(true)
    try {
      await axios.put(`/api/product/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      toast.success('Product updated successfully')
      router.push('/dashboard/manager/product')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update product')
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
            <span>Fetching product data...</span>
          </div>
        ) : product ? (
          <ProductForm initialData={product} onSubmit={handleSubmit} loading={loading} />
        ) : (
          <div className="text-slate-400 font-semibold text-center">Product not found</div>
        )}
      </div>
    </div>
  )
}

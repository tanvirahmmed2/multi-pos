'use client'
import React, { useEffect, useState } from 'react'
import axios from 'axios'
import ProductCard from '@/component/cards/Product'
import { BiLoaderAlt } from 'react-icons/bi'

export default function SameCategory({ categoryId, excludeProductId }) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!categoryId) {
      setLoading(false)
      return
    }

    const fetchRelated = async () => {
      try {
        const res = await axios.get(`/api/product?category=${categoryId}`)
        // Filter out the current product and inactive products
        const filtered = res.data.filter(
          (p) => p.product_id !== excludeProductId && p.is_active !== false
        )
        setProducts(filtered.slice(0, 4))
      } catch (err) {
        console.error('Failed to fetch same category products:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchRelated()
  }, [categoryId, excludeProductId])

  if (loading) {
    return (
      <div className="w-full py-12 flex items-center justify-center text-slate-500 gap-2">
        <BiLoaderAlt className="animate-spin text-xl text-emerald-600" />
        <span className="text-sm font-semibold">Loading similar products...</span>
      </div>
    )
  }

  if (products.length === 0) {
    return null
  }

  return (
    <div className="w-full flex flex-col gap-6 mt-12 border-t border-slate-100 pt-10">
      <div>
        <h2 className="text-xl font-black text-slate-900 tracking-tight">
          You May Also Like
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Explore other popular items from this category.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        {products.map((prod) => (
          <ProductCard key={prod.product_id} product={prod} />
        ))}
      </div>
    </div>
  )
}

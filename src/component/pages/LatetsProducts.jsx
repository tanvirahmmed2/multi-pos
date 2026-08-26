'use client'
import React, { useState, useEffect, useContext } from 'react'
import axios from 'axios'
import ProductCard from '../cards/Product'
import { Context } from '../helper/Context'
import { BiLoaderAlt, BiSolidChevronRight } from 'react-icons/bi'
import Link from 'next/link'

const LatetsProducts = () => {

  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLatest = async () => {
      try {
        const res = await axios.get('/api/product/latest')
        const activeProducts = res.data.filter(p => p.is_active !== false)
        setProducts(activeProducts.slice(0, 6))
      } catch (err) {
        console.error('Failed to load latest products:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchLatest()
  }, [])

  if (loading) {
    return (
      <div className="w-full py-12 flex justify-center items-center">
        <BiLoaderAlt className="text-3xl animate-spin"  />
      </div>
    )
  }

  if (products.length === 0) return null

  return (
    <div className="w-full py-16 p-4 md:p-20">
      <div className="w-full flex flex-col gap-8">
        
        <div className="flex justify-between items-end">
          <div className="flex flex-col gap-1.5">
            <span className="text-2xl font-semibold uppercase tracking-widest text-emerald-600" >
              New Arrivals
            </span>
            
          </div>
          <Link 
            href="/products" 
            className="flex items-center gap-1 text-xs font-bold hover:gap-1.5 transition-all text-secondary"
          >
            See Catalog <BiSolidChevronRight className="text-base" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {products.map((p) => (
            <ProductCard key={p.product_id} product={p} />
          ))}
        </div>

      </div>
    </div>
  )
}

export default LatetsProducts
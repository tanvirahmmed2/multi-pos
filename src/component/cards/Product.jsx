'use client'
import React, { useContext, useState } from 'react'
import Link from 'next/link'
import { BiCart, BiShow, BiLoaderAlt } from 'react-icons/bi'
import { Context } from '../helper/Context'
import axios from 'axios'
import toast from 'react-hot-toast'
import Image from 'next/image'

export default function ProductCard({ product }) {
  if (!product) return null

  const { addToCart } = useContext(Context)

  const {
    product_id,
    name,
    slug,
    image,
    sale_price,
    discount_price,
    category_name,
    brand_name,
    stock,
    total_stock
  } = product

  const [variants, setVariants] = useState([])
  const [loadingVariants, setLoadingVariants] = useState(false)
  const [showVariants, setShowVariants] = useState(false)

  const hasDiscount = discount_price && parseFloat(discount_price) > 0

  const finalPrice = hasDiscount
    ? Math.max(0, parseFloat(sale_price) - parseFloat(discount_price))
    : parseFloat(sale_price)

  const handleAddToCart = async (e) => {
    e.preventDefault()
    e.stopPropagation()

    if (variants.length === 0 && !loadingVariants) {
      setLoadingVariants(true)
      try {
        const res = await axios.get(`/api/product/${slug}`)
        const fetchedVariants = res.data.variants || []
        const activeVariants = fetchedVariants.filter(v => v.is_active !== false)
        setVariants(activeVariants)
        if (activeVariants.length > 1) {
          setShowVariants(true)
        } else if (activeVariants.length === 1) {
          addToCart(product, activeVariants[0], 1)
        } else {
          addToCart(product)
        }
      } catch (err) {
        console.error('Failed to load variants:', err)
        toast.error('Failed to check variant options')
        addToCart(product) 
      } finally {
        setLoadingVariants(false)
      }
    } else if (variants.length > 1) {
      setShowVariants(true)
    } else if (variants.length === 1) {
      addToCart(product, variants[0], 1)
    } else {
      addToCart(product)
    }
  }

  return (
    <div className="group bg-tertiary-light cursor-pointer rounded-lg border border-slate-100 shadow-sm hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden relative">

      <div className="relative aspect-square w-full overflow-hidden bg-slate-50 border-b border-slate-100">
        

        <Image width={500} height={500}
          src={image || '/product.jpeg'}
          alt={name}
          loading="eager"
          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
        />

        <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2.5 z-10">
          <Link
            href={`/products/${slug}`}
            className="p-2.5 bg-white/95 backdrop-blur-sm text-secondary rounded-full hover:bg-emerald-600 hover:text-white transition-all duration-200 transform translate-y-4 group-hover:translate-y-0 shadow-md"
            title="View Details"
          >
            <BiShow className="text-lg" />
          </Link>
        </div>
      </div>

      <div className="p-3 sm:p-4 flex flex-col flex-1 gap-1.5">
        

        <Link href={`/products/${slug}`} className="block">
          <h3 className="text-sm font-semibold text-slate-850 hover:text-emerald-605 transition line-clamp-1">
            {name}
          </h3>
        </Link>

        <div className="mt-auto pt-2.5 flex items-center justify-between gap-1.5 sm:gap-2 border-t border-slate-50">
          <div className="flex flex-col">
            {hasDiscount ? (
              <div className="flex flex-col sm:flex-row sm:items-baseline gap-0.5 sm:gap-1.5">
                <span className="text-sm sm:text-base font-semibold text-slate-900">৳{finalPrice.toFixed(2)}</span>
                <span className="text-[10px] sm:text-xs text-slate-400 line-through">৳{parseFloat(sale_price).toFixed(2)}</span>
              </div>
            ) : (
              <span className="text-sm sm:text-base font-semibold text-slate-900">৳{finalPrice.toFixed(2)}</span>
            )}
          </div>

          {((total_stock !== undefined ? parseInt(total_stock, 10) : parseInt(stock, 10)) <= 0) ? (
            <button
              disabled
              className="p-2  rounded-xl cursor-not-allowed border border-slate-150 flex items-center justify-center gap-1"
              title="Out of Stock"
            >
              <span className="hidden sm:inline text-[8px] font-semibold px-0.5">Out of Stock</span>
            </button>
          ) : (
            <button
              onClick={handleAddToCart}
              disabled={loadingVariants}
              className="p-2 bg-slate-900/5 text-slate-650 hover:bg-primary hover:text-white rounded-xl transition-all duration-200 shadow-sm border border-slate-100 flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer disabled:opacity-50"
              title="Add to Cart"
            >
              {loadingVariants ? (
                <BiLoaderAlt className="text-lg animate-spin text-primary" />
              ) : (
                <BiCart className="text-lg" />
              )}
              <span className="hidden sm:inline text-xs font-semibold ">
                {loadingVariants && 'Loading...'}
              </span>
            </button>
          )}
        </div>

      </div>

      {showVariants && (
        <div
          className="absolute inset-0 bg-white/95 backdrop-blur-sm z-20 p-4 flex flex-col justify-between items-center transition-all duration-300"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
          }}
        >
          <div className="w-full flex justify-between items-center border-b border-slate-100 pb-2">
            <span className="text-xs font-extrabold text-tertiary">Select Option</span>
            <button
              onClick={() => setShowVariants(false)}
              className="text-xs text-slate-400 hover:text-slate-700 font-semibold"
            >
              Cancel
            </button>
          </div>

          <div className="flex-1 w-full my-3 flex flex-col gap-2 pr-1">
            {variants.map((v) => {
              const vHasDiscount = v.discount_price && parseFloat(v.discount_price) > 0
              const finalVPrice = vHasDiscount
                ? Math.max(0, parseFloat(v.sale_price) - parseFloat(v.discount_price))
                : parseFloat(v.sale_price)
              const inStock = parseInt(v.stock, 10) > 0

              return (
                <button
                  key={v.variant_id}
                  disabled={!inStock}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    addToCart(product, v, 1)
                    setShowVariants(false)
                  }}
                  className={`w-full py-2 px-3 border rounded-xl text-left text-xs font-semibold transition flex items-center justify-between cursor-pointer ${inStock
                      ? 'border-slate-200 bg-slate-50 hover:bg-primary-light hover:border-primary hover:text-primary-dark'
                      : 'border-slate-100 bg-slate-50 text-slate-400 cursor-not-allowed opacity-50'
                    }`}
                >
                  <span className="truncate">{v.variant_name}</span>
                  <span className="shrink-0">
                    {inStock ? `৳${finalVPrice.toFixed(2)}` : 'Out of Stock'}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="text-[10px] text-slate-400 text-center font-medium">
            Choose a variant to add to cart
          </div>
        </div>
      )}

    </div>
  )
}

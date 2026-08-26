'use client'
import React, { useState, useEffect, useContext } from 'react'
import axios from 'axios'
import { Context } from '../helper/Context'
import { BiLoaderAlt } from 'react-icons/bi'
import Image from 'next/image'

const Brands = () => {
  const { website } = useContext(Context)

  const [brands, setBrands] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const res = await axios.get('/api/brand')
        setBrands(res.data.filter(b => b.is_active !== false))
      } catch (err) {
        console.error('Failed to load brands:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchBrands()
  }, [])

  if (loading) {
    return (
      <div className="w-full py-12 flex justify-center items-center">
        <BiLoaderAlt className="text-3xl animate-spin"  />
      </div>
    )
  }

  if (brands.length === 0) return null

  const marqueeItems = [...brands, ...brands, ...brands]

  return (
    <div className="w-full py-12 p-4 md:p-20 overflow-hidden relative">
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes scroll-brands {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.33%); }
        }
        .marquee-inner-brands {
          display: flex;
          width: max-content;
          animation: scroll-brands 20s linear infinite;
        }
        .marquee-inner-brands:hover {
          animation-play-state: paused;
        }
      `}} />

      <div className="w-full mb-6">

        <h2 className="text-2xl  font-semibold text-secondary tracking-tight mt-1">
          Authorized Brands
        </h2>
      </div>

      <div className="w-full overflow-hidden relative py-4 ">
        <div className="marquee-inner-brands flex gap-4 px-4 items-center">
          {marqueeItems.map((brand, idx) => (
            <div
              key={`${brand.brand_id}-${idx}`}
              className="w-auto flex flex-col items-center justify-center gap-4 p-4 cursor-pointer bg-white rounded-sm group"
            >
              <div className='w-full max-w-36 aspect-square overflow-hidden'>
                <Image width={500} height={500}
                  src={brand.image || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100'}
                  alt={brand.name}
                  className="w-full object-cover aspect-square rounded-full group-hover:grayscale-0 grayscale-100"
                />
              </div>
              <span className="text-sm font-semibold text-slate-800 truncate">{brand.name}</span>


            </div>
          ))}
        </div>
      </div>

    </div>
  )
}

export default Brands
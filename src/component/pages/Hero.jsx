'use client'
import React, { useContext, useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Context } from '../helper/Context'
import { FiArrowRight, FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import { STORE_NAME, STORE_TAGLINE } from '@/lib/secret'

const Hero = () => {
  const { website } = useContext(Context)
  const [activeIdx, setActiveIdx] = useState(0)
  const [isHovered, setIsHovered] = useState(false)

  const themeColor = website?.theme_color || '#10b981'
  const bgImages = ['/Fashion.jpg', '/fashionn.jpg', '/fassh.jpg']

  const handleNext = useCallback(() => {
    setActiveIdx((prev) => (prev + 1) % bgImages.length)
  }, [bgImages.length])

  const handlePrev = useCallback(() => {
    setActiveIdx((prev) => (prev - 1 + bgImages.length) % bgImages.length)
  }, [bgImages.length])

  useEffect(() => {
    if (isHovered) return
    const timer = setInterval(() => {
      handleNext()
    }, 5000)
    return () => clearInterval(timer)
  }, [isHovered, handleNext])

  return (
    <div
      className="w-full relative aspect-video md:aspect-video p-4 overflow-hidden  border border-slate-100 flex items-center justify-center bg-slate-900 text-white z-10"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ '--theme-color': themeColor }}
    >
      
      <div className="absolute inset-0 z-0">
        {bgImages.map((img, idx) => (
          <div
            key={idx}
            className={`absolute inset-0 bg-cover bg-center transition-opacity duration-700 ease-in-out ${
              activeIdx === idx ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ backgroundImage: `url(${img})` }}
          />
        ))}
        <div className="absolute inset-0 bg-black/20" />
      </div>

      <div className="relative z-10 px-4 sm:px-8 max-w-2xl mx-auto text-center flex flex-col items-center justify-center gap-3 sm:gap-4 md:gap-6">
        
        <div className="flex flex-col items-center gap-1 sm:gap-2">
          <h1 className="text-xl sm:text-3xl md:text-5xl lg:text-6xl font-extrabold tracking-tight uppercase text-white drop-shadow-md">
            {STORE_NAME}
          </h1>
          <p className="text-[10px] sm:text-xs md:text-sm lg:text-base text-tertiary font-medium tracking-wide max-w-xl drop-shadow-sm">
            {STORE_TAGLINE}
          </p>
        </div>

        <div className="w-12 sm:w-16 h-0.5 bg-white/30" />

        <div className="flex items-center gap-3 sm:gap-4 justify-center mt-1 sm:mt-2">
          <Link
            href="/products"
            className="px-4 py-2 sm:px-6 sm:py-3 text-[10px] sm:text-xs font-bold text-white rounded-lg transition hover:brightness-110 flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
            style={{ backgroundColor: themeColor }}
          >
            Shop Now <FiArrowRight />
          </Link>
          <Link
            href="/offers"
            className="px-4 py-2 sm:px-6 sm:py-3 text-[10px] sm:text-xs font-bold text-white rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 transition active:scale-95 flex items-center"
          >
            Offers
          </Link>
        </div>
      </div>

      <div className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 hidden md:block z-20">
        <button
          onClick={handlePrev}
          className="p-2 sm:p-2.5 bg-black/30 hover:bg-black/50 text-white rounded-full transition active:scale-95 cursor-pointer border border-white/10"
          aria-label="Previous Slide"
        >
          <FiChevronLeft className="text-base sm:text-lg" />
        </button>
      </div>
      <div className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 hidden md:block z-20">
        <button
          onClick={handleNext}
          className="p-2 sm:p-2.5 bg-black/30 hover:bg-black/50 text-white rounded-full transition active:scale-95 cursor-pointer border border-white/10"
          aria-label="Next Slide"
        >
          <FiChevronRight className="text-base sm:text-lg" />
        </button>
      </div>

      <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20">
        {bgImages.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setActiveIdx(idx)}
            className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-all cursor-pointer"
            style={{
              backgroundColor: activeIdx === idx ? themeColor : 'rgba(255, 255, 255, 0.4)'
            }}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>

    </div>
  )
}

export default Hero
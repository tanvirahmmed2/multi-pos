'use client'
import React, { useContext } from 'react'
import Link from 'next/link'
import { Context } from '../helper/Context'
import Image from 'next/image'

const Categories = () => {
  const { categories, website } = useContext(Context)
  const themeColor = website?.theme_color || '#10b981'

  if (!categories || categories.length === 0) return null

  const marqueeItems = [...categories, ...categories, ...categories]

  return (
    <div className="w-full py-12 p-4 md:p-20 overflow-hidden relative">
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes scroll-categories {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.33%); }
        }
        .marquee-inner-categories {
          display: flex;
          width: max-content;
          animation: scroll-categories 25s linear infinite;
        }
        .marquee-inner-categories:hover {
          animation-play-state: paused;
        }
      `}} />

      <div className="w-full  mb-6">

        <h2 className="text-2xl font-semibold text-primary tracking-tight mt-1">
          Browse Categories
        </h2>
      </div>

      <div className="w-full overflow-hidden relative py-4 ">
        <div className="marquee-inner-categories flex gap-6 px-4">
          {marqueeItems.map((cat, idx) => (
            <Link
              key={`${cat.id}-${idx}`}
              href={`/products/category/${cat.slug}`}
              className="w-auto flex flex-col items-center justify-center gap-4 shrink-0 bg-white p-4 rounded-lg group cursor-pointer"
            >
              <div className='w-full max-w-36 overflow-hidden aspect-square'>
                <Image width={500} height={500}
                  src={cat.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100'}
                  alt={cat.category}
                  className="w-full rounded-full object-cover  aspect-square grayscale-100 group-hover:grayscale-0"
                />
              </div>
              
              <span className=" font-semibold text-sm text-secondary-dark truncate">{cat.category}</span>

            </Link>
          ))}
        </div>
      </div>

    </div>
  )
}

export default Categories
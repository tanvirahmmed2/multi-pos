'use client'
import React, { useState, useEffect, useContext } from 'react'
import axios from 'axios'
import { Context } from '../helper/Context'
import { BiLoaderAlt, BiSolidStar } from 'react-icons/bi'

const Reviews = () => {
  const { website } = useContext(Context)
  const themeColor = website?.theme_color || '#10b981'

  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await axios.get('/api/review/latest')
        setReviews(res.data)
      } catch (err) {
        console.error('Failed to load latest reviews:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchReviews()
  }, [])

  if (loading) {
    return (
      <div className="w-full py-12 flex justify-center items-center">
        <BiLoaderAlt className="text-3xl animate-spin" style={{ color: themeColor }} />
      </div>
    )
  }

  if (reviews.length === 0) return null

  const displayReviews = reviews

  // Duplicate items for infinite marquee loop
  const marqueeItems = [...displayReviews, ...displayReviews, ...displayReviews]

  return (
    <div className="w-full py-12 bg-slate-50 border-b border-slate-100 overflow-hidden relative">
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes scroll-reviews {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.33%); }
        }
        .marquee-inner-reviews {
          display: flex;
          width: max-content;
          animation: scroll-reviews 30s linear infinite;
        }
        .marquee-inner-reviews:hover {
          animation-play-state: paused;
        }
      `}} />

      <div className="w-full px-4 md:px-8 mb-6">
        <span className="text-xs font-black uppercase tracking-widest text-emerald-600" style={{ color: themeColor }}>
          Testimonials
        </span>
        <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight mt-1">
          What Our Customers Say
        </h2>
      </div>

      {/* Marquee Ticker */}
      <div className="w-full overflow-hidden relative py-4 bg-white border-y border-slate-100">
        <div className="marquee-inner-reviews flex gap-6 px-4">
          {marqueeItems.map((rev, idx) => (
            <div
              key={`${rev.review_id}-${idx}`}
              className="bg-slate-50 border border-slate-100 rounded-3xl p-5 min-w-[300px] max-w-[320px] transition-all hover:scale-[1.01] shadow-sm select-none shrink-0 flex flex-col gap-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-800">{rev.user_name}</span>
                <div className="flex items-center gap-0.5 text-amber-500">
                  {Array.from({ length: Math.min(5, rev.rating) }, (_, i) => (
                    <BiSolidStar key={i} className="text-sm" />
                  ))}
                </div>
              </div>
              <p className="text-slate-600 text-[11px] font-semibold leading-relaxed italic">
                "{rev.comment ? rev.comment.replace(/<[^>]*>/g, '').trim() : ''}"
              </p>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}

export default Reviews
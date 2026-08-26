'use client'
import React, { useContext, useEffect, useState } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Context } from '@/component/helper/Context'
import { 
  BiStar, 
  BiCheck, 
  BiTrash, 
  BiLoaderAlt, 
  BiRefresh, 
  BiUser,
  BiEnvelope,
  BiConversation
} from 'react-icons/bi'

export default function ReviewsModerationPage() {
  const { dashSidebar, user, website } = useContext(Context)
  const themeColor = website?.theme_color || '#73976A'
  
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('pending') // 'pending', 'approved', 'all'
  const [actionId, setActionId] = useState(null) // ID of review currently updating

  const fetchReviews = async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const res = await axios.get('/api/review?all=true')
      setReviews(res.data)
    } catch (err) {
      toast.error('Failed to fetch reviews')
      console.error(err)
    } finally {
      if (!silent) setLoading(false)
    }
  }

  useEffect(() => {
    if (user && ['admin', 'manager', 'sales'].includes(user.role)) {
      fetchReviews()
    }
  }, [user])

  const handleApprove = async (id, approveStatus) => {
    setActionId(id)
    try {
      await axios.patch(`/api/review/${id}`, {
        is_approved: approveStatus
      })
      toast.success(approveStatus ? 'Review approved successfully!' : 'Review status reverted to pending.')
      fetchReviews(true)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update review status')
      console.error(err)
    } finally {
      setActionId(null)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('WARNING: Are you sure you want to delete this customer review permanently?')) {
      return
    }
    setActionId(id)
    try {
      await axios.delete(`/api/review/${id}`)
      toast.success('Review deleted successfully')
      setReviews(reviews.filter(r => r.review_id !== id))
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete review')
      console.error(err)
    } finally {
      setActionId(null)
    }
  }

  const filteredReviews = reviews.filter((r) => {
    if (activeTab === 'pending') return r.is_approved === false
    if (activeTab === 'approved') return r.is_approved === true
    return true
  })

  const renderStars = (count) => {
    return (
      <div className="flex gap-0.5 text-amber-500 text-sm">
        {[1, 2, 3, 4, 5].map((star) => (
          <BiStar key={star} className={star <= count ? 'fill-amber-500 text-amber-500' : 'text-slate-200'} />
        ))}
      </div>
    )
  }

  return (
    <div className={`w-full min-h-screen bg-slate-50 pt-20 pb-12 px-2 sm:px-4 md:px-8 transition-all duration-300 ${dashSidebar ? 'lg:pl-64' : 'lg:pl-8'}`}>
      <div className="w-full flex flex-col gap-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-800 flex items-center gap-2">
              <BiConversation style={{ color: themeColor }} />
              Review Moderation Center
            </h1>
            <p className="text-slate-500 text-xs md:text-sm mt-0.5">Approve customer feedback, revert status logs, or reject inappropriate posts.</p>
          </div>
          <button
            onClick={() => fetchReviews()}
            disabled={loading}
            className="p-2 border border-slate-200 hover:bg-slate-100 bg-white text-slate-700 transition cursor-pointer shadow-sm disabled:opacity-50"
          >
            <BiRefresh className={`text-lg ${loading ? 'animate-spin text-slate-800' : ''}`} />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex bg-white border border-slate-200 p-1 shadow-sm shrink-0 max-w-md w-full">
          {['pending', 'approved', 'all'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 text-xs font-bold uppercase transition cursor-pointer ${
                activeTab === tab
                  ? 'text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
              style={activeTab === tab ? { backgroundColor: themeColor } : {}}
            >
              {tab === 'pending' ? 'Pending' : tab === 'approved' ? 'Approved' : 'All'}
            </button>
          ))}
        </div>

        {/* Reviews List */}
        <div className="bg-white border border-slate-200 shadow-sm p-5 md:p-6 flex flex-col gap-4">
          {loading && reviews.length === 0 ? (
            <div className="w-full h-64 flex items-center justify-center text-slate-500 gap-2">
              <BiLoaderAlt className="animate-spin text-xl text-slate-800" />
              <span className="text-xs font-semibold">Loading review data...</span>
            </div>
          ) : filteredReviews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {filteredReviews.map((rev) => {
                const isBusy = actionId === rev.review_id
                return (
                  <div 
                    key={rev.review_id}
                    className="border border-slate-200 p-4 bg-slate-50/50 flex flex-col justify-between gap-4 hover:border-slate-300 transition"
                  >
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between items-start gap-2 border-b border-slate-200 pb-2">
                        <div className="min-w-0">
                          <span className="font-bold text-slate-800 text-xs truncate flex items-center gap-1.5">
                            <BiUser className="text-slate-400" /> {rev.user_name}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono mt-0.5 block truncate">
                            <BiEnvelope className="inline -mt-0.5 text-slate-400 mr-0.5" /> {rev.user_email}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono shrink-0">
                          {new Date(rev.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      <div>
                        {renderStars(rev.rating)}
                        <h3 className="font-bold text-slate-800 text-xs mt-2 leading-snug">{rev.title}</h3>
                        {rev.comment && (
                          <p className="text-slate-650 text-xs italic whitespace-pre-wrap leading-relaxed mt-1.5 p-3 bg-white border border-slate-200">
                            "{rev.comment.replace(/<[^>]*>/g, '').trim()}"
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions Panel */}
                    <div className="flex justify-between items-center border-t border-slate-200 pt-3">
                      <span className="text-[10px] font-mono text-slate-400">ID: #{rev.review_id}</span>
                      
                      <div className="flex gap-2">
                        {rev.is_approved ? (
                          <button
                            onClick={() => handleApprove(rev.review_id, false)}
                            disabled={isBusy}
                            className="px-3 py-1.5 border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold transition cursor-pointer flex items-center gap-1 disabled:opacity-50"
                          >
                            Revert to Pending
                          </button>
                        ) : (
                          <button
                            onClick={() => handleApprove(rev.review_id, true)}
                            disabled={isBusy}
                            className="px-3 py-1.5 text-white text-xs font-bold transition cursor-pointer flex items-center gap-1 shadow-sm disabled:opacity-50"
                            style={{ backgroundColor: themeColor }}
                          >
                            <BiCheck className="text-base" /> Approve Feedback
                          </button>
                        )}

                        <button
                          onClick={() => handleDelete(rev.review_id)}
                          disabled={isBusy}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 border border-slate-200 transition cursor-pointer flex items-center justify-center disabled:opacity-50"
                          title="Delete Review"
                        >
                          <BiTrash className="text-base" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="w-full py-16 flex flex-col items-center justify-center text-slate-400 gap-1.5">
              <BiConversation className="text-4xl text-slate-300" />
              <p className="font-bold text-slate-600 text-xs">No reviews to moderate</p>
              <p className="text-[10px] text-slate-400">
                {activeTab === 'pending'
                  ? 'All customer feedback has been successfully moderated!'
                  : activeTab === 'approved'
                    ? 'No approved reviews are registered yet.'
                    : 'Customer reviews will appear in this log.'}
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}



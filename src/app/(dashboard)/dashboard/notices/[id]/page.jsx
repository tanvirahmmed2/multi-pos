'use client'
import React, { useEffect, useState, useContext } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { Context } from '@/component/helper/Context'
import {
  BiArrowBack,
  BiCalendar,
  BiEditAlt,
  BiTrash,
  BiLoaderAlt,
  BiMessageSquareDetail,
  BiTime
} from 'react-icons/bi'

export default function SingleNoticeDetailPage() {
  const router = useRouter()
  const params = useParams()
  const noticeId = params?.id

  const { user, dashSidebar } = useContext(Context)
  const [notice, setNotice] = useState(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  const isAdmin = user?.role === 'admin'

  useEffect(() => {
    const fetchNotice = async () => {
      if (!noticeId) return
      setLoading(true)
      try {
        const res = await axios.get(`/api/notices/${noticeId}`)
        setNotice(res.data)
      } catch (err) {
        console.error('Error fetching notice details:', err)
        toast.error('Failed to load notice content')
      } finally {
        setLoading(false)
      }
    }
    fetchNotice()
  }, [noticeId])

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete this notice?`)) return
    setDeleting(true)
    try {
      await axios.delete(`/api/notices/${noticeId}`)
      toast.success('Notice deleted successfully!')
      router.push('/dashboard/notices')
    } catch (err) {
      console.error('Error deleting notice:', err)
      toast.error(err.response?.data?.error || 'Failed to delete notice')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className={`w-full min-h-screen bg-slate-50 pt-20 pb-12 px-4 md:px-8 transition-all duration-300 ${dashSidebar ? 'lg:pl-64' : 'lg:pl-8'} flex items-center justify-center`}>
        <div className="flex items-center gap-2 text-slate-500 font-semibold text-xs">
          <BiLoaderAlt className="animate-spin text-xl text-slate-800" />
          <span>Loading notice detail...</span>
        </div>
      </div>
    )
  }

  if (!notice) {
    return (
      <div className={`w-full min-h-screen bg-slate-50 pt-20 pb-12 px-4 md:px-8 transition-all duration-300 ${dashSidebar ? 'lg:pl-64' : 'lg:pl-8'} flex items-center justify-center`}>
        <div className="bg-white border border-slate-200 p-8 max-w-md w-full text-center flex flex-col items-center gap-3">
          <h2 className="text-lg font-bold text-slate-800">Notice Not Found</h2>
          <p className="text-xs text-slate-500">The notice you are looking for does not exist or was deleted.</p>
          <Link href="/dashboard/notices" className="mt-2 px-4 py-2 bg-slate-800 text-white text-xs font-bold">
            Back to Notice Board
          </Link>
        </div>
      </div>
    )
  }

  const noticeDateFormatted = notice.notice_date
    ? new Date(notice.notice_date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : 'N/A'

  const createdAtFormatted = notice.created_at
    ? new Date(notice.created_at).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : 'N/A'

  return (
    <div className={`w-full min-h-screen bg-slate-50 pt-20 pb-12 px-2 sm:px-4 md:px-8 transition-all duration-300 ${dashSidebar ? 'lg:pl-64' : 'lg:pl-8'}`}>
      <div className="w-full max-w-4xl mx-auto flex flex-col gap-6">

        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/notices"
              className="p-2 bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
              title="Back to Notice Board"
            >
              <BiArrowBack className="text-lg" />
            </Link>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                Official Staff Notice
              </span>
              <h1 className="text-xl md:text-2xl font-bold text-slate-800 line-clamp-1">
                {notice.title}
              </h1>
            </div>
          </div>

          {isAdmin && (
            <div className="flex items-center gap-2">
              <Link
                href={`/dashboard/notices/edit/${notice.notice_id}`}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <BiEditAlt /> Edit
              </Link>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {deleting ? <BiLoaderAlt className="animate-spin" /> : <BiTrash />} Delete
              </button>
            </div>
          )}
        </div>

        {/* Notice Card Body */}
        <div className="bg-white border border-slate-200 p-6 md:p-8 flex flex-col gap-6 shadow-xs">
          
          {/* Notice Meta Information */}
          <div className="p-4 bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-white border border-slate-200 text-primary text-lg">
                <BiCalendar />
              </span>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Announcement Date</span>
                <span className="text-xs font-bold text-slate-800">{noticeDateFormatted}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
              <BiTime className="text-slate-400 text-sm" />
              <span>Published on {createdAtFormatted}</span>
            </div>
          </div>

          {/* Notice Title */}
          <div>
            <h2 className="text-lg md:text-xl font-bold text-slate-900 leading-snug border-b border-slate-100 pb-3">
              {notice.title}
            </h2>
          </div>

          {/* HTML Description Content */}
          <div
            className="prose prose-sm max-w-none text-slate-800 font-sans leading-relaxed min-h-[150px] p-2"
            dangerouslySetInnerHTML={{ __html: notice.description || '' }}
          />

          {/* Footer note */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-semibold">
            <span>Official Notice #{notice.notice_id}</span>
            <span>Internal POS Staff Document</span>
          </div>

        </div>

      </div>
    </div>
  )
}

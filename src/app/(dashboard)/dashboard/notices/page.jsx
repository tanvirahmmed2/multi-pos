'use client'
import React, { useEffect, useState, useContext } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { Context } from '@/component/helper/Context'
import {
  BiPlus,
  BiLoaderAlt,
  BiTrash,
  BiEditAlt,
  BiShow,
  BiCalendar,
  BiSearch,
  BiMessageSquareDetail
} from 'react-icons/bi'

export default function NoticeListPage() {
  const { user, dashSidebar } = useContext(Context)
  const [notices, setNotices] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [deletingId, setDeletingId] = useState(null)

  const isAdmin = user?.role === 'admin'

  const fetchNotices = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/api/notices')
      setNotices(res.data || [])
    } catch (err) {
      console.error('Error fetching notices:', err)
      toast.error('Failed to load notice board')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotices()
  }, [])

  const handleDeleteNotice = async (noticeId, title) => {
    if (!window.confirm(`Are you sure you want to delete notice "${title}"?`)) {
      return
    }
    setDeletingId(noticeId)
    try {
      await axios.delete(`/api/notices/${noticeId}`)
      toast.success('Notice deleted successfully!')
      setNotices(prev => prev.filter(n => n.notice_id !== noticeId))
    } catch (err) {
      console.error('Failed to delete notice:', err)
      toast.error(err.response?.data?.error || 'Failed to delete notice')
    } finally {
      setDeletingId(null)
    }
  }

  const filteredNotices = notices.filter(n =>
    n.title.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Strip HTML tags for clean text preview snippet
  const stripHtml = (html) => {
    if (!html) return ''
    return html.replace(/<[^>]*>?/gm, '')
  }

  return (
    <div className={`w-full min-h-screen bg-slate-50 pt-20 pb-12 px-2 sm:px-4 md:px-8 transition-all duration-300 ${dashSidebar ? 'lg:pl-64' : 'lg:pl-8'}`}>
      <div className="w-full flex flex-col gap-6">

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-800 flex items-center gap-2">
              <BiMessageSquareDetail className="text-primary text-2xl" />
              Staff Notice Board
            </h1>
            <p className="text-slate-500 text-xs md:text-sm mt-0.5">
              Official announcements, directives, and notice updates for all staff members.
            </p>
          </div>

          {isAdmin && (
            <Link
              href="/dashboard/notices/create"
              className="px-4 py-2.5 bg-primary hover:bg-primary-dark text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shrink-0 shadow-xs cursor-pointer"
            >
              <BiPlus className="text-base" /> Create New Notice
            </Link>
          )}
        </div>

        {/* Search & Actions Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white border border-slate-200 p-4">
          <div className="relative w-full sm:w-80">
            <BiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base" />
            <input
              type="text"
              placeholder="Search notices by title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 outline-none focus:border-slate-400 transition"
            />
          </div>

          <div className="text-xs text-slate-500 font-semibold self-end sm:self-center">
            Total Notices: <span className="font-bold text-slate-800">{filteredNotices.length}</span>
          </div>
        </div>

        {/* Notice Board List */}
        {loading ? (
          <div className="w-full min-h-[300px] bg-white border border-slate-200 flex flex-col items-center justify-center gap-2 text-slate-400">
            <BiLoaderAlt className="animate-spin text-3xl text-slate-700" />
            <span className="text-xs font-semibold">Loading notices...</span>
          </div>
        ) : filteredNotices.length === 0 ? (
          <div className="w-full min-h-[250px] bg-white border border-slate-200 p-8 text-center flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 text-2xl">
              <BiMessageSquareDetail />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">No notices found</h3>
              <p className="text-xs text-slate-500 mt-1">There are no published notices available right now.</p>
            </div>
            {isAdmin && (
              <Link
                href="/dashboard/notices/create"
                className="mt-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer"
              >
                <BiPlus /> Post First Notice
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredNotices.map((notice) => {
              const noticeDateFormatted = notice.notice_date
                ? new Date(notice.notice_date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })
                : 'N/A'

              const snippet = stripHtml(notice.description)

              return (
                <div
                  key={notice.notice_id}
                  className="bg-white border border-slate-200 p-5 flex flex-col justify-between gap-4 hover:border-slate-400 transition shadow-xs group"
                >
                  <div className="flex flex-col gap-2.5">
                    <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                      <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 font-mono">
                        <BiCalendar className="text-xs text-primary" /> {noticeDateFormatted}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">#NOTICE-{notice.notice_id}</span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-800 line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                      {notice.title}
                    </h3>

                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                      {snippet || 'No description preview available...'}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <Link
                      href={`/dashboard/notices/${notice.notice_id}`}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <BiShow /> Read Notice
                    </Link>

                    {isAdmin && (
                      <div className="flex items-center gap-1.5">
                        <Link
                          href={`/dashboard/notices/edit/${notice.notice_id}`}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition text-sm cursor-pointer"
                          title="Edit Notice"
                        >
                          <BiEditAlt />
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDeleteNotice(notice.notice_id, notice.title)}
                          disabled={deletingId === notice.notice_id}
                          className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition text-sm cursor-pointer disabled:opacity-50"
                          title="Delete Notice"
                        >
                          {deletingId === notice.notice_id ? (
                            <BiLoaderAlt className="animate-spin" />
                          ) : (
                            <BiTrash />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

      </div>
    </div>
  )
}

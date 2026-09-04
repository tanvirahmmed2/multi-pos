'use client'
import React, { useState, useContext } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Context } from '@/component/helper/Context'
import TiptapEditor from '@/component/editor/TiptapEditor'
import {
  BiArrowBack,
  BiSave,
  BiLoaderAlt,
  BiPlus,
  BiMessageSquareDetail,
  BiCalendar
} from 'react-icons/bi'

export default function CreateNoticePage() {
  const router = useRouter()
  const { user, dashSidebar } = useContext(Context)

  const [title, setTitle] = useState('')
  const [noticeDate, setNoticeDate] = useState(() => new Date().toISOString().split('T')[0])
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (user && user.role !== 'admin') {
    return (
      <div className={`w-full min-h-screen bg-slate-50 pt-20 pb-12 px-4 md:px-8 transition-all duration-300 ${dashSidebar ? 'lg:pl-64' : 'lg:pl-8'} flex items-center justify-center`}>
        <div className="bg-white border border-slate-200 p-8 max-w-md w-full text-center flex flex-col items-center gap-3">
          <h2 className="text-lg font-bold text-slate-800">Access Denied</h2>
          <p className="text-xs text-slate-500">Only administrators can publish staff notices.</p>
          <Link href="/dashboard/notices" className="mt-2 px-4 py-2 bg-slate-800 text-white text-xs font-bold">
            Back to Notice Board
          </Link>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!title.trim()) {
      toast.error('Notice title is required')
      return
    }

    if (!description || description.trim() === '<p></p>' || !description.trim()) {
      toast.error('Notice description content is required')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        notice_date: noticeDate ? new Date(noticeDate).toISOString() : new Date().toISOString()
      }

      await axios.post('/api/notices', payload)
      toast.success('Notice published successfully!')
      router.push('/dashboard/notices')
    } catch (err) {
      console.error('Error creating notice:', err)
      toast.error(err.response?.data?.error || 'Failed to publish notice')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={`w-full min-h-screen bg-slate-50 pt-20 pb-12 px-2 sm:px-4 md:px-8 transition-all duration-300 ${dashSidebar ? 'lg:pl-64' : 'lg:pl-8'}`}>
      <div className="w-full max-w-4xl mx-auto flex flex-col gap-6">

        {/* Page Header */}
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
              <h1 className="text-xl md:text-2xl font-bold text-slate-800 flex items-center gap-2">
                <BiMessageSquareDetail className="text-primary text-2xl" />
                Publish Staff Notice
              </h1>
              <p className="text-slate-500 text-xs md:text-sm mt-0.5">
                Compose and publish official notice for all staff members using Tiptap editor.
              </p>
            </div>
          </div>
        </div>

        {/* Notice Form */}
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 p-6 flex flex-col gap-6 shadow-xs">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
            <div className="md:col-span-2 flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Notice Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Upcoming Store Maintenance & Inventory Count Notice"
                required
                className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 outline-none focus:border-slate-400 transition w-full"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                <BiCalendar className="text-primary" /> Notice Date
              </label>
              <input
                type="date"
                value={noticeDate}
                onChange={(e) => setNoticeDate(e.target.value)}
                className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 outline-none focus:border-slate-400 transition w-full cursor-pointer"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Notice Content & Description (Tiptap Rich Text) <span className="text-rose-500">*</span>
            </label>
            <TiptapEditor
              content={description}
              onChange={(html) => setDescription(html)}
              placeholder="Type detailed notice content, directives, instructions, or bullet points..."
            />
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <Link
              href="/dashboard/notices"
              className="px-5 py-2.5 border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold transition cursor-pointer"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-primary hover:bg-primary-dark text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <BiLoaderAlt className="animate-spin text-sm" /> Publishing...
                </>
              ) : (
                <>
                  <BiSave className="text-sm" /> Publish Notice
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  )
}

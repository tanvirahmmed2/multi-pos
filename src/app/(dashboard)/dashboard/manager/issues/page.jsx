'use client'
import React, { useContext, useEffect, useState } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Context } from '@/component/helper/Context'
import RichTextEditor from '@/component/helper/RichTextEditor'
import { 
  BiMessageSquareDetail, 
  BiSend, 
  BiTrash, 
  BiLoaderAlt, 
  BiSearch, 
  BiUser, 
  BiChevronRight,
  BiChevronDown,
  BiEnvelope
} from 'react-icons/bi'

export default function ManagerIssuesPage() {
  const { dashSidebar, user } = useContext(Context)
  const [receivers, setReceivers] = useState([])
  const [issues, setIssues] = useState([])
  
  // Tab states: 'inbox' or 'outbox'
  const [activeTab, setActiveTab] = useState('inbox')
  
  // Form states
  const [receiverId, setReceiverId] = useState('')
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  
  // UI states
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [expandedId, setExpandedId] = useState(null)
  const [search, setSearch] = useState('')

  const fetchData = async () => {
    try {
      const [recRes, issuesRes] = await Promise.all([
        axios.get('/api/issue?action=receivers'),
        axios.get('/api/issue')
      ])
      setReceivers(recRes.data)
      setIssues(issuesRes.data)
    } catch (err) {
      toast.error('Failed to load issues data')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!receiverId) {
      toast.error('Please select a recipient')
      return
    }
    const cleanMsg = message ? message.replace(/<[^>]*>/g, '').trim() : '';
    if (!title.trim() || !cleanMsg) {
      toast.error('Please fill in all fields')
      return
    }

    setSubmitting(true)
    try {
      await axios.post('/api/issue', {
        receiver_id: parseInt(receiverId, 10),
        title,
        message
      })
      toast.success('Notification sent successfully')
      setTitle('')
      setMessage('')
      setReceiverId('')
      // Reload issues and switch to outbox to see the sent message
      const res = await axios.get('/api/issue')
      setIssues(res.data)
      setActiveTab('outbox')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send message')
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (issueId) => {
    if (!window.confirm('Are you sure you want to withdraw/delete this notification?')) {
      return
    }
    setDeletingId(issueId)
    try {
      await axios.delete(`/api/issue/${issueId}`)
      toast.success('Message withdrawn successfully')
      setIssues(issues.filter(i => i.issue_id !== issueId))
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete message')
      console.error(err)
    } finally {
      setDeletingId(null)
    }
  }

  // Filter issues based on active tab and search query
  const displayIssues = issues.filter(i => {
    const isInbox = i.receiver_id === user?.user_id
    const isOutbox = i.sender_id === user?.user_id
    
    // Tab filter
    if (activeTab === 'inbox' && !isInbox) return false
    if (activeTab === 'outbox' && !isOutbox) return false
    
    // Search filter
    const term = search.toLowerCase()
    return (
      i.title.toLowerCase().includes(term) ||
      i.message.toLowerCase().includes(term) ||
      (i.sender_name && i.sender_name.toLowerCase().includes(term)) ||
      (i.receiver_name && i.receiver_name.toLowerCase().includes(term))
    )
  })

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id)
  }

  return (
    <div className={`w-full min-h-screen bg-slate-50 pt-20 pb-12 px-4 md:px-8 transition-all duration-300 ${dashSidebar ? 'lg:pl-68' : 'lg:pl-8'}`}>
      <div className="max-w-6xl mx-auto flex flex-col gap-6">
        
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2 animate-fade-in">
            <BiMessageSquareDetail className="text-emerald-600" />
            Issues Log & Staff Notifications
          </h1>
          <p className="text-slate-500 text-sm mt-0.5 animate-fade-in">Send announcements to sales staff or alert administrators about inventory issues.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Left: Compose Message Form */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col gap-5 animate-fade-in">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-50 pb-2">Compose Notification</h2>
            
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              
              {/* Recipient */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700">Recipient Staff <span className="text-red-500">*</span></label>
                <select
                  required
                  value={receiverId}
                  onChange={(e) => setReceiverId(e.target.value)}
                  className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-850 text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition"
                >
                  <option value="">-- Choose Recipient --</option>
                  {receivers.map(r => (
                    <option key={r.user_id} value={r.user_id}>
                      {r.name} ({r.role}) - {r.email}
                    </option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700">Subject / Title <span className="text-red-500">*</span></label>
                <input className="input-style"
                  type="text"
                  required
                  placeholder="e.g. System maintenance alert"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              {/* Message */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700">Message Description <span className="text-red-500">*</span></label>
                <RichTextEditor value={message} onChange={setMessage} />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-2 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition cursor-pointer flex items-center justify-center gap-2 shadow-sm shadow-emerald-600/10"
              >
                {submitting ? (
                  <>
                    <BiLoaderAlt className="animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <BiSend /> Send Message
                  </>
                )}
              </button>

            </form>
          </div>

          {/* Right: Inbox/Outbox list */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            
            {/* Tabs Header */}
            <div className="flex items-center justify-between bg-white rounded-xl border border-slate-100 p-2 shadow-sm animate-fade-in">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('inbox')
                    setExpandedId(null)
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'inbox' 
                      ? 'bg-emerald-600 text-white shadow-sm' 
                      : 'text-slate-650 hover:bg-slate-50'
                  }`}
                >
                  <BiEnvelope className="text-lg" /> Inbox
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('outbox')
                    setExpandedId(null)
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'outbox' 
                      ? 'bg-emerald-600 text-white shadow-sm' 
                      : 'text-slate-650 hover:bg-slate-50'
                  }`}
                >
                  <BiSend className="text-lg" /> Outbox
                </button>
              </div>

              {/* Search bar inside Tabs */}
              <div className="relative max-w-[200px] sm:max-w-xs w-full">
                <BiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                <input className="input-style"
                  type="text"
                  placeholder="Search messages..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            {/* List card */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col gap-4 animate-fade-in">
              
              {loading ? (
                <div className="w-full h-48 flex items-center justify-center text-slate-500 gap-2">
                  <BiLoaderAlt className="animate-spin text-xl text-emerald-600" />
                  <span>Loading messages...</span>
                </div>
              ) : displayIssues.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {displayIssues.map((issue) => {
                    const isExpanded = expandedId === issue.issue_id;
                    const displayRole = activeTab === 'inbox' ? issue.sender_role : issue.receiver_role;
                    const displayName = activeTab === 'inbox' ? issue.sender_name : issue.receiver_name;
                    const partnerText = activeTab === 'inbox' ? 'From' : 'To';
                    
                    return (
                      <div 
                        key={issue.issue_id} 
                        className="border border-slate-100 rounded-xl hover:border-slate-200 transition bg-slate-50/20 overflow-hidden"
                      >
                        {/* Summary Header */}
                        <div 
                          onClick={() => toggleExpand(issue.issue_id)}
                          className="p-4 flex items-center justify-between gap-4 cursor-pointer select-none"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-semibold text-slate-500">{partnerText}:</span>
                              <span className="text-xs font-bold text-slate-850 flex items-center gap-1">
                                <BiUser className="text-slate-400" />
                                {displayName || 'Walk-in User'}
                              </span>
                              <span className="px-1.5 py-0.2 rounded text-xxs font-semibold bg-slate-100 text-slate-650 uppercase">
                                {displayRole}
                              </span>
                            </div>
                            <h3 className="font-semibold text-slate-800 text-sm mt-1 truncate">{issue.title}</h3>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-xxs text-slate-400 font-mono">
                              {new Date(issue.created_at).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                            {isExpanded ? <BiChevronDown className="text-lg text-slate-500" /> : <BiChevronRight className="text-lg text-slate-500" />}
                          </div>
                        </div>

                        {/* Collapsible Content */}
                        {isExpanded && (
                          <div className="px-4 pb-4 pt-1 border-t border-slate-100/50 bg-white flex flex-col gap-3">
                            <div 
                              className="text-slate-650 text-xs leading-relaxed ProseMirror"
                              dangerouslySetInnerHTML={{ __html: issue.message }}
                            />
                            
                            <div className="flex justify-between items-center border-t border-slate-50 pt-2.5 mt-1">
                              <span className="text-xxs text-slate-400 font-mono">Log ID: #{issue.issue_id}</span>
                              {activeTab === 'outbox' ? (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(issue.issue_id);
                                  }}
                                  disabled={deletingId === issue.issue_id}
                                  className="px-2.5 py-1 text-xxs font-semibold text-rose-650 hover:bg-rose-50 rounded transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                >
                                  {deletingId === issue.issue_id ? (
                                    <BiLoaderAlt className="animate-spin" />
                                  ) : (
                                    <BiTrash />
                                  )}
                                  Withdraw Message
                                </button>
                              ) : (
                                <span className="text-xxs text-slate-400 italic">Read-only notification</span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="w-full py-12 flex flex-col items-center justify-center text-slate-400 gap-1.5">
                  <BiMessageSquareDetail className="text-3xl text-slate-300" />
                  <p className="font-semibold text-slate-600 text-sm">
                    {activeTab === 'inbox' ? 'Your inbox is empty' : 'No messages sent yet'}
                  </p>
                  <p className="text-xxs text-slate-400">
                    {activeTab === 'inbox' 
                      ? 'When staff members send you messages, they will appear here.' 
                      : 'Send notifications to your staff using the compose form.'}
                  </p>
                </div>
              )}

            </div>

          </div>

        </div>

      </div>
    </div>
  )
}

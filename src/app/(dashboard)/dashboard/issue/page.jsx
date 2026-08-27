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
  BiChevronRight,
  BiChevronDown,
  BiFilterAlt,
  BiShieldQuarter
} from 'react-icons/bi'

export default function AdminIssueLogPage() {
  const { dashSidebar, user } = useContext(Context)
  const [receivers, setReceivers] = useState([])
  const [issues, setIssues] = useState([])
  
  const [filterType, setFilterType] = useState('all') 
  const [filterRole, setFilterRole] = useState('all') 
  const [search, setSearch] = useState('')

  const [receiverId, setReceiverId] = useState('')
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [expandedId, setExpandedId] = useState(null)

  const fetchData = async () => {
    try {
      const [recRes, issuesRes] = await Promise.all([
        axios.get('/api/issue?action=receivers'),
        axios.get('/api/issue')
      ])
      setReceivers(recRes.data)
      setIssues(issuesRes.data)
    } catch (err) {
      toast.error('Failed to load issue logs')
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
      toast.success('Notification broadcasted successfully')
      setTitle('')
      setMessage('')
      setReceiverId('')
      const res = await axios.get('/api/issue')
      setIssues(res.data)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send message')
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (issueId) => {
    if (!window.confirm('WARNING: As Admin, deleting this message will purge it permanently from the entire database log. Are you sure you want to proceed?')) {
      return
    }
    setDeletingId(issueId)
    try {
      await axios.delete(`/api/issue/${issueId}`)
      toast.success('Issue log purged successfully')
      setIssues(issues.filter(i => i.issue_id !== issueId))
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to purge log')
      console.error(err)
    } finally {
      setDeletingId(null)
    }
  }

  const displayIssues = issues.filter(i => {
    if (filterType === 'sent' && i.sender_id !== user?.user_id) return false
    if (filterType === 'received' && i.receiver_id !== user?.user_id) return false

    if (filterRole !== 'all') {
      const isSenderRoleMatch = i.sender_role === filterRole
      const isReceiverRoleMatch = i.receiver_role === filterRole
      if (!isSenderRoleMatch && !isReceiverRoleMatch) return false
    }

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
    <div className={`w-full min-h-screen bg-[#F1F5F9] pt-20 pb-12 px-4 md:px-8 transition-all duration-300 ${dashSidebar ? 'lg:pl-64' : 'lg:pl-8'}`}>
      <div className="w-full max-w-7xl mx-auto flex flex-col gap-6">
        
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-800 flex items-center gap-2">
            <BiShieldQuarter className="text-[#73976A]" />
            Audit Issue Logs & Broadcasts
          </h1>
          <p className="text-slate-500 text-xs md:text-sm mt-0.5">Centralized messaging logs audit and administrator alert broadcasting controls.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 md:p-6 flex flex-col gap-5">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">Broadcast Message</h2>
            
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">Recipient Staff <span className="text-[#BD4444]">*</span></label>
                <select
                  required
                  value={receiverId}
                  onChange={(e) => setReceiverId(e.target.value)}
                  className="px-3 py-2.5 bg-[#F1F5F9] border border-slate-200 rounded-xl text-slate-800 text-xs md:text-sm focus:bg-white focus:ring-2 focus:ring-[#73976A]/20 focus:border-[#73976A] outline-none transition"
                >
                  <option value="">-- Choose Recipient --</option>
                  {receivers.map(r => (
                    <option key={r.user_id} value={r.user_id}>
                      {r.name} ({r.role}) - {r.email}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">Subject / Title <span className="text-[#BD4444]">*</span></label>
                <input className="input-style border border-slate-200 focus:border-[#73976A]"
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">Message Description <span className="text-[#BD4444]">*</span></label>
                <RichTextEditor value={message} onChange={setMessage} placeholder="Details of notification or directive..." />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-2 py-2.5 bg-[#73976A] hover:bg-[#607E59] text-white rounded-xl text-xs md:text-sm font-bold transition cursor-pointer flex items-center justify-center gap-2 shadow-xs"
              >
                {submitting ? (
                  <>
                    <BiLoaderAlt className="animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <BiSend /> Send Announcement
                  </>
                )}
              </button>

            </form>
          </div>

          <div className="lg:col-span-2 flex flex-col gap-4">
            
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 flex flex-col sm:flex-row items-center gap-4 justify-between">
              
              <div className="flex gap-1.5 border-b sm:border-b-0 border-slate-100 pb-2 sm:pb-0 w-full sm:w-auto">
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                    filterType === 'all' ? 'bg-[#73976A] text-white' : 'text-slate-600 hover:bg-[#F1F5F9]'
                  }`}
                >
                  All Logs
                </button>
                <button
                  onClick={() => setFilterType('sent')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                    filterType === 'sent' ? 'bg-[#73976A] text-white' : 'text-slate-600 hover:bg-[#F1F5F9]'
                  }`}
                >
                  Sent
                </button>
                <button
                  onClick={() => setFilterType('received')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                    filterType === 'received' ? 'bg-[#73976A] text-white' : 'text-slate-600 hover:bg-[#F1F5F9]'
                  }`}
                >
                  Received
                </button>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <div className="flex items-center gap-1.5 shrink-0">
                  <BiFilterAlt className="text-slate-400 text-sm" />
                  <select
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                    className="px-2.5 py-1 bg-[#F1F5F9] border border-slate-200 rounded-lg text-slate-700 text-xs font-bold focus:bg-white outline-none cursor-pointer"
                  >
                    <option value="all">Any Staff Role</option>
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                    <option value="sales">Sales</option>
                  </select>
                </div>

                <div className="relative max-w-[180px] w-full">
                  <BiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                  <input className="input-style pl-7 text-xs border border-slate-200 focus:border-[#73976A]"
                    type="text"
                    placeholder="Search..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>

            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 md:p-6 flex flex-col gap-4">
              
              {loading ? (
                <div className="w-full h-48 flex items-center justify-center text-slate-500 gap-2">
                  <BiLoaderAlt className="animate-spin text-xl text-[#73976A]" />
                  <span>Loading audit logs...</span>
                </div>
              ) : displayIssues.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {displayIssues.map((issue) => {
                    const isExpanded = expandedId === issue.issue_id;
                    
                    return (
                      <div 
                        key={issue.issue_id} 
                        className="border border-slate-200 rounded-xl hover:border-[#73976A]/40 transition overflow-hidden bg-[#F1F5F9]/30"
                      >
                        <div 
                          onClick={() => toggleExpand(issue.issue_id)}
                          className="p-4 flex items-center justify-between gap-4 cursor-pointer select-none"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 text-xs text-slate-500 flex-wrap">
                              <span className="font-bold text-slate-800">{issue.sender_name}</span>
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#73976A]/10 text-[#73976A] font-bold uppercase">
                                {issue.sender_role}
                              </span>
                              <span className="text-slate-400">➔</span>
                              <span className="font-bold text-slate-800">{issue.receiver_name}</span>
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-600 font-bold uppercase">
                                {issue.receiver_role}
                              </span>
                            </div>
                            <h3 className="font-bold text-slate-800 text-xs md:text-sm mt-1.5 truncate">{issue.title}</h3>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-[10px] text-slate-400 font-mono">
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

                        {isExpanded && (
                          <div className="px-4 pb-4 pt-2 border-t border-slate-200 bg-white flex flex-col gap-3">
                            <div 
                              className="text-slate-700 text-xs leading-relaxed ProseMirror"
                              dangerouslySetInnerHTML={{ __html: issue.message }}
                            />
                            
                            <div className="flex justify-between items-center border-t border-slate-100 pt-2.5 mt-1">
                              <span className="text-[10px] text-slate-400 font-mono">Master Audit Log ID: #{issue.issue_id}</span>
                              
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(issue.issue_id);
                                }}
                                disabled={deletingId === issue.issue_id}
                                className="px-2.5 py-1 text-xs font-bold text-[#BD4444] hover:bg-[#BD4444]/10 rounded transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                              >
                                {deletingId === issue.issue_id ? (
                                  <BiLoaderAlt className="animate-spin" />
                                ) : (
                                  <BiTrash />
                                )}
                                Purge Log
                              </button>
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
                  <p className="font-bold text-slate-600 text-sm">No audit logs found</p>
                  <p className="text-xs text-slate-400">No issue notifications match your filter/search criteria.</p>
                </div>
              )}

            </div>

          </div>

        </div>

      </div>
    </div>
  )
}


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
  BiEnvelope,
  BiCheckCircle,
  BiTime,
  BiConversation
} from 'react-icons/bi'

export default function DashboardManagerContactPage() {
  const { dashSidebar, user } = useContext(Context)
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  
  const [activeTab, setActiveTab] = useState('pending')
  
  const [replyMessage, setReplyMessage] = useState('')
  const [submittingReplyId, setSubmittingReplyId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [expandedId, setExpandedId] = useState(null)

  const fetchContacts = async () => {
    try {
      const res = await axios.get('/api/contact')
      setContacts(res.data)
    } catch (err) {
      toast.error('Failed to load contact inquiries')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchContacts()
  }, [])

  const handleReplySubmit = async (e, contactId) => {
    e.preventDefault()
    const cleanMsg = replyMessage ? replyMessage.replace(/<[^>]*>/g, '').trim() : '';
    if (!cleanMsg) {
      toast.error('Reply message cannot be empty.')
      return
    }

    setSubmittingReplyId(contactId)
    try {
      await axios.post(`/api/contact/${contactId}/reply`, {
        message: replyMessage
      })
      toast.success('Reply submitted and email dispatched to customer!')
      setReplyMessage('')
      setExpandedId(null)
      fetchContacts() 
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit reply.')
      console.error(err)
    } finally {
      setSubmittingReplyId(null)
    }
  }

  const handleDelete = async (contactId) => {
    if (!window.confirm('WARNING: Deleting this inquiry will purge it and all reply threads. Are you sure you want to proceed?')) {
      return
    }
    setDeletingId(contactId)
    try {
      await axios.delete(`/api/contact/${contactId}`)
      toast.success('Inquiry deleted successfully')
      setContacts(contacts.filter(c => c.contact_id !== contactId))
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete inquiry.')
      console.error(err)
    } finally {
      setDeletingId(null)
    }
  }

  const filteredContacts = contacts.filter((c) => {
    const isTabMatch = c.status === activeTab
    if (!isTabMatch) return false
    
    const term = search.toLowerCase()
    return (
      c.name.toLowerCase().includes(term) ||
      c.email.toLowerCase().includes(term) ||
      c.subject.toLowerCase().includes(term) ||
      c.message.toLowerCase().includes(term)
    )
  })

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id)
    setReplyMessage('')
  }

  return (
    <div className={`w-full min-h-screen bg-slate-50 pt-20 pb-12 px-4 md:px-8 transition-all duration-300 ${dashSidebar ? 'lg:pl-68' : 'lg:pl-8'}`}>
      <div className="max-w-6xl mx-auto flex flex-col gap-6">
        
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2 animate-fade-in">
            <BiConversation className="text-emerald-600" />
            Customer Contact Center
          </h1>
          <p className="text-slate-500 text-sm mt-0.5 animate-fade-in">Answer customer inquiries, dispatch responses via mailer, and review reply histories.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white rounded-2xl border border-slate-100 p-3 shadow-sm animate-fade-in">
          
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={() => {
                setActiveTab('pending')
                setExpandedId(null)
              }}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'pending' 
                  ? 'bg-amber-600 text-white shadow-sm shadow-amber-600/10' 
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <BiTime className="text-lg" /> Pending Inquiries
            </button>
            <button
              onClick={() => {
                setActiveTab('replied')
                setExpandedId(null)
              }}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'replied' 
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/10' 
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <BiCheckCircle className="text-lg" /> Replied Inquiries
            </button>
          </div>

          <div className="relative max-w-sm w-full">
            <BiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base" />
            <input className="input-style"
              type="text"
              placeholder="Search by name, email, subject..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col gap-4 animate-fade-in">
          
          {loading ? (
            <div className="w-full h-64 flex items-center justify-center text-slate-500 gap-2">
              <BiLoaderAlt className="animate-spin text-xl text-emerald-600" />
              <span>Loading customer messages...</span>
            </div>
          ) : filteredContacts.length > 0 ? (
            <div className="flex flex-col gap-4">
              {filteredContacts.map((contact) => {
                const isExpanded = expandedId === contact.contact_id
                const isReplied = contact.status === 'replied'
                
                return (
                  <div 
                    key={contact.contact_id} 
                    className={`border border-slate-100 rounded-2xl hover:border-slate-200 transition bg-slate-50/20 overflow-hidden ${
                      isExpanded ? 'ring-2 ring-emerald-500/10 border-emerald-200/55' : ''
                    }`}
                  >
                    
                    <div 
                      onClick={() => toggleExpand(contact.contact_id)}
                      className="p-5 flex items-center justify-between gap-4 cursor-pointer select-none"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-800 text-sm">{contact.name}</span>
                          <span className="text-slate-450 text-xs mt-0.5 flex items-center gap-1">
                            <BiEnvelope className="text-slate-400" />
                            {contact.email}
                          </span>
                        </div>
                        <h3 className="font-semibold text-slate-750 text-base mt-2 truncate text-slate-800">
                          {contact.subject}
                        </h3>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xxs text-slate-400 font-mono">
                          {new Date(contact.created_at).toLocaleDateString(undefined, {
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
                      <div className="px-5 pb-5 pt-2 border-t border-slate-100/50 bg-white flex flex-col gap-5">
                        
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 flex flex-col gap-1.5">
                          <span className="text-xxs font-bold text-slate-450 uppercase tracking-widest">Customer Message</span>
                          <div 
                            className="text-slate-650 text-sm leading-relaxed ProseMirror font-medium"
                            dangerouslySetInnerHTML={{ __html: contact.message }}
                          />
                        </div>

                        {contact.replies && contact.replies.length > 0 && (
                          <div className="flex flex-col gap-3">
                            <span className="text-xxs font-bold text-slate-450 uppercase tracking-widest">Responses History</span>
                            
                            {contact.replies.map((reply, idx) => (
                              <div key={reply.reply_id || idx} className="bg-slate-50/50 border border-slate-150 p-4 rounded-xl flex flex-col gap-2">
                                <div className="flex justify-between items-center text-xs flex-wrap gap-2 border-b border-slate-150 pb-1.5">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-slate-800">{reply.user_name}</span>
                                    <span className="px-1.5 py-0.2 rounded text-xxs font-semibold bg-emerald-50 text-emerald-700 uppercase">
                                      {reply.user_role}
                                    </span>
                                  </div>
                                  <span className="text-xxs text-slate-400 font-mono">
                                    {new Date(reply.created_at).toLocaleString()}
                                  </span>
                                </div>
                                <div 
                                  className="text-slate-650 text-xs leading-relaxed ProseMirror"
                                  dangerouslySetInnerHTML={{ __html: reply.message }}
                                />
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="border-t border-slate-100 pt-4 mt-2">
                          {isReplied ? (
                            <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 p-4 rounded-xl flex items-center gap-2 text-xs font-semibold">
                              <BiCheckCircle className="text-lg text-emerald-650 shrink-0" />
                              <span>This inquiry has already been replied to. Replying is disabled to prevent duplicate customer mail dispatch.</span>
                            </div>
                          ) : (
                            <form onSubmit={(e) => handleReplySubmit(e, contact.contact_id)} className="flex flex-col gap-3">
                              <label className="text-xs font-bold text-slate-700 uppercase">Send Reply Response (via Mailer) <span className="text-red-500">*</span></label>
                              <RichTextEditor
                                value={replyMessage}
                                onChange={setReplyMessage}
                                placeholder="Type support response to be emailed to client..."
                              />
                              
                              <div className="flex justify-between items-center mt-1">
                                <span className="text-xxs text-slate-400">Client will receive your reply immediately via Brevo SMTP</span>
                                <button
                                  type="submit"
                                  disabled={submittingReplyId === contact.contact_id}
                                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 shadow-sm shadow-emerald-600/10"
                                >
                                  {submittingReplyId === contact.contact_id ? (
                                    <>
                                      <BiLoaderAlt className="animate-spin" />
                                      Sending...
                                    </>
                                  ) : (
                                    <>
                                      <BiSend /> Send Email Reply
                                    </>
                                  )}
                                </button>
                              </div>
                            </form>
                          )}
                        </div>

                        <div className="flex justify-between items-center border-t border-slate-100 pt-3 mt-1">
                          <span className="text-xxs text-slate-400 font-mono">Inquiry Log ID: #{contact.contact_id}</span>
                          <button
                            onClick={() => handleDelete(contact.contact_id)}
                            disabled={deletingId === contact.contact_id}
                            className="px-2.5 py-1 text-xxs font-bold text-rose-650 hover:bg-rose-50 rounded transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                          >
                            {deletingId === contact.contact_id ? (
                              <BiLoaderAlt className="animate-spin" />
                            ) : (
                              <BiTrash />
                            )}
                            Delete Inquiry Log
                          </button>
                        </div>

                      </div>
                    )}

                  </div>
                )
              })}
            </div>
          ) : (
            <div className="w-full py-16 flex flex-col items-center justify-center text-slate-400 gap-1.5">
              <BiMessageSquareDetail className="text-4xl text-slate-300" />
              <p className="font-semibold text-slate-600">No contact inquiries found</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {activeTab === 'pending' 
                  ? 'All customer inquiries have been successfully responded to!' 
                  : 'Customer inquiries replied by managers will appear in this log.'}
              </p>
            </div>
          )}

        </div>

      </div>
    </div>
  )
}

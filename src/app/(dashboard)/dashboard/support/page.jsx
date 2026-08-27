'use client'
import React, { useContext, useEffect, useState, useRef } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { Context } from '@/component/helper/Context'
import RichTextEditor from '@/component/helper/RichTextEditor'
import { 
  BiMessageSquareDetail, 
  BiSend, 
  BiLoaderAlt, 
  BiCheckCircle, 
  BiTime, 
  BiChevronRight,
  BiChevronLeft,
  BiRefresh,
  BiSupport,
  BiSearch,
  BiTrash,
  BiUser,
  BiEnvelope,
  BiDetail,
  BiCog,
  BiX
} from 'react-icons/bi'

export default function DashboardManagerSupportPage() {
  const { user, dashSidebar, loading: userLoading } = useContext(Context)
  const [tickets, setTickets] = useState([])
  const [activeTicket, setActiveTicket] = useState(null)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('all') 
  const [ticketsLoading, setTicketsLoading] = useState(true)
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  const [replyMessage, setReplyMessage] = useState('')
  const [submittingMessage, setSubmittingMessage] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [updatingPriority, setUpdatingPriority] = useState(false)

  const messagesEndRef = useRef(null)

  const fetchTickets = async (silent = false) => {
    if (!silent) setTicketsLoading(true)
    try {
      const res = await axios.get('/api/support')
      setTickets(res.data)
    } catch (err) {
      toast.error('Failed to load support tickets')
      console.error(err)
    } finally {
      if (!silent) setTicketsLoading(false)
    }
  }

  const fetchTicketDetails = async (id, silent = false) => {
    if (!silent) setMessagesLoading(true)
    try {
      const res = await axios.get(`/api/support/${id}`)
      setActiveTicket(res.data)
    } catch (err) {
      toast.error('Failed to load ticket details')
      console.error(err)
    } finally {
      if (!silent) setMessagesLoading(false)
    }
  }

  useEffect(() => {
    if (user && ['admin', 'manager', 'sales'].includes(user.role)) {
      fetchTickets()
    }
  }, [user])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeTicket?.messages])

  useEffect(() => {
    if (!activeTicket) return
    const interval = setInterval(() => {
      fetchTicketDetails(activeTicket.ticket.support_id, true)
    }, 10000)
    return () => clearInterval(interval)
  }, [activeTicket?.ticket?.support_id])

  const handleSendMessage = async (e) => {
    e.preventDefault()
    const cleanMsg = replyMessage ? replyMessage.replace(/<[^>]*>/g, '').trim() : '';
    if (!cleanMsg || !activeTicket) return

    setSubmittingMessage(true)
    const ticketId = activeTicket.ticket.support_id
    try {
      await axios.post(`/api/support/${ticketId}/message`, {
        message: replyMessage
      })
      setReplyMessage('')
      toast.success('Reply submitted and email dispatched!')
      await fetchTicketDetails(ticketId, true)
      fetchTickets(true) 
    } catch (err) {
      toast.error('Failed to send message response')
      console.error(err)
    } finally {
      setSubmittingMessage(false)
    }
  }

  const handleStatusChange = async (newStatus) => {
    if (!activeTicket) return
    setUpdatingStatus(true)
    const ticketId = activeTicket.ticket.support_id
    try {
      await axios.patch(`/api/support/${ticketId}`, {
        status: newStatus
      })
      toast.success(`Ticket status updated to ${newStatus}`)
      await fetchTicketDetails(ticketId, true)
      fetchTickets(true)
    } catch (err) {
      toast.error('Failed to update ticket status')
      console.error(err)
    } finally {
      setUpdatingStatus(false)
    }
  }

  const handlePriorityChange = async (newPriority) => {
    if (!activeTicket) return
    setUpdatingPriority(true)
    const ticketId = activeTicket.ticket.support_id
    try {
      await axios.patch(`/api/support/${ticketId}`, {
        priority: newPriority
      })
      toast.success(`Ticket priority updated to ${newPriority}`)
      await fetchTicketDetails(ticketId, true)
      fetchTickets(true)
    } catch (err) {
      toast.error('Failed to update priority level')
      console.error(err)
    } finally {
      setUpdatingPriority(false)
    }
  }

  const handleDelete = async (ticketId) => {
    if (!window.confirm('CRITICAL WARNING: Purging this ticket will permanently delete it and all its messages. Are you sure you want to delete this ticket?')) {
      return
    }
    setDeletingId(ticketId)
    try {
      await axios.delete(`/api/support/${ticketId}`)
      toast.success('Support ticket deleted successfully')
      setTickets(tickets.filter((t) => t.support_id !== ticketId))
      if (activeTicket?.ticket?.support_id === ticketId) {
        setActiveTicket(null)
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete ticket')
      console.error(err)
    } finally {
      setDeletingId(null)
    }
  }

  const filteredTickets = tickets.filter((ticket) => {
    if (activeTab === 'pending' && ticket.status !== 'pending') return false
    if (activeTab === 'active' && !['open', 'in_progress'].includes(ticket.status)) return false
    if (activeTab === 'resolved' && !['resolved', 'closed'].includes(ticket.status)) return false

    const term = search.toLowerCase()
    return (
      ticket.subject.toLowerCase().includes(term) ||
      ticket.user_name?.toLowerCase().includes(term) ||
      ticket.user_email?.toLowerCase().includes(term) ||
      ticket.description?.toLowerCase().includes(term) ||
      ticket.support_id.toString().includes(term)
    )
  })

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200">Pending</span>
      case 'open':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-sky-50 text-sky-700 border border-sky-200">Open</span>
      case 'in_progress':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200">In Progress</span>
      case 'resolved':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Resolved</span>
      case 'closed':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-700 border border-slate-200">Closed</span>
      default:
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-600">{status}</span>
    }
  }

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'low':
        return <span className="px-2 py-0.5 text-xxs font-bold rounded-md bg-slate-150 text-slate-600 uppercase bg-slate-100">Low</span>
      case 'medium':
        return <span className="px-2 py-0.5 text-xxs font-bold rounded-md bg-blue-50 text-blue-700 uppercase">Medium</span>
      case 'high':
        return <span className="px-2 py-0.5 text-xxs font-bold rounded-md bg-orange-50 text-orange-700 uppercase">High</span>
      case 'urgent':
        return <span className="px-2 py-0.5 text-xxs font-bold rounded-md bg-rose-50 text-rose-705 uppercase animate-pulse">Urgent</span>
      default:
        return <span className="px-2 py-0.5 text-xxs font-bold rounded-md bg-slate-100 text-slate-600 uppercase">{priority}</span>
    }
  }

  if (userLoading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-slate-50">
        <BiLoaderAlt className="animate-spin text-4xl text-emerald-600" />
      </div>
    )
  }

  return (
    <div className={`w-full min-h-screen bg-slate-50 pt-20 pb-12 px-4 md:px-8 transition-all duration-300 ${dashSidebar ? 'lg:pl-68' : 'lg:pl-8'}`}>
      <div className="max-w-7xl mx-auto flex flex-col gap-6 h-[calc(100vh-8.5rem)] min-h-[500px]">
        
        <div className="flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <BiSupport className="text-emerald-600" />
              Customer Support Console
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">Manage customer support tickets, update urgency levels, and chat directly with patrons.</p>
          </div>
          <button
            onClick={() => fetchTickets()}
            disabled={ticketsLoading}
            className="p-2 border border-slate-200 hover:bg-slate-100 rounded-xl text-slate-600 transition disabled:opacity-50"
          >
            <BiRefresh className={`text-lg ${ticketsLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="flex-1 flex gap-6 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden min-h-0">
          
          <div className={`w-full md:w-96 border-r border-slate-100 flex flex-col min-h-0 shrink-0 ${activeTicket ? 'hidden md:flex' : 'flex'}`}>
            
            <div className="p-4 border-b border-slate-100 flex flex-col gap-3 shrink-0">
              <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
                {['all', 'pending', 'active', 'resolved'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-1.5 rounded-lg text-xxs font-bold uppercase transition cursor-pointer text-center ${
                      activeTab === tab
                        ? 'bg-white text-slate-800 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="relative">
                <BiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                <input className="input-style"
                  type="text"
                  placeholder="Search by ID, customer, subject..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="flex-1 p-3 flex flex-col gap-2 bg-slate-50/20">
              {ticketsLoading && tickets.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-400 text-xs gap-1.5">
                  <BiLoaderAlt className="animate-spin text-base" /> Loading support tickets...
                </div>
              ) : filteredTickets.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-400 gap-1.5">
                  <BiMessageSquareDetail className="text-3xl text-slate-300" />
                  <p className="text-xs font-semibold text-slate-500">No support tickets found</p>
                  <p className="text-xxs text-slate-400">Tickets matching your search criteria will appear here.</p>
                </div>
              ) : (
                filteredTickets.map((ticket) => {
                  const isActive = activeTicket?.ticket?.support_id === ticket.support_id
                  return (
                    <div
                      key={ticket.support_id}
                      onClick={() => fetchTicketDetails(ticket.support_id)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition select-none flex flex-col gap-1 ${
                        isActive
                          ? 'bg-[#73976A] border-[#607E59] text-white shadow-xs'
                          : 'bg-white hover:bg-slate-50 border-slate-100 hover:border-slate-200 text-slate-800'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-1.5">
                        <span className={`text-xs font-bold truncate flex-1`}>{ticket.user_name}</span>
                        <span className="text-xxs font-mono shrink-0 opacity-60">#{ticket.support_id}</span>
                      </div>
                      
                      <div className={`text-xxs font-medium line-clamp-1 ${isActive ? 'text-slate-300' : 'text-slate-650'}`}>
                        {ticket.subject}
                      </div>

                      <div className="flex justify-between items-center mt-1.5">
                        <div className="flex items-center gap-1.5">
                          {getPriorityBadge(ticket.priority)}
                        </div>
                        <span className="text-xxs font-semibold uppercase tracking-wider">
                          {ticket.status}
                        </span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

          </div>

          <div className={`flex-1 flex flex-col min-h-0 bg-slate-50/10 ${!activeTicket ? 'hidden md:flex items-center justify-center text-slate-400 p-8' : 'flex'}`}>
            {activeTicket ? (
              <div className="flex-1 flex flex-col min-h-0">
                
                <div className="p-4 bg-white border-b border-slate-100 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 shrink-0 shadow-xs">
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button 
                        onClick={() => setActiveTicket(null)}
                        className="md:hidden p-1 hover:bg-slate-100 rounded-lg text-slate-600 mr-1"
                      >
                        <BiChevronRight className="rotate-180 text-xl" />
                      </button>
                      <h3 className="font-bold text-slate-800 text-sm truncate">{activeTicket.ticket.subject}</h3>
                      <span className="text-xxs font-mono text-slate-400">ID: #{activeTicket.ticket.support_id}</span>
                    </div>

                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      <span className="text-xxs font-bold text-slate-600 flex items-center gap-1">
                        <BiUser className="text-slate-450 text-sm" />
                        {activeTicket.ticket.user_name}
                      </span>
                      <span className="text-xxs font-bold text-slate-450 flex items-center gap-1">
                        <BiEnvelope className="text-slate-400 text-sm" />
                        {activeTicket.ticket.user_email}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 flex-wrap">
                    
                    <div className="flex items-center gap-1.5">
                      <span className="text-xxs font-bold text-slate-450 uppercase">Status:</span>
                      <div className="relative">
                        <select
                          disabled={updatingStatus}
                          value={activeTicket.ticket.status}
                          onChange={(e) => handleStatusChange(e.target.value)}
                          className="px-2.5 py-1.5 bg-slate-50 border border-slate-205 rounded-xl text-slate-700 text-xs font-semibold focus:ring-2 focus:ring-emerald-500/20 outline-none transition pr-6 cursor-pointer appearance-none"
                        >
                          <option value="pending">Pending</option>
                          <option value="open">Open</option>
                          <option value="in_progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                          <option value="closed">Closed</option>
                        </select>
                        <BiChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none text-base" />
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-xxs font-bold text-slate-450 uppercase">Priority:</span>
                      <div className="relative">
                        <select
                          disabled={updatingPriority}
                          value={activeTicket.ticket.priority}
                          onChange={(e) => handlePriorityChange(e.target.value)}
                          className="px-2.5 py-1.5 bg-slate-50 border border-slate-205 rounded-xl text-slate-705 text-xs font-semibold focus:ring-2 focus:ring-emerald-500/20 outline-none transition pr-6 cursor-pointer appearance-none"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="urgent">Urgent</option>
                        </select>
                        <BiChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none text-base" />
                      </div>
                    </div>

                    {['admin', 'manager'].includes(user.role) && (
                      <button
                        onClick={() => handleDelete(activeTicket.ticket.support_id)}
                        disabled={deletingId === activeTicket.ticket.support_id}
                        className="p-1.5 text-rose-650 hover:bg-rose-50 rounded-xl transition cursor-pointer border border-transparent hover:border-rose-100"
                        title="Delete Support Ticket Log"
                      >
                        {deletingId === activeTicket.ticket.support_id ? (
                          <BiLoaderAlt className="animate-spin text-sm" />
                        ) : (
                          <BiTrash className="text-lg" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex-1 p-4 flex flex-col gap-3.5 bg-slate-50/40">
                  
                  <div className="bg-white p-4 rounded-xl border border-slate-205 shadow-sm max-w-3xl mx-auto w-full flex flex-col gap-2">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                      <span className="text-xxs font-bold text-slate-450 uppercase tracking-widest">Initial Ticket Description</span>
                      <span className="text-xxs text-slate-400 font-mono">
                        {new Date(activeTicket.ticket.created_at).toLocaleString()}
                      </span>
                    </div>
                     <div 
                       className="text-xs text-slate-750 leading-relaxed ProseMirror"
                       dangerouslySetInnerHTML={{ __html: activeTicket.ticket.description || '<span class="italic text-slate-400">No description supplied.</span>' }}
                     />
                  </div>

                  <div className="w-full flex items-center justify-center my-2 shrink-0">
                    <div className="h-px bg-slate-100 w-1/4"></div>
                    <span className="text-xxs font-bold text-slate-400 uppercase tracking-widest px-2.5">Correspondence history</span>
                    <div className="h-px bg-slate-100 w-1/4"></div>
                  </div>

                  {messagesLoading ? (
                    <div className="flex-1 flex items-center justify-center text-slate-450 text-xs gap-1">
                      <BiLoaderAlt className="animate-spin" /> Fetching details...
                    </div>
                  ) : activeTicket.messages?.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 gap-1.5">
                      <BiMessageSquareDetail className="text-3xl text-slate-300" />
                      <p className="text-xs font-semibold text-slate-500 font-medium">No exchange messages yet</p>
                      <p className="text-xxs text-slate-400">Customer has not received any replies. Type a response below to initiate correspondence.</p>
                    </div>
                  ) : (
                    activeTicket.messages.map((msg) => {
                      const isCustomer = msg.sender_id === activeTicket.ticket.user_id
                      const isSupportRole = ['admin', 'manager', 'sales'].includes(msg.sender_role)
                      const isMe = msg.sender_id === user.user_id

                      return (
                        <div 
                          key={msg.message_id} 
                          className={`flex flex-col max-w-[85%] sm:max-w-[70%] ${isMe ? 'self-end items-end' : 'self-start items-start'}`}
                        >
                          <div className="flex items-center gap-1.5 text-xxs text-slate-400 mb-0.5 px-1 font-semibold">
                            <span>{msg.sender_name}</span>
                            {isSupportRole && (
                              <span className="px-1.5 py-0.2 rounded text-xxxs font-bold bg-emerald-50 text-emerald-700 uppercase">Staff</span>
                            )}
                          </div>

                          <div 
                            className={`p-3 rounded-2xl text-xs leading-relaxed shadow-sm ProseMirror ${
                              isMe 
                                ? 'bg-slate-900 text-white rounded-tr-none' 
                                : isSupportRole
                                  ? 'bg-emerald-50 text-emerald-900 border border-emerald-100 rounded-tl-none'
                                  : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'
                            }`}
                            dangerouslySetInnerHTML={{ __html: msg.message }}
                          />

                          <span className="text-xxxs text-slate-400 font-mono mt-1 px-1">
                            {new Date(msg.created_at).toLocaleTimeString(undefined, {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      )
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div className="p-4 bg-white border-t border-slate-100 shrink-0">
                  <form onSubmit={handleSendMessage} className="flex flex-col gap-3">
                    <div className="flex gap-2 items-end">
                      <div className="flex-1">
                        <RichTextEditor
                          value={replyMessage}
                          onChange={setReplyMessage}
                          placeholder="Type response to be emailed to customer immediately..."
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={submittingMessage || !replyMessage.replace(/<[^>]*>/g, '').trim()}
                        className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition cursor-pointer flex items-center justify-center shrink-0 disabled:opacity-40 shadow-sm shadow-emerald-650/10 h-11"
                      >
                        {submittingMessage ? (
                          <BiLoaderAlt className="animate-spin text-lg" />
                        ) : (
                          <BiSend className="text-lg" />
                        )}
                      </button>
                    </div>
                    <span className="text-xxs text-slate-455 italic ml-1">Customer will immediately receive an email notification alerting them of your reply.</span>
                  </form>
                </div>

              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 select-none text-center p-6">
                <BiSupport className="text-5xl text-slate-350" />
                <h3 className="font-bold text-slate-700 text-sm">Select a ticket from the console list</h3>
                <p className="text-xxs text-slate-450 max-w-xs">
                  Choose any customer support ticket from the listing pane to review detail logs, update statuses, or reply.
                </p>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  )
}

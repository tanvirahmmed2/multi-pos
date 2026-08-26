'use client'
import React, { useState, useContext } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Context } from '../helper/Context'
import { BiLoaderAlt, BiEnvelope, BiUser, BiEdit, BiMessageDetail } from 'react-icons/bi'

const Contact = () => {
  const { website } = useContext(Context)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSendMessage = async (e) => {
    e.preventDefault()

    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      toast.error('All form fields are required')
      return
    }

    setSubmitting(true)
    const toastId = toast.loading('Sending your message...')

    try {
      await axios.post('/api/contact', {
        name: name.trim(),
        email: email.trim(),
        subject: subject.trim(),
        message: message.trim()
      })

      toast.success('Thank you! Your message has been sent successfully.', { id: toastId })
      setName('')
      setEmail('')
      setSubject('')
      setMessage('')
    } catch (err) {
      console.error(err)
      toast.error(err.response?.data?.error || 'Failed to send message. Please try again.', { id: toastId })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="w-full py-16 p-4 md:p-20">
      <div className="w-full mx-auto flex flex-col md:flex-row gap-12 bg-white rounded-3xl p-6 md:p-10 border border-slate-100 shadow-sm animate-fade-in">

        <div className="flex-1 flex flex-col gap-5 justify-center">
          <span className="text-xs font-black uppercase tracking-widest text-primary " >
            Get In Touch
          </span>
          <h2 className="text-3xl text-slate-900 tracking-tight leading-tight">
            Have Questions? Write Us A Message
          </h2>
          <p className="text-tertiary-dark text-xs leading-relaxed font-medium">
            We value your inquiries, concerns, and general feedback. Drop your details into the active channels, and our support team will get back to you shortly.
          </p>
        </div>

        <form onSubmit={handleSendMessage} className="flex-1 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-tertiary-dark flex items-center gap-1 uppercase tracking-wider">
              <BiUser /> Name
            </label>
            <input className="input-style"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-tertiary-dark flex items-center gap-1 uppercase tracking-wider">
              <BiEnvelope /> Email
            </label>
            <input className="input-style"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-tertiary-dark flex items-center gap-1 uppercase tracking-wider">
              <BiEdit /> Subject
            </label>
            <input className="input-style"
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-tertiary-dark flex items-center gap-1 uppercase tracking-wider">
              <BiMessageDetail /> Message
            </label>
            <textarea
              required
              rows="4"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className='input-style'
              />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 mt-2 bg-primary text-white font-bold text-xs rounded-xl shadow-md transition hover:scale-[1.01] hover:brightness-105 active:scale-100 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            
          >
            {submitting ? (
              <>
                <BiLoaderAlt className="animate-spin text-sm" /> Submitting...
              </>
            ) : (
              'Send Message'
            )}
          </button>
        </form>

      </div>
    </div>
  )
}

export default Contact
'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { BiChevronLeft, BiLoaderAlt } from 'react-icons/bi'

export default function SupplierForm({ initialData, onSubmit, loading }) {
  const [name, setName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [isActive, setIsActive] = useState(true)

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '')
      setCompanyName(initialData.company_name || '')
      setPhone(initialData.phone || '')
      setEmail(initialData.email || '')
      setAddress(initialData.address || '')
      setIsActive(initialData.is_active !== false)
    }
  }, [initialData])

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({
      name,
      company_name: companyName,
      phone,
      email,
      address,
      is_active: isActive
    })
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-xl bg-white rounded-2xl border border-slate-100 shadow-sm p-6 md:p-8 flex flex-col gap-6 animate-fade-in">
      
      {/* Title */}
      <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
        <Link href="/dashboard/manager/supplier" className="p-2 hover:bg-slate-50 text-slate-500 hover:text-slate-800 rounded-xl transition">
          <BiChevronLeft className="text-xl" />
        </Link>
        <div>
          <h2 className="font-bold text-slate-800 text-lg">
            {initialData ? 'Update Supplier' : 'Create New Supplier'}
          </h2>
          <p className="text-slate-500 text-xs mt-0.5">
            {initialData ? 'Modify the properties of this supplier.' : 'Add a new supplier to procure goods/inventory.'}
          </p>
        </div>
      </div>

      {/* Inputs */}
      <div className="flex flex-col gap-5">
        
        {/* Name */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-slate-700">Supplier Name <span className="text-red-500">*</span></label>
          <input className="input-style"
            type="text"
            required
            placeholder="e.g. John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {/* Company Name */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-slate-700">Company Name</label>
          <input className="input-style"
            type="text"
            placeholder="e.g. Acme Corporation"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
          />
        </div>

        {/* Phone */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-slate-700">Phone Number <span className="text-red-500">*</span></label>
          <input className="input-style"
            type="text"
            required
            placeholder="e.g. +1234567890"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        {/* Email */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-slate-700">Email Address</label>
          <input className="input-style"
            type="email"
            placeholder="e.g. supplier@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {/* Address */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-slate-700">Address</label>
          <textarea
            placeholder="Supplier office or warehouse address..."
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            rows={3}
            className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition resize-none"
          />
        </div>

        {/* Active Status Toggle */}
        <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200/60">
          <div>
            <label className="text-sm font-semibold text-slate-800">Active Status</label>
            <p className="text-xs text-slate-500 mt-0.5">Define if this supplier is active and selectable for purchases.</p>
          </div>
          <button
            type="button"
            onClick={() => setIsActive(!isActive)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer outline-none ${
              isActive ? 'bg-emerald-600' : 'bg-slate-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isActive ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

      </div>

      {/* Buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-2">
        <Link
          href="/dashboard/manager/supplier"
          className="px-5 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 transition"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-500 transition cursor-pointer disabled:opacity-50 flex items-center gap-2 shadow-sm shadow-emerald-600/10"
        >
          {loading ? (
            <>
              <BiLoaderAlt className="animate-spin text-lg" />
              Saving...
            </>
          ) : (
            initialData ? 'Save Changes' : 'Create Supplier'
          )}
        </button>
      </div>

    </form>
  )
}

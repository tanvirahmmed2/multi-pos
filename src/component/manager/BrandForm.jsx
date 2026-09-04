'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import RichTextEditor from '@/component/helper/RichTextEditor'
import { BiUpload, BiChevronLeft, BiLoaderAlt } from 'react-icons/bi'

export default function BrandForm({ initialData, onSubmit, loading }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [image, setImage] = useState(null)
  const [imagePreview, setImagePreview] = useState('')

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '')
      setDescription(initialData.description || '')
      setIsActive(initialData.is_active !== false)
      setImagePreview(initialData.image || '')
    }
  }, [initialData])

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImage(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const formData = new FormData()
    formData.append('name', name)
    formData.append('description', description)
    formData.append('is_active', isActive)
    if (image) {
      formData.append('image', image)
    }
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-xl bg-white rounded-2xl border border-slate-100 shadow-sm p-6 md:p-8 flex flex-col gap-6 animate-fade-in">
      
      <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
        <Link href="/dashboard/brands" className="p-2 hover:bg-slate-50 text-slate-500 hover:text-slate-800 rounded-xl transition">
          <BiChevronLeft className="text-xl" />
        </Link>
        <div>
          <h2 className="font-bold text-slate-800 text-lg">
            {initialData ? 'Update Brand' : 'Create New Brand'}
          </h2>
          <p className="text-slate-500 text-xs mt-0.5">
            {initialData ? 'Modify the properties of this brand.' : 'Add a new merchant label/brand to the store.'}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-5">
        
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-slate-700">Brand Name</label>
          <input className="input-style"
            type="text"
            required
            placeholder="e.g. Nike"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-slate-700">Description</label>
          <RichTextEditor
            value={description}
            onChange={setDescription}
            placeholder="Introduce details about the brand..."
          />
        </div>

        <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200/60">
          <div>
            <label className="text-sm font-semibold text-slate-800">Active Status</label>
            <p className="text-xs text-slate-500 mt-0.5">Define if this brand is visible in the shop categories.</p>
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

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-slate-700">Brand Logo (Optional)</label>
          
          <div className="flex flex-col md:flex-row items-center gap-4">
            {imagePreview && (
              <div className="relative w-24 h-24 border border-slate-200 overflow-hidden bg-slate-50 flex items-center justify-center shrink-0">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="object-cover w-full h-full"
                />
              </div>
            )}
            
            <label className="w-full flex flex-col items-center justify-center border-2 border-dashed border-slate-200 p-4 hover:bg-slate-50 transition cursor-pointer text-slate-500 hover:text-slate-700">
              <BiUpload className="text-2xl mb-1.5" />
              <span className="text-sm font-medium">Click to upload file</span>
              <span className="text-xs text-slate-400 mt-0.5">PNG, JPG, JPEG up to 5MB</span>
              <input className="input-style hidden"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
              />
            </label>
          </div>
        </div>

      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-2">
        <Link
          href="/dashboard/brands"
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
            initialData ? 'Save Changes' : 'Create Brand'
          )}
        </button>
      </div>

    </form>
  )
}

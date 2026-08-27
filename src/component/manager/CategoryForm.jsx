'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import axios from 'axios'
import { BiUpload, BiChevronLeft, BiLoaderAlt } from 'react-icons/bi'

export default function CategoryForm({ initialData, onSubmit, loading }) {
  const [name, setName] = useState('')
  const [parentId, setParentId] = useState('')
  const [image, setImage] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [categories, setCategories] = useState([])
  const [fetchingCategories, setFetchingCategories] = useState(true)

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '')
      setParentId(initialData.parent_id || '')
      setImagePreview(initialData.image || '')
    }
  }, [initialData])

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get('/api/category')
        setCategories(res.data)
      } catch (error) {
        console.error('Failed to fetch categories:', error)
      } finally {
        setFetchingCategories(false)
      }
    }
    fetchCategories()
  }, [])

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
    formData.append('parent_id', parentId || 'null')
    if (image) {
      formData.append('image', image)
    }
    onSubmit(formData)
  }

  const availableParents = categories.filter(
    (c) => !initialData || c.category_id !== initialData.category_id
  )

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-xl bg-white rounded-2xl border border-slate-100 shadow-sm p-6 md:p-8 flex flex-col gap-6 animate-fade-in">
      
      <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
        <Link href="/dashboard/category" className="p-2 hover:bg-slate-50 text-slate-500 hover:text-slate-800 rounded-xl transition">
          <BiChevronLeft className="text-xl" />
        </Link>
        <div>
          <h2 className="font-bold text-slate-800 text-lg">
            {initialData ? 'Update Category' : 'Create New Category'}
          </h2>
          <p className="text-slate-500 text-xs mt-0.5">
            {initialData ? 'Modify the properties of this category.' : 'Add a new catalog department segment.'}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-5">
        
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-slate-700">Category Name</label>
          <input className="input-style"
            type="text"
            required
            placeholder="e.g. Smart Electronics"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-slate-700">Parent Category</label>
          <select
            value={parentId}
            onChange={(e) => setParentId(e.target.value)}
            disabled={fetchingCategories}
            className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition disabled:opacity-50"
          >
            <option value="">None (Top-Level Category)</option>
            {availableParents.map((cat) => (
              <option key={cat.category_id} value={cat.category_id}>
                {cat.parent_name ? `${cat.parent_name} > ` : ''}{cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-slate-700">Category Image/Banner</label>
          
          <div className="flex flex-col md:flex-row items-center gap-4">
            {imagePreview && (
              <div className="relative w-24 h-24 rounded-xl border border-slate-200 overflow-hidden bg-slate-50 flex items-center justify-center shrink-0">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="object-cover w-full h-full"
                />
              </div>
            )}
            
            <label className="w-full flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl p-4 hover:bg-slate-50 transition cursor-pointer text-slate-500 hover:text-slate-700">
              <BiUpload className="text-2xl mb-1.5" />
              <span className="text-sm font-medium">Click to upload file</span>
              <span className="text-xs text-slate-400 mt-0.5">PNG, JPG, JPEG up to 5MB</span>
              <input className="input-style hidden"
                type="file"
                accept="image/*"
                required={!initialData}
                onChange={handleImageChange}
              />
            </label>
          </div>
        </div>

      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-2">
        <Link
          href="/dashboard/category"
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
            initialData ? 'Save Changes' : 'Create Category'
          )}
        </button>
      </div>

    </form>
  )
}

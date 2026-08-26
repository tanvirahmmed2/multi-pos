'use client'
import React, { useContext, useEffect, useState } from 'react'
import Link from 'next/link'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Context } from '@/component/helper/Context'
import { 
  BiPlus, 
  BiSearch, 
  BiEditAlt, 
  BiTrash, 
  BiLoaderAlt, 
  BiCategory 
} from 'react-icons/bi'

export default function DashboardManagerCategoryPage() {
  const { dashSidebar, website } = useContext(Context)
  const themeColor = website?.theme_color || '#73976A'
  
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [deletingId, setDeletingId] = useState(null)

  const fetchCategories = async () => {
    try {
      const res = await axios.get('/api/category')
      setCategories(res.data)
    } catch (err) {
      toast.error('Failed to load categories')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category? Subcategories will also be deleted!')) {
      return
    }
    setDeletingId(id)
    try {
      await axios.delete(`/api/category/${id}`)
      toast.success('Category deleted successfully')
      fetchCategories()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete category')
      console.error(err)
    } finally {
      setDeletingId(null)
    }
  }

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.parent_name && c.parent_name.toLowerCase().includes(search.toLowerCase())) ||
    c.slug.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className={`w-full min-h-screen bg-slate-50 pt-20 pb-12 px-2 sm:px-4 md:px-8 transition-all duration-300 ${dashSidebar ? 'lg:pl-68' : 'lg:pl-8'}`}>
      <div className="w-full flex flex-col gap-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-4 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <BiCategory style={{ color: themeColor }} />
              Categories Catalog
            </h1>
            <p className="text-slate-500 text-xs mt-0.5">Manage and organize store department segments.</p>
          </div>
          <Link
            href="/dashboard/manager/category/create"
            className="px-4 py-2 text-white text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-sm self-start sm:self-auto"
            style={{ backgroundColor: themeColor }}
          >
            <BiPlus className="text-base" /> Create Category
          </Link>
        </div>

        {/* Actions bar */}
        <div className="flex items-center gap-3 bg-white p-4 border border-slate-200 shadow-sm">
          <div className="flex-1 max-w-md flex items-center gap-2 bg-slate-50 px-3 py-2 border border-slate-200">
            <BiSearch className="text-slate-400 text-base shrink-0" />
            <input 
              type="text"
              placeholder="Search category name, parent, or slug..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs text-slate-800 bg-transparent outline-none"
            />
          </div>
        </div>

        {/* Table/List content */}
        {loading ? (
          <div className="w-full h-64 bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-500 gap-2">
            <BiLoaderAlt className="animate-spin text-xl text-slate-800" />
            <span className="text-xs font-semibold">Loading categories...</span>
          </div>
        ) : filteredCategories.length > 0 ? (
          <div className="bg-white border border-slate-200 shadow-sm">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/80 text-slate-650 font-bold border-b border-slate-200">
                  <th className="px-3 py-3">Category Detail</th>
                  <th className="hidden sm:table-cell px-3 py-3">Slug</th>
                  <th className="hidden md:table-cell px-3 py-3">Hierarchy</th>
                  <th className="px-3 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredCategories.map((cat) => (
                  <tr key={cat.category_id} className="hover:bg-slate-50/50 transition">
                    <td className="px-3 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 border border-slate-200 bg-slate-50 flex items-center justify-center shrink-0">
                          {cat.image ? (
                            <img src={cat.image} alt={cat.name} className="object-cover w-full h-full" />
                          ) : (
                            <BiCategory className="text-lg text-slate-400" />
                          )}
                        </div>
                        <span className="font-bold text-slate-800 text-xs">{cat.name}</span>
                      </div>
                    </td>
                    <td className="hidden sm:table-cell px-3 py-3.5 text-slate-500 font-mono text-[10px]">{cat.slug}</td>
                    <td className="hidden md:table-cell px-3 py-3.5">
                      {cat.parent_name ? (
                        <span className="inline-flex items-center px-2 py-0.5 text-[9px] font-bold uppercase border border-slate-200 bg-slate-100 text-slate-700">
                          Sub of {cat.parent_name}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 text-[9px] font-bold uppercase border border-emerald-200 bg-emerald-50 text-emerald-700">
                          Top Level
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Link
                          href={`/dashboard/manager/category/edit/${cat.category_id}`}
                          className="p-1 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition cursor-pointer"
                        >
                          <BiEditAlt />
                        </Link>
                        <button
                          onClick={() => handleDelete(cat.category_id)}
                          disabled={deletingId === cat.category_id}
                          className="p-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition cursor-pointer disabled:opacity-50"
                        >
                          {deletingId === cat.category_id ? (
                            <BiLoaderAlt className="animate-spin text-xs" />
                          ) : (
                            <BiTrash />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="w-full py-16 bg-white border border-slate-200 shadow-sm flex flex-col items-center justify-center text-slate-400 gap-2">
            <BiCategory className="text-4xl text-slate-300" />
            <p className="font-semibold text-slate-600 text-xs">No categories found</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Try a different search query or add a category above.</p>
          </div>
        )}

      </div>
    </div>
  )
}


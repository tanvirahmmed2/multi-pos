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
  BiTag 
} from 'react-icons/bi'

export default function DashboardManagerBrandsPage() {
  const { dashSidebar, user } = useContext(Context)

  const [brands, setBrands] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [deletingId, setDeletingId] = useState(null)

  const fetchBrands = async () => {
    try {
      const res = await axios.get('/api/brand')
      setBrands(res.data)
    } catch (err) {
      toast.error('Failed to load brands')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBrands()
  }, [])

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this brand?')) {
      return
    }
    setDeletingId(id)
    try {
      await axios.delete(`/api/brand/${id}`)
      toast.success('Brand deleted successfully')
      fetchBrands()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete brand')
      console.error(err)
    } finally {
      setDeletingId(null)
    }
  }

  const filteredBrands = brands.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    (b.description && b.description.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className={`w-full min-h-screen bg-slate-50 pt-20 pb-12 px-2 sm:px-4 md:px-8 transition-all duration-300 ${dashSidebar ? 'lg:pl-68' : 'lg:pl-8'}`}>
      <div className="w-full flex flex-col gap-6">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-4 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <BiTag className="text-primary" />
              Brands Catalog
            </h1>
            <p className="text-slate-500 text-xs mt-0.5">Manage product brands and visual store logos.</p>
          </div>
          <Link
            href="/dashboard/brands/create"
            className="px-4 py-2 text-white text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-sm self-start sm:self-auto bg-primary hover:bg-primary-dark"
          >
            <BiPlus className="text-base" /> Create Brand
          </Link>
        </div>

        <div className="flex items-center gap-3 bg-white p-4 border border-slate-200 shadow-sm">
          <div className="flex-1 max-w-md flex items-center gap-2 bg-slate-50 px-3 py-2 border border-slate-200">
            <BiSearch className="text-slate-400 text-base shrink-0" />
            <input 
              type="text"
              placeholder="Search brand name or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs text-slate-800 bg-transparent outline-none"
            />
          </div>
        </div>

        {loading ? (
          <div className="w-full h-64 bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-500 gap-2">
            <BiLoaderAlt className="animate-spin text-xl text-slate-800" />
            <span className="text-xs font-semibold">Loading brands...</span>
          </div>
        ) : filteredBrands.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredBrands.map((brand) => (
              <div key={brand.brand_id} className="bg-white border border-slate-200 shadow-sm p-4 flex flex-col justify-between hover:shadow-md transition gap-4">
                
                <div className="flex justify-between items-start">
                  <div className="w-14 h-14 border border-slate-200 bg-slate-50 flex items-center justify-center shrink-0">
                    {brand.image ? (
                      <img src={brand.image} alt={brand.name} className="object-cover w-full h-full" />
                    ) : (
                      <BiTag className="text-xl text-slate-400" />
                    )}
                  </div>
                  <span className={`px-1.5 py-0.5 text-[9px] font-bold uppercase border ${
                    brand.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'
                  }`}>
                    {brand.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-slate-800 text-sm line-clamp-1">{brand.name}</h3>
                  <p className="text-slate-500 text-xs mt-1 line-clamp-2 leading-relaxed">
                    {brand.description ? brand.description.replace(/<[^>]*>/g, '') : 'No description available for this brand label.'}
                  </p>
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-1">
                  <span className="text-[10px] text-slate-400 font-mono">ID: #{brand.brand_id}</span>
                  <div className="flex gap-1">
                    <Link
                      href={`/dashboard/brands/edit/${brand.brand_id}`}
                      className="p-1 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition cursor-pointer"
                    >
                      <BiEditAlt />
                    </Link>
                    {user?.role === 'admin' && (
                      <button
                        onClick={() => handleDelete(brand.brand_id)}
                        disabled={deletingId === brand.brand_id}
                        className="p-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition cursor-pointer disabled:opacity-50"
                        title="Delete brand (Admin only)"
                      >
                        {deletingId === brand.brand_id ? (
                          <BiLoaderAlt className="animate-spin text-xs" />
                        ) : (
                          <BiTrash />
                        )}
                      </button>
                    )}
                  </div>
                </div>

              </div>
            ))}
          </div>
        ) : (
          <div className="w-full py-16 bg-white border border-slate-200 shadow-sm flex flex-col items-center justify-center text-slate-400 gap-2">
            <BiTag className="text-4xl text-slate-300" />
            <p className="font-semibold text-slate-600 text-xs">No brands found</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Try a different search query or add a brand above.</p>
          </div>
        )}

      </div>
    </div>
  )
}


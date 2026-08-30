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
  BiUser,
  BiPhone,
  BiEnvelope,
  BiBuildingHouse,
  BiMapPin
} from 'react-icons/bi'

export default function DashboardManagerSupplierPage() {
  const { dashSidebar } = useContext(Context)
  
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [deletingId, setDeletingId] = useState(null)

  const fetchSuppliers = async () => {
    try {
      const res = await axios.get('/api/supplier')
      setSuppliers(res.data)
    } catch (err) {
      toast.error('Failed to load suppliers')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSuppliers()
  }, [])

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this supplier? This will not delete historical purchases, but prevents new transactions.')) {
      return
    }
    setDeletingId(id)
    try {
      await axios.delete(`/api/supplier/${id}`)
      toast.success('Supplier deleted successfully')
      fetchSuppliers()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete supplier')
      console.error(err)
    } finally {
      setDeletingId(null)
    }
  }

  const filteredSuppliers = suppliers.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.company_name && s.company_name.toLowerCase().includes(search.toLowerCase())) ||
    (s.phone && s.phone.toLowerCase().includes(search.toLowerCase())) ||
    (s.email && s.email.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className={`w-full min-h-screen bg-slate-50 pt-20 pb-12 px-2 sm:px-4 md:px-8 transition-all duration-300 ${dashSidebar ? 'lg:pl-64' : 'lg:pl-8'}`}>
      <div className="w-full flex flex-col gap-6">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-4 gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-800 flex items-center gap-2">
              <BiUser className="text-primary" />
              Suppliers Directory
            </h1>
            <p className="text-slate-500 text-xs md:text-sm mt-0.5">Manage external product suppliers, contacts, and metadata.</p>
          </div>
          <Link
            href="/dashboard/supplier/create"
            className="px-4 py-2.5 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer self-start sm:self-auto bg-primary hover:bg-primary-dark"
          >
            <BiPlus className="text-base" /> Create Supplier
          </Link>
        </div>

        <div className="flex items-center gap-3 bg-white p-4 border border-slate-200 shadow-sm">
          <div className="flex-1 max-w-md flex items-center gap-2 bg-slate-50 px-3 py-2 border border-slate-200">
            <BiSearch className="text-slate-400 text-base shrink-0" />
            <input 
              type="text"
              placeholder="Search by name, company, email or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs text-slate-800 bg-transparent outline-none"
            />
          </div>
        </div>

        {loading ? (
          <div className="w-full h-64 bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-500 gap-2">
            <BiLoaderAlt className="animate-spin text-xl text-slate-800" />
            <span className="text-xs font-semibold">Loading suppliers...</span>
          </div>
        ) : filteredSuppliers.length > 0 ? (
          <div className="bg-white border border-slate-200 shadow-sm">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-100/80 text-slate-650 font-bold border-b border-slate-200">
                <tr>
                  <th className="px-3 md:px-4 py-3">Supplier Info</th>
                  <th className="hidden sm:table-cell px-3 md:px-4 py-3">Contact Info</th>
                  <th className="hidden md:table-cell px-3 md:px-4 py-3">Address</th>
                  <th className="hidden lg:table-cell px-3 md:px-4 py-3">Status</th>
                  <th className="px-3 md:px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredSuppliers.map((supplier) => (
                  <tr key={supplier.supplier_id} className="hover:bg-slate-50 transition">
                    <td className="px-3 md:px-4 py-3.5">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800 text-xs md:text-sm">{supplier.name}</span>
                        {supplier.company_name && (
                          <span className="text-slate-500 text-[10px] flex items-center gap-1 mt-0.5">
                            <BiBuildingHouse className="text-slate-400" />
                            {supplier.company_name}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="hidden sm:table-cell px-3 md:px-4 py-3.5">
                      <div className="flex flex-col gap-0.5 text-[11px]">
                        <span className="flex items-center gap-1 text-slate-700">
                          <BiPhone className="text-slate-400" />
                          {supplier.phone}
                        </span>
                        {supplier.email && (
                          <span className="flex items-center gap-1 text-slate-500 font-mono">
                            <BiEnvelope className="text-slate-400" />
                            {supplier.email}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="hidden md:table-cell px-3 md:px-4 py-3.5">
                      {supplier.address ? (
                        <div className="max-w-[200px] truncate text-slate-600 flex items-start gap-1" title={supplier.address}>
                          <BiMapPin className="text-slate-400 shrink-0 mt-0.5" />
                          <span>{supplier.address}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">N/A</span>
                      )}
                    </td>
                    <td className="hidden lg:table-cell px-3 md:px-4 py-3.5">
                      <span className={`px-1.5 py-0.5 text-[9px] font-bold uppercase border ${
                        supplier.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'
                      }`}>
                        {supplier.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-3 md:px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/dashboard/supplier/edit/${supplier.supplier_id}`}
                          className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition border border-transparent"
                        >
                          <BiEditAlt className="text-base" />
                        </Link>
                        <button
                          onClick={() => handleDelete(supplier.supplier_id)}
                          disabled={deletingId === supplier.supplier_id}
                          className="p-1.5 hover:bg-rose-50 text-slate-500 hover:text-rose-600 transition disabled:opacity-50 border border-transparent"
                        >
                          {deletingId === supplier.supplier_id ? (
                            <BiLoaderAlt className="animate-spin text-base" />
                          ) : (
                            <BiTrash className="text-base" />
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
            <BiUser className="text-4xl text-slate-300" />
            <p className="font-bold text-slate-600 text-xs">No suppliers found</p>
            <p className="text-[10px] text-slate-400">Try a different search query or add a supplier above.</p>
          </div>
        )}

      </div>
    </div>
  )
}


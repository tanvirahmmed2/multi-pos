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
  BiPackage,
  BiFilterAlt
} from 'react-icons/bi'

export default function DashboardManagerProductPage() {
  const { dashSidebar, website, user } = useContext(Context)
  const themeColor = website?.theme_color || '#73976A'
  
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [brands, setBrands] = useState([])
  
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedBrand, setSelectedBrand] = useState('')
  const [deletingId, setDeletingId] = useState(null)

  const fetchData = async () => {
    try {
      const [prodRes, catRes, brandRes] = await Promise.all([
        axios.get('/api/product'),
        axios.get('/api/category'),
        axios.get('/api/brand')
      ])
      setProducts(prodRes.data)
      setCategories(catRes.data)
      setBrands(brandRes.data)
    } catch (err) {
      toast.error('Failed to load products database')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product? All of its variants will also be deleted!')) {
      return
    }
    setDeletingId(id)
    try {
      await axios.delete(`/api/product/${id}`)
      toast.success('Product deleted successfully')
      fetchData()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete product')
      console.error(err)
    } finally {
      setDeletingId(null)
    }
  }

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(search.toLowerCase())) ||
      (p.barcode && p.barcode.toLowerCase().includes(search.toLowerCase()))
    
    const matchesCategory = !selectedCategory || p.category_id === parseInt(selectedCategory, 10)
    const matchesBrand = !selectedBrand || p.brand_id === parseInt(selectedBrand, 10)
    
    return matchesSearch && matchesCategory && matchesBrand
  })

  return (
    <div className={`w-full min-h-screen bg-slate-50 pt-20 pb-12 px-2 sm:px-4 md:px-8 transition-all duration-300 ${dashSidebar ? 'lg:pl-68' : 'lg:pl-8'}`}>
      <div className="w-full flex flex-col gap-6">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-4 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <BiPackage style={{ color: themeColor }} />
              Products Catalog
            </h1>
            <p className="text-slate-500 text-xs mt-0.5">Manage items inventory, variants, barcodes, and pricing configurations.</p>
          </div>
          <Link
            href="/dashboard/product/create"
            className="px-4 py-2 text-white text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-sm self-start sm:self-auto"
            style={{ backgroundColor: themeColor }}
          >
            <BiPlus className="text-base" /> Create Product
          </Link>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-4 bg-white p-4 border border-slate-200 shadow-sm">
          <div className="w-full md:flex-1 flex items-center gap-2 bg-slate-50 px-3 py-2 border border-slate-200">
            <BiSearch className="text-slate-400 text-base shrink-0" />
            <input 
              type="text"
              placeholder="Search product name, description, barcode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs text-slate-800 bg-transparent outline-none"
            />
          </div>
          
          <div className="w-full md:w-auto flex items-center gap-3 self-stretch md:self-auto">
            <div className="flex-1 md:w-48">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium outline-none cursor-pointer"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.category_id} value={cat.category_id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex-1 md:w-48">
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium outline-none cursor-pointer"
              >
                <option value="">All Brands</option>
                {brands.map((br) => (
                  <option key={br.brand_id} value={br.brand_id}>
                    {br.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="w-full h-64 bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-500 gap-2">
            <BiLoaderAlt className="animate-spin text-xl text-slate-800" />
            <span className="text-xs font-semibold">Loading product database...</span>
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="bg-white border border-slate-200 shadow-sm">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/80 text-slate-650 font-bold border-b border-slate-200">
                  <th className="px-3 py-3">Product Detail</th>
                  <th className="hidden sm:table-cell px-3 py-3">Catalog Linkage</th>
                  <th className="px-3 py-3 text-right">Sale Price</th>
                  <th className="hidden md:table-cell px-3 py-3 text-center">Status</th>
                  <th className="px-3 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredProducts.map((p) => (
                  <tr key={p.product_id} className="hover:bg-slate-50/50 transition">
                    <td className="px-3 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 border border-slate-200 bg-slate-50 flex items-center justify-center shrink-0 overflow-hidden">
                          <img src={p.image || '/product.jpeg'} alt={p.name} className="object-cover w-full h-full" />
                        </div>
                        <div>
                          <span className="font-bold text-slate-800 text-xs block">{p.name}</span>
                          <span className="text-slate-400 text-[10px] uppercase font-mono mt-0.5 block">
                            Unit: {p.unit || 'pcs'} | Barcode: {p.barcode || 'N/A'} | Stock: {p.stock !== null && p.stock !== undefined ? p.stock : 0}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="hidden sm:table-cell px-3 py-3.5">
                      <div className="flex flex-col gap-0.5 text-xs">
                        <span className="font-semibold text-slate-700">Category: {p.category_name || 'N/A'}</span>
                        <span className="text-slate-500 text-[10px]">Brand: {p.brand_name || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3.5 text-right font-bold text-slate-900">
                      {parseFloat(p.discount_price) > 0 ? (
                        <div>
                          <div className="font-bold text-slate-900">৳{(parseFloat(p.sale_price) - parseFloat(p.discount_price)).toFixed(2)}</div>
                          <div className="text-slate-400 text-[10px] line-through">৳{parseFloat(p.sale_price).toFixed(2)}</div>
                        </div>
                      ) : (
                        <div>৳{parseFloat(p.sale_price).toFixed(2)}</div>
                      )}
                    </td>
                    <td className="hidden md:table-cell px-3 py-3.5 text-center">
                      <span className={`px-1.5 py-0.5 text-[9px] font-bold uppercase border ${
                        p.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'
                      }`}>
                        {p.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-3 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Link
                          href={`/dashboard/product/edit/${p.product_id}`}
                          className="p-1 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition cursor-pointer"
                        >
                          <BiEditAlt />
                        </Link>
                        {user?.role === 'admin' && (
                          <button
                            onClick={() => handleDelete(p.product_id)}
                            disabled={deletingId === p.product_id}
                            className="p-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition cursor-pointer disabled:opacity-50"
                            title="Delete product (Admin only)"
                          >
                            {deletingId === p.product_id ? (
                              <BiLoaderAlt className="animate-spin text-xs" />
                            ) : (
                              <BiTrash />
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="w-full py-16 bg-white border border-slate-200 shadow-sm flex flex-col items-center justify-center text-slate-400 gap-2">
            <BiPackage className="text-4xl text-slate-300" />
            <p className="font-semibold text-slate-600 text-xs">No products found</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Try adjusting your filters/search or add a product above.</p>
          </div>
        )}

      </div>
    </div>
  )
}


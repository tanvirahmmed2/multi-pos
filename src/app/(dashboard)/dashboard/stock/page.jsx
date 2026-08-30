'use client'
import React, { useContext, useEffect, useState } from 'react'
import Link from 'next/link'
import axios from 'axios'
import { Context } from '@/component/helper/Context'
import { 
  BiSearch, 
  BiPackage, 
  BiLoaderAlt, 
  BiShieldQuarter, 
  BiPlusCircle,
  BiTrendingUp
} from 'react-icons/bi'

export default function ManagerStockInventoryPage() {
  const { dashSidebar, user, loading: userLoading } = useContext(Context)
  
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  const fetchStockData = async () => {
    setLoading(true)
    try {
      const [prodRes, catRes] = await Promise.all([
        axios.get('/api/product'),
        axios.get('/api/category')
      ])
      setProducts(prodRes.data)
      setCategories(catRes.data)
    } catch (err) {
      console.error('Failed to load stock inventory data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (userLoading) return
    if (user && ['manager', 'admin'].includes(user.role)) {
      fetchStockData()
    }
  }, [user, userLoading])

  if (userLoading || (loading && products.length === 0)) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-2">
          <BiLoaderAlt className="animate-spin text-4xl text-slate-800" />
          <p className="text-slate-600 text-sm font-semibold animate-pulse">Loading stock inventory database...</p>
        </div>
      </div>
    )
  }

  const filteredProducts = products.filter(prod => {
    const matchesCategory = selectedCategory === 'all' || prod.category_id?.toString() === selectedCategory
    const matchesSearch = 
      prod.name.toLowerCase().includes(search.toLowerCase()) ||
      (prod.barcode && prod.barcode.includes(search))
    return matchesCategory && matchesSearch
  })

  const totalItems = products.length
  const outOfStockCount = products.filter(p => (p.total_stock || p.stock || 0) === 0).length
  const lowStockCount = products.filter(p => {
    const stock = p.total_stock || p.stock || 0
    return stock > 0 && stock <= 5
  }).length

  return (
    <div className={`w-full min-h-screen bg-slate-50 pt-20 pb-12 px-2 sm:px-4 md:px-8 transition-all duration-300 ${dashSidebar ? 'lg:pl-64' : 'lg:pl-8'}`}>
      <div className="w-full flex flex-col gap-6">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-4 gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">Stock Inventory</h1>
            <p className="text-xs text-slate-500 mt-1">Track physical warehouse listings, check barcodes, purchase price, and restock warning signs.</p>
          </div>
          <div className="flex gap-2">
            <Link href="/dashboard/manager/purchase/create" className="px-4 py-2.5 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer bg-primary hover:bg-primary-dark">
              <BiPlusCircle /> Restock Order (Purchase)
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-5">
          <div className="bg-white border border-slate-200 p-5 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Catalog Items</p>
              <h3 className="text-lg font-bold text-slate-800 mt-0.5">{totalItems} Products</h3>
            </div>
            <div className="w-10 h-10 text-white flex items-center justify-center text-xl shrink-0 font-bold bg-primary">
              <BiPackage />
            </div>
          </div>
          <div className="bg-white border border-slate-200 p-5 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Out of Stock</p>
              <h3 className="text-lg font-bold text-rose-600 mt-0.5">{outOfStockCount} Products</h3>
            </div>
            <div className="w-10 h-10 bg-rose-600 text-white flex items-center justify-center text-xl shrink-0 font-bold">
              <BiShieldQuarter />
            </div>
          </div>
          <div className="bg-white border border-slate-200 p-5 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Low Stock Warn</p>
              <h3 className="text-lg font-bold text-amber-700 mt-0.5">{lowStockCount} Products</h3>
            </div>
            <div className="w-10 h-10 bg-amber-500 text-white flex items-center justify-center text-xl shrink-0 font-bold">
              <BiTrendingUp />
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex gap-2 items-center bg-white px-3 py-2 border border-slate-200 w-full md:w-80 shadow-sm">
            <BiSearch className="text-slate-400 text-lg shrink-0" />
            <input 
              type="text"
              placeholder="Search product name, barcode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs text-slate-800 bg-transparent outline-none"
            />
          </div>

          <div className="flex gap-2 items-center w-full md:w-auto">
            <span className="text-xs text-slate-500 font-bold hidden sm:inline">Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 text-slate-800 text-xs font-bold outline-none cursor-pointer shadow-sm w-full md:w-48"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat.category_id} value={cat.category_id}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="bg-white border border-slate-200 py-16 px-6 text-center shadow-sm">
            <h3 className="font-bold text-slate-800 text-base">No Products Found</h3>
            <p className="text-slate-500 text-xs mt-1">There are no inventory items matching your query or active category filters.</p>
          </div>
        ) : (
          <div className="w-full bg-white border border-slate-200 shadow-sm">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-100/80 text-slate-650 font-bold border-b border-slate-200">
                <tr>
                  <th className="px-3 md:px-4 py-3">Product Name</th>
                  <th className="px-3 md:px-4 py-3 hidden sm:table-cell">Barcode</th>
                  <th className="px-3 md:px-4 py-3 hidden md:table-cell">Brand</th>
                  <th className="px-3 md:px-4 py-3 hidden lg:table-cell">Category</th>
                  <th className="px-3 md:px-4 py-3 text-right hidden md:table-cell">Purchase P.</th>
                  <th className="px-3 md:px-4 py-3 text-right">Sale Price</th>
                  <th className="px-3 md:px-4 py-3 text-center">Stock Level</th>
                  <th className="px-3 md:px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
                {filteredProducts.map(prod => {
                  const stock = prod.total_stock || prod.stock || 0
                  return (
                    <tr key={prod.product_id} className="hover:bg-slate-50 transition">
                      <td className="px-3 md:px-4 py-3.5">
                        <div className="font-bold text-slate-900 leading-tight max-w-[120px] sm:max-w-none truncate">{prod.name}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{prod.unit ? `Unit: ${prod.unit}` : ''}</div>
                      </td>
                      <td className="px-3 md:px-4 py-3.5 font-mono text-slate-500 text-[10px] hidden sm:table-cell">
                        <div>{prod.barcode || 'N/A'}</div>
                      </td>
                      <td className="px-3 md:px-4 py-3.5 text-slate-600 font-semibold hidden md:table-cell">{prod.brand_name || 'Generic'}</td>
                      <td className="px-3 md:px-4 py-3.5 text-slate-600 font-semibold hidden lg:table-cell">{prod.category_name || 'Uncategorized'}</td>
                      <td className="px-3 md:px-4 py-3.5 text-right font-medium text-slate-500 hidden md:table-cell">αº│{parseFloat(prod.purchase_price || 0).toFixed(2)}</td>
                      <td className="px-3 md:px-4 py-3.5 text-right font-bold text-slate-800">αº│{parseFloat(prod.sale_price || 0).toFixed(2)}</td>
                      <td className="px-3 md:px-4 py-3.5 text-center font-bold font-mono text-slate-800">{stock}</td>
                      <td className="px-3 md:px-4 py-3.5 text-center">
                        <span className={`px-1.5 py-0.5 text-[9px] font-bold uppercase border ${
                          stock === 0 ? 'bg-rose-50 text-rose-700 border-rose-200' :
                          stock <= 5 ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          {stock === 0 ? 'Out Of Stock' : stock <= 5 ? 'Low Stock' : 'In Stock'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  )
}



'use client'
import React, { useState, useEffect, useContext, useRef } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import Image from 'next/image'
import { Context } from '@/component/helper/Context'
import { printPriceTags } from '@/lib/printpricetag'
import { 
  BiTag, 
  BiSearch, 
  BiPrinter, 
  BiPlus, 
  BiMinus, 
  BiTrash, 
  BiBarcode, 
  BiLoaderAlt, 
  BiRefresh, 
  BiShow,
  BiX,
  BiCheck
} from 'react-icons/bi'

export default function PriceTagPageClean() {
  const { dashSidebar, website, currencySymbol } = useContext(Context)

  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  const [activeCategory, setActiveCategory] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [barcodeSearch, setBarcodeSearch] = useState('')

  const [queue, setQueue] = useState([])
  const [previewIndex, setPreviewIndex] = useState(0)

  // Variant Modal State
  const [selectedProductForModal, setSelectedProductForModal] = useState(null)
  const [modalVariants, setModalVariants] = useState([])
  const [loadingModalVariants, setLoadingModalVariants] = useState(false)
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false)

  const barcodeInputRef = useRef(null)
  const previewBarcodeRef = useRef(null)

  const fetchApiProducts = async () => {
    setLoading(true)
    try {
      const [catRes, prodRes] = await Promise.all([
        axios.get('/api/category'),
        axios.get('/api/product')
      ])
      if (catRes.data && Array.isArray(catRes.data)) {
        setCategories(catRes.data)
      }
      if (prodRes.data && Array.isArray(prodRes.data)) {
        setProducts(prodRes.data.filter(p => p.is_active !== false))
      }
    } catch (err) {
      console.error('Failed to fetch products:', err)
      toast.error('Failed to load products database')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchApiProducts()
  }, [])

  const filteredProducts = products.filter(p => {
    const matchesCategory = activeCategory === 'all' || String(p.category_id) === String(activeCategory)
    const term = searchTerm.toLowerCase().trim()
    const matchesSearch = !term || 
      (p.name && p.name.toLowerCase().includes(term)) ||
      (p.barcode && String(p.barcode).toLowerCase().includes(term)) ||
      (p.category_name && p.category_name.toLowerCase().includes(term))
    return matchesCategory && matchesSearch
  })

  const addToQueue = (product, variant = null, availableVariants = []) => {
    const vId = variant?.variant_id || product.variant_id || null
    const vName = variant ? variant.variant_name : (product.variant_name || '')
    const vBarcode = variant?.barcode || product.barcode || `PROD-${product.product_id}`
    const vPrice = parseFloat(variant ? (variant.sale_price || variant.retail_price) : (product.sale_price || product.retail_price || 0))
    const key = `${product.product_id}-${vId || 'base'}`

    const varsList = availableVariants.length > 0 ? availableVariants : (product.variants || [])

    setQueue(prev => {
      const existingIndex = prev.findIndex(item => item.key === key)
      if (existingIndex > -1) {
        const updated = [...prev]
        updated[existingIndex].quantity += 1
        return updated
      } else {
        return [
          ...prev,
          {
            key,
            product_id: product.product_id,
            variant_id: vId,
            product_name: product.name,
            variant_name: vName,
            barcode: vBarcode,
            price: vPrice,
            quantity: 1,
            image: variant?.image || product.image,
            available_variants: varsList
          }
        ]
      }
    })
    toast.success(`Added ${product.name}${vName ? ` (${vName})` : ''} to tag queue`)
  }

  const handleProductClick = async (product) => {
    setLoadingModalVariants(true)
    try {
      const res = await axios.get(`/api/product/${product.slug || product.product_id}`)
      const fetchedVariants = (res.data?.variants || []).filter(v => v.is_active !== false)

      if (fetchedVariants.length > 1) {
        setSelectedProductForModal(product)
        setModalVariants(fetchedVariants)
        setIsVariantModalOpen(true)
      } else if (fetchedVariants.length === 1) {
        addToQueue(product, fetchedVariants[0], fetchedVariants)
      } else {
        addToQueue(product, null, [])
      }
    } catch (err) {
      console.error(err)
      addToQueue(product, null, [])
    } finally {
      setLoadingModalVariants(false)
    }
  }

  const changeItemVariant = (itemKey, newVariantId) => {
    setQueue(prev => prev.map(item => {
      if (item.key === itemKey) {
        const newVar = item.available_variants?.find(v => String(v.variant_id) === String(newVariantId))
        if (!newVar) return item
        const newKey = `${item.product_id}-${newVar.variant_id}`
        return {
          ...item,
          key: newKey,
          variant_id: newVar.variant_id,
          variant_name: newVar.variant_name,
          barcode: newVar.barcode || item.barcode,
          price: parseFloat(newVar.sale_price || newVar.retail_price || 0),
          image: newVar.image || item.image
        }
      }
      return item
    }))
    toast.success('Product variant updated')
  }

  const addAllVariantsToQueue = (product, variants) => {
    variants.forEach(v => {
      addToQueue(product, v, variants)
    })
    setIsVariantModalOpen(false)
  }

  const handleBarcodeSubmit = async (e) => {
    e.preventDefault()
    if (!barcodeSearch.trim()) return

    const cleanBarcode = barcodeSearch.trim()
    const product = products.find(p => p.barcode === cleanBarcode)

    if (product) {
      await handleProductClick(product)
      setBarcodeSearch('')
      barcodeInputRef.current?.focus()
    } else {
      toast.error(`No product found with barcode: ${cleanBarcode}`)
    }
  }

  const updateQuantity = (key, delta) => {
    setQueue(prev => prev.map(item => {
      if (item.key === key) {
        const newQty = Math.max(1, item.quantity + delta)
        return { ...item, quantity: newQty }
      }
      return item
    }))
  }

  const handleQuantityInputChange = (key, val) => {
    const parsed = Math.max(1, parseInt(val, 10) || 1)
    setQueue(prev => prev.map(item => item.key === key ? { ...item, quantity: parsed } : item))
  }

  const removeFromQueue = (key) => {
    setQueue(prev => prev.filter(item => item.key !== key))
  }

  const clearQueue = () => {
    setQueue([])
  }

  const handlePrint = () => {
    if (queue.length === 0) {
      toast.error('Please add at least one product to the price tag queue first.')
      return
    }
    printPriceTags(queue, website)
  }

  const totalLabels = queue.reduce((sum, item) => sum + item.quantity, 0)
  const activePreviewTag = queue[previewIndex] || (filteredProducts[0] ? {
    product_name: filteredProducts[0].name,
    variant_name: filteredProducts[0].variant_name || '',
    barcode: filteredProducts[0].barcode || `PROD-${filteredProducts[0].product_id}`,
    price: parseFloat(filteredProducts[0].sale_price || 0)
  } : null)

  // Render real vector barcode in Live Preview card
  useEffect(() => {
    if (activePreviewTag && activePreviewTag.barcode && previewBarcodeRef.current) {
      const renderBarcode = () => {
        try {
          if (window.JsBarcode && previewBarcodeRef.current) {
            window.JsBarcode(previewBarcodeRef.current, String(activePreviewTag.barcode), {
              format: 'CODE128',
              width: 1.6,
              height: 32,
              displayValue: true,
              fontSize: 10,
              fontOptions: 'bold',
              margin: 4,
              background: '#ffffff',
              lineColor: '#000000'
            })
          }
        } catch (err) {
          console.error('JsBarcode preview error:', err)
        }
      }

      if (typeof window !== 'undefined') {
        if (!window.JsBarcode) {
          const script = document.createElement('script')
          script.src = 'https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js'
          script.onload = renderBarcode
          document.head.appendChild(script)
        } else {
          renderBarcode()
        }
      }
    }
  }, [activePreviewTag])

  return (
    <div className={`w-full min-h-screen bg-slate-50/50 pt-20 pb-12 px-4 md:px-6 transition-all duration-300 ${dashSidebar ? 'lg:pl-68' : 'lg:pl-8'}`}>
      
      <div className="w-full flex flex-col gap-6">
        
        {/* Barcode & Search Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <form onSubmit={handleBarcodeSubmit} className="flex items-center border border-slate-200 bg-white rounded-xl px-3 py-1.5 shadow-xs w-full sm:w-80">
              <BiBarcode className="text-slate-400 mr-2 text-lg shrink-0" />
              <input
                ref={barcodeInputRef}
                type="text"
                placeholder="Scan or enter Barcode to add..."
                value={barcodeSearch}
                onChange={(e) => setBarcodeSearch(e.target.value)}
                className="w-full bg-transparent text-xs font-semibold text-slate-800 outline-none placeholder-slate-400"
              />
              <button type="submit" className="hidden">Submit</button>
            </form>

            <button
              onClick={fetchApiProducts}
              disabled={loading}
              className="p-2 border border-slate-200 hover:bg-slate-100 bg-white rounded-xl text-slate-600 transition cursor-pointer shrink-0"
              title="Refresh Products Catalog"
            >
              <BiRefresh className={loading ? 'animate-spin text-base' : 'text-base'} />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 bg-slate-900 text-white text-xs font-mono font-bold rounded-xl shadow-xs">
              Tag Size: 3.75″ × 1.875″
            </span>
            <button
              onClick={handlePrint}
              disabled={queue.length === 0}
              className="px-4 py-2 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              <BiPrinter className="text-base" /> Print Tags ({totalLabels})
            </button>
          </div>
        </div>

        {/* 12-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Tag Queue, Live Preview & Print Action */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            
            {/* Tag Queue Card */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col gap-4 shadow-xs">
              <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                  Price Tag Print Queue ({queue.length} items, {totalLabels} labels)
                </span>
                {queue.length > 0 && (
                  <button
                    onClick={clearQueue}
                    className="text-[9px] font-bold text-slate-400 hover:text-rose-500 transition-colors uppercase tracking-wider cursor-pointer"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {queue.length > 0 ? (
                <div className="w-full border border-slate-100 rounded-lg overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        <th className="py-2 px-2 text-left">Product / Variant</th>
                        <th className="py-2 px-1 text-center font-mono">Barcode</th>
                        <th className="py-2 px-1 text-center">Price</th>
                        <th className="py-2 px-1 text-center">Tag Copies</th>
                        <th className="py-2 px-1 text-center w-8"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {queue.map((item, idx) => (
                        <tr 
                          key={item.key} 
                          onClick={() => setPreviewIndex(idx)}
                          className={`cursor-pointer transition-colors ${previewIndex === idx ? 'bg-primary/5 font-semibold' : 'hover:bg-slate-50/50'}`}
                        >
                          <td className="py-2.5 px-2 min-w-0">
                            <p className="font-semibold text-slate-800 text-xs leading-tight" title={item.product_name}>
                              {item.product_name}
                            </p>

                            {/* Changeable Variant Selector */}
                            {item.available_variants && item.available_variants.length > 1 ? (
                              <div className="mt-1" onClick={(e) => e.stopPropagation()}>
                                <select
                                  value={item.variant_id || ''}
                                  onChange={(e) => changeItemVariant(item.key, e.target.value)}
                                  className="text-[10px] font-bold text-slate-700 bg-slate-100 border border-slate-300 rounded px-1.5 py-0.5 cursor-pointer outline-none focus:border-primary"
                                >
                                  {item.available_variants.map(v => (
                                    <option key={v.variant_id} value={v.variant_id}>
                                      {v.variant_name || 'Default'} ({v.barcode || 'No Code'}) - {currencySymbol}{parseFloat(v.sale_price || 0).toFixed(2)}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            ) : (
                              item.variant_name && (
                                <span className="text-[9px] font-bold text-slate-500 bg-slate-100 border border-slate-200/60 px-1.5 py-0.5 rounded leading-none inline-block mt-0.5">
                                  {item.variant_name}
                                </span>
                              )
                            )}
                          </td>

                          <td className="py-2.5 px-1 text-center font-mono text-[10px] text-slate-500">
                            {item.barcode}
                          </td>

                          <td className="py-2.5 px-1 text-center font-mono font-bold text-slate-800 text-xs whitespace-nowrap">
                            {currencySymbol}{item.price.toFixed(2)}
                          </td>

                          <td className="py-2.5 px-1 text-center whitespace-nowrap">
                            <div className="inline-flex items-center bg-slate-50 border border-slate-200 rounded-lg p-0.5" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => updateQuantity(item.key, -1)}
                                className="w-5 h-5 flex items-center justify-center rounded hover:bg-white text-slate-500 hover:text-slate-800 transition cursor-pointer"
                              >
                                <BiMinus className="text-[10px]" />
                              </button>
                              <input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => handleQuantityInputChange(item.key, e.target.value)}
                                className="w-8 text-center text-xs font-bold text-slate-800 font-mono bg-transparent outline-none"
                              />
                              <button
                                onClick={() => updateQuantity(item.key, 1)}
                                className="w-5 h-5 flex items-center justify-center rounded hover:bg-white text-slate-500 hover:text-slate-800 transition cursor-pointer"
                              >
                                <BiPlus className="text-[10px]" />
                              </button>
                            </div>
                          </td>

                          <td className="py-2.5 px-1 text-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                removeFromQueue(item.key)
                              }}
                              className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer rounded hover:bg-rose-50"
                              title="Remove item"
                            >
                              <BiTrash className="text-xs" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-1 py-10">
                  <BiTag className="text-3xl text-slate-200" />
                  <span className="text-xs font-semibold text-slate-400">Price tag queue is empty</span>
                  <span className="text-[10px] text-slate-400">Click products from right catalog or scan barcode to add labels</span>
                </div>
              )}
            </div>

            {/* Live 1:1 Tag Preview Card */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col gap-3 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block border-b border-slate-100 pb-1.5 flex items-center justify-between">
                <span>Label Live Preview (3.75″ × 1.875″)</span>
                <BiShow className="text-slate-400 text-sm" />
              </span>

              {activePreviewTag ? (
                <div className="flex justify-center p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="w-[300px] h-[150px] bg-white border-2 border-dashed border-slate-400 p-2.5 flex flex-col items-center justify-between text-center shadow-xs select-none rounded-xs">
                    <div className="text-[11px] font-black uppercase tracking-wider text-slate-900 leading-none truncate w-full">
                      {website?.hero_title || 'STORE NAME'}
                    </div>

                    <div className="text-[10px] font-bold text-slate-800 leading-tight line-clamp-2 max-w-full my-0.5">
                      {activePreviewTag.product_name} {activePreviewTag.variant_name ? `(${activePreviewTag.variant_name})` : ''}
                    </div>

                    <div className="text-base font-black font-mono text-slate-900 leading-none">
                      {currencySymbol}{parseFloat(activePreviewTag.price || 0).toFixed(2)}
                    </div>

                    <div className="w-full flex items-center justify-center my-0.5 bg-white p-0.5">
                      <svg ref={previewBarcodeRef} className="max-w-full h-auto bg-white"></svg>
                    </div>

                    <div className="text-[8px] font-black tracking-widest text-slate-900 border-t border-slate-900 w-full pt-0.5 leading-none">
                      www.disibin.com
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center text-slate-400 text-xs font-semibold">
                  Select a product to view preview
                </div>
              )}
            </div>

            {/* Print Action Card */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col gap-3 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block border-b border-slate-100 pb-1.5">
                Print Confirmation
              </span>

              <div className="flex justify-between items-center text-xs font-semibold text-slate-600">
                <span>Total Unique Products</span>
                <span className="font-mono text-slate-800">{queue.length}</span>
              </div>
              
              <div className="flex justify-between items-center border-t border-slate-100 pt-2">
                <span className="text-sm font-bold text-slate-900">Total Print Labels</span>
                <span className="font-mono text-slate-900 font-extrabold text-lg">{totalLabels} Copies</span>
              </div>

              <button
                onClick={handlePrint}
                disabled={queue.length === 0}
                className="w-full py-3 text-white text-xs font-bold rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-sm bg-primary hover:bg-primary-dark cursor-pointer mt-1"
              >
                <BiPrinter className="text-base" /> Print Price Tags ({totalLabels} Copies)
              </button>
            </div>

          </div>

          {/* Right Column: Product Catalog & Category Filter */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <BiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search catalog by title or barcode..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3.5 py-2.5 bg-white border border-slate-200 text-xs font-semibold rounded-xl text-slate-800 placeholder-slate-400 outline-none focus:border-primary transition shadow-xs"
                />
              </div>

              <div className="w-full sm:w-48 shrink-0">
                <select
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 text-xs font-semibold rounded-xl text-slate-800 outline-none focus:border-primary transition cursor-pointer shadow-xs"
                  value={activeCategory}
                  onChange={(e) => setActiveCategory(e.target.value)}
                >
                  <option value="all">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat.category_id} value={cat.category_id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {loading ? (
              <div className="h-84 flex flex-col items-center justify-center text-slate-400 gap-2 bg-white border border-slate-200 rounded-xl">
                <BiLoaderAlt className="animate-spin text-xl text-slate-900" />
                <span className="text-xs font-medium">Loading catalog products...</span>
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 xl:grid-cols-3 gap-3 max-h-[700px] overflow-y-auto pr-1">
                {filteredProducts.map((p) => {
                  const price = parseFloat(p.sale_price || p.retail_price || 0)
                  const barcodeVal = p.barcode || `PROD-${p.product_id}`
                  const isAdded = queue.some(item => item.product_id === p.product_id)

                  return (
                    <div 
                      key={p.product_id || p.variant_id}
                      onClick={() => handleProductClick(p)}
                      className={`bg-white border border-slate-200 hover:border-primary rounded-xl p-2.5 flex flex-col justify-between gap-3 transition cursor-pointer select-none shadow-xs group ${isAdded ? 'ring-1 ring-primary/30 border-primary/50 bg-slate-50/30' : ''}`}
                    >
                      <div className="flex flex-col gap-2">
                        <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-slate-50 border border-slate-100 shrink-0">
                          {p.image ? (
                            <Image 
                              width={100}
                              height={100}
                              src={p.image} 
                              alt={p.name} 
                              className="w-full h-full object-cover rounded-lg group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                              <BiBarcode className="text-2xl" />
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col">
                          <h4 className="text-xs font-semibold text-slate-800 line-clamp-1 leading-tight group-hover:text-primary transition" title={p.name}>
                            {p.name}
                          </h4>
                          {p.variant_name && (
                            <span className="text-[9px] font-bold text-slate-500 bg-slate-100 border border-slate-200/60 px-1.5 py-0.5 rounded leading-none inline-block mt-0.5 w-fit">
                              {p.variant_name}
                            </span>
                          )}
                          <div className="flex items-center justify-between gap-1 mt-1">
                            <span className="text-xs font-bold text-slate-900 font-mono">
                              {currencySymbol}{price.toFixed(2)}
                            </span>
                            <span className="text-[9px] font-mono text-slate-400 bg-slate-100 border border-slate-200/60 px-1 py-0.5 rounded truncate max-w-[80px]">
                              {barcodeVal}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className={`w-full py-1 text-[10px] font-bold rounded-lg transition flex items-center justify-center gap-1 ${
                        isAdded ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 group-hover:bg-primary group-hover:text-white'
                      }`}>
                        <BiPlus className="text-xs" /> {isAdded ? 'Add / Select Variant' : '+ Add Tag'}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-1 bg-white border border-slate-200 rounded-xl">
                <span className="text-xs font-semibold">No products found</span>
              </div>
            )}

          </div>

        </div>

      </div>

      {/* Select Variant Modal */}
      {isVariantModalOpen && selectedProductForModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl max-w-lg w-full p-6 flex flex-col gap-4 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <BiTag className="text-primary text-xl" /> Select Variant for {selectedProductForModal.name}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Choose specific product variant to add to price tag print queue.
                </p>
              </div>
              <button 
                onClick={() => setIsVariantModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <BiX className="text-2xl" />
              </button>
            </div>

            <div className="flex flex-col gap-2.5 max-h-80 overflow-y-auto pr-1">
              {modalVariants.map((v) => {
                const vPrice = parseFloat(v.sale_price || v.retail_price || 0)
                const vBarcode = v.barcode || `PROD-${selectedProductForModal.product_id}`
                const isInQueue = queue.some(item => String(item.product_id) === String(selectedProductForModal.product_id) && String(item.variant_id) === String(v.variant_id))

                return (
                  <div
                    key={v.variant_id}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between hover:border-primary/50 transition"
                  >
                    <div className="flex items-center gap-3">
                      {v.image ? (
                        <Image src={v.image} width={40} height={40} alt={v.variant_name} className="w-10 h-10 object-cover rounded-lg border border-slate-200" />
                      ) : (
                        <div className="w-10 h-10 bg-slate-200 rounded-lg flex items-center justify-center text-slate-400">
                          <BiBarcode className="text-xl" />
                        </div>
                      )}
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{v.variant_name || 'Default Variant'}</h4>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono mt-0.5">
                          <span>Barcode: {vBarcode}</span>
                          <span>•</span>
                          <span className="font-bold text-slate-800">{currencySymbol}{vPrice.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => addToQueue(selectedProductForModal, v, modalVariants)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1 cursor-pointer ${
                        isInQueue 
                          ? 'bg-emerald-600 text-white' 
                          : 'bg-primary hover:bg-primary-dark text-white shadow-xs'
                      }`}
                    >
                      <BiPlus className="text-sm" /> Add to Queue
                    </button>
                  </div>
                )
              })}
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => addAllVariantsToQueue(selectedProductForModal, modalVariants)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition cursor-pointer"
              >
                + Add All ({modalVariants.length}) Variants to Queue
              </button>

              <button
                type="button"
                onClick={() => setIsVariantModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Done
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}


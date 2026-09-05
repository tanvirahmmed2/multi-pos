'use client'
import React, { useState, useEffect, useContext, useRef } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { Context } from '@/component/helper/Context'
import { printReceipt } from '@/lib/printreceipt'
import { 
  BiSearch, 
  BiTrash, 
  BiPlus, 
  BiMinus, 
  BiLoaderAlt, 
  BiUser, 
  BiPhone, 
  BiCart, 
  BiReceipt, 
  BiBarcode, 
  BiPrinter, 
  BiShieldQuarter,
  BiRefresh
} from 'react-icons/bi'
import Image from 'next/image'

export default function POSPageClean() {
  const { user, loading: userLoading, dashSidebar, website } = useContext(Context)

  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [websiteSettings, setWebsiteSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [barcodeSearch, setBarcodeSearch] = useState('')
  
  const [cart, setCart] = useState([])
  const [deliveryCharge, setDeliveryCharge] = useState(0)
  const [paymentType, setPaymentType] = useState('cash')
  const [amountReceived, setAmountReceived] = useState('')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [customerPhone, setCustomerPhone] = useState('+880')
  const [customerName, setCustomerName] = useState('')

  const [selectedProduct, setSelectedProduct] = useState(null)
  const [productVariants, setProductVariants] = useState([])
  const [loadingVariants, setLoadingVariants] = useState(false)

  const barcodeInputRef = useRef(null)

  useEffect(() => {
    const fetchInitialMeta = async () => {
      try {
        const [catRes, settingsRes] = await Promise.all([
          axios.get('/api/category'),
          axios.get('/api/settings')
        ])
        setCategories(catRes.data)
        setWebsiteSettings(settingsRes.data)
      } catch (err) {
        console.error('Failed to load metadata:', err)
      }
    }
    fetchInitialMeta()
  }, [])

  const fetchApiProducts = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchTerm.trim()) params.append('search', searchTerm.trim())
      if (activeCategory && activeCategory !== 'all') params.append('category', activeCategory)

      const prodRes = await axios.get(`/api/product?${params.toString()}`)
      setProducts(prodRes.data.filter(p => p.is_active !== false))
    } catch (err) {
      console.error('Failed to fetch products from API:', err)
      toast.error('Failed to search products')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user && ['admin', 'manager', 'sales'].includes(user.role)) {
      const timer = setTimeout(() => {
        fetchApiProducts()
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [user, searchTerm, activeCategory])

  const handleBarcodeSubmit = (e) => {
    e.preventDefault()
    if (!barcodeSearch.trim()) return

    const cleanBarcode = barcodeSearch.trim()
    const product = products.find(p => p.barcode === cleanBarcode)

    if (product) {
      triggerAddProduct(product)
      toast.success(`Scanned: ${product.name}`)
      setBarcodeSearch('')
      barcodeInputRef.current?.focus()
    } else {
      toast.error(`No product found with barcode: ${cleanBarcode}`)
    }
  }

  const triggerAddProduct = async (product) => {
    const availStock = product.total_stock !== undefined ? parseInt(product.total_stock, 10) : parseInt(product.stock, 10)
    if (availStock <= 0) {
      toast.error('Out of stock')
      return
    }

    setLoadingVariants(true)
    try {
      const res = await axios.get(`/api/product/${product.slug}`)
      const rawVariants = res.data.variants || []
      const fetchedVariants = rawVariants.filter(v => v.is_active !== false)
      
      if (fetchedVariants.length > 1) {
        setProductVariants(fetchedVariants)
        setSelectedProduct(product)
      } else if (fetchedVariants.length === 1) {
        addToPOSCart(product, fetchedVariants[0])
      } else {
        addToPOSCart(product, null)
      }
    } catch (err) {
      console.error(err)
      addToPOSCart(product, null)
    } finally {
      setLoadingVariants(false)
    }
  }

  const addToPOSCart = (product, variant = null) => {
    const key = variant ? `${product.product_id}-${variant.variant_id}` : `${product.product_id}-base`
    const existingIndex = cart.findIndex(item => item.cartKey === key)
    const maxStock = variant ? parseInt(variant.stock, 10) : parseInt(product.stock, 10)

    const itemSalePrice = variant ? parseFloat(variant.sale_price) : parseFloat(product.sale_price)
    const itemDiscount = variant ? parseFloat(variant.discount_price || 0) : parseFloat(product.discount_price || 0)
    const finalPrice = Math.max(0, itemSalePrice - itemDiscount)

    if (existingIndex > -1) {
      const currentQty = cart[existingIndex].quantity
      if (currentQty >= maxStock) {
        toast.error(`Only ${maxStock} in stock`)
        return
      }
      const updatedCart = [...cart]
      updatedCart[existingIndex].quantity += 1
      setCart(updatedCart)
    } else {
      if (maxStock <= 0) {
        toast.error('Variant out of stock')
        return
      }
      setCart([
        ...cart,
        {
          cartKey: key,
          product_id: product.product_id,
          variant_id: variant ? variant.variant_id : null,
          name: product.name,
          variant_name: variant ? variant.variant_name : '',
          originalPrice: itemSalePrice,
          discount: itemDiscount,
          price: finalPrice,
          quantity: 1,
          maxStock: maxStock,
          image: product.image
        }
      ])
    }
  }

  const updateQty = (key, val) => {
    const updated = cart.map(item => {
      if (item.cartKey === key) {
        return { ...item, quantity: Math.max(1, Math.min(item.maxStock, val)) }
      }
      return item
    })
    setCart(updated)
  }

  const removeCartItem = (key) => {
    setCart(cart.filter(item => item.cartKey !== key))
  }

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const isExcludedTax = websiteSettings?.excluded_tax === true
  const taxRate = isExcludedTax ? (parseFloat(websiteSettings?.tax_amount) || 0) : 0
  const taxAmountVal = isExcludedTax ? (subtotal * (taxRate / 100)) : 0
  const deliveryChargeVal = parseFloat(deliveryCharge) || 0
  const totalAmount = Math.max(0, subtotal + deliveryChargeVal + taxAmountVal)

  const receivedVal = parseFloat(amountReceived) || 0
  const changeAmount = paymentType === 'cash' && receivedVal > totalAmount ? receivedVal - totalAmount : 0

  const resetForm = () => {
    setCart([])
    setDeliveryCharge(0)
    setAmountReceived('')
    setNote('')
    setCustomerPhone('+880')
    setCustomerName('')
  }

  const handleCheckout = async () => {
    if (websiteSettings && websiteSettings.is_sale_active === false) {
      toast.error('Sales are currently paused by administrator (Sale Off)')
      return
    }
    if (cart.length === 0) {
      toast.error('Cart is empty')
      return
    }
    if (!customerPhone.trim()) {
      toast.error('Customer phone number is required')
      return
    }
    if (paymentType === 'cash' && receivedVal < totalAmount) {
      toast.error('Amount received is less than total amount')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        name: customerName,
        phone: customerPhone,
        note: note,
        is_pos: true,
        payment_type: paymentType,
        amount_received: paymentType === 'cash' ? receivedVal : totalAmount,
        change_amount: changeAmount,
        items: cart.map(item => ({
          product_id: item.product_id,
          variant_id: item.variant_id,
          quantity: item.quantity
        }))
      }

      const res = await axios.post('/api/sale', payload)
      toast.success('Sale Completed!')

      const orderId = res.data.order_id
      try {
        const orderRes = await axios.get(`/api/sale/${orderId}`)
        printReceipt(orderRes.data, website)
      } catch (printErr) {
        console.error('Failed to fetch created order for printing receipt:', printErr)
      }

      resetForm()
      fetchApiProducts()

    } catch (err) {
      console.error(err)
      toast.error(err.response?.data?.error || 'POS sale checkout failed')
    } finally {
      setSubmitting(false)
    }
  }

  if (userLoading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-white">
        <BiLoaderAlt className="animate-spin text-2xl text-slate-800" />
      </div>
    )
  }

  return (
    <div className={`w-full min-h-screen bg-slate-50/50 pt-20 pb-12 px-4 md:px-6 transition-all duration-300 ${dashSidebar ? 'lg:pl-68' : 'lg:pl-8'}`}>
      
      <div className="w-full flex flex-col gap-6">
        
        {websiteSettings && websiteSettings.is_sale_active === false && (
          <div className="bg-rose-500 text-white p-4 border border-rose-600 flex items-center justify-between gap-4 shadow-sm animate-fadeIn">
            <div className="flex items-center gap-3">
              <span className="text-xl">⚠️</span>
              <div>
                <h3 className="font-bold text-xs uppercase tracking-wider">POS Sales Paused (Sale Off)</h3>
                <p className="text-xs text-rose-100 mt-0.5">Sales functionality is currently disabled by administrator in Settings. Orders cannot be completed.</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-white text-rose-700 text-[10px] font-black uppercase tracking-wider shrink-0">Sale Off</span>
          </div>
        )}

        {/* Barcode & Search Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <form onSubmit={handleBarcodeSubmit} className="flex items-center border border-slate-200 bg-white rounded-xl px-3 py-1.5 shadow-xs w-full sm:w-80">
              <BiBarcode className="text-slate-400 mr-2 text-lg shrink-0" />
              <input
                ref={barcodeInputRef}
                type="text"
                placeholder="Scan or enter Barcode..."
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
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Cart & Customer Info & Payment */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            
            {/* Customer Details Card (Phone & Name Side by Side) */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col gap-3 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block border-b border-slate-100 pb-1.5">
                Customer Information
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Phone Number *
                  </label>
                  <div className="relative flex items-center">
                    <BiPhone className="absolute left-3 text-slate-400 text-sm pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Customer Phone Number..."
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 text-xs font-semibold rounded-lg text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-primary transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Customer Name (Optional)
                  </label>
                  <div className="relative flex items-center">
                    <BiUser className="absolute left-3 text-slate-400 text-sm pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Customer Name..."
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 text-xs font-semibold rounded-lg text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-primary transition"
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* Cart Items Card */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col gap-4 shadow-xs">
              <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Checkout Cart</span>
                {cart.length > 0 && (
                  <button
                    onClick={() => {
                      resetForm()
                      toast.success('Cart cleared')
                    }}
                    className="text-[9px] font-bold text-slate-400 hover:text-rose-500 transition-colors uppercase tracking-wider cursor-pointer"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {cart.length > 0 ? (
                <div className="w-full border border-slate-100 rounded-lg">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        <th className="py-2 px-1 text-center w-8">Img</th>
                        <th className="py-2 px-2 text-left">Product</th>
                        <th className="hidden sm:table-cell py-2 px-1 text-center">Price</th>
                        <th className="py-2 px-1 text-center">Qty</th>
                        <th className="py-2 px-2 text-right">Total</th>
                        <th className="py-2 px-1 text-center w-7"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {cart.map((item) => (
                        <tr key={item.cartKey} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-2 px-1 text-center">
                            <div className="w-7 h-7 rounded-md border border-slate-100 bg-slate-50 flex items-center justify-center mx-auto relative shrink-0">
                              <Image 
                                width={60} 
                                height={60}
                                src={item.image || '/product.jpeg'} 
                                alt={item.name} 
                                className="w-full h-full object-cover rounded-md"
                              />
                            </div>
                          </td>

                          <td className="py-2 px-2 min-w-0">
                            <p className="font-semibold text-slate-800 text-xs leading-tight" title={item.name}>
                              {item.name}
                            </p>
                            {item.variant_name && (
                              <span className="text-[9px] font-bold text-slate-500 bg-slate-100 border border-slate-200/60 px-1.5 py-0.5 rounded leading-none inline-block mt-0.5">
                                {item.variant_name}
                              </span>
                            )}
                          </td>

                          <td className="hidden sm:table-cell py-2 px-1 text-center font-mono text-slate-600 text-xs whitespace-nowrap">
                            ৳{item.price.toFixed(2)}
                          </td>

                          <td className="py-2 px-1 text-center whitespace-nowrap">
                            <div className="inline-flex items-center bg-slate-50 border border-slate-200 rounded-lg p-0.5">
                              <button
                                onClick={() => updateQty(item.cartKey, item.quantity - 1)}
                                className="w-4 h-4 flex items-center justify-center rounded hover:bg-white text-slate-500 hover:text-slate-800 transition cursor-pointer"
                              >
                                <BiMinus className="text-[9px]" />
                              </button>
                              <span className="w-5 text-center text-xs font-bold text-slate-800 font-mono">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateQty(item.cartKey, item.quantity + 1)}
                                className="w-4 h-4 flex items-center justify-center rounded hover:bg-white text-slate-500 hover:text-slate-800 transition cursor-pointer"
                              >
                                <BiPlus className="text-[9px]" />
                              </button>
                            </div>
                          </td>

                          <td className="py-2 px-2 text-right font-mono font-bold text-slate-900 text-xs whitespace-nowrap">
                            ৳{(item.price * item.quantity).toFixed(2)}
                          </td>

                          <td className="py-2 px-1 text-center">
                            <button
                              onClick={() => removeCartItem(item.cartKey)}
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
                  <BiCart className="text-3xl text-slate-200" />
                  <span className="text-xs font-semibold text-slate-400">Cart is empty</span>
                </div>
              )}

              {/* Cart Summary & Delivery Charge */}
              <div className="border-t border-slate-100 pt-3 mt-auto flex flex-col gap-2">
                <div className="flex justify-between items-center text-xs font-semibold text-slate-600">
                  <span>Sub Total</span>
                  <span className="font-mono text-slate-800">৳{subtotal.toFixed(2)}</span>
                </div>

                {isExcludedTax && taxRate > 0 && (
                  <div className="flex justify-between items-center text-xs font-medium text-amber-700 bg-amber-50 px-2 py-1 rounded border border-amber-200/60">
                    <span>Tax ({taxRate}%)</span>
                    <span className="font-mono font-bold">+৳{taxAmountVal.toFixed(2)}</span>
                  </div>
                )}

                <div className="my-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Delivery Charge (৳)</label>
                  <input
                    type="number"
                    min="0"
                    value={deliveryCharge}
                    onChange={(e) => setDeliveryCharge(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 text-xs font-semibold rounded-lg text-slate-800 outline-none focus:bg-white focus:border-primary transition"
                  />
                </div>

                {deliveryChargeVal > 0 && (
                  <div className="flex justify-between items-center text-xs font-medium text-slate-500">
                    <span>Delivery Charge</span>
                    <span className="font-mono text-slate-700">+৳{deliveryChargeVal.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between items-center border-t border-slate-200 pt-3 mt-1">
                  <span className="text-sm font-bold text-slate-900">Total Price</span>
                  <span className="font-mono text-slate-900 font-extrabold text-lg">৳{totalAmount.toFixed(2)}</span>
                </div>
              </div>

            </div>

            {/* Payment Method & Checkout */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col gap-4 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block border-b border-slate-100 pb-1.5">
                Payment Method
              </span>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'cash', label: 'Cash' },
                  { id: 'card', label: 'Card' },
                  { id: 'mobile_banking', label: 'MFS' }
                ].map(type => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setPaymentType(type.id)}
                    className={`py-2 border text-xs font-bold rounded-lg transition cursor-pointer ${
                      paymentType === type.id
                        ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>

              {paymentType === 'cash' && (
                <div className="grid grid-cols-2 gap-3.5 bg-slate-50 rounded-lg p-3 border border-slate-100">
                  <div>
                    <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Cash Received (৳)</label>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={amountReceived}
                      onChange={(e) => setAmountReceived(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 text-xs font-semibold rounded-lg text-slate-800 outline-none focus:border-primary transition"
                    />
                  </div>
                  <div className="flex flex-col justify-center">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Change Return</span>
                    <span className="text-sm font-bold text-slate-900 font-mono">
                      ৳{changeAmount.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              <div>
                <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Note / Remark (Optional)</label>
                <input
                  type="text"
                  placeholder="Sales order reference or note..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-xs font-semibold rounded-lg text-slate-800 outline-none focus:bg-white focus:border-primary transition"
                />
              </div>

              <button
                onClick={handleCheckout}
                disabled={submitting || cart.length === 0 || (websiteSettings && websiteSettings.is_sale_active === false)}
                className={`w-full py-3 text-white text-xs font-bold rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-sm ${
                  websiteSettings && websiteSettings.is_sale_active === false 
                    ? 'bg-rose-500 cursor-not-allowed' 
                    : 'bg-primary hover:bg-primary-dark cursor-pointer'
                }`}
              >
                {submitting ? (
                  <>
                    <BiLoaderAlt className="animate-spin text-sm" /> Processing...
                  </>
                ) : websiteSettings && websiteSettings.is_sale_active === false ? (
                  <>
                    <BiShieldQuarter className="text-sm" /> Sales Paused (Sale Off)
                  </>
                ) : (
                  <>
                    <BiReceipt className="text-sm" /> Complete Sale Checkout
                  </>
                )}
              </button>

            </div>

          </div>

          {/* Right Column: Product Catalog & Category Filter */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search catalog by title or barcode..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 text-xs font-semibold rounded-xl text-slate-800 placeholder-slate-400 outline-none focus:border-primary transition shadow-xs"
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
                <span className="text-xs font-medium">Searching products via API...</span>
              </div>
            ) : products.length > 0 ? (
              <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
                {products.map((p) => {
                  const price = parseFloat(p.sale_price)
                  const discountAmt = parseFloat(p.discount_price || 0)
                  const finalP = Math.max(0, price - discountAmt)
                  const isOutOfStock = (p.total_stock !== undefined ? parseInt(p.total_stock, 10) : parseInt(p.stock, 10)) <= 0

                  return (
                    <div 
                      key={p.product_id}
                      onClick={() => !isOutOfStock && triggerAddProduct(p)}
                      className={`bg-white border border-slate-200 hover:border-primary rounded-xl p-2.5 flex flex-col justify-between gap-3 transition cursor-pointer select-none shadow-xs ${isOutOfStock ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div className="flex flex-col gap-2">
                        <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-slate-50 border border-slate-100 shrink-0">
                          <Image 
                            width={100} 
                            height={100} 
                            src={p.image || '/product.jpeg'} 
                            alt={p.name}
                            loading="eager"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">{p.brand_name || 'General'}</span>
                          <h3 className="font-semibold text-slate-800 text-xs mt-0.5 line-clamp-2 leading-tight">
                            {p.name}
                          </h3>
                        </div>
                      </div>

                      <div className="flex items-end justify-between gap-1 border-t border-slate-100 pt-2">
                        <div className="flex flex-col">
                          {discountAmt > 0 ? (
                            <>
                              <span className="text-xs font-bold text-slate-900">৳{finalP.toFixed(2)}</span>
                              <span className="text-[9px] text-slate-400 line-through">৳{price.toFixed(2)}</span>
                            </>
                          ) : (
                            <span className="text-xs font-bold text-slate-900">৳{price.toFixed(2)}</span>
                          )}
                        </div>

                        {isOutOfStock ? (
                          <span className="text-[8px] font-bold text-rose-600 bg-rose-50 rounded px-1.5 py-0.5 border border-rose-100">
                            No Stock
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold text-slate-600 bg-slate-50 rounded border border-slate-200 px-2 py-0.5 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition">
                            Add
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="h-80 flex flex-col items-center justify-center text-slate-400 gap-1.5 bg-white border border-slate-200 rounded-xl">
                <span className="text-xs font-bold text-slate-600">No matching products found from API</span>
              </div>
            )}

          </div>

        </div>

      </div>

      {/* Variant Selection Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xxs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-sm w-full shadow-2xl p-5 flex flex-col gap-4 animate-in fade-in duration-100">
            
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-xs">{selectedProduct.name}</h3>
                <span className="text-[9px] text-slate-400 font-medium tracking-wide uppercase block mt-0.5">Select Variant</span>
              </div>
              <button 
                onClick={() => setSelectedProduct(null)}
                className="text-xs text-slate-400 hover:text-slate-700 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-2">
              {productVariants.filter(v => v.is_active !== false).map((v) => {
                const vPrice = parseFloat(v.sale_price)
                const discountAmt = parseFloat(v.discount_price || 0)
                const finalVPrice = Math.max(0, vPrice - discountAmt)
                const inStock = parseInt(v.stock, 10) > 0

                return (
                  <button
                    key={v.variant_id}
                    disabled={!inStock}
                    onClick={() => {
                      addToPOSCart(selectedProduct, v)
                      setSelectedProduct(null)
                    }}
                    className={`w-full py-2.5 px-3 border rounded-xl text-left text-xs font-semibold transition flex items-center justify-between cursor-pointer ${
                      inStock 
                        ? 'border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-400 text-slate-800' 
                        : 'border-slate-100 bg-slate-50 text-slate-400 cursor-not-allowed opacity-50'
                    }`}
                  >
                    <span>{v.variant_name}</span>
                    <span className="text-xs font-mono font-bold">
                      {inStock ? `৳${finalVPrice.toFixed(2)}` : 'Out of Stock'}
                    </span>
                  </button>
                )
              })}
            </div>

          </div>
        </div>
      )}

    </div>
  )
}

'use client'
import React, { useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Context } from '@/component/helper/Context'
import { 
  BiChevronLeft, 
  BiPlus, 
  BiTrash, 
  BiLoaderAlt, 
  BiDollarCircle, 
  BiFile,
  BiUserPlus,
  BiSearch,
  BiStore
} from 'react-icons/bi'
import BarScanner from '@/component/helper/BarScanner'

export default function PurchaseCreatePage() {
  const { user, dashSidebar, currencySymbol, formatCurrency } = useContext(Context)
  const router = useRouter()
  
  const [suppliers, setSuppliers] = useState([])
  const [branches, setBranches] = useState([])
  
  const [branchId, setBranchId] = useState('')
  const [supplierId, setSupplierId] = useState('')
  const [invoiceNo, setInvoiceNo] = useState('')
  const [note, setNote] = useState('')
  const [extraDiscount, setExtraDiscount] = useState(0)
  const [amountPaid, setAmountPaid] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState('Cash')
  const [transactionId, setTransactionId] = useState('')
  
  const [productSearch, setProductSearch] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  
  const [selectedProdForVariant, setSelectedProdForVariant] = useState(null)
  const [variantsModalList, setVariantsModalList] = useState([])
  
  const [rows, setRows] = useState([])
  
  const [fetchingOptions, setFetchingOptions] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [supRes, branchRes] = await Promise.all([
          axios.get('/api/supplier'),
          axios.get('/api/branch')
        ])
        const activeSuppliers = supRes.data.filter(s => s.is_active !== false)
        const activeBranches = Array.isArray(branchRes.data) ? branchRes.data.filter(b => b.is_active !== false) : []
        
        setSuppliers(activeSuppliers)
        setBranches(activeBranches)

        // Pre-select branch if manager/admin has a branch assigned
        if (user?.branch_id) {
          setBranchId(user.branch_id.toString())
        } else if (activeBranches.length === 1) {
          setBranchId(activeBranches[0].branch_id.toString())
        }
      } catch (err) {
        toast.error('Failed to load metadata options')
        console.error(err)
      } finally {
        setFetchingOptions(false)
      }
    }
    fetchData()
  }, [user])

  useEffect(() => {
    if (!productSearch.trim()) {
      setSearchResults([])
      return
    }

    const timer = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await axios.get(`/api/product?search=${encodeURIComponent(productSearch.trim())}`)
        setSearchResults(res.data.filter(p => p.is_active !== false))
      } catch (err) {
        console.error('Failed to search products:', err)
      } finally {
        setSearching(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [productSearch])

  const handleSelectProduct = async (product) => {
    setProductSearch('')
    setSearchResults([])
    
    try {
      const res = await axios.get(`/api/product/${product.product_id}`)
      const fullProd = res.data
      const vars = fullProd.variants && fullProd.variants.length > 0 ? fullProd.variants.filter(v => v.is_active !== false) : []
      
      if (vars.length > 1) {
        setSelectedProdForVariant(fullProd)
        setVariantsModalList(vars)
      } else {
        const targetVar = vars.length === 1 ? vars[0] : null
        addProductToRows(fullProd, targetVar)
      }
    } catch (err) {
      toast.error('Failed to load product details')
      console.error(err)
    }
  }

  const addProductToRows = (product, variant = null) => {
    const prodIdStr = product.product_id.toString()
    const varIdStr = variant ? variant.variant_id.toString() : ''
    const varName = variant ? variant.variant_name : 'Default'
    const cost = variant ? (parseFloat(variant.purchase_price) || 0) : (parseFloat(product.purchase_price) || 0)

    const existingIdx = rows.findIndex(r => r.product_id === prodIdStr && r.variant_id === varIdStr)

    if (existingIdx > -1) {
      const updated = [...rows]
      updated[existingIdx].quantity = (parseInt(updated[existingIdx].quantity, 10) || 0) + 1
      setRows(updated)
      toast.success(`Incremented quantity for ${product.name} (${varName})`)
    } else {
      setRows(prev => [
        ...prev,
        {
          product_id: prodIdStr,
          product_name: product.name,
          variant_id: varIdStr,
          variant_name: varName,
          variants: product.variants || [],
          quantity: 1,
          purchase_price: cost
        }
      ])
      toast.success(`Added ${product.name} (${varName})`)
    }
  }

  const removeRow = (index) => {
    setRows(rows.filter((_, i) => i !== index))
  }

  const updateRow = (index, newData) => {
    setRows(rows.map((row, i) => i === index ? { ...row, ...newData } : row))
  }

  const handleBarcodeScan = async (scannedBarcode) => {
    try {
      const res = await axios.get(`/api/product?search=${encodeURIComponent(scannedBarcode)}`)
      const matchedProds = res.data.filter(p => p.is_active !== false)
      
      if (matchedProds.length === 0) {
        toast.error(`No product found with barcode: ${scannedBarcode}`)
        return
      }
      
      const matched = matchedProds[0]
      toast.success(`Scanned: ${matched.name}`)
      handleSelectProduct(matched)
    } catch (err) {
      toast.error('Failed to scan barcode product')
      console.error(err)
    }
  }

  const subtotal = rows.reduce((acc, row) => {
    const qty = parseInt(row.quantity, 10) || 0
    const price = parseFloat(row.purchase_price) || 0
    return acc + (qty * price)
  }, 0)

  const total = Math.max(0, subtotal - (parseFloat(extraDiscount) || 0))
  const due = Math.max(0, total - (parseFloat(amountPaid) || 0))

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!branchId) {
      toast.error('Branch selection is mandatory. Please select a branch.')
      return
    }

    if (rows.length === 0) {
      toast.error('Please add at least one product item to the purchase invoice')
      return
    }

    if (rows.some(r => !r.product_id)) {
      toast.error('Please select a valid product for all items')
      return
    }

    if (rows.some(r => (parseInt(r.quantity, 10) || 0) <= 0)) {
      toast.error('Quantity must be greater than zero')
      return
    }

    if (rows.some(r => (parseFloat(r.purchase_price) || 0) < 0)) {
      toast.error('Purchase price cannot be negative')
      return
    }

    if (parseFloat(amountPaid) > total + 0.01) {
      toast.error('Initial payment amount cannot exceed total purchase invoice amount')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        branch_id: parseInt(branchId, 10),
        supplier_id: supplierId || null,
        invoice_no: invoiceNo || null,
        extra_discount: parseFloat(extraDiscount) || 0,
        note,
        payment_method: paymentMethod,
        transaction_id: transactionId || '',
        amount_paid: parseFloat(amountPaid) || 0,
        items: rows.map(r => ({
          product_id: parseInt(r.product_id, 10),
          variant_id: r.variant_id ? parseInt(r.variant_id, 10) : null,
          quantity: parseInt(r.quantity, 10),
          purchase_price: parseFloat(r.purchase_price)
        }))
      }

      await axios.post('/api/purchase', payload)
      toast.success('Purchase invoice created successfully!')
      router.push('/dashboard/purchase')
      router.refresh()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create purchase invoice')
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  if (fetchingOptions) {
    return (
      <div className={`w-full min-h-screen bg-slate-50 pt-20 pb-12 px-4 md:px-8 transition-all duration-300 ${dashSidebar ? 'lg:pl-68' : 'lg:pl-8'} flex items-center justify-center`}>
        <div className="flex items-center gap-2 text-slate-500 font-semibold">
          <BiLoaderAlt className="animate-spin text-xl text-primary" />
          <span>Loading catalog options...</span>
        </div>
      </div>
    )
  }

  const assignedBranch = branches.find(b => b.branch_id.toString() === branchId)

  return (
    <div className={`w-full min-h-screen bg-slate-50 pt-20 pb-12 px-4 md:px-8 transition-all duration-300 ${dashSidebar ? 'lg:pl-68' : 'lg:pl-8'}`}>
      <BarScanner onScan={handleBarcodeScan} />
      <div className="max-w-6xl mx-auto flex flex-col gap-6">
        
        <div className="flex items-center gap-4 pb-4 border-b border-slate-200">
          <Link href="/dashboard/purchase" className="p-2 hover:bg-white text-slate-500 hover:text-slate-800 rounded-xl transition border border-transparent hover:border-slate-200">
            <BiChevronLeft className="text-xl" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Record Procurement Purchase</h1>
            <p className="text-slate-500 text-xs mt-0.5">Ingest variant stock levels and log initial payments.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          <div className="lg:col-span-2 flex flex-col gap-6">
            
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col gap-4">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-50 pb-2">Invoice Info</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Branch Selection (Mandatory) */}
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1">
                    <BiStore className="text-primary text-sm" /> Target Branch *
                  </label>
                  {user?.branch_id ? (
                    <div className="flex items-center gap-2 p-2.5 bg-primary/5 border border-primary/20 rounded-xl text-slate-800 text-sm font-semibold">
                      <span className="flex-1">
                        {assignedBranch ? `${assignedBranch.name} (${assignedBranch.code || 'Main'})` : `Branch #${user.branch_id}`}
                      </span>
                      <span className="px-2 py-0.5 text-[10px] uppercase font-bold bg-primary text-white rounded-md">
                        Assigned User Branch
                      </span>
                    </div>
                  ) : (
                    <select
                      value={branchId}
                      required
                      onChange={(e) => setBranchId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition font-medium"
                    >
                      <option value="">-- Select Mandatory Target Branch * --</option>
                      {branches.map(b => (
                        <option key={b.branch_id} value={b.branch_id}>
                          {b.name} {b.code ? `(${b.code})` : ''} {b.address ? `- ${b.address}` : ''}
                        </option>
                      ))}
                    </select>
                  )}
                  <p className="text-[11px] text-slate-400">Stock ingested from this purchase will be credited specifically to this target branch.</p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase">Supplier</label>
                  <div className="flex gap-2">
                    <select
                      value={supplierId}
                      onChange={(e) => setSupplierId(e.target.value)}
                      className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
                    >
                      <option value="">Walk-in Supplier / Unknown</option>
                      {suppliers.map(s => (
                        <option key={s.supplier_id} value={s.supplier_id}>
                          {s.name} {s.company_name ? `(${s.company_name})` : ''}
                        </option>
                      ))}
                    </select>
                    <Link
                      href="/dashboard/supplier/create"
                      target="_blank"
                      title="Add New Supplier"
                      className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-650 rounded-xl border border-slate-200 transition flex items-center justify-center"
                    >
                      <BiUserPlus className="text-lg" />
                    </Link>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase">Invoice/Bill No</label>
                  <input className="input-style"
                    type="text"
                    placeholder="e.g. BILL-99382"
                    value={invoiceNo}
                    onChange={(e) => setInvoiceNo(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5 mt-2">
                <label className="text-xs font-bold text-slate-700 uppercase">Purchase Annotation / Note</label>
                <textarea
                  placeholder="Record warehouse bin location, logistics agent, or details..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition resize-none"
                />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col gap-4">
              <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                <div>
                  <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Purchase Line Items</h2>
                  <p className="text-slate-400 text-xs mt-0.5">Search products from API or scan barcode to add items.</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('purchase-product-search-input')
                    if (el) el.focus()
                  }}
                  className="px-3 py-1.5 bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 text-xs font-semibold rounded-lg flex items-center gap-1 transition cursor-pointer"
                >
                  <BiPlus /> Search Product
                </button>
              </div>

              <div className="relative">
                <div className="relative flex items-center">
                  <BiSearch className="absolute left-3.5 text-slate-400 text-lg pointer-events-none" />
                  <input
                    id="purchase-product-search-input"
                    type="text"
                    placeholder="Search product directly from API (by title or barcode)..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="input-style pl-10"
                  />
                  {searching && (
                    <BiLoaderAlt className="absolute right-3.5 animate-spin text-primary text-lg" />
                  )}
                </div>

                {searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-30 max-h-64 overflow-y-auto divide-y divide-slate-100">
                    {searchResults.map((prod) => (
                      <div
                        key={prod.product_id}
                        onClick={() => handleSelectProduct(prod)}
                        className="p-3 hover:bg-slate-50 cursor-pointer flex items-center justify-between transition"
                      >
                        <div className="flex items-center gap-3">
                          {prod.image ? (
                            <img src={prod.image} alt={prod.name} className="w-9 h-9 object-cover rounded-lg border border-slate-200" />
                          ) : (
                            <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 text-xs font-bold">
                              {prod.name?.[0]}
                            </div>
                          )}
                          <div>
                            <span className="font-semibold text-slate-800 text-xs block">{prod.name}</span>
                            <span className="text-[10px] text-slate-400 block">
                              {prod.brand_name ? `${prod.brand_name} • ` : ''}Barcode: {prod.barcode || 'N/A'}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-bold text-slate-800 block">
                            {formatCurrency(prod.purchase_price || 0)}
                          </span>
                          <span className="text-[10px] text-primary font-semibold">Click to Add</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {rows.length > 0 ? (
                <div className="overflow-x-auto border border-slate-100 rounded-xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-400 font-bold uppercase">
                        <th className="py-3 px-4 w-[35%]">Product *</th>
                        <th className="py-3 px-4 w-[25%]">Variant *</th>
                        <th className="py-3 px-4 w-[15%]">Qty</th>
                        <th className="py-3 px-4 w-[20%]">Cost ({currencySymbol})</th>
                        <th className="py-3 px-4 text-right">Subtotal</th>
                        <th className="py-3 px-4 text-right"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {rows.map((row, index) => {
                        const rowQty = parseInt(row.quantity, 10) || 0
                        const rowCost = parseFloat(row.purchase_price) || 0
                        const rowSubtotal = rowQty * rowCost

                        return (
                          <tr key={index} className="align-middle hover:bg-slate-50/40">
                            <td className="py-3 px-4">
                              <span className="font-semibold text-slate-800 text-xs">{row.product_name}</span>
                            </td>

                            <td className="py-3 px-4">
                              {row.variants && row.variants.length > 1 ? (
                                <select
                                  value={row.variant_id}
                                  onChange={(e) => {
                                    const selectedId = e.target.value
                                    const matchedVar = row.variants.find(v => v.variant_id.toString() === selectedId)
                                    updateRow(index, {
                                      variant_id: selectedId,
                                      variant_name: matchedVar ? matchedVar.variant_name : row.variant_name,
                                      purchase_price: matchedVar ? (parseFloat(matchedVar.purchase_price) || 0) : row.purchase_price
                                    })
                                  }}
                                  className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs focus:bg-white outline-none"
                                >
                                  {row.variants.map(v => (
                                    <option key={v.variant_id} value={v.variant_id}>
                                      {v.variant_name} ({formatCurrency(v.purchase_price || 0)})
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <span className="text-slate-600 text-xs font-medium bg-slate-100 px-2 py-0.5 rounded">
                                  {row.variant_name || 'Default'}
                                </span>
                              )}
                            </td>

                            <td className="py-3 px-4">
                              <input className="input-style text-center w-20"
                                type="number"
                                min="1"
                                required
                                value={row.quantity}
                                onChange={(e) => updateRow(index, { quantity: parseInt(e.target.value, 10) || 0 })}
                              />
                            </td>

                            <td className="py-3 px-4">
                              <input className="input-style text-right w-28"
                                type="number"
                                step="0.01"
                                min="0"
                                required
                                value={row.purchase_price}
                                onChange={(e) => updateRow(index, { purchase_price: parseFloat(e.target.value) || 0 })}
                              />
                            </td>

                            <td className="py-3 px-4 text-right font-mono font-bold text-slate-800">
                              {formatCurrency(rowSubtotal)}
                            </td>

                            <td className="py-3 px-4 text-right">
                              <button
                                type="button"
                                onClick={() => removeRow(index)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition cursor-pointer"
                                title="Remove item"
                              >
                                <BiTrash className="text-base" />
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-12 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400 gap-2">
                  <BiSearch className="text-3xl text-slate-300" />
                  <p className="font-semibold text-xs text-slate-600">No purchase items added yet</p>
                  <p className="text-xxs text-slate-400">Search products in the box above or scan barcodes to populate items.</p>
                </div>
              )}
            </div>

          </div>

          <div className="flex flex-col gap-6">
            
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col gap-4">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-50 pb-2">Financial Breakdown</h2>
              
              <div className="flex flex-col gap-3 text-sm text-slate-600">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-semibold text-slate-800">{formatCurrency(subtotal)}</span>
                </div>
                
                <div className="flex items-center justify-between gap-4">
                  <span>Extra Discount:</span>
                  <input className="input-style"
                    type="number"
                    step="0.01"
                    min="0"
                    value={extraDiscount}
                    onChange={(e) => setExtraDiscount(parseFloat(e.target.value) || 0)}
                  />
                </div>

                <hr className="border-slate-100" />
                
                <div className="flex justify-between text-base font-bold text-slate-800">
                  <span>Total Amount:</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>

              <div className="flex flex-col gap-4 mt-2 border-t border-slate-50 pt-4">
                <h3 className="text-xs font-bold text-slate-700 uppercase">Payment Logging</h3>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-600">Amount Paid Now</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">{currencySymbol}</span>
                    <input className="input-style pl-8"
                      type="number"
                      step="0.01"
                      min="0"
                      max={total}
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>

                {amountPaid > 0 && (
                  <>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-600">Payment Method</label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-850 text-sm focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
                      >
                        <option value="Cash">Cash</option>
                        <option value="Card">Credit/Debit Card</option>
                        <option value="Mobile Banking">Mobile Banking (Bkash/Rocket/Nagad)</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-600">Transaction ID</label>
                      <input className="input-style"
                        type="text"
                        placeholder="e.g. TXN-38294822"
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                      />
                    </div>
                  </>
                )}

                <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200/60 mt-1">
                  <div>
                    <span className="text-xs font-semibold text-slate-600 block">Remaining Due</span>
                    <span className="text-xxs text-slate-450">Payable to Supplier</span>
                  </div>
                  <span className={`text-base font-bold ${due > 0 ? 'text-amber-600' : 'text-primary-dark'}`}>
                    {formatCurrency(due)}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2 mt-2 border-t border-slate-100 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl text-sm font-semibold transition cursor-pointer flex items-center justify-center gap-2 shadow-sm shadow-primary/10"
                >
                  {submitting ? (
                    <>
                      <BiLoaderAlt className="animate-spin text-lg" />
                      Saving Invoice...
                    </>
                  ) : (
                    <>
                      <BiFile className="text-lg" /> Record Purchase
                    </>
                  )}
                </button>
                <Link
                  href="/dashboard/purchase"
                  className="w-full py-2.5 border border-slate-200 text-center text-slate-600 hover:bg-slate-50 rounded-xl text-sm font-semibold transition"
                >
                  Cancel
                </Link>
              </div>

            </div>

          </div>

        </form>

      </div>

      {selectedProdForVariant && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-xxs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-sm w-full shadow-lg p-5 flex flex-col gap-4 animate-in fade-in duration-100">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <div>
                <h3 className="font-bold text-slate-900 text-xs">{selectedProdForVariant.name}</h3>
                <span className="text-[9px] text-slate-400 font-medium tracking-wide uppercase block mt-0.5">Select Variant to Purchase</span>
              </div>
              <button 
                type="button"
                onClick={() => setSelectedProdForVariant(null)}
                className="text-xs text-slate-400 hover:text-slate-700 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-2">
              {variantsModalList.map((v) => (
                <button
                  key={v.variant_id}
                  type="button"
                  onClick={() => {
                    addProductToRows(selectedProdForVariant, v)
                    setSelectedProdForVariant(null)
                  }}
                  className="w-full py-2 px-3 border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-400 rounded text-left text-xs font-semibold transition flex items-center justify-between cursor-pointer"
                >
                  <span>{v.variant_name}</span>
                  <span className="text-xxs font-mono text-slate-700">
                    Cost: {formatCurrency(v.purchase_price || 0)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

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
  BiUserPlus
} from 'react-icons/bi'
import BarScanner from '@/component/helper/BarScanner'

export default function PurchaseCreatePage() {
  const { dashSidebar } = useContext(Context)
  const router = useRouter()
  
  const [suppliers, setSuppliers] = useState([])
  const [products, setProducts] = useState([])
  
  // Form invoice states
  const [supplierId, setSupplierId] = useState('')
  const [invoiceNo, setInvoiceNo] = useState('')
  const [note, setNote] = useState('')
  const [extraDiscount, setExtraDiscount] = useState(0)
  const [amountPaid, setAmountPaid] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState('Cash')
  const [transactionId, setTransactionId] = useState('')
  
  // Rows state
  // { product_id, variant_id, variants: [], quantity, purchase_price }
  const [rows, setRows] = useState([
    { product_id: '', variant_id: '', variants: [], quantity: 1, purchase_price: 0 }
  ])
  
  const [fetchingOptions, setFetchingOptions] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Fetch suppliers and products
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [supRes, prodRes] = await Promise.all([
          axios.get('/api/supplier'),
          axios.get('/api/product')
        ])
        // Filter only active suppliers for selecting
        setSuppliers(supRes.data.filter(s => s.is_active !== false))
        setProducts(prodRes.data.filter(p => p.is_active !== false))
      } catch (err) {
        toast.error('Failed to load form selections')
        console.error(err)
      } finally {
        setFetchingOptions(false)
      }
    }
    fetchData()
  }, [])

  const addRow = () => {
    setRows([...rows, { product_id: '', variant_id: '', variants: [], quantity: 1, purchase_price: 0 }])
  }

  const removeRow = (index) => {
    if (rows.length === 1) {
      toast.error('At least one item is required')
      return
    }
    setRows(rows.filter((_, i) => i !== index))
  }

  const updateRow = (index, newData) => {
    setRows(rows.map((row, i) => i === index ? { ...row, ...newData } : row))
  }

  const handleProductChange = async (index, productId) => {
    if (!productId) {
      updateRow(index, { product_id: '', variant_id: '', variants: [], purchase_price: 0, quantity: 1 })
      return
    }

    try {
      // Fetch details of product to get variants & base purchase price
      const res = await axios.get(`/api/product/${productId}`)
      const prod = res.data
      
      updateRow(index, {
        product_id: productId,
        variants: prod.variants || [],
        variant_id: prod.variants && prod.variants.length > 0 ? prod.variants[0].variant_id : '',
        purchase_price: prod.purchase_price || 0,
        quantity: 1
      })
    } catch (err) {
      toast.error('Failed to load variants for product')
      console.error(err)
    }
  }

  const handleBarcodeScan = async (scannedBarcode) => {
    const matched = products.find(p => p.barcode === scannedBarcode);
    if (!matched) {
      toast.error(`No product found with barcode: ${scannedBarcode}`);
      return;
    }

    toast.success(`Product scanned: ${matched.name}`);

    try {
      // Fetch details of product to get variants & base purchase price
      const res = await axios.get(`/api/product/${matched.product_id}`);
      const prod = res.data;
      
      const defaultVariantId = prod.variants && prod.variants.length > 0 ? prod.variants[0].variant_id : '';

      // Check if product is already in our rows
      const existingRowIndex = rows.findIndex(r => 
        r.product_id === matched.product_id.toString() && 
        (r.variant_id === defaultVariantId || (!r.variant_id && !defaultVariantId))
      );

      if (existingRowIndex > -1) {
        // Increment quantity
        const currentQty = parseInt(rows[existingRowIndex].quantity, 10) || 0;
        updateRow(existingRowIndex, { quantity: currentQty + 1 });
      } else {
        const isFirstRowEmpty = rows.length === 1 && !rows[0].product_id;
        const newRow = {
          product_id: matched.product_id.toString(),
          variants: prod.variants || [],
          variant_id: defaultVariantId,
          purchase_price: prod.purchase_price || 0,
          quantity: 1
        };

        if (isFirstRowEmpty) {
          setRows([newRow]);
        } else {
          setRows(prev => [...prev, newRow]);
        }
      }
    } catch (err) {
      toast.error('Failed to load scanned product details');
      console.error(err);
    }
  };

  // Calculations
  const subtotal = rows.reduce((acc, row) => {
    const qty = parseInt(row.quantity, 10) || 0
    const price = parseFloat(row.purchase_price) || 0
    return acc + (qty * price)
  }, 0)

  const total = Math.max(0, subtotal - (parseFloat(extraDiscount) || 0))
  const due = Math.max(0, total - (parseFloat(amountPaid) || 0))

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validations
    if (rows.some(r => !r.product_id)) {
      toast.error('Please select a product for all rows')
      return
    }

    if (rows.some(r => r.variants && r.variants.length > 0 && !r.variant_id)) {
      toast.error('Please select a variant for all variant products')
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
      router.push('/dashboard/manager/purchase')
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
          <BiLoaderAlt className="animate-spin text-xl text-emerald-600" />
          <span>Loading catalog options...</span>
        </div>
      </div>
    )
  }

  return (
    <div className={`w-full min-h-screen bg-slate-50 pt-20 pb-12 px-4 md:px-8 transition-all duration-300 ${dashSidebar ? 'lg:pl-68' : 'lg:pl-8'}`}>
      <BarScanner onScan={handleBarcodeScan} />
      <div className="max-w-6xl mx-auto flex flex-col gap-6">
        
        {/* Header */}
        <div className="flex items-center gap-4 pb-4 border-b border-slate-200">
          <Link href="/dashboard/manager/purchase" className="p-2 hover:bg-white text-slate-500 hover:text-slate-800 rounded-xl transition border border-transparent hover:border-slate-200">
            <BiChevronLeft className="text-xl" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Record Procurement Purchase</h1>
            <p className="text-slate-500 text-xs mt-0.5">Ingest variant stock levels and log initial payments.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Main Invoicing Panel */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            
            {/* Invoice Info */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col gap-4">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-50 pb-2">Invoice Info</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Supplier */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase">Supplier</label>
                  <div className="flex gap-2">
                    <select
                      value={supplierId}
                      onChange={(e) => setSupplierId(e.target.value)}
                      className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition"
                    >
                      <option value="">Walk-in Supplier / Unknown</option>
                      {suppliers.map(s => (
                        <option key={s.supplier_id} value={s.supplier_id}>
                          {s.name} {s.company_name ? `(${s.company_name})` : ''}
                        </option>
                      ))}
                    </select>
                    <Link
                      href="/dashboard/manager/supplier/create"
                      target="_blank"
                      title="Add New Supplier"
                      className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-650 rounded-xl border border-slate-200 transition flex items-center justify-center"
                    >
                      <BiUserPlus className="text-lg" />
                    </Link>
                  </div>
                </div>

                {/* Bill Reference # */}
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

              {/* Note */}
              <div className="flex flex-col gap-1.5 mt-2">
                <label className="text-xs font-bold text-slate-700 uppercase">Purchase Annotation / Note</label>
                <textarea
                  placeholder="Record warehouse bin location, logistics agent, or details..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition resize-none"
                />
              </div>
            </div>

            {/* Line Items */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col gap-4">
              <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Purchase Line Items</h2>
                <button
                  type="button"
                  onClick={addRow}
                  className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-250/20 hover:bg-emerald-100 text-xs font-semibold rounded-lg flex items-center gap-1 transition cursor-pointer"
                >
                  <BiPlus /> Add Row
                </button>
              </div>

              {/* Items Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="text-slate-400 font-bold uppercase border-b border-slate-100">
                      <th className="py-2 pr-4 w-[40%]">Product *</th>
                      <th className="py-2 pr-4 w-[25%]">Variant *</th>
                      <th className="py-2 pr-4 w-[15%]">Qty</th>
                      <th className="py-2 pr-4 w-[15%]">Cost ($)</th>
                      <th className="py-2 w-[5%] text-right"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {rows.map((row, index) => (
                      <tr key={index} className="align-middle">
                        {/* Product Dropdown */}
                        <td className="py-3 pr-4">
                          <select
                            value={row.product_id}
                            required
                            onChange={(e) => handleProductChange(index, e.target.value)}
                            className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs focus:bg-white outline-none"
                          >
                            <option value="">-- Select Product --</option>
                            {products.map(p => (
                              <option key={p.product_id} value={p.product_id}>
                                {p.name}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Variant Dropdown */}
                        <td className="py-3 pr-4">
                          {row.variants && row.variants.length > 0 ? (
                            <select
                              value={row.variant_id}
                              required
                              onChange={(e) => {
                                const selectedId = e.target.value;
                                const matchedVar = row.variants.find(v => v.variant_id.toString() === selectedId);
                                updateRow(index, { 
                                  variant_id: selectedId,
                                  purchase_price: matchedVar ? (matchedVar.purchase_price || 0) : row.purchase_price
                                });
                              }}
                              className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs focus:bg-white outline-none"
                            >
                              <option value="">-- Select Variant --</option>
                              {row.variants.map(v => (
                                <option key={v.variant_id} value={v.variant_id}>
                                  {v.variant_name} (Stock: {v.stock})
                                </option>
                              ))}
                            </select>
                          ) : row.product_id ? (
                            <span className="text-slate-400 italic text-xxs px-2">No variants</span>
                          ) : (
                            <span className="text-slate-400 italic text-xxs px-2">Choose product first</span>
                          )}
                        </td>

                        {/* Quantity */}
                        <td className="py-3 pr-4">
                          <input className="input-style"
                            type="number"
                            min="1"
                            required
                            value={row.quantity}
                            onChange={(e) => updateRow(index, { quantity: parseInt(e.target.value, 10) || 0 })}
                          />
                        </td>

                        {/* Purchase Price */}
                        <td className="py-3 pr-4">
                          <input className="input-style"
                            type="number"
                            step="0.01"
                            min="0"
                            required
                            value={row.purchase_price}
                            onChange={(e) => updateRow(index, { purchase_price: parseFloat(e.target.value) || 0 })}
                          />
                        </td>

                        {/* Delete Row */}
                        <td className="py-3 text-right">
                          <button
                            type="button"
                            onClick={() => removeRow(index)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition cursor-pointer"
                          >
                            <BiTrash className="text-base" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* Right Column: Financial Summary & Actions */}
          <div className="flex flex-col gap-6">
            
            {/* Payment & Financials */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col gap-4">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-50 pb-2">Financial Breakdown</h2>
              
              {/* Financial Metrics */}
              <div className="flex flex-col gap-3 text-sm text-slate-600">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-semibold text-slate-800">${subtotal.toFixed(2)}</span>
                </div>
                
                {/* Extra Discount */}
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
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>

              {/* Initial Payment details */}
              <div className="flex flex-col gap-4 mt-2 border-t border-slate-50 pt-4">
                <h3 className="text-xs font-bold text-slate-700 uppercase">Payment Logging</h3>

                {/* Amount Paid */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-600">Amount Paid Now</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                    <input className="input-style"
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
                    {/* Payment Method */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-600">Payment Method</label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-850 text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition"
                      >
                        <option value="Cash">Cash</option>
                        <option value="Card">Credit/Debit Card</option>
                        <option value="Mobile Banking">Mobile Banking (Bkash/Rocket/Nagad)</option>
                      </select>
                    </div>

                    {/* Transaction ID */}
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

                {/* Dues */}
                <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200/60 mt-1">
                  <div>
                    <span className="text-xs font-semibold text-slate-600 block">Remaining Due</span>
                    <span className="text-xxs text-slate-450">Payable to Supplier</span>
                  </div>
                  <span className={`text-base font-bold ${due > 0 ? 'text-amber-600' : 'text-emerald-700'}`}>
                    ${due.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex flex-col gap-2 mt-2 border-t border-slate-100 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition cursor-pointer flex items-center justify-center gap-2 shadow-sm shadow-emerald-600/10"
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
                  href="/dashboard/manager/purchase"
                  className="w-full py-2.5 border border-slate-200 hover:bg-slate-55 text-center text-slate-600 hover:bg-slate-50 rounded-xl text-sm font-semibold transition"
                >
                  Cancel
                </Link>
              </div>

            </div>

          </div>

        </form>

      </div>
    </div>
  )
}

'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import axios from 'axios'
import { 
  BiUpload, 
  BiChevronLeft, 
  BiLoaderAlt, 
  BiPlus, 
  BiTrash, 
  BiCheck, 
  BiPackage, 
  BiBarcode,
  BiDollar,
  BiScale,
  BiPurchaseTag,
  BiListUl,
  BiDetail,
  BiImage,
  BiToggleLeft,
  BiToggleRight,
  BiX
} from 'react-icons/bi'
import BarScanner from '@/component/helper/BarScanner'
import RichTextEditor from '@/component/helper/RichTextEditor'
import toast from 'react-hot-toast'

export default function ProductForm({ initialData, onSubmit, loading }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [brandId, setBrandId] = useState('')
  const [productType, setProductType] = useState('simple') 
  const [isActive, setIsActive] = useState(true)
  const [image, setImage] = useState(null)
  const [imagePreview, setImagePreview] = useState('')

  const [purchasePrice, setPurchasePrice] = useState(0)
  const [salePrice, setSalePrice] = useState(0)
  const [discountPrice, setDiscountPrice] = useState(0)
  const [wholesalePrice, setWholesalePrice] = useState(0)
  const [dealerPrice, setDealerPrice] = useState(0)
  const [retailPrice, setRetailPrice] = useState(0)
  const [unit, setUnit] = useState('Pcs')
  const [barcode, setBarcode] = useState('')
  const [weight, setWeight] = useState(0)

  const [variants, setVariants] = useState([])

  const [newVarName, setNewVarName] = useState('')
  const [newVarBarcode, setNewVarBarcode] = useState('')
  const [newVarPurchasePrice, setNewVarPurchasePrice] = useState(0)
  const [newVarPrice, setNewVarPrice] = useState(0) 
  const [newVarDiscountPrice, setNewVarDiscountPrice] = useState(0)
  const [newVarWholesalePrice, setNewVarWholesalePrice] = useState(0)
  const [newVarDealerPrice, setNewVarDealerPrice] = useState(0)
  const [newVarRetailPrice, setNewVarRetailPrice] = useState(0)
  const [newVarWeight, setNewVarWeight] = useState(0)
  const [newVarUnit, setNewVarUnit] = useState('Pcs')
  const [newVarIsActive, setNewVarIsActive] = useState(true)
  const [newVarImageFile, setNewVarImageFile] = useState(null)
  const [newVarImagePreview, setNewVarImagePreview] = useState('')

  const [categories, setCategories] = useState([])
  const [brands, setBrands] = useState([])
  const [fetchingOptions, setFetchingOptions] = useState(true)

  const [scannerActive, setScannerActive] = useState(false)

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [newCatParentId, setNewCatParentId] = useState('')
  const [newCatImage, setNewCatImage] = useState(null)
  const [newCatImagePreview, setNewCatImagePreview] = useState('')
  const [creatingCategory, setCreatingCategory] = useState(false)

  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false)
  const [newBrandName, setNewBrandName] = useState('')
  const [newBrandDesc, setNewBrandDesc] = useState('')
  const [newBrandImage, setNewBrandImage] = useState(null)
  const [newBrandImagePreview, setNewBrandImagePreview] = useState('')
  const [newBrandIsActive, setNewBrandIsActive] = useState(true)
  const [creatingBrand, setCreatingBrand] = useState(false)

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [catRes, brandRes] = await Promise.all([
          axios.get('/api/category'),
          axios.get('/api/brand')
        ])
        setCategories(catRes.data)
        setBrands(brandRes.data)
      } catch (err) {
        console.error('Failed to load category/brand selections:', err)
      } finally {
        setFetchingOptions(false)
      }
    }
    fetchOptions()
  }, [])

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '')
      setDescription(initialData.description || '')
      setCategoryId(initialData.category_id || '')
      setBrandId(initialData.brand_id || '')
      setIsActive(initialData.is_active !== false)
      setImagePreview(initialData.image || '')

      const hasMultiple = initialData.variants && (
        initialData.variants.length > 1 || 
        (initialData.variants.length === 1 && initialData.variants[0].variant_name !== 'Default')
      )

      if (hasMultiple) {
        setProductType('variable')
        setVariants(initialData.variants.map(v => ({
          ...v,
          imageFile: null,
          imagePreview: ''
        })))
        setPurchasePrice(0)
        setSalePrice(0)
        setDiscountPrice(0)
        setWholesalePrice(0)
        setDealerPrice(0)
        setRetailPrice(0)
        setUnit('Pcs')
        setBarcode('')
        setWeight(0)
      } else {
        setProductType('simple')
        const defVar = (initialData.variants && initialData.variants[0]) || initialData
        setPurchasePrice(defVar.purchase_price || 0)
        setSalePrice(defVar.sale_price || 0)
        setDiscountPrice(defVar.discount_price || 0)
        setWholesalePrice(defVar.wholesale_price || 0)
        setDealerPrice(defVar.dealer_price || 0)
        setRetailPrice(defVar.retail_price || 0)
        setUnit(defVar.unit || 'Pcs')
        setBarcode(defVar.barcode || '')
        setWeight(defVar.weight || 0)
        setVariants([])
      }
    }
  }, [initialData])

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImage(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const addVariant = () => {
    if (!newVarName.trim()) {
      toast.error('Variant name is required')
      return
    }
    setVariants([...variants, {
      variant_name: newVarName.trim(),
      purchase_price: parseFloat(newVarPurchasePrice) || 0,
      price: parseFloat(newVarPrice) || 0,
      sale_price: parseFloat(newVarPrice) || 0,
      discount_price: parseFloat(newVarDiscountPrice) || 0,
      wholesale_price: parseFloat(newVarWholesalePrice) || 0,
      dealer_price: parseFloat(newVarDealerPrice) || 0,
      retail_price: parseFloat(newVarRetailPrice) || 0,
      weight: parseFloat(newVarWeight) || 0,
      barcode: newVarBarcode || null,
      unit: newVarUnit || 'Pcs',
      is_active: newVarIsActive !== false,
      imageFile: newVarImageFile,
      imagePreview: newVarImagePreview
    }])
    setNewVarName('')
    setNewVarPrice(0)
    setNewVarPurchasePrice(0)
    setNewVarDiscountPrice(0)
    setNewVarWholesalePrice(0)
    setNewVarDealerPrice(0)
    setNewVarRetailPrice(0)
    setNewVarWeight(0)
    setNewVarBarcode('')
    setNewVarUnit('Pcs')
    setNewVarIsActive(true)
    setNewVarImageFile(null)
    setNewVarImagePreview('')
  }

  const handleVariantChange = (index, field, value) => {
    const updated = [...variants]
    updated[index] = { ...updated[index], [field]: value }
    setVariants(updated)
  }

  const removeVariant = (index) => {
    setVariants(variants.filter((_, i) => i !== index))
  }

  const handleCreateCategory = async (e) => {
    e.preventDefault()
    if (!newCatName.trim()) {
      toast.error('Category name is required')
      return
    }

    setCreatingCategory(true)
    const formData = new FormData()
    formData.append('name', newCatName.trim())
    formData.append('parent_id', newCatParentId || '')
    if (newCatImage) {
      formData.append('image', newCatImage)
    }

    try {
      const res = await axios.post('/api/category', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      const newCat = res.data
      toast.success('Category created successfully')
      
      const catRes = await axios.get('/api/category')
      setCategories(catRes.data)
      
      setCategoryId(newCat.category_id)
      
      setNewCatName('')
      setNewCatParentId('')
      setNewCatImage(null)
      setNewCatImagePreview('')
      setIsCategoryModalOpen(false)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create category')
      console.error(err)
    } finally {
      setCreatingCategory(false)
    }
  }

  const handleCreateBrand = async (e) => {
    e.preventDefault()
    if (!newBrandName.trim()) {
      toast.error('Brand name is required')
      return
    }

    setCreatingBrand(true)
    const formData = new FormData()
    formData.append('name', newBrandName.trim())
    formData.append('description', newBrandDesc.trim())
    formData.append('is_active', newBrandIsActive)
    if (newBrandImage) {
      formData.append('image', newBrandImage)
    }

    try {
      const res = await axios.post('/api/brand', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      const newBrand = res.data
      toast.success('Brand created successfully')
      
      const brandRes = await axios.get('/api/brand')
      setBrands(brandRes.data)
      
      setBrandId(newBrand.brand_id)
      
      setNewBrandName('')
      setNewBrandDesc('')
      setNewBrandImage(null)
      setNewBrandImagePreview('')
      setNewBrandIsActive(true)
      setIsBrandModalOpen(false)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create brand')
      console.error(err)
    } finally {
      setCreatingBrand(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    let finalVariants = []
    if (productType === 'simple') {
      const defVarId = initialData?.variants?.[0]?.variant_id || initialData?.variant_id || null
      const defImage = initialData?.variants?.[0]?.image || initialData?.image || null
      const defImageId = initialData?.variants?.[0]?.image_id || initialData?.image_id || null

      finalVariants = [{
        variant_id: defVarId,
        variant_name: 'Default',
        purchase_price: parseFloat(purchasePrice) || 0,
        sale_price: parseFloat(salePrice) || 0,
        discount_price: parseFloat(discountPrice) || 0,
        wholesale_price: parseFloat(wholesalePrice) || 0,
        dealer_price: parseFloat(dealerPrice) || 0,
        retail_price: parseFloat(retailPrice) || 0,
        unit: unit || 'Pcs',
        barcode: barcode || null,
        weight: (weight !== undefined && weight !== null && weight !== '') ? parseFloat(weight) : null,
        is_active: isActive !== false,
        imageFile: image,
        imagePreview: imagePreview,
        image: defImage,
        image_id: defImageId
      }]
    } else {
      finalVariants = [...variants]
      if (newVarName.trim()) {
        finalVariants.push({
          variant_name: newVarName.trim(),
          purchase_price: parseFloat(newVarPurchasePrice) || 0,
          price: parseFloat(newVarPrice) || 0,
          sale_price: parseFloat(newVarPrice) || 0,
          discount_price: parseFloat(newVarDiscountPrice) || 0,
          wholesale_price: parseFloat(newVarWholesalePrice) || 0,
          dealer_price: parseFloat(newVarDealerPrice) || 0,
          retail_price: parseFloat(newVarRetailPrice) || 0,
          weight: parseFloat(newVarWeight) || 0,
          barcode: newVarBarcode || null,
          unit: newVarUnit || 'Pcs',
          is_active: newVarIsActive !== false,
          imageFile: newVarImageFile,
          imagePreview: newVarImagePreview
        })
      }

      if (finalVariants.length === 0) {
        toast.error('Please configure at least one variant for this product.')
        return
      }

      for (const v of finalVariants) {
        if (!v.variant_name || !v.variant_name.trim()) {
          toast.error('All variants must have a name.')
          return
        }
        if (v.purchase_price === undefined || isNaN(parseFloat(v.purchase_price))) {
          toast.error(`Variant "${v.variant_name}" must have a valid purchase price.`)
          return
        }
        if (v.sale_price === undefined || isNaN(parseFloat(v.sale_price))) {
          toast.error(`Variant "${v.variant_name}" must have a valid sale price.`)
          return
        }
      }
    }

    const formData = new FormData()
    formData.append('name', name)
    formData.append('description', description)
    formData.append('category_id', categoryId)
    formData.append('brand_id', brandId)
    formData.append('is_active', isActive)

    const cleanedVariants = finalVariants.map(v => {
      const { imageFile, imagePreview, ...rest } = v
      return rest
    })
    formData.append('variants', JSON.stringify(cleanedVariants))

    finalVariants.forEach((v, idx) => {
      if (v.imageFile) {
        formData.append(`variant_image_${idx}`, v.imageFile)
      }
    })

    if (finalVariants.length > 0) {
      const mainVar = finalVariants[0]
      formData.append('purchase_price', mainVar.purchase_price)
      formData.append('sale_price', mainVar.sale_price)
      formData.append('discount_price', mainVar.discount_price || 0)
      formData.append('wholesale_price', mainVar.wholesale_price || 0)
      formData.append('dealer_price', mainVar.dealer_price || 0)
      formData.append('retail_price', mainVar.retail_price || 0)
      formData.append('unit', mainVar.unit || 'Pcs')
      formData.append('barcode', mainVar.barcode || '')
    }

    onSubmit(formData)
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="w-full flex flex-col gap-6 animate-fade-in text-slate-800">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-100 shadow-sm rounded-2xl p-4 md:p-6">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/product" className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-850 rounded-xl transition duration-200">
            <BiChevronLeft className="text-xl" />
          </Link>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900">
              {initialData ? 'Edit Catalog Product' : 'Create New Product'}
            </h1>
            <p className="text-slate-550 text-xs mt-0.5">
              {initialData ? 'Update pricing, images, and option variants.' : 'Add a new product listing to the active catalog.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          <Link href="/dashboard/product" className="px-4 py-2 border border-slate-200 text-slate-650 rounded-xl text-xs font-bold hover:bg-slate-50 transition duration-200">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition duration-200 disabled:opacity-50 flex items-center gap-1.5 shadow-sm shadow-emerald-600/10 cursor-pointer"
          >
            {loading ? (
              <>
                <BiLoaderAlt className="animate-spin text-sm" />
                Saving...
              </>
            ) : (
              <>
                <BiCheck className="text-sm" />
                {initialData ? 'Save Changes' : 'Create Product'}
              </>
            )}
          </button>
        </div>
      </div>

      <div className="w-full mx-auto flex flex-col gap-6">
          
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 flex flex-col gap-5">
            <div className="flex items-center gap-2 border-b border-slate-50 pb-3">
              <BiListUl className="text-emerald-600 text-lg" />
              <h3 className="font-bold text-sm text-slate-800">Basic Information</h3>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-650 uppercase">Product Name *</label>
              <input className="input-style"
                type="text"
                required
                placeholder="e.g. Premium Wireless Headphones v2"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-655 uppercase">Category *</label>
                  <button
                    type="button"
                    onClick={() => setIsCategoryModalOpen(true)}
                    className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 hover:text-emerald-500 transition cursor-pointer"
                  >
                    <BiPlus className="text-xs" /> Add New
                  </button>
                </div>
                <select
                  required
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  disabled={fetchingOptions}
                  className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/15 outline-none transition duration-200 disabled:opacity-50 cursor-pointer"
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat.category_id} value={cat.category_id}>
                      {cat.parent_name ? `${cat.parent_name} > ` : ''}{cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-655 uppercase">Brand *</label>
                  <button
                    type="button"
                    onClick={() => setIsBrandModalOpen(true)}
                    className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 hover:text-emerald-500 transition cursor-pointer"
                  >
                    <BiPlus className="text-xs" /> Add New
                  </button>
                </div>
                <select
                  required
                  value={brandId}
                  onChange={(e) => setBrandId(e.target.value)}
                  disabled={fetchingOptions}
                  className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/15 outline-none transition duration-200 disabled:opacity-50 cursor-pointer"
                >
                  <option value="">Select Brand</option>
                  {brands.map((br) => (
                    <option key={br.brand_id} value={br.brand_id}>
                      {br.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-655 uppercase">Description</label>
              <RichTextEditor value={description} onChange={setDescription} />
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-slate-50 pb-3">
              <div className="flex items-center gap-2">
                <BiPackage className="text-emerald-600 text-lg" />
                <h3 className="font-bold text-sm text-slate-800">Product Configurations</h3>
              </div>
              <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => setProductType('simple')}
                  className={`px-3 py-1.5 text-xxs font-bold rounded-md transition duration-200 cursor-pointer ${
                    productType === 'simple'
                      ? 'bg-white text-emerald-700 shadow-sm'
                      : 'text-slate-555 hover:text-slate-855'
                  }`}
                >
                  Simple
                </button>
                <button
                  type="button"
                  onClick={() => setProductType('variable')}
                  className={`px-3 py-1.5 text-xxs font-bold rounded-md transition duration-200 cursor-pointer ${
                    productType === 'variable'
                      ? 'bg-white text-emerald-700 shadow-sm'
                      : 'text-slate-555 hover:text-slate-855'
                  }`}
                >
                  Variable (Variants)
                </button>
              </div>
            </div>

            {productType === 'simple' ? (
              <div className="flex flex-col gap-5">
                
                <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Cost Price *</label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-2 text-slate-400 text-xs font-semibold">৳</span>
                      <input className="input-style"
                        type="number"
                        step="0.01"
                        required
                        value={purchasePrice}
                        onChange={(e) => setPurchasePrice(parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Sale Price *</label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-2 text-slate-400 text-xs font-semibold">৳</span>
                      <input className="input-style"
                        type="number"
                        step="0.01"
                        required
                        value={salePrice}
                        onChange={(e) => setSalePrice(parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Discount Price</label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-2 text-slate-400 text-xs font-semibold">৳</span>
                      <input className="input-style"
                        type="number"
                        step="0.01"
                        value={discountPrice}
                        onChange={(e) => setDiscountPrice(parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Wholesale Price</label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-2 text-slate-400 text-xs font-semibold">৳</span>
                      <input className="input-style"
                        type="number"
                        step="0.01"
                        value={wholesalePrice}
                        onChange={(e) => setWholesalePrice(parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Dealer Price</label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-2 text-slate-400 text-xs font-semibold">৳</span>
                      <input className="input-style"
                        type="number"
                        step="0.01"
                        value={dealerPrice}
                        onChange={(e) => setDealerPrice(parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Retail Price</label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-2 text-slate-400 text-xs font-semibold">৳</span>
                      <input className="input-style"
                        type="number"
                        step="0.01"
                        value={retailPrice}
                        onChange={(e) => setRetailPrice(parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-655 uppercase">Unit</label>
                    <select
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                    >
                      <option value="Pcs">Pcs</option>
                      <option value="Litter">Litter</option>
                      <option value="Kg">Kg</option>
                      <option value="Bottle">Bottle</option>
                      <option value="Box">Box</option>
                      <option value="Pack">Pack</option>
                      <option value="Gram">Gram</option>
                      <option value="Ml">Ml</option>
                      <option value="Dozen">Dozen</option>
                      <option value="Meter">Meter</option>
                      <option value="Roll">Roll</option>
                      <option value="Set">Set</option>
                      <option value="Bag">Bag</option>
                      <option value="Can">Can</option>
                      <option value="Pair">Pair</option>
                      <option value="Tube">Tube</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-655 uppercase">Weight (Kg)</label>
                    <input className="input-style"
                      type="number"
                      step="0.01"
                      placeholder="0"
                      value={weight}
                      onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-655 uppercase">Barcode</label>
                    <div className="relative flex items-center">
                      <input className="input-style"
                        type="text"
                        placeholder="Scan or type..."
                        value={barcode}
                        onChange={(e) => setBarcode(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                      />
                      <button
                        type="button"
                        onClick={() => setScannerActive(!scannerActive)}
                        className={`absolute right-2 text-slate-400 hover:text-emerald-600 transition cursor-pointer text-sm p-1 rounded-md ${scannerActive ? 'text-emerald-600 bg-emerald-50' : ''}`}
                      >
                        <BiBarcode />
                      </button>
                    </div>
                  </div>
                </div>

                {scannerActive && (
                  <div className="border border-slate-100 rounded-xl p-3 bg-slate-50 mt-1 max-w-sm">
                    <BarScanner onScan={(scanned) => {
                      setBarcode(scanned)
                      setScannerActive(false)
                      toast.success(`Scanned barcode: ${scanned}`)
                    }} />
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                
                <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200/50 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Configure New Variant Option</h4>
                    
                    <button
                      type="button"
                      onClick={() => setNewVarIsActive(!newVarIsActive)}
                      className="flex items-center gap-1.5 text-xxs font-bold text-slate-600 hover:text-slate-800 transition focus:outline-none cursor-pointer"
                    >
                      Variant Active: 
                      {newVarIsActive ? (
                        <BiToggleRight className="text-xl text-emerald-600" />
                      ) : (
                        <BiToggleLeft className="text-xl text-slate-400" />
                      )}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    <div className="flex flex-col gap-1.5 col-span-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Option Name (e.g. Red / M) *</label>
                      <input className="input-style"
                        type="text"
                        placeholder="Red - XL"
                        value={newVarName}
                        onChange={(e) => setNewVarName(e.target.value)}
                      />
                    </div>
                    
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Barcode</label>
                      <input className="input-style"
                        type="text"
                        placeholder="Barcode"
                        value={newVarBarcode}
                        onChange={(e) => setNewVarBarcode(e.target.value)}
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Variant Image</label>
                      <div className="flex items-center gap-2">
                        {newVarImagePreview ? (
                          <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-slate-200 bg-white flex items-center justify-center shrink-0">
                            <img src={newVarImagePreview} alt="Preview" className="object-cover w-full h-full" />
                            <button
                              type="button"
                              onClick={() => {
                                setNewVarImageFile(null)
                                setNewVarImagePreview('')
                              }}
                              className="absolute inset-0 bg-black/60 text-white flex items-center justify-center text-[10px] hover:opacity-100 transition opacity-0 cursor-pointer font-bold"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <label className="w-8 h-8 rounded-lg border border-dashed border-slate-300 hover:border-emerald-500 flex items-center justify-center cursor-pointer text-slate-400 hover:text-emerald-500 transition shrink-0 bg-white">
                            <BiUpload className="text-sm" />
                            <input className="input-style hidden"
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files[0]
                                if (file) {
                                  setNewVarImageFile(file)
                                  setNewVarImagePreview(URL.createObjectURL(file))
                                }
                              }}
                            />
                          </label>
                        )}
                        <span className="text-[9px] text-slate-455 truncate max-w-[70px] font-medium">
                          {newVarImageFile ? newVarImageFile.name : 'No image'}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Cost Price *</label>
                      <input className="input-style"
                        type="number"
                        step="0.01"
                        value={newVarPurchasePrice}
                        onChange={(e) => setNewVarPurchasePrice(parseFloat(e.target.value) || 0)}
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Sale Price *</label>
                      <input className="input-style"
                        type="number"
                        step="0.01"
                        value={newVarPrice}
                        onChange={(e) => setNewVarPrice(parseFloat(e.target.value) || 0)}
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Discount Price</label>
                      <input className="input-style"
                        type="number"
                        step="0.01"
                        value={newVarDiscountPrice}
                        onChange={(e) => setNewVarDiscountPrice(parseFloat(e.target.value) || 0)}
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Wholesale Price</label>
                      <input className="input-style"
                        type="number"
                        step="0.01"
                        value={newVarWholesalePrice}
                        onChange={(e) => setNewVarWholesalePrice(parseFloat(e.target.value) || 0)}
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Dealer Price</label>
                      <input className="input-style"
                        type="number"
                        step="0.01"
                        value={newVarDealerPrice}
                        onChange={(e) => setNewVarDealerPrice(parseFloat(e.target.value) || 0)}
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Retail Price</label>
                      <input className="input-style"
                        type="number"
                        step="0.01"
                        value={newVarRetailPrice}
                        onChange={(e) => setNewVarRetailPrice(parseFloat(e.target.value) || 0)}
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Weight (Kg)</label>
                      <input className="input-style"
                        type="number"
                        step="0.01"
                        value={newVarWeight}
                        onChange={(e) => setNewVarWeight(parseFloat(e.target.value) || 0)}
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Unit</label>
                      <select
                        value={newVarUnit}
                        onChange={(e) => setNewVarUnit(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                      >
                        <option value="Pcs">Pcs</option>
                        <option value="Litter">Litter</option>
                        <option value="Kg">Kg</option>
                        <option value="Bottle">Bottle</option>
                        <option value="Box">Box</option>
                        <option value="Pack">Pack</option>
                        <option value="Gram">Gram</option>
                        <option value="Ml">Ml</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={addVariant}
                    className="self-end mt-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xxs font-bold transition duration-200 flex items-center justify-center gap-1 shrink-0 cursor-pointer shadow-sm"
                  >
                    <BiPlus className="text-sm" /> Add Variant
                  </button>
                </div>

                {variants.length > 0 ? (
                  <div className="border border-slate-100 rounded-xl overflow-hidden bg-white shadow-sm overflow-x-auto">
                    <table className="w-full text-left text-xs min-w-[1150px]">
                      <thead className="bg-slate-50 text-slate-650 font-bold border-b border-slate-100">
                        <tr>
                          <th className="px-3 py-3 w-[70px] text-center">Image</th>
                          <th className="px-3 py-3 w-[140px]">Variant Name *</th>
                          <th className="px-3 py-3 w-[120px]">Barcode</th>
                          <th className="px-3 py-3 w-[90px]">Cost Price *</th>
                          <th className="px-3 py-3 w-[90px]">Sale Price *</th>
                          <th className="px-3 py-3 w-[90px]">Discount</th>
                          <th className="px-3 py-3 w-[90px]">Wholesale</th>
                          <th className="px-3 py-3 w-[90px]">Dealer</th>
                          <th className="px-3 py-3 w-[90px]">Retail</th>
                          <th className="px-3 py-3 w-[70px]">Weight</th>
                          <th className="px-3 py-3 w-[85px]">Unit</th>
                          <th className="px-3 py-3 w-[70px] text-center">Active</th>
                          <th className="px-3 py-3 text-right w-[50px]">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {variants.map((v, index) => {
                          const displaySalePrice = v.sale_price !== undefined ? v.sale_price : (v.price || 0);
                          return (
                            <tr key={index} className="hover:bg-slate-50/40 transition duration-150">
                              <td className="px-2 py-1.5 text-center">
                                <div className="relative group w-10 h-10 rounded-lg overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center mx-auto shadow-sm">
                                  <img
                                    src={v.imagePreview || v.image || imagePreview || '/product.jpeg'}
                                    alt={v.variant_name}
                                    className="object-cover w-full h-full"
                                  />
                                  <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white cursor-pointer transition duration-200">
                                    <BiUpload className="text-base" />
                                    <input className="input-style hidden"
                                      type="file"
                                      accept="image/*"
                                      onChange={(e) => {
                                        const file = e.target.files[0]
                                        if (file) {
                                          handleVariantChange(index, 'imageFile', file)
                                          handleVariantChange(index, 'imagePreview', URL.createObjectURL(file))
                                        }
                                      }}
                                    />
                                  </label>
                                </div>
                              </td>
                              <td className="px-2 py-1.5">
                                <input className="input-style"
                                  type="text"
                                  required
                                  placeholder="Red - XL"
                                  value={v.variant_name || ''}
                                  onChange={(e) => handleVariantChange(index, 'variant_name', e.target.value)}
                                />
                              </td>
                              <td className="px-2 py-1.5">
                                <input className="input-style"
                                  type="text"
                                  placeholder="Barcode"
                                  value={v.barcode || ''}
                                  onChange={(e) => handleVariantChange(index, 'barcode', e.target.value)}
                                />
                              </td>
                              <td className="px-2 py-1.5">
                                <input className="input-style"
                                  type="number"
                                  step="0.01"
                                  required
                                  value={v.purchase_price !== undefined ? v.purchase_price : 0}
                                  onChange={(e) => handleVariantChange(index, 'purchase_price', parseFloat(e.target.value) || 0)}
                                />
                              </td>
                              <td className="px-2 py-1.5">
                                <input className="input-style"
                                  type="number"
                                  step="0.01"
                                  required
                                  value={displaySalePrice}
                                  onChange={(e) => {
                                    handleVariantChange(index, 'sale_price', parseFloat(e.target.value) || 0)
                                    handleVariantChange(index, 'price', parseFloat(e.target.value) || 0)
                                  }}
                                />
                              </td>
                              <td className="px-2 py-1.5">
                                <input className="input-style"
                                  type="number"
                                  step="0.01"
                                  value={v.discount_price !== undefined ? v.discount_price : 0}
                                  onChange={(e) => handleVariantChange(index, 'discount_price', parseFloat(e.target.value) || 0)}
                                />
                              </td>
                              <td className="px-2 py-1.5">
                                <input className="input-style"
                                  type="number"
                                  step="0.01"
                                  value={v.wholesale_price !== undefined ? v.wholesale_price : 0}
                                  onChange={(e) => handleVariantChange(index, 'wholesale_price', parseFloat(e.target.value) || 0)}
                                />
                              </td>
                              <td className="px-2 py-1.5">
                                <input className="input-style"
                                  type="number"
                                  step="0.01"
                                  value={v.dealer_price !== undefined ? v.dealer_price : 0}
                                  onChange={(e) => handleVariantChange(index, 'dealer_price', parseFloat(e.target.value) || 0)}
                                />
                              </td>
                              <td className="px-2 py-1.5">
                                <input className="input-style"
                                  type="number"
                                  step="0.01"
                                  value={v.retail_price !== undefined ? v.retail_price : 0}
                                  onChange={(e) => handleVariantChange(index, 'retail_price', parseFloat(e.target.value) || 0)}
                                />
                              </td>
                              <td className="px-2 py-1.5">
                                <input className="input-style"
                                  type="number"
                                  step="0.01"
                                  value={v.weight !== undefined ? v.weight : 0}
                                  onChange={(e) => handleVariantChange(index, 'weight', parseFloat(e.target.value) || 0)}
                                />
                              </td>
                              <td className="px-2 py-1.5">
                                <select
                                  value={v.unit || 'Pcs'}
                                  onChange={(e) => handleVariantChange(index, 'unit', e.target.value)}
                                  className="w-full px-1 py-1 bg-slate-50 border border-slate-200 focus:bg-white rounded-lg text-[11px] outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                                >
                                  <option value="Pcs">Pcs</option>
                                  <option value="Litter">Litter</option>
                                  <option value="Kg">Kg</option>
                                  <option value="Bottle">Bottle</option>
                                  <option value="Box">Box</option>
                                  <option value="Pack">Pack</option>
                                  <option value="Gram">Gram</option>
                                  <option value="Ml">Ml</option>
                                </select>
                              </td>
                              <td className="px-2 py-1.5 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleVariantChange(index, 'is_active', v.is_active === false)}
                                  className="text-lg transition focus:outline-none inline-block mx-auto cursor-pointer"
                                >
                                  {v.is_active !== false ? (
                                    <BiToggleRight className="text-emerald-600 text-xl" />
                                  ) : (
                                    <BiToggleLeft className="text-slate-400 text-xl" />
                                  )}
                                </button>
                              </td>
                              <td className="px-2 py-1.5 text-right">
                                <button
                                  type="button"
                                  onClick={() => removeVariant(index)}
                                  className="p-1 text-slate-450 hover:text-rose-600 hover:bg-rose-50 rounded-md transition cursor-pointer"
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
                  <div className="text-center py-8 border border-dashed border-slate-200 rounded-2xl text-slate-450 text-xs bg-slate-50/50">
                    No variant combinations added yet. Define product configurations above.
                  </div>
                )}
              </div>
            )}
          </div>
          
          {productType === 'simple' ? (
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 flex flex-col gap-5">
              <div className="flex items-center gap-2 border-b border-slate-50 pb-3">
                <BiImage className="text-emerald-600 text-lg" />
                <h3 className="font-bold text-sm text-slate-800">Product Image</h3>
              </div>

              <div className="flex flex-col gap-3">
                {imagePreview ? (
                  <div className="relative group w-full h-56 rounded-2xl border border-slate-100 overflow-hidden bg-slate-50 flex items-center justify-center">
                    <img
                      src={imagePreview}
                      alt="Product Preview"
                      className="object-cover w-full h-full"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition duration-200">
                      <label className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/35 rounded-xl text-xs font-semibold cursor-pointer transition">
                        Change Image
                        <input className="input-style hidden"
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                        />
                      </label>
                    </div>
                  </div>
                ) : (
                  <label className="w-full h-56 flex flex-col items-center justify-center border-2 border-dashed border-slate-250 hover:border-emerald-500 rounded-2xl p-6 hover:bg-slate-50/50 transition duration-200 cursor-pointer text-slate-450 hover:text-slate-650">
                    <BiUpload className="text-3xl mb-2 text-slate-400" />
                    <span className="text-xs font-bold uppercase tracking-wide">Upload Product Image</span>
                    <span className="text-[10px] text-slate-450 mt-1">Accepts PNG, JPG, JPEG up to 5MB</span>
                    <input className="input-style hidden"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                  </label>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 flex flex-col gap-3 text-slate-500">
              <div className="flex items-center gap-2 border-b border-slate-50 pb-3">
                <BiImage className="text-emerald-600 text-lg" />
                <h3 className="font-bold text-sm text-slate-800">Variant Images</h3>
              </div>
              <p className="text-xs leading-relaxed text-slate-500">
                This is a variable product. Please upload and manage images for each variant combination individually in the table on the left.
              </p>
            </div>
          )}

          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-slate-50 pb-3">
              <BiCheck className="text-emerald-600 text-lg" />
              <h3 className="font-bold text-sm text-slate-800">Status & Listings</h3>
            </div>

            <div className="flex items-center justify-between bg-slate-50/50 border border-slate-100 p-4 rounded-xl">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-bold text-slate-800">Product Active</span>
                <span className="text-[10px] text-slate-500">Show in consumer catalogs</span>
              </div>
              <button
                type="button"
                onClick={() => setIsActive(!isActive)}
                className="focus:outline-none transition cursor-pointer"
              >
                {isActive ? (
                  <BiToggleRight className="text-3xl text-emerald-600" />
                ) : (
                  <BiToggleLeft className="text-3xl text-slate-400" />
                )}
              </button>
            </div>
          </div>

      </div>

      </form>

      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl border border-slate-100 shadow-xl overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BiPlus className="text-lg text-emerald-600" />
                <h3 className="font-bold text-slate-800 text-sm">Create New Category</h3>
              </div>
              <button 
                type="button"
                onClick={() => {
                  setNewCatName('')
                  setNewCatParentId('')
                  setNewCatImage(null)
                  setNewCatImagePreview('')
                  setIsCategoryModalOpen(false)
                }}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-650 transition cursor-pointer"
              >
                <BiX className="text-xl" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="p-5 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase">Category Name *</label>
                <input className="input-style"
                  required
                  type="text"
                  placeholder="e.g. Smart Electronics"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase">Parent Category (Optional)</label>
                <select
                  value={newCatParentId}
                  onChange={(e) => setNewCatParentId(e.target.value)}
                  className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition cursor-pointer"
                >
                  <option value="">None (Primary Category)</option>
                  {categories.map((cat) => (
                    <option key={cat.category_id} value={cat.category_id}>
                      {cat.parent_name ? `${cat.parent_name} > ` : ''}{cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-705 uppercase">Category Image (Optional)</label>
                <div className="flex items-center gap-3">
                  {newCatImagePreview ? (
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200 bg-white flex items-center justify-center shrink-0">
                      <img src={newCatImagePreview} alt="Category preview" className="object-cover w-full h-full" />
                      <button
                        type="button"
                        onClick={() => {
                          setNewCatImage(null)
                          setNewCatImagePreview('')
                        }}
                        className="absolute inset-0 bg-black/60 text-white flex items-center justify-center text-xs hover:opacity-100 transition opacity-0 cursor-pointer font-bold"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <label className="w-16 h-16 rounded-xl border border-dashed border-slate-300 hover:border-emerald-500 flex flex-col items-center justify-center cursor-pointer text-slate-400 hover:text-emerald-500 transition shrink-0 bg-slate-50">
                      <BiUpload className="text-lg" />
                      <span className="text-[9px] font-bold mt-1">Upload</span>
                      <input className="input-style hidden"
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files[0]
                          if (file) {
                            setNewCatImage(file)
                            setNewCatImagePreview(URL.createObjectURL(file))
                          }
                        }}
                      />
                    </label>
                  )}
                  <div className="flex flex-col">
                    <span className="text-xxs text-slate-500 leading-tight">
                      {newCatImage ? newCatImage.name : 'Choose a category display photo.'}
                    </span>
                    <span className="text-[9px] text-slate-400 mt-0.5">JPG, PNG, WebP up to 5MB</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setNewCatName('')
                    setNewCatParentId('')
                    setNewCatImage(null)
                    setNewCatImagePreview('')
                    setIsCategoryModalOpen(false)
                  }}
                  className="px-4 py-2 border border-slate-200 text-slate-650 rounded-xl text-xs font-bold hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingCategory}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition disabled:opacity-50 flex items-center gap-1.5 shadow-sm shadow-emerald-600/10 cursor-pointer"
                >
                  {creatingCategory ? (
                    <>
                      <BiLoaderAlt className="animate-spin text-sm" />
                      Creating...
                    </>
                  ) : (
                    'Create Category'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isBrandModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl border border-slate-100 shadow-xl overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BiPlus className="text-lg text-emerald-600" />
                <h3 className="font-bold text-slate-800 text-sm">Create New Brand</h3>
              </div>
              <button 
                type="button"
                onClick={() => {
                  setNewBrandName('')
                  setNewBrandDesc('')
                  setNewBrandImage(null)
                  setNewBrandImagePreview('')
                  setNewBrandIsActive(true)
                  setIsBrandModalOpen(false)
                }}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-650 transition cursor-pointer"
              >
                <BiX className="text-xl" />
              </button>
            </div>

            <form onSubmit={handleCreateBrand} className="p-5 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase">Brand Name *</label>
                <input className="input-style"
                  required
                  type="text"
                  placeholder="e.g. Sony, Apple, Nike"
                  value={newBrandName}
                  onChange={(e) => setNewBrandName(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase">Description (Optional)</label>
                <textarea
                  placeholder="Describe the brand..."
                  value={newBrandDesc}
                  onChange={(e) => setNewBrandDesc(e.target.value)}
                  rows="2"
                  className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition resize-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-705 uppercase">Brand Logo Image (Optional)</label>
                <div className="flex items-center gap-3">
                  {newBrandImagePreview ? (
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200 bg-white flex items-center justify-center shrink-0">
                      <img src={newBrandImagePreview} alt="Brand logo preview" className="object-cover w-full h-full" />
                      <button
                        type="button"
                        onClick={() => {
                          setNewBrandImage(null)
                          setNewBrandImagePreview('')
                        }}
                        className="absolute inset-0 bg-black/60 text-white flex items-center justify-center text-xs hover:opacity-100 transition opacity-0 cursor-pointer font-bold"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <label className="w-16 h-16 rounded-xl border border-dashed border-slate-300 hover:border-emerald-500 flex flex-col items-center justify-center cursor-pointer text-slate-400 hover:text-emerald-500 transition shrink-0 bg-slate-50">
                      <BiUpload className="text-lg" />
                      <span className="text-[9px] font-bold mt-1">Upload</span>
                      <input className="input-style hidden"
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files[0]
                          if (file) {
                            setNewBrandImage(file)
                            setNewBrandImagePreview(URL.createObjectURL(file))
                          }
                        }}
                      />
                    </label>
                  )}
                  <div className="flex flex-col">
                    <span className="text-xxs text-slate-500 leading-tight">
                      {newBrandImage ? newBrandImage.name : 'Choose a brand logomark.'}
                    </span>
                    <span className="text-[9px] text-slate-400 mt-0.5">JPG, PNG, WebP up to 5MB</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs font-bold text-slate-655 uppercase">Brand Status</span>
                <button
                  type="button"
                  onClick={() => setNewBrandIsActive(!newBrandIsActive)}
                  className="flex items-center gap-1.5 text-xxs font-bold text-slate-600 hover:text-slate-800 transition focus:outline-none cursor-pointer"
                >
                  {newBrandIsActive ? 'Active' : 'Inactive'}
                  {newBrandIsActive ? (
                    <BiToggleRight className="text-2xl text-emerald-600 animate-fade-in" />
                  ) : (
                    <BiToggleLeft className="text-2xl text-slate-400 animate-fade-in" />
                  )}
                </button>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setNewBrandName('')
                    setNewBrandDesc('')
                    setNewBrandImage(null)
                    setNewBrandImagePreview('')
                    setNewBrandIsActive(true)
                    setIsBrandModalOpen(false)
                  }}
                  className="px-4 py-2 border border-slate-200 text-slate-650 rounded-xl text-xs font-bold hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingBrand}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition disabled:opacity-50 flex items-center gap-1.5 shadow-sm shadow-emerald-600/10 cursor-pointer"
                >
                  {creatingBrand ? (
                    <>
                      <BiLoaderAlt className="animate-spin text-sm" />
                      Creating...
                    </>
                  ) : (
                    'Create Brand'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

'use client'
import React, { useContext, useEffect, useState } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Context } from '@/component/helper/Context'
import { STORE_NAME, STORE_TAGLINE } from '@/lib/secret'
import { 
  BiCog, 
  BiUpload, 
  BiLoaderAlt, 
  BiSave, 
  BiShow,
  BiGlobe,
  BiLayout,
  BiLink,
  BiDollarCircle,
  BiRefresh
} from 'react-icons/bi'

export default function DashboardAdminSettingsPage() {
  const { dashSidebar, fetchWebsite, fetchActiveCurrency } = useContext(Context)
  const themeColor = '#73976A'
  
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [sociallink, setSociallink] = useState('')
  const [heroTitle, setHeroTitle] = useState('')
  const [heroSubtitle, setHeroSubtitle] = useState('')
  
  const [dbCurrencies, setDbCurrencies] = useState([])
  const [activatingId, setActivatingId] = useState(null)
  const [isCurrencyModalOpen, setIsCurrencyModalOpen] = useState(false)
  const [currencyTab, setCurrencyTab] = useState('select') 
  const [newCurrency, setNewCurrency] = useState({ code: '', name: '', symbol: '' })
  const [addingCurrency, setAddingCurrency] = useState(false)
  
  const [logoFile, setLogoFile] = useState(null)
  const [logoPreview, setLogoPreview] = useState('')
  const [existingLogoUrl, setExistingLogoUrl] = useState('')

  const [fetching, setFetching] = useState(true)
  const [saving, setSaving] = useState(false)

  const fetchCurrenciesList = async () => {
    try {
      const res = await axios.get('/api/currencies')
      if (res.data && Array.isArray(res.data)) {
        setDbCurrencies(res.data)
      }
    } catch (err) {
      console.error('Failed to load currencies list:', err)
    }
  }

  useEffect(() => {
    const fetchSettingsAndCurrencies = async () => {
      try {
        const [settingsRes, currRes] = await Promise.all([
          axios.get('/api/settings'),
          axios.get('/api/currencies')
        ])
        if (currRes.data && Array.isArray(currRes.data)) {
          setDbCurrencies(currRes.data)
        }
        const data = settingsRes.data
        if (data) {
          setEmail(data.email || '')
          setPhone(data.phone || '')
          setAddress(data.address || '')
          setSociallink(data.sociallink || '')
          setHeroTitle(data.hero_title || '')
          setHeroSubtitle(data.hero_subtitle || '')
          setLogoPreview(data.logo || data.logo_url || '')
          setExistingLogoUrl(data.logo || data.logo_url || '')
        }
      } catch (err) {
        toast.error('Failed to load website settings')
        console.error(err)
      } finally {
        setFetching(false)
      }
    }
    fetchSettingsAndCurrencies()
  }, [])

  const handleActivateCurrency = async (currencyId, name) => {
    setActivatingId(currencyId)
    try {
      await axios.patch('/api/currencies', { currency_id: currencyId })
      toast.success(`Store currency switched to ${name}!`)
      await fetchCurrenciesList()
      if (fetchActiveCurrency) {
        await fetchActiveCurrency()
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to activate currency')
      console.error(err)
    } finally {
      setActivatingId(null)
    }
  }

  const handleAddCurrencySubmit = async (e) => {
    e.preventDefault()
    if (!newCurrency.code || !newCurrency.name || !newCurrency.symbol) {
      toast.error('Please fill in all currency fields')
      return
    }
    setAddingCurrency(true)
    try {
      await axios.post('/api/currencies', newCurrency)
      toast.success(`Currency ${newCurrency.name} added successfully!`)
      setNewCurrency({ code: '', name: '', symbol: '' })
      setCurrencyTab('select')
      await fetchCurrenciesList()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add new currency')
      console.error(err)
    } finally {
      setAddingCurrency(false)
    }
  }

  const handleLogoChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setLogoFile(file)
      setLogoPreview(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    
    const formData = new FormData()
    formData.append('email', email)
    formData.append('phone', phone)
    formData.append('address', address)
    formData.append('sociallink', sociallink)
    formData.append('hero_title', heroTitle)
    formData.append('hero_subtitle', heroSubtitle)
    formData.append('currency_symbol', currencySymbol)
    formData.append('currency_code', currencyCode)
    if (currencyId) {
      formData.append('currency_id', currencyId)
    }
    
    if (logoFile) {
      formData.append('logo', logoFile)
    }

    try {
      const res = await axios.post('/api/settings', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      toast.success('Website settings updated successfully!')
      if (res.data && (res.data.logo || res.data.logo_url)) {
        const newUrl = res.data.logo || res.data.logo_url
        setExistingLogoUrl(newUrl)
        setLogoPreview(newUrl)
        setLogoFile(null)
      }
      if (fetchWebsite) {
        fetchWebsite()
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save settings')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  if (fetching) {
    return (
      <div className={`w-full min-h-screen bg-slate-50 pt-20 pb-12 px-4 md:px-8 transition-all duration-300 ${dashSidebar ? 'lg:pl-64' : 'lg:pl-8'} flex items-center justify-center`}>
        <div className="flex items-center gap-2 text-slate-500 font-semibold">
          <BiLoaderAlt className="animate-spin text-xl text-slate-800" />
          <span>Loading settings details...</span>
        </div>
      </div>
    )
  }

  return (
    <div className={`w-full min-h-screen bg-slate-50 pt-20 pb-12 px-2 sm:px-4 md:px-8 transition-all duration-300 ${dashSidebar ? 'lg:pl-64' : 'lg:pl-8'}`}>
      <div className="w-full flex flex-col gap-6">
        
        <div className="border-b border-slate-200 pb-4">
          <h1 className="text-xl md:text-2xl font-bold text-slate-800 flex items-center gap-2">
            <BiCog style={{ color: themeColor }} />
            Website Settings & Configuration
          </h1>
          <p className="text-slate-500 text-xs md:text-sm mt-0.5">Configure store branding logo, contact details, and landing page banner headers.</p>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          <div className="lg:col-span-2 flex flex-col gap-6">
            
            <div className="bg-white border border-slate-200 shadow-sm p-5 md:p-6 flex flex-col gap-5 rounded-2xl">
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-1.5">
                <BiGlobe style={{ color: themeColor }} className="text-base" /> General Identity
              </h2>
              
              <div className="p-3.5 bg-slate-50 border border-slate-200 flex flex-col sm:flex-row justify-between gap-3 items-start sm:items-center rounded-xl">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: themeColor }}>Secret Configured</span>
                  <h4 className="text-xs font-bold text-slate-800">{STORE_NAME}</h4>
                  <p className="text-[11px] text-slate-500 italic mt-0.5">"{STORE_TAGLINE}"</p>
                </div>
                <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded">
                  Managed in secret.js
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">Store Support Email</label>
                  <input 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 outline-none focus:border-slate-400 rounded-xl transition"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">Store Customer Phone</label>
                  <input 
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 outline-none focus:border-slate-400 rounded-xl transition"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">Office Showroom / Warehouse Address</label>
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 outline-none focus:border-slate-400 rounded-xl transition resize-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <BiLink className="text-slate-400 text-sm" /> Social Profile Link (e.g. Facebook/Instagram)
                </label>
                <input 
                  type="text"
                  value={sociallink}
                  onChange={(e) => setSociallink(e.target.value)}
                  className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 outline-none focus:border-slate-400 rounded-xl transition"
                />
              </div>

            </div>

            <div className="bg-white border border-slate-200 shadow-sm p-5 md:p-6 flex flex-col gap-4 rounded-2xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <BiDollarCircle style={{ color: themeColor }} className="text-base" /> Store Currency Manager
                  </h2>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Active currency currently used across prices, orders, purchases, and receipts.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCurrencyTab('select')
                    setIsCurrencyModalOpen(true)
                  }}
                  className="px-3.5 py-2 text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center justify-center gap-1.5 shrink-0 select-none cursor-pointer hover:opacity-95"
                  style={{ backgroundColor: themeColor }}
                >
                  <BiRefresh className="text-base" /> Change Currency
                </button>
              </div>

              {(() => {
                const activeCurr = dbCurrencies.find(c => c.is_active) || dbCurrencies[0] || { symbol: '৳', code: 'BDT', name: 'Bangladeshi Taka' }
                return (
                  <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-black text-slate-800 text-base shadow-xs shrink-0">
                        {activeCurr.symbol}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-black text-slate-800 tracking-tight">{activeCurr.name}</h4>
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-bold rounded-md uppercase font-mono">
                            {activeCurr.code}
                          </span>
                        </div>
                        <p className="text-[11px] font-medium text-slate-500 mt-0.5">
                          Sample format: <span className="font-bold text-slate-700 font-mono">{activeCurr.symbol}1,250.00</span>
                        </p>
                      </div>
                    </div>
                    
                    <span className="px-3 py-1 bg-emerald-600 text-white text-[11px] font-bold rounded-full uppercase tracking-wider flex items-center gap-1 shrink-0">
                      ✓ Active System Currency
                    </span>
                  </div>
                )
              })()}

              {isCurrencyModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
                  <div className="bg-white border border-slate-200 w-full max-w-lg p-6 rounded-2xl shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
                    
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                          <BiDollarCircle style={{ color: themeColor }} className="text-lg" /> Store Currency Setup
                        </h3>
                        <p className="text-[11px] text-slate-500 mt-0.5">Select an active store currency or register a new currency.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsCurrencyModalOpen(false)}
                        className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer p-1 rounded-lg hover:bg-slate-100 transition"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="flex border-b border-slate-100 gap-2">
                      <button
                        type="button"
                        onClick={() => setCurrencyTab('select')}
                        className={`pb-2 px-3 text-xs font-bold transition border-b-2 cursor-pointer ${
                          currencyTab === 'select'
                            ? 'border-emerald-600 text-emerald-800'
                            : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        Select Active Currency ({dbCurrencies.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setCurrencyTab('create')}
                        className={`pb-2 px-3 text-xs font-bold transition border-b-2 cursor-pointer ${
                          currencyTab === 'create'
                            ? 'border-emerald-600 text-emerald-800'
                            : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        + Create New Currency
                      </button>
                    </div>

                    {currencyTab === 'select' && (
                      <div className="flex flex-col gap-2.5 max-h-80 overflow-y-auto pr-1">
                        {dbCurrencies.map((curr) => {
                          const isActive = curr.is_active
                          const isActivating = activatingId === curr.currency_id

                          return (
                            <div
                              key={curr.currency_id || curr.code}
                              className={`p-3.5 border rounded-xl transition flex items-center justify-between gap-3 ${
                                isActive
                                  ? 'border-emerald-500 bg-emerald-50/50 ring-1 ring-emerald-500/20'
                                  : 'border-slate-200 bg-slate-50 hover:bg-white hover:border-slate-300'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center font-bold text-slate-800 text-sm font-mono shrink-0">
                                  {curr.symbol}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h5 className="text-xs font-bold text-slate-800">{curr.name}</h5>
                                    <span className="text-[10px] font-bold text-slate-500 font-mono">({curr.code})</span>
                                  </div>
                                  <p className="text-[10px] text-slate-400 mt-0.5">Preview: {curr.symbol}1,250.00</p>
                                </div>
                              </div>

                              {isActive ? (
                                <span className="px-2.5 py-1 bg-emerald-600 text-white text-[10px] font-bold rounded-full uppercase tracking-wider shrink-0">
                                  ✓ Active
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  disabled={isActivating}
                                  onClick={() => handleActivateCurrency(curr.currency_id, curr.name)}
                                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition disabled:opacity-50 cursor-pointer shrink-0"
                                >
                                  {isActivating ? 'Activating...' : 'Activate'}
                                </button>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {currencyTab === 'create' && (
                      <div className="flex flex-col gap-3 pt-1">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Currency Code (e.g. JPY, EUR, USD) *</label>
                          <input
                            type="text"
                            required
                            value={newCurrency.code}
                            onChange={(e) => setNewCurrency({ ...newCurrency, code: e.target.value.toUpperCase() })}
                            placeholder="e.g. JPY"
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-slate-400 font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Full Currency Name *</label>
                          <input
                            type="text"
                            required
                            value={newCurrency.name}
                            onChange={(e) => setNewCurrency({ ...newCurrency, name: e.target.value })}
                            placeholder="e.g. Japanese Yen"
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-slate-400"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Currency Symbol *</label>
                          <input
                            type="text"
                            required
                            value={newCurrency.symbol}
                            onChange={(e) => setNewCurrency({ ...newCurrency, symbol: e.target.value })}
                            placeholder="e.g. ¥, $, ৳, €"
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-slate-400 font-mono"
                          />
                        </div>

                        <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3 mt-2">
                          <button
                            type="button"
                            onClick={() => setCurrencyTab('select')}
                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                          >
                            Back to Select
                          </button>
                          <button
                            type="button"
                            disabled={addingCurrency}
                            onClick={handleAddCurrencySubmit}
                            className="px-4 py-2 text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50 shadow-xs"
                            style={{ backgroundColor: themeColor }}
                          >
                            {addingCurrency ? 'Saving Currency...' : 'Save & Register Currency'}
                          </button>
                        </div>
                      </div>
                    )}

                  </div>
                </div>
              )}

            </div>

            <div className="bg-white border border-slate-200 shadow-sm p-5 md:p-6 flex flex-col gap-5 rounded-2xl">
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-1.5">
                <BiLayout style={{ color: themeColor }} className="text-base" /> Landing Hero Section
              </h2>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">Hero Main Title Banner</label>
                <input 
                  type="text"
                  value={heroTitle}
                  onChange={(e) => setHeroTitle(e.target.value)}
                  className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 outline-none focus:border-slate-400 rounded-xl transition"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">Hero Subtitle Banner</label>
                <textarea
                  rows={2}
                  value={heroSubtitle}
                  onChange={(e) => setHeroSubtitle(e.target.value)}
                  className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 outline-none focus:border-slate-400 rounded-xl transition resize-none"
                />
              </div>
            </div>

          </div>

          <div className="flex flex-col gap-6">
            
            <div className="bg-white border border-slate-200 shadow-sm p-5 md:p-6 flex flex-col gap-5 rounded-2xl">
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-1.5">
                <BiUpload style={{ color: themeColor }} className="text-base" /> Website Logo (Cloudinary)
              </h2>

              <div className="flex flex-col gap-2.5">
                <label className="text-xs font-bold text-slate-700">Website Logo File</label>
                
                <div className="flex flex-col items-center gap-4 border-2 border-dashed border-slate-200 p-4 hover:bg-slate-50 transition relative rounded-xl">
                  
                  {logoPreview ? (
                    <div className="relative w-28 h-28 border border-slate-200 bg-slate-50 flex items-center justify-center shrink-0 rounded-xl overflow-hidden p-2">
                      <img
                        src={logoPreview}
                        alt="Logo Preview"
                        className="object-contain w-full h-full"
                      />
                    </div>
                  ) : (
                    <div className="w-28 h-28 border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-400 text-[10px] font-bold uppercase tracking-wider border-dashed border-2 rounded-xl">
                      No Logo
                    </div>
                  )}

                  <label className="w-full flex items-center justify-center py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer select-none gap-1.5 border border-slate-200 rounded-xl">
                    <BiUpload className="text-base" style={{ color: themeColor }} /> Select & Replace Logo
                    <input className="hidden"
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                    />
                  </label>
                  <p className="text-[10px] text-slate-400 text-center">Uploading a new logo will delete the old image from Cloudinary automatically.</p>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 mt-1 flex flex-col gap-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-3 text-white text-xs md:text-sm font-bold transition cursor-pointer flex items-center justify-center gap-2 shadow-md rounded-xl disabled:opacity-50 hover:opacity-95"
                  style={{ backgroundColor: themeColor }}
                >
                  {saving ? (
                    <>
                      <BiLoaderAlt className="animate-spin text-lg" />
                      Saving settings...
                    </>
                  ) : (
                    <>
                      <BiSave className="text-lg" /> Save Changes
                    </>
                  )}
                </button>
              </div>

            </div>

            <div className="bg-white border border-slate-200 shadow-sm p-5 md:p-6 flex flex-col gap-4 rounded-2xl">
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-1.5">
                <BiShow style={{ color: themeColor }} className="text-base" /> Live Preview
              </h2>

              <div className="w-full p-5 border border-slate-200 relative min-h-[160px] flex flex-col justify-center gap-2 rounded-xl bg-slate-50">
                {logoPreview && (
                  <div className="w-12 h-12 bg-white p-1 w-fit mb-1 border border-slate-200 rounded-lg">
                    <img src={logoPreview} alt="mock" className="object-contain w-full h-full" />
                  </div>
                )}
                
                <h3 className="text-xs md:text-sm font-bold text-slate-800 leading-tight">
                  {heroTitle || 'Your Banner Title'}
                </h3>
                
                <p className="text-[10px] text-slate-600 leading-relaxed">
                  {heroSubtitle || 'Your Hero subtitle details banner content here.'}
                </p>
              </div>
            </div>

          </div>

        </form>

      </div>
    </div>
  )
}

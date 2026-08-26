'use client'
import React, { useState, useContext } from 'react'
import { Context } from '@/component/helper/Context'
import toast from 'react-hot-toast'
import { 
  BiCloudDownload, 
  BiData, 
  BiServer, 
  BiCheckCircle, 
  BiFile,
  BiLoaderAlt,
  BiShieldQuarter
} from 'react-icons/bi'

export default function AdminBackupPage() {
  const { dashSidebar, user, website } = useContext(Context)
  const themeColor = website?.theme_color || '#73976A'

  const [downloading, setDownloading] = useState(false)

  const handleDownloadBackup = async () => {
    setDownloading(true)
    const toastId = toast.loading('Generating full database backup...')

    try {
      const response = await fetch('/api/backup')
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || errorData.error || 'Failed to generate backup')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `pos_database_backup_${new Date().toISOString().slice(0, 10)}.sql`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success('Database backup downloaded successfully!', { id: toastId })
    } catch (err) {
      console.error(err)
      toast.error(err.message || 'Failed to download backup', { id: toastId })
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className={`w-full min-h-screen bg-slate-50 pt-20 pb-12 px-2 sm:px-4 md:px-8 transition-all duration-300 ${dashSidebar ? 'lg:pl-64' : 'lg:pl-8'}`}>
      <div className="w-full max-w-4xl mx-auto flex flex-col gap-6">
        
        {/* Header */}
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-800 flex items-center gap-2">
            <BiData style={{ color: themeColor }} />
            Database Backup & Recovery
          </h1>
          <p className="text-slate-500 text-xs md:text-sm mt-0.5">Export a full .sql dump of all tables, schema structures, and store data.</p>
        </div>

        {/* Info & Download Card */}
        <div className="bg-white border border-slate-200 shadow-sm p-6 md:p-8 rounded-2xl flex flex-col gap-6">
          <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
            <div className="w-14 h-14 rounded-2xl text-white flex items-center justify-center text-3xl font-bold shadow-md shrink-0" style={{ backgroundColor: themeColor }}>
              <BiCloudDownload />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Export Full SQL Database Backup</h2>
              <p className="text-slate-500 text-xs mt-0.5">Generate and download a standard SQL dump containing all system users, inventory, products, categories, orders, and sales ledgers.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center gap-3">
              <BiServer className="text-2xl text-slate-500" />
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-slate-400">Database Engine</span>
                <span className="text-xs font-bold text-slate-800">PostgreSQL</span>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center gap-3">
              <BiServer className="text-2xl text-slate-500" />
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-slate-400">File Format</span>
                <span className="text-xs font-bold text-slate-800">Standard SQL (.sql)</span>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center gap-3">
              <BiCheckCircle className="text-2xl text-emerald-600" />
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-slate-400">Security</span>
                <span className="text-xs font-bold text-slate-800">Admin Encrypted</span>
              </div>
            </div>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <BiFile className="text-base text-slate-400" />
              <span>Includes complete table schemas and row contents.</span>
            </div>

            <button
              onClick={handleDownloadBackup}
              disabled={downloading}
              className="w-full sm:w-auto px-6 py-3 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 hover:opacity-95"
              style={{ backgroundColor: themeColor }}
            >
              {downloading ? (
                <>
                  <BiLoaderAlt className="animate-spin text-lg" /> Generating SQL Dump...
                </>
              ) : (
                <>
                  <BiCloudDownload className="text-xl" /> Download Database Backup (.sql)
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}

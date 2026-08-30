'use client'
import React, { useContext, useEffect, useState } from 'react'
import Link from 'next/link'
import axios from 'axios'
import { Context } from '@/component/helper/Context'
import { STORE_NAME } from '@/lib/secret'
import { 
  BiFile, 
  BiPrinter, 
  BiLoaderAlt, 
  BiShieldQuarter, 
  BiTrendingUp, 
  BiCategory, 
  BiDollarCircle, 
  BiCreditCard,
  BiDownload,
  BiUser,
  BiReceipt,
  BiPackage,
  BiCart,
  BiBarcode,
  BiCloudDownload
} from 'react-icons/bi'

export default function ManagerReportPage() {
  const { dashSidebar, user, loading: userLoading } = useContext(Context)
  
  const [reportData, setReportData] = useState({
    topProducts: [],
    categorySales: [],
    salesTrend: [],
    paymentBreakdown: []
  })
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState({
    customers: false,
    payments: false,
    purchases: false,
    sales: false,
    products: false
  })

  const handleExport = async (type) => {
    setExporting(prev => ({ ...prev, [type]: true }))
    try {
      const response = await axios.get(`/api/report/export?type=${type}`, {
        responseType: 'blob'
      })
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      
      const disposition = response.headers['content-disposition']
      let filename = `${type}_report_${Date.now()}.xlsx`
      if (disposition && disposition.indexOf('attachment') !== -1) {
        const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/
        const matches = filenameRegex.exec(disposition)
        if (matches != null && matches[1]) { 
          filename = matches[1].replace(/['"]/g, '')
        }
      }
      
      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error(`Failed to export ${type}:`, error)
      alert(`Failed to export ${type} data. Please try again.`)
    } finally {
      setExporting(prev => ({ ...prev, [type]: false }))
    }
  }

  const exportCards = [
    {
      type: 'customers',
      title: 'Customer Directory',
      description: 'Profiles, contact phones, emails, shipping addresses, and registration dates.',
      icon: BiUser,
    },
    {
      type: 'payments',
      title: 'Payment Transactions',
      description: 'Billing receipts, methods, transaction IDs, received amounts, and status.',
      icon: BiReceipt,
    },
    {
      type: 'purchases',
      title: 'Purchase Audits',
      description: 'Supply logs, supplier details, discounts, payments, and balances.',
      icon: BiPackage,
    },
    {
      type: 'sales',
      title: 'Sales Invoices',
      description: 'Customer order logs, items, shipping details, totals, and due amounts.',
      icon: BiCart,
    },
    {
      type: 'products',
      title: 'Product Stock',
      description: 'Catalog items, barcode, pricing structures, category mapping, and stock units.',
      icon: BiBarcode,
    },
  ]

  const fetchReportData = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/api/sale/report')
      setReportData(res.data)
    } catch (err) {
      console.error('Failed to fetch analytics reports:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (userLoading) return
    if (user && ['manager', 'admin'].includes(user.role)) {
      fetchReportData()
    }
  }, [user, userLoading])

  const handlePrintReport = () => {
    const printWindow = window.open('', '_blank', 'width=900,height=900')
    if (!printWindow) return

    const storeName = STORE_NAME
    const today = new Date().toLocaleDateString()

    const trendRows = reportData.salesTrend.map(row => `
      <tr>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: left;">${new Date(row.date).toLocaleDateString()}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: center;">${row.count}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 600;">৳${parseFloat(row.total).toFixed(2)}</td>
      </tr>
    `).join('')

    const productRows = reportData.topProducts.map((row, idx) => `
      <tr>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: center; font-weight: bold;">#${idx + 1}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: left; font-weight: 600;">${row.name}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: center;">${row.quantity}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 600;">৳${parseFloat(row.revenue).toFixed(2)}</td>
      </tr>
    `).join('')

    const categoryRows = reportData.categorySales.map(row => `
      <tr>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: left; font-weight: 600;">${row.name}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: center;">${row.quantity}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 600;">৳${parseFloat(row.revenue).toFixed(2)}</td>
      </tr>
    `).join('')

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Store Sales Report - ${today}</title>
          <style>
            body { font-family: system-ui, sans-serif; color: #1e293b; padding: 40px; line-height: 1.5; }
            .header { border-bottom: 2px solid #0f172a; padding-bottom: 20px; margin-bottom: 30px; }
            .title { font-size: 24px; font-weight: 900; color: #0f172a; uppercase; }
            .meta { font-size: 12px; color: #64748b; margin-top: 4px; }
            .section { margin-bottom: 40px; page-break-inside: avoid; }
            .sec-title { font-size: 16px; font-weight: 800; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px; margin-bottom: 16px; color: #0f172a; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 20px; }
            th { background-color: #f8fafc; font-weight: 700; padding: 10px 12px; border-bottom: 2px solid #e2e8f0; text-transform: uppercase; font-size: 10px; color: #475569; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">${storeName} - Sales Audit Report</div>
            <div class="meta">Generated on: ${today} | Authority: Manager Portal</div>
          </div>
          
          <div class="section">
            <div class="sec-title">1. Top Selling Products</div>
            <table>
              <thead>
                <tr>
                  <th style="width: 8%; text-align: center;">Rank</th>
                  <th style="width: 52%; text-align: left;">Product</th>
                  <th style="width: 15%; text-align: center;">Qty Sold</th>
                  <th style="width: 25%; text-align: right;">Total Revenue</th>
                </tr>
              </thead>
              <tbody>
                ${productRows || '<tr><td colspan="4" style="text-align: center; padding: 12px;">No products sold in this period.</td></tr>'}
              </tbody>
            </table>
          </div>

          <div class="section">
            <div class="sec-title">2. Category Distribution</div>
            <table>
              <thead>
                <tr>
                  <th style="text-align: left;">Category Name</th>
                  <th style="text-align: center; width: 25%;">Qty Sold</th>
                  <th style="text-align: right; width: 35%;">Total Revenue</th>
                </tr>
              </thead>
              <tbody>
                ${categoryRows || '<tr><td colspan="3" style="text-align: center; padding: 12px;">No sales by category recorded.</td></tr>'}
              </tbody>
            </table>
          </div>

          <div class="section">
            <div class="sec-title">3. 30-Day Daily Sales Summary</div>
            <table>
              <thead>
                <tr>
                  <th style="text-align: left;">Date</th>
                  <th style="text-align: center; width: 25%;">Orders Count</th>
                  <th style="text-align: right; width: 35%;">Net Revenue</th>
                </tr>
              </thead>
              <tbody>
                ${trendRows || '<tr><td colspan="3" style="text-align: center; padding: 12px;">No trends available for last 30 days.</td></tr>'}
              </tbody>
            </table>
          </div>

          <div style="margin-top: 60px; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px dashed #e2e8f0; padding-top: 16px;">
            Confidential Report — Internal Management Use Only — Computer Generated Receipt
          </div>

          <script>
            window.onload = function() {
              window.focus();
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  if (userLoading || (loading && reportData.salesTrend.length === 0)) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-2">
          <BiLoaderAlt className="animate-spin text-4xl text-slate-800" />
          <p className="text-slate-600 text-sm font-semibold animate-pulse">Compiling database analytics report...</p>
        </div>
      </div>
    )
  }

  const totalQtySold = reportData.topProducts.reduce((acc, curr) => acc + curr.quantity, 0)
  const totalRevenue = reportData.categorySales.reduce((acc, curr) => acc + curr.revenue, 0)

  return (
    <div className={`w-full min-h-screen bg-slate-50 pt-20 pb-12 px-2 sm:px-4 md:px-8 transition-all duration-300 ${dashSidebar ? 'lg:pl-64' : 'lg:pl-8'}`}>
      <div className="w-full flex flex-col gap-6">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-4 gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">Analytics Reports</h1>
            <p className="text-xs text-slate-500 mt-1">Review aggregated store indicators, top sellers, category revenue distribution, and daily sales metrics.</p>
          </div>
          <button
            onClick={handlePrintReport}
            className="px-4 py-2.5 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer bg-primary hover:bg-primary-dark"
          >
            <BiPrinter className="text-sm" /> Print Audit Sheet
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-5">
          <div className="bg-white border border-slate-200 p-5 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Gross Items Sales</p>
              <h3 className="text-base md:text-lg font-bold text-slate-800 mt-0.5">৳{totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
            </div>
            <div className="w-10 h-10 text-white flex items-center justify-center text-xl shrink-0 font-bold bg-primary">
              <BiDollarCircle />
            </div>
          </div>
          <div className="bg-white border border-slate-200 p-5 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Items Dispatched</p>
              <h3 className="text-base md:text-lg font-bold text-slate-800 mt-0.5">{totalQtySold} Units</h3>
            </div>
            <div className="w-10 h-10 bg-blue-600 text-white flex items-center justify-center text-xl shrink-0 font-bold">
              <BiTrendingUp />
            </div>
          </div>
          <div className="bg-white border border-slate-200 p-5 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Audit Coverage</p>
              <h3 className="text-base md:text-lg font-bold text-slate-800 mt-0.5">Last 30 Days</h3>
            </div>
            <div className="w-10 h-10 bg-amber-500 text-white flex items-center justify-center text-xl shrink-0 font-bold">
              <BiFile />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          <div className="bg-white border border-slate-200 p-5 md:p-6 shadow-sm flex flex-col gap-4">
            <h3 className="text-xs font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-1.5 uppercase tracking-wider">
              <BiTrendingUp className="text-primary" /> Top Selling Products
            </h3>
            {reportData.topProducts.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">No product sale data available.</p>
            ) : (
              <div className="w-full bg-white border border-slate-200 shadow-sm">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-100/80 text-slate-650 font-bold border-b border-slate-200">
                    <tr>
                      <th className="px-2.5 py-2 text-center" style={{ width: '10%' }}>Rank</th>
                      <th className="px-2.5 py-2">Product Title</th>
                      <th className="hidden sm:table-cell px-2.5 py-2 text-center" style={{ width: '15%' }}>Qty</th>
                      <th className="px-2.5 py-2 text-right" style={{ width: '30%' }}>Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {reportData.topProducts.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition">
                        <td className="px-2.5 py-2 text-center font-bold text-slate-500">#{idx + 1}</td>
                        <td className="px-2.5 py-2 font-bold text-slate-800 truncate max-w-[120px] sm:max-w-[200px]" title={row.name}>{row.name}</td>
                        <td className="hidden sm:table-cell px-2.5 py-2 text-center font-bold text-slate-700">{row.quantity}</td>
                        <td className="px-2.5 py-2 text-right font-bold text-emerald-600">৳{parseFloat(row.revenue).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-200 p-5 md:p-6 shadow-sm flex flex-col gap-4">
            <h3 className="text-xs font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-1.5 uppercase tracking-wider">
              <BiCategory className="text-primary" /> Sales by Category
            </h3>
            {reportData.categorySales.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">No sales logs categorized.</p>
            ) : (
              <div className="w-full bg-white border border-slate-200 shadow-sm">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-100/80 text-slate-650 font-bold border-b border-slate-200">
                    <tr>
                      <th className="px-2.5 py-2">Category Name</th>
                      <th className="hidden sm:table-cell px-2.5 py-2 text-center" style={{ width: '20%' }}>Qty</th>
                      <th className="px-2.5 py-2 text-right" style={{ width: '35%' }}>Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {reportData.categorySales.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition">
                        <td className="px-2.5 py-2 font-bold text-slate-800">{row.name}</td>
                        <td className="hidden sm:table-cell px-2.5 py-2 text-center font-bold text-slate-700">{row.quantity}</td>
                        <td className="px-2.5 py-2 text-right font-bold text-emerald-600">৳{parseFloat(row.revenue).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="bg-white border border-slate-200 p-5 md:p-6 shadow-sm flex flex-col gap-4 lg:col-span-2">
            <h3 className="text-xs font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-1.5 uppercase tracking-wider">
              <BiTrendingUp className="text-primary" /> Daily Revenue (Last 30 Days)
            </h3>
            {reportData.salesTrend.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">No trends available in the last 30 days.</p>
            ) : (
              <div className="w-full bg-white border border-slate-200 shadow-sm">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-100/80 text-slate-650 font-bold border-b border-slate-200">
                    <tr>
                      <th className="px-2.5 py-2">Date</th>
                      <th className="hidden sm:table-cell px-2.5 py-2 text-center">Orders Count</th>
                      <th className="px-2.5 py-2 text-right">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {reportData.salesTrend.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition">
                        <td className="px-2.5 py-2 font-bold text-slate-700 font-mono text-[11px]">{new Date(row.date).toLocaleDateString()}</td>
                        <td className="hidden sm:table-cell px-2.5 py-2 text-center font-bold text-slate-700">{row.count}</td>
                        <td className="px-2.5 py-2 text-right font-bold text-emerald-600">৳{parseFloat(row.total).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-200 p-5 md:p-6 shadow-sm flex flex-col gap-4">
            <h3 className="text-xs font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-1.5 uppercase tracking-wider">
              <BiCreditCard className="text-primary" /> Payment Methods Share
            </h3>
            {reportData.paymentBreakdown.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">No transaction payment data.</p>
            ) : (
              <div className="flex flex-col gap-3 mt-2">
                {reportData.paymentBreakdown.map((row, idx) => (
                  <div key={idx} className="bg-slate-50 border border-slate-200 p-4 flex justify-between items-center">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Method</span>
                      <h4 className="text-xs font-bold text-slate-800 uppercase mt-0.5">{row.type}</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">{row.count} transactions completed</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sales Value</span>
                      <h4 className="text-sm font-bold text-emerald-600 mt-0.5">৳{parseFloat(row.total).toFixed(2)}</h4>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        <div className="bg-white border border-slate-200 p-5 md:p-8 shadow-sm flex flex-col gap-6">
          <div>
            <h2 className="text-base font-bold text-slate-800 tracking-tight flex items-center gap-2">
              <BiCloudDownload className="text-xl text-primary" /> Data Export Hub
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Download complete datasets in high-fidelity Excel (.xlsx) formats for accounting, analytics, or archival purposes.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-5">
            {exportCards.map((card) => {
              const isExporting = exporting[card.type];
              return (
                <div
                  key={card.type}
                  className="bg-slate-50 border border-slate-200 p-4 flex flex-col justify-between transition group hover:shadow-md"
                >
                  <div className="flex flex-col gap-3">
                    <div className="w-9 h-9 text-white flex items-center justify-center text-lg font-bold bg-primary">
                      <card.icon />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">
                        {card.title}
                      </h4>
                      <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                        {card.description}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleExport(card.type)}
                    disabled={isExporting}
                    className="w-full mt-4 py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isExporting ? (
                      <>
                        <BiLoaderAlt className="animate-spin text-sm" /> Exporting...
                      </>
                    ) : (
                      <>
                        <BiDownload className="text-sm" /> Download .xlsx
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  )
}



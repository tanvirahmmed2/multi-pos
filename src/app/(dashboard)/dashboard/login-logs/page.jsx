'use client'
import React, { useContext, useEffect, useState } from 'react'
import Link from 'next/link'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Context } from '@/component/helper/Context'
import { 
  BiKey, 
  BiSearch, 
  BiLoaderAlt, 
  BiUser, 
  BiLaptop, 
  BiTime, 
  BiRefresh,
  BiCheckCircle,
  BiXCircle,
  BiShieldQuarter,
  BiStoreAlt
} from 'react-icons/bi'

export default function DashboardLoginLogsPage() {
  const { dashSidebar, user } = useContext(Context)
  const [logs, setLogs] = useState([])
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedBranch, setSelectedBranch] = useState('all')

  const fetchBranches = async () => {
    if (user?.role === 'admin') {
      try {
        const res = await axios.get('/api/branch')
        setBranches(res.data || [])
      } catch (err) {
        console.error('Failed to fetch branches:', err)
      }
    }
  }

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const branchParam = selectedBranch !== 'all' ? `&branch_id=${selectedBranch}` : ''
      const res = await axios.get(`/api/activity-logs?type=login${branchParam}`)
      setLogs(res.data || [])
    } catch (err) {
      toast.error('Failed to load login logs')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchBranches()
    }
  }, [user])

  useEffect(() => {
    fetchLogs()
  }, [selectedBranch])

  const filteredLogs = logs.filter((log) => {
    const term = search.toLowerCase()
    return (
      (log.email && log.email.toLowerCase().includes(term)) ||
      (log.staff_name && log.staff_name.toLowerCase().includes(term)) ||
      (log.role && log.role.toLowerCase().includes(term)) ||
      (log.branch_name && log.branch_name.toLowerCase().includes(term)) ||
      (log.ip_address && log.ip_address.toLowerCase().includes(term)) ||
      (log.user_agent && log.user_agent.toLowerCase().includes(term)) ||
      (log.status && log.status.toLowerCase().includes(term))
    )
  })

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  return (
    <div className={`w-full min-h-screen bg-slate-50 pt-20 pb-12 px-4 md:px-8 transition-all duration-300 ${dashSidebar ? 'lg:pl-68' : 'lg:pl-8'}`}>
      <div className="max-w-6xl mx-auto flex flex-col gap-6">

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2.5">
              <BiKey className="text-primary text-3xl" /> Staff Login & Authentication Logs
            </h1>
            <p className="text-slate-500 text-xs mt-1 font-medium">
              Monitor authentication attempts, successful logins, failed attempts, and device metadata.
            </p>
          </div>
          
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Link
              href="/dashboard/activity-logs"
              className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-sm hover:bg-slate-100 transition cursor-pointer"
            >
              <BiShieldQuarter className="text-base text-primary" /> View Activity Logs
            </Link>
            <button
              onClick={fetchLogs}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-sm hover:bg-slate-100 transition cursor-pointer"
            >
              <BiRefresh className={`text-base ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-96">
            <BiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base" />
            <input
              type="text"
              placeholder="Search by email, name, IP address, status..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
            {user?.role === 'admin' && (
              <div className="flex items-center gap-1.5">
                <BiStoreAlt className="text-slate-400 text-sm" />
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
                >
                  <option value="all">All Branches</option>
                  {branches.map((b) => (
                    <option key={b.branch_id} value={b.branch_id}>{b.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="text-xs font-bold text-slate-500">
              Total Records: <span className="text-slate-800">{filteredLogs.length}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <BiLoaderAlt className="text-3xl text-primary animate-spin" />
              <p className="text-xs font-medium text-slate-500">Fetching login logs...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-2 text-slate-400">
              <BiKey className="text-4xl" />
              <p className="text-sm font-semibold text-slate-600">No login logs found</p>
              <p className="text-xs">No records matched your search query or branch filter.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Timestamp</th>
                    <th className="py-3.5 px-4">Staff / Email</th>
                    <th className="py-3.5 px-4">Branch</th>
                    <th className="py-3.5 px-4">Role</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">IP Address</th>
                    <th className="py-3.5 px-4">Device / User Agent</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLogs.map((log) => (
                    <tr key={log.log_id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 font-medium">
                        <span className="flex items-center gap-1.5">
                          <BiTime className="text-slate-400" /> {formatDate(log.created_at)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <BiUser className="text-slate-400" /> {log.staff_name || log.email}
                          </div>
                          {log.staff_name && (
                            <div className="text-[10px] text-slate-400 font-normal">
                              {log.email}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-lg text-[11px] text-slate-700">
                          <BiStoreAlt className="text-slate-400" /> {log.branch_name || 'Main Branch'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-bold uppercase text-[10px] rounded-md">
                          {log.role || log.staff_role || 'Staff'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {log.status === 'success' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 text-emerald-700 font-bold text-[11px] rounded-full">
                            <BiCheckCircle /> Success
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-rose-50 text-rose-700 font-bold text-[11px] rounded-full">
                            <BiXCircle /> Failed
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">
                        {log.ip_address || 'Unknown'}
                      </td>
                      <td className="py-3.5 px-4 max-w-xs text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <BiLaptop className="text-slate-400 shrink-0" />
                          <span className="truncate text-[11px]" title={log.user_agent}>
                            {log.user_agent || 'Unknown'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

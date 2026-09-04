'use client'
import React, { useContext, useEffect, useState } from 'react'
import Link from 'next/link'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Context } from '@/component/helper/Context'
import { 
  BiShieldQuarter, 
  BiSearch, 
  BiLoaderAlt, 
  BiUser, 
  BiKey, 
  BiMapPin, 
  BiTime, 
  BiRefresh,
  BiStoreAlt
} from 'react-icons/bi'

export default function DashboardActivityLogsPage() {
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
      const res = await axios.get(`/api/activity-logs?type=activity${branchParam}`)
      setLogs(res.data || [])
    } catch (err) {
      toast.error('Failed to load activity logs')
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
      (log.action && log.action.toLowerCase().includes(term)) ||
      (log.entity && log.entity.toLowerCase().includes(term)) ||
      (log.details && log.details.toLowerCase().includes(term)) ||
      (log.staff_name && log.staff_name.toLowerCase().includes(term)) ||
      (log.staff_email && log.staff_email.toLowerCase().includes(term)) ||
      (log.branch_name && log.branch_name.toLowerCase().includes(term)) ||
      (log.ip_address && log.ip_address.toLowerCase().includes(term))
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
      <div className="w-full flex flex-col gap-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-800 tracking-tight flex items-center gap-2.5">
              <BiShieldQuarter className="text-primary text-3xl" /> Staff Activity Logs
            </h1>
            <p className="text-slate-500 text-xs mt-1 font-medium">
              {user?.role === 'admin' 
                ? 'Track and audit actions across all store branches.'
                : 'Track and audit actions performed by staff members in your branch.'}
            </p>
          </div>
          
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Link
              href="/dashboard/login-logs"
              className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl shadow-sm hover:bg-slate-100 transition cursor-pointer"
            >
              <BiKey className="text-base text-primary" /> View Login Logs
            </Link>
            <button
              onClick={fetchLogs}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl shadow-sm hover:bg-slate-100 transition cursor-pointer"
            >
              <BiRefresh className={`text-base ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-96">
            <BiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base" />
            <input
              type="text"
              placeholder="Search by action, entity, staff name or details..."
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

            <div className="text-xs font-semibold text-slate-500">
              Total Records: <span className="text-slate-800">{filteredLogs.length}</span>
            </div>
          </div>
        </div>

        {/* Activity Logs Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <BiLoaderAlt className="text-3xl text-primary animate-spin" />
              <p className="text-xs font-medium text-slate-500">Fetching activity logs...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-2 text-slate-400">
              <BiShieldQuarter className="text-4xl" />
              <p className="text-sm font-semibold text-slate-600">No activity logs found</p>
              <p className="text-xs">No records matched your search query or permission scope.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Timestamp</th>
                    <th className="py-3.5 px-4">Staff</th>
                    <th className="py-3.5 px-4">Branch</th>
                    <th className="py-3.5 px-4">Action</th>
                    <th className="py-3.5 px-4">Entity</th>
                    <th className="py-3.5 px-4">Details</th>
                    <th className="py-3.5 px-4">IP / Device</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLogs.map((log) => (
                    <tr key={log.activity_id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 font-medium">
                        <span className="flex items-center gap-1.5">
                          <BiTime className="text-slate-400" /> {formatDate(log.created_at)}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {log.staff_name || log.staff_email ? (
                          <div>
                            <div className="flex items-center gap-1.5">
                              <BiUser className="text-slate-400" /> {log.staff_name || 'Staff'}
                            </div>
                            <div className="text-[10px] text-slate-400 font-normal">
                              {log.staff_email} ({log.staff_role || 'Staff'})
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-normal italic">System / Unknown</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-slate-700">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-lg text-[11px] text-slate-700">
                          <BiStoreAlt className="text-slate-400" /> {log.branch_name || 'Main Branch'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        <span className="px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-[11px] font-mono">
                          {log.action}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        {log.entity ? (
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 font-medium rounded-md text-[11px]">
                            {log.entity} {log.entity_id ? `#${log.entity_id}` : ''}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 max-w-xs truncate text-slate-600 font-medium" title={log.details}>
                        {log.details || '-'}
                      </td>

                      <td className="py-3.5 px-4 text-slate-500">
                        <div className="flex items-center gap-1">
                          <BiMapPin className="text-slate-400 shrink-0" />
                          <span className="font-mono text-[11px]">{log.ip_address || 'Unknown'}</span>
                        </div>
                        {log.user_agent && (
                          <div className="text-[10px] text-slate-400 truncate max-w-[180px]" title={log.user_agent}>
                            {log.user_agent}
                          </div>
                        )}
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

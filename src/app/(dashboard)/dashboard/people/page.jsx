'use client'
import React, { useContext, useEffect, useState } from 'react'
import Link from 'next/link'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Context } from '@/component/helper/Context'
import { 
  BiSearch, 
  BiUser, 
  BiBlock, 
  BiCheckCircle,
  BiLoaderAlt,
  BiPlus,
  BiStoreAlt,
  BiTrash
} from 'react-icons/bi'

export default function DashboardAdminPeoplePage() {
  const { dashSidebar, user: currentUser } = useContext(Context)
  
  const [users, setUsers] = useState([])
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [updatingId, setUpdatingId] = useState(null)

  const fetchUsers = async () => {
    try {
      const [peopleRes, branchRes] = await Promise.all([
        axios.get('/api/people'),
        axios.get('/api/branch').catch(() => ({ data: [] }))
      ])
      setUsers(peopleRes.data)
      setBranches(branchRes.data || [])
    } catch (err) {
      toast.error('Failed to load accounts database')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleRoleChange = async (userId, newRole, currentBranchId) => {
    if (newRole !== 'admin' && !currentBranchId) {
      toast.error(`Please assign a branch to this staff member before promoting to ${newRole}`)
      return
    }
    setUpdatingId(userId)
    try {
      await axios.put(`/api/people/${userId}`, { role: newRole })
      toast.success(`Role updated to ${newRole} successfully`)
      fetchUsers()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update role')
      console.error(err)
    } finally {
      setUpdatingId(null)
    }
  }

  const handleBranchChange = async (userId, newBranchId) => {
    setUpdatingId(userId)
    try {
      await axios.put(`/api/people/${userId}`, { branch_id: newBranchId || null })
      toast.success(`Assigned branch updated successfully`)
      fetchUsers()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update branch assignment')
      console.error(err)
    } finally {
      setUpdatingId(null)
    }
  }

  const handleBanToggle = async (userId, currentBanStatus) => {
    const action = currentBanStatus ? 'unban' : 'ban'
    if (!window.confirm(`Are you sure you want to ${action} this staff member?`)) {
      return
    }
    
    setUpdatingId(userId)
    try {
      await axios.put(`/api/people/${userId}`, { is_banned: !currentBanStatus })
      toast.success(`Staff account has been ${currentBanStatus ? 'unbanned' : 'banned'}`)
      fetchUsers()
    } catch (err) {
      toast.error(err.response?.data?.error || `Failed to ${action} staff member`)
      console.error(err)
    } finally {
      setUpdatingId(null)
    }
  }

  const handleActiveToggle = async (userId, currentActiveStatus) => {
    setUpdatingId(userId)
    try {
      await axios.put(`/api/people/${userId}`, { is_active: !currentActiveStatus })
      toast.success(`Staff account has been ${currentActiveStatus ? 'deactivated' : 'activated'}`)
      fetchUsers()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update account status')
      console.error(err)
    } finally {
      setUpdatingId(null)
    }
  }

  const handleDeleteStaff = async (userId, userName, userRole) => {
    if (currentUser && userId === currentUser.staff_id) {
      toast.error('You cannot delete your own account while logged in')
      return
    }

    const adminCount = users.filter(u => u.role === 'admin').length
    if (userRole === 'admin' && adminCount <= 1) {
      toast.error('Cannot delete staff account. At least one admin account must remain in the system.')
      return
    }

    if (!window.confirm(`Are you sure you want to delete staff account "${userName}"? This action cannot be undone.`)) {
      return
    }

    setUpdatingId(userId)
    try {
      const res = await axios.delete(`/api/people/${userId}`)
      toast.success(res.data?.message || 'Staff account deleted successfully')
      fetchUsers()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete staff account')
      console.error(err)
    } finally {
      setUpdatingId(null)
    }
  }

  const getBranchName = (branchId) => {
    if (!branchId) return null
    const b = branches.find(item => item.branch_id === parseInt(branchId, 10))
    return b ? `${b.name} (${b.code || `ID:${b.branch_id}`})` : `Branch #${branchId}`
  }

  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.phone && u.phone.includes(search)) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  )

  const stats = {
    total: users.length,
    active: users.filter((u) => u.is_active && !u.is_banned).length,
    banned: users.filter((u) => u.is_banned).length,
  }

  return (
    <div className={`w-full min-h-screen bg-slate-50 pt-20 pb-12 px-2 sm:px-4 md:px-8 transition-all duration-300 ${dashSidebar ? 'lg:pl-64' : 'lg:pl-8'}`}>
      <div className="w-full flex flex-col gap-6">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-800 flex items-center gap-2">
              <BiUser className="text-primary" />
              Staff Accounts Management
            </h1>
            <p className="text-slate-500 text-xs md:text-sm mt-0.5">Manage staff roles, branch assignments, active statuses, and access permissions.</p>
          </div>

          <Link
            href="/dashboard/people/new"
            className="px-4 py-2.5 text-white text-xs font-bold flex items-center justify-center gap-2 rounded-xl shadow-sm transition hover:bg-primary-dark bg-primary self-start sm:self-auto"
          >
            <BiPlus className="text-lg" />
            <span>Create Staff Account</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
          <div className="bg-white p-5 border border-slate-200 shadow-sm flex items-center justify-between">
            <div className="flex flex-col gap-0.5">
              <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Total Staff Accounts</span>
              <span className="text-2xl font-bold text-slate-800">{loading ? '...' : stats.total}</span>
            </div>
            <div className="w-10 h-10 text-white flex items-center justify-center text-xl shrink-0 font-bold bg-primary">
              <BiUser />
            </div>
          </div>

          <div className="bg-white p-5 border border-slate-200 shadow-sm flex items-center justify-between">
            <div className="flex flex-col gap-0.5">
              <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Active & Valid</span>
              <span className="text-2xl font-bold text-emerald-600">{loading ? '...' : stats.active}</span>
            </div>
            <div className="w-10 h-10 bg-emerald-600 text-white flex items-center justify-center text-xl shrink-0 font-bold">
              <BiCheckCircle />
            </div>
          </div>

          <div className="bg-white p-5 border border-slate-200 shadow-sm flex items-center justify-between">
            <div className="flex flex-col gap-0.5">
              <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Suspended / Banned</span>
              <span className="text-2xl font-bold text-rose-600">{loading ? '...' : stats.banned}</span>
            </div>
            <div className="w-10 h-10 bg-rose-600 text-white flex items-center justify-center text-xl shrink-0 font-bold">
              <BiBlock />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-white p-4 border border-slate-200 shadow-sm">
          <div className="flex-1 max-w-md flex items-center gap-2 bg-slate-50 px-3 py-2 border border-slate-200">
            <BiSearch className="text-slate-400 text-base shrink-0" />
            <input 
              type="text"
              placeholder="Search by name, email, phone or role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs text-slate-800 bg-transparent outline-none"
            />
          </div>
        </div>

        {loading ? (
          <div className="w-full h-64 bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-500 gap-2">
            <BiLoaderAlt className="animate-spin text-xl text-slate-800" />
            <span className="text-xs font-semibold">Loading staff database...</span>
          </div>
        ) : filteredUsers.length > 0 ? (
          <div className="bg-white border border-slate-200 shadow-sm overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/80 text-slate-650 font-bold border-b border-slate-200">
                  <th className="px-3 md:px-4 py-3">Staff Details</th>
                  <th className="px-3 md:px-4 py-3">Assigned Branch</th>
                  <th className="px-3 md:px-4 py-3">Role</th>
                  <th className="hidden sm:table-cell px-3 md:px-4 py-3">Verification</th>
                  <th className="hidden md:table-cell px-3 md:px-4 py-3 text-center">Banned Status</th>
                  <th className="hidden md:table-cell px-3 md:px-4 py-3 text-center">Active Status</th>
                  <th className="hidden lg:table-cell px-3 md:px-4 py-3 text-right">Created</th>
                  <th className="px-3 md:px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredUsers.map((u) => {
                  const isSelf = currentUser && u.staff_id === currentUser.staff_id
                  return (
                    <tr key={u.staff_id} className={`hover:bg-slate-50 transition ${isSelf ? 'bg-amber-50/40' : ''}`}>
                      
                      <td className="px-3 md:px-4 py-3.5">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                            {u.name}
                            {isSelf && (
                              <span className="px-1 py-0.2 text-[9px] font-bold uppercase bg-amber-100 text-amber-800 border border-amber-200">
                                You
                              </span>
                            )}
                          </span>
                          <span className="text-slate-500 text-[11px] font-mono mt-0.5">{u.email}</span>
                          {u.phone && <span className="text-slate-400 text-[10px] mt-0.5">{u.phone}</span>}
                        </div>
                      </td>

                      <td className="px-3 md:px-4 py-3.5">
                        {isSelf || u.role === 'admin' ? (
                          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                            <BiStoreAlt className="text-slate-400" />
                            {u.role === 'admin' ? 'Global (No Branch Required)' : (getBranchName(u.branch_id) || 'Unassigned')}
                          </span>
                        ) : (
                          <select
                            value={u.branch_id || ''}
                            disabled={updatingId === u.staff_id}
                            onChange={(e) => handleBranchChange(u.staff_id, e.target.value)}
                            className="px-2 py-1 bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold outline-none cursor-pointer disabled:opacity-50 rounded-lg"
                          >
                            <option value="">-- Select Branch * --</option>
                            {branches.map(b => (
                              <option key={b.branch_id} value={b.branch_id}>
                                {b.name} ({b.code || `ID:${b.branch_id}`})
                              </option>
                            ))}
                          </select>
                        )}
                      </td>

                      <td className="px-3 md:px-4 py-3.5">
                        {isSelf ? (
                          <span className="px-2 py-1 text-[10px] font-bold bg-slate-900 text-white uppercase border border-slate-900 rounded">
                            {u.role}
                          </span>
                        ) : (
                          <select
                            value={u.role}
                            disabled={updatingId === u.staff_id}
                            onChange={(e) => handleRoleChange(u.staff_id, e.target.value, u.branch_id)}
                            className="px-2 py-1 bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold outline-none cursor-pointer disabled:opacity-50 rounded-lg"
                          >
                            <option value="admin">Admin</option>
                            <option value="manager">Manager</option>
                            <option value="sales">Sales</option>
                            <option value="staff">Staff</option>
                          </select>
                        )}
                      </td>

                      <td className="hidden sm:table-cell px-3 md:px-4 py-3.5">
                        <span className={`px-1.5 py-0.5 text-[9px] font-bold uppercase border ${
                          u.is_varified ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {u.is_varified ? 'Verified' : 'Pending'}
                        </span>
                      </td>

                      <td className="hidden md:table-cell px-3 md:px-4 py-3.5 text-center">
                        <button
                          type="button"
                          disabled={isSelf || updatingId === u.staff_id}
                          onClick={() => handleBanToggle(u.staff_id, u.is_banned)}
                          className={`px-2 py-1 text-[10px] font-bold uppercase transition cursor-pointer disabled:opacity-40 border ${
                            u.is_banned ? 'bg-rose-600 text-white border-rose-600' : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-rose-50 hover:text-rose-600'
                          }`}
                        >
                          {u.is_banned ? 'Banned' : 'Ban Staff'}
                        </button>
                      </td>

                      <td className="hidden md:table-cell px-3 md:px-4 py-3.5 text-center">
                        <button
                          type="button"
                          disabled={isSelf || updatingId === u.staff_id}
                          onClick={() => handleActiveToggle(u.staff_id, u.is_active)}
                          className={`px-2 py-1 text-[10px] font-bold uppercase transition cursor-pointer disabled:opacity-40 border ${
                            u.is_active ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-emerald-50 hover:text-emerald-600'
                          }`}
                        >
                          {u.is_active ? 'Active' : 'Disabled'}
                        </button>
                      </td>

                      <td className="hidden lg:table-cell px-3 md:px-4 py-3.5 text-right">
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(u.created_at).toLocaleDateString()}
                        </span>
                      </td>

                      <td className="px-3 md:px-4 py-3.5 text-right">
                        <button
                          type="button"
                          disabled={isSelf || updatingId === u.staff_id}
                          onClick={() => handleDeleteStaff(u.staff_id, u.name, u.role)}
                          title={isSelf ? "You cannot delete your own account" : "Delete Staff Account"}
                          className="p-1.5 text-xs text-rose-600 hover:bg-rose-50 border border-rose-200 hover:border-rose-300 transition disabled:opacity-40 disabled:cursor-not-allowed rounded"
                        >
                          {updatingId === u.staff_id ? (
                            <BiLoaderAlt className="animate-spin text-sm" />
                          ) : (
                            <BiTrash className="text-sm" />
                          )}
                        </button>
                      </td>

                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="w-full py-16 bg-white border border-slate-200 shadow-sm flex flex-col items-center justify-center text-slate-400 gap-2">
            <BiUser className="text-4xl text-slate-300" />
            <p className="font-bold text-slate-600 text-xs">No accounts match search filters</p>
            <p className="text-[10px] text-slate-400">Try a different search term or check spelling.</p>
          </div>
        )}

      </div>
    </div>
  )
}

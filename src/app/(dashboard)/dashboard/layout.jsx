import Dashboardnavbar from '@/component/bars/Navbar'
import Dashboardsidebar from '@/component/bars/Sidebar'
import { isManagementRole } from '@/lib/auth'
import { redirect } from 'next/navigation'
import React from 'react'
import { STORE_NAME, STORE_TAGLINE } from '@/lib/secret'

export const metadata = {
  title: `Dashboard | ${STORE_NAME} - ${STORE_TAGLINE}`,
  description: `Management Dashboard on ${STORE_NAME}, ${STORE_TAGLINE}.`,
}

export default async function DashboardLayout({ children }) {
  const auth=await isManagementRole()
  if(!auth.success) redirect('/?invalid_session=1')
  return (
    <div className='w-full overflow-x-hidden relative'>
      <Dashboardnavbar/>
      <Dashboardsidebar/>
      {children}
    </div>
  )
}

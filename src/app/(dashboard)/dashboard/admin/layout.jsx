import { isAdmin } from '@/lib/auth'
import { redirect } from 'next/navigation'
import React from 'react'
import { STORE_NAME, STORE_TAGLINE } from '@/lib/secret'

export const metadata = {
  title: `Admin Dashboard | ${STORE_NAME} - ${STORE_TAGLINE}`,
  description: `Admin Control Panel on ${STORE_NAME}, ${STORE_TAGLINE}.`,
}

export default async function DashboardAdminLayout({ children }) {
  const auth=await isAdmin()
    if(!auth.success) redirect('/dashboard')
  return (
    <>
      {children}
    </>
  )
}

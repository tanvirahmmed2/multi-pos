import { isManager } from '@/lib/auth'
import { redirect } from 'next/navigation'
import React from 'react'
import { STORE_NAME, STORE_TAGLINE } from '@/lib/secret'

export const metadata = {
  title: `Manager Dashboard | ${STORE_NAME} - ${STORE_TAGLINE}`,
  description: `Manager Control Panel on ${STORE_NAME}, ${STORE_TAGLINE}.`,
}

export default async function DashboardManagerLayout({ children }) {
  const auth=await isManager()
    if(!auth.success) redirect('/dashboard')
  return (
    <>
      {children}
    </>
  )
}

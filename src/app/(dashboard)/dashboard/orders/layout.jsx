import { isManagementRole } from '@/lib/auth'
import { redirect } from 'next/navigation'
import React from 'react'
import { STORE_NAME, STORE_TAGLINE } from '@/lib/secret'

export const metadata = {
  title: `Order Details | ${STORE_NAME} - ${STORE_TAGLINE}`,
  description: `Order Details Management on ${STORE_NAME}.`,
}

export default async function DashboardOrdersLayout({ children }) {
  const auth = await isManagementRole()
  if (!auth.success) redirect('/dashboard')
  return (
    <>
      {children}
    </>
  )
}

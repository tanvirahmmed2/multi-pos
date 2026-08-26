import { isSales } from '@/lib/auth'
import { redirect } from 'next/navigation'
import React from 'react'
import { STORE_NAME, STORE_TAGLINE } from '@/lib/secret'

export const metadata = {
  title: `Sales Dashboard | ${STORE_NAME} - ${STORE_TAGLINE}`,
  description: `Sales Desk Panel on ${STORE_NAME}, ${STORE_TAGLINE}.`,
}

export default async function DashboardSalesLayout({ children }) {
  const auth=await isSales()
    if(!auth.success) redirect('/dashboard')
  return (
    <>
      {children}
    </>
  )
}

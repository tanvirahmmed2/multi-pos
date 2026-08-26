import { authenticateUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import React from 'react'
import { STORE_NAME, STORE_TAGLINE } from '@/lib/secret'

export const metadata = {
  title: `My Profile | ${STORE_NAME} - ${STORE_TAGLINE}`,
  description: `User Profile Settings on ${STORE_NAME}.`,
}

export default async function DashboardProfileLayout({ children }) {
  const auth = await authenticateUser()
  if (!auth.success) redirect('/')
  return (
    <>
      {children}
    </>
  )
}

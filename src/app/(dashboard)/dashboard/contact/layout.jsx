import React from 'react'
import { STORE_NAME, STORE_TAGLINE } from '@/lib/secret'

export const metadata = {
  title: `Contact Messages | ${STORE_NAME} - ${STORE_TAGLINE}`,
  description: `Contact Messages & Inquiries on ${STORE_NAME}.`,
}

export default function ManagerContactLayout({ children }) {
  return <>{children}</>
}

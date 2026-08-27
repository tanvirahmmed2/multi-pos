import React from 'react'
import { STORE_NAME, STORE_TAGLINE } from '@/lib/secret'

export const metadata = {
  title: `Investor Management | ${STORE_NAME} - ${STORE_TAGLINE}`,
  description: `Manage store investors on ${STORE_NAME}.`,
}

export default function InvestorLayout({ children }) {
  return <>{children}</>
}

import React from 'react'
import { STORE_NAME, STORE_TAGLINE } from '@/lib/secret'

export const metadata = {
  title: `Admin Sales Monitor | ${STORE_NAME} - ${STORE_TAGLINE}`,
  description: `Admin Sales Ledger Monitoring on ${STORE_NAME}.`,
}

export default function AdminSalesLayout({ children }) {
  return <>{children}</>
}

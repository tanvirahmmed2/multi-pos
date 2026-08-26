import React from 'react'
import { STORE_NAME, STORE_TAGLINE } from '@/lib/secret'

export const metadata = {
  title: `Manager Sales Ledger | ${STORE_NAME} - ${STORE_TAGLINE}`,
  description: `Manager Sales Monitoring on ${STORE_NAME}.`,
}

export default function ManagerSalesLayout({ children }) {
  return <>{children}</>
}

import React from 'react'
import { STORE_NAME, STORE_TAGLINE } from '@/lib/secret'

export const metadata = {
  title: `Sales History | ${STORE_NAME} - ${STORE_TAGLINE}`,
  description: `Complete Sales History Ledger on ${STORE_NAME}.`,
}

export default function SalesHistoryLayout({ children }) {
  return <>{children}</>
}

import React from 'react'
import { STORE_NAME, STORE_TAGLINE } from '@/lib/secret'

export const metadata = {
  title: `Sale Receipt Details | ${STORE_NAME} - ${STORE_TAGLINE}`,
  description: `Sale Order Receipt Details on ${STORE_NAME}.`,
}

export default function SalesReceiptLayout({ children }) {
  return <>{children}</>
}

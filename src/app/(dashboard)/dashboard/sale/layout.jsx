import React from 'react'
import { STORE_NAME, STORE_TAGLINE } from '@/lib/secret'

export const metadata = {
  title: `POS Sales Desk | ${STORE_NAME} - ${STORE_TAGLINE}`,
  description: `Point of Sale Billing Terminal on ${STORE_NAME}.`,
}

export default function SalesTerminalLayout({ children }) {
  return <>{children}</>
}

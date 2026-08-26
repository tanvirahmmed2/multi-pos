import React from 'react'
import { STORE_NAME, STORE_TAGLINE } from '@/lib/secret'

export const metadata = {
  title: `Sales Payments | ${STORE_NAME} - ${STORE_TAGLINE}`,
  description: `Sales Desk Payments History on ${STORE_NAME}.`,
}

export default function SalesPaymentsLayout({ children }) {
  return <>{children}</>
}

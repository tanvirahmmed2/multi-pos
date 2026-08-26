import React from 'react'
import { STORE_NAME, STORE_TAGLINE } from '@/lib/secret'

export const metadata = {
  title: `Manager Payments | ${STORE_NAME} - ${STORE_TAGLINE}`,
  description: `Manager Payments Ledger on ${STORE_NAME}.`,
}

export default function ManagerPaymentsLayout({ children }) {
  return <>{children}</>
}

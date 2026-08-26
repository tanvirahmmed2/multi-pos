import React from 'react'
import { STORE_NAME, STORE_TAGLINE } from '@/lib/secret'

export const metadata = {
  title: `Purchase Orders | ${STORE_NAME} - ${STORE_TAGLINE}`,
  description: `Manage Stock Purchases on ${STORE_NAME}.`,
}

export default function ManagerPurchaseLayout({ children }) {
  return <>{children}</>
}

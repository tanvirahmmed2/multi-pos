import React from 'react'
import { STORE_NAME, STORE_TAGLINE } from '@/lib/secret'

export const metadata = {
  title: `Inventory Stock | ${STORE_NAME} - ${STORE_TAGLINE}`,
  description: `Manager Inventory Stock Audit on ${STORE_NAME}.`,
}

export default function ManagerStockLayout({ children }) {
  return <>{children}</>
}

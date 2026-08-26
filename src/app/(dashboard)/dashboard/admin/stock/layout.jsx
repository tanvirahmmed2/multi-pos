import React from 'react'
import { STORE_NAME, STORE_TAGLINE } from '@/lib/secret'

export const metadata = {
  title: `Admin Stock Audit | ${STORE_NAME} - ${STORE_TAGLINE}`,
  description: `Admin Inventory & Stock Audit on ${STORE_NAME}.`,
}

export default function AdminStockLayout({ children }) {
  return <>{children}</>
}

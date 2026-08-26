import React from 'react'
import { STORE_NAME, STORE_TAGLINE } from '@/lib/secret'

export const metadata = {
  title: `Suppliers Management | ${STORE_NAME} - ${STORE_TAGLINE}`,
  description: `Manage Vendors and Suppliers on ${STORE_NAME}.`,
}

export default function ManagerSupplierLayout({ children }) {
  return <>{children}</>
}

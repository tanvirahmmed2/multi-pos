import React from 'react'
import { STORE_NAME, STORE_TAGLINE } from '@/lib/secret'

export const metadata = {
  title: `Add Supplier | ${STORE_NAME} - ${STORE_TAGLINE}`,
  description: `Add New Supplier Record on ${STORE_NAME}.`,
}

export default function ManagerSupplierCreateLayout({ children }) {
  return <>{children}</>
}

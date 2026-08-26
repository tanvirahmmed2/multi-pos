import React from 'react'
import { STORE_NAME, STORE_TAGLINE } from '@/lib/secret'

export const metadata = {
  title: `Edit Supplier | ${STORE_NAME} - ${STORE_TAGLINE}`,
  description: `Edit Supplier Details on ${STORE_NAME}.`,
}

export default function ManagerSupplierEditLayout({ children }) {
  return <>{children}</>
}

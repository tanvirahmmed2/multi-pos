import React from 'react'
import { STORE_NAME, STORE_TAGLINE } from '@/lib/secret'

export const metadata = {
  title: `Edit Category | ${STORE_NAME} - ${STORE_TAGLINE}`,
  description: `Edit product category details on ${STORE_NAME}.`,
}

export default function ManagerCategoryEditLayout({ children }) {
  return <>{children}</>
}

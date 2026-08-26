import React from 'react'
import { STORE_NAME, STORE_TAGLINE } from '@/lib/secret'

export const metadata = {
  title: `Create Category | ${STORE_NAME} - ${STORE_TAGLINE}`,
  description: `Create new product category on ${STORE_NAME}.`,
}

export default function ManagerCategoryCreateLayout({ children }) {
  return <>{children}</>
}

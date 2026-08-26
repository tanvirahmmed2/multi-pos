import React from 'react'
import { STORE_NAME, STORE_TAGLINE } from '@/lib/secret'

export const metadata = {
  title: `Edit Product | ${STORE_NAME} - ${STORE_TAGLINE}`,
  description: `Edit Product and Variants on ${STORE_NAME}.`,
}

export default function ManagerProductEditLayout({ children }) {
  return <>{children}</>
}

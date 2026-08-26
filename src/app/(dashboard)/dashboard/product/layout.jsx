import React from 'react'
import { STORE_NAME, STORE_TAGLINE } from '@/lib/secret'

export const metadata = {
  title: `Product Management | ${STORE_NAME} - ${STORE_TAGLINE}`,
  description: `Product Catalog Management on ${STORE_NAME}.`,
}

export default function ManagerProductLayout({ children }) {
  return <>{children}</>
}

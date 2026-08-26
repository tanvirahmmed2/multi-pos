import React from 'react'
import { STORE_NAME, STORE_TAGLINE } from '@/lib/secret'

export const metadata = {
  title: `Add New Product | ${STORE_NAME} - ${STORE_TAGLINE}`,
  description: `Add New Product with Variants on ${STORE_NAME}.`,
}

export default function ManagerProductCreateLayout({ children }) {
  return <>{children}</>
}

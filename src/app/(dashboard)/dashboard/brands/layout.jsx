import React from 'react'
import { STORE_NAME, STORE_TAGLINE } from '@/lib/secret'

export const metadata = {
  title: `Brands Management | ${STORE_NAME} - ${STORE_TAGLINE}`,
  description: `Manage brands on ${STORE_NAME}.`,
}

export default function ManagerBrandsLayout({ children }) {
  return <>{children}</>
}

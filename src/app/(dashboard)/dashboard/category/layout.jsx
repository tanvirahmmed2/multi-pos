import React from 'react'
import { STORE_NAME, STORE_TAGLINE } from '@/lib/secret'

export const metadata = {
  title: `Category Management | ${STORE_NAME} - ${STORE_TAGLINE}`,
  description: `Manage product categories on ${STORE_NAME}.`,
}

export default function ManagerCategoryLayout({ children }) {
  return <>{children}</>
}

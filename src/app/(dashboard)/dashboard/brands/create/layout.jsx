import React from 'react'
import { STORE_NAME, STORE_TAGLINE } from '@/lib/secret'

export const metadata = {
  title: `Create Brand | ${STORE_NAME} - ${STORE_TAGLINE}`,
  description: `Create new brand on ${STORE_NAME}.`,
}

export default function ManagerBrandsCreateLayout({ children }) {
  return <>{children}</>
}

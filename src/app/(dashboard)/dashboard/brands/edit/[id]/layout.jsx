import React from 'react'
import { STORE_NAME, STORE_TAGLINE } from '@/lib/secret'

export const metadata = {
  title: `Edit Brand | ${STORE_NAME} - ${STORE_TAGLINE}`,
  description: `Edit brand details on ${STORE_NAME}.`,
}

export default function ManagerBrandsEditLayout({ children }) {
  return <>{children}</>
}

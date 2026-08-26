import React from 'react'
import { STORE_NAME, STORE_TAGLINE } from '@/lib/secret'

export const metadata = {
  title: `Purchase Order Details | ${STORE_NAME} - ${STORE_TAGLINE}`,
  description: `View Purchase Order Details on ${STORE_NAME}.`,
}

export default function ManagerPurchaseDetailsLayout({ children }) {
  return <>{children}</>
}

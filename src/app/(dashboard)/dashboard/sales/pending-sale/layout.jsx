import React from 'react'
import { STORE_NAME, STORE_TAGLINE } from '@/lib/secret'

export const metadata = {
  title: `Pending Sales | ${STORE_NAME} - ${STORE_TAGLINE}`,
  description: `Pending Sales Orders Queue on ${STORE_NAME}.`,
}

export default function SalesPendingLayout({ children }) {
  return <>{children}</>
}

import React from 'react'
import { STORE_NAME, STORE_TAGLINE } from '@/lib/secret'

export const metadata = {
  title: `Completed Sales | ${STORE_NAME} - ${STORE_TAGLINE}`,
  description: `Completed Sales Orders Queue on ${STORE_NAME}.`,
}

export default function SalesCompletedLayout({ children }) {
  return <>{children}</>
}

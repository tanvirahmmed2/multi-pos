import React from 'react'
import { STORE_NAME, STORE_TAGLINE } from '@/lib/secret'

export const metadata = {
  title: `Returned Sales | ${STORE_NAME} - ${STORE_TAGLINE}`,
  description: `Returned Sales Orders Queue on ${STORE_NAME}.`,
}

export default function SalesReturnedLayout({ children }) {
  return <>{children}</>
}

import React from 'react'
import { STORE_NAME, STORE_TAGLINE } from '@/lib/secret'

export const metadata = {
  title: `Confirmed Sales | ${STORE_NAME} - ${STORE_TAGLINE}`,
  description: `Confirmed Sales Orders Queue on ${STORE_NAME}.`,
}

export default function SalesConfirmedLayout({ children }) {
  return <>{children}</>
}

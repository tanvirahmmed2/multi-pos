import React from 'react'
import { STORE_NAME, STORE_TAGLINE } from '@/lib/secret'

export const metadata = {
  title: `Investment Records | ${STORE_NAME} - ${STORE_TAGLINE}`,
  description: `Track capital investments on ${STORE_NAME}.`,
}

export default function InvestmentsLayout({ children }) {
  return <>{children}</>
}

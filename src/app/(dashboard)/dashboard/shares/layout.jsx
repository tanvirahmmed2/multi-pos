import React from 'react'
import { STORE_NAME, STORE_TAGLINE } from '@/lib/secret'

export const metadata = {
  title: `Share Allocations & Equity | ${STORE_NAME} - ${STORE_TAGLINE}`,
  description: `View investor equity distribution and share allocation percentages on ${STORE_NAME}.`,
}

export default function SharesLayout({ children }) {
  return <>{children}</>
}

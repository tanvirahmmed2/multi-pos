import React from 'react'
import { STORE_NAME, STORE_TAGLINE } from '@/lib/secret'

export const metadata = {
  title: `My Salary & Earnings | ${STORE_NAME} - ${STORE_TAGLINE}`,
  description: `View staff personal salary breakdown, pay slips, and payment history on ${STORE_NAME}.`,
}

export default function MySalaryLayout({ children }) {
  return <>{children}</>
}

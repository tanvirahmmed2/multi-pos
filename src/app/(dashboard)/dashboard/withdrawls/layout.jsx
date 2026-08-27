import React from 'react'
import { STORE_NAME, STORE_TAGLINE } from '@/lib/secret'

export const metadata = {
  title: `Capital Withdrawals | ${STORE_NAME} - ${STORE_TAGLINE}`,
  description: `Manage capital withdrawals on ${STORE_NAME}.`,
}

export default function WithdrawlsLayout({ children }) {
  return <>{children}</>
}

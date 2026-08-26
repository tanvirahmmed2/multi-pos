import React from 'react'
import { STORE_NAME, STORE_TAGLINE } from '@/lib/secret'

export const metadata = {
  title: `Admin Payments | ${STORE_NAME} - ${STORE_TAGLINE}`,
  description: `Admin Payment History and Transactions on ${STORE_NAME}.`,
}

export default function AdminPaymentsLayout({ children }) {
  return <>{children}</>
}

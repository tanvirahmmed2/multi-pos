import React from 'react'
import { STORE_NAME, STORE_TAGLINE } from '@/lib/secret'

export const metadata = {
  title: `Purchase Payments Log | ${STORE_NAME} - ${STORE_TAGLINE}`,
  description: `Audit supplier purchase payments and transaction logs on ${STORE_NAME}.`,
}

export default function PurchasePaymentsLayout({ children }) {
  return <>{children}</>
}

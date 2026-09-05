import React from 'react'
import { STORE_NAME, STORE_TAGLINE } from '@/lib/secret'

export const metadata = {
  title: `Expense Payments Log | ${STORE_NAME} - ${STORE_TAGLINE}`,
  description: `Track and audit expense payment transactions on ${STORE_NAME}.`,
}

export default function ExpensePaymentsLayout({ children }) {
  return <>{children}</>
}

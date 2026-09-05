import React from 'react'
import { STORE_NAME, STORE_TAGLINE } from '@/lib/secret'

export const metadata = {
  title: `Expense Management | ${STORE_NAME} - ${STORE_TAGLINE}`,
  description: `Manage store operational expenses, billings, and expense logs on ${STORE_NAME}.`,
}

export default function ExpensesLayout({ children }) {
  return <>{children}</>
}

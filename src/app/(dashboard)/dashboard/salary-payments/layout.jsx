import React from 'react'
import { STORE_NAME, STORE_TAGLINE } from '@/lib/secret'

export const metadata = {
  title: `Salary Payments | ${STORE_NAME} - ${STORE_TAGLINE}`,
  description: `Track and disburse salary payments on ${STORE_NAME}.`,
}

export default function SalaryPaymentsLayout({ children }) {
  return <>{children}</>
}

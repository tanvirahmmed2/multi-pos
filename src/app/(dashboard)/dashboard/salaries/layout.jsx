import React from 'react'
import { STORE_NAME, STORE_TAGLINE } from '@/lib/secret'

export const metadata = {
  title: `Salary Structures | ${STORE_NAME} - ${STORE_TAGLINE}`,
  description: `Manage payroll salary structures on ${STORE_NAME}.`,
}

export default function SalariesLayout({ children }) {
  return <>{children}</>
}

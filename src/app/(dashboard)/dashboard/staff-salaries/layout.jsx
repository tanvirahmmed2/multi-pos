import React from 'react'
import { STORE_NAME, STORE_TAGLINE } from '@/lib/secret'

export const metadata = {
  title: `Staff Salaries | ${STORE_NAME} - ${STORE_TAGLINE}`,
  description: `Assign and manage staff salaries on ${STORE_NAME}.`,
}

export default function StaffSalariesLayout({ children }) {
  return <>{children}</>
}

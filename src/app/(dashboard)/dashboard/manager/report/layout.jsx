import React from 'react'
import { STORE_NAME, STORE_TAGLINE } from '@/lib/secret'

export const metadata = {
  title: `Manager Reports | ${STORE_NAME} - ${STORE_TAGLINE}`,
  description: `Manager Performance Reports on ${STORE_NAME}.`,
}

export default function ManagerReportLayout({ children }) {
  return <>{children}</>
}

import React from 'react'
import { STORE_NAME, STORE_TAGLINE } from '@/lib/secret'

export const metadata = {
  title: `Analytics & Reports | ${STORE_NAME} - ${STORE_TAGLINE}`,
  description: `Store Performance Reports & Analytics on ${STORE_NAME}.`,
}

export default function AdminReportLayout({ children }) {
  return <>{children}</>
}

import React from 'react'
import { STORE_NAME, STORE_TAGLINE } from '@/lib/secret'

export const metadata = {
  title: `Report Issue | ${STORE_NAME} - ${STORE_TAGLINE}`,
  description: `Report Sales Desk Issue on ${STORE_NAME}.`,
}

export default function SalesIssueLayout({ children }) {
  return <>{children}</>
}

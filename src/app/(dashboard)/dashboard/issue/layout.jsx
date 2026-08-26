import React from 'react'
import { STORE_NAME, STORE_TAGLINE } from '@/lib/secret'

export const metadata = {
  title: `Issue Logs | ${STORE_NAME} - ${STORE_TAGLINE}`,
  description: `System Issue Logs Monitoring on ${STORE_NAME}.`,
}

export default function AdminIssueLayout({ children }) {
  return <>{children}</>
}

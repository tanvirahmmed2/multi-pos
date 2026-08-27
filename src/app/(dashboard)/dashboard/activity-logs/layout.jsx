import React from 'react'
import { STORE_NAME, STORE_TAGLINE } from '@/lib/secret'

export const metadata = {
  title: `Activity Logs | ${STORE_NAME} - ${STORE_TAGLINE}`,
  description: `Audit and view system activity logs on ${STORE_NAME}.`,
}

export default function ActivityLogsLayout({ children }) {
  return <>{children}</>
}

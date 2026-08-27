import React from 'react'
import { STORE_NAME, STORE_TAGLINE } from '@/lib/secret'

export const metadata = {
  title: `Login Logs | ${STORE_NAME} - ${STORE_TAGLINE}`,
  description: `Audit and view staff login logs on ${STORE_NAME}.`,
}

export default function LoginLogsLayout({ children }) {
  return <>{children}</>
}

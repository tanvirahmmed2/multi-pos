import React from 'react'
import { STORE_NAME, STORE_TAGLINE } from '@/lib/secret'

export const metadata = {
  title: `Notices & Announcements | ${STORE_NAME} - ${STORE_TAGLINE}`,
  description: `View company notices, announcements, and internal communications on ${STORE_NAME}.`,
}

export default function NoticesLayout({ children }) {
  return <>{children}</>
}

import React from 'react'
import { STORE_NAME, STORE_TAGLINE } from '@/lib/secret'

export const metadata = {
  title: `Notice Details | ${STORE_NAME} - ${STORE_TAGLINE}`,
  description: `View notice details and announcements on ${STORE_NAME}.`,
}

export default function NoticeDetailsLayout({ children }) {
  return <>{children}</>
}

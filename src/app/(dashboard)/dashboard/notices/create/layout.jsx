import React from 'react'
import { STORE_NAME, STORE_TAGLINE } from '@/lib/secret'

export const metadata = {
  title: `Create Notice | ${STORE_NAME} - ${STORE_TAGLINE}`,
  description: `Create and publish new notices and announcements on ${STORE_NAME}.`,
}

export default function CreateNoticeLayout({ children }) {
  return <>{children}</>
}

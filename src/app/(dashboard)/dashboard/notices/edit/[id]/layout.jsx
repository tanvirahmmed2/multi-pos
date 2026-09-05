import React from 'react'
import { STORE_NAME, STORE_TAGLINE } from '@/lib/secret'

export const metadata = {
  title: `Edit Notice | ${STORE_NAME} - ${STORE_TAGLINE}`,
  description: `Edit existing company notice or announcement on ${STORE_NAME}.`,
}

export default function EditNoticeLayout({ children }) {
  return <>{children}</>
}

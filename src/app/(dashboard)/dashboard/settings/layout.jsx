import React from 'react'
import { STORE_NAME, STORE_TAGLINE } from '@/lib/secret'

export const metadata = {
  title: `Store Settings | ${STORE_NAME} - ${STORE_TAGLINE}`,
  description: `Website & System Settings Configuration on ${STORE_NAME}.`,
}

export default function AdminSettingsLayout({ children }) {
  return <>{children}</>
}

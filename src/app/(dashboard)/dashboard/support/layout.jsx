import React from 'react'
import { STORE_NAME, STORE_TAGLINE } from '@/lib/secret'

export const metadata = {
  title: `Support Tickets | ${STORE_NAME} - ${STORE_TAGLINE}`,
  description: `Manager Support Tickets Console on ${STORE_NAME}.`,
}

export default function ManagerSupportLayout({ children }) {
  return <>{children}</>
}

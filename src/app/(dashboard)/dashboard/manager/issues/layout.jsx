import React from 'react'
import { STORE_NAME, STORE_TAGLINE } from '@/lib/secret'

export const metadata = {
  title: `Issues & Complaints | ${STORE_NAME} - ${STORE_TAGLINE}`,
  description: `Reported Issues Management on ${STORE_NAME}.`,
}

export default function ManagerIssuesLayout({ children }) {
  return <>{children}</>
}

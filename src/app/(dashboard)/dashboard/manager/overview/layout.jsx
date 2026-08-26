import React from 'react'
import { STORE_NAME, STORE_TAGLINE } from '@/lib/secret'

export const metadata = {
  title: `Manager Overview | ${STORE_NAME} - ${STORE_TAGLINE}`,
  description: `Manager Overview & Metrics on ${STORE_NAME}.`,
}

export default function ManagerOverviewLayout({ children }) {
  return <>{children}</>
}

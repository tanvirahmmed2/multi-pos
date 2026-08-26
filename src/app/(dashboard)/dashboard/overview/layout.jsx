import React from 'react'
import { STORE_NAME, STORE_TAGLINE } from '@/lib/secret'

export const metadata = {
  title: `Admin Overview | ${STORE_NAME} - ${STORE_TAGLINE}`,
  description: `Admin System Overview on ${STORE_NAME}.`,
}

export default function AdminOverviewLayout({ children }) {
  return <>{children}</>
}

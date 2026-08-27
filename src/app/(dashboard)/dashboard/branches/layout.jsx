import React from 'react'
import { STORE_NAME, STORE_TAGLINE } from '@/lib/secret'

export const metadata = {
  title: `Branches Management | ${STORE_NAME} - ${STORE_TAGLINE}`,
  description: `Manage store branches on ${STORE_NAME}.`,
}

export default function BranchesLayout({ children }) {
  return <>{children}</>
}

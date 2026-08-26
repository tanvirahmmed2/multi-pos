import React from 'react'
import { STORE_NAME, STORE_TAGLINE } from '@/lib/secret'

export const metadata = {
  title: `Order Returns | ${STORE_NAME} - ${STORE_TAGLINE}`,
  description: `Manager Order Returns Console on ${STORE_NAME}.`,
}

export default function ManagerReturnLayout({ children }) {
  return <>{children}</>
}

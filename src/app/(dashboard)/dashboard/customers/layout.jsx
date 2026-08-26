import React from 'react'
import { STORE_NAME, STORE_TAGLINE } from '@/lib/secret'

export const metadata = {
  title: `Customer Directory | ${STORE_NAME} - ${STORE_TAGLINE}`,
  description: `Manager Customer Accounts Directory on ${STORE_NAME}.`,
}

export default function ManagerCustomersLayout({ children }) {
  return <>{children}</>
}

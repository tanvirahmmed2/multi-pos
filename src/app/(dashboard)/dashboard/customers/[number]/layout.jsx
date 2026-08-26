import React from 'react'
import { STORE_NAME, STORE_TAGLINE } from '@/lib/secret'

export const metadata = {
  title: `Customer Profile & Orders | ${STORE_NAME} - ${STORE_TAGLINE}`,
  description: `Customer Account History & Orders on ${STORE_NAME}.`,
}

export default function ManagerCustomerProfileLayout({ children }) {
  return <>{children}</>
}

import React from 'react'
import { STORE_NAME, STORE_TAGLINE } from '@/lib/secret'

export const metadata = {
  title: `People Management | ${STORE_NAME} - ${STORE_TAGLINE}`,
  description: `Staff and User Accounts Management on ${STORE_NAME}.`,
}

export default function AdminPeopleLayout({ children }) {
  return <>{children}</>
}

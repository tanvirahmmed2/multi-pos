import React from 'react'
import { STORE_NAME, STORE_TAGLINE } from '@/lib/secret'

export const metadata = {
  title: `Create User Account | ${STORE_NAME} - ${STORE_TAGLINE}`,
  description: `Create New System User Account on ${STORE_NAME}.`,
}

export default function AdminNewUserLayout({ children }) {
  return <>{children}</>
}

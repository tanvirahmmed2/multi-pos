import React from 'react'
import { STORE_NAME, STORE_TAGLINE } from '@/lib/secret'

export const metadata = {
  title: `Balance Management | ${STORE_NAME} - ${STORE_TAGLINE}`,
  description: `Monitor system available balance, cash flows, and financial balance metrics on ${STORE_NAME}.`,
}

export default function AdminBalanceLayout({ children }) {
  return <>{children}</>
}

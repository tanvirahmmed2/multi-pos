import React from 'react'
import { STORE_NAME, STORE_TAGLINE } from '@/lib/secret'

export const metadata = {
  title: `Record Withdrawal | ${STORE_NAME} - ${STORE_TAGLINE}`,
  description: `Record investor capital or profit withdrawal on ${STORE_NAME}.`,
}

export default function CreateWithdrawalLayout({ children }) {
  return <>{children}</>
}

import React from 'react'
import { STORE_NAME, STORE_TAGLINE } from '@/lib/secret'

export const metadata = {
  title: `Record Withdrawal | ${STORE_NAME} - ${STORE_TAGLINE}`,
  description: `Record investor withdrawal on ${STORE_NAME}.`,
}

export default function CreateWithdrawlsAliasLayout({ children }) {
  return <>{children}</>
}

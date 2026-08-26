import React from 'react'
import { STORE_NAME, STORE_TAGLINE } from '@/lib/secret'

export const metadata = {
  title: `Recover Account | ${STORE_NAME} - ${STORE_TAGLINE}`,
  description: `Explore Recover Account page on ${STORE_NAME}, ${STORE_TAGLINE}.`,
}

export default function RecoverAccountLayout({ children }) {
  return (
    <>
      {children}
    </>
  )
}

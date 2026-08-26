import React from 'react'
import { STORE_NAME, STORE_TAGLINE } from '@/lib/secret'

export const metadata = {
  title: `Product Reviews | ${STORE_NAME} - ${STORE_TAGLINE}`,
  description: `Manager Customer Product Reviews on ${STORE_NAME}.`,
}

export default function ManagerReviewsLayout({ children }) {
  return <>{children}</>
}

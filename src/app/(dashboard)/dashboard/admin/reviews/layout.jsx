import React from 'react'
import { STORE_NAME, STORE_TAGLINE } from '@/lib/secret'

export const metadata = {
  title: `Customer Reviews | ${STORE_NAME} - ${STORE_TAGLINE}`,
  description: `Customer Reviews Management on ${STORE_NAME}.`,
}

export default function AdminReviewsLayout({ children }) {
  return <>{children}</>
}

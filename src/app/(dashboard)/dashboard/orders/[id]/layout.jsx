import React from 'react'
import { STORE_NAME, STORE_TAGLINE } from '@/lib/secret'

export const metadata = {
  title: `Order Details | ${STORE_NAME} - ${STORE_TAGLINE}`,
  description: `View order details on ${STORE_NAME}.`,
}

export default function OrderDetailsLayout({ children }) {
  return <>{children}</>
}

import React from 'react'
import { STORE_NAME, STORE_TAGLINE } from '@/lib/secret'

export const metadata = {
  title: `Out for Delivery | ${STORE_NAME} - ${STORE_TAGLINE}`,
  description: `Out for Delivery Orders Queue on ${STORE_NAME}.`,
}

export default function SalesDeliveryLayout({ children }) {
  return <>{children}</>
}

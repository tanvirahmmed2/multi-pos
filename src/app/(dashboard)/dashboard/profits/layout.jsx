import React from 'react'
import { STORE_NAME, STORE_TAGLINE } from '@/lib/secret'

export const metadata = {
  title: `Investor Profit Allocations | ${STORE_NAME} - ${STORE_TAGLINE}`,
  description: `Track investor daily gross profit allocations and profit transfers on ${STORE_NAME}.`,
}

export default function ProfitsLayout({ children }) {
  return <>{children}</>
}

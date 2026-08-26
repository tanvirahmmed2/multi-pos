import React from 'react'
import { STORE_NAME, STORE_TAGLINE } from '@/lib/secret'

export const metadata = {
  title: `Create Purchase Order | ${STORE_NAME} - ${STORE_TAGLINE}`,
  description: `Create New Purchase Order on ${STORE_NAME}.`,
}

export default function ManagerPurchaseCreateLayout({ children }) {
  return <>{children}</>
}

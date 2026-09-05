import React from 'react'
import { STORE_NAME, STORE_TAGLINE } from '@/lib/secret'

export const metadata = {
  title: `System Modules | ${STORE_NAME} - ${STORE_TAGLINE}`,
  description: `Configure system feature flags, modules, and operational modes on ${STORE_NAME}.`,
}

export default function ModulesLayout({ children }) {
  return <>{children}</>
}

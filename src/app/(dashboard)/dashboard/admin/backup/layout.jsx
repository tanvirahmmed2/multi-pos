import React from 'react'
import { STORE_NAME, STORE_TAGLINE } from '@/lib/secret'

export const metadata = {
  title: `Database Backup | ${STORE_NAME} - ${STORE_TAGLINE}`,
  description: `SQL Database Backup and Dump Export on ${STORE_NAME}.`,
}

export default function AdminBackupLayout({ children }) {
  return <>{children}</>
}

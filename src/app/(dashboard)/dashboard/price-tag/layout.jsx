import React from 'react'
import { STORE_NAME, STORE_TAGLINE } from '@/lib/secret'

export const metadata = {
  title: `Barcode & Price Tag Generator | ${STORE_NAME} - ${STORE_TAGLINE}`,
  description: `Generate and print product barcodes and price tags on ${STORE_NAME}.`,
}

export default function PriceTagLayout({ children }) {
  return <>{children}</>
}

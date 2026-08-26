'use client'
import React from 'react'
import { Toaster } from 'react-hot-toast'

const HotToast = () => {
  return (
    <Toaster
      position="bottom-left"
      reverseOrder={false}
      gutter={8}
      toastOptions={{
        duration: 4000,
        style: {
          background: '#1e293b', // Slate 800
          color: '#ffffff',
          borderRadius: '12px',
          fontSize: '14px',
          fontWeight: '500',
          padding: '12px 16px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
        },
        success: {
          duration: 3000,
          style: {
            background: '#10b981', // Emerald 500
          },
        },
        error: {
          duration: 4000,
          style: {
            background: '#f43f5e', // Rose 500
          },
        },
      }}
    />
  )
}

export default HotToast

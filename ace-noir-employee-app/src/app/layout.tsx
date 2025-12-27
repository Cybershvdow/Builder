import type { Metadata } from 'next'
import { Toaster } from 'react-hot-toast'
import './globals.css'

export const metadata: Metadata = {
  title: 'Ace Noir Employee Portal',
  description: 'Employee tracking and management system for Ace Noir Cleaning Services',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1a1a1a',
              color: '#fff',
            },
            success: {
              iconTheme: {
                primary: '#C9A86C',
                secondary: '#1a1a1a',
              },
            },
          }}
        />
      </body>
    </html>
  )
}

import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'DeptoManager',
    template: '%s | DeptoManager',
  },
  description: 'Sistema de gestión de departamentos Airbnb',
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  themeColor: '#09090b',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className="antialiased noise">
        {children}
      </body>
    </html>
  )
}

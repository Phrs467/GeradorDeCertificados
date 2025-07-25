import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'

export const metadata: Metadata = {
  title: 'Gerador de Certificados',
  description: 'Created with OwlTech',
  generator: 'OwlTech',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/png" href="/OwlTechLogo.png" />
      </head>
      <body>{children}</body>
    </html>
  )
}

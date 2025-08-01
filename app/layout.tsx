import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'

export const metadata: Metadata = {
  title: 'Gerador de Certificados',
  description: 'Created with OwlTech',
  generator: 'OwlTech',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        {/* Espaço para navbar fixa global */}
        <div style={{height: 60}} />
        {children}
      </body>
    </html>
  )
}

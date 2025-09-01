import type React from "react"
import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import "./globals.css"

const geistSans = Geist({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist-sans",
})

const geistMono = Geist_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist-mono",
})

export const metadata: Metadata = {
  title: "Consultório Dr. Marcos Rocha - Sistema Interno",
  description:
    "Sistema interno de gestão para consultório odontológico Dr. Marcos Rocha. Acesso seguro a formulários, prontuários e ferramentas administrativas.",
  keywords: "consultório odontológico, sistema interno, Dr. Marcos Rocha, gestão dental, prontuários",
  authors: [{ name: "Dr. Marcos Rocha" }],
  creator: "Dr. Marcos Rocha",
  publisher: "Consultório Dr. Marcos Rocha",
  robots: "noindex, nofollow", // Private system - prevent search engine indexing
  generator: "v0.app",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1b2370",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
      <head>
        <meta name="robots" content="noindex, nofollow" />
      </head>
      <body className="font-sans antialiased">
        <Suspense
          fallback={
            <div className="min-h-screen bg-[#1b2370] flex items-center justify-center">
              <div className="text-white">Carregando...</div>
            </div>
          }
        >
          {children}
        </Suspense>
        <Analytics />
      </body>
    </html>
  )
}

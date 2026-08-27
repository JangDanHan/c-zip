import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Inter, Noto_Sans_KR } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const notoSansKr = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-noto-sans-kr',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'FitRe (핏리) · 임상적 정밀함의 운동 대체 처방 솔루션',
  description:
    '무릎·허리 등 관절 통증이나 기피 운동을 안전하게 배제하고, 운동 목표는 100% 달성할 수 있는 최적의 대체 운동을 제안합니다.',
  generator: 'FitRe Vitality',
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#0066FF',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko" className={`light ${inter.variable} ${notoSansKr.variable} bg-background`}>
      <body className="font-sans antialiased text-foreground bg-background">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}

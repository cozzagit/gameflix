import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from '@/lib/providers';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: 'Gameflix — La tua palestra mentale quotidiana',
    template: '%s | Gameflix',
  },
  description:
    'Sfide quotidiane, puzzle, quiz e giochi di logica. Nuovi contenuti ogni settimana. Classifiche, streak e badge.',
  keywords: ['puzzle', 'giochi', 'quiz', 'logica', 'brain training', 'gameflix'],
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-touch-icon.png',
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    title: 'Gameflix — La tua palestra mentale quotidiana',
    description: 'Sfide quotidiane, puzzle, quiz e giochi di logica. Nuovi contenuti ogni settimana.',
    siteName: 'Gameflix',
    type: 'website',
    locale: 'it_IT',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-gameflix-bg text-gameflix-text font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

import type {Metadata} from 'next';
import {Inter} from 'next/font/google';
import './globals.css';
import {NotificationProvider} from '@/contexts/notificationContext';
import {NextAuthProvider} from '@/components/nexAuthProvider/nextAuthProvider';

const inter = Inter({subsets: ['latin']});

export const metadata: Metadata = {
  title: 'E-shop',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <NextAuthProvider>
        <body className={`${inter.className} bg-priamry`}>
          <NotificationProvider>{children}</NotificationProvider>
        </body>
      </NextAuthProvider>
    </html>
  );
}

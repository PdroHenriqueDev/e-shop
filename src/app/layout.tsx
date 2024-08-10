import type {Metadata} from 'next';
import {Inter} from 'next/font/google';
import './globals.css';
import {NotificationProvider} from '@/contexts/notificationContext';
import {NextAuthProvider} from '@/components/nexAuthProvider/nextAuthProvider';
import {Session} from 'next-auth';

const inter = Inter({subsets: ['latin']});

export const metadata: Metadata = {
  title: 'E-shop',
};

export default function RootLayout({
  children,
  session,
}: Readonly<{
  children: React.ReactNode;
  session: Session | null;
}>) {
  return (
    <html lang="en">
      <NextAuthProvider session={session}>
        <body className={`${inter.className} bg-gray-100`}>
          <NotificationProvider>{children}</NotificationProvider>
        </body>
      </NextAuthProvider>
    </html>
  );
}

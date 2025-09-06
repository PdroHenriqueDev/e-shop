import type {Metadata} from 'next';
import {Inter} from 'next/font/google';
import './globals.css';
import {NotificationProvider} from '@/contexts/notificationContext';
import {NextAuthProvider} from '@/components/nexAuthProvider/nextAuthProvider';
import {App} from 'antd';
import {AntdRegistry} from '@ant-design/nextjs-registry';

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
      <body className={`${inter.className} bg-primary`}>
        <NextAuthProvider>
          <AntdRegistry>
            <App>
              <NotificationProvider>{children}</NotificationProvider>
            </App>
          </AntdRegistry>
        </NextAuthProvider>
      </body>
    </html>
  );
}

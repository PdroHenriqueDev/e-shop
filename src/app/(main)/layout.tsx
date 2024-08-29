import Loading from '@/components/loading/loading';
import NavMenu from '@/components/navMenu/navMenu';
import {CartProvider} from '@/contexts/cartContext';
import {Suspense} from 'react';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Suspense fallback={<Loading />}>
      <CartProvider>
        <NavMenu />
        {children}
      </CartProvider>
    </Suspense>
  );
}

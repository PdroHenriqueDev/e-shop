import Loading from '@/components/loading/loading';
import NavMenu from '@/components/navMenu/navMenu';
import {CartProvider} from '@/contexts/cartContext';
import {OrderProvider} from '@/contexts/orderContext';
import {Suspense} from 'react';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Suspense fallback={<Loading />}>
      <CartProvider>
        <OrderProvider>
          <NavMenu />
          {children}
        </OrderProvider>
      </CartProvider>
    </Suspense>
  );
}

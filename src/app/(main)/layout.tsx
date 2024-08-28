import NavMenu from '@/components/navMenu/navMenu';
import {CartProvider} from '@/contexts/cartContext';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <CartProvider>
      <NavMenu />
      {children}
    </CartProvider>
  );
}

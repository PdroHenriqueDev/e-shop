import NavMenu from '@/components/navMenu/navMenu';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div>
      <NavMenu />
      {children}
    </div>
  );
}

'use client';
import {SessionProvider} from 'next-auth/react';
import {ReactNode} from 'react';

type Props = {
  children?: ReactNode;
};

export const NextAuthProvider = ({children}: Props) => {
  return (
    <SessionProvider
      refetchInterval={5 * 60} // Refetch session every 5 minutes
      refetchOnWindowFocus={true}
      refetchWhenOffline={false}>
      {children}
    </SessionProvider>
  );
};

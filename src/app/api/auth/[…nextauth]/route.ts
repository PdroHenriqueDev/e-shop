import NextAuth from 'next-auth/next';
import CredentialsProvider from 'next-auth/providers/credentials';
import {sql} from '@vercel/postgres';
import {compare} from 'bcrypt';

const handler = NextAuth({
  session: {
    strategy: 'jwt',
  },

  pages: {
    signIn: '/login',
  },

  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: {},
        password: {},
      },
      async authorize(credentials, req) {
        return null;
      },
    }),
  ],
});

export {handler as GET, handler as POST};

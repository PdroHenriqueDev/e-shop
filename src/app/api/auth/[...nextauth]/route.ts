import NextAuth from 'next-auth/next';
import CredentialsProvider from 'next-auth/providers/credentials';
import axios from 'axios';
import {UserProps} from '@/interfaces/user';

const handler = NextAuth({
  session: {
    strategy: 'jwt',
  },
  jwt: {
    secret: process.env.NEXTAUTH_SECRET,
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    jwt: async ({token, user}) => {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    session: async ({session, token}: any) => {
      session.user.id = token.id;
      return session;
    },
    async redirect({baseUrl}) {
      return baseUrl;
    },
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: {},
        password: {},
      },
      async authorize(credentials, req) {
        const {email, password} = credentials as UserProps;

        try {
          const result = await axios.post(
            `${process.env.NEXTAUTH_URL}/api/auth/login`,
            {
              email,
              password,
            },
          );

          return result.data;
        } catch (error) {
          return null;
        }
      },
    }),
  ],
});

export {handler as GET, handler as POST};

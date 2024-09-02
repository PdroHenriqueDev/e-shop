import NextAuth from 'next-auth/next';
import CredentialsProvider from 'next-auth/providers/credentials';
import axios from 'axios';
import {UserProps} from '@/interfaces/user';
import GithubProvider from 'next-auth/providers/github';
import {NextAuthOptions} from 'next-auth';

const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
  },
  jwt: {
    secret: process.env.NEXTAUTH_SECRET,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
    error: '/login',
    signOut: '/login',
  },
  callbacks: {
    jwt: async ({token, user}) => {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    session: async ({session, token}: any) => {
      if (token) {
        session.user.id = token.id;
      }
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
        email: {label: 'Email', type: 'text'},
        password: {label: 'Password', type: 'password'},
      },
      async authorize(credentials, req) {
        const {email, password} = credentials as UserProps;
        if (!email || !password) {
          return null;
        }

        try {
          const result = await axios.post(
            `${process.env.NEXTAUTH_URL}/api/auth/login`,
            {
              email,
              password,
            },
          );

          if (result.data) {
            const {user} = result.data;
            return user;
          }

          return null;
        } catch (error) {
          return null;
        }
      },
    }),
    GithubProvider({
      clientId: process.env.GITHUB_ID ?? '',
      clientSecret: process.env.GITHUB_SECRET ?? '',
    }),
  ],
};

const handler = NextAuth(authOptions);

export {handler as GET, handler as POST};

export {authOptions};

import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import GitHub from 'next-auth/providers/github';
import {UserProps} from '@/interfaces/user';
import axios from 'axios';
import prisma from '@/lib/prisma';

export const {auth, handlers, signIn, signOut} = NextAuth({
  session: {
    strategy: 'jwt',
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
    error: '/login',
    signOut: '/login',
  },
  callbacks: {
    async signIn({user, account, profile}) {
      if (account?.provider === 'github') {
        try {
          const existingUser = await prisma.user.findUnique({
            where: {email: user.email!},
          });

          if (!existingUser) {
            const newUser = await prisma.user.create({
              data: {
                name: user.name!,
                email: user.email!,
                password: '',
              },
            });
            user.id = newUser.id.toString();
          } else {
            user.id = existingUser.id.toString();
          }
        } catch (error) {
          console.error('Error creating/finding user:', error);
          return false;
        }
      }
      return true;
    },
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
    Credentials({
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
    GitHub({
      clientId: process.env.GITHUB_ID ?? '',
      clientSecret: process.env.GITHUB_SECRET ?? '',
    }),
  ],
});

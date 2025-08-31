import {NextResponse} from 'next/server';
import {getServerSession} from 'next-auth';
import {authOptions} from '@/app/api/auth/[...nextauth]/authOptions';
import prisma from '@/lib/prisma';
import {User} from '@prisma/client';

export async function validateAdminAccess() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return {
        error: NextResponse.json(
          {error: 'Authentication required'},
          {status: 401},
        ),
      };
    }

    const userId = Number((session.user as User).id);

    const user = await prisma.user.findUnique({
      where: {id: userId},
    });

    if (!user) {
      return {
        error: NextResponse.json({error: 'User not found'}, {status: 404}),
      };
    }

    if ((user as any).role !== 'admin') {
      return {
        error: NextResponse.json(
          {error: 'Admin access required'},
          {status: 403},
        ),
      };
    }

    return {user};
  } catch (error) {
    console.error('Admin validation error:', error);
    return {
      error: NextResponse.json({error: 'Internal server error'}, {status: 500}),
    };
  }
}

export async function validateUserAccess() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return {
        error: NextResponse.json(
          {error: 'Authentication required'},
          {status: 401},
        ),
      };
    }

    const userId = Number((session.user as User).id);

    const user = await prisma.user.findUnique({
      where: {id: userId},
    });

    if (!user) {
      return {
        error: NextResponse.json({error: 'User not found'}, {status: 404}),
      };
    }

    return {user};
  } catch (error) {
    console.error('User validation error:', error);
    return {
      error: NextResponse.json({error: 'Internal server error'}, {status: 500}),
    };
  }
}

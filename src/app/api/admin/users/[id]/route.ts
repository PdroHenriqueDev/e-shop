import {NextRequest, NextResponse} from 'next/server';
import {validateAdminAccess} from '@/lib/adminMiddleware';
import prisma from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  {params}: {params: {id: string}},
) {
  const authResult = await validateAdminAccess();
  if (authResult) {
    return authResult;
  }

  try {
    const userId = parseInt(params.id);
    if (isNaN(userId)) {
      return NextResponse.json({error: 'Invalid user ID'}, {status: 400});
    }

    const {name, email, role} = await request.json();

    if (!name || !email || !role) {
      return NextResponse.json(
        {error: 'Name, email, and role are required'},
        {status: 400},
      );
    }

    if (!['user', 'admin'].includes(role)) {
      return NextResponse.json({error: 'Invalid role'}, {status: 400});
    }

    const existingUser = await prisma.user.findUnique({
      where: {id: userId},
    });

    if (!existingUser) {
      return NextResponse.json({error: 'User not found'}, {status: 404});
    }

    if (email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: {email},
      });

      if (emailExists) {
        return NextResponse.json(
          {error: 'Email is already taken'},
          {status: 400},
        );
      }
    }

    const user = await prisma.user.update({
      where: {id: userId},
      data: {
        name,
        email,
        role,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            orders: true,
          },
        },
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('Failed to update user:', error);
    return NextResponse.json({error: 'Failed to update user'}, {status: 500});
  }
}

export async function DELETE(
  request: NextRequest,
  {params}: {params: {id: string}},
) {
  const authResult = await validateAdminAccess();
  if (authResult) {
    return authResult;
  }

  try {
    const userId = parseInt(params.id);
    if (isNaN(userId)) {
      return NextResponse.json({error: 'Invalid user ID'}, {status: 400});
    }

    const existingUser = await prisma.user.findUnique({
      where: {id: userId},
    });

    if (!existingUser) {
      return NextResponse.json({error: 'User not found'}, {status: 404});
    }

    await prisma.user.delete({
      where: {id: userId},
    });

    return NextResponse.json({message: 'User deleted successfully'});
  } catch (error) {
    console.error('Failed to delete user:', error);
    return NextResponse.json({error: 'Failed to delete user'}, {status: 500});
  }
}

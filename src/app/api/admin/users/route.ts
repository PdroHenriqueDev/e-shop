import {NextRequest, NextResponse} from 'next/server';
import prisma from '@/lib/prisma';
import {hash} from 'bcrypt';
import {validateAdminAccess} from '@/lib/adminMiddleware';

export async function GET() {
  const authResult = await validateAdminAccess();
  if (authResult.error) {
    return authResult.error;
  }

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        _count: {
          select: {
            orders: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({error: 'Failed to fetch users'}, {status: 500});
  }
}

export async function POST(request: NextRequest) {
  const authResult = await validateAdminAccess();
  if (authResult.error) {
    return authResult.error;
  }

  try {
    const {name, email, password, role} = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        {error: 'Name, email, and password are required'},
        {status: 400},
      );
    }

    const validRoles = ['customer', 'admin'];
    if (role && !validRoles.includes(role)) {
      return NextResponse.json({error: 'Invalid role'}, {status: 400});
    }

    const existingUser = await prisma.user.findUnique({
      where: {email},
    });

    if (existingUser) {
      return NextResponse.json(
        {error: 'User with this email already exists'},
        {status: 400},
      );
    }

    const hashedPassword = await hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    return NextResponse.json(user, {status: 201});
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({error: 'Failed to create user'}, {status: 500});
  }
}

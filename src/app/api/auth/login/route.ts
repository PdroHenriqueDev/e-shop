import {NextRequest, NextResponse} from 'next/server';
import {compare} from 'bcrypt';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const {email, password} = await req.json();
  try {
    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      return NextResponse.json({message: 'Invalid credentials'}, {status: 401});
    }

    const isValid = await compare(password!, user.password);

    if (!isValid) {
      return NextResponse.json({message: 'Invalid credentials'}, {status: 401});
    }

    return Response.json({user}, {status: 200});
  } catch (e) {
    console.log({e});
    return NextResponse.json({message: 'error'});
  }
}

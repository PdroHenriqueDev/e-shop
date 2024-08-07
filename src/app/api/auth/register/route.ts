import {NextResponse} from 'next/server';
import {hash} from 'bcrypt';
import {UserProps} from '@/interfaces/user';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const {username, email, password} = (await request.json()) as UserProps;

    const userExists = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (userExists) {
      return NextResponse.json(
        {error: 'Email already registered. Please log in.'},
        {status: 400},
      );
    }

    const hashedPassword = await hash(password!, 10);

    await prisma.user.create({
      data: {
        name: username,
        email,
        password: hashedPassword,
      },
    });

    return NextResponse.json({message: 'success'});
  } catch (e) {
    console.log({e});
    return NextResponse.json({message: 'error'});
  }
}

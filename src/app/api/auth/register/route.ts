import {NextResponse} from 'next/server';
import {hash} from 'bcrypt';
import {sql} from '@vercel/postgres';
import {UserProps} from '@/interfaces/user';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const {username, email, password} = (await request.json()) as UserProps;

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

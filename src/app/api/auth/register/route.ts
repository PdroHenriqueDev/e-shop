import {NextResponse} from 'next/server';
import {hash} from 'bcrypt';
import {sql} from '@vercel/postgres';

export async function POST(request: Request) {
  try {
    const {name, email, password} = (await request.json()) as any;

    const hashedPassword = await hash(password, 10);

    const response =
      await sql`INSERT INTO users (name, email, password) VALUES (${name}, ${email}, ${hashedPassword})`;

    return NextResponse.json({message: 'success'});
  } catch (e) {
    console.log({e});
    return NextResponse.json({message: 'error'});
  }
}

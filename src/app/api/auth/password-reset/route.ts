import {NextResponse} from 'next/server';
import {hash} from 'bcrypt';
import {UserProps} from '@/interfaces/user';
import prisma from '@/lib/prisma';
import nodemailer from 'nodemailer';

const generateRandomPassword = (length = 12) => {
  const charset =
    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let password = '';
  for (let i = 0, n = charset.length; i < length; ++i) {
    password += charset.charAt(Math.floor(Math.random() * n));
  }
  return password;
};

export async function POST(request: Request) {
  try {
    const {email} = (await request.json()) as UserProps;

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      return NextResponse.json({message: 'User not found'}, {status: 404});
    }

    const newPassword = generateRandomPassword();
    const hashedPassword = await hash(newPassword, 10);

    await prisma.user.update({
      where: {email},
      data: {password: hashedPassword},
    });

    const serverEmail = process.env.NEXT_PUBLIC_PERSONAL_EMAIL;
    const serverEmailPassword = process.env.NEXT_PUBLIC_PERSONAL_EMAIL_PASSWORD;

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      host: 'smtp.gmail.com',
      port: 587,
      auth: {
        user: serverEmail,
        pass: serverEmailPassword,
      },
    });

    const mailOptions = {
      from: serverEmail,
      to: email,
      subject: 'Your New Password',
      html: `<p>Your new password is: ${newPassword}</p>`,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({
      message: 'New password has been sent to your email',
    });
  } catch (e) {
    console.log({e});
    return NextResponse.json({message: 'error'});
  }
}

'use client';

import {zodResolver} from '@hookform/resolvers/zod';
import {useForm} from 'react-hook-form';
import * as z from 'zod';
import axios from 'axios';
import {RegisterFormProps} from '@/interfaces/registerForm';
import CustomButton from '../customButtton';
import ErrorMessage from '../errorMessage';

const FormSchema = z
  .object({
    username: z.string().min(2, {
      message: 'Username must be at least 2 characters.',
    }),
    email: z.string().email({
      message: 'Invalid email format.',
    }),
    password: z.string().min(6, {
      message: 'Password must be at least 6 characters.',
    }),
    confirmPassword: z.string(),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match.",
    path: ['confirmPassword'],
  });

type FormData = z.infer<typeof FormSchema>;

export default function RegisterForm({handleRegister}: RegisterFormProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    console.log('Submitting form', data);

    const {email, password} = data;

    try {
      const response = await axios.post('/api/auth/register', {
        email,
        password,
      });
      console.log('Registration Successful', response);
    } catch (error: any) {
      console.error('Registration Failed:', error);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <div className="mb-4">
        <label className="block text-dark" htmlFor="name">
          Full Name
        </label>
        <input
          {...form.register('username')}
          className="w-full px-4 py-2 mt-2 text-sm bg-primary border rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
          type="text"
          id="name"
          placeholder="Enter your full name"
        />
        <ErrorMessage message={form.formState.errors.username?.message} />
      </div>
      <div className="mb-4">
        <label className="block text-dark" htmlFor="email">
          Email
        </label>
        <input
          {...form.register('email')}
          className="w-full px-4 py-2 mt-2 text-sm bg-primary border rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
          type="text"
          id="login"
          placeholder="Enter your email"
        />
        <ErrorMessage message={form.formState.errors.email?.message} />
      </div>
      <div className="mb-4">
        <label className="block text-dark" htmlFor="password">
          Password
        </label>
        <input
          {...form.register('password')}
          className="w-full px-4 py-2 mt-2 text-sm bg-primary border rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
          type="password"
          id="password"
          placeholder="Enter your password"
        />
        <ErrorMessage message={form.formState.errors.password?.message} />
      </div>
      <div className="mb-4">
        <label className="block text-dark" htmlFor="confirm-password">
          Confirm Password
        </label>
        <input
          {...form.register('confirmPassword')}
          className="w-full px-4 py-2 mt-2 text-sm bg-primary border rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
          type="password"
          id="confirm-password"
          placeholder="Confirme sua senha"
        />
        <ErrorMessage
          message={form.formState.errors.confirmPassword?.message}
        />
      </div>
      <div className="flex justify-between mb-4">
        <span
          onClick={handleRegister}
          className="text-sm text-dark cursor-pointer">
          Already have an account? Log in.
        </span>
      </div>
      <CustomButton type="submit" buttonText="Register" />
    </form>
  );
}

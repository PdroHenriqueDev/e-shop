'use client';

import {zodResolver} from '@hookform/resolvers/zod';
import {useForm} from 'react-hook-form';
import * as z from 'zod';
import axios from 'axios';

interface RegisterFormProps {
  handleRegister: () => void;
}

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
          Nome completo
        </label>
        <input
          {...form.register('username')}
          className="w-full px-4 py-2 mt-2 text-sm bg-primary border rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
          type="text"
          id="name"
          placeholder="Informe seu nome completo"
        />
        <p>{form.formState.errors.username?.message}</p>
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
          placeholder="insira seu email"
        />
        <p>{form.formState.errors.email?.message}</p>
      </div>
      <div className="mb-4">
        <label className="block text-dark" htmlFor="password">
          Senha
        </label>
        <input
          {...form.register('password')}
          className="w-full px-4 py-2 mt-2 text-sm bg-primary border rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
          type="password"
          id="password"
          placeholder="Insira sua senha"
        />
        <p>{form.formState.errors.password?.message}</p>
      </div>
      <div className="mb-4">
        <label className="block text-dark" htmlFor="confirm-password">
          Confirme senha
        </label>
        <input
          {...form.register('confirmPassword')}
          className="w-full px-4 py-2 mt-2 text-sm bg-primary border rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
          type="password"
          id="confirm-password"
          placeholder="Confirme sua senha"
        />
        <p>{form.formState.errors.confirmPassword?.message}</p>
      </div>
      <div className="flex justify-between mb-4">
        <span
          onClick={handleRegister}
          className="text-sm text-dark cursor-pointer">
          Já tem uma conta? Inicie sua sessão
        </span>
      </div>
      <button
        type="submit"
        className="w-full px-4 py-2 font-semibold text-dark bg-secondary rounded-md hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-secondary">
        Entrar
      </button>
    </form>
  );
}

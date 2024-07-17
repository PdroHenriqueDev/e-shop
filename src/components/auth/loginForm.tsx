import {UserProps} from '@/interfaces/user';
import {zodResolver} from '@hookform/resolvers/zod';
import axios from 'axios';
import {signIn} from 'next-auth/react';
import {useForm} from 'react-hook-form';
import z from 'zod';

const FormSchema = z.object({
  email: z.string().email({
    message: 'Invalid email format.',
  }),
  password: z.string().min(6, {
    message: 'Password must be at least 6 characters.',
  }),
});
type FormData = z.infer<typeof FormSchema>;

export default function LoginForm() {
  const form = useForm<FormData>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (user: FormData) => {
    const {email, password} = user;

    await signIn('credentials', {
      email,
      password,
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <div className="mb-4">
        <label className="block text-dark" htmlFor="login">
          Email
        </label>
        <input
          {...form.register('email')}
          className="w-full px-4 py-2 mt-2 text-sm bg-primary border rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
          type="text"
          id="login"
          placeholder="Enter your email "
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
          placeholder="Enter your password "
        />
        <p>{form.formState.errors.password?.message}</p>
      </div>
      <div className="flex items-center justify-between mb-4">
        <label className="inline-flex items-center">
          <input type="checkbox" className="form-checkbox" />
          <span className="ml-2 text-sm text-dark">Keep me signed in</span>
        </label>
        <a href="#" className="text-sm text-dark">
          Forgot your password?
        </a>
      </div>
      <button
        type="submit"
        className="w-full px-4 py-2 font-semibold text-dark bg-secondary rounded-md hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-secondary">
        Sign in
      </button>
    </form>
  );
}

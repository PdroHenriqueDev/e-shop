'use client';

import {zodResolver} from '@hookform/resolvers/zod';
import {useForm} from 'react-hook-form';
import * as z from 'zod';
import axios from 'axios';
import {RegisterFormProps} from '@/interfaces/registerForm';
import CustomButton from '../customButtton/customButton';
import CustomInput from '../customInput';
import {useNotification} from '@/contexts/notificationContext';
import {useState} from 'react';

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

export default function RegisterForm({handleIsRegister}: RegisterFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const {notify} = useNotification();

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
    setIsLoading(true);
    const {username, email, password} = data;

    try {
      await axios.post('/api/auth/register', {
        username,
        email,
        password,
      });

      notify({
        type: 'success',
        msg: 'Registration completed successfully. Please log in.',
      });

      handleIsRegister();
    } catch (error: any) {
      if (error?.response?.status === 400) {
        const {error: message} = error.response.data;

        return notify({
          type: 'error',
          msg: message,
        });
      }

      notify({
        type: 'error',
        msg: 'Register failed. Please try again',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <CustomInput
        label="Full Name"
        id="name"
        type="text"
        placeholder="Enter your full name"
        register={form.register}
        name="username"
        errorMessage={form.formState.errors.username?.message}
      />
      <CustomInput
        label="Email"
        id="email"
        type="text"
        placeholder="Enter your email"
        register={form.register}
        name="email"
        errorMessage={form.formState.errors.email?.message}
      />
      <CustomInput
        label="Password"
        id="password"
        type="password"
        placeholder="Enter your password"
        register={form.register}
        name="password"
        errorMessage={form.formState.errors.password?.message}
      />
      <CustomInput
        label="Confirm Password"
        id="confirm-password"
        type="password"
        placeholder="Confirm your password"
        register={form.register}
        name="confirmPassword"
        errorMessage={form.formState.errors.confirmPassword?.message}
      />
      <div className="flex justify-between mb-4">
        <span
          onClick={handleIsRegister}
          className="text-sm text-dark cursor-pointer">
          Already have an account? <span className="underline">Log in</span>.
        </span>
      </div>
      <CustomButton type="submit" buttonText="Register" isLoading={isLoading} />
    </form>
  );
}

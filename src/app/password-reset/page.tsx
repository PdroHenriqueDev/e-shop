'use client';
import {useRouter} from 'next/navigation';
import {zodResolver} from '@hookform/resolvers/zod';
import {useForm} from 'react-hook-form';
import z from 'zod';
import {useState} from 'react';
import CustomInput from '@/components/customInput';
import CustomButton from '@/components/customButtton/customButton';
import {useNotification} from '@/contexts/notificationContext';
import axios from 'axios';

const FormSchema = z.object({
  email: z.string().email({
    message: 'Invalid email format.',
  }),
});
type FormData = z.infer<typeof FormSchema>;

export default function PasswordResetForm() {
  const [isLoading, setIsLoading] = useState(false);
  const {notify} = useNotification();
  const router = useRouter();

  const form = useForm<FormData>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      email: '',
    },
  });

  const {
    register,
    handleSubmit,
    formState: {errors},
  } = form;

  const onSubmit = async (user: FormData) => {
    setIsLoading(true);
    const {email} = user;
    try {
      await axios.post('/api/auth/password-reset', {
        email,
      });

      notify({
        type: 'success',
        msg: 'Password has been sent to your email.',
      });
      router.push('/login');
    } catch (error) {
      notify({
        type: 'error',
        msg: 'Failed to send password. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-5">
      <div className="bg-primary p-6 rounded-lg shadow-lg w-full max-w-md">
        <div className="mb-4 text-center">
          <div>
            <h2 className="text-2xl font-semibold">
              Reset Your Password{' '}
              <span role="img" aria-label="wave">
                🔒
              </span>
            </h2>
            <p className="text-accent">
              Enter your email to receive a new password.
            </p>
          </div>
        </div>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CustomInput
            id="email"
            type="text"
            placeholder="Enter your email"
            register={register}
            name="email"
            errorMessage={errors.email?.message}
          />
          <CustomButton
            type="submit"
            buttonText="Reset Password"
            isLoading={isLoading}
          />
        </form>
      </div>
    </div>
  );
}

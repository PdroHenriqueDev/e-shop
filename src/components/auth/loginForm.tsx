import {useRouter} from 'next/navigation';
import {zodResolver} from '@hookform/resolvers/zod';
import {signIn} from 'next-auth/react';
import {useForm} from 'react-hook-form';
import z from 'zod';
import CustomInput from '../customInput';
import CustomButton from '../customButtton/customButton';
import {useNotification} from '@/contexts/notificationContext';
import {useState} from 'react';

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
  const [isLoading, setIsLoading] = useState(false);
  const {notify} = useNotification();
  const router = useRouter();

  const form = useForm<FormData>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const {
    register,
    handleSubmit,
    formState: {errors},
  } = form;

  const onSubmit = async (user: FormData) => {
    setIsLoading(true);
    const {email, password} = user;

    const result = await signIn('credentials', {
      redirect: false,
      email,
      password,
    });

    setIsLoading(false);

    if (!result?.error) return router.push('/');

    notify({
      type: 'error',
      msg: 'Login failed. Please check your credentials and try again',
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <CustomInput
        label="Email"
        id="email"
        type="text"
        placeholder="Enter your email"
        register={register}
        name="email"
        errorMessage={errors.email?.message}
      />
      <CustomInput
        label="Password"
        id="password"
        type="password"
        placeholder="Enter your password"
        register={register}
        name="password"
        errorMessage={errors.password?.message}
      />
      <div className="flex items-center justify-between mb-4">
        <a href="#" className="text-sm text-dark">
          Forgot your password?
        </a>
      </div>

      <CustomButton type="submit" buttonText="Sign in" isLoading={isLoading} />
    </form>
  );
}

import {useRouter} from 'next/navigation';
import {zodResolver} from '@hookform/resolvers/zod';
import {signIn} from 'next-auth/react';
import {useForm} from 'react-hook-form';
import z from 'zod';
import CustomInput from '../customInput';
import CustomButton from '../customButtton/customButton';
import {useNotification} from '@/contexts/notificationContext';
import {useState} from 'react';
import {GithubOutlined} from '@ant-design/icons';

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
      callbackUrl: '/',
      email,
      password,
    });

    setIsLoading(false);

    if (!result?.error) return router.push('/login');

    notify({
      type: 'error',
      msg: 'Login failed. Please check your credentials and try again',
    });
  };

  const handleGitHubSignIn = async () => {
    setIsLoading(true);

    const result = await signIn('github', {
      redirect: false,
    });

    setIsLoading(false);

    if (!result?.error) return router.push('/');

    notify({
      type: 'error',
      msg: 'GitHub login failed. Please try again.',
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
        <a href="password-reset" className="text-sm text-dark">
          Forgot your password?
        </a>
      </div>

      <CustomButton type="submit" buttonText="Sign in" isLoading={isLoading} />

      <div className="text-center">
        <p className="text-sm text-accent my-2 ">or</p>
      </div>

      <CustomButton
        type="button"
        buttonText="Sign in with GitHub"
        disabled={isLoading}
        onClick={handleGitHubSignIn}
        backgroundColor="dark"
        textColor="primary"
        spinColor="primary"
        icon={<GithubOutlined className="text-primary text-2xl" />}
      />
    </form>
  );
}

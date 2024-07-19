import {zodResolver} from '@hookform/resolvers/zod';
import {signIn} from 'next-auth/react';
import {useForm} from 'react-hook-form';
import z from 'zod';
import CustomInput from '../customInput';
import CustomButton from '../customButtton';

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

  const {
    register,
    handleSubmit,
    formState: {errors},
  } = form;

  const onSubmit = async (user: FormData) => {
    const {email, password} = user;

    await signIn('credentials', {
      email,
      password,
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
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
        <label className="inline-flex items-center">
          <input type="checkbox" className="form-checkbox" />
          <span className="ml-2 text-sm text-dark">Keep me signed in</span>
        </label>
        <a href="#" className="text-sm text-dark">
          Forgot your password?
        </a>
      </div>

      <CustomButton type="submit" buttonText="Sign in" />
    </form>
  );
}

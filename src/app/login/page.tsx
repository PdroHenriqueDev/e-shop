'use client';
import LoginForm from '@/components/auth/loginForm';
import RegisterForm from '@/components/auth/registerForm';
import {useState} from 'react';
export default function Login() {
  const [isRegister, setIsRegister] = useState(false);

  const handleRegister = () => {
    setIsRegister(!isRegister);
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-5">
      <div className="bg-primary p-6 rounded-lg shadow-lg w-full max-w-md">
        <div className="mb-4 text-center">
          {isRegister ? (
            <>
              <h2 className="text-2xl font-semibold">
                Create a new account{' '}
                <span role="img" aria-label="wave">
                  👋
                </span>
              </h2>
              <p className="text-accent">
                Fill in the form with your credentials and create a new account
                on our platform.
              </p>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-semibold">
                Log in to your account{' '}
                <span role="img" aria-label="wave">
                  👋
                </span>
              </h2>
              <p className="text-gray-500">
                Fill in the form with your credentials to log in to your
                account.
              </p>
            </>
          )}
        </div>
        <div className="flex justify-center mb-4 bg-border p-2 rounded-2xl">
          <button
            className={`w-1/2 py-2 text-sm font-semibold ${isRegister ? 'text-dark bg-transparent' : 'text-dark bg-primary'} rounded-lg`}
            onClick={handleRegister}>
            Login
          </button>
          <button
            className={`w-1/2 py-2 text-sm font-semibold ${isRegister ? 'text-dark bg-primary' : 'text-dark bg-transparent'} rounded-lg`}
            onClick={handleRegister}>
            Register
          </button>
        </div>
        {isRegister ? (
          <RegisterForm handleRegister={handleRegister} />
        ) : (
          <LoginForm />
        )}
      </div>
    </div>
  );
}

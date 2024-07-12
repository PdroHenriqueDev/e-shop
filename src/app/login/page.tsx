'use client';
import LoginForm from '@/components/auth/loginForm';
import RegisterForm from '@/components/auth/registerForm';
import {Session, getServerSession} from 'next-auth';
import {redirect} from 'next/navigation';
import {useEffect, useState} from 'react';
export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [session, setSession] = useState<Session | null>(null);

  const handleRegister = () => {
    setIsRegister(!isRegister);
  };

  useEffect(() => {
    const session = async () => {
      const session = await getServerSession();
      setSession(session);
    };

    session();
  }, []);

  if (session) {
    redirect('/');
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-5">
      <div className="bg-primary p-6 rounded-lg shadow-lg w-full max-w-md">
        <div className="mb-4 text-center">
          {isRegister ? (
            <>
              <h2 className="text-2xl font-semibold">
                Crie uma nova conta{' '}
                <span role="img" aria-label="wave">
                  👋
                </span>
              </h2>
              <p className="text-accent">
                Preencha o formulário com suas credenciais e crie uma nova conta
                na nossa plataforma.
              </p>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-semibold">
                Entre na sua conta{' '}
                <span role="img" aria-label="wave">
                  👋
                </span>
              </h2>
              <p className="text-gray-500">
                Preencha o formulário com suas credenciais para entrar na sua
                conta.
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
            Registro
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

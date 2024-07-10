'use client';
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
                Crie uma nova conta{' '}
                <span role="img" aria-label="wave">
                  👋
                </span>
              </h2>
              <p className="text-gray-500">
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
          <form>
            <div className="mb-4">
              <label className="block text-dark" htmlFor="name">
                Nome completo
              </label>
              <input
                className="w-full px-4 py-2 mt-2 text-sm bg-primary border rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                type="text"
                id="name"
                placeholder="Informe seu nome completo"
              />
            </div>
            <div className="mb-4">
              <label className="block text-dark" htmlFor="login">
                Login
              </label>
              <input
                className="w-full px-4 py-2 mt-2 text-sm bg-primary border rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                type="text"
                id="login"
                placeholder="insira seu email ou telefone"
              />
            </div>
            <div className="mb-4">
              <label className="block text-dark" htmlFor="password">
                Senha
              </label>
              <input
                className="w-full px-4 py-2 mt-2 text-sm bg-primary border rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                type="password"
                id="password"
                placeholder="Insira sua senha"
              />
            </div>
            <div className="mb-4">
              <label className="block text-dark" htmlFor="confirm-password">
                Confirme senha
              </label>
              <input
                className="w-full px-4 py-2 mt-2 text-sm bg-primary border rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                type="password"
                id="confirm-password"
                placeholder="Confirme sua senha"
              />
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
              className="w-full px-4 py-2 font-semibold text-white bg-yellow-500 rounded-md hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500">
              Entrar
            </button>
          </form>
        ) : (
          <form>
            <div className="mb-4">
              <label className="block text-dark" htmlFor="login">
                Email
              </label>
              <input
                className="w-full px-4 py-2 mt-2 text-sm bg-primary border rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                type="text"
                id="login"
                placeholder="insira seu email ou telefone"
              />
            </div>
            <div className="mb-4">
              <label className="block text-dark" htmlFor="password">
                Senha
              </label>
              <input
                className="w-full px-4 py-2 mt-2 text-sm bg-primary border rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                type="password"
                id="password"
                placeholder="Insira sua senha"
              />
            </div>
            <div className="flex items-center justify-between mb-4">
              <label className="inline-flex items-center">
                <input type="checkbox" className="form-checkbox" />
                <span className="ml-2 text-sm text-dark">Manter conectado</span>
              </label>
              <a href="#" className="text-sm text-dark">
                Esqueceu sua senha?
              </a>
            </div>
            <button
              type="submit"
              className="w-full px-4 py-2 font-semibold text-white bg-yellow-500 rounded-md hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500">
              Entrar
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

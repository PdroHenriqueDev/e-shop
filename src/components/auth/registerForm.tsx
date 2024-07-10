interface RegisterFormProps {
  handleRegister: () => void;
}

export default function RegisterForm({handleRegister}: RegisterFormProps) {
  return (
    <form>
      <div className="mb-4">
        <label className="block text-dark" htmlFor="name">
          Nome completo
        </label>
        <input
          className="w-full px-4 py-2 mt-2 text-sm bg-primary border rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
          type="text"
          id="name"
          placeholder="Informe seu nome completo"
        />
      </div>
      <div className="mb-4">
        <label className="block text-dark" htmlFor="email">
          Email
        </label>
        <input
          className="w-full px-4 py-2 mt-2 text-sm bg-primary border rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
          type="text"
          id="login"
          placeholder="insira seu email"
        />
      </div>
      <div className="mb-4">
        <label className="block text-dark" htmlFor="password">
          Senha
        </label>
        <input
          className="w-full px-4 py-2 mt-2 text-sm bg-primary border rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
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
          className="w-full px-4 py-2 mt-2 text-sm bg-primary border rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
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
        className="w-full px-4 py-2 font-semibold text-dark bg-secondary rounded-md hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-secondary">
        Entrar
      </button>
    </form>
  );
}

export default function LoginForm() {
  return (
    <form>
      <div className="mb-4">
        <label className="block text-dark" htmlFor="login">
          Email
        </label>
        <input
          className="w-full px-4 py-2 mt-2 text-sm bg-primary border rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
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
          className="w-full px-4 py-2 mt-2 text-sm bg-primary border rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
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
        className="w-full px-4 py-2 font-semibold text-dark bg-secondary rounded-md hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-secondary">
        Entrar
      </button>
    </form>
  );
}

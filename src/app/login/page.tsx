import { LoginForm } from './LoginForm'

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm rounded-lg border bg-white p-6 shadow-sm">
        <h1 className="mb-4 text-xl font-semibold">Iniciar sesión</h1>
        <LoginForm />
      </div>
    </main>
  )
}

import { LoginForm } from './LoginForm'

const FEATURES = [
  {
    title: 'Reportes con asistencia de IA',
    description: 'Genera observaciones y diagnósticos de termografía a partir de las lecturas capturadas.',
  },
  {
    title: 'Roles y accesos por contratista',
    description: 'Administradores, supervisores, inspectores y clientes ven exactamente lo que les corresponde.',
  },
  {
    title: 'Historial por faja',
    description: 'Seguimiento completo de inspecciones, criterios de aceptación e imágenes de referencia.',
  },
  {
    title: 'Exportación a PDF',
    description: 'Reportes listos para compartir con el cliente en un clic.',
  },
]

export default function LoginPage() {
  return (
    <main className="grid min-h-screen md:grid-cols-2">
      <section className="relative flex flex-col justify-between overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-slate-900 px-8 py-10 text-white sm:px-12 md:py-14">
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-orange-500/20 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-32 -left-16 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl"
          aria-hidden
        />

        <div className="relative animate-fade-in-up">
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 32 32" className="h-8 w-8 shrink-0">
              <rect width="32" height="32" rx="7" fill="#2563eb" />
              <rect x="14" y="7" width="4" height="15" rx="2" fill="#ffffff" />
              <circle cx="16" cy="23" r="5" fill="#ffffff" />
              <rect x="15" y="10" width="2" height="11" rx="1" fill="#f97316" />
              <circle cx="16" cy="23" r="3" fill="#f97316" />
            </svg>
            <span className="text-sm font-medium uppercase tracking-wider text-blue-200">
              Mantenimiento predictivo
            </span>
          </div>

          <h1 className="mt-6 text-3xl font-bold leading-tight sm:text-4xl">
            Termografía de fajas transportadoras, bajo control
          </h1>
          <p className="mt-4 max-w-md text-blue-100">
            Plataforma para registrar, analizar y reportar la condición térmica de chumaceras en
            fajas transportadoras, con historial completo por equipo y visibilidad para cada
            cliente y contratista.
          </p>
        </div>

        <ul className="relative mt-10 space-y-5">
          {FEATURES.map((feature, index) => (
            <li
              key={feature.title}
              className="flex animate-fade-in-up items-start gap-3 [animation-fill-mode:both]"
              style={{ animationDelay: `${150 + index * 100}ms` }}
            >
              <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-500/90">
                <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 fill-white">
                  <path d="M8.5 13.5 4.75 9.75l1.5-1.5L8.5 10.5l5.25-5.25 1.5 1.5z" />
                </svg>
              </span>
              <div>
                <p className="font-medium">{feature.title}</p>
                <p className="text-sm text-blue-200">{feature.description}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex items-center justify-center bg-gray-50 p-6 sm:p-10">
        <div className="w-full max-w-sm animate-fade-in-up rounded-lg border bg-white p-6 shadow-sm [animation-delay:100ms] [animation-fill-mode:both]">
          <h2 className="mb-1 text-xl font-semibold">Iniciar sesión</h2>
          <p className="mb-4 text-sm text-gray-500">Ingresa con tu cuenta para continuar.</p>
          <LoginForm />
        </div>
      </section>
    </main>
  )
}

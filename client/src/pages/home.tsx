import { Link } from "react-router-dom";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-between bg-background overflow-hidden relative">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-3xl" />
      </div>

      {/* Top bar */}
      <div className="w-full max-w-md mx-auto px-6 pt-12 flex justify-end relative z-10">
        <Link
          to="/admin/create-sala"
          className="text-xs text-slate-400 hover:text-indigo-600 transition-colors font-medium"
        >
          Área da comissão
        </Link>
      </div>

      {/* Hero - center */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center relative z-10 w-full max-w-md mx-auto">
        {/* Logo / Icon */}
        <div className="mb-8 animate-slide-in-bottom">
          <div className="relative inline-flex">
            <div className="size-24 rounded-3xl gradient-primary flex items-center justify-center shadow-2xl shadow-indigo-500/30">
              <span className="material-symbols-outlined text-white text-5xl"
                style={{ fontVariationSettings: "'FILL' 1, 'wght' 700, 'GRAD' 0, 'opsz' 48" }}>
                school
              </span>
            </div>
            <div className="absolute -top-2 -right-2 size-8 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
              <span className="material-symbols-outlined text-white text-base"
                style={{ fontVariationSettings: "'FILL' 1, 'wght' 700, 'GRAD' 0, 'opsz' 24" }}>
                check
              </span>
            </div>
          </div>
        </div>

        <div className="animate-slide-in-bottom delay-75">
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Organize<span className="text-gradient-primary">+</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-3 text-base font-medium leading-relaxed">
            A plataforma completa para sua<br />
            <strong className="text-slate-700 dark:text-slate-200">comissão de formatura</strong>
          </p>
        </div>

        {/* Feature pills */}
        <div className="mt-8 flex flex-wrap gap-2 justify-center animate-slide-in-bottom delay-150">
          {["Rifas", "Pagamentos", "Metas", "Ranking"].map((f) => (
            <span key={f} className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-xs font-semibold rounded-full">
              {f}
            </span>
          ))}
        </div>
      </div>

      {/* CTA Buttons */}
      <div className="w-full max-w-md mx-auto px-6 pb-12 space-y-3 relative z-10 animate-slide-in-bottom delay-200">
        <Link
          to="/acesso"
          className="btn-mobile-primary w-full text-base py-4 rounded-2xl shadow-lg shadow-indigo-500/25"
        >
          <span className="material-symbols-outlined text-xl"
            style={{ fontVariationSettings: "'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 24" }}>
            login
          </span>
          Entrar na minha conta
        </Link>

        <Link
          to="/cadastro"
          className="btn-mobile-secondary w-full text-base py-4 rounded-2xl"
        >
          <span className="material-symbols-outlined text-xl">person_add</span>
          Criar conta de aluno
        </Link>

        <p className="text-center text-xs text-slate-400 pt-2">
          Ao entrar você concorda com os{" "}
          <Link to="/termos" className="text-indigo-600 dark:text-indigo-400 hover:underline">
            termos de uso
          </Link>
        </p>
      </div>
    </div>
  );
}
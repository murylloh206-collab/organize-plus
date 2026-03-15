import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import ThemeToggle from "../components/ThemeToggle";
import { Link } from "react-router-dom";

export default function HomePage() {
  const { auth, isLoading } = useAuth();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);

  if (!isLoading && auth?.userId) {
    if (auth.role === "admin") navigate("/admin/dashboard", { replace: true });
    else navigate("/aluno/dashboard", { replace: true });
  }

  return (
    <div className="relative flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2 text-primary">
            <span className="material-symbols-outlined text-3xl font-bold">school</span>
            <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">Organize+</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/acesso")}
              className="hidden md:flex items-center justify-center rounded-lg bg-primary px-6 py-2.5 text-sm font-bold text-white transition-all hover:bg-primary-light"
            >
              Já tenho conta
            </button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 py-12 md:py-20">
        {/* Hero */}
        <div className="mb-16 text-center animate-fade-in">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-blue-50 dark:bg-blue-900/20 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary">
            <span className="material-symbols-outlined text-sm">auto_awesome</span>
            Plataforma Premium de Formaturas
          </div>
          <h2 className="mb-4 text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white md:text-6xl leading-tight">
            Sua formatura,{" "}
            <span className="text-primary">organizada.</span>
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-slate-600 dark:text-slate-400">
            A plataforma completa para a gestão da sua formatura. Rifas, pagamentos, eventos e muito mais — tudo em um só lugar.
          </p>
        </div>

        {/* Cards */}
        <div className="grid gap-8 md:grid-cols-2 animate-slide-up">
          {/* Card Admin */}
          <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:border-primary/40 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <div className="h-48 w-full bg-gradient-to-br from-primary/10 to-primary/5 dark:from-primary/20 dark:to-slate-900 flex items-center justify-center">
              <div className="size-20 rounded-2xl bg-blue-50 dark:bg-blue-900/20 group-hover:bg-blue-100 dark:bg-blue-800/30 transition-colors flex items-center justify-center">
                <span className="material-symbols-outlined text-5xl text-primary">groups</span>
              </div>
            </div>
            <div className="flex flex-1 flex-col p-8">
              <span className="mb-2 text-xs font-bold uppercase tracking-widest text-primary">Comissão</span>
              <h3 className="mb-3 text-2xl font-bold text-slate-900 dark:text-white">Criar Nova Turma</h3>
              <p className="mb-8 flex-1 text-slate-600 dark:text-slate-400">
                Ideal para membros de comissão que desejam iniciar a organização do evento, gerir finanças e fornecedores.
              </p>
              <button
                onClick={() => setShowModal(true)}
                className="btn-primary flex items-center justify-center gap-2 py-4"
              >
                <span>Começar Agora</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>
          </div>

          {/* Card Aluno */}
          <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:border-slate-300 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <div className="h-48 w-full bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center">
              <div className="size-20 rounded-2xl bg-slate-100 dark:bg-slate-800 group-hover:bg-slate-200 dark:group-hover:bg-slate-700 transition-colors flex items-center justify-center">
                <span className="material-symbols-outlined text-5xl text-slate-500">person</span>
              </div>
            </div>
            <div className="flex flex-1 flex-col p-8">
              <span className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-500">Aluno</span>
              <h3 className="mb-3 text-2xl font-bold text-slate-900 dark:text-white">Entrar na Minha Turma</h3>
              <p className="mb-8 flex-1 text-slate-600 dark:text-slate-400">
                Acesse sua área restrita para acompanhar pagamentos, rifas e ver as novidades da sua turma.
              </p>
              <button
                onClick={() => navigate("/acesso")}
                className="btn-outline flex w-full items-center justify-center gap-2 py-4"
              >
                <span>Acessar Portal</span>
                <span className="material-symbols-outlined text-sm">login</span>
              </button>
            </div>
          </div>
        </div>

        {/* Features strip */}
        <div className="mt-16 grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { icon: "payments", text: "Gestão de Pagamentos" },
            { icon: "confirmation_number", text: "Rifas Online" },
            { icon: "event", text: "Agenda de Eventos" },
            { icon: "account_balance", text: "Caixa Transparente" },
          ].map((f) => (
            <div key={f.icon} className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
              <span className="material-symbols-outlined text-2xl text-primary">{f.icon}</span>
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">{f.text}</span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <footer className="mt-20 border-t border-slate-200 pt-8 dark:border-slate-800">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-sm text-slate-500 dark:text-slate-400">© 2026 Organize+. Todos os direitos reservados.</p>
            <div className="flex gap-6">
            <div className="flex gap-6">
  <Link to="/termos" className="text-sm text-slate-500 hover:text-[#c6a43f] dark:text-slate-400 transition-colors">
    Termos de Uso
  </Link>
  <Link to="/privacidade" className="text-sm text-slate-500 hover:text-[#c6a43f] dark:text-slate-400 transition-colors">
    Privacidade
  </Link>
  <Link to="/suporte" className="text-sm text-slate-500 hover:text-[#c6a43f] dark:text-slate-400 transition-colors">
  Suporte
</Link>
  <Link to="/criador" className="text-sm text-slate-500 hover:text-[#c6a43f] dark:text-slate-400 transition-colors">
    Criador
  </Link>
</div>
            </div>
          </div>
        </footer>
      </main>

      {/* Modal de Compra - AGORA DENTRO DA HOME */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-[400px] bg-white dark:bg-slate-900 rounded-xl shadow-2xl overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800">
            {/* Header */}
            <header className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="text-[#c6a43f]">
                  <span className="material-symbols-outlined font-bold">bolt</span>
                </div>
                <h2 className="text-[#1e3a5f] dark:text-slate-100 text-sm font-bold tracking-wider uppercase">
                  Acesso Vitalício
                </h2>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-400"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </header>

            {/* Body Content */}
            <div className="p-6 flex flex-col">
              {/* Branding/Logo */}
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 bg-[#c6a43f] rounded-lg flex items-center justify-center text-[#1e3a5f]">
                  <span className="material-symbols-outlined text-lg">grid_view</span>
                </div>
                <span className="font-bold text-[#1e3a5f] dark:text-slate-100">Organize+ Pro</span>
              </div>

              {/* Pricing Section */}
              <div className="mb-8">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-[#1e3a5f] dark:text-slate-100 tracking-tight">R$ 500</span>
                  <span className="text-slate-500 dark:text-slate-400 font-medium">/ único</span>
                </div>
                <p className="text-[#c6a43f] font-medium text-sm mt-1">Menos de R$ 20 por aluno</p>
              </div>

              {/* Benefits List */}
              <div className="space-y-5 mb-8">
                {[
                  "Gestão completa de turmas",
                  "Rifas e sorteios ilimitados",
                  "Transparência total para os Alunos",
                  "Suporte prioritário 24/7",
                  "Recursos essenciais para organização da Comissão"
                ].map((benefit) => (
                  <div key={benefit} className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-[#c6a43f]/10 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[#c6a43f] text-sm font-bold">check</span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 text-sm">{benefit}</p>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => {
                    const numero = "19997639130";
                    const mensagem = "Quero comprar o Organize+ Pro";
                    window.open(`https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`, "_blank");
                  }}
                  className="w-full bg-[#c6a43f] hover:bg-[#b89430] text-[#1e3a5f] font-bold py-3.5 rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#c6a43f]/20"
                >
                  <span className="material-symbols-outlined text-xl">shopping_cart</span>
                  <span>Comprar agora</span>
                </button>
                <button 
                  onClick={() => {
                    const numero = "19997639130";
                    const mensagem = "Quero saber mais sobre o Organize+ Pro";
                    window.open(`https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`, "_blank");
                  }}
                  className="w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[#1e3a5f] dark:text-slate-100 font-bold py-3.5 rounded-lg flex items-center justify-center gap-2 transition-all"
                >
                  <span className="material-symbols-outlined text-xl">chat</span>
                  <span>Saber mais</span>
                </button>
              </div>
            </div>

            {/* Footer */}
            <footer className="bg-slate-50 dark:bg-slate-800/50 p-4 border-t border-slate-100 dark:border-slate-800 flex justify-center">
              <a
                onClick={() => {
                  setShowModal(false);
                  navigate("/acesso");
                }}
                className="text-[#c6a43f] hover:text-[#b89430] text-sm font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">vpn_key</span>
                Já tenho chave de acesso
              </a>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
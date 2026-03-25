import { useState } from "react";
import { Link } from "react-router-dom";
import ModalCompra from "../components/ModalCompra";

export default function HomePage() {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div className="min-h-screen flex flex-col items-center justify-between bg-gradient-to-b from-[#1e3a5f] to-[#0f2a44] overflow-hidden relative">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-[#c6a43f]/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-[#c6a43f]/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#c6a43f]/5 rounded-full blur-3xl" />
        </div>

        {/* Hero - center */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center relative z-10 w-full max-w-md mx-auto">
          {/* Logo / Icon */}
          <div className="mb-8 animate-slide-in-bottom">
            <div className="relative inline-flex">
              <div className="size-28 rounded-3xl bg-gradient-to-br from-[#c6a43f] to-[#d4b254] flex items-center justify-center shadow-2xl shadow-[#c6a43f]/30">
                <span className="material-symbols-outlined text-white text-6xl"
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
            <h1 className="text-4xl font-black text-white tracking-tight">
              Organize<span className="text-[#c6a43f]">+</span>
            </h1>
            <p className="text-white/80 mt-3 text-base font-medium leading-relaxed">
              A plataforma completa para sua<br />
              <strong className="text-[#c6a43f]">comissão de formatura</strong>
            </p>
          </div>

          {/* Feature pills */}
          <div className="mt-8 flex flex-wrap gap-2 justify-center animate-slide-in-bottom delay-150">
            {["Rifas", "Pagamentos", "Metas", "Ranking", "Eventos"].map((f) => (
              <span key={f} className="px-3 py-1.5 bg-white/10 backdrop-blur-sm text-[#c6a43f] text-xs font-semibold rounded-full border border-[#c6a43f]/30">
                {f}
              </span>
            ))}
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="w-full max-w-md mx-auto px-6 pb-12 space-y-3 relative z-10 animate-slide-in-bottom delay-200">
          <button
            onClick={() => setShowModal(true)}
            className="w-full bg-gradient-to-r from-[#c6a43f] to-[#d4b254] hover:from-[#b89430] hover:to-[#c6a43f] text-[#1e3a5f] font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#c6a43f]/25"
          >
            <span className="material-symbols-outlined text-xl"
              style={{ fontVariationSettings: "'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 24" }}>
              bolt
            </span>
            Adquirir Organize+ Pro
          </button>

          <Link
            to="/acesso"
            className="w-full bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all border border-white/20"
          >
            <span className="material-symbols-outlined text-xl">login</span>
            Entrar / Criar conta
          </Link>

          {/* Footer Links */}
          <div className="flex flex-wrap justify-center gap-4 pt-6 text-xs">
            <Link to="/termos" className="text-white/60 hover:text-[#c6a43f] transition-colors">
              Termos de Uso
            </Link>
            <span className="text-white/30">•</span>
            <Link to="/privacidade" className="text-white/60 hover:text-[#c6a43f] transition-colors">
              Privacidade
            </Link>
            <span className="text-white/30">•</span>
            <Link to="/suporte" className="text-white/60 hover:text-[#c6a43f] transition-colors">
              Suporte
            </Link>
            <span className="text-white/30">•</span>
            <Link to="/criador" className="text-white/60 hover:text-[#c6a43f] transition-colors">
              Criador
            </Link>
          </div>
        </div>
      </div>

      {/* Modal de Compra */}
      {showModal && <ModalCompra onClose={() => setShowModal(false)} />}
    </>
  );
}
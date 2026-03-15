import { useNavigate } from "react-router-dom";

interface ModalCompraProps {
  onClose: () => void;
}

export default function ModalCompra({ onClose }: ModalCompraProps) {
  const navigate = useNavigate();

  const handleWhatsApp = (tipo: "compra" | "duvida") => {
    const numero = "19997639130";
    const mensagem = tipo === "compra" 
      ? "Quero comprar o Organize+ Pro"
      : "Quero saber mais sobre o Organize+ Pro";
    window.open(`https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`, "_blank");
  };

  return (
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
            onClick={onClose}
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
          <div className="space-y-4 mb-8">
            {[
              "Gestão completa de turmas",
              "Rifas e sorteios ilimitados",
              "Transparência total para pais",
              "Suporte prioritário 24/7"
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
              onClick={() => handleWhatsApp("compra")}
              className="w-full bg-[#c6a43f] hover:bg-[#b89430] text-[#1e3a5f] font-bold py-3.5 rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#c6a43f]/20"
            >
              <span className="material-symbols-outlined text-xl">shopping_cart</span>
              <span>Comprar agora</span>
            </button>
            <button 
              onClick={() => handleWhatsApp("duvida")}
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
              onClose();
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
  );
}
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Shield, Lock, Eye, Database, Mail } from "lucide-react";

export default function PrivacidadePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-[#c6a43f] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para Home
          </button>
          <h1 className="text-lg font-bold text-[#1e3a5f] dark:text-white">Política de Privacidade</h1>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8 md:p-12 border border-slate-200 dark:border-slate-800">
          
          {/* Introdução */}
          <div className="flex items-center gap-4 mb-8 pb-8 border-b border-slate-200 dark:border-slate-800">
            <div className="p-4 bg-[#c6a43f]/10 rounded-2xl">
              <Shield className="w-8 h-8 text-[#c6a43f]" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#1e3a5f] dark:text-white mb-2">
                Sua privacidade é importante
              </h2>
              <p className="text-slate-600 dark:text-slate-400">
                Última atualização: 15 de março de 2026
              </p>
            </div>
          </div>

          <div className="space-y-8">
            {/* 1. Coleta de Dados */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Database className="w-5 h-5 text-[#c6a43f]" />
                <h3 className="text-lg font-bold text-[#1e3a5f] dark:text-white">1. Coleta de Dados</h3>
              </div>
              <p className="text-slate-600 dark:text-slate-400 pl-8">
                Coletamos apenas as informações necessárias para o funcionamento da plataforma:
              </p>
              <ul className="list-disc pl-12 text-slate-600 dark:text-slate-400 space-y-2">
                <li>Nome, e-mail e telefone para identificação e contato</li>
                <li>Dados de pagamento processados de forma segura</li>
                <li>Informações da turma para gestão da formatura</li>
                <li>Registros de acesso para segurança da plataforma</li>
              </ul>
            </div>

            {/* 2. Uso das Informações */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Eye className="w-5 h-5 text-[#c6a43f]" />
                <h3 className="text-lg font-bold text-[#1e3a5f] dark:text-white">2. Uso das Informações</h3>
              </div>
              <p className="text-slate-600 dark:text-slate-400 pl-8">
                Utilizamos seus dados para:
              </p>
              <ul className="list-disc pl-12 text-slate-600 dark:text-slate-400 space-y-2">
                <li>Fornecer e manter os serviços da plataforma</li>
                <li>Processar pagamentos e controlar acessos</li>
                <li>Comunicar atualizações e informações importantes</li>
                <li>Melhorar a experiência do usuário</li>
                <li>Garantir a segurança da plataforma</li>
              </ul>
            </div>

            {/* 3. Compartilhamento */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-[#c6a43f]" />
                <h3 className="text-lg font-bold text-[#1e3a5f] dark:text-white">3. Compartilhamento de Dados</h3>
              </div>
              <p className="text-slate-600 dark:text-slate-400 pl-8">
                Não compartilhamos seus dados pessoais com terceiros, exceto:
              </p>
              <ul className="list-disc pl-12 text-slate-600 dark:text-slate-400 space-y-2">
                <li>Quando necessário para processamento de pagamentos</li>
                <li>Para cumprir obrigações legais</li>
                <li>Com seu consentimento explícito</li>
              </ul>
            </div>

            {/* 4. Segurança */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-[#c6a43f]" />
                <h3 className="text-lg font-bold text-[#1e3a5f] dark:text-white">4. Segurança dos Dados</h3>
              </div>
              <p className="text-slate-600 dark:text-slate-400 pl-8">
                Adotamos medidas de segurança rigorosas:
              </p>
              <ul className="list-disc pl-12 text-slate-600 dark:text-slate-400 space-y-2">
                <li>Criptografia de ponta a ponta</li>
                <li>Armazenamento seguro em servidores certificados</li>
                <li>Controle de acesso rigoroso</li>
                <li>Monitoramento contínuo contra ameaças</li>
              </ul>
            </div>

            {/* 5. Seus Direitos */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-[#c6a43f]" />
                <h3 className="text-lg font-bold text-[#1e3a5f] dark:text-white">5. Seus Direitos</h3>
              </div>
              <p className="text-slate-600 dark:text-slate-400 pl-8">
                Você tem direito a:
              </p>
              <ul className="list-disc pl-12 text-slate-600 dark:text-slate-400 space-y-2">
                <li>Acessar seus dados pessoais</li>
                <li>Corrigir informações incorretas</li>
                <li>Solicitar a exclusão de seus dados</li>
                <li>Revogar consentimento a qualquer momento</li>
                <li>Exportar seus dados</li>
              </ul>
            </div>

            {/* 6. Contato */}
<div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 mt-8">
  <h3 className="font-bold text-[#1e3a5f] dark:text-white mb-2">📧 Dúvidas?</h3>
  <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
    Se tiver qualquer dúvida sobre esta política, entre em contato:
  </p>  
  {/* Link do WhatsApp adicionado */}
  <a 
    href="https://wa.me/5519997639130?text=Tenho%20uma%20d%C3%BAvida%20sobre%20a%20pol%C3%ADtica%20de%20privacidade"
    target="_blank"
    rel="noopener noreferrer"
    className="text-[#c6a43f] hover:underline font-medium flex items-center gap-2"
  >
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.91C21.95 6.45 17.5 2 12.04 2Z"/>
    </svg>
    (19) 99763-9130 (Suporte Organize+)
  </a>
</div>
  </div>
     </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <p className="text-sm text-center text-slate-500 dark:text-slate-400">
            © 2026 Organize+. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
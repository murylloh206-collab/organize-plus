import { useNavigate } from "react-router-dom"; // <-- MUDOU AQUI
import { ArrowLeft } from "lucide-react";

export default function TermosPage() {
  const navigate = useNavigate(); // <-- MUDOU AQUI

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      {/* Header simples */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate("/")} // <-- MUDOU AQUI
            className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-[#c6a43f] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para Home
          </button>
          <h1 className="text-lg font-bold text-[#1e3a5f] dark:text-white">Termos de Uso</h1>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8 md:p-12 border border-slate-200 dark:border-slate-800">
          
          <div className="prose prose-slate dark:prose-invert max-w-none">
            <h2 className="text-2xl font-bold text-[#1e3a5f] dark:text-white mb-6">
              1. Aceitação dos Termos
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-8">
              Ao acessar e utilizar a plataforma Organize+, você concorda em cumprir e estar vinculado aos presentes Termos de Uso. Se você não concordar com qualquer parte destes termos, não poderá utilizar nossos serviços.
            </p>

            <h2 className="text-2xl font-bold text-[#1e3a5f] dark:text-white mb-6">
              2. Descrição do Serviço
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              O Organize+ é uma plataforma de gestão de formaturas que oferece as seguintes funcionalidades:
            </p>
            <ul className="list-disc pl-6 mb-8 text-slate-600 dark:text-slate-400 space-y-2">
              <li>Painel administrativo para comissões de formatura</li>
              <li>Gestão de pagamentos e controle de inadimplência</li>
              <li>Sistema de rifas com sorteio animado</li>
              <li>Criação e acompanhamento de metas da turma</li>
              <li>Caixa transparente para alunos</li>
              <li>Comunicação entre comissão e alunos</li>
            </ul>

            <h2 className="text-2xl font-bold text-[#1e3a5f] dark:text-white mb-6">
              3. Planos e Pagamentos
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              A plataforma oferece planos de acesso que podem ser adquiridos mediante pagamento único (vitalício) ou através de chaves de acesso fornecidas pela organização. Os valores são:
            </p>
            <ul className="list-disc pl-6 mb-8 text-slate-600 dark:text-slate-400 space-y-2">
              <li>Plano Pro: R$ 500,00 (pagamento único, vitalício)</li>
              <li>Chaves de acesso promocionais podem ser distribuídas pela organização</li>
            </ul>

            <h2 className="text-2xl font-bold text-[#1e3a5f] dark:text-white mb-6">
              4. Responsabilidades do Usuário
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Ao utilizar o Organize+, você concorda que:
            </p>
            <ul className="list-disc pl-6 mb-8 text-slate-600 dark:text-slate-400 space-y-2">
              <li>Fornecerá informações verdadeiras e atualizadas</li>
              <li>Responsabilizar-se-á pela segurança de sua senha</li>
              <li>Não utilizará a plataforma para atividades ilícitas</li>
              <li>Respeitará os direitos de propriedade intelectual</li>
              <li>Não tentará burlar o sistema de pagamentos</li>
            </ul>

            <h2 className="text-2xl font-bold text-[#1e3a5f] dark:text-white mb-6">
              5. Propriedade Intelectual
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-8">
              Todo o conteúdo da plataforma, incluindo logotipos, textos, gráficos, códigos e funcionalidades, é de propriedade exclusiva do Organize+ e protegido por leis de direitos autorais.
            </p>

            <h2 className="text-2xl font-bold text-[#1e3a5f] dark:text-white mb-6">
              6. Limitação de Responsabilidade
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-8">
              O Organize+ não se responsabiliza por eventuais danos diretos ou indiretos decorrentes do uso ou da impossibilidade de uso da plataforma, incluindo perda de dados ou lucros cessantes.
            </p>

            <h2 className="text-2xl font-bold text-[#1e3a5f] dark:text-white mb-6">
              7. Modificações nos Termos
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-8">
              Reservamo-nos o direito de modificar estes termos a qualquer momento. As alterações entrarão em vigor imediatamente após sua publicação na plataforma.
            </p>

            <h2 className="text-2xl font-bold text-[#1e3a5f] dark:text-white mb-6">
              8. Lei Aplicável
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-8">
              Estes termos serão regidos e interpretados de acordo com as leis da República Federativa do Brasil.
            </p>

            <div className="border-t border-slate-200 dark:border-slate-800 pt-8 mt-8">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Última atualização: 14 de março de 2026
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer simples */}
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
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, HelpCircle, MessageCircle, Mail, ChevronDown, ChevronUp, Phone, Clock, Users, CreditCard, Gift, Shield } from "lucide-react";

// Componente de item FAQ
function FaqItem({ pergunta, resposta }: { pergunta: string; resposta: string }) {
  const [aberto, setAberto] = useState(false);

  return (
    <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 hover:shadow-md transition-shadow">
      <button
        onClick={() => setAberto(!aberto)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
      >
        <span className="font-medium text-[#1e3a5f] dark:text-white pr-8">{pergunta}</span>
        {aberto ? (
          <ChevronUp className="w-5 h-5 text-[#c6a43f] flex-shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-[#c6a43f] flex-shrink-0" />
        )}
      </button>
      {aberto && (
        <div className="p-5 pt-0 border-t border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
          {resposta}
        </div>
      )}
    </div>
  );
}

export default function SuportePage() {
  const navigate = useNavigate();
  const [categoria, setCategoria] = useState("todos");

  const faqs = [
    {
      categoria: "geral",
      pergunta: "O que é o Organize+?",
      resposta: "O Organize+ é uma plataforma completa para gestão de formaturas. Ela ajuda comissões a organizar pagamentos, controlar rifas, acompanhar metas e manter transparência com os alunos. Tudo em um só lugar, de forma simples e eficiente."
    },
    {
      categoria: "geral",
      pergunta: "Quem pode usar a plataforma?",
      resposta: "A plataforma é feita para comissões de formatura e seus alunos. Os membros da comissão têm acesso a todas as funcionalidades de gestão, enquanto os alunos podem acompanhar seus pagamentos, vender rifas e ver o progresso da turma."
    },
    {
      categoria: "pagamentos",
      pergunta: "Como funciona o sistema de pagamentos?",
      resposta: "A comissão pode registrar os pagamentos dos alunos manualmente. O sistema calcula automaticamente o total pago por cada aluno, mostra inadimplentes e gera relatórios financeiros. Os alunos podem ver seu histórico de pagamentos e quanto ainda falta pagar."
    },
    {
      categoria: "pagamentos",
      pergunta: "Quais formas de pagamento são aceitas?",
      resposta: "O Organize+ não processa pagamentos diretamente. Ele apenas registra os pagamentos que a comissão recebe (PIX, dinheiro, transferência). A plataforma foi feita para organização, não para receber dinheiro. As transações financeiras devem ser feitas pela comissão."
    },
    {
      categoria: "rifas",
      pergunta: "Como funciona o sistema de rifas?",
      resposta: "A comissão cria rifas com números de 1 a 200 (ou outro limite). Cada rifa pode ser vendida para um comprador, registrando nome e telefone. O sistema mostra os números disponíveis e vendidos em uma cartela visual. Quando chegar a data do sorteio, o admin pode sortear um número aleatório e o sistema mostra o vencedor com animação."
    },
    {
      categoria: "rifas",
      pergunta: "Posso editar ou excluir uma rifa já vendida?",
      resposta: "Sim! Caso tenha errado o nome do comprador ou telefone, é possível editar a rifa a qualquer momento. Rifas não sorteadas também podem ser excluídas pela comissão."
    },
    {
      categoria: "acesso",
      pergunta: "Como consigo uma chave de acesso?",
      resposta: "As chaves de acesso são adquiridas com a compra do plano Organize+ Pro pelo WhatsApp (19) 99763-9130. O pagamento é único e vitalício. Em alguns casos, a organização pode distribuir chaves promocionais."
    },
    {
      categoria: "acesso",
      pergunta: "Perdi minha chave de acesso, o que fazer?",
      resposta: "Entre em contato pelo WhatsApp (19) 99763-9130 informando seu e-mail cadastrado. Podemos recuperar ou gerar uma nova chave para você."
    },
    {
      categoria: "turma",
      pergunta: "Como meus alunos acessam a plataforma?",
      resposta: "Na página inicial, os alunos clicam em 'Acessar Portal' e depois em 'Cadastrar'. Eles precisam do código da turma (gerado na criação) e da senha da turma (definida pela comissão). Após o cadastro, têm acesso à área do aluno."
    },
    {
      categoria: "turma",
      pergunta: "Posso mudar a senha da minha turma?",
      resposta: "Sim! Acesse as configurações da turma no painel admin. Lá você pode alterar a senha a qualquer momento. Recomendamos trocar a senha periodicamente por segurança."
    },
    {
      categoria: "caixa",
      pergunta: "O que é o Caixa Transparente?",
      resposta: "É uma funcionalidade que mostra o saldo atual da turma, entradas e saídas. Alunos podem ver o extrato completo, garantindo transparência total sobre o dinheiro arrecadado. A comissão é responsável por registrar as movimentações."
    },
    {
      categoria: "tecnicas",
      pergunta: "Preciso instalar algum software?",
      resposta: "Não! O Organize+ funciona 100% online pelo navegador. Basta acessar o site e fazer login. Funciona em computadores, tablets e celulares."
    },
    {
      categoria: "tecnicas",
      pergunta: "Meus dados estão seguros?",
      resposta: "Sim! Utilizamos criptografia de ponta a ponta, servidores seguros e seguimos as melhores práticas de segurança. Seus dados nunca são compartilhados com terceiros. Leia nossa Política de Privacidade para mais detalhes."
    }
  ];

  const faqsFiltradas = categoria === "todos" 
    ? faqs 
    : faqs.filter(faq => faq.categoria === categoria);

  const categorias = [
    { id: "todos", nome: "Todas", icone: HelpCircle },
    { id: "geral", nome: "Geral", icone: Users },
    { id: "acesso", nome: "Acesso", icone: Shield },
    { id: "pagamentos", nome: "Pagamentos", icone: CreditCard },
    { id: "rifas", nome: "Rifas", icone: Gift },
    { id: "turma", nome: "Turma", icone: Users },
    { id: "caixa", nome: "Caixa", icone: Mail },
    { id: "tecnicas", nome: "Técnico", icone: Phone }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-[#c6a43f] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para Home
          </button>
          <h1 className="text-lg font-bold text-[#1e3a5f] dark:text-white">Central de Ajuda</h1>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="max-w-5xl mx-auto px-6 py-12">
        {/* Hero do Suporte */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-[#c6a43f]/10 px-4 py-2 rounded-full mb-4">
            <MessageCircle className="w-4 h-4 text-[#c6a43f]" />
            <span className="text-sm font-medium text-[#c6a43f]">Suporte & Ajuda</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-[#1e3a5f] dark:text-white mb-4">
            Como podemos ajudar?
          </h2>
          <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Encontre respostas para as perguntas mais frequentes. Se precisar de mais ajuda, nosso time está disponível no WhatsApp.
          </p>
        </div>

        {/* Botões de Categoria */}
        <div className="flex flex-wrap gap-2 mb-8 justify-center">
          {categorias.map((cat) => {
            const Icone = cat.icone;
            return (
              <button
                key={cat.id}
                onClick={() => setCategoria(cat.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  categoria === cat.id
                    ? "bg-[#c6a43f] text-[#1e3a5f] shadow-md"
                    : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-[#c6a43f] hover:text-[#c6a43f]"
                }`}
              >
                <Icone className="w-4 h-4" />
                {cat.nome}
              </button>
            );
          })}
        </div>

        {/* Lista de FAQs */}
        <div className="space-y-3 mb-12">
          {faqsFiltradas.length > 0 ? (
            faqsFiltradas.map((faq, index) => (
              <FaqItem key={index} pergunta={faq.pergunta} resposta={faq.resposta} />
            ))
          ) : (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400">
              Nenhuma pergunta encontrada para esta categoria.
            </div>
          )}
        </div>

        {/* Contato Direto */}
        <div className="bg-[#c6a43f]/5 rounded-2xl p-8 border border-[#c6a43f]/20 text-center">
          <h3 className="text-xl font-bold text-[#1e3a5f] dark:text-white mb-2">
            Ainda precisa de ajuda?
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-lg mx-auto">
            Nossa equipe está disponível para responder suas dúvidas pessoalmente.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://wa.me/5519997639130?text=Olá!%20Preciso%20de%20ajuda%20com%20o%20Organize+"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-medium px-6 py-3 rounded-xl transition-colors shadow-lg shadow-green-500/25"
            >
              <MessageCircle className="w-5 h-5" />
              Falar no WhatsApp
            </a>
            <a
              href="mailto:suporte@organizeplus.com"
              className="inline-flex items-center justify-center gap-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium px-6 py-3 rounded-xl transition-colors"
            >
              <Mail className="w-5 h-5" />
              Enviar E-mail
            </a>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 mt-12">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <p className="text-sm text-center text-slate-500 dark:text-slate-400">
            © 2026 Organize+. Suporte disponível de segunda a sexta, 9h às 18h.
          </p>
        </div>
      </footer>
    </div>
  );
}
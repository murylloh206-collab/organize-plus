import { useNavigate } from "react-router-dom";
import { ArrowLeft, Github, Linkedin, Mail, Heart, Code2, GraduationCap, Users } from "lucide-react";

export default function CriadorPage() {
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
          <h1 className="text-lg font-bold text-[#1e3a5f] dark:text-white">Sobre o Criador</h1>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="max-w-4xl mx-auto px-6 py-16">
        {/* Card do Criador */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-800">
          
          {/* Banner dourado */}
          <div className="h-32 bg-gradient-to-r from-[#c6a43f] to-[#b89430] relative">
            <div className="absolute -bottom-16 left-8">
              {/* FOTO - SUBSTITUA pelo caminho da sua imagem */}
              <img 
                src="/foto-perfil.jpeg" 
                alt="Muryllo Hernique"
                className="w-32 h-32 rounded-2xl border-4 border-white dark:border-slate-900 bg-[#1e3a5f] object-cover shadow-xl"
              />
            </div>
          </div>

          {/* Conteúdo */}
          <div className="pt-20 p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
              <div>
                <h2 className="text-3xl font-bold text-[#1e3a5f] dark:text-white mb-2">
                  Muryllo Hernique
                </h2>
                <p className="text-[#c6a43f] font-medium flex items-center gap-2">
                  <Code2 className="w-4 h-4" />
                  Desenvolvedor & Criador do Organize+
                </p>
              </div>
              
              {/* Redes sociais com links CORRETOS */}
              <div className="flex gap-3">
                <a href="https://github.com/murylloh206-collab" target="_blank" rel="noopener noreferrer" className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-[#c6a43f]/10 transition-colors">
                  <Github className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                </a>
                <a href="https://www.linkedin.com/in/muryllohc" target="_blank" rel="noopener noreferrer" className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-[#c6a43f]/10 transition-colors">
                  <Linkedin className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                </a>
                <a href="mailto:murylloh206@gmail.com" className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-[#c6a43f]/10 transition-colors">
                  <Mail className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                </a>
              </div>
            </div>

            {/* Sobre mim - TEXTO ATUALIZADO */}
            <div className="space-y-8">
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
                <h3 className="text-xl font-bold text-[#1e3a5f] dark:text-white mb-4 flex items-center gap-2">
                  <Heart className="w-5 h-5 text-[#c6a43f]" />
                  Por que criei o Organize+?
                </h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  Estou no <span className="font-semibold text-[#c6a43f]">3°C</span> e, mesmo não sendo da comissão da minha turma, vi de perto as dificuldades que eles enfrentam. 
                  Organizar uma formatura é muito mais complicado do que parece: gerenciar pagamentos, controlar rifas e manter a transparência com a turma é um trabalho enorme. 
                  No terceiro ano, que já é corrido por causa do vestibular, ENEM e outras responsabilidades, a comissão acaba sobrecarregada. 
                  Foi pensando nisso que desenvolvi o <span className="font-semibold text-[#c6a43f]">Organize+</span> — para automatizar essa gestão, dar mais tempo de estudo para os alunos e menos dor de cabeça para quem está organizando. Quero que todos possam aproveitar essa fase incrível sem o estresse da burocracia.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
                  <GraduationCap className="w-8 h-8 text-[#c6a43f] mb-3" />
                  <h4 className="font-bold text-[#1e3a5f] dark:text-white mb-2">Meu Objetivo</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Quero cursar <span className="font-semibold">Engenharia de Software</span> e continuar 
                    desenvolvendo soluções que realmente façam a diferença na vida das pessoas. Acredito 
                    que a tecnologia pode transformar processos complexos em experiências simples e agradáveis.
                  </p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
                  <Code2 className="w-8 h-8 text-[#c6a43f] mb-3" />
                  <h4 className="font-bold text-[#1e3a5f] dark:text-white mb-2">O que me move</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Amo mexer com código e resolver problemas. Cada linha de código é uma oportunidade 
                    de criar algo novo e útil. O Organize+ é mais que um projeto — é a prova de que 
                    com dedicação podemos construir ferramentas que ajudam outras pessoas.
                  </p>
                </div>
              </div>

              <div className="bg-[#c6a43f]/5 rounded-2xl p-6 border border-[#c6a43f]/20">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-[#c6a43f]/10 rounded-xl">
                    <Users className="w-6 h-6 text-[#c6a43f]" />
                  </div>
                  <div>
                    <h4 className="font-bold text-[#1e3a5f] dark:text-white mb-1">Minha Missão</h4>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">
                      Facilitar a vida das comissões de formatura, trazendo transparência, organização e 
                      eficiência. Quero que mais pessoas possam viver essa experiência sem o estresse 
                      financeiro e burocrático que muitos enfrentam.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <p className="text-sm text-center text-slate-500 dark:text-slate-400">
            © 2026 Organize+. Criado por Muryllo Hernique.
          </p>
        </div>
      </footer>
    </div>
  );
}
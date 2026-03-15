import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import ThemeToggle from "../components/ThemeToggle";

type Modo = "entrar" | "cadastrar";
type Tipo = "aluno" | "comissao";

export default function AcessoPage() {
  const navigate = useNavigate();
  const { login, register, registerAluno, registerComissao, validateChave } = useAuth();
  
  
  const [modo, setModo] = useState<Modo>("entrar");
  const [tipo, setTipo] = useState<Tipo>("aluno");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Campos comuns
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  
  // Campos de cadastro
  const [nome, setNome] = useState("");
  const [celular, setCelular] = useState("");
  
  // Campos específicos do aluno
  const [turmaId, setTurmaId] = useState("");
  const [senhaTurma, setSenhaTurma] = useState("");
  
  // Dados das turmas (viriam da API)
  const [turmas, setTurmas] = useState<Array<{ id: number; nome: string }>>([]);
const [carregandoTurmas, setCarregandoTurmas] = useState(false);

// Carregar turmas do banco
useEffect(() => {
  async function carregarTurmas() {
    setCarregandoTurmas(true);
    try {
      const response = await fetch("/api/salas");
      const data = await response.json();
      setTurmas(data);
    } catch (error) {
      console.error("Erro ao carregar turmas:", error);
    } finally {
      setCarregandoTurmas(false);
    }
  }
  
  if (modo === "cadastrar" && tipo === "aluno") {
    carregarTurmas();
  }
}, [modo, tipo]);

  // Medidor de força da senha
  const calcularForca = (s: string) => {
    let score = 0;
    if (s.length >= 8) score++;
    if (/[A-Z]/.test(s)) score++;
    if (/[a-z]/.test(s)) score++;
    if (/[0-9]/.test(s)) score++;
    if (/[^A-Za-z0-9]/.test(s)) score++;
    return score;
  };
  const forca = calcularForca(senha);
  
  const getCorForca = () => {
    if (forca <= 2) return "bg-red-500";
    if (forca <= 3) return "bg-yellow-500";
    return "bg-green-500";
  };
  
  const getTextoForca = () => {
    if (forca <= 2) return "Fraca";
    if (forca <= 3) return "Média";
    return "Forte";
  };

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError("");
  setLoading(true);
  
  try {
    if (modo === "entrar") {
      // LOGIN
      const result = await login.mutateAsync({ email, senha });
      navigate(result.user.role === "admin" ? "/admin/dashboard" : "/aluno/dashboard");
    } else {
      // CADASTRO
      if (tipo === "aluno") {
        // Cadastro de aluno
        await registerAluno.mutateAsync({
          nome,
          email,
          senha,
          celular,
          turmaId,
          senhaTurma
        });
        navigate("/aluno/dashboard");
      } else {
        // Cadastro de comissão - usa endpoint dedicado sem exigir chave
        await registerComissao.mutateAsync({
          nome,
          email,
          senha,
          celular
        });
        navigate("/admin/create-sala");
      }
    }
  } catch (err: any) {
    console.error("Erro:", err);
    setError(err.message || "Erro ao processar");
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen flex flex-col md:flex-row overflow-hidden">
      {/* Left Panel - Institutional */}
      <div className="hidden md:flex md:w-5/12 lg:w-1/2 bg-primary text-white p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 bg-pattern opacity-100 pointer-events-none"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-white">layers</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Organize+</h1>
          </div>
          
          <h2 className="text-4xl lg:text-5xl font-extrabold leading-tight mb-6">
            Sua formatura organizada em um só lugar
          </h2>
          <p className="text-slate-300 text-lg mb-10">
            A plataforma definitiva para gerenciar arrecadações, fornecedores e transparência da sua comissão de formatura.
          </p>
        </div>

        {/* Features */}
        <div className="relative z-10 space-y-8">
          {[
            { icon: "payments", title: "Controle Financeiro", desc: "Acompanhe pagamentos e inadimplência em tempo real." },
            { icon: "verified_user", title: "Transparência Total", desc: "Relatórios automatizados para todos os alunos da turma." },
            { icon: "event_available", title: "Gestão de Eventos", desc: "Cronograma completo do baile aos churrascos da turma." }
          ].map((feature, idx) => (
            <div key={idx} className="flex items-start gap-4">
              <span className="material-symbols-outlined text-secondary bg-white/10 p-2 rounded-lg">
                {feature.icon}
              </span>
              <div>
                <h3 className="font-semibold text-lg text-white">{feature.title}</h3>
                <p className="text-slate-400 text-sm">{feature.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="relative z-10 text-slate-400 text-sm">
          © 2026 Organize+ Plataforma de Formaturas.
        </div>
      </div>

      {/* Right Panel - Forms */}
      <div className="flex-1 p-6 md:p-12 lg:p-20 flex flex-col justify-center bg-white dark:bg-slate-900 overflow-y-auto no-scrollbar">
        <div className="max-w-md mx-auto w-full">
          {/* Mobile Logo */}
          <div className="flex items-center gap-2 mb-8 md:hidden">
            <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-sm">layers</span>
            </div>
            <span className="font-bold text-xl text-primary dark:text-white">Organize+</span>
          </div>

          {/* Theme Toggle */}
          <div className="absolute top-6 right-6">
            <ThemeToggle />
          </div>

          {/* Header */}
          <header className="mb-8">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
              {modo === "entrar" ? "Bem-vindo de volta" : "Crie sua conta"}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mt-2">
              {modo === "entrar" 
                ? "Acesse sua conta para gerenciar sua formatura." 
                : "Junte-se a Organize+ e comece sua jornada."}
            </p>
          </header>

          {/* Level 1 Tabs */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 mb-8">
            <button
              onClick={() => setModo("entrar")}
              className={`px-6 py-3 text-sm font-semibold border-b-2 transition-all ${
                modo === "entrar"
                  ? "border-primary text-primary dark:text-white"
                  : "border-transparent text-slate-500 hover:text-primary dark:hover:text-white"
              }`}
            >
              Entrar
            </button>
            <button
              onClick={() => setModo("cadastrar")}
              className={`px-6 py-3 text-sm font-semibold border-b-2 transition-all ${
                modo === "cadastrar"
                  ? "border-primary text-primary dark:text-white"
                  : "border-transparent text-slate-500 hover:text-primary dark:hover:text-white"
              }`}
            >
              Cadastrar
            </button>
          </div>

          {/* Level 2 Tabs (only for cadastrar) */}
          {modo === "cadastrar" && (
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-8">
              <button
                onClick={() => setTipo("aluno")}
                className={`py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
                  tipo === "aluno"
                    ? "bg-white dark:bg-slate-700 text-primary dark:text-white shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-white"
                }`}
              >
                Sou Aluno
              </button>
              <button
                onClick={() => setTipo("comissao")}
                className={`py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
                  tipo === "comissao"
                    ? "bg-white dark:bg-slate-700 text-primary dark:text-white shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-white"
                }`}
              >
                Sou Comissão
              </button>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Nome (only for cadastrar) */}
            {modo === "cadastrar" && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Nome Completo
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">
                    person
                  </span>
                  <input
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    placeholder="Seu nome completo"
                    required={modo === "cadastrar"}
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                E-mail
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">
                  mail
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder="exemplo@email.com"
                  required
                />
              </div>
            </div>

            {/* Celular (only for cadastrar comissão) */}
            {modo === "cadastrar" && tipo === "comissao" && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Celular
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">
                    smartphone
                  </span>
                  <input
                    type="tel"
                    value={celular}
                    onChange={(e) => setCelular(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    placeholder="(00) 00000-0000"
                    required
                  />
                </div>
              </div>
            )}

            {/* Senha */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Senha
                </label>
                {modo === "entrar" && (
                  <a href="#" className="text-xs font-semibold text-secondary hover:underline">
                    Esqueceu a senha?
                  </a>
                )}
              </div>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">
                  lock
                </span>
                <input
                  type={mostrarSenha ? "text" : "password"}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {mostrarSenha ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>

              {/* Password Strength (only for cadastrar) */}
              {modo === "cadastrar" && senha && (
                <div className="mt-3 space-y-2">
                  <div className="flex gap-1 h-1.5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className={`flex-1 rounded-full transition-all ${
                          i <= forca ? getCorForca() : "bg-slate-200 dark:bg-slate-700"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">
                    Segurança: <span className={getCorForca().replace("bg-", "text-")}>{getTextoForca()}</span>
                  </p>
                </div>
              )}
            </div>

            {/* Student Specific Fields */}
            {modo === "cadastrar" && tipo === "aluno" && (
              <>
                {/* Celular do aluno */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Celular <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">
                      smartphone
                    </span>
                    <input
                      type="tel"
                      value={celular}
                      onChange={(e) => setCelular(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      placeholder="(00) 00000-0000"
                      required
                    />
                  </div>
                </div>

                <div>
  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
    Selecionar Turma
  </label>
  <div className="relative">
    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">
      school
    </span>
    <select
      value={turmaId}
      onChange={(e) => setTurmaId(e.target.value)}
      className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent appearance-none transition-all"
      required
    >
      <option value="" disabled>
        {carregandoTurmas ? "Carregando turmas..." : "Selecione sua turma"}
      </option>
      {turmas.map((turma) => (
        <option key={turma.id} value={turma.id}>
          {turma.nome}
        </option>
      ))}
    </select>
  </div>
</div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Senha da Turma
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">
                      key
                    </span>
                    <input
                      type="text"
                      value={senhaTurma}
                      onChange={(e) => setSenhaTurma(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      placeholder="Fornecida pela comissão"
                      required
                    />
                  </div>
                </div>
              </>
            )}

            {/* Commission Warning */}
            {modo === "cadastrar" && tipo === "comissao" && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900 p-4 rounded-xl">
                <div className="flex gap-3">
                  <span className="material-symbols-outlined text-amber-600 dark:text-amber-500 text-[20px]">
                    warning
                  </span>
                  <p className="text-xs text-amber-800 dark:text-amber-400 leading-relaxed">
                    <strong>Atenção:</strong> O e-mail e senha da comissão serão compartilhados entre todos os membros. Após criar sua conta, você precisará de uma chave de acesso vitalícia para criar turmas.
                  </p>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900">
                <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-slate-800 text-white font-bold py-4 rounded-xl shadow-lg transition-all transform active:scale-[0.98] mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading 
                ? "Processando..." 
                : modo === "entrar" 
                  ? "Entrar na Plataforma" 
                  : "Criar minha conta"}
            </button>
          </form>

          {/* Terms */}
          <p className="text-center mt-10 text-sm text-slate-500 dark:text-slate-400">
            Ao continuar, você concorda com nossos{" "}
            <a href="/termos" className="text-primary dark:text-secondary font-bold hover:underline">
              Termos de Serviço
            </a>{" "}
            e{" "}
            <a href="/privacidade" className="text-primary dark:text-secondary font-bold hover:underline">
              Privacidade
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
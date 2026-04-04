import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import MobileInput from "../components/ui/MobileInput";
import MobileButton from "../components/ui/MobileButton";

type Modo = "entrar" | "cadastrar";
type Tipo = "aluno" | "comissao";

export default function AcessoPage() {
  const navigate = useNavigate();
  const { login, registerAluno, registerComissao } = useAuth();

  const [modo, setModo] = useState<Modo>("entrar");
  const [tipo, setTipo] = useState<Tipo>("aluno");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);

  // Campos comuns
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  // Campos de cadastro
  const [nome, setNome] = useState("");
  const [celular, setCelular] = useState("");
  const [turmaId, setTurmaId] = useState("");
  const [senhaTurma, setSenhaTurma] = useState("");

  // Turmas
  const [turmas, setTurmas] = useState<Array<{ id: number; nome: string }>>([]);
  const [carregandoTurmas, setCarregandoTurmas] = useState(false);

  useEffect(() => {
  if (modo === "cadastrar" && tipo === "aluno") {
    setCarregandoTurmas(true);
    const API_URL = import.meta.env.VITE_API_URL || '';
    fetch(`${API_URL}/api/salas`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        console.log('[acesso] Salas carregadas:', data);
        setTurmas(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.warn("[acesso] Falha ao carregar turmas:", err.message);
        setTurmas([]);
      })
      .finally(() => setCarregandoTurmas(false));
  }
}, [modo, tipo]);

  // Força de senha
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
  const forcaColor = forca <= 2 ? "bg-rose-500" : forca <= 3 ? "bg-amber-500" : "bg-emerald-500";
  const forcaText = forca <= 2 ? "Fraca" : forca <= 3 ? "Média" : "Forte";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (modo === "entrar") {
        const user = await login.mutateAsync({ email, senha });
        navigate(user.role === "admin" ? "/admin/dashboard" : "/aluno/dashboard");
      } else if (tipo === "aluno") {
  console.log("[CADASTRO] Tentando cadastrar aluno...");
  const result = await registerAluno.mutateAsync({ 
    nome, email, senha, celular, turmaId, senhaTurma 
  });
  console.log("[CADASTRO] Resultado:", result);
  console.log("[CADASTRO] Redirecionando para /aluno/dashboard");
  navigate("/aluno/dashboard");
      } else {
  await registerComissao.mutateAsync({ nome, email, senha, celular });
  window.location.href = "/admin/create-sala";
}
    } catch (err: any) {
      setError(err.message || "Erro ao processar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1e3a5f] to-[#0f2a44] flex flex-col">
      {/* Header wave gradient */}
      <div className="h-44 bg-gradient-to-br from-[#c6a43f]/20 to-[#d4b254]/10 relative overflow-hidden flex-shrink-0">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 70% 50%, white 1px, transparent 0)", backgroundSize: "20px 20px" }} />
        
        {/* Botão voltar */}
        <Link to="/" className="absolute top-5 left-5 p-2 rounded-xl bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-all border border-white/20">
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        
        {/* Conteúdo do header */}
        <div className="absolute bottom-8 left-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="text-4xl">
              {modo === "entrar" ? "👋" : "🎓"}
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              {modo === "entrar" ? "Bem-vindo de volta" : "Criar conta"}
            </h1>
          </div>
          <p className="text-white/80 text-sm font-medium mt-1">
            {modo === "entrar" 
              ? "Acesse sua conta Organize+" 
              : "Junte-se ao Organize+ e organize sua formatura"}
          </p>
        </div>
        
        {/* Decoração dourada */}
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-transparent via-[#c6a43f] to-transparent rounded-full" />
      </div>

      {/* Form Card */}
      <div className="flex-1 -mt-6 bg-white dark:bg-slate-900 rounded-t-3xl relative z-10 px-5 pt-6 pb-10 max-w-lg mx-auto w-full shadow-2xl">
        {/* Mode Tabs */}
        <div className="flex gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl mb-6">
          <button
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              modo === "entrar"
                ? "bg-[#1e3a5f] text-white shadow-md"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
            onClick={() => { setModo("entrar"); setError(""); }}
          >
            Entrar
          </button>
          <button
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              modo === "cadastrar"
                ? "bg-[#1e3a5f] text-white shadow-md"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
            onClick={() => { setModo("cadastrar"); setError(""); }}
          >
            Criar conta
          </button>
        </div>

        {/* Tipo of account (cadastro only) */}
        {modo === "cadastrar" && (
          <div className="grid grid-cols-2 gap-2 mb-6">
            {(["aluno", "comissao"] as Tipo[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTipo(t)}
                className={`py-3 rounded-xl text-sm font-semibold border-2 transition-all ${
                  tipo === t
                    ? "border-[#c6a43f] bg-[#c6a43f]/10 text-[#c6a43f]"
                    : "border-slate-200 dark:border-slate-700 text-slate-500"
                }`}
              >
                {t === "aluno" ? "🎓 Sou Aluno" : "⚡ Sou Comissão"}
              </button>
            ))}
          </div>
        )}

        {/* Commission info */}
        {modo === "cadastrar" && tipo === "comissao" && (
          <div className="bg-[#c6a43f]/10 border border-[#c6a43f]/30 rounded-xl p-3 mb-5 flex gap-2">
            <span className="material-symbols-outlined text-[#c6a43f] text-lg flex-shrink-0 mt-0.5">info</span>
            <p className="text-xs text-[#c6a43f] leading-relaxed">
              Após criar, você precisará de uma chave de acesso para criar turmas.
            </p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {modo === "cadastrar" && (
            <MobileInput
              label="Nome Completo"
              icon="person"
              placeholder="Seu nome completo"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
              autoComplete="name"
            />
          )}

          <MobileInput
            label="E-mail"
            icon="mail"
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />

          {modo === "cadastrar" && (
            <MobileInput
              label="Celular"
              icon="smartphone"
              type="tel"
              placeholder="(00) 00000-0000"
              value={celular}
              onChange={(e) => setCelular(e.target.value)}
              required
            />
          )}

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Senha</label>
              {modo === "entrar" && (
                <button type="button" className="text-xs text-[#c6a43f] font-semibold hover:underline">
                  Esqueceu?
                </button>
              )}
            </div>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xl pointer-events-none">lock</span>
              <input
                type={mostrarSenha ? "text" : "password"}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="w-full pl-11 pr-11 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#c6a43f]/20 focus:border-[#c6a43f] outline-none transition-all"
                placeholder="••••••••"
                required
                autoComplete={modo === "entrar" ? "current-password" : "new-password"}
              />
              <button
                type="button"
                onClick={() => setMostrarSenha(!mostrarSenha)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <span className="material-symbols-outlined text-xl">{mostrarSenha ? "visibility_off" : "visibility"}</span>
              </button>
            </div>
            {modo === "cadastrar" && senha && (
              <div className="mt-2 space-y-1.5">
                <div className="flex gap-1 h-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className={`flex-1 rounded-full transition-all ${i <= forca ? forcaColor : "bg-slate-200 dark:bg-slate-700"}`} />
                  ))}
                </div>
                <p className="text-xs text-slate-400">Senha <span className={forcaColor.replace("bg-", "text-")}>{forcaText}</span></p>
              </div>
            )}
          </div>

          {/* Turma (aluno cadastro) */}
          {modo === "cadastrar" && tipo === "aluno" && (
            <>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Sua Turma</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xl pointer-events-none">school</span>
                  <select
                    value={turmaId}
                    onChange={(e) => setTurmaId(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#c6a43f]/20 focus:border-[#c6a43f] outline-none transition-all appearance-none"
                    required
                  >
                    <option value="" disabled>
                      {carregandoTurmas ? "Carregando..." : "Selecione sua turma"}
                    </option>
                    {turmas.map((t) => (
                      <option key={t.id} value={t.id}>{t.nome}</option>
                    ))}
                  </select>
                </div>
              </div>

              <MobileInput
                label="Senha da Turma"
                icon="key"
                placeholder="Fornecida pela comissão"
                value={senhaTurma}
                onChange={(e) => setSenhaTurma(e.target.value)}
                required
              />
            </>
          )}

          {/* Error */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 flex items-start gap-2">
              <span className="material-symbols-outlined text-rose-500 text-lg flex-shrink-0">error</span>
              <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>
            </div>
          )}

          <MobileButton
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
            icon={modo === "entrar" ? "login" : "person_add"}
            className="mt-2 rounded-2xl shadow-lg shadow-[#c6a43f]/20"
          >
            {modo === "entrar" ? "Entrar" : "Criar minha conta"}
          </MobileButton>
        </form>

        <p className="text-center text-xs text-slate-400 mt-6">
          Ao continuar, você concorda com os{" "}
          <Link to="/termos" className="text-[#c6a43f] hover:underline">Termos de Uso</Link>
          {" "}e{" "}
          <Link to="/privacidade" className="text-[#c6a43f] hover:underline">Privacidade</Link>
        </p>
      </div>
    </div>
  );
}
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
      fetch("/api/salas")
        .then((r) => r.json())
        .then((data) => setTurmas(data))
        .catch(() => {})
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
  const forcaColor = forca <= 2 ? "bg-red-500" : forca <= 3 ? "bg-amber-500" : "bg-emerald-500";
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
        await registerAluno.mutateAsync({ nome, email, senha, celular, turmaId, senhaTurma });
        navigate("/aluno/dashboard");
      } else {
        await registerComissao.mutateAsync({ nome, email, senha, celular });
        navigate("/admin/create-sala");
      }
    } catch (err: any) {
      setError(err.message || "Erro ao processar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header wave gradient */}
      <div className="h-44 gradient-primary relative overflow-hidden flex-shrink-0">
        <div className="absolute inset-0 opacity-20"
          style={{ backgroundImage: "radial-gradient(circle at 70% 50%, white 1px, transparent 0)", backgroundSize: "20px 20px" }} />
        <Link to="/" className="absolute top-5 left-5 p-2 rounded-xl bg-white/20 text-white">
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <div className="absolute bottom-8 left-6">
          <h1 className="text-2xl font-black text-white tracking-tight">
            {modo === "entrar" ? "Bem-vindo de volta 👋" : "Criar conta"}
          </h1>
          <p className="text-indigo-200 text-sm font-medium mt-1">
            {modo === "entrar" ? "Acesse sua conta Organize+" : "Junte-se ao Organize+"}
          </p>
        </div>
      </div>

      {/* Form Card */}
      <div className="flex-1 -mt-6 bg-background rounded-t-3xl relative z-10 px-5 pt-6 pb-10 max-w-lg mx-auto w-full">

        {/* Mode Tabs */}
        <div className="mobile-tab-bar mb-6">
          <button
            className={`mobile-tab-item flex-1 ${modo === "entrar" ? "active" : ""}`}
            onClick={() => { setModo("entrar"); setError(""); }}
          >
            Entrar
          </button>
          <button
            className={`mobile-tab-item flex-1 ${modo === "cadastrar" ? "active" : ""}`}
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
                    ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300"
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
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-xl p-3 mb-5 flex gap-2">
            <span className="material-symbols-outlined text-amber-600 text-lg flex-shrink-0 mt-0.5">info</span>
            <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
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
                <button type="button" className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
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
                className="mobile-input pl-11 pr-11"
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
                    className="mobile-input pl-11 appearance-none"
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
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 flex items-start gap-2">
              <span className="material-symbols-outlined text-red-500 text-lg flex-shrink-0">error</span>
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <MobileButton
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
            icon={modo === "entrar" ? "login" : "person_add"}
            className="mt-2 rounded-2xl shadow-lg shadow-indigo-500/20"
          >
            {modo === "entrar" ? "Entrar" : "Criar minha conta"}
          </MobileButton>
        </form>

        <p className="text-center text-xs text-slate-400 mt-6">
          Ao continuar, você concorda com os{" "}
          <Link to="/termos" className="text-indigo-600 dark:text-indigo-400 hover:underline">Termos de Uso</Link>
          {" "}e{" "}
          <Link to="/privacidade" className="text-indigo-600 dark:text-indigo-400 hover:underline">Privacidade</Link>
        </p>
      </div>
    </div>
  );
}
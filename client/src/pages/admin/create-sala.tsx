import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest, queryClient } from "../../lib/queryClient";
import ThemeToggle from "../../components/ThemeToggle";

export default function CreateSalaPage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Chave de acesso
  const [chaveAcesso, setChaveAcesso] = useState("");
  const [chaveValidada, setChaveValidada] = useState(false);
  const [validandoChave, setValidandoChave] = useState(false);
  const [erroChave, setErroChave] = useState("");

  // Campos da turma
  const [nomeTurma, setNomeTurma] = useState("");
  const [escola, setEscola] = useState("");
  const [ano, setAno] = useState(new Date().getFullYear().toString());
  const [metaTotal, setMetaTotal] = useState("");

  // Senha da turma
  const [senhaTurma, setSenhaTurma] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);

  const formatarChave = (valor: string) => {
  // Remove tudo que não é letra ou número e deixa maiúsculo
  const limpo = valor.toUpperCase().replace(/[^A-Z0-9]/g, "");
  
  // Adiciona hífen a cada 4 caracteres
  const partes = limpo.match(/.{1,4}/g) || [];
  return partes.slice(0, 4).join("-");
};

  const handleValidarChave = async () => {
    if (!chaveAcesso.trim()) {
      setErroChave("Digite a chave de acesso.");
      return;
    }
    setValidandoChave(true);
    setErroChave("");
    try {
      await apiRequest("POST", "/auth/validate-chave", { chave: chaveAcesso.trim() });
      setChaveValidada(true);
    } catch (err: any) {
      setErroChave(err.message || "Chave inválida ou já utilizada.");
    } finally {
      setValidandoChave(false);
    }
  };

  // Cálculo de força da senha
  const calcularForca = (s: string) => {
    let score = 0;
    if (s.length >= 8) score++;
    if (/[A-Z]/.test(s)) score++;
    if (/[a-z]/.test(s)) score++;
    if (/[0-9]/.test(s)) score++;
    if (/[^A-Za-z0-9]/.test(s)) score++;
    return score;
  };

  const forca = calcularForca(senhaTurma);

  const requisitos = [
    { label: "Mínimo 8 caracteres", ok: senhaTurma.length >= 8 },
    { label: "Letra maiúscula", ok: /[A-Z]/.test(senhaTurma) },
    { label: "Letra minúscula", ok: /[a-z]/.test(senhaTurma) },
    { label: "Número", ok: /[0-9]/.test(senhaTurma) },
    { label: "Caractere especial", ok: /[^A-Za-z0-9]/.test(senhaTurma) },
  ];

  const getCorBarra = () => {
    if (forca <= 2) return "#ef4444";
    if (forca <= 3) return "#f59e0b";
    return "#22c55e";
  };

  const getTextoForca = () => {
    if (forca <= 2) return "Fraca";
    if (forca <= 3) return "Média";
    return "Forte";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!chaveValidada) {
      setError("Valide sua chave de acesso antes de criar a turma.");
      return;
    }

    if (senhaTurma !== confirmarSenha) {
      setError("As senhas não coincidem.");
      return;
    }
    if (forca < 3) {
      setError("Por favor, escolha uma senha mais forte para a turma.");
      return;
    }

    setLoading(true);
    try {
      const codigo = Math.random().toString(36).substring(2, 8).toUpperCase();
      const dataFormatura = `${ano}-12-01`;

      const sala = await apiRequest("POST", "/salas", {
        nome: nomeTurma,
        escola,
        ano: parseInt(ano),
        metaValor: parseFloat(metaTotal) || 0,
        senha: senhaTurma,
        codigo,
        dataFormatura,
        chaveUsada: chaveAcesso,
      });

      await queryClient.invalidateQueries({ queryKey: ["auth-me"] });
      navigate("/admin/dashboard");
    } catch (err: any) {
      console.error("Erro ao criar turma:", err);
      setError(err.message || "Erro ao criar a turma. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row overflow-hidden bg-white dark:bg-slate-900">
      {/* Left Panel - Navy com dourado */}
      <div className="hidden md:flex md:w-5/12 lg:w-1/2 bg-[#1e3a5f] p-12 flex-col justify-between relative overflow-hidden">
        {/* Decorative circles with gold */}
        <div className="absolute w-[350px] h-[350px] rounded-full border border-[#c6a43f]/20 top-[-80px] right-[-80px]" />
        <div className="absolute w-[250px] h-[250px] rounded-full border border-[#c6a43f]/15 bottom-100px left-[-70px]" />

        <div className="relative z-10">
          {/* Logo with gold */}
          <div className="flex items-center gap-3 mb-16">
            <div className="w-11 h-11 bg-[#c6a43f] rounded-lg flex items-center justify-center shadow-lg shadow-[#c6a43f]/30">
              <span className="material-symbols-outlined text-white text-2xl">layers</span>
            </div>
            <h1 className="text-white text-2xl font-bold">Organize+</h1>
          </div>

          <h2 className="text-white text-4xl font-black leading-tight mb-4">
            Configure sua turma de formatura
          </h2>
          <p className="text-white/60 text-base">
            Defina as informações da sua turma. A senha criada aqui será usada pelos alunos para entrar na plataforma.
          </p>
        </div>

        {/* Feature list with gold accents */}
        <div className="relative z-10 space-y-4">
          {[
            { icon: "group", text: "Gerencie todos os alunos da turma" },
            { icon: "payments", text: "Controle financeiro em tempo real" },
            { icon: "event", text: "Planeje eventos e datas importantes" },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-9 h-9 bg-[#c6a43f]/15 border border-[#c6a43f]/30 rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined text-[#c6a43f] text-lg">{item.icon}</span>
              </div>
              <span className="text-white/70 text-sm">{item.text}</span>
            </div>
          ))}
        </div>

        <p className="relative z-10 text-white/30 text-xs">
          © 2026 Organize+ Plataforma de Formaturas
        </p>
      </div>

      {/* Right Panel */}
      <div className="flex-1 bg-[#f8fafc] dark:bg-slate-900 flex items-center justify-center p-6 md:p-8 overflow-y-auto">
        <div className="w-full max-w-md">
          {/* Mobile logo and ThemeToggle */}
          <div className="flex md:hidden items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#1e3a5f] rounded flex items-center justify-center">
                <span className="material-symbols-outlined text-[#c6a43f] text-sm">layers</span>
              </div>
              <span className="font-bold text-[#1e3a5f] dark:text-white">Organize+</span>
            </div>
            <ThemeToggle />
          </div>

          {/* ThemeToggle for desktop */}
          <div className="hidden md:block absolute top-6 right-6">
            <ThemeToggle />
          </div>

          {/* Header */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 bg-[#1e3a5f]/10 dark:bg-[#c6a43f]/10 px-4 py-2 rounded-full mb-4">
              <span className="material-symbols-outlined text-[#1e3a5f] dark:text-[#c6a43f] text-sm">school</span>
              <span className="text-xs font-bold text-[#1e3a5f] dark:text-[#c6a43f] uppercase">Passo 2 de 2</span>
            </div>
            <h1 className="text-3xl font-black text-[#1e3a5f] dark:text-white mb-2">
              Criar sua Turma
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              Preencha os dados abaixo para configurar a turma de formatura.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Card 0: Chave de Acesso */}
            <div className={`bg-white dark:bg-slate-800 rounded-xl p-5 border ${
              chaveValidada ? 'border-green-500' : 'border-slate-200 dark:border-slate-700'
            }`}>
              <h3 className="text-[#1e3a5f] dark:text-white font-bold text-sm flex items-center gap-2 mb-2">
                <span className={`material-symbols-outlined text-sm ${
                  chaveValidada ? 'text-green-500' : 'text-[#c6a43f]'
                }`}>
                  {chaveValidada ? 'verified' : 'vpn_key'}
                </span>
                Chave de Acesso
                {chaveValidada && (
                  <span className="text-green-500 text-xs font-semibold">✓ Validada</span>
                )}
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs mb-3">
                Insira a chave de acesso vitalícia que você adquiriu para criar sua turma.
              </p>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base">key</span>
                  <input
  type="text"
  value={chaveAcesso}
  onChange={(e) => { 
    setChaveAcesso(formatarChave(e.target.value)); 
    setChaveValidada(false); 
    setErroChave(""); 
  }}
  placeholder="XXXX-XXXX-XXXX-XXXX"
  disabled={chaveValidada}
  maxLength={19}
  className={`w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border transition-all ${
    chaveValidada 
      ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-slate-900 dark:text-white' 
      : erroChave 
        ? 'border-red-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white' 
        : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#c6a43f] focus:border-transparent'
  } placeholder-slate-400 dark:placeholder-slate-500`}
/>
                </div>
                <button
                  type="button"
                  onClick={handleValidarChave}
                  disabled={validandoChave || chaveValidada}
                  className={`px-5 py-2.5 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${
                    chaveValidada
                      ? 'bg-green-500 text-white'
                      : 'bg-[#1e3a5f] hover:bg-[#0f2a4a] text-white'
                  } disabled:opacity-50`}
                >
                  {validandoChave ? "..." : chaveValidada ? "✓ OK" : "Validar"}
                </button>
              </div>

              {erroChave && (
                <p className="text-red-500 text-xs mt-2 font-medium">{erroChave}</p>
              )}
            </div>

            {/* Card 1: Dados da Turma */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
              <h3 className="text-[#1e3a5f] dark:text-white font-bold text-sm flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-[#c6a43f] text-sm">info</span>
                Dados da Turma
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Nome da Turma *
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">groups</span>
                    <input
                      type="text"
                      value={nomeTurma}
                      onChange={(e) => setNomeTurma(e.target.value)}
                      placeholder="Ex: Medicina - Turma Alpha"
                      required
                      className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#c6a43f] focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Instituição / Escola *
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">school</span>
                    <input
                      type="text"
                      value={escola}
                      onChange={(e) => setEscola(e.target.value)}
                      placeholder="Ex: Terceirão ADM"
                      required
                      className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#c6a43f] focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Ano de Formatura *
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">calendar_month</span>
                      <input
                        type="number"
                        value={ano}
                        onChange={(e) => setAno(e.target.value)}
                        min="2024"
                        max="2035"
                        required
                        className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#c6a43f] focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Meta Total (R$)
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">paid</span>
                      <input
                        type="number"
                        value={metaTotal}
                        onChange={(e) => setMetaTotal(e.target.value)}
                        placeholder="0,00"
                        min="0"
                        step="0.01"
                        className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#c6a43f] focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Senha da Turma */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
              <h3 className="text-[#1e3a5f] dark:text-white font-bold text-sm flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-[#c6a43f] text-sm">lock</span>
                Senha da Turma
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs mb-4">
                Esta senha será compartilhada com os alunos para que eles possam entrar na turma.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Criar Senha *
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">key</span>
                    <input
                      type={mostrarSenha ? "text" : "password"}
                      value={senhaTurma}
                      onChange={(e) => setSenhaTurma(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full pl-9 pr-9 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#c6a43f] focus:border-transparent transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarSenha(!mostrarSenha)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                    >
                      <span className="material-symbols-outlined text-sm">
                        {mostrarSenha ? "visibility_off" : "visibility"}
                      </span>
                    </button>
                  </div>

                  {senhaTurma && (
                    <div className="mt-3">
                      <div className="flex gap-1 h-1 mb-2">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div
                            key={i}
                            className={`flex-1 h-full rounded-full transition-all ${
                              i <= forca ? `bg-[${getCorBarra()}]` : "bg-slate-200 dark:bg-slate-700"
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-slate-500">
                        Força: <span style={{ color: getCorBarra() }}>{getTextoForca()}</span>
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Confirmar Senha *
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">lock_open</span>
                    <input
                      type={mostrarSenha ? "text" : "password"}
                      value={confirmarSenha}
                      onChange={(e) => setConfirmarSenha(e.target.value)}
                      placeholder="••••••••"
                      required
                      className={`w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border ${
                        confirmarSenha && confirmarSenha !== senhaTurma
                          ? 'border-red-500'
                          : 'border-slate-200 dark:border-slate-700'
                      } bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#c6a43f] focus:border-transparent transition-all`}
                    />
                  </div>
                  {confirmarSenha && confirmarSenha !== senhaTurma && (
                    <p className="text-red-500 text-xs mt-1 font-medium">
                      As senhas não coincidem.
                    </p>
                  )}
                </div>

                {/* Checklist de requisitos */}
                {senhaTurma && (
                  <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3 border border-slate-200 dark:border-slate-800">
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">Requisitos:</p>
                    {requisitos.map((req, i) => (
                      <div key={i} className="flex items-center gap-2 py-0.5">
                        <span className={`material-symbols-outlined text-xs ${
                          req.ok ? 'text-green-500' : 'text-slate-400'
                        }`}>
                          {req.ok ? 'check_circle' : 'radio_button_unchecked'}
                        </span>
                        <span className={`text-xs ${
                          req.ok ? 'text-green-600 dark:text-green-400' : 'text-slate-500 dark:text-slate-400'
                        }`}>
                          {req.label}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 rounded-lg p-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-red-500 text-sm">error</span>
                <p className="text-red-600 dark:text-red-400 text-xs font-medium">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !chaveValidada}
              className={`w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                loading || !chaveValidada
                  ? 'bg-slate-300 dark:bg-slate-700 text-white cursor-not-allowed'
                  : 'bg-[#1e3a5f] hover:bg-[#0f2a4a] text-white shadow-lg shadow-[#1e3a5f]/30'
              }`}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span className="text-sm">Criando turma...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-base">add_circle</span>
                  <span className="text-sm">Criar Turma</span>
                </>
              )}
            </button>

            <p className="text-center text-xs text-slate-400 dark:text-slate-600">
              Você poderá editar essas informações depois nas configurações.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
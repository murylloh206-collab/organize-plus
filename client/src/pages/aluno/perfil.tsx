import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Sidebar from "../../components/layout/Sidebar";
import Header from "../../components/layout/Header";
import { apiRequest } from "../../lib/queryClient";
import { useAuth } from "../../hooks/useAuth";

export default function AlunoPerfil() {
  const qc = useQueryClient();
  const { auth, logout } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  
  // Estados do formulário
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [fotoPerfil, setFotoPerfil] = useState<string | null>(null);

  // Buscar dados do aluno
  const { data: me, isLoading, refetch } = useQuery({
    queryKey: ["me"],
    queryFn: () => apiRequest("GET", "/alunos/me"),
    enabled: !!auth,
  });

  // Atualizar perfil
  const atualizarPerfil = useMutation({
    mutationFn: (data: any) => apiRequest("PATCH", "/alunos/me", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["me"] });
      setEditMode(false);
      setSuccess("Perfil atualizado com sucesso!");
      setTimeout(() => setSuccess(""), 3000);
      refetch();
    },
    onError: (e: any) => {
      setError(e.message);
      setTimeout(() => setError(""), 3000);
    },
  });

  // Atualizar senha
  const atualizarSenha = useMutation({
    mutationFn: (data: any) => apiRequest("PATCH", "/alunos/senha", data),
    onSuccess: () => {
      setSuccess("Senha alterada com sucesso!");
      setSenhaAtual("");
      setNovaSenha("");
      setConfirmarSenha("");
      setTimeout(() => setSuccess(""), 3000);
    },
    onError: (e: any) => {
      setError(e.message);
      setTimeout(() => setError(""), 3000);
    },
  });

  const handleSaveInfo = () => {
    const updateData: any = {};
    if (nome && nome !== me?.nome) updateData.nome = nome;
    if (telefone && telefone !== me?.celular) updateData.celular = telefone;
    
    if (Object.keys(updateData).length > 0) {
      atualizarPerfil.mutate(updateData);
    } else {
      setEditMode(false);
    }
  };

  const handleUpdatePassword = () => {
    if (!senhaAtual || !novaSenha || !confirmarSenha) {
      setError("Preencha todos os campos de senha");
      return;
    }
    
    if (novaSenha.length < 6) {
      setError("A nova senha deve ter no mínimo 6 caracteres");
      return;
    }
    
    if (novaSenha !== confirmarSenha) {
      setError("As senhas não conferem");
      return;
    }
    
    atualizarSenha.mutate({
      senhaAtual,
      novaSenha,
    });
  };

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    
    if (strength <= 1) return { label: "Fraca", color: "text-red-500", bar: "bg-red-500", width: 25 };
    if (strength === 2) return { label: "Média", color: "text-amber-500", bar: "bg-amber-500", width: 50 };
    if (strength === 3) return { label: "Boa", color: "text-blue-500", bar: "bg-blue-500", width: 75 };
    return { label: "Forte", color: "text-emerald-500", bar: "bg-emerald-500", width: 100 };
  };

  const strength = getPasswordStrength(novaSenha);

  const handleFotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFotoPerfil(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark">
      <Sidebar role="aluno" />
      <main className="flex-1 flex flex-col overflow-y-auto ml-64">
        <Header title="Meu Perfil" />

        <div className="max-w-4xl mx-auto p-8">
          {/* Page Title */}
          <div className="mb-8">
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Meu Perfil
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Gerencie suas informações pessoais e segurança da conta.
            </p>
          </div>

          {/* Alertas */}
          {error && (
            <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-lg text-rose-700 dark:text-rose-400 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg text-emerald-700 dark:text-emerald-400 text-sm">
              {success}
            </div>
          )}

          {/* Profile Info Card */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden mb-6">
            <div className="p-6">
              <div className="flex items-center gap-6 mb-8">
                <div className="relative group">
                  <div className="h-24 w-24 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden border-2 border-primary/20">
                    {fotoPerfil || me?.avatarUrl ? (
                      <img
                        src={fotoPerfil || me?.avatarUrl}
                        alt={me?.nome}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-3xl font-bold text-primary">
                        {me?.nome?.charAt(0).toUpperCase() || "?"}
                      </span>
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 p-1.5 bg-primary text-white rounded-full shadow-lg border-2 border-white dark:border-slate-900 hover:scale-110 transition-transform cursor-pointer">
                    <span className="material-symbols-outlined !text-sm">photo_camera</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFotoUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    {me?.nome || "Carregando..."}
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">
                    {me?.email || "email@exemplo.com"}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="px-2.5 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full uppercase tracking-wider">
                      Aluno Ativo
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Nome Completo
                  </label>
                  {editMode ? (
                    <input
                      className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                      type="text"
                      value={nome || me?.nome || ""}
                      onChange={(e) => setNome(e.target.value)}
                    />
                  ) : (
                    <p className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                      {me?.nome || "Carregando..."}
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    E-mail Acadêmico
                  </label>
                  <input
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-slate-500 cursor-not-allowed"
                    disabled
                    type="email"
                    value={me?.email || "carregando..."}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Telefone
                  </label>
                  {editMode ? (
                    <input
                      className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                      type="text"
                      value={telefone || me?.celular || ""}
                      onChange={(e) => setTelefone(e.target.value)}
                      placeholder="(00) 00000-0000"
                    />
                  ) : (
                    <p className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                      {me?.celular || "Não informado"}
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Matrícula
                  </label>
                  <input
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-slate-500 cursor-not-allowed"
                    disabled
                    type="text"
                    value={me?.id ? `#${me.id}` : "Carregando..."}
                  />
                </div>
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 flex justify-end gap-3">
              {editMode ? (
                <>
                  <button
                    onClick={handleSaveInfo}
                    disabled={atualizarPerfil.isPending}
                    className="bg-primary text-white font-bold py-2 px-6 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {atualizarPerfil.isPending ? "Salvando..." : "Salvar Alterações"}
                  </button>
                  <button
                    onClick={() => {
                      setEditMode(false);
                      setNome("");
                      setTelefone("");
                    }}
                    className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold py-2 px-6 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                  >
                    Cancelar
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setEditMode(true)}
                  className="bg-primary text-white font-bold py-2 px-6 rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Editar Perfil
                </button>
              )}
            </div>
          </div>

          {/* Password Change Card */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <span className="material-symbols-outlined text-primary">lock_reset</span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Segurança da Conta</h3>
              </div>
              <div className="space-y-6">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Senha Atual
                  </label>
                  <input
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    placeholder="••••••••"
                    type="password"
                    value={senhaAtual}
                    onChange={(e) => setSenhaAtual(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Nova Senha
                    </label>
                    <input
                      className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                      placeholder="Mínimo 6 caracteres"
                      type="password"
                      value={novaSenha}
                      onChange={(e) => setNovaSenha(e.target.value)}
                    />
                    {novaSenha && (
                      <div className="mt-3">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[10px] font-bold uppercase text-slate-400">
                            Força da Senha
                          </span>
                          <span className={`text-[10px] font-bold uppercase ${strength.color}`}>
                            {strength.label}
                          </span>
                        </div>
                        <div className="flex gap-1 h-1">
                          <div className={`flex-1 ${strength.bar} rounded-full`} style={{ width: `${strength.width}%` }}></div>
                          <div className={`flex-1 ${strength.width >= 50 ? strength.bar : "bg-slate-200 dark:bg-slate-800"} rounded-full`}></div>
                          <div className={`flex-1 ${strength.width >= 75 ? strength.bar : "bg-slate-200 dark:bg-slate-800"} rounded-full`}></div>
                          <div className={`flex-1 ${strength.width >= 100 ? strength.bar : "bg-slate-200 dark:bg-slate-800"} rounded-full`}></div>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-2">
                          Dica: Use letras maiúsculas, números e símbolos.
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Confirmar Nova Senha
                    </label>
                    <input
                      className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                      placeholder="Repita a nova senha"
                      type="password"
                      value={confirmarSenha}
                      onChange={(e) => setConfirmarSenha(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 flex justify-between items-center">
              <p className="text-xs text-slate-500 italic">
                Última alteração: {me?.updatedAt ? new Date(me.updatedAt).toLocaleDateString("pt-BR") : "Nunca"}
              </p>
              <button
                onClick={handleUpdatePassword}
                disabled={atualizarSenha.isPending}
                className="bg-primary/10 text-primary hover:bg-primary/20 font-bold py-2 px-6 rounded-lg transition-colors disabled:opacity-50"
              >
                {atualizarSenha.isPending ? "Atualizando..." : "Atualizar Senha"}
              </button>
            </div>
          </div>

          {/* Logout Button */}
          <div className="mt-8">
            <button
              onClick={() => setShowLogoutModal(true)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors font-semibold"
            >
              <span className="material-symbols-outlined text-sm">logout</span>
              Sair da conta
            </button>
          </div>

          {/* Footer/Support */}
          <div className="mt-12 text-center">
            <p className="text-slate-500 text-sm">
              Precisa de ajuda com seus dados?{" "}
              <a href="/suporte" className="text-primary font-bold hover:underline">
                Fale com o Suporte
              </a>
            </p>
          </div>
        </div>
      </main>

      {/* Modal de Confirmação de Logout */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 max-w-md w-full shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-xl font-bold text-slate-900 dark:text-white">Sair da Conta</h4>
              <button onClick={() => setShowLogoutModal(false)} className="text-slate-400 hover:text-slate-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Tem certeza que deseja sair da sua conta?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => logout.mutate()}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-lg text-sm font-semibold transition-all"
              >
                Sair
              </button>
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 py-2.5 rounded-lg text-sm font-semibold transition-all"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
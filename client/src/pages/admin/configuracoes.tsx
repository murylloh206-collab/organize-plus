import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import Sidebar from "../../components/layout/Sidebar";
import Header from "../../components/layout/Header";
import { apiRequest } from "../../lib/queryClient";
import { useAuth } from "../../hooks/useAuth";

interface Sala {
  id: number;
  nome: string;
  codigo: string;
  dataFormatura?: string;
  metaValor: string;
  senha?: string;
}

export default function AdminConfiguracoes() {
  const qc = useQueryClient();
  const { auth } = useAuth();
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    instituicao: "",
    anoLetivo: "2024",
    metaAlunos: "",
    novaSenha: "",
    confirmarSenha: ""
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Buscar dados da sala
  const { data: sala, isLoading } = useQuery<Sala>({
    queryKey: ["sala", auth?.salaId],
    queryFn: () => apiRequest("GET", `/salas/${auth?.salaId}`),
    enabled: !!auth?.salaId,
  });

  // Atualizar dados da sala
  const atualizarSala = useMutation({
    mutationFn: (data: any) => apiRequest("PATCH", `/salas/${auth?.salaId}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sala", auth?.salaId] });
      setSuccess("Informações salvas com sucesso!");
      setTimeout(() => setSuccess(""), 3000);
    },
    onError: (e: any) => {
      setError(e.message);
      setTimeout(() => setError(""), 3000);
    },
  });

  // Atualizar senha
  const atualizarSenha = useMutation({
    mutationFn: (data: any) => apiRequest("PATCH", `/salas/${auth?.salaId}/senha`, data),
    onSuccess: () => {
      setSuccess("Senha alterada com sucesso!");
      setFormData({ ...formData, novaSenha: "", confirmarSenha: "" });
      setTimeout(() => setSuccess(""), 3000);
    },
    onError: (e: any) => {
      setError(e.message);
      setTimeout(() => setError(""), 3000);
    },
  });

  // Arquivar turma
  const arquivarTurma = useMutation({
    mutationFn: () => apiRequest("PATCH", `/salas/${auth?.salaId}/arquivar`, {}),
    onSuccess: () => {
      setShowArchiveModal(false);
      setSuccess("Turma arquivada com sucesso!");
      setTimeout(() => setSuccess(""), 3000);
      // Redirecionar após arquivar
      setTimeout(() => {
        window.location.href = "/admin/dashboard";
      }, 2000);
    },
    onError: (e: any) => {
      setError(e.message);
      setTimeout(() => setError(""), 3000);
    },
  });

  const handleSaveInfo = () => {
    if (!formData.nome && !formData.metaAlunos) return;
    
    atualizarSala.mutate({
      nome: formData.nome || sala?.nome,
      metaValor: formData.metaAlunos ? parseFloat(formData.metaAlunos) * 100 : undefined,
    });
  };

  const handleUpdatePassword = () => {
    if (!formData.novaSenha || formData.novaSenha.length < 6) {
      setError("Senha deve ter no mínimo 6 caracteres");
      setTimeout(() => setError(""), 3000);
      return;
    }
    
    if (formData.novaSenha !== formData.confirmarSenha) {
      setError("As senhas não conferem");
      setTimeout(() => setError(""), 3000);
      return;
    }
    
    atualizarSenha.mutate({ senha: formData.novaSenha });
  };

  const handleExport = () => {
    alert("Funcionalidade de exportação em desenvolvimento. Em breve disponível!");
  };

  if (isLoading) {
    return (
      <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark">
        <Sidebar role="admin" />
        <main className="flex-1 flex flex-col overflow-y-auto ml-64">
          <Header title="Configurações" />
          <div className="flex-1 flex items-center justify-center">
            <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark">
      <Sidebar role="admin" />
      <main className="flex-1 flex flex-col overflow-y-auto ml-64">
        <Header title="Configurações" />

        <div className="p-8">
          {/* Page Title Area */}
          <div className="flex flex-wrap justify-between items-end gap-4 pb-8 border-b border-slate-200 dark:border-slate-800">
            <div className="flex flex-col gap-1">
              <nav className="flex items-center gap-2 text-sm text-slate-500 mb-2">
                <Link to="/admin/dashboard" className="hover:text-primary transition-colors">Administração</Link>
                <span className="material-symbols-outlined text-xs">chevron_right</span>
                <Link to="#" className="hover:text-primary transition-colors">Turmas</Link>
                <span className="material-symbols-outlined text-xs">chevron_right</span>
                <span className="text-slate-900 dark:text-slate-100 font-medium">Configurações</span>
              </nav>
              <h1 className="text-slate-900 dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">
                Configurações da Turma
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-base font-normal">
                Gerencie os detalhes, segurança e exportação de dados da turma {sala?.nome || "3º Ano A"}.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm"
              >
                <span className="material-symbols-outlined text-sm">download</span>
                Exportar Relatórios
              </button>
            </div>
          </div>

          {/* Alerts */}
          {error && (
            <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="mt-6 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg text-emerald-700 dark:text-emerald-400 text-sm">
              {success}
            </div>
          )}

          {/* Main Form Sections */}
          <div className="space-y-10 py-8">
            {/* General Info */}
            <section>
              <div className="flex items-center gap-2 mb-6">
                <span className="material-symbols-outlined text-primary">info</span>
                <h2 className="text-slate-900 dark:text-white text-xl font-bold leading-tight">Informações Gerais</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <label className="flex flex-col gap-2">
                  <span className="text-slate-700 dark:text-slate-300 text-sm font-semibold">Nome da Turma</span>
                  <input
                    className="form-input rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-primary focus:border-primary text-slate-900 dark:text-white h-12 px-4"
                    type="text"
                    value={formData.nome || sala?.nome || ""}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Ex: 3º Ano A - Matutino"
                  />
                </label>
                <label className="flex flex-col gap-2">
                  <span className="text-slate-700 dark:text-slate-300 text-sm font-semibold">Escola / Instituição</span>
                  <input
                    className="form-input rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-primary focus:border-primary text-slate-900 dark:text-white h-12 px-4"
                    type="text"
                    value={formData.instituicao || "Colégio Dom Bosco"}
                    onChange={(e) => setFormData({ ...formData, instituicao: e.target.value })}
                    placeholder="Nome da instituição"
                  />
                </label>
                <label className="flex flex-col gap-2">
                  <span className="text-slate-700 dark:text-slate-300 text-sm font-semibold">Ano Letivo</span>
                  <select
                    className="form-select rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-primary focus:border-primary text-slate-900 dark:text-white h-12 px-4"
                    value={formData.anoLetivo}
                    onChange={(e) => setFormData({ ...formData, anoLetivo: e.target.value })}
                  >
                    <option>2023</option>
                    <option selected>2024</option>
                    <option>2025</option>
                  </select>
                </label>
                <label className="flex flex-col gap-2">
                  <span className="text-slate-700 dark:text-slate-300 text-sm font-semibold">Meta Total de Alunos</span>
                  <input
                    className="form-input rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-primary focus:border-primary text-slate-900 dark:text-white h-12 px-4"
                    type="number"
                    value={formData.metaAlunos || ""}
                    onChange={(e) => setFormData({ ...formData, metaAlunos: e.target.value })}
                    placeholder="Ex: 40"
                  />
                </label>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleSaveInfo}
                  disabled={atualizarSala.isPending}
                  className="px-6 py-2.5 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition-all shadow-md disabled:opacity-50"
                >
                  {atualizarSala.isPending ? "Salvando..." : "Salvar Alterações"}
                </button>
              </div>
            </section>

            {/* Security Section */}
            <section className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <span className="material-symbols-outlined text-primary">lock</span>
                <h2 className="text-slate-900 dark:text-white text-xl font-bold leading-tight">Segurança da Turma</h2>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                Altere a senha de acesso rápido para os alunos desta turma.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
                <label className="flex flex-col gap-2">
                  <span className="text-slate-700 dark:text-slate-300 text-sm font-semibold">Nova Senha da Turma</span>
                  <input
                    className="form-input rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-primary focus:border-primary text-slate-900 dark:text-white h-12 px-4"
                    placeholder="••••••••"
                    type="password"
                    value={formData.novaSenha}
                    onChange={(e) => setFormData({ ...formData, novaSenha: e.target.value })}
                  />
                </label>
                <label className="flex flex-col gap-2">
                  <span className="text-slate-700 dark:text-slate-300 text-sm font-semibold">Confirmar Nova Senha</span>
                  <input
                    className="form-input rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-primary focus:border-primary text-slate-900 dark:text-white h-12 px-4"
                    placeholder="••••••••"
                    type="password"
                    value={formData.confirmarSenha}
                    onChange={(e) => setFormData({ ...formData, confirmarSenha: e.target.value })}
                  />
                </label>
              </div>
              <div className="mt-6">
                <button
                  onClick={handleUpdatePassword}
                  disabled={atualizarSenha.isPending}
                  className="px-6 py-2.5 bg-primary/10 text-primary font-bold rounded-lg hover:bg-primary/20 transition-all disabled:opacity-50"
                >
                  {atualizarSenha.isPending ? "Atualizando..." : "Atualizar Senha"}
                </button>
              </div>
            </section>

            {/* Danger Zone */}
            <section className="border-t border-slate-200 dark:border-slate-800 pt-10">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-red-600">warning</span>
                <h2 className="text-red-600 text-xl font-bold leading-tight">Zona de Perigo</h2>
              </div>
              <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex-1">
                  <h3 className="text-slate-900 dark:text-white font-bold mb-1">Arquivar esta Turma</h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm">
                    Ao arquivar, a turma não aparecerá mais nos dashboards ativos, mas seus dados históricos serão preservados para relatórios anuais.
                  </p>
                </div>
                <button
                  onClick={() => setShowArchiveModal(true)}
                  className="whitespace-nowrap px-6 py-2.5 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-all shadow-md flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">archive</span>
                  Arquivar Turma
                </button>
              </div>
            </section>
          </div>

          {/* Footer - Padrão igual ao HomePage */}
          <footer className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800">
            <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                © 2026 Organize+. Todos os direitos reservados.
              </p>
              <div className="flex gap-6">
                <Link to="/termos" className="text-sm text-slate-500 hover:text-primary dark:text-slate-400 transition-colors">
                  Termos de Uso
                </Link>
                <Link to="/privacidade" className="text-sm text-slate-500 hover:text-primary dark:text-slate-400 transition-colors">
                  Privacidade
                </Link>
                <Link to="/suporte" className="text-sm text-slate-500 hover:text-primary dark:text-slate-400 transition-colors">
                  Suporte
                </Link>
                <Link to="/criador" className="text-sm text-slate-500 hover:text-primary dark:text-slate-400 transition-colors">
                  Criador
                </Link>
              </div>
            </div>
          </footer>
        </div>
      </main>

      {/* Confirmation Modal Overlay */}
      {showArchiveModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="size-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4 text-red-600">
              <span className="material-symbols-outlined">warning</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Confirmar arquivamento?</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Esta ação removerá a turma "{sala?.nome}" da visualização principal. Você poderá restaurá-la nas configurações do sistema.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowArchiveModal(false)}
                className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => arquivarTurma.mutate()}
                disabled={arquivarTurma.isPending}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {arquivarTurma.isPending ? "Arquivando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
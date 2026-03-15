import { useQuery } from "@tanstack/react-query";
import Sidebar from "../../components/layout/Sidebar";
import Header from "../../components/layout/Header";
import { apiRequest } from "../../lib/queryClient";
import { useAuth } from "../../hooks/useAuth";

export default function AdminConfiguracoes() {
  const { auth } = useAuth();
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar role="admin" />
      <main className="flex-1 flex flex-col overflow-y-auto ml-64">
        <Header title="Configurações" />
        <div className="p-8 space-y-6 max-w-2xl">
          <div>
            <h3 className="text-xl font-bold">Configurações da Turma</h3>
            <p className="text-sm text-slate-500">Gerencie os dados da sua turma</p>
          </div>

          <div className="card p-6 space-y-4">
            <h4 className="font-semibold">Informações Gerais</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-1">Nome da Turma</label>
                <input className="input" placeholder="Ex: Engenharia Civil 2025" />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-1">Data de Formatura</label>
                <input className="input" type="date" />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-1">Meta de Arrecadação (R$)</label>
                <input className="input" type="number" placeholder="60000" />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-1">Código da Turma</label>
                <input className="input" disabled placeholder="Auto-gerado" />
              </div>
            </div>
            <button className="btn-primary">Salvar Alterações</button>
          </div>

          <div className="card p-6 space-y-4">
            <h4 className="font-semibold">Conta Admin</h4>
            <div>
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-1">Alterar Senha</label>
              <input className="input" type="password" placeholder="Nova senha (mín. 6 caracteres)" />
            </div>
            <button className="btn-secondary">Atualizar Senha</button>
          </div>

          <div className="card p-6 border-rose-200 dark:border-rose-800 space-y-3">
            <h4 className="font-semibold text-rose-600">Zona de Perigo</h4>
            <p className="text-sm text-slate-500">Ações irreversíveis para a conta e turma.</p>
            <button className="px-4 py-2 rounded-lg border border-rose-400 text-rose-500 text-sm font-semibold hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors">
              Excluir Turma
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

import { useQuery } from "@tanstack/react-query";
import Sidebar from "../../components/layout/Sidebar";
import { apiRequest } from "../../lib/queryClient";
import { useAuth } from "../../hooks/useAuth";

export default function AlunoPerfil() {
  const { auth, logout } = useAuth();
  const { data: me } = useQuery({ queryKey: ["me"], queryFn: () => apiRequest("GET", "/alunos/me"), enabled: !!auth });

  return (
    <div className="flex min-h-screen">
      <Sidebar role="aluno" />
      <main className="flex-1 ml-64 p-8 space-y-6 max-w-2xl">
        <div>
          <h2 className="text-3xl font-black">Meu Perfil</h2>
          <p className="text-slate-500">Suas informações de conta.</p>
        </div>

        <div className="card p-6 flex items-center gap-6">
          <div className="size-20 rounded-full bg-primary flex items-center justify-center text-white text-3xl font-black shrink-0">
            {me?.nome?.charAt(0) || "?"}
          </div>
          <div>
            <h3 className="text-2xl font-black">{me?.nome}</h3>
            <p className="text-slate-500">{me?.email}</p>
            <span className="badge-success mt-2">Aluno Ativo</span>
          </div>
        </div>

        <div className="card p-6 space-y-4">
          <h4 className="font-semibold">Informações Pessoais</h4>
          <div>
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-1">Nome</label>
            <input className="input" defaultValue={me?.nome} />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-1">E-mail</label>
            <input className="input opacity-60 cursor-not-allowed" type="email" defaultValue={me?.email} disabled />
          </div>
          <button className="btn-primary">Salvar Alterações</button>
        </div>

        <div className="card p-6 space-y-4">
          <h4 className="font-semibold">Alterar Senha</h4>
          <input className="input" type="password" placeholder="Senha atual" />
          <input className="input" type="password" placeholder="Nova senha" />
          <button className="btn-secondary">Atualizar Senha</button>
        </div>

        <button
          onClick={() => logout.mutate()}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors font-semibold"
        >
          <span className="material-symbols-outlined text-sm">logout</span>
          Sair da conta
        </button>
      </main>
    </div>
  );
}

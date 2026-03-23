import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import MobileLayout from "../../components/layout/MobileLayout";
import MobileHeader from "../../components/layout/MobileHeader";
import MobileAvatar from "../../components/ui/MobileAvatar";
import MobileBadge from "../../components/ui/MobileBadge";
import MobileButton from "../../components/ui/MobileButton";
import MobileInput from "../../components/ui/MobileInput";
import MobileCard from "../../components/ui/MobileCard";
import BottomSheet from "../../components/ui/BottomSheet";
import Skeleton from "../../components/ui/Skeleton";
import { useBottomSheet } from "../../hooks/useBottomSheet";
import { apiRequest } from "../../lib/queryClient";
import { useAuth } from "../../hooks/useAuth";
import { formatCurrency } from "../../components/shared/CurrencyFormat";

type StatusFiltro = "todos" | "completed" | "pending" | "overdue";

const filtros: { key: StatusFiltro; label: string }[] = [
  { key: "todos",     label: "Todos" },
  { key: "completed", label: "Pagos" },
  { key: "pending",   label: "Pendentes" },
  { key: "overdue",   label: "Inadimplentes" },
];

export default function AdminAlunos() {
  const qc = useQueryClient();
  const { auth } = useAuth();
  const addSheet   = useBottomSheet();
  const editSheet  = useBottomSheet();

  const [editingAluno, setEditingAluno] = useState<any>(null);
  const [searchTerm,   setSearchTerm]   = useState("");
  const [filtroStatus, setFiltroStatus] = useState<StatusFiltro>("todos");

  // Form state - novo
  const [nome,    setNome]    = useState("");
  const [email,   setEmail]   = useState("");
  const [senha,   setSenha]   = useState("");
  const [celular, setCelular] = useState("");
  const [error,   setError]   = useState("");

  // Form state - edição
  const [editNome,    setEditNome]    = useState("");
  const [editEmail,   setEditEmail]   = useState("");
  const [editCelular, setEditCelular] = useState("");

  const { data: alunos = [], isLoading } = useQuery({
    queryKey: ["alunos", auth?.salaId],
    queryFn: () => apiRequest("GET", `/alunos?salaId=${auth?.salaId}`),
    enabled: !!auth?.salaId,
  });

  const { data: pagamentos = [] } = useQuery({
    queryKey: ["pagamentos", auth?.salaId],
    queryFn: () => apiRequest("GET", `/pagamentos?salaId=${auth?.salaId}`),
    enabled: !!auth?.salaId,
  });

  const criar = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/alunos", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["alunos"] });
      addSheet.close();
      setNome(""); setEmail(""); setSenha(""); setCelular(""); setError("");
    },
    onError: (e: any) => setError(e.message),
  });

  const editar = useMutation({
    mutationFn: ({ id, ...data }: any) => apiRequest("PUT", `/alunos/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["alunos"] });
      editSheet.close();
      setEditingAluno(null);
    },
  });

  const deletar = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/alunos/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alunos"] }),
  });

  const getAlunoStatus = (alunoId: number): StatusFiltro => {
    const pags = pagamentos.filter((p: any) => p.usuarioId === alunoId);
    if (pags.length === 0) return "pending";
    const temPago     = pags.some((p: any) => p.status === "pago");
    const temPendente = pags.some((p: any) => p.status === "pending");
    if (temPago && !temPendente) return "completed";
    if (temPendente) return "pending";
    return "overdue";
  };

  const getTotalPago = (alunoId: number) =>
    pagamentos
      .filter((p: any) => p.usuarioId === alunoId && p.status === "pago")
      .reduce((acc: number, p: any) => acc + p.valor, 0);

  const alunosFiltrados = alunos.filter((a: any) => {
    const match = [a.nome, a.email, a.celular].some((f: string) =>
      f?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const st = getAlunoStatus(a.id);
    return match && (filtroStatus === "todos" || st === filtroStatus);
  });

  const handleEdit = (aluno: any) => {
    setEditingAluno(aluno);
    setEditNome(aluno.nome);
    setEditEmail(aluno.email);
    setEditCelular(aluno.celular || "");
    editSheet.open();
  };

    const statusVariantMap: Record<string, "success" | "warning" | "danger"> = {
  completed: "success",
  pending: "warning",
  overdue: "danger",
  };

  return (
    <MobileLayout role="admin">
      <MobileHeader
        title="Alunos"
        subtitle={`${alunosFiltrados.length} alunos`}
        gradient
        actions={[{ icon: "person_add", onClick: addSheet.open, label: "Adicionar" }]}
      />

      <div className="px-4 py-4 space-y-4">
        {/* Search */}
        <MobileInput
          icon="search"
          placeholder="Buscar por nome, email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        {/* Filter Tabs */}
        <div className="mobile-tab-bar">
          {filtros.map((f) => (
            <button
              key={f.key}
              className={`mobile-tab-item ${filtroStatus === f.key ? "active" : ""}`}
              onClick={() => setFiltroStatus(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* List */}
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} variant="card" />)}
          </div>
        ) : alunosFiltrados.length > 0 ? (
          <div className="space-y-2">
            {alunosFiltrados.map((aluno: any) => {
              const st = getAlunoStatus(aluno.id);
              const total = getTotalPago(aluno.id);
              return (
                <div key={aluno.id} className="mobile-list-item justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <MobileAvatar name={aluno.nome} size="md" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {aluno.nome}
                      </p>
                      <p className="text-xs text-slate-500 truncate">{aluno.email}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <MobileBadge variant={statusVariantMap[st] || "neutral"} />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {formatCurrency(total)}
                    </span>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <button onClick={() => handleEdit(aluno)}
                      className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors">
                      <span className="material-symbols-outlined text-lg">edit</span>
                    </button>
                    <button
                      onClick={() => { if (confirm(`Remover ${aluno.nome}?`)) deletar.mutate(aluno.id); }}
                      className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">
                      <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <MobileCard className="text-center py-12">
            <span className="material-symbols-outlined text-slate-300 dark:text-slate-600 text-5xl">group</span>
            <p className="text-slate-500 dark:text-slate-400 mt-3 text-sm font-medium">Nenhum aluno encontrado</p>
            <MobileButton variant="ghost" size="sm" icon="person_add" className="mt-3" onClick={addSheet.open}>
              Adicionar aluno
            </MobileButton>
          </MobileCard>
        )}
      </div>

      {/* Bottom Sheet: Novo Aluno */}
      <BottomSheet isOpen={addSheet.isOpen} onClose={addSheet.close} title="Novo Aluno">
        <div className="space-y-4">
          <MobileInput label="Nome Completo" icon="person" placeholder="Nome completo" value={nome} onChange={(e) => setNome(e.target.value)} />
          <MobileInput label="E-mail" icon="mail" type="email" placeholder="email@exemplo.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          <MobileInput label="Celular" icon="smartphone" type="tel" placeholder="(00) 00000-0000" value={celular} onChange={(e) => setCelular(e.target.value)} />
          <MobileInput label="Senha Temporária" icon="lock" type="password" placeholder="••••••••" value={senha} onChange={(e) => setSenha(e.target.value)} />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <MobileButton variant="secondary" fullWidth onClick={addSheet.close}>Cancelar</MobileButton>
            <MobileButton
              variant="primary" fullWidth loading={criar.isPending}
              onClick={() => criar.mutate({ nome, email, senha, celular, role: "aluno", salaId: auth?.salaId })}
            >
              Salvar
            </MobileButton>
          </div>
        </div>
      </BottomSheet>

      {/* Bottom Sheet: Editar Aluno */}
      <BottomSheet isOpen={editSheet.isOpen} onClose={editSheet.close} title="Editar Aluno">
        <div className="space-y-4">
          <MobileInput label="Nome Completo" icon="person" placeholder="Nome" value={editNome} onChange={(e) => setEditNome(e.target.value)} />
          <MobileInput label="E-mail" icon="mail" type="email" placeholder="E-mail" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
          <MobileInput label="Celular" icon="smartphone" type="tel" placeholder="Celular" value={editCelular} onChange={(e) => setEditCelular(e.target.value)} />
          <div className="grid grid-cols-2 gap-3 pt-2">
            <MobileButton variant="secondary" fullWidth onClick={editSheet.close}>Cancelar</MobileButton>
            <MobileButton
              variant="primary" fullWidth loading={editar.isPending}
              onClick={() => editar.mutate({ id: editingAluno?.id, nome: editNome, email: editEmail, celular: editCelular })}
            >
              Atualizar
            </MobileButton>
          </div>
        </div>
      </BottomSheet>
    </MobileLayout>
  );
}
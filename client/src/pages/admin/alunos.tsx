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

// Interfaces
interface Aluno {
  id: number;
  nome: string;
  email: string;
  celular: string | null;
  avatarUrl: string | null;
  salaId: number;
  role: string;
}

interface Pagamento {
  id: number;
  usuarioId: number;
  valor: string;
  status: string;
  descricao: string;
  dataVencimento: string;
}

interface Ticket {
  id: number;
  rifaId: number;
  vendedorId: number;
  vendedorNome: string;
  valor: string;
  status: string;
  numero: number;
  compradorNome: string;
}

type StatusFiltro = "todos" | "completed" | "pending" | "overdue";

const filtros: { key: StatusFiltro; label: string }[] = [
  { key: "todos", label: "Todos" },
  { key: "completed", label: "Pagos" },
  { key: "pending", label: "Pendentes" },
  { key: "overdue", label: "Inadimplentes" },
];

const statusVariantMap: Record<string, "success" | "warning" | "danger"> = {
  completed: "success",
  pending: "warning",
  overdue: "danger",
};

export default function AdminAlunos() {
  const qc = useQueryClient();
  const { auth } = useAuth();
  const addSheet = useBottomSheet();
  const editSheet = useBottomSheet();

  const [editingAluno, setEditingAluno] = useState<Aluno | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<StatusFiltro>("todos");
  const [error, setError] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    senha: "",
    celular: "",
  });

  const [editFormData, setEditFormData] = useState({
    nome: "",
    email: "",
    celular: "",
  });

  // Queries
  const { data: alunos = [], isLoading } = useQuery<Aluno[]>({
    queryKey: ["alunos", auth?.salaId],
    queryFn: () => apiRequest("GET", `/alunos?salaId=${auth?.salaId}`),
    enabled: !!auth?.salaId,
  });

  const { data: pagamentosRaw = [] } = useQuery<any[]>({
    queryKey: ["pagamentos", auth?.salaId],
    queryFn: () => apiRequest("GET", `/pagamentos?salaId=${auth?.salaId}`),
    enabled: !!auth?.salaId,
  });

  const { data: ticketsRaw = [] } = useQuery<any[]>({
    queryKey: ["tickets", auth?.salaId],
    queryFn: () => apiRequest("GET", `/rifas/tickets?salaId=${auth?.salaId}`),
    enabled: !!auth?.salaId,
  });

  // Processamento de dados
  const pagamentos: Pagamento[] = pagamentosRaw.map((item: any) => ({
    id: item.pagamento?.id ?? item.id,
    usuarioId: item.pagamento?.usuarioId ?? item.usuarioId,
    valor: item.pagamento?.valor ?? item.valor,
    status: item.pagamento?.status ?? item.status,
    descricao: item.pagamento?.descricao ?? item.descricao,
    dataVencimento: item.pagamento?.dataVencimento ?? item.dataVencimento,
  }));

  const tickets: Ticket[] = ticketsRaw.map((item: any) => ({
    id: item.id,
    rifaId: item.rifaId,
    vendedorId: item.vendedorId,
    vendedorNome: item.vendedorNome,
    valor: item.valor,
    status: item.status,
    numero: item.numero,
    compradorNome: item.compradorNome,
  }));

  // Mutations
  const criar = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/alunos", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["alunos"] });
      addSheet.close();
      setFormData({ nome: "", email: "", senha: "", celular: "" });
      setError("");
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
    onError: (e: any) => setError(e.message),
  });

  const deletar = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/alunos/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["alunos"] });
      qc.invalidateQueries({ queryKey: ["pagamentos"] });
      qc.invalidateQueries({ queryKey: ["tickets"] });
    },
    onError: (e: any) => setError(e.message),
  });

  // Funções auxiliares
  const getAlunoStatus = (alunoId: number): StatusFiltro => {
    const pags = pagamentos.filter((p) => p.usuarioId === alunoId);
    if (pags.length === 0) return "pending";
    const temPago = pags.some((p) => p.status?.toLowerCase() === "pago");
    const temPendente = pags.some((p) => p.status?.toLowerCase() === "pendente");
    if (temPago && !temPendente) return "completed";
    if (temPendente) return "pending";
    return "overdue";
  };

  const getTotalArrecadado = (alunoId: number): number => {
    const totalPagamentos = pagamentos
      .filter((p) => p.usuarioId === alunoId && p.status?.toLowerCase() === "pago")
      .reduce((acc, p) => acc + parseFloat(p.valor), 0);

    const totalRifas = tickets
      .filter((t) => t.vendedorId === alunoId && t.status?.toLowerCase() === "pago")
      .reduce((acc, t) => acc + parseFloat(t.valor), 0);

    return totalPagamentos + totalRifas;
  };

  const alunosFiltrados = alunos.filter((aluno) => {
    const match = [aluno.nome, aluno.email, aluno.celular || ""].some((f) =>
      f?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const st = getAlunoStatus(aluno.id);
    return match && (filtroStatus === "todos" || st === filtroStatus);
  });

  const handleEdit = (aluno: Aluno) => {
    setEditingAluno(aluno);
    setEditFormData({
      nome: aluno.nome,
      email: aluno.email,
      celular: aluno.celular || "",
    });
    editSheet.open();
  };

  const handleSaveEdit = () => {
    if (!editFormData.nome || !editFormData.email) {
      setError("Nome e email são obrigatórios");
      return;
    }
    editar.mutate({
      id: editingAluno?.id,
      nome: editFormData.nome,
      email: editFormData.email,
      celular: editFormData.celular,
    });
  };

  const handleCreate = () => {
    if (!formData.nome || !formData.email || !formData.senha) {
      setError("Nome, email e senha são obrigatórios");
      return;
    }
    criar.mutate({
      nome: formData.nome,
      email: formData.email,
      senha: formData.senha,
      celular: formData.celular,
      role: "aluno",
      salaId: auth?.salaId,
    });
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
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} variant="card" />
            ))}
          </div>
        ) : alunosFiltrados.length > 0 ? (
          <div className="space-y-2">
            {alunosFiltrados.map((aluno) => {
              const st = getAlunoStatus(aluno.id);
              const total = getTotalArrecadado(aluno.id);
              return (
                <MobileCard key={aluno.id} className="p-3">
                  <div className="flex items-center gap-3">
                    {/* Foto do aluno */}
                    {aluno.avatarUrl ? (
                      <img
                        src={aluno.avatarUrl}
                        alt={aluno.nome}
                        className="w-12 h-12 rounded-full object-cover border-2 border-gold/30"
                      />
                    ) : (
                      <MobileAvatar name={aluno.nome} size="md" />
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                          {aluno.nome}
                        </p>
                        <MobileBadge variant={statusVariantMap[st] || "neutral"} />
                      </div>
                      <p className="text-xs text-slate-500 truncate">{aluno.email}</p>
                      {aluno.celular && (
                        <p className="text-xs text-slate-400 mt-0.5">{aluno.celular}</p>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs font-medium text-slate-500">Total Arrecadado</span>
                        <span className="text-sm font-bold text-gold">
                          {formatCurrency(total)}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEdit(aluno)}
                        className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
                      >
                        <span className="material-symbols-outlined text-lg">edit</span>
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Remover ${aluno.nome}?`)) deletar.mutate(aluno.id);
                        }}
                        className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                      >
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                    </div>
                  </div>
                </MobileCard>
              );
            })}
          </div>
        ) : (
          <MobileCard className="text-center py-12">
            <span className="material-symbols-outlined text-slate-300 dark:text-slate-600 text-5xl">
              group
            </span>
            <p className="text-slate-500 dark:text-slate-400 mt-3 text-sm font-medium">
              Nenhum aluno encontrado
            </p>
            <MobileButton
              variant="ghost"
              size="sm"
              icon="person_add"
              className="mt-3"
              onClick={addSheet.open}
            >
              Adicionar aluno
            </MobileButton>
          </MobileCard>
        )}
      </div>

      {/* Bottom Sheet: Novo Aluno */}
      <BottomSheet isOpen={addSheet.isOpen} onClose={addSheet.close} title="Novo Aluno">
        <div className="space-y-4">
          <MobileInput
            label="Nome Completo"
            icon="person"
            placeholder="Nome completo"
            value={formData.nome}
            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
          />
          <MobileInput
            label="E-mail"
            icon="mail"
            type="email"
            placeholder="email@exemplo.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          <MobileInput
            label="Celular"
            icon="smartphone"
            type="tel"
            placeholder="(00) 00000-0000"
            value={formData.celular}
            onChange={(e) => setFormData({ ...formData, celular: e.target.value })}
          />
          <MobileInput
            label="Senha Temporária"
            icon="lock"
            type="password"
            placeholder="••••••••"
            value={formData.senha}
            onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <MobileButton variant="secondary" fullWidth onClick={addSheet.close}>
              Cancelar
            </MobileButton>
            <MobileButton
              variant="primary"
              fullWidth
              loading={criar.isPending}
              onClick={handleCreate}
            >
              Salvar
            </MobileButton>
          </div>
        </div>
      </BottomSheet>

      {/* Bottom Sheet: Editar Aluno */}
      <BottomSheet isOpen={editSheet.isOpen} onClose={editSheet.close} title="Editar Aluno">
        <div className="space-y-4">
          <MobileInput
            label="Nome Completo"
            icon="person"
            placeholder="Nome"
            value={editFormData.nome}
            onChange={(e) => setEditFormData({ ...editFormData, nome: e.target.value })}
          />
          <MobileInput
            label="E-mail"
            icon="mail"
            type="email"
            placeholder="E-mail"
            value={editFormData.email}
            onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
          />
          <MobileInput
            label="Celular"
            icon="smartphone"
            type="tel"
            placeholder="Celular"
            value={editFormData.celular}
            onChange={(e) => setEditFormData({ ...editFormData, celular: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-3 pt-2">
            <MobileButton variant="secondary" fullWidth onClick={editSheet.close}>
              Cancelar
            </MobileButton>
            <MobileButton
              variant="primary"
              fullWidth
              loading={editar.isPending}
              onClick={handleSaveEdit}
            >
              Atualizar
            </MobileButton>
          </div>
        </div>
      </BottomSheet>
    </MobileLayout>
  );
}
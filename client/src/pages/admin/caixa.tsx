import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import MobileLayout from "../../components/layout/MobileLayout";
import MobileHeader from "../../components/layout/MobileHeader";
import BottomSheet from "../../components/ui/BottomSheet";
import { useBottomSheet } from "../../hooks/useBottomSheet";
import { useAuth } from "../../hooks/useAuth";
import { apiRequest } from "../../lib/queryClient";
import { formatCurrency } from "../../components/shared/CurrencyFormat";
import { formatDate } from "../../components/shared/DateFormat";

interface Movimentacao {
  id: number;
  descricao: string;
  valor: number;
  tipo: "entrada" | "saida";
  data: string;
  responsavel?: string;
  categoria?: string;
}

// Tipo para o retorno do backend
interface MovimentacaoRaw {
  mov: {
    id: number;
    descricao: string;
    valor: string;
    tipo: "entrada" | "saida";
    data: string;
    categoria?: string;
  };
  usuario?: {
    nome: string;
  };
}

export default function AdminCaixa() {
  const { auth } = useAuth();
  const qc = useQueryClient();
  const formSheet = useBottomSheet();
  const [editingMov, setEditingMov] = useState<Movimentacao | null>(null);
  const [filtroTipo, setFiltroTipo] = useState<"todos" | "entrada" | "saida">("todos");
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 10;

  // Estados do formulário
  const [formData, setFormData] = useState({
    descricao: "",
    valor: "",
    tipo: "entrada" as "entrada" | "saida",
    data: new Date().toISOString().split("T")[0],
    categoria: "",
  });
  const [error, setError] = useState("");

  // Buscar movimentações - dados brutos do backend
  const { data: movimentacoesRaw = [], isLoading, refetch } = useQuery<MovimentacaoRaw[]>({
    queryKey: ["caixa"],
    queryFn: () => apiRequest("GET", "/caixa"),
  });

  // Processar os dados para o formato esperado pelo frontend
  const movimentacoes: Movimentacao[] = movimentacoesRaw.map((item) => ({
    id: item.mov.id,
    descricao: item.mov.descricao,
    valor: parseFloat(item.mov.valor),
    tipo: item.mov.tipo,
    data: item.mov.data,
    responsavel: item.usuario?.nome,
    categoria: item.mov.categoria,
  }));

  // Buscar saldo
  const { data: saldoData } = useQuery({
    queryKey: ["caixa-saldo"],
    queryFn: () => apiRequest("GET", "/caixa/saldo"),
  });

  // Calcular totais
  const totalEntradas = movimentacoes
    .filter(m => m.tipo === "entrada")
    .reduce((sum, m) => sum + m.valor, 0);
  
  const totalSaidas = movimentacoes
    .filter(m => m.tipo === "saida")
    .reduce((sum, m) => sum + m.valor, 0);
  
  const saldoAtual = saldoData?.saldo !== undefined ? saldoData.saldo : (totalEntradas - totalSaidas);
  const eficiencia = totalEntradas > 0 ? (saldoAtual / totalEntradas) * 100 : 0;

  // Log para debug
  console.log("Movimentações processadas:", movimentacoes);
  console.log("Total entradas:", totalEntradas);
  console.log("Total saídas:", totalSaidas);
  console.log("Saldo atual:", saldoAtual);

  // Filtrar movimentações
  const movimentacoesFiltradas = movimentacoes.filter(m => {
    if (filtroTipo === "todos") return true;
    return m.tipo === filtroTipo;
  });

  // Paginação
  const totalPaginas = Math.ceil(movimentacoesFiltradas.length / itensPorPagina);
  const movimentacoesPaginadas = movimentacoesFiltradas.slice(
    (paginaAtual - 1) * itensPorPagina,
    paginaAtual * itensPorPagina
  );

  // Mutations
  const criarMovimentacao = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/caixa", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["caixa"] });
      qc.invalidateQueries({ queryKey: ["caixa-saldo"] });
      formSheet.close();
      resetForm();
      refetch();
    },
    onError: (e: any) => {
      console.error("Erro ao criar:", e);
      setError(e.message || "Erro ao criar movimentação");
    },
  });

  const editarMovimentacao = useMutation({
    mutationFn: ({ id, ...data }: any) => apiRequest("PATCH", `/caixa/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["caixa"] });
      qc.invalidateQueries({ queryKey: ["caixa-saldo"] });
      setEditingMov(null);
      formSheet.close();
      refetch();
    },
    onError: (e: any) => setError(e.message),
  });

  const deletarMovimentacao = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/caixa/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["caixa"] });
      qc.invalidateQueries({ queryKey: ["caixa-saldo"] });
      refetch();
    },
    onError: (e: any) => setError(e.message),
  });

  const resetForm = () => {
    setFormData({
      descricao: "",
      valor: "",
      tipo: "entrada",
      data: new Date().toISOString().split("T")[0],
      categoria: "",
    });
    setError("");
  };

  const handleSubmit = () => {
    const valorNumerico = parseFloat(formData.valor);
    
    if (!formData.descricao || !formData.valor || valorNumerico <= 0) {
      setError("Preencha todos os campos obrigatórios");
      return;
    }

    const dataISO = new Date(formData.data).toISOString();

    const dadosParaEnviar = {
      descricao: formData.descricao,
      tipo: formData.tipo,
      valor: valorNumerico.toString(),
      data: dataISO,
      categoria: formData.categoria || null,
      salaId: auth?.salaId,
      createdBy: auth?.userId,
    };

    console.log("Enviando dados:", dadosParaEnviar);

    if (editingMov) {
      editarMovimentacao.mutate({
        id: editingMov.id,
        ...dadosParaEnviar,
      });
    } else {
      criarMovimentacao.mutate(dadosParaEnviar);
    }
  };

  const handleDelete = (id: number) => {
    if (window.confirm("Tem certeza que deseja excluir esta movimentação?")) {
      deletarMovimentacao.mutate(id);
    }
  };

  const handleEdit = (mov: Movimentacao) => {
    setEditingMov(mov);
    setFormData({
      descricao: mov.descricao,
      valor: mov.valor.toString(),
      tipo: mov.tipo,
      data: mov.data.split("T")[0],
      categoria: mov.categoria || "",
    });
    formSheet.open();
  };

  return (
    <MobileLayout role="admin">
      <MobileHeader
        title="Caixa da Turma"
        subtitle="Gestão Financeira"
        gradient
        actions={[{ icon: "add_circle", onClick: () => { resetForm(); setEditingMov(null); formSheet.open(); }, label: "Nova" }]}
      />

      <div className="px-4 py-4 space-y-6">
        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Saldo Atual */}
          <div className="bg-gradient-to-br from-[#1e3a5f] to-[#0f2a44] border border-[#c6a43f]/20 p-6 rounded-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="material-symbols-outlined text-6xl text-[#c6a43f]">account_balance_wallet</span>
            </div>
            <span className="text-white/60 text-sm font-medium uppercase tracking-wider">Saldo Atual</span>
            <div className="mt-4">
              <span className="text-3xl font-black text-white">{formatCurrency(saldoAtual)}</span>
            </div>
            <div className="mt-4 flex items-center gap-2 text-emerald-400 text-xs font-bold">
              <span className="material-symbols-outlined text-sm">trending_up</span>
              +12% este mês
            </div>
          </div>

          {/* Total de Entradas */}
          <div className="bg-[#1e3a5f]/40 border border-[#c6a43f]/20 p-6 rounded-2xl">
            <div className="flex items-center justify-between">
              <span className="text-white/60 text-sm font-medium">Total de Entradas</span>
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                <span className="material-symbols-outlined text-sm">arrow_downward</span>
              </div>
            </div>
            <div className="mt-4">
              <span className="text-2xl font-bold text-white">{formatCurrency(totalEntradas)}</span>
            </div>
            <div className="mt-2 w-full bg-[#0f2a44] h-1 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full" style={{ width: `${totalEntradas + totalSaidas > 0 ? (totalEntradas / (totalEntradas + totalSaidas)) * 100 : 0}%` }} />
            </div>
          </div>

          {/* Total de Saídas */}
          <div className="bg-[#1e3a5f]/40 border border-[#c6a43f]/20 p-6 rounded-2xl">
            <div className="flex items-center justify-between">
              <span className="text-white/60 text-sm font-medium">Total de Saídas</span>
              <div className="w-8 h-8 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500">
                <span className="material-symbols-outlined text-sm">arrow_upward</span>
              </div>
            </div>
            <div className="mt-4">
              <span className="text-2xl font-bold text-white">{formatCurrency(totalSaidas)}</span>
            </div>
            <div className="mt-2 w-full bg-[#0f2a44] h-1 rounded-full overflow-hidden">
              <div className="bg-rose-500 h-full" style={{ width: `${totalEntradas + totalSaidas > 0 ? (totalSaidas / (totalEntradas + totalSaidas)) * 100 : 0}%` }} />
            </div>
          </div>
        </div>

        {/* Eficiência de Caixa */}
        <div className="bg-[#1e3a5f]/20 border border-[#c6a43f]/20 p-6 rounded-2xl flex flex-col items-center text-center">
          <div className="relative w-24 h-24 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="48" cy="48" r="40" fill="transparent" stroke="currentColor" strokeWidth="8" className="text-rose-500/20" />
              <circle
                cx="48"
                cy="48"
                r="40"
                fill="transparent"
                stroke="currentColor"
                strokeWidth="8"
                strokeDasharray="251.2"
                strokeDashoffset={251.2 * (1 - eficiencia / 100)}
                className="text-emerald-500"
              />
            </svg>
            <span className="absolute text-xl font-bold text-white">{Math.round(eficiencia)}%</span>
          </div>
          <div className="mt-4">
            <p className="text-xs text-white/50 font-medium">EFICIÊNCIA DE CAIXA</p>
            <p className="text-sm text-white/70 mt-1">Margem saudável para eventos</p>
          </div>
        </div>

        {/* Lista de Movimentações */}
        <div className="bg-[#1e3a5f]/20 border border-[#c6a43f]/20 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#c6a43f]/20 flex items-center justify-between bg-[#1e3a5f]/30">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-[#c6a43f]">history</span>
              Histórico de Movimentações
            </h3>
            <div className="flex gap-2">
              <select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value as any)}
                className="bg-[#0f2a44] border border-[#c6a43f]/30 rounded-lg text-sm text-white px-3 py-1.5"
              >
                <option value="todos">Todos</option>
                <option value="entrada">Entradas</option>
                <option value="saida">Saídas</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[#0f2a44]/50 text-white/50 text-xs uppercase tracking-widest font-semibold">
                <tr>
                  <th className="px-5 py-3">Data</th>
                  <th className="px-5 py-3">Descrição</th>
                  <th className="px-5 py-3">Tipo</th>
                  <th className="px-5 py-3 text-right">Valor</th>
                  <th className="px-5 py-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#c6a43f]/10">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-white/50">Carregando...</td>
                  </tr>
                ) : movimentacoesPaginadas.length > 0 ? (
                  movimentacoesPaginadas.map((mov) => (
                    <tr key={mov.id} className="hover:bg-[#1e3a5f]/30 transition-colors group">
                      <td className="px-5 py-3 text-sm text-white/50">{formatDate(mov.data)}</td>
                      <td className="px-5 py-3 font-medium text-white">{mov.descricao}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                          mov.tipo === "entrada"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-rose-500/10 text-rose-400"
                        }`}>
                          <span className="material-symbols-outlined text-xs">
                            {mov.tipo === "entrada" ? "south_west" : "north_east"}
                          </span>
                          {mov.tipo === "entrada" ? "Entrada" : "Saída"}
                        </span>
                      </td>
                      <td className={`px-5 py-3 text-right font-bold ${
                        mov.tipo === "entrada" ? "text-emerald-400" : "text-rose-400"
                      }`}>
                        {mov.tipo === "entrada" ? formatCurrency(mov.valor) : `- ${formatCurrency(mov.valor)}`}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEdit(mov)}
                            className="text-white/40 hover:text-[#c6a43f] transition-colors"
                          >
                            <span className="material-symbols-outlined text-sm">edit</span>
                          </button>
                          <button
                            onClick={() => handleDelete(mov.id)}
                            className="text-white/40 hover:text-rose-400 transition-colors"
                          >
                            <span className="material-symbols-outlined text-sm">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-white/50">
                      Nenhuma movimentação registrada
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          {totalPaginas > 1 && (
            <div className="px-5 py-4 bg-[#0f2a44]/30 border-t border-[#c6a43f]/20 flex items-center justify-between">
              <span className="text-sm text-white/50">
                Mostrando {(paginaAtual - 1) * itensPorPagina + 1} - {Math.min(paginaAtual * itensPorPagina, movimentacoesFiltradas.length)} de {movimentacoesFiltradas.length}
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => setPaginaAtual(p => Math.max(1, p - 1))}
                  disabled={paginaAtual === 1}
                  className="p-2 border border-[#c6a43f]/30 rounded-lg text-white/50 hover:bg-[#1e3a5f] transition-colors disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-sm">chevron_left</span>
                </button>
                {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                  let pageNum;
                  if (totalPaginas <= 5) {
                    pageNum = i + 1;
                  } else if (paginaAtual <= 3) {
                    pageNum = i + 1;
                  } else if (paginaAtual >= totalPaginas - 2) {
                    pageNum = totalPaginas - 4 + i;
                  } else {
                    pageNum = paginaAtual - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPaginaAtual(pageNum)}
                      className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                        paginaAtual === pageNum
                          ? "bg-[#c6a43f] text-[#1e3a5f] font-bold"
                          : "text-white/50 hover:bg-[#1e3a5f]"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPaginaAtual(p => Math.min(totalPaginas, p + 1))}
                  disabled={paginaAtual === totalPaginas}
                  className="p-2 border border-[#c6a43f]/30 rounded-lg text-white/50 hover:bg-[#1e3a5f] transition-colors disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-sm">chevron_right</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Sheet */}
      <BottomSheet 
        isOpen={formSheet.isOpen} 
        onClose={formSheet.close} 
        title={editingMov ? "Editar Movimentação" : "Nova Movimentação"}
        maxHeight="100vh"
      >
        <div className="space-y-4 pb-20">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tipo *</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, tipo: "entrada" })}
                className={`flex-1 py-2.5 rounded-lg font-semibold transition-all ${
                  formData.tipo === "entrada"
                    ? "bg-emerald-500 text-white"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                Entrada
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, tipo: "saida" })}
                className={`flex-1 py-2.5 rounded-lg font-semibold transition-all ${
                  formData.tipo === "saida"
                    ? "bg-rose-500 text-white"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                Saída
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Descrição *</label>
            <input
              type="text"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              placeholder="Ex: Mensalidade, Compra de materiais..."
              className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#c6a43f]/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Valor *</label>
              <input
                type="number"
                step="0.01"
                value={formData.valor}
                onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                placeholder="0,00"
                className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#c6a43f]/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Data</label>
              <input
                type="date"
                value={formData.data}
                onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#c6a43f]/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Categoria (opcional)</label>
            <input
              type="text"
              value={formData.categoria}
              onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
              placeholder="Ex: Eventos, Material, Divulgação..."
              className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#c6a43f]/50"
            />
          </div>

          {error && (
            <p className="text-rose-500 text-sm">{error}</p>
          )}

          <div className="grid grid-cols-2 gap-3 pt-4">
            <button
              onClick={() => {
                formSheet.close();
                resetForm();
                setEditingMov(null);
              }}
              className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold py-2.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={criarMovimentacao.isPending || editarMovimentacao.isPending}
              className="flex-1 bg-[#c6a43f] hover:bg-[#b89430] text-[#1e3a5f] font-bold py-2.5 rounded-lg transition-all disabled:opacity-50"
            >
              {criarMovimentacao.isPending || editarMovimentacao.isPending ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </div>
      </BottomSheet>
    </MobileLayout>
  );
}
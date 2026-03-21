import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Sidebar from "../../components/layout/Sidebar";
import Header from "../../components/layout/Header";
import { apiRequest } from "../../lib/queryClient";

interface Pagamento {
  id: number;
  usuarioId: number;
  descricao: string;
  valor: number;
  status: "pago" | "pendente" | "atrasado";
  dataVencimento: string;
  dataPagamento?: string;
  formaPagamento?: "pix" | "cartao" | "boleto" | "dinheiro";
  comprovanteUrl?: string;
  createdAt: string;
}

interface Aluno {
  id: number;
  nome: string;
  email: string;
  avatarUrl?: string;
}

interface PagamentoComAluno extends Pagamento {
  aluno?: Aluno;
}

export default function AdminPagamentos() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [showReciboModal, setShowReciboModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [pagamentoSelecionado, setPagamentoSelecionado] = useState<PagamentoComAluno | null>(null);
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [usuarioId, setUsuarioId] = useState("");
  const [vencimento, setVencimento] = useState("");
  const [formaPagamento, setFormaPagamento] = useState<"pix" | "cartao" | "boleto" | "dinheiro">("pix");
  const [error, setError] = useState("");
  
  // Estados dos filtros
  const [filtroNome, setFiltroNome] = useState("");
  const [filtroDataInicio, setFiltroDataInicio] = useState("");
  const [filtroDataFim, setFiltroDataFim] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<"todos" | "pago" | "pendente" | "atrasado">("todos");
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 10;
  const [isDeleting, setIsDeleting] = useState(false);

  // Buscar pagamentos com dados do aluno
  const { data: pagamentosRaw = [], isLoading, refetch } = useQuery({
    queryKey: ["pagamentos"],
    queryFn: () => apiRequest("GET", "/pagamentos"),
  });

  // Transformar pagamentos para incluir dados do aluno
  const pagamentos: PagamentoComAluno[] = pagamentosRaw.map((item: any) => ({
    ...item.pagamento,
    aluno: item.usuario
  }));

  // Buscar alunos para o select
  const { data: alunos = [] } = useQuery<Aluno[]>({
    queryKey: ["alunos"],
    queryFn: () => apiRequest("GET", "/alunos"),
  });

  // Criar pagamento
  const criar = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/pagamentos", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pagamentos"] });
      qc.invalidateQueries({ queryKey: ["eventos"] });
      setShowForm(false);
      resetForm();
      refetch();
    },
    onError: (e: any) => setError(e.message),
  });

  // Atualizar status do pagamento
  const atualizar = useMutation({
    mutationFn: ({ id, status, dataPagamento, formaPagamento }: any) =>
      apiRequest("PATCH", `/pagamentos/${id}`, { status, dataPagamento, formaPagamento }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pagamentos"] });
      qc.invalidateQueries({ queryKey: ["eventos"] });
      qc.invalidateQueries({ queryKey: ["metas"] });
      refetch();
    },
  });

  // Deletar pagamento com prevenção de duplicidade
  const deletar = useMutation({
    mutationFn: async (id: number) => {
      if (isDeleting) return;
      setIsDeleting(true);
      try {
        return await apiRequest("DELETE", `/pagamentos/${id}`);
      } finally {
        setIsDeleting(false);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pagamentos"] });
      qc.invalidateQueries({ queryKey: ["eventos"] });
      qc.invalidateQueries({ queryKey: ["metas"] });
      setShowDeleteModal(false);
      setPagamentoSelecionado(null);
      refetch();
    },
    onError: (e: any) => {
      // Ignora erro 404 (pagamento já foi deletado)
      if (e.message?.includes("404")) {
        qc.invalidateQueries({ queryKey: ["pagamentos"] });
        setShowDeleteModal(false);
        setPagamentoSelecionado(null);
        refetch();
        return;
      }
      setError(e.message);
      setTimeout(() => setError(""), 3000);
    },
  });

  const resetForm = () => {
    setDescricao("");
    setValor("");
    setUsuarioId("");
    setVencimento("");
    setFormaPagamento("pix");
    setError("");
  };

  const fmt = (v: string | number) =>
    parseFloat(String(v || "0")).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const statusBadge = (s: string) => {
    if (s === "pago")
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
          PAGO
        </span>
      );
    if (s === "pendente")
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
          PENDENTE
        </span>
      );
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400">
        ATRASADO
      </span>
    );
  };

  const formaPagamentoIcon = (forma: string) => {
    switch (forma) {
      case "pix":
        return <span className="material-symbols-outlined text-sm">qr_code_2</span>;
      case "cartao":
        return <span className="material-symbols-outlined text-sm">credit_card</span>;
      case "boleto":
        return <span className="material-symbols-outlined text-sm">receipt_long</span>;
      default:
        return <span className="material-symbols-outlined text-sm">payments</span>;
    }
  };

  const formaPagamentoLabel = (forma: string) => {
    switch (forma) {
      case "pix": return "Pix";
      case "cartao": return "Cartão";
      case "boleto": return "Boleto";
      default: return "Dinheiro";
    }
  };

  // Calcular estatísticas
  const calcularEstatisticas = () => {
    const pagamentosPagos = pagamentos.filter((p: PagamentoComAluno) => p.status === "pago");
    const totalArrecadado = pagamentosPagos.reduce((acc: number, p: PagamentoComAluno) => acc + p.valor, 0);
    const quantidadePagos = pagamentosPagos.length;
    
    const pendentes = pagamentos
      .filter((p: PagamentoComAluno) => p.status === "pendente")
      .reduce((acc: number, p: PagamentoComAluno) => acc + p.valor, 0);
    const quantidadePendentes = pagamentos.filter((p: PagamentoComAluno) => p.status === "pendente").length;
    
    const atrasados = pagamentos.filter((p: PagamentoComAluno) => {
      if (!p.dataVencimento || p.status === "pago") return false;
      const venc = new Date(p.dataVencimento);
      const hoje = new Date();
      return venc < hoje;
    }).length;

    const quantidadeAtrasados = atrasados;
    const valorAtrasados = pagamentos
      .filter((p: PagamentoComAluno) => {
        if (!p.dataVencimento || p.status === "pago") return false;
        const venc = new Date(p.dataVencimento);
        const hoje = new Date();
        return venc < hoje;
      })
      .reduce((acc, p) => acc + p.valor, 0);

    const proximosVencimentos = pagamentos
      .filter((p: PagamentoComAluno) => {
        if (!p.dataVencimento || p.status === "pago") return false;
        const venc = new Date(p.dataVencimento);
        const hoje = new Date();
        const diffDays = Math.ceil((venc.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays <= 7;
      }).length;

    return { 
      totalArrecadado, 
      quantidadePagos,
      pendentes, 
      quantidadePendentes,
      atrasados: quantidadeAtrasados,
      valorAtrasados,
      proximosVencimentos 
    };
  };

  const stats = calcularEstatisticas();

  // Gerar dados do gráfico baseado nos pagamentos reais
  const dadosGrafico = useMemo(() => {
    const meses = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];
    const anoAtual = new Date().getFullYear();
    const mesAtual = new Date().getMonth();
    
    // Agrupar pagamentos por mês
    const pagamentosPorMes: Record<string, { recebido: number; mes: string; mesNumero: number; ano: number }> = {};
    
    pagamentos
      .filter((p: PagamentoComAluno) => p.status === "pago" && p.dataPagamento)
      .forEach((p) => {
        const data = new Date(p.dataPagamento!);
        const key = `${data.getFullYear()}-${data.getMonth()}`;
        if (!pagamentosPorMes[key]) {
          pagamentosPorMes[key] = {
            recebido: 0,
            mes: meses[data.getMonth()],
            mesNumero: data.getMonth(),
            ano: data.getFullYear()
          };
        }
        pagamentosPorMes[key].recebido += p.valor;
      });

    // Pegar os últimos 6 meses com pagamentos, ou mostrar meses recentes vazios
    const ultimos6Meses = [];
    for (let i = 5; i >= 0; i--) {
      const mesIndex = (mesAtual - i + 12) % 12;
      const ano = mesIndex > mesAtual ? anoAtual - 1 : anoAtual;
      const key = `${ano}-${mesIndex}`;
      ultimos6Meses.push({
        mes: meses[mesIndex],
        mesNumero: mesIndex,
        ano: ano,
        recebido: pagamentosPorMes[key]?.recebido || 0,
        temPagamento: pagamentosPorMes[key]?.recebido > 0 || false
      });
    }

    return ultimos6Meses;
  }, [pagamentos]);

  // Filtrar pagamentos
  const pagamentosFiltrados = pagamentos.filter((p: PagamentoComAluno) => {
    const aluno = alunos.find((a: Aluno) => a.id === p.usuarioId);
    const matchesNome = filtroNome === "" || aluno?.nome?.toLowerCase().includes(filtroNome.toLowerCase());
    const matchesStatus = filtroStatus === "todos" || p.status === filtroStatus;
    
    let matchesData = true;
    if (filtroDataInicio && p.dataVencimento) {
      matchesData = new Date(p.dataVencimento) >= new Date(filtroDataInicio);
    }
    if (filtroDataFim && p.dataVencimento && matchesData) {
      matchesData = new Date(p.dataVencimento) <= new Date(filtroDataFim);
    }
    
    return matchesNome && matchesStatus && matchesData;
  });

  // Paginação
  const totalPaginas = Math.ceil(pagamentosFiltrados.length / itensPorPagina);
  const pagamentosPaginados = pagamentosFiltrados.slice(
    (paginaAtual - 1) * itensPorPagina,
    paginaAtual * itensPorPagina
  );

  // Calcular altura máxima para o gráfico
  const maxRecebido = Math.max(...dadosGrafico.map(d => d.recebido), 1);

  return (
    <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark">
      <Sidebar role="admin" />
      <main className="flex-1 flex flex-col overflow-y-auto ml-64">
        <Header title="Pagamentos" />

        <div className="p-8 space-y-6">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                Gestão de Pagamentos
              </h2>
              <p className="text-slate-500 dark:text-slate-400">
                Acompanhe e registre todas as transações financeiras.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowForm(true)}
                className="bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 shadow-lg shadow-primary/20 transition-all active:scale-95"
              >
                <span className="material-symbols-outlined text-[20px]">add_circle</span>
                Registrar Pagamento
              </button>
            </div>
          </div>

          {/* Modal de Novo Pagamento (mantido igual) */}
          {showForm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-slate-900 rounded-xl p-6 max-w-md w-full shadow-xl">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-xl font-bold text-slate-900 dark:text-white">Novo Pagamento</h4>
                  <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>

                <div className="space-y-4">
                  <select
                    className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-primary/20 focus:border-transparent"
                    value={usuarioId}
                    onChange={(e) => setUsuarioId(e.target.value)}
                  >
                    <option value="">Selecionar aluno...</option>
                    {alunos.map((a: Aluno) => (
                      <option key={a.id} value={a.id}>
                        {a.nome}
                      </option>
                    ))}
                  </select>
                  <input
                    className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-primary/20 focus:border-transparent"
                    placeholder="Descrição (ex: Mensalidade Março)"
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="number"
                      step="0.01"
                      className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-primary/20 focus:border-transparent"
                      placeholder="Valor (R$)"
                      value={valor}
                      onChange={(e) => setValor(e.target.value)}
                    />
                    <input
                      type="date"
                      className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-primary/20 focus:border-transparent"
                      placeholder="Vencimento"
                      value={vencimento}
                      onChange={(e) => setVencimento(e.target.value)}
                    />
                  </div>
                  <select
                    className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-primary/20 focus:border-transparent"
                    value={formaPagamento}
                    onChange={(e) => setFormaPagamento(e.target.value as any)}
                  >
                    <option value="pix">Pix</option>
                    <option value="cartao">Cartão</option>
                    <option value="boleto">Boleto</option>
                    <option value="dinheiro">Dinheiro</option>
                  </select>
                  {error && <p className="text-red-500 text-sm">{error}</p>}
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() =>
                        criar.mutate({
                          descricao,
                          valor: parseFloat(valor),
                          usuarioId: parseInt(usuarioId),
                          dataVencimento: vencimento,
                          formaPagamento,
                          status: "pendente",
                        })
                      }
                      disabled={criar.isPending}
                      className="flex-1 bg-primary hover:bg-primary/90 text-white py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
                    >
                      {criar.isPending ? "Salvando..." : "Salvar Pagamento"}
                    </button>
                    <button
                      onClick={() => setShowForm(false)}
                      className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 py-2.5 rounded-lg text-sm font-semibold transition-all"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-lg">
                  <span className="material-symbols-outlined">payments</span>
                </div>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded">
                  {stats.quantidadePagos} pagamentos
                </span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Total Arrecadado</p>
              <p className="text-2xl font-bold mt-1 tracking-tight">{fmt(stats.totalArrecadado)}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-lg">
                  <span className="material-symbols-outlined">pending_actions</span>
                </div>
                <span className="text-xs font-bold text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded">
                  {stats.quantidadePendentes} faturas
                </span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Pendentes</p>
              <p className="text-2xl font-bold mt-1 tracking-tight">{fmt(stats.pendentes)}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-rose-100 dark:bg-rose-900/30 text-rose-600 rounded-lg">
                  <span className="material-symbols-outlined">warning</span>
                </div>
                <span className="text-xs font-bold text-rose-600 bg-rose-50 dark:bg-rose-900/20 px-2 py-1 rounded">
                  {stats.atrasados} atrasados
                </span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Atrasados</p>
              <p className="text-2xl font-bold mt-1 tracking-tight">{fmt(stats.valorAtrasados)}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-primary/10 text-primary rounded-lg">
                  <span className="material-symbols-outlined">event_upcoming</span>
                </div>
                <span className="text-xs font-bold text-primary bg-primary/5 px-2 py-1 rounded">
                  Próximos 7 dias
                </span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Próximos Vencimentos</p>
              <p className="text-2xl font-bold mt-1 tracking-tight">{stats.proximosVencimentos} faturas</p>
            </div>
          </div>

          {/* Gráfico e Filtros */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Revenue Chart */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="font-bold text-lg">Receita Mensal</h3>
                  <p className="text-sm text-slate-500">Desempenho financeiro do semestre</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <span className="size-3 rounded-full bg-primary"></span>
                    <span className="text-xs font-medium text-slate-500">Recebido</span>
                  </div>
                </div>
              </div>

              {dadosGrafico.filter(d => d.recebido > 0).length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                  <span className="material-symbols-outlined text-5xl mb-2">bar_chart</span>
                  <p className="text-sm">Nenhum pagamento realizado ainda</p>
                  <p className="text-xs mt-1">Registre o primeiro pagamento para ver o gráfico</p>
                </div>
              ) : (
                <div className="flex items-end justify-between h-48 gap-4 px-2">
                  {dadosGrafico.map((item) => {
                    const altura = maxRecebido > 0 ? (item.recebido / maxRecebido) * 100 : 0;
                    
                    return (
                      <div key={`${item.ano}-${item.mes}`} className="flex-1 flex flex-col items-center gap-2 group">
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-t-lg relative flex flex-col justify-end overflow-hidden h-40">
                          {item.recebido > 0 ? (
                            <div
                              className="bg-primary w-full absolute bottom-0 transition-all duration-500 rounded-t-lg"
                              style={{ height: `${altura}%` }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center opacity-30">
                              <span className="material-symbols-outlined text-2xl">remove</span>
                            </div>
                          )}
                        </div>
                        <div className="text-center">
                          <span className="text-[11px] font-bold text-slate-400">{item.mes}/{item.ano.toString().slice(-2)}</span>
                          {item.recebido > 0 && (
                            <p className="text-[9px] text-emerald-600 font-medium">{fmt(item.recebido)}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Filtros */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 h-full">
              <h3 className="font-bold text-lg mb-4">Filtros Avançados</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">Nome do Aluno</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                      search
                    </span>
                    <input
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary/20"
                      placeholder="Buscar por nome..."
                      type="text"
                      value={filtroNome}
                      onChange={(e) => setFiltroNome(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">Período</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      className="bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-xs p-2 focus:ring-2 focus:ring-primary/20"
                      type="date"
                      value={filtroDataInicio}
                      onChange={(e) => setFiltroDataInicio(e.target.value)}
                      placeholder="Data início"
                    />
                    <input
                      className="bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-xs p-2 focus:ring-2 focus:ring-primary/20"
                      type="date"
                      value={filtroDataFim}
                      onChange={(e) => setFiltroDataFim(e.target.value)}
                      placeholder="Data fim"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">Status</label>
                  <select
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-sm py-2 focus:ring-2 focus:ring-primary/20"
                    value={filtroStatus}
                    onChange={(e) => setFiltroStatus(e.target.value as any)}
                  >
                    <option value="todos">Todos os Status</option>
                    <option value="pago">Pago</option>
                    <option value="pendente">Pendente</option>
                    <option value="atrasado">Atrasado</option>
                  </select>
                </div>
                <button
                  onClick={() => {
                    setFiltroNome("");
                    setFiltroDataInicio("");
                    setFiltroDataFim("");
                    setFiltroStatus("todos");
                  }}
                  className="w-full py-2 text-slate-500 font-medium text-xs hover:text-primary transition-colors"
                >
                  Limpar todos os filtros
                </button>
              </div>
            </div>
          </div>

          {/* Tabela de Pagamentos */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h3 className="font-bold">Histórico de Transações</h3>
              <div className="flex gap-2">
                <button className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-slate-400">
                  <span className="material-symbols-outlined">download</span>
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase text-[10px] font-black tracking-widest">
                    <th className="px-6 py-4">Aluno</th>
                    <th className="px-6 py-4">Descrição</th>
                    <th className="px-6 py-4">Valor</th>
                    <th className="px-6 py-4">Vencimento</th>
                    <th className="px-6 py-4">Forma de Pgto</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Ações</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                        Carregando...
                      </td>
                    </tr>
                  ) : pagamentosPaginados.length > 0 ? (
                    pagamentosPaginados.map((pag: PagamentoComAluno) => {
                      const aluno = alunos.find((a: Aluno) => a.id === pag.usuarioId);
                      const iniciais = aluno?.nome?.split(" ").map((n: string) => n[0]).join("").substring(0, 2) || "??";
                      const vencimentoDate = pag.dataVencimento ? new Date(pag.dataVencimento) : null;
                      const hoje = new Date();
                      const isAtrasado = pag.status === "pendente" && vencimentoDate && vencimentoDate < hoje;

                      return (
                        <tr key={pag.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                {iniciais}
                              </div>
                              <div>
                                <p className="text-sm font-semibold">{aluno?.nome || "Aluno"}</p>
                                <p className="text-[10px] text-slate-400">Cod: #{pag.id}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                            {pag.descricao}
                          </td>
                          <td className="px-6 py-4 font-bold text-sm text-slate-700 dark:text-slate-200">
                            {fmt(pag.valor)}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-500">
                            {vencimentoDate?.toLocaleDateString("pt-BR") || "—"}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              {formaPagamentoIcon(pag.formaPagamento || "pix")}
                              {formaPagamentoLabel(pag.formaPagamento || "pix")}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {isAtrasado && pag.status !== "pago" ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400">
                                ATRASADO
                              </span>
                            ) : (
                              statusBadge(pag.status)
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {pag.status !== "pago" ? (
                                <button
                                  onClick={() =>
                                    atualizar.mutate({
                                      id: pag.id,
                                      status: "pago",
                                      dataPagamento: new Date().toISOString(),
                                      formaPagamento: pag.formaPagamento || "pix",
                                    })
                                  }
                                  className="text-primary hover:underline text-xs font-bold"
                                >
                                  Marcar Pago
                                </button>
                              ) : (
                                <>
                                  <button
                                    onClick={() => {
                                      setPagamentoSelecionado(pag);
                                      setShowReciboModal(true);
                                    }}
                                    className="text-primary hover:underline text-xs font-bold"
                                  >
                                    Ver Recibo
                                  </button>
                                  <button
                                    onClick={() => {
                                      setPagamentoSelecionado(pag);
                                      setShowDeleteModal(true);
                                    }}
                                    disabled={isDeleting || deletar.isPending}
                                    className="text-red-500 hover:text-red-700 text-xs font-bold disabled:opacity-50"
                                  >
                                    Excluir
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                        Nenhum pagamento encontrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            {totalPaginas > 1 && (
              <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <p className="text-xs text-slate-500 font-medium">
                  Mostrando {(paginaAtual - 1) * itensPorPagina + 1}-
                  {Math.min(paginaAtual * itensPorPagina, pagamentosFiltrados.length)} de {pagamentosFiltrados.length} resultados
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPaginaAtual((p) => Math.max(1, p - 1))}
                    disabled={paginaAtual === 1}
                    className="size-8 flex items-center justify-center rounded border border-slate-200 dark:border-slate-700 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-lg">chevron_left</span>
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
                        className={`size-8 flex items-center justify-center rounded text-xs font-bold transition-colors ${
                          paginaAtual === pageNum
                            ? "bg-primary text-white"
                            : "border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setPaginaAtual((p) => Math.min(totalPaginas, p + 1))}
                    disabled={paginaAtual === totalPaginas}
                    className="size-8 flex items-center justify-center rounded border border-slate-200 dark:border-slate-700 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-lg">chevron_right</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modal de Recibo (mantido igual) */}
      {showReciboModal && pagamentoSelecionado && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 max-w-md w-full shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-xl font-bold text-slate-900 dark:text-white">Recibo de Pagamento</h4>
              <button onClick={() => setShowReciboModal(false)} className="text-slate-400 hover:text-slate-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-4">
              <div className="border-b border-slate-200 dark:border-slate-700 pb-3">
                <p className="text-xs text-slate-500">Aluno</p>
                <p className="font-semibold">
                  {alunos.find((a: Aluno) => a.id === pagamentoSelecionado.usuarioId)?.nome || "Aluno"}
                </p>
              </div>
              <div className="border-b border-slate-200 dark:border-slate-700 pb-3">
                <p className="text-xs text-slate-500">Descrição</p>
                <p className="font-semibold">{pagamentoSelecionado.descricao}</p>
              </div>
              <div className="border-b border-slate-200 dark:border-slate-700 pb-3">
                <p className="text-xs text-slate-500">Valor</p>
                <p className="text-2xl font-bold text-primary">{fmt(pagamentoSelecionado.valor)}</p>
              </div>
              <div className="border-b border-slate-200 dark:border-slate-700 pb-3">
                <p className="text-xs text-slate-500">Data do Pagamento</p>
                <p className="font-semibold">
                  {pagamentoSelecionado.dataPagamento 
                    ? new Date(pagamentoSelecionado.dataPagamento).toLocaleDateString("pt-BR")
                    : "—"}
                </p>
              </div>
              <div className="border-b border-slate-200 dark:border-slate-700 pb-3">
                <p className="text-xs text-slate-500">Forma de Pagamento</p>
                <p className="font-semibold capitalize">{pagamentoSelecionado.formaPagamento || "Pix"}</p>
              </div>
              {pagamentoSelecionado.comprovanteUrl && (
                <div className="pt-2">
                  <button
                    onClick={() => window.open(pagamentoSelecionado.comprovanteUrl, "_blank")}
                    className="w-full bg-slate-100 dark:bg-slate-800 text-primary py-2 rounded-lg text-sm font-semibold hover:bg-slate-200 transition-colors"
                  >
                    Ver Comprovante
                  </button>
                </div>
              )}
              <button
                onClick={() => {
                  window.print();
                }}
                className="w-full bg-primary text-white py-2.5 rounded-lg text-sm font-semibold transition-all hover:bg-primary/90"
              >
                Imprimir Recibo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmar Exclusão */}
      {showDeleteModal && pagamentoSelecionado && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 max-w-md w-full shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-xl font-bold text-slate-900 dark:text-white">Excluir Pagamento</h4>
              <button onClick={() => setShowDeleteModal(false)} className="text-slate-400 hover:text-slate-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-slate-600 dark:text-slate-400">
                Tem certeza que deseja excluir este pagamento?
              </p>
              <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg">
                <p className="text-sm font-medium">Detalhes do pagamento:</p>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  <strong>Aluno:</strong> {alunos.find((a: Aluno) => a.id === pagamentoSelecionado.usuarioId)?.nome || "Aluno"}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  <strong>Valor:</strong> {fmt(pagamentoSelecionado.valor)}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  <strong>Descrição:</strong> {pagamentoSelecionado.descricao}
                </p>
              </div>
              <p className="text-sm text-red-600 dark:text-red-400">
                Esta ação não pode ser desfeita.
              </p>
              
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => deletar.mutate(pagamentoSelecionado.id)}
                  disabled={deletar.isPending || isDeleting}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
                >
                  {deletar.isPending ? "Excluindo..." : "Excluir"}
                </button>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 py-2.5 rounded-lg text-sm font-semibold transition-all"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
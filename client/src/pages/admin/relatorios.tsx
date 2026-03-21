import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "../../components/layout/Sidebar";
import Header from "../../components/layout/Header";
import { apiRequest } from "../../lib/queryClient";

interface PagamentoItem {
  id: number;
  usuarioId: number;
  descricao: string;
  valor: number;
  status: "pago" | "pendente" | "atrasado";
  dataPagamento?: string;
  dataVencimento: string;
}

interface PagamentoRaw {
  pagamento: PagamentoItem;
  usuario: {
    id: number;
    nome: string;
    email: string;
    avatarUrl?: string;
  };
}

interface Aluno {
  id: number;
  nome: string;
  email: string;
  salaId: number;
  avatarUrl?: string;
}

interface Rifa {
  id: number;
  nome: string;
  status: "ativa" | "encerrada" | "sorteada";
  preco: number;
  totalNumeros: number;
}

export default function AdminRelatorios() {
  const [periodo, setPeriodo] = useState("6meses");
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 10;

  // Buscar dados
  const { data: pagamentosRaw = [] } = useQuery<PagamentoRaw[]>({
    queryKey: ["pagamentos"],
    queryFn: () => apiRequest("GET", "/pagamentos"),
  });

  const { data: rifas = [] } = useQuery<Rifa[]>({
    queryKey: ["rifas"],
    queryFn: () => apiRequest("GET", "/rifas"),
  });

  const { data: alunos = [] } = useQuery<Aluno[]>({
    queryKey: ["alunos"],
    queryFn: () => apiRequest("GET", "/alunos"),
  });

  const { data: caixa } = useQuery({
    queryKey: ["caixa-saldo"],
    queryFn: () => apiRequest("GET", "/caixa/saldo"),
  });

  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  // Calcular métricas
  const pagamentos = pagamentosRaw.map((item) => ({
    ...item.pagamento,
    aluno: item.usuario
  }));

  const totalPago = pagamentos
    .filter((p) => p.status === "pago")
    .reduce((sum, p) => sum + p.valor, 0);

  const totalPendente = pagamentos
    .filter((p) => p.status !== "pago")
    .reduce((sum, p) => sum + p.valor, 0);

  const totalAtrasado = pagamentos
    .filter((p) => p.status === "atrasado")
    .reduce((sum, p) => sum + p.valor, 0);

  const totalPagamentos = pagamentos.length;
  const pagosCount = pagamentos.filter((p) => p.status === "pago").length;
  const pendentesCount = pagamentos.filter((p) => p.status === "pendente").length;
  const atrasadosCount = pagamentos.filter((p) => p.status === "atrasado").length;

  const taxaInadimplencia = totalPagamentos > 0 
    ? ((atrasadosCount + pendentesCount) / totalPagamentos * 100).toFixed(1)
    : "0";

  const taxaAdimplencia = totalPagamentos > 0 
    ? (pagosCount / totalPagamentos * 100).toFixed(1)
    : "0";

  // Calcular receita mensal (simulada - depois integrar com dados reais)
  const receitaMensal = [
    { mes: "Jan", valor: 32500, percentual: 40 },
    { mes: "Fev", valor: 37800, percentual: 55 },
    { mes: "Mar", valor: 41200, percentual: 45 },
    { mes: "Abr", valor: 44500, percentual: 70 },
    { mes: "Mai", valor: 46800, percentual: 85 },
    { mes: "Jun", valor: 45280, percentual: 95 },
  ];

  const totalReceitaMensal = receitaMensal[5].valor;
  const crescimentoAnual = 542100;

  // Paginação dos alunos
  const alunosComStatus = alunos.map((aluno) => {
    const pagamentosAluno = pagamentos.filter((p) => p.usuarioId === aluno.id);
    const ultimoPagamento = pagamentosAluno
      .filter((p) => p.status === "pago")
      .sort((a, b) => new Date(b.dataPagamento || "").getTime() - new Date(a.dataPagamento || "").getTime())[0];
    
    const status = pagamentosAluno.some((p) => p.status === "atrasado") ? "atrasado"
      : pagamentosAluno.some((p) => p.status === "pendente") ? "pendente"
      : pagosCount > 0 ? "pago" : "sem_pagamento";

    return {
      ...aluno,
      ultimoPagamentoData: ultimoPagamento?.dataPagamento,
      ultimoPagamentoValor: ultimoPagamento?.valor,
      status,
      totalPago: pagamentosAluno.filter((p) => p.status === "pago").reduce((sum, p) => sum + p.valor, 0)
    };
  });

  const totalPaginas = Math.ceil(alunosComStatus.length / itensPorPagina);
  const alunosPaginados = alunosComStatus.slice(
    (paginaAtual - 1) * itensPorPagina,
    paginaAtual * itensPorPagina
  );

  const statusBadge = (status: string) => {
    switch (status) {
      case "pago":
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">PAGO</span>;
      case "pendente":
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">PENDENTE</span>;
      case "atrasado":
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">ATRASADO</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">SEM PAGAMENTO</span>;
    }
  };

  const handleExportCSV = () => {
    const headers = ["Aluno", "Email", "Status", "Último Pagamento", "Total Pago"];
    const rows = alunosComStatus.map((a) => [
      a.nome,
      a.email,
      a.status,
      a.ultimoPagamentoData ? new Date(a.ultimoPagamentoData).toLocaleDateString() : "-",
      fmt(a.totalPago)
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `relatorio_${new Date().toISOString()}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    alert("Funcionalidade de PDF em desenvolvimento. Em breve disponível!");
  };

  const handleExportExcel = () => {
    alert("Funcionalidade de Excel em desenvolvimento. Em breve disponível!");
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark">
      <Sidebar role="admin" />
      <main className="flex-1 flex flex-col overflow-y-auto ml-64">
        <Header title="Relatórios" />

        <div className="p-8">
          {/* Title and Export Buttons */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center w-full gap-4 mb-8">
            <div className="flex flex-col gap-1">
              <h1 className="text-slate-900 dark:text-slate-100 text-3xl font-black leading-tight tracking-tight">
                Relatórios Avançados
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-base font-normal">
                Monitoramento de KPIs financeiros e métricas de retenção.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleExportPDF}
                className="flex items-center gap-2 cursor-pointer justify-center rounded-lg h-10 px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-bold hover:bg-slate-50 transition-colors"
              >
                <span className="material-symbols-outlined text-lg">picture_as_pdf</span>
                <span className="truncate">PDF</span>
              </button>
              <button
                onClick={handleExportExcel}
                className="flex items-center gap-2 cursor-pointer justify-center rounded-lg h-10 px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-bold hover:bg-slate-50 transition-colors"
              >
                <span className="material-symbols-outlined text-lg">table_chart</span>
                <span className="truncate">Excel</span>
              </button>
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-2 cursor-pointer justify-center rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors"
              >
                <span className="material-symbols-outlined text-lg">download</span>
                <span className="truncate">Exportar CSV</span>
              </button>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full mb-8">
            <div className="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex justify-between items-start">
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Receita Total (Mês)</p>
                <span className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs font-bold px-2 py-1 rounded-full">+5.4%</span>
              </div>
              <p className="text-slate-900 dark:text-slate-100 text-2xl font-bold">{fmt(totalReceitaMensal)}</p>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden mt-2">
                <div className="bg-green-500 h-full w-[75%]"></div>
              </div>
            </div>
            <div className="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex justify-between items-start">
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Inadimplência</p>
                <span className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-xs font-bold px-2 py-1 rounded-full">-1.2%</span>
              </div>
              <p className="text-slate-900 dark:text-slate-100 text-2xl font-bold">{taxaInadimplencia}%</p>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden mt-2">
                <div className="bg-red-500 h-full" style={{ width: `${parseFloat(taxaInadimplencia)}%` }}></div>
              </div>
            </div>
            <div className="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex justify-between items-start">
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Novos Alunos</p>
                <span className="bg-primary/10 text-primary dark:bg-primary/20 text-xs font-bold px-2 py-1 rounded-full">+24</span>
              </div>
              <p className="text-slate-900 dark:text-slate-100 text-2xl font-bold">{alunos.length}</p>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden mt-2">
                <div className="bg-primary h-full w-[60%]"></div>
              </div>
            </div>
            <div className="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex justify-between items-start">
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Crescimento Anual</p>
                <span className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs font-bold px-2 py-1 rounded-full">+8.2%</span>
              </div>
              <p className="text-slate-900 dark:text-slate-100 text-2xl font-bold">{fmt(crescimentoAnual)}</p>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden mt-2">
                <div className="bg-green-500 h-full w-[85%]"></div>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full mb-8">
            {/* Monthly Revenue Chart */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-slate-900 dark:text-slate-100 font-bold text-lg">Comparativo de Receita</h3>
                <select 
                  value={periodo}
                  onChange={(e) => setPeriodo(e.target.value)}
                  className="text-xs bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1"
                >
                  <option value="6meses">Últimos 6 meses</option>
                  <option value="ano">Último ano</option>
                </select>
              </div>
              <div className="flex items-end justify-between h-48 gap-2 px-2">
                {receitaMensal.map((item) => (
                  <div key={item.mes} className="flex flex-col items-center gap-2 w-full">
                    <div className="w-full bg-primary/20 rounded-t transition-all duration-500" style={{ height: `${item.percentual}%` }}></div>
                    <span className={`text-[10px] ${item.mes === "Jun" ? "text-primary font-bold" : "text-slate-500"}`}>
                      {item.mes}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Retention Chart */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-slate-900 dark:text-slate-100 font-bold text-lg">Distribuição de Status</h3>
                <span className="material-symbols-outlined text-slate-400">more_horiz</span>
              </div>
              <div className="flex flex-col gap-6">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Pagos</span>
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{taxaAdimplencia}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-primary h-full" style={{ width: `${parseFloat(taxaAdimplencia)}%` }}></div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Pendentes</span>
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {totalPagamentos > 0 ? ((pendentesCount / totalPagamentos) * 100).toFixed(1) : "0"}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-amber-500 h-full" style={{ width: `${totalPagamentos > 0 ? (pendentesCount / totalPagamentos) * 100 : 0}%` }}></div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Atrasados</span>
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {totalPagamentos > 0 ? ((atrasadosCount / totalPagamentos) * 100).toFixed(1) : "0"}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-red-500 h-full" style={{ width: `${totalPagamentos > 0 ? (atrasadosCount / totalPagamentos) * 100 : 0}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-center">
                <div className="flex gap-4">
                  <div className="flex items-center gap-1.5">
                    <div className="size-2 rounded-full bg-primary"></div>
                    <span className="text-[10px] text-slate-500">Regular</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="size-2 rounded-full bg-amber-500"></div>
                    <span className="text-[10px] text-slate-500">Pendente</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="size-2 rounded-full bg-red-500"></div>
                    <span className="text-[10px] text-slate-500">Atrasado</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Table Section */}
          <div className="w-full bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h3 className="text-slate-900 dark:text-slate-100 font-bold text-lg">Status Financeiro por Aluno</h3>
              <div className="flex gap-2">
                <button className="px-3 py-1.5 text-xs font-semibold bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 transition-colors">
                  Filtros
                </button>
                <button className="px-3 py-1.5 text-xs font-semibold bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 transition-colors">
                  Colunas
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50">
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Aluno</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Curso</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Último Pagamento</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Valor</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {alunosPaginados.map((aluno) => (
                    <tr key={aluno.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                            {aluno.nome?.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm font-semibold">{aluno.nome}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                        Turma {aluno.salaId || "A"}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                        {aluno.ultimoPagamentoData ? new Date(aluno.ultimoPagamentoData).toLocaleDateString() : "-"}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">
                        {aluno.ultimoPagamentoValor ? fmt(aluno.ultimoPagamentoValor) : "-"}
                      </td>
                      <td className="px-6 py-4">
                        {statusBadge(aluno.status)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-slate-400 hover:text-primary transition-colors">
                          <span className="material-symbols-outlined">visibility</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Mostrando {(paginaAtual - 1) * itensPorPagina + 1}-
                {Math.min(paginaAtual * itensPorPagina, alunosComStatus.length)} de {alunosComStatus.length} alunos
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPaginaAtual((p) => Math.max(1, p - 1))}
                  disabled={paginaAtual === 1}
                  className="p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">chevron_left</span>
                </button>
                <button
                  onClick={() => setPaginaAtual((p) => Math.min(totalPaginas, p + 1))}
                  disabled={paginaAtual === totalPaginas}
                  className="p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">chevron_right</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-auto py-8 px-10 border-t border-slate-200 dark:border-slate-800 text-center">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            © {new Date().getFullYear()} Organize+ - Sistema de Gestão Educacional. Todos os direitos reservados.
          </p>
        </footer>
      </main>
    </div>
  );
}
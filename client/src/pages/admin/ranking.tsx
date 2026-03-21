import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "../../components/layout/Sidebar";
import Header from "../../components/layout/Header";
import { apiRequest } from "../../lib/queryClient";

interface Aluno {
  id: number;
  nome: string;
  email: string;
  salaId: number;
  avatarUrl?: string;
}

interface PagamentoItem {
  id: number;
  usuarioId: number;
  descricao: string;
  valor: number;
  status: string;
  dataPagamento?: string;
  dataVencimento: string;
}

interface PagamentoRaw {
  pagamento: PagamentoItem;
  usuario: Aluno;
}

interface Ticket {
  id: number;
  rifaId: number;
  vendedorId: number;
  compradorNome: string;
  valor: number;
  status: string;
  vendedorNome?: string;
}

interface AlunoRanking extends Aluno {
  totalVendas: number;
  quantidadeVendas: number;
  totalPago: number;
  quantidadePagamentos: number;
  turma?: string;
  diasAtraso?: number;
  ultimoPagamento?: string;
  totalDevido?: number;
}

interface Inadimplente extends Aluno {
  totalDevido: number;
  diasAtraso: number;
  turma: string;
}

// Componente de Medalha SVG
const MedalIcon = ({ position }: { position: number }) => {
  const colors = {
    1: { bg: "#FBBF24", gradient: "from-amber-400 to-amber-600", text: "text-amber-700" },
    2: { bg: "#9CA3AF", gradient: "from-gray-400 to-gray-600", text: "text-gray-700" },
    3: { bg: "#CD7F32", gradient: "from-orange-400 to-orange-600", text: "text-orange-700" }
  };
  
  const color = colors[position as 1 | 2 | 3];
  
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M24 4L28 12L36 14L30 22L32 30L24 26L16 30L18 22L12 14L20 12L24 4Z" 
        fill={color?.bg} stroke={color?.bg} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="24" cy="24" r="8" fill="white" stroke={color?.bg} strokeWidth="2"/>
      <text x="24" y="28" textAnchor="middle" fill={color?.text} fontSize="14" fontWeight="bold">
        {position}
      </text>
    </svg>
  );
};

// Componente de Troféu
const TrophyIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 4H24V8C24 12 20 16 16 16C12 16 8 12 8 8V4Z" fill="#FBBF24" stroke="#D97706" strokeWidth="1.5"/>
    <path d="M6 8H26V12C26 14 24 16 22 16H10C8 16 6 14 6 12V8Z" fill="#F59E0B" stroke="#D97706" strokeWidth="1.5"/>
    <rect x="14" y="16" width="4" height="12" fill="#FBBF24" stroke="#D97706" strokeWidth="1.5"/>
    <path d="M12 28H20" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="16" cy="24" r="2" fill="#F59E0B"/>
  </svg>
);

// Componente de Estrela
const StarIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 1L12.5 7L19 7.5L14 12L15.5 19L10 15L4.5 19L6 12L1 7.5L7.5 7L10 1Z" 
      fill="#FBBF24" stroke="#D97706" strokeWidth="1"/>
  </svg>
);

export default function AdminRanking() {
  const [abaAtiva, setAbaAtiva] = useState<"vendas" | "pagadores" | "engajamento">("vendas");
  const [gerandoRelatorio, setGerandoRelatorio] = useState(false);

  // Buscar alunos
  const { data: alunos = [] } = useQuery<Aluno[]>({
    queryKey: ["alunos"],
    queryFn: () => apiRequest("GET", "/alunos"),
  });

  // Buscar pagamentos
  const { data: pagamentosRaw = [] } = useQuery<PagamentoRaw[]>({
    queryKey: ["pagamentos"],
    queryFn: () => apiRequest("GET", "/pagamentos"),
  });

  // Transformar pagamentos
  const pagamentos: PagamentoItem[] = pagamentosRaw.map((item: PagamentoRaw) => ({
    ...item.pagamento,
    aluno: item.usuario
  }));

  // Buscar tickets (rifas vendidas)
  const { data: tickets = [] } = useQuery<Ticket[]>({
    queryKey: ["tickets"],
    queryFn: () => apiRequest("GET", "/rifas/tickets"),
  });

  // Calcular ranking de vendas (rifas)
  const rankingVendas: AlunoRanking[] = alunos.map((aluno: Aluno) => {
    const vendasDoAluno = tickets.filter((t: Ticket) => t.vendedorId === aluno.id && t.status === "pago");
    const totalVendas = vendasDoAluno.reduce((sum: number, t: Ticket) => sum + t.valor, 0);
    const quantidadeVendas = vendasDoAluno.length;
    
    return {
      ...aluno,
      totalVendas,
      quantidadeVendas,
      totalPago: 0,
      quantidadePagamentos: 0,
      turma: `Turma ${aluno.salaId || 'A'}`
    };
  }).sort((a: AlunoRanking, b: AlunoRanking) => b.totalVendas - a.totalVendas);

  // Calcular ranking de maiores pagadores
  const rankingPagadores: AlunoRanking[] = alunos.map((aluno: Aluno) => {
    const pagamentosDoAluno = pagamentos.filter((p: PagamentoItem) => p.usuarioId === aluno.id && p.status === "pago");
    const totalPago = pagamentosDoAluno.reduce((sum: number, p: PagamentoItem) => sum + p.valor, 0);
    const quantidadePagamentos = pagamentosDoAluno.length;
    
    return {
      ...aluno,
      totalVendas: 0,
      quantidadeVendas: 0,
      totalPago,
      quantidadePagamentos,
      turma: `Turma ${aluno.salaId || 'A'}`
    };
  }).sort((a: AlunoRanking, b: AlunoRanking) => b.totalPago - a.totalPago);

  // Calcular inadimplentes
  const inadimplentes: Inadimplente[] = alunos
    .map((aluno: Aluno) => {
      const pagamentosPendentes = pagamentos.filter((p: PagamentoItem) => p.usuarioId === aluno.id && p.status !== "pago");
      const totalDevido = pagamentosPendentes.reduce((sum: number, p: PagamentoItem) => sum + p.valor, 0);
      
      let diasAtraso = 0;
      
      const ultimoPagamentoObj = pagamentos
        .filter((p: PagamentoItem) => p.usuarioId === aluno.id && p.status === "pago")
        .sort((a: PagamentoItem, b: PagamentoItem) => 
          new Date(b.dataPagamento || "").getTime() - new Date(a.dataPagamento || "").getTime()
        )[0];
      
      if (ultimoPagamentoObj?.dataPagamento) {
        const hoje = new Date();
        const ultimo = new Date(ultimoPagamentoObj.dataPagamento);
        diasAtraso = Math.floor((hoje.getTime() - ultimo.getTime()) / (1000 * 60 * 60 * 24));
      }
      
      return {
        ...aluno,
        totalDevido,
        diasAtraso: diasAtraso > 0 ? diasAtraso : 0,
        ultimoPagamento: ultimoPagamentoObj?.dataPagamento,
        turma: `Turma ${aluno.salaId || 'A'}`
      };
    })
    .filter((a: Inadimplente) => a.totalDevido > 0)
    .sort((a: Inadimplente, b: Inadimplente) => b.totalDevido - a.totalDevido);

  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const handleGerarRelatorio = async () => {
    setGerandoRelatorio(true);
    try {
      alert("Relatório em desenvolvimento. Em breve você poderá exportar em PDF!");
    } catch (error) {
      console.error("Erro ao gerar relatório:", error);
    } finally {
      setGerandoRelatorio(false);
    }
  };

  const handleAtualizar = () => {
    window.location.reload();
  };

  // Top 3 de cada ranking
  const top3Vendas = rankingVendas.slice(0, 3);
  const top3Pagadores = rankingPagadores.slice(0, 3);

  return (
    <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark">
      <Sidebar role="admin" />
      <main className="flex-1 flex flex-col overflow-y-auto ml-64">
        <Header title="Ranking" />

        <div className="p-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                Performance Acadêmica
              </h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1">
                Gestão de engajamento, vendas e regularidade financeira.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleGerarRelatorio}
                disabled={gerandoRelatorio}
                className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-lg">download</span>
                {gerandoRelatorio ? "Gerando..." : "Relatório PDF"}
              </button>
              <button
                onClick={handleAtualizar}
                className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors"
              >
                Atualizar Dados
              </button>
            </div>
          </div>

          {/* Pódio - Top 3 */}
          {top3Vendas.length >= 3 && abaAtiva === "vendas" && (
            <div className="mb-12">
              <div className="flex justify-center items-end gap-4">
                {/* 2º Lugar */}
                <div className="flex flex-col items-center order-1">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center overflow-hidden border-4 border-gray-300 dark:border-gray-600 shadow-lg">
                      {top3Vendas[1]?.avatarUrl ? (
                        <img src={top3Vendas[1].avatarUrl} alt={top3Vendas[1].nome} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-3xl font-bold text-gray-500 dark:text-gray-400">
                          {top3Vendas[1]?.nome?.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="absolute -top-4 -right-4">
                      <MedalIcon position={2} />
                    </div>
                  </div>
                  <div className="mt-3 text-center">
                    <p className="font-bold text-slate-900 dark:text-white">{top3Vendas[1]?.nome}</p>
                    <p className="text-xs text-slate-500">{top3Vendas[1]?.turma}</p>
                    <p className="text-sm font-bold text-primary mt-1">{fmt(top3Vendas[1]?.totalVendas || 0)}</p>
                  </div>
                  <div className="mt-2 w-20 h-16 bg-gray-200 dark:bg-gray-700 rounded-t-lg flex items-center justify-center">
                    <span className="text-xs font-bold text-gray-500">2º Lugar</span>
                  </div>
                </div>

                {/* 1º Lugar */}
                <div className="flex flex-col items-center order-2 -mt-4">
                  <div className="relative">
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-800 dark:to-amber-900 flex items-center justify-center overflow-hidden border-4 border-amber-400 shadow-xl">
                      {top3Vendas[0]?.avatarUrl ? (
                        <img src={top3Vendas[0].avatarUrl} alt={top3Vendas[0].nome} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-4xl font-bold text-amber-600 dark:text-amber-300">
                          {top3Vendas[0]?.nome?.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="absolute -top-6 -right-4">
                      <MedalIcon position={1} />
                    </div>
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
                      <TrophyIcon />
                    </div>
                  </div>
                  <div className="mt-4 text-center">
                    <p className="font-bold text-xl text-slate-900 dark:text-white">{top3Vendas[0]?.nome}</p>
                    <p className="text-xs text-slate-500">{top3Vendas[0]?.turma}</p>
                    <p className="text-lg font-bold text-primary mt-1">{fmt(top3Vendas[0]?.totalVendas || 0)}</p>
                  </div>
                  <div className="mt-2 w-28 h-20 bg-gradient-to-t from-amber-400 to-amber-500 rounded-t-lg flex items-center justify-center">
                    <span className="text-xs font-bold text-white">🏆 CAMPEÃO</span>
                  </div>
                </div>

                {/* 3º Lugar */}
                <div className="flex flex-col items-center order-3">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-800 dark:to-orange-900 flex items-center justify-center overflow-hidden border-4 border-orange-300 dark:border-orange-600 shadow-lg">
                      {top3Vendas[2]?.avatarUrl ? (
                        <img src={top3Vendas[2].avatarUrl} alt={top3Vendas[2].nome} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-3xl font-bold text-orange-600 dark:text-orange-300">
                          {top3Vendas[2]?.nome?.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="absolute -top-4 -right-4">
                      <MedalIcon position={3} />
                    </div>
                  </div>
                  <div className="mt-3 text-center">
                    <p className="font-bold text-slate-900 dark:text-white">{top3Vendas[2]?.nome}</p>
                    <p className="text-xs text-slate-500">{top3Vendas[2]?.turma}</p>
                    <p className="text-sm font-bold text-primary mt-1">{fmt(top3Vendas[2]?.totalVendas || 0)}</p>
                  </div>
                  <div className="mt-2 w-20 h-14 bg-orange-200 dark:bg-orange-800 rounded-t-lg flex items-center justify-center">
                    <span className="text-xs font-bold text-orange-600 dark:text-orange-300">3º Lugar</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Pódio para Pagadores */}
          {top3Pagadores.length >= 3 && abaAtiva === "pagadores" && (
            <div className="mb-12">
              <div className="flex justify-center items-end gap-4">
                <div className="flex flex-col items-center order-1">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center overflow-hidden border-4 border-gray-300 shadow-lg">
                      {top3Pagadores[1]?.avatarUrl ? (
                        <img src={top3Pagadores[1].avatarUrl} alt={top3Pagadores[1].nome} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-3xl font-bold text-gray-500">
                          {top3Pagadores[1]?.nome?.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="absolute -top-4 -right-4">
                      <MedalIcon position={2} />
                    </div>
                  </div>
                  <div className="mt-3 text-center">
                    <p className="font-bold">{top3Pagadores[1]?.nome}</p>
                    <p className="text-xs text-slate-500">{top3Pagadores[1]?.turma}</p>
                    <p className="text-sm font-bold text-emerald-600 mt-1">{fmt(top3Pagadores[1]?.totalPago || 0)}</p>
                  </div>
                </div>
                <div className="flex flex-col items-center order-2 -mt-4">
                  <div className="relative">
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-800 dark:to-emerald-900 flex items-center justify-center overflow-hidden border-4 border-emerald-400 shadow-xl">
                      {top3Pagadores[0]?.avatarUrl ? (
                        <img src={top3Pagadores[0].avatarUrl} alt={top3Pagadores[0].nome} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-4xl font-bold text-emerald-600">
                          {top3Pagadores[0]?.nome?.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="absolute -top-6 -right-4">
                      <MedalIcon position={1} />
                    </div>
                  </div>
                  <div className="mt-4 text-center">
                    <p className="font-bold text-xl">{top3Pagadores[0]?.nome}</p>
                    <p className="text-xs text-slate-500">{top3Pagadores[0]?.turma}</p>
                    <p className="text-lg font-bold text-emerald-600 mt-1">{fmt(top3Pagadores[0]?.totalPago || 0)}</p>
                  </div>
                </div>
                <div className="flex flex-col items-center order-3">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-800 dark:to-orange-900 flex items-center justify-center overflow-hidden border-4 border-orange-300 shadow-lg">
                      {top3Pagadores[2]?.avatarUrl ? (
                        <img src={top3Pagadores[2].avatarUrl} alt={top3Pagadores[2].nome} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-3xl font-bold text-orange-600">
                          {top3Pagadores[2]?.nome?.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="absolute -top-4 -right-4">
                      <MedalIcon position={3} />
                    </div>
                  </div>
                  <div className="mt-3 text-center">
                    <p className="font-bold">{top3Pagadores[2]?.nome}</p>
                    <p className="text-xs text-slate-500">{top3Pagadores[2]?.turma}</p>
                    <p className="text-sm font-bold text-emerald-600 mt-1">{fmt(top3Pagadores[2]?.totalPago || 0)}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 mb-8 overflow-x-auto">
            <button
              onClick={() => setAbaAtiva("vendas")}
              className={`px-6 py-3 text-sm font-bold whitespace-nowrap transition-colors ${
                abaAtiva === "vendas"
                  ? "text-primary border-b-2 border-primary"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              Vendas de Rifa
            </button>
            <button
              onClick={() => setAbaAtiva("pagadores")}
              className={`px-6 py-3 text-sm font-bold whitespace-nowrap transition-colors ${
                abaAtiva === "pagadores"
                  ? "text-primary border-b-2 border-primary"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              Maiores Pagadores
            </button>
            <button
              onClick={() => setAbaAtiva("engajamento")}
              className={`px-6 py-3 text-sm font-bold whitespace-nowrap transition-colors ${
                abaAtiva === "engajamento"
                  ? "text-primary border-b-2 border-primary"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              Engajamento Escolar
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Coluna Principal */}
            <div className="lg:col-span-2 space-y-6">
              {/* Tabela de Ranking */}
              <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <StarIcon />
                    {abaAtiva === "vendas" ? "Top 10 Vendedores de Rifa" : 
                     abaAtiva === "pagadores" ? "Top 10 Maiores Pagadores" : 
                     "Top 10 Mais Engajados"}
                  </h3>
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-widest">
                    {new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="text-xs uppercase text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800">
                        <th className="px-6 py-4 w-16">Pos</th>
                        <th className="px-6 py-4">Aluno</th>
                        <th className="px-6 py-4">Turma</th>
                        <th className="px-6 py-4 text-right">
                          {abaAtiva === "vendas" ? "Qtd. Rifas" : "Qtd. Pagamentos"}
                        </th>
                        <th className="px-6 py-4 text-right">
                          {abaAtiva === "vendas" ? "Total (R$)" : "Total Pago (R$)"}
                        </th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                      {(abaAtiva === "vendas" ? rankingVendas : rankingPagadores).slice(0, 10).map((aluno: AlunoRanking, i: number) => {
                        const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : null;
                        const isTop3 = i < 3;
                        
                        return (
                          <tr key={aluno.id} className="hover:bg-primary/5 transition-colors group">
                            <td className="px-6 py-4">
                              {medal ? (
                                <div className={`size-8 rounded-full flex items-center justify-center text-lg ${
                                  i === 0 ? "bg-amber-100" : i === 1 ? "bg-gray-100" : "bg-orange-100"
                                }`}>
                                  {medal}
                                </div>
                              ) : (
                                <span className="ml-2 font-bold text-slate-400">{i + 1}º</span>
                              )}
                              </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="size-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm overflow-hidden">
                                  {aluno.avatarUrl ? (
                                    <img src={aluno.avatarUrl} alt={aluno.nome} className="w-full h-full object-cover" />
                                  ) : (
                                    aluno.nome?.charAt(0).toUpperCase()
                                  )}
                                </div>
                                <span className={`font-bold ${isTop3 ? "text-primary" : "text-slate-700 dark:text-slate-300"}`}>
                                  {aluno.nome}
                                </span>
                              </div>
                              </td>
                            <td className="px-6 py-4 text-slate-500 text-sm font-medium">
                              {aluno.turma || `Turma ${aluno.salaId || 'A'}`}
                              </td>
                            <td className="px-6 py-4 text-right font-bold">
                              {abaAtiva === "vendas" ? aluno.quantidadeVendas : aluno.quantidadePagamentos}
                              </td>
                            <td className="px-6 py-4 text-right text-emerald-600 font-bold">
                              {fmt(abaAtiva === "vendas" ? aluno.totalVendas : aluno.totalPago)}
                              </td>
                            </tr>
                        );
                      })}
                      {((abaAtiva === "vendas" ? rankingVendas : rankingPagadores).length === 0) && (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                            Nenhum dado disponível.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>

            {/* Sidebar - Inadimplentes */}
            <div className="space-y-6">
              <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden border-t-4 border-t-red-500">
                <div className="p-5 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="font-bold text-lg flex items-center gap-2 text-slate-800 dark:text-white">
                    <span className="material-symbols-outlined text-red-500">warning</span>
                    Alunos Inadimplentes
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">Atrasos superiores a 15 dias</p>
                </div>
                <div className="p-0">
                  {inadimplentes.slice(0, 5).length > 0 ? (
                    inadimplentes.slice(0, 5).map((aluno: Inadimplente) => (
                      <div key={aluno.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-b border-slate-50 dark:border-slate-800">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-bold text-sm">{aluno.nome}</h4>
                            <p className="text-xs text-slate-500">{aluno.turma}</p>
                          </div>
                          <span className="text-xs font-black text-red-600">{fmt(aluno.totalDevido)}</span>
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                            aluno.diasAtraso > 30 ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"
                          }`}>
                            {aluno.diasAtraso} dias de atraso
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-slate-400">
                      <span className="material-symbols-outlined text-4xl mb-2">check_circle</span>
                      <p>Nenhum aluno inadimplente</p>
                    </div>
                  )}
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/30">
                  <button className="w-full bg-slate-900 text-white py-2 rounded-lg text-xs font-bold hover:bg-black transition-colors">
                    Gerar Cobrança em Massa
                  </button>
                </div>
              </section>

              {/* Stats Card */}
              <section className="bg-primary text-white rounded-xl p-6 shadow-lg relative overflow-hidden">
                <div className="relative z-10">
                  <h3 className="font-bold text-sm uppercase tracking-widest opacity-80 mb-4">Média Global</h3>
                  <div className="flex items-end gap-2 mb-2">
                    <span className="text-4xl font-black">
                      {(() => {
                        const totalPagos = rankingPagadores.reduce((sum: number, a: AlunoRanking) => sum + a.totalPago, 0);
                        const totalEsperado = rankingPagadores.reduce((sum: number, a: AlunoRanking) => sum + (a.totalPago * 1.2), 0);
                        const percentual = totalEsperado > 0 ? (totalPagos / totalEsperado) * 100 : 0;
                        return `${Math.round(percentual)}%`;
                      })()}
                    </span>
                    <span className="text-emerald-400 font-bold text-sm pb-1 flex items-center">
                      <span className="material-symbols-outlined text-sm">arrow_upward</span>
                      2.1%
                    </span>
                  </div>
                  <p className="text-xs text-primary-200 leading-relaxed opacity-70">
                    A taxa de adimplência da instituição está acima da meta trimestral.
                  </p>
                  <div className="mt-6 pt-6 border-t border-white/10">
                    <div className="flex justify-between text-xs mb-2">
                      <span>Meta de Arrecadação</span>
                      <span className="font-bold">R$ 200k</span>
                    </div>
                    <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, (rankingPagadores.reduce((sum: number, a: AlunoRanking) => sum + a.totalPago, 0) / 200000) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                <div className="absolute -right-10 -bottom-10 opacity-10">
                  <span className="material-symbols-outlined text-[160px]">stars</span>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
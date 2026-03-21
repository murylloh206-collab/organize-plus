import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import Sidebar from "../../components/layout/Sidebar";
import Header from "../../components/layout/Header";
import { apiRequest } from "../../lib/queryClient";
import { useAuth } from "../../hooks/useAuth";

function CircleProgress({ percent }: { percent: number }) {
  const r = 70;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;
  
  return (
    <div className="relative w-40 h-40 flex items-center justify-center mb-4">
      <svg className="w-full h-full transform -rotate-90">
        <circle
          className="text-slate-100 dark:text-slate-800"
          cx="80"
          cy="80"
          fill="transparent"
          r={r}
          stroke="currentColor"
          strokeWidth="12"
        />
        <circle
          className="text-primary transition-all duration-500"
          cx="80"
          cy="80"
          fill="transparent"
          r={r}
          stroke="currentColor"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          strokeWidth="12"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-black">{Math.round(percent)}%</span>
        <span className="text-xs text-slate-500">Quitado</span>
      </div>
    </div>
  );
}

export default function AlunoDashboard() {
  const { auth } = useAuth();
  const [hideValues, setHideValues] = useState(false);

  // Buscar dados do aluno
  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: () => apiRequest("GET", "/alunos/me"),
    enabled: !!auth,
  });

  // Buscar pagamentos do aluno
  const { data: pagamentos = [] } = useQuery({
    queryKey: ["meus-pagamentos"],
    queryFn: () => apiRequest("GET", "/pagamentos/meus"),
    enabled: !!auth,
  });

  // Buscar tickets (rifas vendidas)
  const { data: tickets = [] } = useQuery({
    queryKey: ["meus-tickets"],
    queryFn: () => apiRequest("GET", "/rifas/meus-tickets"),
    enabled: !!auth,
  });

  // Buscar saldo do caixa
  const { data: saldoCaixa } = useQuery({
    queryKey: ["caixa-saldo"],
    queryFn: () => apiRequest("GET", "/caixa/saldo"),
    enabled: !!auth,
  });

  // Buscar metas da turma
  const { data: metas = [] } = useQuery({
    queryKey: ["metas"],
    queryFn: () => apiRequest("GET", "/metas"),
    enabled: !!auth,
  });

  // Calcular progresso do aluno
  const pago = pagamentos
    .filter((p: any) => p.status === "pago")
    .reduce((s: number, p: any) => s + parseFloat(p.valor || 0), 0);
  
  const total = pagamentos
    .reduce((s: number, p: any) => s + parseFloat(p.valor || 0), 0);
  
  const pct = total > 0 ? (pago / total) * 100 : 0;
  const faltam = total - pago;

  // Calcular meta da turma
  const meta = metas[0];
  const metaAtual = parseFloat(meta?.valorAtual || "0");
  const metaTotal = parseFloat(meta?.valorMeta || "1");
  const metaPct = Math.min((metaAtual / metaTotal) * 100, 100);

  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  
  // Função para formatar valor com ocultação
  const formatValue = (value: string) => {
    if (hideValues) {
      return "••••••";
    }
    return value;
  };

  const getStatusBadge = (status: string) => {
    if (status === "pago")
      return (
        <span className="inline-block px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-[10px] font-bold rounded uppercase">
          Pago
        </span>
      );
    return (
      <span className="inline-block px-2 py-0.5 bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 text-[10px] font-bold rounded uppercase">
        Pendente
      </span>
    );
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark">
      <Sidebar role="aluno" />
      <main className="flex-1 flex flex-col overflow-y-auto ml-64">
        <Header title="Dashboard" />

        <div className="p-8">
          {/* Header - sem o olhinho */}
          <header className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                Olá, {me?.nome?.split(" ")[0] || "Aluno"}
              </h2>
              <p className="text-slate-500 dark:text-slate-400">
                Acompanhe seu progresso e as finanças da sua turma.
              </p>
            </div>
          </header>

          <div className="grid grid-cols-12 gap-6">
            {/* Personal Progress Card */}
            <div className="col-span-12 lg:col-span-4 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-center">
              <h3 className="font-bold text-slate-700 dark:text-slate-300 mb-6 uppercase text-xs tracking-widest">
                Seu Pagamento
              </h3>
              <CircleProgress percent={pct} />
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mt-2">
                Faltam{" "}
                <span className="text-primary font-bold">{formatValue(fmt(faltam))}</span>{" "}
                para a quitação total.
              </p>
            </div>

            {/* Class Progress & Transparency */}
            <div className="col-span-12 lg:col-span-8 space-y-6">
              {/* Class Goal Progress */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="flex justify-between items-end mb-4">
                  <div>
                    <h3 className="font-bold text-lg">Meta da Turma</h3>
                    <p className="text-sm text-slate-500">
                      Arrecadação total do grupo para a formatura
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-primary">{formatValue(fmt(metaAtual))}</span>
                    <span className="text-sm text-slate-400 block">de {formatValue(fmt(metaTotal))}</span>
                  </div>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-4 overflow-hidden">
                  <div
                    className="bg-primary h-full rounded-full transition-all duration-500"
                    style={{ width: `${metaPct}%` }}
                  />
                </div>
                <div className="flex justify-between mt-2 text-xs font-semibold text-slate-400 uppercase tracking-tighter">
                  <span>Início</span>
                  <span>{Math.round(metaPct)}% Alcançado</span>
                  <span>Meta final</span>
                </div>
              </div>

              {/* Caixa Transparente Widget */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-primary/5 dark:bg-primary/10 border border-primary/20 p-6 rounded-xl flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-slate-800 dark:text-slate-200">
                        Caixa Transparente
                      </h3>
                      <p className="text-xs text-slate-500">Saldo atual da turma</p>
                    </div>
                    <button
                      onClick={() => setHideValues(!hideValues)}
                      className="text-primary hover:opacity-80 transition-opacity"
                      title={hideValues ? "Mostrar valores" : "Ocultar valores"}
                    >
                      <span className="material-symbols-outlined">
                        {hideValues ? "visibility_off" : "visibility"}
                      </span>
                    </button>
                  </div>
                  <div className="mt-4">
                    <p className="text-3xl font-black text-primary">
                      {formatValue(fmt(saldoCaixa?.saldo ?? 0))}
                    </p>
                    <Link
                      to="/aluno/caixa"
                      className="mt-3 text-xs font-bold text-primary hover:underline flex items-center gap-1"
                    >
                      VER EXTRATO <span className="material-symbols-outlined text-xs">arrow_forward</span>
                    </Link>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl">
                  <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-4">Ações Rápidas</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <Link
                      to="/aluno/pagamentos"
                      className="flex flex-col items-center justify-center p-3 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-primary/10 hover:text-primary transition-all group"
                    >
                      <span className="material-symbols-outlined mb-1">receipt_long</span>
                      <span className="text-[10px] font-bold uppercase">Boletos</span>
                    </Link>
                    <Link
                      to="/suporte"
                      className="flex flex-col items-center justify-center p-3 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-primary/10 hover:text-primary transition-all group"
                    >
                      <span className="material-symbols-outlined mb-1">help</span>
                      <span className="text-[10px] font-bold uppercase">Suporte</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Minhas Rifas Summary */}
            <div className="col-span-12 lg:col-span-7 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-lg">Minhas Rifas</h3>
                <Link
                  to="/aluno/rifas"
                  className="text-sm text-primary font-semibold hover:underline"
                >
                  Ver todas
                </Link>
              </div>
              <div className="space-y-4">
                {tickets.slice(0, 3).map((t: any) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg hover:bg-primary/5 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary/10 text-primary rounded-lg flex items-center justify-center">
                        <span className="material-symbols-outlined">confirmation_number</span>
                      </div>
                      <div>
                        <p className="font-bold text-sm">Rifa #{t.id}</p>
                        <p className="text-xs text-slate-500">
                          Vendido para: {t.compradorNome}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm text-primary">{formatValue(fmt(t.valor))}</p>
                      {getStatusBadge(t.status)}
                    </div>
                  </div>
                ))}
                {tickets.length === 0 && (
                  <p className="text-center py-6 text-slate-400 text-sm">
                    Você ainda não vendeu rifas.
                  </p>
                )}
              </div>
            </div>

            {/* Últimos Pagamentos */}
            <div className="col-span-12 lg:col-span-5 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-lg mb-6">Últimos Pagamentos</h3>
              <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:h-full before:w-0.5 before:bg-slate-100 dark:before:bg-slate-800">
                {pagamentos.slice(0, 4).map((p: any, i: number) => (
                  <div key={p.id || i} className="relative flex gap-6 pb-2">
                    <div className="absolute left-0 w-10 h-10 bg-white dark:bg-slate-900 border-2 border-primary rounded-full flex items-center justify-center z-10">
                      <span className="material-symbols-outlined text-primary text-sm">
                        {p.status === "pago" ? "check" : "schedule"}
                      </span>
                    </div>
                    <div className="ml-12">
                      <p className="text-sm font-bold">{p.descricao}</p>
                      <p className="text-xs text-slate-500">
                        {p.status === "pago" 
                          ? `Pago em ${new Date(p.dataPagamento).toLocaleDateString("pt-BR")}`
                          : `Vence em ${new Date(p.dataVencimento).toLocaleDateString("pt-BR")}`}
                      </p>
                      <p className="mt-1 font-black text-slate-700 dark:text-slate-200">
                        {formatValue(fmt(p.valor))}
                      </p>
                    </div>
                  </div>
                ))}
                {pagamentos.length === 0 && (
                  <p className="text-center py-6 text-slate-400 text-sm">
                    Nenhum pagamento registrado.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
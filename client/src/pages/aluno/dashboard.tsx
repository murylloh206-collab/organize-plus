import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import MobileLayout from "../../components/layout/MobileLayout";
import MobileHeader from "../../components/layout/MobileHeader";
import MobileCard from "../../components/ui/MobileCard";
import ProgressCircle from "../../components/ui/ProgressCircle";
import Skeleton from "../../components/ui/Skeleton";
import { apiRequest } from "../../lib/queryClient";
import { useAuth } from "../../hooks/useAuth";
import { formatCurrency } from "../../components/shared/CurrencyFormat";

export default function AlunoDashboard() {
  const { auth } = useAuth();
  const [hideValues, setHideValues] = useState(false);

  // Consultas
  const { data: me, isLoading: meLoading } = useQuery({
    queryKey: ["me"],
    queryFn: () => apiRequest("GET", "/alunos/me"),
    enabled: !!auth,
  });

  const { data: pagamentos = [], isLoading: pagLoading } = useQuery({
    queryKey: ["meus-pagamentos"],
    queryFn: () => apiRequest("GET", "/pagamentos/meus"),
    enabled: !!auth,
  });

  const { data: tickets = [], isLoading: ticLoading } = useQuery({
    queryKey: ["meus-tickets"],
    queryFn: () => apiRequest("GET", "/rifas/meus-tickets"),
    enabled: !!auth,
  });

  const { data: saldoCaixa } = useQuery({
    queryKey: ["caixa-saldo"],
    queryFn: () => apiRequest("GET", "/caixa/saldo"),
    enabled: !!auth,
  });

  const { data: metas = [] } = useQuery({
    queryKey: ["metas"],
    queryFn: () => apiRequest("GET", "/metas"),
    enabled: !!auth,
  });

  const isLoading = meLoading || pagLoading || ticLoading;

  // Progresso do aluno
  const pago = pagamentos.filter((p: any) => p.status === "pago").reduce((s: number, p: any) => s + parseFloat(p.valor || 0), 0);
  const total = pagamentos.reduce((s: number, p: any) => s + parseFloat(p.valor || 0), 0);
  const pct = total > 0 ? (pago / total) * 100 : 0;
  const faltam = total - pago;

  // Meta da turma
  const meta = metas[0];
  const metaAtual = parseFloat(meta?.valorAtual || "0");
  const metaTotal = parseFloat(meta?.valorMeta || "1");
  const metaPct = Math.min((metaAtual / metaTotal) * 100, 100);

  const formatValue = (value: string | number) => hideValues ? "••••••" : formatCurrency(value);

  return (
    <MobileLayout role="aluno">
      <div className="gradient-primary rounded-b-[2rem] px-6 pt-12 pb-24 shadow-lg relative z-0">
        <div className="flex justify-between items-center text-white">
          <div>
            <p className="text-indigo-100 text-sm font-medium">Bem-vindo(a) de volta,</p>
            <h1 className="text-2xl font-black mt-1">
              {isLoading ? <span className="animate-pulse bg-white/20 h-8 w-32 rounded inline-block" /> : me?.nome?.split(" ")[0] || "Aluno"}
            </h1>
          </div>
          <button className="size-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all backdrop-blur-sm shadow-sm relative">
            <span className="material-symbols-outlined font-light text-[22px]">notifications</span>
            <span className="absolute top-2 right-2 size-2.5 bg-rose-500 rounded-full border-2 border-indigo-600"></span>
          </button>
        </div>
      </div>

      <div className="px-4 -mt-16 space-y-4 relative z-10 pb-4">
        {/* Progresso do Aluno */}
        <MobileCard className="p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/4 blur-2xl pointer-events-none" />
          <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-6 uppercase text-[10px] tracking-widest text-center">
            Seu Pagamento
          </h3>
          <div className="flex flex-col items-center justify-center">
            <ProgressCircle value={pct} size={150} strokeWidth={12} />
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-4 text-center">
              Faltam <span className="text-primary font-black text-sm">{formatValue(faltam)}</span> para a quitação
            </p>
          </div>
        </MobileCard>

        {/* Caixa Transparente e Ações Rápidas */}
        <div className="grid grid-cols-2 gap-3">
          {/* Caixa */}
          <MobileCard className="p-4 bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-900/50">
            <div className="flex justify-between items-start mb-2">
              <span className="material-symbols-outlined text-indigo-600 dark:text-indigo-400">account_balance</span>
              <button onClick={() => setHideValues(!hideValues)} className="text-indigo-400">
                <span className="material-symbols-outlined text-sm">{hideValues ? "visibility_off" : "visibility"}</span>
              </button>
            </div>
            <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-1">Caixa da Turma</p>
            <p className="text-xl font-black text-slate-900 dark:text-white">{formatValue(saldoCaixa?.saldo ?? 0)}</p>
            <Link to="/aluno/caixa" className="text-[10px] text-indigo-600 font-bold mt-2 flex items-center hover:underline">
              Ver detalhes <span className="material-symbols-outlined text-[10px] ml-0.5">arrow_forward</span>
            </Link>
          </MobileCard>

          {/* Ações */}
          <MobileCard className="p-4 flex flex-col justify-between">
            <div className="flex justify-between items-start mb-2">
              <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400">receipt_long</span>
            </div>
            <div>
              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Meus Boletos</p>
              <Link to="/aluno/pagamentos" className="text-sm font-black text-slate-900 dark:text-white hover:text-primary transition-colors">
                Realizar Pagamento
              </Link>
            </div>
          </MobileCard>
        </div>

        {/* Progresso da Turma */}
        <MobileCard>
          <div className="flex justify-between items-end mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Meta da Turma</h3>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{meta?.titulo || "Arrecadação Geral"}</p>
            </div>
            <div className="text-right">
              <span className="text-base font-black text-primary">{formatValue(metaAtual)}</span>
              <span className="text-[10px] font-bold text-slate-400 block">de {formatValue(metaTotal)}</span>
            </div>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
            <div className="gradient-primary h-full rounded-full transition-all duration-1000" style={{ width: `${metaPct}%` }} />
          </div>
          <p className="text-[10px] font-bold text-slate-500 mt-2 text-right">{Math.round(metaPct)}% alcançado</p>
        </MobileCard>

        {/* Últimos Pagamentos */}
        <MobileCard className="p-0 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Últimas Faturas</h3>
            <Link to="/aluno/pagamentos" className="text-[10px] text-primary font-bold uppercase tracking-widest hover:underline">
              Ver Todas
            </Link>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {pagamentos.slice(0, 3).map((p: any) => (
              <div key={p.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`size-10 rounded-full flex items-center justify-center shrink-0 ${p.status === "pago" ? "bg-emerald-50 text-emerald-500" : "bg-amber-50 text-amber-500"}`}>
                    <span className="material-symbols-outlined text-sm">{p.status === "pago" ? "check" : "schedule"}</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{p.descricao}</p>
                    <p className="text-xs text-slate-500">{p.status === "pago" ? "Pago" : "Pendente"}</p>
                  </div>
                </div>
                <p className="text-sm font-black text-slate-900 dark:text-white">{formatValue(p.valor)}</p>
              </div>
            ))}
            {pagamentos.length === 0 && (
              <div className="p-6 text-center text-slate-400 text-xs">Nenhuma fatura encontrada.</div>
            )}
          </div>
        </MobileCard>

        {/* Minhas Rifas Preview */}
        {tickets.length > 0 && (
          <MobileCard className="p-0 overflow-hidden mb-4">
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-indigo-50/50 dark:bg-indigo-950/20">
              <h3 className="text-sm font-bold text-indigo-900 dark:text-indigo-100">Suas Vendas (Rifas)</h3>
              <Link to="/aluno/rifas" className="text-[10px] text-indigo-600 font-bold uppercase tracking-widest hover:underline">
                Gerenciar
              </Link>
            </div>
            <div className="p-4 space-y-3">
              {tickets.slice(0, 2).map((t: any) => (
                <div key={t.id} className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">Rifa #{String(t.numero).padStart(3, '0')}</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest">{t.compradorNome}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${t.status === "pago" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                    {t.status}
                  </span>
                </div>
              ))}
            </div>
          </MobileCard>
        )}
      </div>
    </MobileLayout>
  );
}
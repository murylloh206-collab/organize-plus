import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import MobileLayout from "../../components/layout/MobileLayout";
import MobileCard from "../../components/ui/MobileCard";
import Skeleton from "../../components/ui/Skeleton";
import NotificationModal from "../../components/aluno/NotificationModal";
import { apiRequest } from "../../lib/queryClient";
import { useAuth } from "../../hooks/useAuth";
import { useNotifications } from "../../hooks/useNotifications";
import { formatCurrency } from "../../components/shared/CurrencyFormat";
import { formatDate } from "../../components/shared/DateFormat";

interface AlunoDashboardData {
  aluno: {
    nome: string;
    avatarUrl: string | null;
    metaIndividual: number;
  };
  pagamentos: {
    totalPago: number;
    totalPendente: number;
    percentualPago: number;
  };
  rifas: {
    totalVendido: number;
    totalTickets: number;
    metaRifas: number;
  };
  sala: {
    metaTotal: number;
    totalArrecadado: number;
    saldoCaixa: number;
    totalAlunos: number;
    percentualMeta: number;
  };
}

function getSaudacao(): string {
  const hora = new Date().getHours();
  if (hora < 12) return "Bom dia";
  if (hora < 18) return "Boa tarde";
  return "Boa noite";
}

export default function AlunoDashboard() {
  const { auth } = useAuth();
  const [hideValues, setHideValues] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const { naoLidas } = useNotifications();

  // Dashboard stats com polling de 30s
  const { data: dashboard, isLoading: dashLoading } = useQuery<AlunoDashboardData>({
    queryKey: ["aluno-dashboard"],
    queryFn: () => apiRequest("GET", "/alunos/me/dashboard"),
    enabled: !!auth,
    refetchInterval: 30000,
  });

  // Pagamentos recentes
  const { data: pagamentos = [], isLoading: pagLoading } = useQuery<any[]>({
    queryKey: ["meus-pagamentos"],
    queryFn: () => apiRequest("GET", "/pagamentos/meus"),
    enabled: !!auth,
    refetchInterval: 30000,
  });

  // Rifas vendidas
  const { data: tickets = [], isLoading: ticLoading } = useQuery<any[]>({
    queryKey: ["meus-tickets"],
    queryFn: () => apiRequest("GET", "/rifas/meus-tickets"),
    enabled: !!auth,
    refetchInterval: 30000,
  });

  const isLoading = dashLoading || pagLoading || ticLoading;

  // Dados derivados do dashboard
  const metaIndividual = dashboard?.aluno.metaIndividual ?? 0;
  const totalPago = dashboard?.pagamentos.totalPago ?? 0;
  const totalPendente = dashboard?.pagamentos.totalPendente ?? 0;
  const percentualPago = dashboard?.pagamentos.percentualPago ?? 0;

  const metaSala = dashboard?.sala.metaTotal ?? 0;
  const arrecadadoSala = dashboard?.sala.totalArrecadado ?? 0;
  const percentualSala = dashboard?.sala.percentualMeta ?? 0;
  const saldoCaixa = dashboard?.sala.saldoCaixa ?? 0;

  const rifasVendidas = dashboard?.rifas.totalTickets ?? 0;
  const totalRifas = dashboard?.rifas.totalVendido ?? 0;

  const fmt = (v: number) => (hideValues ? "••••••" : formatCurrency(v));

  // Últimos 3 pagamentos
  const ultimosPagamentos = pagamentos.slice(0, 3);
  // Últimas 3 rifas vendidas
  const ultimasRifas = tickets.slice(0, 3);

  return (
    <MobileLayout role="aluno">
      {/* Header com gradiente */}
      <div className="gradient-primary rounded-b-[2rem] px-6 pt-12 pb-24 shadow-lg relative z-0">
        <div className="flex justify-between items-center text-white">
          <div>
            <p className="text-indigo-100 text-sm font-medium">{getaudacao()},</p>
            <h1 className="text-2xl font-black mt-1">
              {isLoading ? (
                <span className="animate-pulse bg-white/20 h-8 w-32 rounded inline-block" />
              ) : (
                dashboard?.aluno.nome?.split(" ")[0] || "Aluno"
              )}
            </h1>
          </div>

          {/* Botão de notificações */}
          <button
            onClick={() => setNotifOpen(true)}
            className="size-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all backdrop-blur-sm shadow-sm relative"
            aria-label={`Notificações${naoLidas > 0 ? `, ${naoLidas} não lidas` : ""}`}
          >
            <span className="material-symbols-outlined font-light text-[22px]">notifications</span>
            {naoLidas > 0 && (
              <span className="absolute -top-1 -right-1 size-5 bg-rose-500 rounded-full border-2 border-indigo-600 flex items-center justify-center">
                <span className="text-[10px] font-bold text-white">
                  {naoLidas > 9 ? "9+" : naoLidas}
                </span>
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Cards principais - sobrepõe o header */}
      <div className="px-4 -mt-16 space-y-4 relative z-10 pb-4">
        {/* Card Minha Cota */}
        <MobileCard className="p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/4 blur-2xl pointer-events-none" />

          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 dark:text-slate-200 uppercase text-[10px] tracking-widest">
              Minha Cota
            </h3>
            <button
              onClick={() => setHideValues(!hideValues)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              aria-label={hideValues ? "Mostrar valores" : "Ocultar valores"}
            >
              <span className="material-symbols-outlined text-lg">
                {hideValues ? "visibility_off" : "visibility"}
              </span>
            </button>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              <div className="flex justify-between">
                <Skeleton variant="line" className="w-20" lines={1} />
                <Skeleton variant="line" className="w-20" lines={1} />
                <Skeleton variant="line" className="w-20" lines={1} />
              </div>
              <Skeleton variant="line" className="h-3 w-full" lines={1} />
            </div>
          ) : metaIndividual > 0 ? (
            <>
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="text-center">
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">Cota Total</p>
                  <p className="text-lg font-black text-slate-900 dark:text-white leading-tight">
                    {fmt(metaIndividual)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-emerald-500 uppercase tracking-widest mb-1">Pago</p>
                  <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 leading-tight">
                    {fmt(totalPago)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-amber-500 uppercase tracking-widest mb-1">Pendente</p>
                  <p className="text-lg font-black text-amber-600 dark:text-amber-400 leading-tight">
                    {fmt(totalPendente)}
                  </p>
                </div>
              </div>

              {/* Barra de progresso */}
              <div className="space-y-1.5">
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000 ease-out"
                    style={{
                      width: `${percentualPago}%`,
                      background: "linear-gradient(90deg, #6366f1, #818cf8)",
                    }}
                  />
                </div>
                <p className="text-[10px] font-bold text-slate-500 text-center">
                  {percentualPago}% da sua cota quitada
                </p>
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-slate-500">Cota ainda não definida</p>
            </div>
          )}
        </MobileCard>

        {/* Grid de cards secundários */}
        <div className="grid grid-cols-2 gap-3">
          {/* Caixa da Turma */}
          <MobileCard className="p-4 bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-900/50">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-indigo-600 dark:text-indigo-400 text-xl">
                account_balance
              </span>
            </div>
            <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-1">
              Caixa da Turma
            </p>
            <p className="text-xl font-black text-slate-900 dark:text-white">
              {isLoading ? (
                <span className="skeleton h-6 w-20 inline-block" />
              ) : (
                fmt(saldoCaixa)
              )}
            </p>
            <Link
              to="/aluno/caixa"
              className="text-[10px] text-indigo-600 font-bold mt-2 flex items-center hover:underline"
            >
              Ver detalhes
              <span className="material-symbols-outlined text-[10px] ml-0.5">arrow_forward</span>
            </Link>
          </MobileCard>

          {/* Meus Boletos */}
          <MobileCard className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-xl">
                receipt_long
              </span>
            </div>
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">
              Meus Boletos
            </p>
            <Link
              to="/aluno/pagamentos"
              className="text-sm font-black text-slate-900 dark:text-white hover:text-primary transition-colors block"
            >
              Realizar Pagamento
            </Link>
          </MobileCard>
        </div>

        {/* Progresso da Turma */}
        <MobileCard className="p-4">
          <div className="flex justify-between items-end mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Meta da Turma</h3>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                {dashboard?.sala.totalAlunos ?? 0} alunos na turma
              </p>
            </div>
            <div className="text-right">
              <span className="text-base font-black text-primary">{fmt(arrecadadoSala)}</span>
              <span className="text-[10px] font-bold text-slate-400 block">
                de {fmt(metaSala)}
              </span>
            </div>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000 ease-out"
              style={{
                width: `${percentualSala}%`,
                background: "linear-gradient(90deg, #6366f1, #818cf8)",
              }}
            />
          </div>
          <p className="text-[10px] font-bold text-slate-500 mt-2 text-right">
            {percentualSala}% alcançado
          </p>
        </MobileCard>

        {/* Últimas Faturas */}
        <MobileCard className="p-0 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Últimas Faturas</h3>
            <Link
              to="/aluno/pagamentos"
              className="text-[10px] text-primary font-bold uppercase tracking-widest hover:underline"
            >
              Ver Todas
            </Link>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {isLoading ? (
              [1, 2, 3].map((i) => (
                <div key={i} className="p-4 flex items-center gap-3">
                  <Skeleton variant="avatar" className="size-10" />
                  <div className="flex-1">
                    <Skeleton variant="line" lines={2} />
                  </div>
                </div>
              ))
            ) : ultimosPagamentos.length > 0 ? (
              ultimosPagamentos.map((p: any) => (
                <div key={p.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`size-10 rounded-full flex items-center justify-center shrink-0 ${
                        p.status === "pago"
                          ? "bg-emerald-50 text-emerald-500"
                          : "bg-amber-50 text-amber-500"
                      }`}
                    >
                      <span className="material-symbols-outlined text-sm">
                        {p.status === "pago" ? "check" : "schedule"}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">
                        {p.descricao}
                      </p>
                      <p className="text-xs text-slate-500">
                        {p.status === "pago"
                          ? `Pago ${p.dataPagamento ? formatDate(p.dataPagamento, "short") : ""}`
                          : p.dataVencimento
                          ? `Venc: ${formatDate(p.dataVencimento, "short")}`
                          : "Pendente"}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-black text-slate-900 dark:text-white">
                    {fmt(parseFloat(p.valor || "0"))}
                  </p>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-slate-400 text-xs">
                Nenhuma fatura encontrada.
              </div>
            )}
          </div>
        </MobileCard>

        {/* Preview Rifas Vendidas */}
        {tickets.length > 0 && (
          <MobileCard className="p-0 overflow-hidden mb-4">
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-indigo-50/50 dark:bg-indigo-950/20">
              <div>
                <h3 className="text-sm font-bold text-indigo-900 dark:text-indigo-100">
                  Suas Rifas
                </h3>
                <p className="text-[10px] text-indigo-500">
                  {rifasVendidas} vendida{rifasVendidas !== 1 ? "s" : ""} ·{" "}
                  {formatCurrency(totalRifas)}
                </p>
              </div>
              <Link
                to="/aluno/rifas"
                className="text-[10px] text-indigo-600 font-bold uppercase tracking-widest hover:underline"
              >
                Gerenciar
              </Link>
            </div>
            <div className="p-4 space-y-3">
              {ultimasRifas.map((t: any) => (
                <div key={t.id} className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      Rifa #{String(t.numero || t.id).padStart(3, "0")}
                    </p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest">
                      {t.compradorNome}
                    </p>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                      t.status === "pago"
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                        : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                    }`}
                  >
                    {t.status}
                  </span>
                </div>
              ))}
            </div>
          </MobileCard>
        )}
      </div>

      {/* Modal de Notificações */}
      <NotificationModal isOpen={notifOpen} onClose={() => setNotifOpen(false)} />
    </MobileLayout>
  );
}

// Helper para saudação
function getaudacao(): string {
  const hora = new Date().getHours();
  if (hora < 12) return "Bom dia";
  if (hora < 18) return "Boa tarde";
  return "Boa noite";
}

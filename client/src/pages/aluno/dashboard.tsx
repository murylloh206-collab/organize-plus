import { useQuery } from "@tanstack/react-query";
import Sidebar from "../../components/layout/Sidebar";
import { apiRequest } from "../../lib/queryClient";
import { useAuth } from "../../hooks/useAuth";

function CircleProgress({ percent }: { percent: number }) {
  const r = 70; const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;
  return (
    <div className="relative w-40 h-40 flex items-center justify-center">
      <svg className="w-full h-full transform -rotate-90">
        <circle className="text-slate-100 dark:text-slate-800" cx="80" cy="80" fill="transparent" r={r} stroke="currentColor" strokeWidth="12" />
        <circle className="text-primary" cx="80" cy="80" fill="transparent" r={r} stroke="currentColor" strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" strokeWidth="12" style={{ transition: "stroke-dashoffset 0.5s ease" }} />
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
  const { data: me } = useQuery({ queryKey: ["me"], queryFn: () => apiRequest("GET", "/alunos/me"), enabled: !!auth });
  const { data: pagamentos = [] } = useQuery({ queryKey: ["meus-pagamentos"], queryFn: () => apiRequest("GET", "/pagamentos"), enabled: !!auth });
  const { data: tickets = [] } = useQuery({ queryKey: ["meus-tickets"], queryFn: () => apiRequest("GET", "/rifas/meus-tickets"), enabled: !!auth });
  const { data: saldoCaixa } = useQuery({ queryKey: ["caixa-saldo"], queryFn: () => apiRequest("GET", "/caixa/saldo"), enabled: !!auth });
  const { data: metas = [] } = useQuery({ queryKey: ["metas"], queryFn: () => apiRequest("GET", "/metas"), enabled: !!auth });

  const pago = pagamentos.filter((p: any) => p.status === "pago").reduce((s: number, p: any) => s + parseFloat(p.valor || 0), 0);
  const total = pagamentos.reduce((s: number, p: any) => s + parseFloat(p.valor || 0), 0);
  const pct = total > 0 ? (pago / total) * 100 : 0;
  const faltam = total - pago;

  const meta = metas[0];
  const metaAtual = parseFloat(meta?.valorAtual || "0");
  const metaTotal = parseFloat(meta?.valorMeta || "1");
  const metaPct = Math.min((metaAtual / metaTotal) * 100, 100);

  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="flex min-h-screen">
      <Sidebar role="aluno" />
      <main className="flex-1 ml-64 p-8">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-black tracking-tight">Olá, {me?.nome?.split(" ")[0] || "Aluno"}</h2>
            <p className="text-slate-500 dark:text-slate-400">Acompanhe seu progresso e as finanças da sua turma.</p>
          </div>
          <div className="flex gap-3">
            <button className="p-2 card text-slate-600">
              <span className="material-symbols-outlined">notifications</span>
            </button>
          </div>
        </header>

        <div className="grid grid-cols-12 gap-6">
          {/* Progresso pessoal */}
          <div className="col-span-12 lg:col-span-4 card p-6 flex flex-col items-center justify-center text-center">
            <h3 className="font-bold text-slate-700 dark:text-slate-300 mb-6 uppercase text-xs tracking-widest">Seu Pagamento</h3>
            <CircleProgress percent={pct} />
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mt-4">
              Faltam{" "}
              <span className="text-primary font-bold">{fmt(faltam)}</span>{" "}
              para a quitação total.
            </p>
          </div>

          {/* Meta da turma + Caixa */}
          <div className="col-span-12 lg:col-span-8 space-y-6">
            {meta && (
              <div className="card p-6">
                <div className="flex justify-between items-end mb-4">
                  <div>
                    <h3 className="font-bold text-lg">Meta da Turma</h3>
                    <p className="text-sm text-slate-500">{meta.titulo}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-primary">{fmt(metaAtual)}</span>
                    <span className="text-sm text-slate-400 block">de {fmt(metaTotal)}</span>
                  </div>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-4 overflow-hidden">
                  <div className="bg-primary h-full rounded-full transition-all duration-700" style={{ width: `${metaPct}%` }} />
                </div>
                <div className="flex justify-between mt-2 text-xs font-semibold text-slate-400 uppercase">
                  <span>Início</span>
                  <span>{Math.round(metaPct)}% Alcançado</span>
                  <span>Meta final</span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-6">
              {/* Caixa transparente */}
              <div className="card p-6 bg-slate-50 dark:bg-slate-800 border-blue-200 dark:border-blue-800/30">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold">Caixa Transparente</h3>
                    <p className="text-xs text-slate-500">Saldo atual da turma</p>
                  </div>
                  <span className="material-symbols-outlined text-primary">visibility</span>
                </div>
                <p className="text-3xl font-black text-primary">{fmt(saldoCaixa?.saldo ?? 0)}</p>
                <a href="/aluno/caixa" className="mt-3 text-xs font-bold text-primary hover:underline flex items-center gap-1">
                  VER EXTRATO <span className="material-symbols-outlined text-xs">arrow_forward</span>
                </a>
              </div>

              {/* Ações rápidas */}
              <div className="card p-6">
                <h3 className="font-bold mb-4">Ações Rápidas</h3>
                <div className="grid grid-cols-2 gap-3">
                  <a href="/aluno/pagamentos" className="flex flex-col items-center justify-center p-3 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:bg-blue-900/20 hover:text-primary transition-all">
                    <span className="material-symbols-outlined mb-1">receipt_long</span>
                    <span className="text-[10px] font-bold uppercase">Boletos</span>
                  </a>
                  <a href="/aluno/rifas" className="flex flex-col items-center justify-center p-3 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:bg-blue-900/20 hover:text-primary transition-all">
                    <span className="material-symbols-outlined mb-1">confirmation_number</span>
                    <span className="text-[10px] font-bold uppercase">Rifas</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Meus tickets */}
          <div className="col-span-12 lg:col-span-7 card p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg">Minhas Rifas</h3>
              <a className="text-sm text-primary font-semibold hover:underline" href="/aluno/rifas">Ver todas</a>
            </div>
            <div className="space-y-3">
              {tickets.slice(0, 3).map((t: any) => (
                <div key={t.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 text-primary rounded-lg flex items-center justify-center">
                      <span className="material-symbols-outlined">confirmation_number</span>
                    </div>
                    <div>
                      <p className="font-bold text-sm">Ticket #{t.id}</p>
                      <p className="text-xs text-slate-500">Comprador: {t.compradorNome}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm text-primary">{parseFloat(t.valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
                    <span className={t.status === "pago" ? "badge-success" : "badge-warning"}>{t.status}</span>
                  </div>
                </div>
              ))}
              {tickets.length === 0 && <p className="text-center py-6 text-slate-400 text-sm">Você ainda não vendeu rifas.</p>}
            </div>
          </div>

          {/* Últimos pagamentos */}
          <div className="col-span-12 lg:col-span-5 card p-6">
            <h3 className="font-bold text-lg mb-6">Últimos Pagamentos</h3>
            <div className="space-y-4">
              {pagamentos.slice(0, 4).map((p: any, i: number) => (
                <div key={p.id ?? i} className="flex items-start gap-4">
                  <div className={`size-10 rounded-full border-2 flex items-center justify-center shrink-0 ${p.status === "pago" ? "border-primary" : "border-slate-300"}`}>
                    <span className={`material-symbols-outlined text-sm ${p.status === "pago" ? "text-primary" : "text-slate-400"}`}>
                      {p.status === "pago" ? "check" : "schedule"}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-bold">{p.descricao}</p>
                    {p.dataPagamento && <p className="text-xs text-slate-500">Pago em {new Date(p.dataPagamento).toLocaleDateString("pt-BR")}</p>}
                    <p className="mt-0.5 font-black text-slate-700 dark:text-slate-200 text-sm">{fmt(parseFloat(p.valor || "0"))}</p>
                  </div>
                </div>
              ))}
              {pagamentos.length === 0 && <p className="text-center py-6 text-slate-400 text-sm">Nenhum pagamento registrado.</p>}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

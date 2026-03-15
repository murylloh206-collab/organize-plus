import { useQuery } from "@tanstack/react-query";
import Sidebar from "../../components/layout/Sidebar";
import { apiRequest } from "../../lib/queryClient";
import { useAuth } from "../../hooks/useAuth";

export default function AlunoPagamentos() {
  const { auth } = useAuth();
  const { data: pagamentos = [] } = useQuery({ queryKey: ["meus-pagamentos"], queryFn: () => apiRequest("GET", "/pagamentos"), enabled: !!auth });

  const fmt = (v: string | number) => parseFloat(String(v || 0)).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const total = pagamentos.reduce((s: number, p: any) => s + parseFloat(p.valor || 0), 0);
  const pago = pagamentos.filter((p: any) => p.status === "pago").reduce((s: number, p: any) => s + parseFloat(p.valor || 0), 0);
  const pendente = total - pago;

  return (
    <div className="flex min-h-screen">
      <Sidebar role="aluno" />
      <main className="flex-1 ml-64 p-8 space-y-6">
        <div>
          <h2 className="text-3xl font-black">Meus Pagamentos</h2>
          <p className="text-slate-500">Acompanhe suas mensalidades e taxas.</p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total", value: fmt(total), icon: "payments", color: "text-slate-600" },
            { label: "Pago", value: fmt(pago), icon: "check_circle", color: "text-emerald-500" },
            { label: "Pendente", value: fmt(pendente), icon: "schedule", color: "text-amber-500" },
          ].map(s => (
            <div key={s.label} className="card p-5">
              <div className="flex items-center gap-2 mb-2">
                <span className={`material-symbols-outlined ${s.color}`}>{s.icon}</span>
                <span className="text-xs font-bold uppercase text-slate-400">{s.label}</span>
              </div>
              <p className="text-2xl font-black">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
            <h4 className="font-bold">Histórico</h4>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {pagamentos.map((p: any, i: number) => (
              <div key={p.id ?? i} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`size-10 rounded-full border-2 flex items-center justify-center ${p.status === "pago" ? "border-primary bg-blue-50 dark:bg-blue-900/20" : "border-slate-200"}`}>
                    <span className={`material-symbols-outlined text-sm ${p.status === "pago" ? "text-primary" : "text-slate-400"}`}>
                      {p.status === "pago" ? "check" : "schedule"}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{p.descricao}</p>
                    <p className="text-xs text-slate-500">
                      {p.dataVencimento ? `Venc.: ${new Date(p.dataVencimento).toLocaleDateString("pt-BR")}` : "Sem vencimento"}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black">{fmt(p.valor)}</p>
                  <span className={p.status === "pago" ? "badge-success" : p.status === "atrasado" ? "badge-danger" : "badge-warning"}>
                    {p.status === "pago" ? "Pago" : p.status === "atrasado" ? "Atrasado" : "Pendente"}
                  </span>
                </div>
              </div>
            ))}
            {pagamentos.length === 0 && <div className="px-6 py-12 text-center text-slate-400">Nenhum pagamento registrado.</div>}
          </div>
        </div>
      </main>
    </div>
  );
}

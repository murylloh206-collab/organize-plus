import { useQuery } from "@tanstack/react-query";
import Sidebar from "../../components/layout/Sidebar";
import Header from "../../components/layout/Header";
import { apiRequest } from "../../lib/queryClient";

export default function AdminRelatorios() {
  const { data: pagamentos = [] } = useQuery({ queryKey: ["pagamentos"], queryFn: () => apiRequest("GET", "/pagamentos") });
  const { data: rifas = [] } = useQuery({ queryKey: ["rifas"], queryFn: () => apiRequest("GET", "/rifas") });
  const { data: alunos = [] } = useQuery({ queryKey: ["alunos"], queryFn: () => apiRequest("GET", "/alunos") });
  const { data: caixa } = useQuery({ queryKey: ["caixa-saldo"], queryFn: () => apiRequest("GET", "/caixa/saldo") });

  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const totalPago = pagamentos.filter((p: any) => p.pagamento?.status === "pago").reduce((s: number, p: any) => s + parseFloat(p.pagamento?.valor || 0), 0);
  const totalPendente = pagamentos.filter((p: any) => p.pagamento?.status !== "pago").reduce((s: number, p: any) => s + parseFloat(p.pagamento?.valor || 0), 0);
  const taxaAdimplencia = pagamentos.length > 0 ? (pagamentos.filter((p: any) => p.pagamento?.status === "pago").length / pagamentos.length * 100).toFixed(1) : "0";

  const stats = [
    { label: "Total Arrecadado", value: fmt(totalPago), icon: "attach_money", color: "text-emerald-500" },
    { label: "A Receber", value: fmt(totalPendente), icon: "pending", color: "text-amber-500" },
    { label: "Saldo Caixa", value: fmt(caixa?.saldo ?? 0), icon: "savings", color: "text-primary" },
    { label: "Taxa Adimplência", value: `${taxaAdimplencia}%`, icon: "percent", color: "text-violet-500" },
    { label: "Total Alunos", value: String(alunos.length), icon: "group", color: "text-slate-500" },
    { label: "Rifas Ativas", value: String(rifas.filter((r: any) => r.status === "ativa").length), icon: "confirmation_number", color: "text-sky-500" },
  ];

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar role="admin" />
      <main className="flex-1 flex flex-col overflow-y-auto ml-64">
        <Header title="Relatórios" />
        <div className="p-8 space-y-6">
          <div>
            <h3 className="text-xl font-bold">Relatórios Avançados</h3>
            <p className="text-sm text-slate-500">Visão geral das finanças da turma</p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.map(s => (
              <div key={s.label} className="card p-6">
                <div className="flex items-center gap-3 mb-3">
                  <span className={`material-symbols-outlined text-2xl ${s.color}`}>{s.icon}</span>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{s.label}</p>
                </div>
                <p className="text-2xl font-black">{s.value}</p>
              </div>
            ))}
          </div>

          {/* Histórico de pagamentos por status */}
          <div className="card p-6">
            <h4 className="font-bold mb-4">Distribuição de Pagamentos</h4>
            <div className="space-y-3">
              {[
                { label: "Pagos", count: pagamentos.filter((p: any) => p.pagamento?.status === "pago").length, color: "bg-emerald-500" },
                { label: "Pendentes", count: pagamentos.filter((p: any) => p.pagamento?.status === "pendente").length, color: "bg-amber-500" },
                { label: "Atrasados", count: pagamentos.filter((p: any) => p.pagamento?.status === "atrasado").length, color: "bg-red-500" },
              ].map(item => (
                <div key={item.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-semibold">{item.label}</span>
                    <span className="text-slate-500">{item.count} pagamentos</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                    <div
                      className={`${item.color} h-full rounded-full transition-all`}
                      style={{ width: pagamentos.length > 0 ? `${(item.count / pagamentos.length) * 100}%` : "0%" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

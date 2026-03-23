import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import MobileLayout from "../../components/layout/MobileLayout";
import MobileHeader from "../../components/layout/MobileHeader";
import MobileCard from "../../components/ui/MobileCard";
import MobileButton from "../../components/ui/MobileButton";
import MobileInput from "../../components/ui/MobileInput";
import BottomSheet from "../../components/ui/BottomSheet";
import { useBottomSheet } from "../../hooks/useBottomSheet";
import { apiRequest } from "../../lib/queryClient";
import { useAuth } from "../../hooks/useAuth";
import { formatCurrency } from "../../components/shared/CurrencyFormat";

interface Rifa {
  id: number;
  nome: string;
  premio: string;
  preco: string;
  status: string;
}

interface Ticket {
  id: number;
  rifaId: number;
  compradorNome: string;
  compradorContato: string | null;
  valido: boolean;
  status: string;
  valor: string;
}

export default function AlunoRifas() {
  const { auth } = useAuth();
  const qc = useQueryClient();
  const vendaSheet = useBottomSheet();

  const [selectedRifa, setSelectedRifa] = useState<Rifa | null>(null);
  const [compradorNome, setCompradorNome] = useState("");
  const [compradorContato, setCompradorContato] = useState("");

  const { data: rifas = [], isLoading: isLoadingRifas } = useQuery<Rifa[]>({
    queryKey: ["rifas"],
    queryFn: () => apiRequest("GET", "/rifas"),
    enabled: !!auth,
  });

  const { data: meusTickets = [] } = useQuery<Ticket[]>({
    queryKey: ["meus-tickets"],
    queryFn: () => apiRequest("GET", "/rifas/meus-tickets"),
    enabled: !!auth,
  });

  const vender = useMutation({
    mutationFn: (data: any) => apiRequest("POST", `/rifas/${selectedRifa?.id}/tickets`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["meus-tickets"] });
      vendaSheet.close();
      setSelectedRifa(null); setCompradorNome(""); setCompradorContato("");
    },
  });

  const rifasAtivas = rifas.filter((r) => r.status === "ativa");

  return (
    <MobileLayout role="aluno">
      <MobileHeader title="Minhas Rifas" subtitle="Venda e acompanhe resultados" gradient />

      <div className="px-4 py-4 space-y-6">
        {/* Rifas Ativas */}
        <section>
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3 px-1">Rifas Disponíveis</h3>
          {isLoadingRifas ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-32 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : rifasAtivas.length === 0 ? (
            <MobileCard className="text-center py-8 bg-slate-50 dark:bg-slate-800/50">
              <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600 mb-2 block">confirmation_number</span>
              <p className="text-sm text-slate-500">Nenhuma rifa ativa no momento.</p>
            </MobileCard>
          ) : (
            <div className="grid gap-3 grid-cols-1">
              {rifasAtivas.map((rifa) => (
                <MobileCard key={rifa.id} className="p-4 border-indigo-100 dark:border-indigo-900/50 bg-indigo-50/30 dark:bg-indigo-950/20">
                  <div className="flex gap-4">
                    <div className="size-14 rounded-2xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 shadow-inner">
                      <span className="material-symbols-outlined text-2xl">confirmation_number</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-900 dark:text-white truncate">{rifa.nome}</h4>
                      <p className="text-xs text-slate-500 mt-0.5 truncate flex items-center gap-1">
                        <span className="material-symbols-outlined text-[10px]">emoji_events</span> {rifa.premio}
                      </p>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">
                          {formatCurrency(parseFloat(rifa.preco))}
                        </span>
                        <MobileButton size="sm" icon="add_shopping_cart" onClick={() => { setSelectedRifa(rifa); vendaSheet.open(); }}>
                          Vender
                        </MobileButton>
                      </div>
                    </div>
                  </div>
                </MobileCard>
              ))}
            </div>
          )}
        </section>

        {/* Histórico de Vendas */}
        {meusTickets.length > 0 && (
          <section>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3 px-1">Histórico de Vendas</h3>
            <div className="space-y-3">
              {meusTickets.map((t) => (
                <div key={t.id} className="mobile-list-item">
                  <div className="size-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-slate-500 text-[20px]">receipt</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">Ticket #{String(t.id).padStart(4, '0')}</p>
                    <p className="text-[10px] text-slate-500 truncate uppercase tracking-widest mt-0.5">{t.compradorNome}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-black text-slate-900 dark:text-white">{formatCurrency(parseFloat(t.valor))}</p>
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${t.status === "pago" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"}`}>
                      {t.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      <BottomSheet isOpen={vendaSheet.isOpen} onClose={() => { vendaSheet.close(); setSelectedRifa(null); }} title="Registrar Venda">
        {selectedRifa && (
          <div className="space-y-5">
            <div className="bg-indigo-50 dark:bg-indigo-950/30 p-4 rounded-xl text-center border border-indigo-100 dark:border-indigo-900/50">
              <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest mb-1">{selectedRifa.nome}</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white">{formatCurrency(parseFloat(selectedRifa.preco))}</p>
            </div>

            <div className="space-y-3">
              <MobileInput label="Nome do Comprador" icon="person" placeholder="Nome completo" value={compradorNome} onChange={(e) => setCompradorNome(e.target.value)} />
              <MobileInput label="Contato (opcional)" icon="call" placeholder="Telefone ou e-mail" value={compradorContato} onChange={(e) => setCompradorContato(e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <MobileButton variant="secondary" fullWidth onClick={() => { vendaSheet.close(); setSelectedRifa(null); }}>Cancelar</MobileButton>
              <MobileButton variant="primary" fullWidth loading={vender.isPending} disabled={!compradorNome} onClick={() => vender.mutate({ compradorNome, compradorContato, valor: selectedRifa.preco })}>
                Confirmar Venda
              </MobileButton>
            </div>
          </div>
        )}
      </BottomSheet>
    </MobileLayout>
  );
}

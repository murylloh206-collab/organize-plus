import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import MobileLayout from "../../components/layout/MobileLayout";
import MobileHeader from "../../components/layout/MobileHeader";
import MobileCard from "../../components/ui/MobileCard";
import MobileButton from "../../components/ui/MobileButton";
import Skeleton from "../../components/ui/Skeleton";
import { apiRequest } from "../../lib/queryClient";
import { useAuth } from "../../hooks/useAuth";
import { formatCurrency } from "../../components/shared/CurrencyFormat";
import { formatDate } from "../../components/shared/DateFormat";

interface Ticket {
  id: number;
  rifaId: number;
  numero: number;
  compradorNome: string;
  compradorContato: string | null;
  status: string;
  valor: string;
  createdAt: string;
}

interface Rifa {
  id: number;
  nome: string;
  premio: string;
  preco: string;
  status: string;
}

const FRASES_MOTIVACIONAIS = [
  "Cada rifa vendida é um passo mais perto do seu sonho!",
  "Você está arrasando nas vendas! Continue assim!",
  "Que orgulho! Sua dedicação está fazendo a diferença!",
  "O sucesso é a soma de pequenos esforços repetidos!",
  "Você é incrível! Cada venda conta muito!",
  "Continue firme! A formatura está cada vez mais perto!",
  "Sua determinação inspira toda a turma!",
  "Vender rifas nunca foi tão motivador com você!",
  "Cada número vendido é uma semente de conquista!",
  "Você está escrevendo uma história de sucesso!",
];

function getFraseMotivacional(): string {
  const index = Math.floor(Math.random() * FRASES_MOTIVACIONAIS.length);
  return FRASES_MOTIVACIONAIS[index];
}

function compartilharWhatsApp(ticket: Ticket, rifaNome: string): string {
  const mensagem = `Comprei uma rifa para nossa formatura!\n\nNúmero: #${String(ticket.numero).padStart(3, "0")}\nComprador: ${ticket.compradorNome}\nValor: ${formatCurrency(parseFloat(ticket.valor))}\n\nAjuda a gente a realizar esse sonho!`;
  return `https://api.whatsapp.com/send?text=${encodeURIComponent(mensagem)}`;
}

export default function AlunoRifas() {
  const { auth } = useAuth();
  const [frase] = useState(getFraseMotivacional);

  // Rifas do próprio aluno
  const { data: meusTickets = [], isLoading: isLoadingTickets, refetch } = useQuery<Ticket[]>({
    queryKey: ["meus-tickets"],
    queryFn: () => apiRequest("GET", "/rifas/meus-tickets"),
    enabled: !!auth,
  });

  // Rifas disponíveis para buscar nome/prêmio
  const { data: rifas = [] } = useQuery<Rifa[]>({
    queryKey: ["rifas"],
    queryFn: () => apiRequest("GET", "/rifas"),
    enabled: !!auth,
  });

  // Estatísticas do aluno (todas as rifas, não apenas pagas)
  const totalVendidas = meusTickets.length;
  const totalArrecadado = meusTickets.reduce(
    (s, t) => s + parseFloat(t.valor || "0"),
    0
  );

  // Tickets com info da rifa
  const ticketsComRifa = useMemo(() => {
    return meusTickets.map((t) => ({
      ...t,
      rifa: rifas.find((r) => r.id === t.rifaId),
    }));
  }, [meusTickets, rifas]);

  return (
    <MobileLayout role="aluno">
      <MobileHeader title="Minhas Rifas" subtitle="Acompanhe suas vendas" gradient showAvatar />

      <div className="px-4 py-4 space-y-6">
        {/* Frase motivacional */}
        <MobileCard className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border-indigo-100 dark:border-indigo-900/50">
          <p className="text-sm font-medium text-indigo-700 dark:text-indigo-300 text-center italic">
            &ldquo;{frase}&rdquo;
          </p>
        </MobileCard>

        {/* Cards de estatísticas */}
        {isLoadingTickets ? (
          <div className="grid grid-cols-2 gap-2">
            {[1, 2].map((i) => (
              <Skeleton key={i} variant="metric" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <MobileCard className="p-3 text-center">
              <span className="material-symbols-outlined text-indigo-500 text-xl block mb-1">
                confirmation_number
              </span>
              <p className="text-xl font-black text-slate-900 dark:text-white">{totalVendidas}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Vendidas</p>
            </MobileCard>
            <MobileCard className="p-3 text-center">
              <span className="material-symbols-outlined text-emerald-500 text-xl block mb-1">
                payments
              </span>
              <p className="text-lg font-black text-slate-900 dark:text-white leading-tight">
                {formatCurrency(totalArrecadado)}
              </p>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Arrecadado</p>
            </MobileCard>
          </div>
        )}

        {/* Lista de rifas vendidas */}
        <section>
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3 px-1">
            Suas Vendas ({ticketsComRifa.length})
          </h3>
          {isLoadingTickets ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} variant="card" />
              ))}
            </div>
          ) : ticketsComRifa.length === 0 ? (
            <MobileCard className="text-center py-8 bg-slate-50 dark:bg-slate-800/50">
              <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600 mb-2 block">
                confirmation_number
              </span>
              <p className="text-sm text-slate-500">Você ainda não tem rifas vendidas.</p>
              <p className="text-xs text-slate-400 mt-1">
                As rifas cadastradas pelo admin aparecerão aqui.
              </p>
            </MobileCard>
          ) : (
            <div className="space-y-3">
              {ticketsComRifa.map((t) => (
                <MobileCard key={t.id} className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">
                          #{String(t.numero).padStart(3, "0")}
                        </span>
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
                      <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                        {t.compradorNome}
                      </p>
                      {t.compradorContato && (
                        <p className="text-xs text-slate-500">{t.compradorContato}</p>
                      )}
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {formatDate(t.createdAt, "short")} · {t.rifa?.nome ?? "Rifa"}
                      </p>
                    </div>
                    <p className="text-base font-black text-slate-900 dark:text-white">
                      {formatCurrency(parseFloat(t.valor))}
                    </p>
                  </div>

                  {/* Ações */}
                  <div className="flex gap-2 mt-2">
                    <a
                      href={compartilharWhatsApp(t, t.rifa?.nome ?? "Rifa")}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1"
                    >
                      <MobileButton variant="primary" fullWidth size="sm" icon="share">
                        WhatsApp
                      </MobileButton>
                    </a>
                    <MobileButton
                      variant="secondary"
                      size="sm"
                      icon="content_copy"
                      onClick={() => {
                        const texto = `Rifa #${String(t.numero).padStart(3, "0")} - ${t.compradorNome} - ${formatCurrency(parseFloat(t.valor))} - ${t.status}`;
                        navigator.clipboard.writeText(texto);
                      }}
                    >
                      Copiar
                    </MobileButton>
                  </div>
                </MobileCard>
              ))}
            </div>
          )}
        </section>

        {/* Botão para atualizar */}
        <button
          onClick={() => refetch()}
          className="w-full py-2 text-center text-sm text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
        >
          ↻ Atualizar lista
        </button>
      </div>
    </MobileLayout>
  );
}

import { useQuery } from "@tanstack/react-query";
import MobileLayout from "../../components/layout/MobileLayout";
import MobileHeader from "../../components/layout/MobileHeader";
import MobileCard from "../../components/ui/MobileCard";
import Skeleton from "../../components/ui/Skeleton";
import { apiRequest } from "../../lib/queryClient";
import { useAuth } from "../../hooks/useAuth";
import { formatDate } from "../../components/shared/DateFormat";

interface Evento {
  id: number;
  titulo: string;
  descricao: string | null;
  data: string | null;
  local: string | null;
  tipo: string;
  status: string;
  foto: string | null;
}

function getStatusInfo(status: string) {
  switch (status) {
    case "realizado":
      return { label: "Realizado", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400", icon: "check_circle" };
    case "cancelado":
      return { label: "Cancelado", color: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400", icon: "cancel" };
    default:
      return { label: "Planejado", color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400", icon: "event" };
  }
}

function getTipoIcon(tipo: string): string {
  switch (tipo) {
    case "reuniao": return "groups";
    case "ensaio": return "music_note";
    case "formatura": return "school";
    case "vencimento": return "schedule";
    default: return "event";
  }
}

export default function AlunoEventos() {
  const { auth } = useAuth();

  const { data: eventos = [], isLoading } = useQuery<Evento[]>({
    queryKey: ["eventos"],
    queryFn: () => apiRequest("GET", "/eventos"),
    enabled: !!auth,
  });

  const eventosFuturos = eventos.filter(
    (e) => e.status !== "cancelado" && e.data && new Date(e.data) >= new Date()
  );
  const eventosPassados = eventos.filter(
    (e) => e.status === "realizado" || (e.data && new Date(e.data) < new Date())
  );

  return (
    <MobileLayout role="aluno">
      <MobileHeader title="Eventos" subtitle="Calendário da turma" gradient showAvatar />

      <div className="px-4 py-4 space-y-6">
        {/* Próximos Eventos */}
        <section>
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3 px-1">
            Próximos Eventos
          </h3>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <Skeleton key={i} variant="card" />
              ))}
            </div>
          ) : eventosFuturos.length === 0 ? (
            <MobileCard className="text-center py-8 bg-slate-50 dark:bg-slate-800/50">
              <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600 mb-2 block">
                event
              </span>
              <p className="text-sm text-slate-500">Nenhum evento programado.</p>
            </MobileCard>
          ) : (
            <div className="space-y-3">
              {eventosFuturos.map((evento) => {
                const statusInfo = getStatusInfo(evento.status);
                return (
                  <MobileCard key={evento.id} className="p-4 border-indigo-100 dark:border-indigo-900/50">
                    <div className="flex gap-3">
                      <div className="size-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-xl">{getTipoIcon(evento.tipo)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-bold text-slate-900 dark:text-white truncate">{evento.titulo}</h4>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase shrink-0 ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                        </div>
                        {evento.descricao && (
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2">{evento.descricao}</p>
                        )}
                        <div className="flex items-center gap-3 mt-2">
                          {evento.data && (
                            <span className="text-[10px] text-slate-400 flex items-center gap-1">
                              <span className="material-symbols-outlined text-[12px]">calendar_today</span>
                              {formatDate(evento.data, "short")}
                            </span>
                          )}
                          {evento.local && (
                            <span className="text-[10px] text-slate-400 flex items-center gap-1">
                              <span className="material-symbols-outlined text-[12px]">location_on</span>
                              {evento.local}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </MobileCard>
                );
              })}
            </div>
          )}
        </section>

        {/* Eventos Passados */}
        {eventosPassados.length > 0 && (
          <section>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3 px-1">
              Eventos Anteriores
            </h3>
            <div className="space-y-3">
              {eventosPassados.map((evento) => {
                const statusInfo = getStatusInfo(evento.status);
                return (
                  <MobileCard key={evento.id} className="p-4 opacity-70">
                    <div className="flex gap-3">
                      <div className="size-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-lg">{getTipoIcon(evento.tipo)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm text-slate-700 dark:text-slate-300 truncate">{evento.titulo}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          {evento.data && (
                            <span className="text-[10px] text-slate-400">
                              {formatDate(evento.data, "short")}
                            </span>
                          )}
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                        </div>
                      </div>
                    </div>
                  </MobileCard>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </MobileLayout>
  );
}

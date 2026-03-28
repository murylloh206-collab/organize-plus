import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import MobileLayout from "../../components/layout/MobileLayout";
import MobileHeader from "../../components/layout/MobileHeader";
import MobileButton from "../../components/ui/MobileButton";
import MobileInput from "../../components/ui/MobileInput";
import MobileBadge from "../../components/ui/MobileBadge";
import BottomSheet from "../../components/ui/BottomSheet";
import Skeleton from "../../components/ui/Skeleton";
import { useBottomSheet } from "../../hooks/useBottomSheet";
import { apiRequest } from "../../lib/queryClient";
import { formatDate } from "../../components/shared/DateFormat";
import { useAuth } from "../../hooks/useAuth";
import LocationPicker from "../../components/ui/LocationPicker";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, startOfWeek, endOfWeek, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Evento {
  id: number;
  titulo: string;
  descricao?: string;
  data: string;
  tipo: string;
  local?: string;
  status: string;
}

const tipoColors: Record<string, string> = {
  formatura: "bg-purple-500",
  ensaio: "bg-blue-500",
  reuniao: "bg-green-500",
  festa: "bg-pink-500",
  meta: "bg-yellow-500",
  outro: "bg-gray-500",
};

const tipoLabel: Record<string, string> = {
  formatura: "Formatura",
  ensaio: "Ensaio",
  reuniao: "Reunião",
  festa: "Festa",
  meta: "Meta",
  outro: "Outro",
};

export default function AdminEventos() {
  const { auth } = useAuth();
  const qc = useQueryClient();
  const formSheet = useBottomSheet();
  const detailSheet = useBottomSheet();
  const [error, setError] = useState("");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<Evento | null>(null);
  const [editingEvento, setEditingEvento] = useState<Evento | null>(null);

  // Form
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [data, setData] = useState("");
  const [tipo, setTipo] = useState("outro");
  const [local, setLocal] = useState("");

  const { data: eventos = [], isLoading, refetch } = useQuery<Evento[]>({
    queryKey: ["eventos", auth?.salaId],
    queryFn: () => apiRequest("GET", `/eventos?salaId=${auth?.salaId}`),
    enabled: !!auth?.salaId,
  });

  const criar = useMutation({
    mutationFn: (d: any) => apiRequest("POST", "/eventos", d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["eventos"] });
      formSheet.close();
      resetForm();
      setError("");
    },
    onError: (e: any) => setError(e.message),
  });

  const atualizar = useMutation({
    mutationFn: ({ id, ...data }: any) => apiRequest("PUT", `/eventos/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["eventos"] });
      formSheet.close();
      resetForm();
      setEditingEvento(null);
      setError("");
    },
    onError: (e: any) => setError(e.message),
  });

  const deletar = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/eventos/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["eventos"] }),
    onError: (e: any) => setError(e.message),
  });

  const resetForm = () => {
    setTitulo("");
    setDescricao("");
    setData("");
    setTipo("outro");
    setLocal("");
    setEditingEvento(null);
  };

  const handleEdit = (evento: Evento) => {
    setEditingEvento(evento);
    setTitulo(evento.titulo);
    setDescricao(evento.descricao || "");
    setData(evento.data.split("T")[0]);
    setTipo(evento.tipo);
    setLocal(evento.local || "");
    formSheet.open();
  };

  const getEventosDoDia = (date: Date) => {
    return eventos.filter(evento => isSameDay(new Date(evento.data), date));
  };

  // Calendário
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const previousMonth = () => setCurrentMonth(prev => subMonths(prev, 1));
  const nextMonth = () => setCurrentMonth(prev => addMonths(prev, 1));

  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  const handleCreateOrUpdate = () => {
    if (!titulo || !data) {
      setError("Título e data são obrigatórios");
      return;
    }

    // Validar data
    const dataObj = new Date(data);
    if (isNaN(dataObj.getTime())) {
      setError("Data inválida");
      return;
    }

    const dados = { 
      titulo, 
      descricao, 
      data: dataObj.toISOString(),
      tipo, 
      local: local || null, 
      status: "planejado",
      salaId: auth?.salaId,
    };

    if (editingEvento) {
      atualizar.mutate({ id: editingEvento.id, ...dados });
    } else {
      criar.mutate(dados);
    }
  };

  return (
    <MobileLayout role="admin">
      <MobileHeader title="Eventos" subtitle="Calendário da turma" gradient />

      <div className="px-4 py-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} variant="card" />)}
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-sm">
            {/* Header do calendário */}
            <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
              <button
                onClick={previousMonth}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
              </h3>
              <button
                onClick={nextMonth}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>

            {/* Dias da semana */}
            <div className="grid grid-cols-7 gap-px bg-slate-100 dark:bg-slate-800">
              {weekDays.map(day => (
                <div key={day} className="py-2 text-center text-xs font-medium text-slate-500">
                  {day}
                </div>
              ))}
            </div>

            {/* Dias do mês */}
            <div className="grid grid-cols-7 gap-px bg-slate-100 dark:bg-slate-800">
              {calendarDays.map((day, idx) => {
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isToday = isSameDay(day, new Date());
                const dayEvents = getEventosDoDia(day);
                const hasEvents = dayEvents.length > 0;

                return (
                  <button
                    key={idx}
                    onClick={() => {
                      if (dayEvents.length === 1) {
                        setSelectedEvent(dayEvents[0]);
                        detailSheet.open();
                      } else if (dayEvents.length > 1) {
                        setSelectedEvent(null);
                        detailSheet.open();
                      }
                    }}
                    className={`
                      min-h-[80px] p-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors
                      ${!isCurrentMonth ? "opacity-40" : ""}
                      ${isToday ? "bg-gold/5 border-2 border-gold/30" : ""}
                    `}
                  >
                    <div className="flex flex-col items-center">
                      <span className={`
                        text-sm font-medium
                        ${isToday ? "text-gold font-bold" : "text-slate-700 dark:text-slate-300"}
                      `}>
                        {format(day, "d")}
                      </span>
                      {hasEvents && (
                        <div className="mt-1 space-y-0.5 w-full">
                          {dayEvents.slice(0, 2).map(event => (
                            <div
                              key={event.id}
                              className={`h-1.5 rounded-full ${tipoColors[event.tipo] || "bg-gray-500"}`}
                              title={event.titulo}
                            />
                          ))}
                          {dayEvents.length > 2 && (
                            <div className="text-[10px] text-center text-slate-400">
                              +{dayEvents.length - 2}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Botão flutuante + */}
      <button
        onClick={() => {
          resetForm();
          formSheet.open();
        }}
        className="fixed bottom-20 right-4 w-14 h-14 bg-gold rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-transform z-40"
      >
        <span className="material-symbols-outlined text-white text-2xl">add</span>
      </button>

      {/* Modal de detalhes do evento */}
      <BottomSheet isOpen={detailSheet.isOpen} onClose={detailSheet.close} title={selectedEvent?.titulo || "Eventos do dia"} maxHeight="70vh">
        {selectedEvent ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${tipoColors[selectedEvent.tipo] || "bg-gray-500"}`} />
              <span className="text-sm text-slate-500">{tipoLabel[selectedEvent.tipo] || selectedEvent.tipo}</span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {formatDate(selectedEvent.data)}
            </p>
            {selectedEvent.local && (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <span className="material-symbols-outlined text-sm">location_on</span>
                {selectedEvent.local}
              </div>
            )}
            {selectedEvent.descricao && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <p className="text-sm text-slate-600 dark:text-slate-400">{selectedEvent.descricao}</p>
              </div>
            )}
            <div className="flex gap-2 pt-2">
              <MobileButton 
                variant="secondary" 
                fullWidth 
                icon="edit"
                onClick={() => {
                  detailSheet.close();
                  handleEdit(selectedEvent);
                }}
              >
                Editar
              </MobileButton>
              <MobileButton 
                variant="danger" 
                fullWidth 
                icon="delete"
                onClick={() => {
                  if (confirm("Excluir evento?")) {
                    deletar.mutate(selectedEvent.id);
                    detailSheet.close();
                  }
                }}
              >
                Excluir
              </MobileButton>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {getEventosDoDia(currentMonth).map(event => (
              <div
                key={event.id}
                onClick={() => {
                  setSelectedEvent(event);
                }}
                className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${tipoColors[event.tipo] || "bg-gray-500"}`} />
                  <span className="font-medium text-sm">{event.titulo}</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">{formatDate(event.data)}</p>
              </div>
            ))}
          </div>
        )}
      </BottomSheet>

      {/* Bottom Sheet para criar/editar evento */}
      <BottomSheet isOpen={formSheet.isOpen} onClose={() => { formSheet.close(); resetForm(); }} title={editingEvento ? "Editar Evento" : "Novo Evento"} maxHeight="85vh">
        <div className="space-y-4 pb-20">
          <MobileInput 
            label="Título" 
            icon="event" 
            placeholder="ex: Ensaio de formatura" 
            value={titulo} 
            onChange={(e) => setTitulo(e.target.value)} 
          />
          
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <span className="material-symbols-outlined text-gold text-sm">category</span>
              Tipo
            </label>
            <select 
              value={tipo} 
              onChange={(e) => setTipo(e.target.value)} 
              className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold/50 appearance-none"
            >
              <option value="formatura">Formatura</option>
              <option value="ensaio">Visita</option>
              <option value="reuniao">Reunião</option>
              <option value="festa">Trote</option>
              <option value="meta">Meta</option>
              <option value="outro">Outro</option>
            </select>
          </div>
          
          <MobileInput 
            label="Data" 
            icon="calendar_today" 
            type="date" 
            value={data} 
            onChange={(e) => setData(e.target.value)} 
          />
          
          <LocationPicker 
            value={local}
            onChange={setLocal}
            label="Local (opcional)"
          />
          
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Descrição (opcional)</label>
            <textarea 
              value={descricao} 
              onChange={(e) => setDescricao(e.target.value)} 
              rows={3} 
              className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-gold/50 resize-none" 
              placeholder="Detalhes do evento..."
            />
          </div>
          
          {error && <p className="text-sm text-danger">{error}</p>}
          
          <div className="grid grid-cols-2 gap-3 pt-2">
            <MobileButton variant="secondary" fullWidth onClick={() => { formSheet.close(); resetForm(); }}>
              Cancelar
            </MobileButton>
            <MobileButton 
              variant="gold" 
              fullWidth 
              loading={criar.isPending || atualizar.isPending}
              onClick={handleCreateOrUpdate}
            >
              {editingEvento ? "Atualizar" : "Criar Evento"}
            </MobileButton>
          </div>
        </div>
      </BottomSheet>
    </MobileLayout>
  );
}
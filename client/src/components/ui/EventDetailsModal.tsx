// client/src/components/ui/EventDetailsModal.tsx
import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import BottomSheet from "./BottomSheet";
import MobileBadge from "./MobileBadge";
import { formatDate } from "../shared/DateFormat";

interface EventDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  events: Array<{
    id: number;
    titulo: string;
    descricao?: string;
    data: string;
    tipo: string;
    local?: string;
    foto?: string;
    status?: string;
  }>;
  selectedDate: Date;
}

const tipoColors: Record<string, { bg: string; text: string; lightBg: string }> = {
  formatura: { bg: "bg-purple-500", text: "text-purple-600", lightBg: "bg-purple-50" },
  ensaio: { bg: "bg-blue-500", text: "text-blue-600", lightBg: "bg-blue-50" },
  reuniao: { bg: "bg-green-500", text: "text-green-600", lightBg: "bg-green-50" },
  festa: { bg: "bg-pink-500", text: "text-pink-600", lightBg: "bg-pink-50" },
  meta: { bg: "bg-yellow-500", text: "text-yellow-600", lightBg: "bg-yellow-50" },
  outro: { bg: "bg-gray-500", text: "text-gray-600", lightBg: "bg-gray-50" },
};

const tipoLabel: Record<string, string> = {
  formatura: "Formatura",
  ensaio: "Ensaio",
  reuniao: "Reunião",
  festa: "Festa",
  meta: "Meta",
  outro: "Outro",
};

export default function EventDetailsModal({ isOpen, onClose, events, selectedDate }: EventDetailsModalProps) {
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const handleEventClick = (event: any) => {
    setSelectedEvent(event);
    setIsDetailOpen(true);
  };

  const formatarHorario = (dataString: string) => {
    const date = new Date(dataString);
    return format(date, "HH:mm", { locale: ptBR });
  };

  const formatarData = (dataString: string) => {
    const date = new Date(dataString);
    return format(date, "dd/MM/yyyy", { locale: ptBR });
  };

  if (events.length === 0) return null;

  return (
    <>
      {/* Modal de lista de eventos do dia (BottomSheet) */}
      <BottomSheet 
        isOpen={isOpen} 
        onClose={onClose} 
        title={`Eventos - ${format(selectedDate, "dd/MM/yyyy", { locale: ptBR })}`} 
        maxHeight="70vh"
      >
        <div className="space-y-3 pb-6">
          {events.map(event => (
            <div
              key={event.id}
              onClick={() => handleEventClick(event)}
              className={`${tipoColors[event.tipo]?.lightBg || "bg-slate-50"} rounded-xl p-4 cursor-pointer hover:shadow-md transition-shadow`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-bold text-slate-900 dark:text-white">{event.titulo}</h4>
                  <div className="flex items-center gap-2 mt-2">
                    <div className={`w-3 h-3 rounded-full ${tipoColors[event.tipo]?.bg || "bg-gray-500"}`} />
                    <span className="text-xs text-slate-500">{tipoLabel[event.tipo] || event.tipo}</span>
                    {event.local && (
                      <>
                        <span className="text-xs text-slate-300">•</span>
                        <span className="text-xs text-slate-500 flex items-center gap-0.5">
                          <span className="material-symbols-outlined text-xs">location_on</span>
                          {event.local}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <span className="material-symbols-outlined text-slate-400 text-xl">chevron_right</span>
              </div>
            </div>
          ))}
        </div>
      </BottomSheet>

      {/* Modal de detalhes do evento (Centralizado) */}
      {selectedEvent && (
        <div
          className={`fixed inset-0 z-[110] flex items-center justify-center p-4 transition-all ${
            isDetailOpen ? "bg-black/50 backdrop-blur-sm" : "pointer-events-none"
          }`}
          onClick={() => setIsDetailOpen(false)}
        >
          <div
            className={`bg-white dark:bg-slate-900 rounded-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden shadow-2xl transition-all ${
              isDetailOpen ? "scale-100 opacity-100" : "scale-95 opacity-0"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col md:flex-row h-full">
              {/* Lado Esquerdo - Informações */}
              <div className="flex-1 p-6 overflow-y-auto">
                {/* Cabeçalho */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${tipoColors[selectedEvent.tipo]?.bg || "bg-gray-500"}`} />
                    <span className="text-sm font-medium text-slate-500">
                      {tipoLabel[selectedEvent.tipo] || selectedEvent.tipo}
                    </span>
                  </div>
                  <button
                    onClick={() => setIsDetailOpen(false)}
                    className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <span className="material-symbols-outlined text-slate-500">close</span>
                  </button>
                </div>

                {/* Título */}
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                  {selectedEvent.titulo}
                </h2>

                {/* Data e Horário */}
                <div className="flex items-center gap-4 mb-4 text-sm text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-base">calendar_today</span>
                    <span>{formatarData(selectedEvent.data)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-base">schedule</span>
                    <span>{formatarHorario(selectedEvent.data)}</span>
                  </div>
                </div>

                {/* Local */}
                {selectedEvent.local && (
                  <div className="flex items-center gap-2 mb-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <span className="material-symbols-outlined text-gold">location_on</span>
                    <span className="text-sm text-slate-700 dark:text-slate-300">{selectedEvent.local}</span>
                  </div>
                )}

                {/* Descrição */}
                {selectedEvent.descricao && (
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Descrição</h3>
                    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                        {selectedEvent.descricao}
                      </p>
                    </div>
                  </div>
                )}

                {/* Botão Fechar (Mobile) */}
                <button
                  onClick={() => setIsDetailOpen(false)}
                  className="w-full mt-4 md:hidden py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400 font-medium"
                >
                  Fechar
                </button>
              </div>

              {/* Lado Direito - Foto */}
              <div className="md:w-80 bg-slate-100 dark:bg-slate-800 flex items-center justify-center p-4">
                {selectedEvent.foto ? (
                  <img
                    src={selectedEvent.foto}
                    alt={selectedEvent.titulo}
                    className="w-full h-auto max-h-[400px] object-cover rounded-xl shadow-lg"
                  />
                ) : (
                  <div className="w-full h-64 flex flex-col items-center justify-center text-slate-400">
                    <span className="material-symbols-outlined text-5xl mb-2">image_not_supported</span>
                    <span className="text-sm">Sem foto</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
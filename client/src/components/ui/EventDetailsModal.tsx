import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import BottomSheet from "./BottomSheet";
import MobileBadge from "./MobileBadge";

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

const tipoColors: Record<string, { bg: string; text: string }> = {
  formatura: { bg: "bg-purple-500/10", text: "text-purple-600" },
  ensaio: { bg: "bg-blue-500/10", text: "text-blue-600" },
  reuniao: { bg: "bg-green-500/10", text: "text-green-600" },
  festa: { bg: "bg-pink-500/10", text: "text-pink-600" },
  meta: { bg: "bg-yellow-500/10", text: "text-yellow-600" },
  outro: { bg: "bg-gray-500/10", text: "text-gray-600" },
};

const tipoLabel: Record<string, string> = {
  formatura: "🎓 Formatura",
  ensaio: "🚌 Visita",
  reuniao: "👥 Reunião",
  festa: "🎉 Trote",
  meta: "🎯 Meta",
  outro: "📌 Outro",
};

export default function EventDetailsModal({ isOpen, onClose, events, selectedDate }: EventDetailsModalProps) {
  if (events.length === 0) return null;

  return (
    <BottomSheet 
      isOpen={isOpen} 
      onClose={onClose} 
      title={`Eventos - ${format(selectedDate, "dd/MM/yyyy", { locale: ptBR })}`} 
      maxHeight="80vh"
    >
      <div className="space-y-3 pb-20">
        {events.map(event => (
          <div
            key={event.id}
            className="bg-slate-50 dark:bg-slate-800 rounded-xl overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
          >
            {event.foto && (
              <img
                src={event.foto}
                alt={event.titulo}
                className="w-full h-40 object-cover"
              />
            )}
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-slate-900 dark:text-white">{event.titulo}</h4>
                <MobileBadge variant="neutral" className={tipoColors[event.tipo]?.bg}>
                  <span className={tipoColors[event.tipo]?.text}>
                    {tipoLabel[event.tipo] || event.tipo}
                  </span>
                </MobileBadge>
              </div>
              {event.descricao && (
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{event.descricao}</p>
              )}
              {event.local && (
                <div className="flex items-center gap-1 mt-2 text-xs text-slate-500">
                  <span className="material-symbols-outlined text-sm">location_on</span>
                  {event.local}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </BottomSheet>
  );
}
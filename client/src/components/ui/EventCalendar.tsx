import { useState, useMemo } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, startOfWeek, endOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";

export interface CalendarEvent {
  id: number;
  titulo: string;
  data: string;
  tipo: string;
  foto?: string;
  descricao?: string;
  local?: string;
  status?: string;
}

interface EventCalendarProps {
  events: CalendarEvent[];
  onDayClick: (date: Date, events: CalendarEvent[]) => void;
}

const tipoColors: Record<string, string> = {
  formatura: "bg-purple-500",
  ensaio: "bg-blue-500",
  reuniao: "bg-green-500",
  festa: "bg-pink-500",
  meta: "bg-yellow-500",
  outro: "bg-gray-500",
};

export default function EventCalendar({ events, onDayClick }: EventCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getEventsForDay = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.data);
      return isSameDay(eventDate, date);
    });
  };

  const handleDayClick = (date: Date) => {
    const dayEvents = getEventsForDay(date);
    onDayClick(date, dayEvents);
  };

  const previousMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  return (
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
          const dayEvents = getEventsForDay(day);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isToday = isSameDay(day, new Date());

          return (
            <button
              key={idx}
              onClick={() => handleDayClick(day)}
              className={`
                min-h-[80px] p-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors
                ${!isCurrentMonth ? "opacity-40" : ""}
                ${isToday ? "bg-gold/5" : ""}
              `}
            >
              <div className="flex flex-col items-center">
                <span className={`
                  text-sm font-medium
                  ${isToday ? "text-gold font-bold" : "text-slate-700 dark:text-slate-300"}
                `}>
                  {format(day, "d")}
                </span>
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
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import MobileLayout from "../../components/layout/MobileLayout";
import MobileHeader from "../../components/layout/MobileHeader";
import MobileCard from "../../components/ui/MobileCard";
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
import EventCalendar from "../../components/ui/EventCalendar";
import EventDetailsModal from "../../components/ui/EventDetailsModal";

interface Evento {
  id: number;
  titulo: string;
  descricao?: string;
  data: string;
  tipo: string;
  local?: string;
  status: string;
  foto?: string;
}

const tipoLabel: Record<string, string> = {
  formatura: "🎓 Formatura",
  ensaio: "📸 Ensaio",
  reuniao: "👥 Reunião",
  festa: "🎉 Festa",
  meta: "🎯 Meta",
  outro: "📌 Outro",
};

const tipoColors: Record<string, string> = {
  formatura: "bg-purple-500",
  ensaio: "bg-blue-500",
  reuniao: "bg-green-500",
  festa: "bg-pink-500",
  meta: "bg-yellow-500",
  outro: "bg-gray-500",
};

export default function AdminEventos() {
  const { auth } = useAuth();
  const qc = useQueryClient();
  const formSheet = useBottomSheet();
  const [error, setError] = useState("");

  // Form
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [data, setData] = useState("");
  const [tipo, setTipo] = useState("outro");
  const [local, setLocal] = useState("");
  const [foto, setFoto] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState("");
  
  // Calendar
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [selectedDayEvents, setSelectedDayEvents] = useState<Evento[]>([]);
  const [selectedDayDate, setSelectedDayDate] = useState<Date | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  const { data: eventos = [], isLoading } = useQuery<Evento[]>({
    queryKey: ["eventos", auth?.salaId],
    queryFn: () => apiRequest("GET", `/eventos?salaId=${auth?.salaId}`),
    enabled: !!auth?.salaId,
  });

  const criar = useMutation({
    mutationFn: (d: any) => apiRequest("POST", "/eventos", d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["eventos"] });
      formSheet.close();
      setTitulo("");
      setDescricao("");
      setData("");
      setTipo("outro");
      setLocal("");
      setFoto(null);
      setFotoPreview("");
      setError("");
    },
    onError: (e: any) => setError(e.message),
  });

  const deletar = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/eventos/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["eventos"] }),
  });

  const handleFotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const criarComFoto = async () => {
    let fotoUrl = "";
    if (foto) {
      const formData = new FormData();
      formData.append("foto", foto);
      const response = await apiRequest("POST", "/upload", formData);
      fotoUrl = response.url;
    }
    
    criar.mutate({ 
      titulo, 
      descricao, 
      data, 
      tipo, 
      local: local || null, 
      status: "planejado",
      salaId: auth?.salaId,
      foto: fotoUrl
    });
  };

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const futuros = eventos.filter((e: Evento) => new Date(e.data) >= hoje).sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
  const passados = eventos.filter((e: Evento) => new Date(e.data) < hoje).sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

  const EventoCard = ({ evento }: { evento: Evento }) => {
    const d = new Date(evento.data);
    const isPassado = d < hoje;
    const dias = Math.ceil((d.getTime() - hoje.getTime()) / 86400000);
    
    return (
      <MobileCard className={`p-4 ${isPassado ? "opacity-60" : ""} hover:shadow-md transition-all`}>
        <div className="flex items-start gap-3">
          {evento.foto ? (
            <img 
              src={evento.foto} 
              alt={evento.titulo}
              className="size-12 rounded-2xl object-cover flex-shrink-0"
            />
          ) : (
            <div className="size-12 rounded-2xl bg-primary/10 dark:bg-primary/20 flex flex-col items-center justify-center flex-shrink-0">
              <span className="text-lg font-black text-primary dark:text-primary">{d.getDate()}</span>
              <span className="text-[9px] uppercase font-bold text-primary/70">{d.toLocaleString("pt-BR", { month: "short" })}</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-bold text-slate-900 dark:text-white">{evento.titulo}</p>
              <MobileBadge variant="neutral" className="text-[10px]">
                {tipoLabel[evento.tipo] || evento.tipo}
              </MobileBadge>
            </div>
            {evento.descricao && <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{evento.descricao}</p>}
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              {evento.local && (
                <span className="text-xs text-slate-400 flex items-center gap-0.5">
                  <span className="material-symbols-outlined text-xs">location_on</span>{evento.local}
                </span>
              )}
              {!isPassado && dias >= 0 && (
                <span className={`text-xs font-semibold ${
                  dias === 0 ? "text-gold dark:text-gold" : 
                  dias <= 3 ? "text-danger" : 
                  "text-success"
                }`}>
                  {dias === 0 ? "🔥 Hoje" : `📅 Em ${dias} dias`}
                </span>
              )}
            </div>
          </div>
          <button 
            onClick={() => { if (confirm("Excluir evento?")) deletar.mutate(evento.id); }}
            className="p-1.5 text-slate-400 hover:text-danger rounded-lg transition-colors active:scale-90"
          >
            <span className="material-symbols-outlined text-lg">delete</span>
          </button>
        </div>
      </MobileCard>
    );
  };

  return (
    <MobileLayout role="admin">
      <MobileHeader 
        title="Eventos" 
        subtitle="Calendário da turma" 
        gradient
        actions={[{ icon: "add_circle", onClick: formSheet.open, label: "Novo" }]} 
      />

      <div className="px-4 py-4 space-y-4">
        {/* Botão de alternar visualização */}
        <div className="flex justify-end">
          <button
            onClick={() => setCalendarOpen(!calendarOpen)}
            className="flex items-center gap-2 px-3 py-1.5 bg-gold/10 text-gold rounded-lg text-sm transition-colors hover:bg-gold/20"
          >
            <span className="material-symbols-outlined text-sm">
              {calendarOpen ? "list" : "calendar_month"}
            </span>
            {calendarOpen ? "Lista" : "Calendário"}
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1,2,3].map((i) => <Skeleton key={i} variant="card" />)}
          </div>
        ) : calendarOpen ? (
          
        <EventCalendar 
          events={eventos as any}  // ou ajuste o tipo do evento
          onDayClick={(date: Date, events: any[]) => {
            setSelectedDayDate(date);
            setSelectedDayEvents(events as Evento[]);
            setDetailsModalOpen(true);
          }} 
        />
        ) : (
          <>
            {futuros.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="material-symbols-outlined text-gold text-lg">event_upcoming</span>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Próximos Eventos</p>
                  <MobileBadge variant="gold" className="text-[10px]">{futuros.length}</MobileBadge>
                </div>
                <div className="space-y-2">
                  {futuros.map((e: Evento) => <EventoCard key={e.id} evento={e} />)}
                </div>
              </div>
            )}

            {passados.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="material-symbols-outlined text-slate-400 text-lg">history</span>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Eventos Passados</p>
                  <MobileBadge variant="neutral" className="text-[10px]">{passados.length}</MobileBadge>
                </div>
                <div className="space-y-2">
                  {passados.map((e: Evento) => <EventoCard key={e.id} evento={e} />)}
                </div>
              </div>
            )}

            {eventos.length === 0 && (
              <MobileCard className="text-center py-12">
                <span className="material-symbols-outlined text-slate-300 dark:text-slate-600 text-5xl">event</span>
                <p className="text-slate-500 mt-3 text-sm">Nenhum evento cadastrado</p>
                <MobileButton variant="primary" size="sm" icon="add_circle" className="mt-3" onClick={formSheet.open}>
                  Criar evento
                </MobileButton>
              </MobileCard>
            )}
          </>
        )}
      </div>

      {/* Modal de detalhes do evento */}
      <EventDetailsModal 
        isOpen={detailsModalOpen}
        onClose={() => {
          setDetailsModalOpen(false);
          setSelectedDayEvents([]);
          setSelectedDayDate(null);
        }}
        events={selectedDayEvents}
        selectedDate={selectedDayDate || new Date()}
      />

      {/* Bottom Sheet para criar evento */}
      <BottomSheet isOpen={formSheet.isOpen} onClose={formSheet.close} title="Novo Evento" maxHeight="85vh">
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
              <option value="formatura">🎓 Dia da formatura</option>
              <option value="ensaio">🚌 Visita</option>
              <option value="reuniao">👥 Reunião</option>
              <option value="festa">🎉 Trote</option>
              <option value="meta">🎯 Meta</option>
              <option value="outro">📌 Outro</option>
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

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Foto do Evento</label>
            <div className="flex items-center gap-3">
              {fotoPreview ? (
                <div className="relative">
                  <img src={fotoPreview} alt="Preview" className="w-20 h-20 rounded-lg object-cover" />
                  <button
                    onClick={() => { setFoto(null); setFotoPreview(""); }}
                    className="absolute -top-2 -right-2 p-1 bg-danger text-white rounded-full"
                  >
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-lg cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border-2 border-dashed border-gold/30">
                  <span className="material-symbols-outlined text-2xl text-gold">add_photo_alternate</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleFotoUpload} />
                </label>
              )}
              <p className="text-xs text-slate-500 flex-1">Adicione uma foto para o evento (opcional)</p>
            </div>
          </div>
          
          {error && <p className="text-sm text-danger">{error}</p>}
          
          <div className="grid grid-cols-2 gap-3 pt-2">
            <MobileButton variant="secondary" fullWidth onClick={formSheet.close}>
              Cancelar
            </MobileButton>
            <MobileButton 
              variant="gold" 
              fullWidth 
              loading={criar.isPending}
              onClick={criarComFoto}
            >
              Criar Evento
            </MobileButton>
          </div>
        </div>
      </BottomSheet>
    </MobileLayout>
  );
}
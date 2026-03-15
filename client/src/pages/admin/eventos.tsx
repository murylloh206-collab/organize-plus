import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Sidebar from "../../components/layout/Sidebar";
import Header from "../../components/layout/Header";
import { apiRequest } from "../../lib/queryClient";

// Função para gerar os dias do calendário
const gerarDiasDoMes = (ano: number, mes: number) => {
  const primeiroDia = new Date(ano, mes, 1);
  const ultimoDia = new Date(ano, mes + 1, 0);
  const diasNoMes = ultimoDia.getDate();
  const diaSemanaInicio = primeiroDia.getDay(); // 0 = Domingo, 1 = Segunda, etc.
  
  const dias = [];
  
  // Dias do mês anterior
  const diasMesAnterior = new Date(ano, mes, 0).getDate();
  for (let i = diaSemanaInicio - 1; i >= 0; i--) {
    dias.push({
      dia: diasMesAnterior - i,
      mes: mes - 1,
      ano,
      isCurrentMonth: false
    });
  }
  
  // Dias do mês atual
  for (let i = 1; i <= diasNoMes; i++) {
    dias.push({
      dia: i,
      mes,
      ano,
      isCurrentMonth: true
    });
  }
  
  // Dias do próximo mês para completar a grade
  const diasRestantes = 42 - dias.length; // 6 linhas * 7 dias = 42
  for (let i = 1; i <= diasRestantes; i++) {
    dias.push({
      dia: i,
      mes: mes + 1,
      ano,
      isCurrentMonth: false
    });
  }
  
  return dias;
};

// Nomes dos meses em português
const meses = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

// Configuração de cores para cada tipo de evento
const tipoEventoConfig = {
  meta: {
    bg: "bg-amber-100 dark:bg-amber-500/20",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-l-2 border-amber-500",
    icon: "stars",
    label: "Meta"
  },
  trote: {
    bg: "bg-orange-100 dark:bg-orange-500/20",
    text: "text-orange-700 dark:text-orange-300",
    border: "border-l-2 border-orange-500",
    icon: "celebration",
    label: "Trote"
  },
  visita: {
    bg: "bg-sky-100 dark:bg-sky-500/20",
    text: "text-sky-700 dark:text-sky-300",
    border: "border-l-2 border-sky-500",
    icon: "school",
    label: "Visita"
  },
  evento: {
    bg: "bg-purple-100 dark:bg-purple-500/20",
    text: "text-purple-700 dark:text-purple-300",
    border: "border-l-2 border-purple-500",
    icon: "event",
    label: "Evento"
  },
  vencimento: {
    bg: "bg-rose-100 dark:bg-rose-500/20",
    text: "text-rose-700 dark:text-rose-300",
    border: "border-l-2 border-rose-500",
    icon: "payments",
    label: "Vencimento"
  },
  prazo: {
    bg: "bg-emerald-100 dark:bg-emerald-500/20",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-l-2 border-emerald-500",
    icon: "schedule",
    label: "Prazo"
  },
  reuniao: {
    bg: "bg-indigo-100 dark:bg-indigo-500/20",
    text: "text-indigo-700 dark:text-indigo-300",
    border: "border-l-2 border-indigo-500",
    icon: "groups",
    label: "Reunião"
  },
  formatura: {
    bg: "bg-gradient-to-r from-yellow-100 to-amber-100 dark:from-yellow-500/20 dark:to-amber-500/20",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-l-2 border-amber-500",
    icon: "celebration",
    label: "Formatura"
  }
};

export default function AdminEventos() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [data, setData] = useState("");
  const [local, setLocal] = useState("");
  const [tipo, setTipo] = useState<keyof typeof tipoEventoConfig>("evento");

  const { data: eventos = [] } = useQuery({ 
    queryKey: ["eventos"], 
    queryFn: () => apiRequest("GET", "/eventos") 
  });

  const criar = useMutation({
    mutationFn: (d: any) => apiRequest("POST", "/eventos", d),
    onSuccess: () => { 
      qc.invalidateQueries({ queryKey: ["eventos"] }); 
      setShowForm(false); 
      setTitulo(""); 
      setDescricao(""); 
      setData(""); 
      setLocal("");
      setTipo("evento");
    },
  });

  const deletar = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/eventos/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["eventos"] }),
  });

  const statusBadge = (s: string) => {
    if (s === "planejado") return <span className="bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 px-2 py-1 rounded-full text-xs font-medium border border-amber-200 dark:border-amber-800">📅 Planejado</span>;
    if (s === "realizado") return <span className="bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-2 py-1 rounded-full text-xs font-medium border border-emerald-200 dark:border-emerald-800">✅ Realizado</span>;
    return <span className="bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 px-2 py-1 rounded-full text-xs font-medium border border-rose-200 dark:border-rose-800">❌ Cancelado</span>;
  };

  const getTipoStyle = (tipo: string) => {
    return tipoEventoConfig[tipo as keyof typeof tipoEventoConfig] || tipoEventoConfig.evento;
  };

  const handleMesAnterior = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleProximoMes = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const diasDoMes = gerarDiasDoMes(currentDate.getFullYear(), currentDate.getMonth());

  // Filtrar eventos do dia
  const getEventosDoDia = (ano: number, mes: number, dia: number) => {
    const dataStr = `${ano}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
    return eventos.filter((ev: any) => ev.data?.startsWith(dataStr));
  };

  // Próximos eventos (ordenados por data)
  const proximosEventos = [...eventos]
    .filter((ev: any) => ev.data && new Date(ev.data) >= new Date())
    .sort((a: any, b: any) => new Date(a.data).getTime() - new Date(b.data).getTime())
    .slice(0, 5);

  return (
    <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark">
      <Sidebar role="admin" />
      <main className="flex-1 flex flex-col overflow-y-auto ml-64">
        <Header title="Eventos" />
        
        {/* Page Content scrollable */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="flex flex-col lg:flex-row gap-8">
            
            {/* Left: Calendar Section */}
            <div className="flex-1 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Calendário Mensal</h3>
                  <p className="text-slate-500 dark:text-slate-400 mt-1">Controle de prazos e eventos da comissão de formatura.</p>
                </div>
                <button 
                  onClick={() => setShowForm(true)}
                  className="flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-lg font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/20"
                >
                  <span className="material-symbols-outlined">add_circle</span>
                  Adicionar Evento
                </button>
              </div>

              {/* Formulário de Novo Evento */}
              {showForm && (
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6 space-y-4 shadow-lg">
                  <h4 className="text-lg font-bold text-slate-900 dark:text-white">Criar Novo Evento</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <input 
                      className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary/20 focus:border-transparent"
                      placeholder="Título do evento" 
                      value={titulo} 
                      onChange={e => setTitulo(e.target.value)} 
                    />
                    <input 
                      className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary/20 focus:border-transparent"
                      placeholder="Local" 
                      value={local} 
                      onChange={e => setLocal(e.target.value)} 
                    />
                    <input 
                      className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary/20 focus:border-transparent"
                      type="datetime-local" 
                      value={data} 
                      onChange={e => setData(e.target.value)} 
                    />
                    <select
                      className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary/20 focus:border-transparent"
                      value={tipo}
                      onChange={e => setTipo(e.target.value as keyof typeof tipoEventoConfig)}
                    >
                      {Object.entries(tipoEventoConfig).map(([key, config]) => (
                        <option key={key} value={key}>{config.label}</option>
                      ))}
                    </select>
                    <input 
                      className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary/20 focus:border-transparent col-span-2"
                      placeholder="Descrição" 
                      value={descricao} 
                      onChange={e => setDescricao(e.target.value)} 
                    />
                  </div>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => criar.mutate({ 
                        titulo, 
                        descricao, 
                        local, 
                        data,
                        tipo,
                        status: "planejado"
                      })} 
                      disabled={criar.isPending} 
                      className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
                    >
                      {criar.isPending ? "Salvando..." : "Salvar Evento"}
                    </button>
                    <button 
                      onClick={() => setShowForm(false)} 
                      className="px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-semibold transition-all"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {/* Legenda de cores */}
              <div className="flex flex-wrap gap-3 p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 mr-2">Tipos:</span>
                {Object.entries(tipoEventoConfig).map(([key, config]) => (
                  <div key={key} className="flex items-center gap-1">
                    <div className={`w-3 h-3 rounded-full ${config.bg} border-2 ${config.border.replace('border-l-2', 'border')}`}></div>
                    <span className="text-xs text-slate-600 dark:text-slate-400">{config.label}</span>
                  </div>
                ))}
              </div>

              {/* Main Monthly Calendar View */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-lg">
                <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-700">
                  <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                    {meses[currentDate.getMonth()]} {currentDate.getFullYear()}
                  </h4>
                  <div className="flex gap-1">
                    <button 
                      onClick={handleMesAnterior}
                      className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400"
                    >
                      <span className="material-symbols-outlined">chevron_left</span>
                    </button>
                    <button 
                      onClick={handleProximoMes}
                      className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400"
                    >
                      <span className="material-symbols-outlined">chevron_right</span>
                    </button>
                  </div>
                </div>

                {/* Dias da semana */}
                <div className="grid grid-cols-7 border-b border-slate-100 dark:border-slate-700">
                  {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map(dia => (
                    <div key={dia} className="p-3 text-center text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">
                      {dia}
                    </div>
                  ))}
                </div>

                {/* Grade do calendário */}
                <div className="grid grid-cols-7 text-sm">
                  {diasDoMes.map((diaInfo, index) => {
                    const eventosDoDia = getEventosDoDia(diaInfo.ano, diaInfo.mes, diaInfo.dia);
                    const hoje = new Date();
                    const isHoje = diaInfo.dia === hoje.getDate() && 
                                   diaInfo.mes === hoje.getMonth() && 
                                   diaInfo.ano === hoje.getFullYear() &&
                                   diaInfo.isCurrentMonth;
                    
                    return (
                      <div 
                        key={index}
                        className={`h-28 p-2 border-r border-b border-slate-100 dark:border-slate-700 relative ${
                          diaInfo.isCurrentMonth 
                            ? isHoje 
                              ? 'bg-primary/5 dark:bg-primary/10 font-semibold' 
                              : 'font-semibold text-slate-900 dark:text-white'
                            : 'text-slate-300 dark:text-slate-600'
                        }`}
                      >
                        <span className={`${isHoje ? 'text-primary font-bold' : ''} ${!diaInfo.isCurrentMonth ? 'opacity-50' : ''}`}>
                          {diaInfo.dia}
                        </span>
                        <div className="mt-1 flex flex-col gap-1 max-h-16 overflow-y-auto">
                          {eventosDoDia.slice(0, 2).map((ev: any) => {
                            const style = getTipoStyle(ev.tipo);
                            return (
                              <div 
                                key={ev.id}
                                className={`text-[10px] p-1 rounded-sm leading-tight font-medium cursor-pointer hover:opacity-80 ${style.bg} ${style.text} ${style.border}`}
                                title={ev.descricao}
                              >
                                {ev.titulo.length > 12 ? ev.titulo.substring(0, 10) + '...' : ev.titulo}
                              </div>
                            );
                          })}
                          {eventosDoDia.length > 2 && (
                            <div className="text-[10px] text-slate-500 dark:text-slate-400">
                              +{eventosDoDia.length - 2}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Sidebar: Upcoming Events */}
            <div className="w-full lg:w-80 space-y-8">
              <div>
                <h4 className="text-xl font-bold flex items-center gap-2 mb-6 text-slate-900 dark:text-white">
                  <span className="material-symbols-outlined text-primary">upcoming</span>
                  Próximos Compromissos
                </h4>
                <div className="space-y-4">
                  {proximosEventos.length > 0 ? (
                    proximosEventos.map((ev: any) => {
                      const dataEv = new Date(ev.data);
                      const mesAbrev = meses[dataEv.getMonth()].substring(0, 3);
                      const style = getTipoStyle(ev.tipo);
                      
                      return (
                        <div 
                          key={ev.id}
                          className="group flex gap-4 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-primary/50 transition-all cursor-pointer shadow-sm relative"
                        >
                          <div className={`flex flex-col items-center justify-center h-14 w-14 rounded-lg shrink-0 transition-colors ${style.bg} ${style.text}`}>
                            <span className="text-xs font-bold uppercase">{mesAbrev}</span>
                            <span className="text-xl font-black">{dataEv.getDate()}</span>
                          </div>
                          <div className="flex-1">
                            <h5 className="font-bold text-slate-900 dark:text-white">{ev.titulo}</h5>
                            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1">
                              <span className="material-symbols-outlined text-sm">{style.icon}</span>
                              {ev.local || style.label}
                            </p>
                          </div>
                          <button 
                            onClick={() => deletar.mutate(ev.id)}
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-red-500"
                          >
                            <span className="material-symbols-outlined text-sm">close</span>
                          </button>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                      Nenhum evento programado
                    </p>
                  )}
                </div>
              </div>

              {/* Metas / Milestones Section */}
              <div className="p-6 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl text-white shadow-lg relative overflow-hidden">
                <div className="relative z-10">
                  <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined">stars</span>
                    Metas do Mês
                  </h4>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-medium uppercase tracking-wide opacity-90">
                        <span>Arrecadação</span>
                        <span>80%</span>
                      </div>
                      <div className="h-2 bg-white/20 rounded-full">
                        <div className="h-full bg-white rounded-full" style={{ width: "80%" }}></div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 bg-white/10 p-3 rounded-lg border border-white/20 backdrop-blur-sm">
                      <span className="material-symbols-outlined text-amber-300">workspace_premium</span>
                      <div>
                        <p className="text-sm font-bold">Meta Alcançada!</p>
                        <p className="text-xs opacity-90">50% do valor total arrecadado atingido em 15/01.</p>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Decorator circle */}
                <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
              </div>

              {/* Quick Action */}
              <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-600 p-6 text-center group cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <span className="material-symbols-outlined text-slate-400 dark:text-slate-500 mb-2 block">event_repeat</span>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 group-hover:text-primary transition-colors">
                  Sincronizar com Google Agenda
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
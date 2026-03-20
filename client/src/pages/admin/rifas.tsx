import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Sidebar from "../../components/layout/Sidebar";
import Header from "../../components/layout/Header";
import { apiRequest } from "../../lib/queryClient";
import html2canvas from "html2canvas";
import { useAuth } from "../../hooks/useAuth";

interface Ticket {
  id: number;
  numero: number;
  compradorNome: string;
  compradorContato: string | null;
  valor: number;
  status: "pendente" | "pago" | "cancelado";
  vendedorId: number;
  vendedorNome?: string;
  rifaId: number;
}

interface Sorteio {
  id: number;
  nome: string;
  premio: string;
  preco: number;
  status: "ativa" | "encerrada" | "sorteada";
  salaId: number;
  dataSorteio?: string;
  totalNumeros: number;
}

interface Aluno {
  id: number;
  nome: string;
  email: string;
}

export default function AdminSorteios() {
  const qc = useQueryClient();
  const { auth } = useAuth();
  const resultadoRef = useRef<HTMLDivElement>(null);
  
  const [showForm, setShowForm] = useState(false);
  const [showSorteioModal, setShowSorteioModal] = useState(false);
  const [showResultadoModal, setShowResultadoModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [showEditVendaModal, setShowEditVendaModal] = useState(false);
  const [sorteioSelecionado, setSorteioSelecionado] = useState<Sorteio | null>(null);
  const [sorteioExpandido, setSorteioExpandido] = useState<number | null>(null);
  const [sorteioEditando, setSorteioEditando] = useState<Sorteio | null>(null);
  const [ticketSelecionado, setTicketSelecionado] = useState<Ticket | null>(null);
  const [numeroSorteado, setNumeroSorteado] = useState<number | null>(null);
  const [vencedorInfo, setVencedorInfo] = useState<Ticket | null>(null);
  const [isResorteio, setIsResorteio] = useState(false);
  
  // Estados do formulário de criação de sorteio
  const [nome, setNome] = useState("");
  const [premio, setPremio] = useState("");
  const [preco, setPreco] = useState("");
  const [totalNumeros, setTotalNumeros] = useState("200");
  const [dataSorteio, setDataSorteio] = useState("");
  const [error, setError] = useState("");
  
  // Estados do formulário de edição de sorteio
  const [editNome, setEditNome] = useState("");
  const [editPremio, setEditPremio] = useState("");
  const [editPreco, setEditPreco] = useState("");
  const [editTotalNumeros, setEditTotalNumeros] = useState("");
  const [editDataSorteio, setEditDataSorteio] = useState("");
  const [editError, setEditError] = useState("");

  // Estados do formulário de venda
  const [vendaNumero, setVendaNumero] = useState<number | null>(null);
  const [vendaCompradorNome, setVendaCompradorNome] = useState("");
  const [vendaCompradorContato, setVendaCompradorContato] = useState("");
  const [vendaVendedorId, setVendaVendedorId] = useState<number | null>(null);
  const [vendaValor, setVendaValor] = useState("");
  const [vendaError, setVendaError] = useState("");

  // Estados para edição de venda
  const [editVendaCompradorNome, setEditVendaCompradorNome] = useState("");
  const [editVendaCompradorContato, setEditVendaCompradorContato] = useState("");
  const [editVendaVendedorId, setEditVendaVendedorId] = useState<number | null>(null);
  const [editVendaValor, setEditVendaValor] = useState("");
  const [editVendaStatus, setEditVendaStatus] = useState<"pago" | "pendente" | "cancelado">("pendente");
  const [editVendaError, setEditVendaError] = useState("");

  const [sorteando, setSorteando] = useState<number | null>(null);

  // Buscar sorteios
  const { data: sorteios = [], isLoading, refetch: refetchSorteios } = useQuery<Sorteio[]>({ 
    queryKey: ["sorteios"], 
    queryFn: () => apiRequest("GET", "/rifas")
  });

  // Buscar tickets do sorteio selecionado
  const { data: tickets = [], refetch: refetchTickets } = useQuery<Ticket[]>({
    queryKey: ["tickets", sorteioExpandido],
    queryFn: () => sorteioExpandido ? apiRequest("GET", `/rifas/${sorteioExpandido}/tickets`) : Promise.resolve([]),
    enabled: !!sorteioExpandido,
  });

  // Buscar alunos (vendedores)
  const { data: alunos = [] } = useQuery<Aluno[]>({
    queryKey: ["alunos"],
    queryFn: () => apiRequest("GET", "/alunos"),
  });

  // Mapear tickets por número
  const ticketsPorNumero = tickets.reduce((acc: Record<number, Ticket>, ticket: Ticket) => {
    if (ticket.numero) {
      acc[ticket.numero] = ticket;
    }
    return acc;
  }, {});

  // Criar sorteio
  const criar = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/rifas", data),
    onSuccess: () => { 
      refetchSorteios();
      setShowForm(false); 
      resetForm();
    },
    onError: (e: any) => setError(e.message),
  });

  // Editar sorteio
  const editar = useMutation({
    mutationFn: ({ id, ...data }: any) => apiRequest("PUT", `/rifas/${id}`, data),
    onSuccess: () => { 
      refetchSorteios();
      setShowEditModal(false); 
      setSorteioEditando(null);
    },
    onError: (e: any) => setEditError(e.message),
  });

  // Deletar sorteio
  const deletar = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/rifas/${id}`),
    onSuccess: () => { 
      refetchSorteios();
      if (sorteioExpandido) setSorteioExpandido(null);
    },
  });

  // Criar venda (ticket)
  const criarVenda = useMutation({
    mutationFn: (data: any) => {
      if (!sorteioExpandido) throw new Error("Nenhum sorteio selecionado");
      return apiRequest("POST", `/rifas/${sorteioExpandido}/tickets`, data);
    },
    onSuccess: () => { 
      refetchTickets();
      setShowTicketModal(false);
      resetVendaForm();
    },
    onError: (e: any) => setVendaError(e.message),
  });

  // Editar venda
  const editarVenda = useMutation({
    mutationFn: ({ id, ...data }: any) => apiRequest("PUT", `/rifas/tickets/${id}`, data),
    onSuccess: () => { 
      refetchTickets();
      setShowEditVendaModal(false);
      setTicketSelecionado(null);
    },
    onError: (e: any) => setEditVendaError(e.message),
  });

  // Deletar venda
  const deletarVenda = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/rifas/tickets/${id}`),
    onSuccess: () => { 
      refetchTickets();
      if (ticketSelecionado) {
        setShowEditVendaModal(false);
        setTicketSelecionado(null);
      }
    },
  });

  // Sortear
  const sortear = useMutation({
    mutationFn: (id: number) => apiRequest("POST", `/rifas/${id}/sortear`, {}),
    onSuccess: (data) => { 
      refetchSorteios();
      setSorteando(null);
      setNumeroSorteado(data.numeroSorteado);
      setVencedorInfo(data.vencedor);
      setShowResultadoModal(true);
      setIsResorteio(false);
    },
    onError: (e: any) => { 
      setSorteando(null); 
      alert(e.message); 
    },
  });

  const resetForm = () => {
    setNome("");
    setPremio("");
    setPreco("");
    setTotalNumeros("200");
    setDataSorteio("");
    setError("");
  };

  const resetVendaForm = () => {
    setVendaNumero(null);
    setVendaCompradorNome("");
    setVendaCompradorContato("");
    setVendaVendedorId(null);
    setVendaValor("");
    setVendaError("");
  };

  const statusBadge = (s: string) => {
    if (s === "ativa") return <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">Ativo</span>;
    if (s === "encerrada") return <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">Encerrado</span>;
    return <span className="px-2 py-1 bg-rose-100 text-rose-700 rounded-full text-xs font-medium">Sorteado</span>;
  };

  const statusVendaBadge = (s: string) => {
    if (s === "pago") return <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">Pago</span>;
    if (s === "pendente") return <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">Pendente</span>;
    return <span className="px-2 py-1 bg-rose-100 text-rose-700 rounded-full text-xs font-medium">Cancelado</span>;
  };

  const fmt = (v: string | number) => parseFloat(String(v)).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const handleAbrirSorteio = (sorteio: Sorteio) => {
    setSorteioSelecionado(sorteio);
    setShowSorteioModal(true);
  };

  const handleIniciarSorteio = () => {
    setShowSorteioModal(false);
    if (sorteioSelecionado) {
      setSorteando(sorteioSelecionado.id);
      sortear.mutate(sorteioSelecionado.id);
    }
  };

  const handleEdit = (sorteio: Sorteio) => {
    setSorteioEditando(sorteio);
    setEditNome(sorteio.nome);
    setEditPremio(sorteio.premio);
    setEditPreco(sorteio.preco?.toString() || "");
    setEditTotalNumeros(sorteio.totalNumeros?.toString() || "200");
    setEditDataSorteio(sorteio.dataSorteio || "");
    setShowEditModal(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm("Tem certeza que deseja excluir este sorteio?")) {
      deletar.mutate(id);
    }
  };

  const handleNumeroClick = (numero: number) => {
    const ticketExistente = ticketsPorNumero[numero];
    if (ticketExistente) {
      // Se já existe venda, abrir modal de edição
      setTicketSelecionado(ticketExistente);
      setEditVendaCompradorNome(ticketExistente.compradorNome);
      setEditVendaCompradorContato(ticketExistente.compradorContato || "");
      setEditVendaVendedorId(ticketExistente.vendedorId);
      setEditVendaValor(ticketExistente.valor.toString());
      setEditVendaStatus(ticketExistente.status);
      setShowEditVendaModal(true);
    } else {
      // Se não existe, abrir modal de nova venda
      const precoSorteio = sorteios.find((s: Sorteio) => s.id === sorteioExpandido)?.preco || 0;
      setVendaNumero(numero);
      setVendaValor(precoSorteio.toString());
      setShowTicketModal(true);
    }
  };

  const handleSalvarVenda = () => {
    if (!vendaCompradorNome || !vendaVendedorId || !vendaValor) {
      setVendaError("Preencha todos os campos obrigatórios");
      return;
    }

    criarVenda.mutate({
      numero: vendaNumero,
      compradorNome: vendaCompradorNome,
      compradorContato: vendaCompradorContato,
      vendedorId: vendaVendedorId,
      valor: parseFloat(vendaValor),
      status: "pendente"
    });
  };

  const handleSalvarEdicaoVenda = () => {
    if (!ticketSelecionado) return;
    
    if (!editVendaCompradorNome || !editVendaVendedorId || !editVendaValor) {
      setEditVendaError("Preencha todos os campos obrigatórios");
      return;
    }

    editarVenda.mutate({
      id: ticketSelecionado.id,
      compradorNome: editVendaCompradorNome,
      compradorContato: editVendaCompradorContato,
      vendedorId: editVendaVendedorId,
      valor: parseFloat(editVendaValor),
      status: editVendaStatus 
    });
  };

  const handleExcluirVenda = () => {
    if (!ticketSelecionado) return;
    
    if (window.confirm("Tem certeza que deseja excluir esta venda?")) {
      deletarVenda.mutate(ticketSelecionado.id);
    }
  };

  const toggleExpandSorteio = (sorteioId: number) => {
    if (sorteioExpandido === sorteioId) {
      setSorteioExpandido(null);
    } else {
      setSorteioExpandido(sorteioId);
    }
  };

  // Função para baixar o resultado como imagem
  const handleDownloadResultado = async () => {
    if (!resultadoRef.current) return;
    
    try {
      const canvas = await html2canvas(resultadoRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
        allowTaint: true,
        useCORS: true
      });
      
      const link = document.createElement('a');
      link.download = `sorteio-${numeroSorteado}-${new Date().getTime()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Erro ao gerar imagem:', error);
      alert('Erro ao gerar imagem. Tente novamente.');
    }
  };

  // Função para compartilhar
  const handleCompartilhar = async () => {
    if (!vencedorInfo || !numeroSorteado) return;
    
    const texto = `🎉 Resultado do Sorteio! 🎉\n\nNúmero sorteado: ${numeroSorteado.toString().padStart(3, '0')}\nGanhador: ${vencedorInfo.compradorNome}\nContato: ${vencedorInfo.compradorContato || 'Não informado'}\n\nParabéns ao ganhador! 🏆`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Resultado do Sorteio',
          text: texto,
        });
      } catch (error) {
        console.log('Erro ao compartilhar:', error);
        navigator.clipboard.writeText(texto);
        alert('Texto copiado para a área de transferência!');
      }
    } else {
      navigator.clipboard.writeText(texto);
      alert('Texto copiado para a área de transferência!');
    }
  };

  // Calcular estatísticas baseadas em dados reais
  const getEstatisticas = (sorteioId: number) => {
    const ticketsDoSorteio = tickets.filter((t: Ticket) => t.rifaId === sorteioId);
    const numerosVendidos = ticketsDoSorteio.filter((t: Ticket) => t.status === "pago").length;
    const numerosReservados = ticketsDoSorteio.filter((t: Ticket) => t.status === "pendente").length;
    const totalVendidos = numerosVendidos + numerosReservados;
    const sorteio = sorteios.find((s: Sorteio) => s.id === sorteioId);
    const totalNumeros = sorteio?.totalNumeros || 200;
    const percentual = totalNumeros > 0 ? (numerosVendidos / totalNumeros) * 100 : 0;
    const receitaTotal = ticketsDoSorteio
      .filter((t: Ticket) => t.status === "pago")
      .reduce((sum: number, t: Ticket) => sum + t.valor, 0);

    return {
      totalNumeros,
      numerosVendidos,
      numerosReservados,
      totalVendidos,
      percentual,
      receitaTotal
    };
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark">
      <Sidebar role="admin" />
      <main className="flex-1 flex flex-col overflow-y-auto ml-64">
        <Header title="Sorteios" />
        
        <div className="p-8 space-y-6">
          {/* Header com botão de novo sorteio */}
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Gerenciar Sorteios</h3>
              <p className="text-sm text-slate-500 mt-1">{sorteios.length} sorteios encontrados</p>
            </div>
            <button 
              onClick={() => setShowForm(true)} 
              className="bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 shadow-sm"
            >
              <span className="material-symbols-outlined text-sm">add</span> 
              Criar Sorteio
            </button>
          </div>

          {/* Modal de Novo Sorteio */}
          {showForm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-slate-900 rounded-xl p-6 max-w-md w-full shadow-xl">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-xl font-bold text-slate-900 dark:text-white">Novo Sorteio</h4>
                  <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>
                
                <div className="space-y-4">
                  <input
                    className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-primary/20 focus:border-transparent"
                    placeholder="Nome do sorteio"
                    value={nome}
                    onChange={e => setNome(e.target.value)}
                  />
                  <input
                    className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-primary/20 focus:border-transparent"
                    placeholder="Prêmio"
                    value={premio}
                    onChange={e => setPremio(e.target.value)}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-primary/20 focus:border-transparent"
                      type="number"
                      placeholder="Preço do número (R$)"
                      value={preco}
                      onChange={e => setPreco(e.target.value)}
                    />
                    <input
                      className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-primary/20 focus:border-transparent"
                      type="number"
                      placeholder="Total de números"
                      value={totalNumeros}
                      onChange={e => setTotalNumeros(e.target.value)}
                    />
                  </div>
                  <input
                    className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-primary/20 focus:border-transparent"
                    type="date"
                    placeholder="Data do sorteio"
                    value={dataSorteio}
                    onChange={e => setDataSorteio(e.target.value)}
                  />
                  
                  {error && <p className="text-red-500 text-sm">{error}</p>}
                  
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => criar.mutate({ 
                        nome, 
                        premio, 
                        preco: parseFloat(preco), 
                        totalNumeros: parseInt(totalNumeros),
                        dataSorteio: dataSorteio || null,
                        salaId: auth?.salaId,
                        status: "ativa"
                      })}
                      disabled={criar.isPending}
                      className="flex-1 bg-primary hover:bg-primary/90 text-white py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
                    >
                      {criar.isPending ? "Criando..." : "Criar Sorteio"}
                    </button>
                    <button 
                      onClick={() => {
                        setShowForm(false);
                        resetForm();
                      }} 
                      className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 py-2.5 rounded-lg text-sm font-semibold transition-all"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Lista de sorteios em cards expansíveis */}
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-12 text-slate-400">Carregando...</div>
            ) : sorteios.length > 0 ? (
              sorteios.map((s: Sorteio) => {
                const stats = getEstatisticas(s.id);
                
                return (
                  <div key={s.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all">
                    {/* Card principal - sempre visível, clicável para expandir */}
                    <div 
                      onClick={() => toggleExpandSorteio(s.id)}
                      className="p-6 cursor-pointer flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="size-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                          <span className="material-symbols-outlined text-primary text-2xl">confirmation_number</span>
                        </div>
                        <div>
                          <h4 className="font-bold text-lg text-slate-900 dark:text-white">{s.nome}</h4>
                          <p className="text-sm text-slate-500">Prêmio: {s.premio}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-xl font-black text-primary">{fmt(s.preco)}</p>
                          <p className="text-xs text-slate-400">{stats.totalVendidos}/{stats.totalNumeros} vendidos</p>
                        </div>
                        <span className="material-symbols-outlined text-slate-400">
                          {sorteioExpandido === s.id ? 'expand_less' : 'expand_more'}
                        </span>
                      </div>
                    </div>

                    {/* Área expansível - aparece apenas quando o card é clicado */}
                    {sorteioExpandido === s.id && (
                      <div className="border-t border-slate-200 dark:border-slate-800 p-6 bg-slate-50 dark:bg-slate-800/50">
                        <div className="space-y-6">
                          {/* Header do sorteio detalhado */}
                          <div className="flex flex-wrap items-end justify-between gap-4">
                            <div className="flex flex-col gap-2">
                              <nav className="flex text-xs text-slate-500 gap-2 items-center">
                                <span>Meus Sorteios</span>
                                <span className="material-symbols-outlined text-[12px]">chevron_right</span>
                                <span className="text-primary font-semibold">{s.nome}</span>
                              </nav>
                              <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
                                {s.nome}
                              </h2>
                              <p className="text-slate-500 dark:text-slate-400 max-w-lg">
                                {s.dataSorteio ? `Sorteio agendado para ${new Date(s.dataSorteio).toLocaleDateString()}` : 'Data do sorteio a definir'}. 
                                Gerencie os números e visualize as vendas.
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEdit(s);
                                }}
                                className="flex items-center justify-center gap-2 h-11 px-6 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
                              >
                                <span className="material-symbols-outlined text-[20px]">edit</span>
                                Editar
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(s.id);
                                }}
                                className="flex items-center justify-center gap-2 h-11 px-4 rounded-lg border border-red-100 text-red-600 hover:bg-red-50 transition-all"
                              >
                                <span className="material-symbols-outlined text-[20px]">delete</span>
                              </button>
                              {s.status === "ativa" && (
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAbrirSorteio(s);
                                  }}
                                  disabled={sorteando === s.id}
                                  className="flex items-center justify-center gap-2 h-11 px-8 rounded-lg bg-primary text-white text-sm font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                                >
                                  <span className="material-symbols-outlined text-[20px]">celebration</span>
                                  {sorteando === s.id ? "Sorteando..." : "Sortear Agora"}
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Stats Cards com dados reais */}
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                              <div className="flex justify-between items-start mb-4">
                                <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                                  <span className="material-symbols-outlined text-slate-600 dark:text-slate-400">numbers</span>
                                </div>
                                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total</span>
                              </div>
                              <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.totalNumeros}</p>
                              <p className="text-sm text-slate-500 mt-1">Números disponíveis</p>
                            </div>
                            
                            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                              <div className="flex justify-between items-start mb-4">
                                <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg text-green-600">
                                  <span className="material-symbols-outlined">check_circle</span>
                                </div>
                                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Vendidos</span>
                              </div>
                              <p className="text-3xl font-bold text-slate-900 dark:text-white">
                                {stats.numerosVendidos} <span className="text-sm font-normal text-green-600 ml-1">{stats.percentual.toFixed(0)}%</span>
                              </p>
                              <p className="text-sm text-slate-500 mt-1">Números pagos</p>
                            </div>

                            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                              <div className="flex justify-between items-start mb-4">
                                <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-amber-600">
                                  <span className="material-symbols-outlined">pending</span>
                                </div>
                                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Reservados</span>
                              </div>
                              <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.numerosReservados}</p>
                              <p className="text-sm text-slate-500 mt-1">Aguardando pagamento</p>
                            </div>
                            
                            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                              <div className="flex justify-between items-start mb-4">
                                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-primary">
                                  <span className="material-symbols-outlined">payments</span>
                                </div>
                                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Receita</span>
                              </div>
                              <p className="text-3xl font-bold text-slate-900 dark:text-white">
                                {fmt(stats.receitaTotal)}
                              </p>
                              <p className="text-sm text-slate-500 mt-1">Total arrecadado</p>
                            </div>
                          </div>

                          {/* Mapa de Números */}
                          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-wrap justify-between items-center gap-4">
                              <h3 className="text-lg font-bold">Mapa de Números</h3>
                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                  <div className="size-3 rounded-full bg-green-500"></div>
                                  <span className="text-xs text-slate-600 dark:text-slate-400">Pago</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="size-3 rounded-full bg-amber-400"></div>
                                  <span className="text-xs text-slate-600 dark:text-slate-400">Pendente</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="size-3 rounded-full border border-slate-300 dark:border-slate-600 bg-transparent"></div>
                                  <span className="text-xs text-slate-600 dark:text-slate-400">Disponível</span>
                                </div>
                              </div>
                            </div>

                            <div className="p-8">
                              <div className="grid grid-cols-5 sm:grid-cols-10 md:grid-cols-15 lg:grid-cols-20 gap-3">
                                {Array.from({ length: stats.totalNumeros }, (_, i) => {
                                  const numero = i + 1;
                                  const ticket = ticketsPorNumero[numero];
                                  let bgColor = "border border-slate-300 dark:border-slate-700 hover:border-primary hover:text-primary cursor-pointer";
                                  
                                  if (ticket) {
                                    if (ticket.status === "pago") {
                                      bgColor = "bg-green-500 text-white cursor-pointer hover:bg-green-600";
                                    } else if (ticket.status === "pendente") {
                                      bgColor = "bg-amber-400 text-amber-900 cursor-pointer hover:bg-amber-500";
                                    }
                                  }

                                  return (
                                    <div
                                      key={i}
                                      onClick={() => handleNumeroClick(numero)}
                                      className={`aspect-square flex items-center justify-center rounded-lg text-xs font-medium transition-colors ${bgColor}`}
                                    >
                                      {numero.toString().padStart(3, '0')}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12 text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
                Nenhum sorteio criado ainda.
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modal de Edição de Sorteio */}
      {showEditModal && sorteioEditando && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 max-w-md w-full shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-xl font-bold">Editar Sorteio</h4>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="space-y-4">
              <input
                className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-primary/20 focus:border-transparent"
                placeholder="Nome do sorteio"
                value={editNome}
                onChange={e => setEditNome(e.target.value)}
              />
              <input
                className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-primary/20 focus:border-transparent"
                placeholder="Prêmio"
                value={editPremio}
                onChange={e => setEditPremio(e.target.value)}
              />
              <div className="grid grid-cols-2 gap-4">
                <input
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-primary/20 focus:border-transparent"
                  type="number"
                  placeholder="Preço do número (R$)"
                  value={editPreco}
                  onChange={e => setEditPreco(e.target.value)}
                />
                <input
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-primary/20 focus:border-transparent"
                  type="number"
                  placeholder="Total de números"
                  value={editTotalNumeros}
                  onChange={e => setEditTotalNumeros(e.target.value)}
                />
              </div>
              <input
                className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-primary/20 focus:border-transparent"
                type="date"
                placeholder="Data do sorteio"
                value={editDataSorteio}
                onChange={e => setEditDataSorteio(e.target.value)}
              />
              
              {editError && <p className="text-red-500 text-sm">{editError}</p>}
              
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => editar.mutate({ 
                    id: sorteioEditando.id,
                    nome: editNome, 
                    premio: editPremio, 
                    preco: parseFloat(editPreco),
                    totalNumeros: parseInt(editTotalNumeros),
                    dataSorteio: editDataSorteio || null
                  })}
                  disabled={editar.isPending}
                  className="flex-1 bg-primary hover:bg-primary/90 text-white py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
                >
                  {editar.isPending ? "Salvando..." : "Salvar"}
                </button>
                <button 
                  onClick={() => setShowEditModal(false)} 
                  className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 py-2.5 rounded-lg text-sm font-semibold transition-all"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Nova Venda */}
      {showTicketModal && vendaNumero && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 max-w-md w-full shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-xl font-bold">Nova Venda - Número {vendaNumero.toString().padStart(3, '0')}</h4>
              <button onClick={() => { setShowTicketModal(false); resetVendaForm(); }} className="text-slate-400 hover:text-slate-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Nome do Comprador *
                </label>
                <input
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-primary/20 focus:border-transparent"
                  placeholder="Nome completo"
                  value={vendaCompradorNome}
                  onChange={e => setVendaCompradorNome(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Contato (WhatsApp/Telefone)
                </label>
                <input
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-primary/20 focus:border-transparent"
                  placeholder="(00) 00000-0000"
                  value={vendaCompradorContato}
                  onChange={e => setVendaCompradorContato(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Vendedor (Aluno) *
                </label>
                <select
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-primary/20 focus:border-transparent"
                  value={vendaVendedorId || ""}
                  onChange={e => setVendaVendedorId(parseInt(e.target.value))}
                >
                  <option value="">Selecione um vendedor</option>
                  {alunos.map((aluno: Aluno) => (
                    <option key={aluno.id} value={aluno.id}>{aluno.nome}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Valor (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-primary/20 focus:border-transparent"
                  placeholder="0.00"
                  value={vendaValor}
                  onChange={e => setVendaValor(e.target.value)}
                />
              </div>

              {vendaError && <p className="text-red-500 text-sm">{vendaError}</p>}
              
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSalvarVenda}
                  disabled={criarVenda.isPending}
                  className="flex-1 bg-primary hover:bg-primary/90 text-white py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
                >
                  {criarVenda.isPending ? "Salvando..." : "Salvar Venda"}
                </button>
                <button 
                  onClick={() => { setShowTicketModal(false); resetVendaForm(); }} 
                  className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 py-2.5 rounded-lg text-sm font-semibold transition-all"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edição de Venda */}
      {showEditVendaModal && ticketSelecionado && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 max-w-md w-full shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-xl font-bold">Editar Venda - Número {ticketSelecionado.numero.toString().padStart(3, '0')}</h4>
              <button onClick={() => { setShowEditVendaModal(false); setTicketSelecionado(null); }} className="text-slate-400 hover:text-slate-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Status da Venda *
                </label>
                <select
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-primary/20 focus:border-transparent"
                  value={editVendaStatus}
                  onChange={e => setEditVendaStatus(e.target.value as "pago" | "pendente" | "cancelado")}
                >
                  <option value="pendente">🔵 Pendente</option>
                  <option value="pago">🟢 Pago</option>
                  <option value="cancelado">🔴 Cancelado</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Nome do Comprador *
                </label>
                <input
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-primary/20 focus:border-transparent"
                  placeholder="Nome completo"
                  value={editVendaCompradorNome}
                  onChange={e => setEditVendaCompradorNome(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Contato (WhatsApp/Telefone)
                </label>
                <input
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-primary/20 focus:border-transparent"
                  placeholder="(00) 00000-0000"
                  value={editVendaCompradorContato}
                  onChange={e => setEditVendaCompradorContato(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Vendedor (Aluno) *
                </label>
                <select
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-primary/20 focus:border-transparent"
                  value={editVendaVendedorId || ""}
                  onChange={e => setEditVendaVendedorId(parseInt(e.target.value))}
                >
                  <option value="">Selecione um vendedor</option>
                  {alunos.map((aluno: Aluno) => (
                    <option key={aluno.id} value={aluno.id}>{aluno.nome}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Valor (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-primary/20 focus:border-transparent"
                  placeholder="0.00"
                  value={editVendaValor}
                  onChange={e => setEditVendaValor(e.target.value)}
                />
              </div>

              {editVendaError && <p className="text-red-500 text-sm">{editVendaError}</p>}
              
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSalvarEdicaoVenda}
                  disabled={editarVenda.isPending}
                  className="flex-1 bg-primary hover:bg-primary/90 text-white py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
                >
                  {editarVenda.isPending ? "Salvando..." : "Salvar"}
                </button>
                <button 
                  onClick={() => { setShowEditVendaModal(false); setTicketSelecionado(null); }} 
                  className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 py-2.5 rounded-lg text-sm font-semibold transition-all"
                >
                  Cancelar
                </button>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                <button
                  onClick={handleExcluirVenda}
                  disabled={deletarVenda.isPending}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-all disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-sm">delete</span>
                  {deletarVenda.isPending ? "Excluindo..." : "Excluir Venda"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Sorteio */}
      {showSorteioModal && sorteioSelecionado && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="p-8 text-center flex flex-col items-center gap-6">
              <div className="size-20 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined !text-4xl">
                  {isResorteio ? 'autorenew' : 'celebration'}
                </span>
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">
                  {isResorteio ? 'Realizar novo sorteio?' : 'Preparado para o Sorteio?'}
                </h3>
                <p className="text-slate-500 dark:text-slate-400">
                  {isResorteio 
                    ? 'Um novo número será sorteado. O resultado anterior será substituído.'
                    : 'Esta ação irá sortear aleatoriamente um número entre os vendidos e definirá o ganhador do sorteio.'}
                </p>
              </div>
              <div className="w-full bg-slate-50 dark:bg-slate-800 p-6 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-slate-500 uppercase font-bold tracking-widest">Universo de Sorteio</span>
                  <span className="text-xl font-bold text-primary">{getEstatisticas(sorteioSelecionado.id).numerosVendidos} Números Pagos</span>
                </div>
              </div>
              <div className="flex gap-4 w-full">
                <button 
                  onClick={() => {
                    setShowSorteioModal(false);
                    setIsResorteio(false);
                  }}
                  className="flex-1 h-12 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleIniciarSorteio}
                  className="flex-1 h-12 rounded-lg bg-primary text-white font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all"
                >
                  {isResorteio ? 'Sortear Novamente' : 'Iniciar Sorteio'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Resultado do Sorteio */}
      {showResultadoModal && vencedorInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div ref={resultadoRef} className="relative w-full max-w-[520px] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="flex flex-col items-center p-8 text-center relative z-10">
              <div className="mb-6 flex justify-center">
                <div className="w-20 h-20 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-5xl">auto_awesome</span>
                </div>
              </div>

              <h2 className="text-slate-900 dark:text-slate-100 text-2xl font-bold leading-tight mb-2">
                O número sorteado foi...
              </h2>
              
              <div className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl p-8 mb-6 relative">
                <div className="relative">
                  <span className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-widest block mb-2">
                    Número Ganhador
                  </span>
                  <div className="text-7xl md:text-8xl font-black text-primary dark:text-primary tracking-tighter tabular-nums drop-shadow-sm">
                    {numeroSorteado?.toString().padStart(3, '0')}
                  </div>
                </div>
              </div>

              <div className="w-full bg-primary/5 rounded-xl p-6 mb-8 text-left">
                <h3 className="font-bold text-lg mb-3 text-primary">Dados do Ganhador</h3>
                <div className="space-y-2">
                  <p><span className="font-medium text-slate-600">Nome:</span> {vencedorInfo.compradorNome}</p>
                  {vencedorInfo.compradorContato && (
                    <p><span className="font-medium text-slate-600">Contato:</span> {vencedorInfo.compradorContato}</p>
                  )}
                  <p><span className="font-medium text-slate-600">Número:</span> {vencedorInfo.numero.toString().padStart(3, '0')}</p>
                </div>
              </div>

              <div className="flex flex-col w-full gap-3">
                <div className="flex gap-3">
                  <button 
                    onClick={handleCompartilhar}
                    className="flex-1 flex items-center justify-center gap-2 h-12 rounded-lg border border-primary text-primary font-bold hover:bg-primary/5 transition-all"
                  >
                    <span className="material-symbols-outlined">share</span>
                    Compartilhar
                  </button>
                  <button 
                    onClick={handleDownloadResultado}
                    className="flex-1 flex items-center justify-center gap-2 h-12 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                  >
                    <span className="material-symbols-outlined">download</span>
                    Baixar
                  </button>
                </div>
                
                {/* Botão Sortear Novamente */}
                <button 
                  onClick={() => {
                    setShowResultadoModal(false);
                    setShowSorteioModal(true);
                    setIsResorteio(true);
                  }}
                  className="flex items-center justify-center w-full h-12 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-colors shadow-lg shadow-amber-500/20"
                >
                  <span className="material-symbols-outlined mr-2">refresh</span>
                  Sortear Novamente
                </button>
                
                <button 
                  onClick={() => setShowResultadoModal(false)}
                  className="flex items-center justify-center w-full h-12 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-lg font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
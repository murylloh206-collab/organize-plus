import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import MobileLayout from "../../components/layout/MobileLayout";
import MobileHeader from "../../components/layout/MobileHeader";
import MobileCard from "../../components/ui/MobileCard";
import MobileMetricCard from "../../components/ui/MobileMetricCard";
import MobileButton from "../../components/ui/MobileButton";
import MobileInput from "../../components/ui/MobileInput";
import MobileBadge from "../../components/ui/MobileBadge";
import BottomSheet from "../../components/ui/BottomSheet";
import Skeleton from "../../components/ui/Skeleton";
import { useBottomSheet } from "../../hooks/useBottomSheet";
import { apiRequest } from "../../lib/queryClient";
import { useAuth } from "../../hooks/useAuth";
import { formatCurrency } from "../../components/shared/CurrencyFormat";
import html2canvas from "html2canvas";

interface Ticket {
  id: number;
  numero: number;
  compradorNome: string;
  compradorContato: string | null;
  valor: number;
  status: "pendente" | "pago" | "cancelado";
  vendedorId: number;
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

interface Aluno { id: number; nome: string; }

export default function AdminRifas() {
  const qc = useQueryClient();
  const { auth } = useAuth();
  const resultadoRef = useRef<HTMLDivElement>(null);

  const criarSheet = useBottomSheet();
  const editSheet = useBottomSheet();
  const vendaSheet = useBottomSheet();
  const editVendaSheet = useBottomSheet();
  const sorteioSheet = useBottomSheet();
  const resultSheet = useBottomSheet();

  const [sorteioExpandido, setSorteioExpandido] = useState<number | null>(null);
  const [sorteioSelecionado, setSorteioSelecionado] = useState<Sorteio | null>(null);
  const [sorteioEditando, setSorteioEditando] = useState<Sorteio | null>(null);
  const [ticketSelecionado, setTicketSelecionado] = useState<Ticket | null>(null);
  const [vendaNumero, setVendaNumero] = useState<number | null>(null);
  const [numeroSorteado, setNumeroSorteado] = useState<number | null>(null);
  const [vencedorInfo, setVencedorInfo] = useState<Ticket | null>(null);
  const [sorteando, setSorteando] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [vendaError, setVendaError] = useState("");

  // Criar sorteio
  const [formData, setFormData] = useState({
    nome: "",
    premio: "",
    preco: "",
    totalNumeros: "200",
    dataSorteio: "",
  });

  // Editar sorteio
  const [editFormData, setEditFormData] = useState({
    nome: "",
    premio: "",
    preco: "",
    totalNumeros: "200",
    dataSorteio: "",
  });

  // Venda
  const [vendaData, setVendaData] = useState({
    compradorNome: "",
    compradorContato: "",
    vendedorId: null as number | null,
    valor: "",
  });

  // Editar venda
  const [editVendaData, setEditVendaData] = useState({
    compradorNome: "",
    compradorContato: "",
    vendedorId: null as number | null,
    valor: "",
    status: "pendente" as "pago" | "pendente" | "cancelado",
  });

  const { data: sorteios = [], isLoading, refetch: refetchSorteios } = useQuery<Sorteio[]>({
    queryKey: ["sorteios"],
    queryFn: () => apiRequest("GET", "/rifas"),
  });

  const { data: tickets = [], refetch: refetchTickets } = useQuery<Ticket[]>({
    queryKey: ["tickets", sorteioExpandido],
    queryFn: () => sorteioExpandido ? apiRequest("GET", `/rifas/${sorteioExpandido}/tickets`) : Promise.resolve([]),
    enabled: !!sorteioExpandido,
  });

  const { data: alunos = [] } = useQuery<Aluno[]>({
    queryKey: ["alunos", auth?.salaId],
    queryFn: () => apiRequest("GET", `/alunos?salaId=${auth?.salaId}`),
    enabled: !!auth?.salaId,
  });

  const ticketsPorNumero = tickets.reduce((acc: Record<number, Ticket>, t: Ticket) => {
    if (t.numero) acc[t.numero] = t;
    return acc;
  }, {});

  const resetCriarForm = () => {
    setFormData({ nome: "", premio: "", preco: "", totalNumeros: "200", dataSorteio: "" });
    setError("");
  };

  const resetVendaForm = () => {
    setVendaData({ compradorNome: "", compradorContato: "", vendedorId: null, valor: "" });
    setVendaError("");
  };

  const resetEditVendaForm = () => {
    setEditVendaData({ compradorNome: "", compradorContato: "", vendedorId: null, valor: "", status: "pendente" });
  };

  const getEstatisticas = (s: Sorteio) => {
    const ts = tickets.filter((t: Ticket) => t.rifaId === s.id);
    const pagos = ts.filter((t: Ticket) => t.status === "pago");
    const pendentes = ts.filter((t: Ticket) => t.status === "pendente");
    const totalNum = s.totalNumeros || 200;
    return {
      totalNumeros: totalNum,
      numerosVendidos: pagos.length,
      numerosReservados: pendentes.length,
      percentual: (pagos.length / totalNum) * 100,
      receitaTotal: pagos.reduce((a: number, t: Ticket) => a + t.valor, 0),
    };
  };

  // Mutations
  const criar = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/rifas", data),
    onSuccess: () => {
      refetchSorteios();
      criarSheet.close();
      resetCriarForm();
    },
    onError: (e: any) => setError(e.message),
  });

  const editar = useMutation({
    mutationFn: ({ id, ...data }: any) => apiRequest("PUT", `/rifas/${id}`, data),
    onSuccess: () => {
      refetchSorteios();
      editSheet.close();
      setSorteioEditando(null);
    },
    onError: (e: any) => setError(e.message),
  });

  const deletar = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/rifas/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sorteios"] });
      qc.invalidateQueries({ queryKey: ["tickets"] });
      if (sorteioExpandido) setSorteioExpandido(null);
    },
    onError: (e: any) => alert(e.message),
  });

  const criarVenda = useMutation({
    mutationFn: (data: any) => apiRequest("POST", `/rifas/${sorteioExpandido}/tickets`, data),
    onSuccess: () => {
      refetchTickets();
      vendaSheet.close();
      resetVendaForm();
    },
    onError: (e: any) => setVendaError(e.message),
  });

  const editarVenda = useMutation({
    mutationFn: ({ id, ...data }: any) => apiRequest("PUT", `/rifas/tickets/${id}`, data),
    onSuccess: () => {
      refetchTickets();
      qc.invalidateQueries({ queryKey: ["tickets"] });
      editVendaSheet.close();
      setTicketSelecionado(null);
      resetEditVendaForm();
    },
    onError: (e: any) => alert(e.message),
  });

  const deletarVenda = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/rifas/tickets/${id}`),
    onSuccess: () => {
      refetchTickets();
      qc.invalidateQueries({ queryKey: ["tickets"] });
      editVendaSheet.close();
      setTicketSelecionado(null);
    },
    onError: (e: any) => alert(e.message),
  });

  const sortear = useMutation({
    mutationFn: (id: number) => apiRequest("POST", `/rifas/${id}/sortear`, {}),
    onSuccess: (data) => {
      refetchSorteios();
      setSorteando(null);
      setNumeroSorteado(data.numeroSorteado);
      setVencedorInfo(data.vencedor);
      sorteioSheet.close();
      resultSheet.open();
    },
    onError: (e: any) => {
      setSorteando(null);
      alert(e.message);
    },
  });

  const handleNumeroClick = (numero: number) => {
    const t = ticketsPorNumero[numero];
    if (t) {
      setTicketSelecionado(t);
      setEditVendaData({
        compradorNome: t.compradorNome,
        compradorContato: t.compradorContato || "",
        vendedorId: t.vendedorId,
        valor: t.valor.toString(),
        status: t.status,
      });
      editVendaSheet.open();
    } else {
      const s = sorteios.find((s: Sorteio) => s.id === sorteioExpandido);
      setVendaNumero(numero);
      setVendaData((prev) => ({ ...prev, valor: s?.preco?.toString() || "" }));
      vendaSheet.open();
    }
  };

  const handleCreateSorteio = () => {
    if (!formData.nome || !formData.premio || !formData.preco) {
      setError("Nome, prêmio e preço são obrigatórios");
      return;
    }
    criar.mutate({
      nome: formData.nome,
      premio: formData.premio,
      preco: parseFloat(formData.preco),
      totalNumeros: parseInt(formData.totalNumeros),
      dataSorteio: formData.dataSorteio || null,
      salaId: auth?.salaId,
      status: "ativa",
    });
  };

  const handleCreateVenda = () => {
    if (!vendaData.compradorNome || !vendaData.vendedorId || !vendaData.valor) {
      setVendaError("Preencha todos os campos");
      return;
    }
    criarVenda.mutate({
      numero: vendaNumero,
      compradorNome: vendaData.compradorNome,
      compradorContato: vendaData.compradorContato,
      vendedorId: vendaData.vendedorId,
      valor: parseFloat(vendaData.valor),
      status: "pendente",
    });
  };

  const handleUpdateVenda = () => {
    if (!editVendaData.compradorNome || !editVendaData.vendedorId || !editVendaData.valor) {
      alert("Preencha todos os campos");
      return;
    }
    editarVenda.mutate({
      id: ticketSelecionado?.id,
      compradorNome: editVendaData.compradorNome,
      compradorContato: editVendaData.compradorContato,
      vendedorId: editVendaData.vendedorId,
      valor: parseFloat(editVendaData.valor),
      status: editVendaData.status,
    });
  };

  const handleDownloadResultado = async () => {
    if (!resultadoRef.current) return;
    try {
      const canvas = await html2canvas(resultadoRef.current, { scale: 2, backgroundColor: "#fff" });
      const link = document.createElement("a");
      link.download = `sorteio-${numeroSorteado}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch {
      alert("Erro ao gerar imagem.");
    }
  };

  const handleCompartilhar = async () => {
    if (!vencedorInfo || !numeroSorteado) return;
    const texto = `🎉 Resultado do Sorteio!\n\nNúmero: ${String(numeroSorteado).padStart(3, "0")}\nGanhador: ${vencedorInfo.compradorNome}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Resultado do Sorteio", text: texto });
      } catch {
        navigator.clipboard.writeText(texto);
      }
    } else {
      navigator.clipboard.writeText(texto);
      alert("Texto copiado!");
    }
  };

  return (
    <MobileLayout role="admin">
      <MobileHeader
        title="Rifas"
        subtitle={`${sorteios.length} sorteios`}
        gradient
        actions={[{ icon: "add_circle", onClick: criarSheet.open, label: "Nova rifa" }]}
      />

      <div className="px-4 py-4 space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <Skeleton key={i} variant="card" />
            ))}
          </div>
        ) : sorteios.length > 0 ? (
          sorteios.map((s: Sorteio) => {
            const stats = getEstatisticas(s);
            const isExpanded = sorteioExpandido === s.id;
            return (
              <div key={s.id} className="mobile-card overflow-hidden">
                {/* Header */}
                <div
                  className="p-4 flex items-center gap-3 cursor-pointer"
                  onClick={() => setSorteioExpandido(isExpanded ? null : s.id)}
                >
                  <div className="size-11 rounded-2xl bg-indigo-100 dark:bg-indigo-950/40 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-indigo-600 dark:text-indigo-400 text-xl">
                      confirmation_number
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">{s.nome}</h4>
                      <MobileBadge
                        variant={s.status === "ativa" ? "success" : s.status === "encerrada" ? "warning" : "danger"}
                      >
                        {s.status === "ativa" ? "Ativa" : s.status === "encerrada" ? "Encerrada" : "Sorteada"}
                      </MobileBadge>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      🎁 {s.premio} • {formatCurrency(s.preco)}/número
                    </p>
                  </div>
                  <span className="material-symbols-outlined text-slate-400 flex-shrink-0">
                    {isExpanded ? "expand_less" : "expand_more"}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="px-4 pb-3">
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>{stats.numerosVendidos} pagos</span>
                    <span>{stats.percentual.toFixed(0)}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full gradient-primary rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(stats.percentual, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Expanded area */}
                {isExpanded && (
                  <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 p-4 space-y-4">
                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-2">
                      <MobileMetricCard title="Vendidos" value={String(stats.numerosVendidos)} icon="check_circle" color="green" />
                      <MobileMetricCard title="Reservados" value={String(stats.numerosReservados)} icon="pending" color="amber" />
                      <MobileMetricCard title="Total" value={String(stats.totalNumeros)} icon="numbers" color="primary" />
                      <MobileMetricCard title="Receita" value={formatCurrency(stats.receitaTotal)} icon="payments" color="purple" />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <MobileButton
                        variant="secondary"
                        size="sm"
                        icon="edit"
                        onClick={() => {
                          setSorteioEditando(s);
                          setEditFormData({
                            nome: s.nome,
                            premio: s.premio,
                            preco: s.preco?.toString() || "",
                            totalNumeros: s.totalNumeros?.toString() || "200",
                            dataSorteio: s.dataSorteio || "",
                          });
                          editSheet.open();
                        }}
                      >
                        Editar
                      </MobileButton>
                      {s.status === "ativa" && (
                        <MobileButton
                          variant="primary"
                          size="sm"
                          icon="celebration"
                          loading={sorteando === s.id}
                          onClick={() => {
                            setSorteioSelecionado(s);
                            sorteioSheet.open();
                          }}
                        >
                          Sortear
                        </MobileButton>
                      )}
                      <MobileButton
                        variant="danger"
                        size="sm"
                        icon="delete"
                        onClick={() => {
                          if (confirm("Excluir sorteio?")) deletar.mutate(s.id);
                        }}
                      >
                        Excluir
                      </MobileButton>
                    </div>

                    {/* Mapa de Números */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Mapa de Números</p>
                        <div className="flex gap-2 text-[10px] text-slate-400">
                          <span className="flex items-center gap-1">
                            <span className="size-2 rounded-full bg-emerald-500 inline-block" />
                            Pago
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="size-2 rounded-full bg-amber-400 inline-block" />
                            Pendente
                          </span>
                        </div>
                      </div>
                      <div
                        className="grid gap-1.5"
                        style={{ gridTemplateColumns: `repeat(${Math.min(10, s.totalNumeros)}, 1fr)` }}
                      >
                        {Array.from({ length: s.totalNumeros }, (_, i) => {
                          const n = i + 1;
                          const t = ticketsPorNumero[n];
                          const bg = t?.status === "pago"
                            ? "bg-emerald-500 text-white"
                            : t?.status === "pendente"
                            ? "bg-amber-400 text-amber-900"
                            : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400";
                          return (
                            <button
                              key={i}
                              onClick={() => handleNumeroClick(n)}
                              className={`aspect-square flex items-center justify-center rounded text-[9px] font-semibold transition-all active:scale-95 ${bg}`}
                            >
                              {n}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <MobileCard className="text-center py-12">
            <span className="material-symbols-outlined text-slate-300 dark:text-slate-600 text-5xl">
              confirmation_number
            </span>
            <p className="text-slate-500 mt-3 text-sm">Nenhum sorteio criado</p>
            <MobileButton variant="ghost" size="sm" icon="add_circle" className="mt-3" onClick={criarSheet.open}>
              Criar sorteio
            </MobileButton>
          </MobileCard>
        )}
      </div>

      {/* Bottom Sheet: Criar Sorteio */}
      <BottomSheet isOpen={criarSheet.isOpen} onClose={criarSheet.close} title="Novo Sorteio">
        <div className="space-y-4">
          <MobileInput
            label="Nome do Sorteio"
            icon="confirmation_number"
            placeholder="ex: Rifa de Natal"
            value={formData.nome}
            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
          />
          <MobileInput
            label="Prêmio"
            icon="emoji_events"
            placeholder="ex: Smart TV 55&quot;"
            value={formData.premio}
            onChange={(e) => setFormData({ ...formData, premio: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-3">
            <MobileInput
              label="Preço/número (R$)"
              icon="attach_money"
              type="number"
              placeholder="0.00"
              value={formData.preco}
              onChange={(e) => setFormData({ ...formData, preco: e.target.value })}
            />
            <MobileInput
              label="Total de números"
              icon="numbers"
              type="number"
              placeholder="200"
              value={formData.totalNumeros}
              onChange={(e) => setFormData({ ...formData, totalNumeros: e.target.value })}
            />
          </div>
          <MobileInput
            label="Data do Sorteio"
            icon="event"
            type="date"
            value={formData.dataSorteio}
            onChange={(e) => setFormData({ ...formData, dataSorteio: e.target.value })}
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <MobileButton variant="secondary" fullWidth onClick={criarSheet.close}>
              Cancelar
            </MobileButton>
            <MobileButton variant="primary" fullWidth loading={criar.isPending} onClick={handleCreateSorteio}>
              Criar
            </MobileButton>
          </div>
        </div>
      </BottomSheet>

      {/* Bottom Sheet: Editar Sorteio */}
      <BottomSheet isOpen={editSheet.isOpen} onClose={editSheet.close} title="Editar Sorteio">
        <div className="space-y-4">
          <MobileInput
            label="Nome"
            icon="confirmation_number"
            value={editFormData.nome}
            onChange={(e) => setEditFormData({ ...editFormData, nome: e.target.value })}
          />
          <MobileInput
            label="Prêmio"
            icon="emoji_events"
            value={editFormData.premio}
            onChange={(e) => setEditFormData({ ...editFormData, premio: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-3">
            <MobileInput
              label="Preço (R$)"
              icon="attach_money"
              type="number"
              value={editFormData.preco}
              onChange={(e) => setEditFormData({ ...editFormData, preco: e.target.value })}
            />
            <MobileInput
              label="Números"
              icon="numbers"
              type="number"
              value={editFormData.totalNumeros}
              onChange={(e) => setEditFormData({ ...editFormData, totalNumeros: e.target.value })}
            />
          </div>
          <MobileInput
            label="Data"
            icon="event"
            type="date"
            value={editFormData.dataSorteio}
            onChange={(e) => setEditFormData({ ...editFormData, dataSorteio: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-3 pt-2">
            <MobileButton variant="secondary" fullWidth onClick={editSheet.close}>
              Cancelar
            </MobileButton>
            <MobileButton
              variant="primary"
              fullWidth
              loading={editar.isPending}
              onClick={() =>
                editar.mutate({
                  id: sorteioEditando?.id,
                  nome: editFormData.nome,
                  premio: editFormData.premio,
                  preco: parseFloat(editFormData.preco),
                  totalNumeros: parseInt(editFormData.totalNumeros),
                  dataSorteio: editFormData.dataSorteio || null,
                })
              }
            >
              Salvar
            </MobileButton>
          </div>
        </div>
      </BottomSheet>

      {/* Bottom Sheet: Nova Venda */}
      <BottomSheet
        isOpen={vendaSheet.isOpen}
        onClose={() => {
          vendaSheet.close();
          resetVendaForm();
        }}
        title={`Nº ${String(vendaNumero).padStart(3, "0")}`}
      >
        <div className="space-y-4">
          <MobileInput
            label="Nome do Comprador"
            icon="person"
            value={vendaData.compradorNome}
            onChange={(e) => setVendaData({ ...vendaData, compradorNome: e.target.value })}
            required
          />
          <MobileInput
            label="Contato"
            icon="phone"
            type="tel"
            value={vendaData.compradorContato}
            onChange={(e) => setVendaData({ ...vendaData, compradorContato: e.target.value })}
          />
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Vendedor (Aluno)</label>
            <select
              value={vendaData.vendedorId ?? ""}
              onChange={(e) => setVendaData({ ...vendaData, vendedorId: parseInt(e.target.value) })}
              className="mobile-input appearance-none"
            >
              <option value="">Selecionar vendedor...</option>
              {alunos.map((a: Aluno) => (
                <option key={a.id} value={a.id}>
                  {a.nome}
                </option>
              ))}
            </select>
          </div>
          <MobileInput
            label="Valor (R$)"
            icon="attach_money"
            type="number"
            value={vendaData.valor}
            onChange={(e) => setVendaData({ ...vendaData, valor: e.target.value })}
          />
          {vendaError && <p className="text-sm text-red-500">{vendaError}</p>}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <MobileButton variant="secondary" fullWidth onClick={vendaSheet.close}>
              Cancelar
            </MobileButton>
            <MobileButton variant="primary" fullWidth loading={criarVenda.isPending} onClick={handleCreateVenda}>
              Registrar
            </MobileButton>
          </div>
        </div>
      </BottomSheet>

      {/* Bottom Sheet: Editar Venda */}
      {ticketSelecionado && (
        <BottomSheet
          isOpen={editVendaSheet.isOpen}
          onClose={() => {
            editVendaSheet.close();
            setTicketSelecionado(null);
          }}
          title={`Venda Nº ${String(ticketSelecionado.numero).padStart(3, "0")}`}
        >
          <div className="space-y-4">
            <MobileInput
              label="Comprador"
              icon="person"
              value={editVendaData.compradorNome}
              onChange={(e) => setEditVendaData({ ...editVendaData, compradorNome: e.target.value })}
            />
            <MobileInput
              label="Contato"
              icon="phone"
              value={editVendaData.compradorContato}
              onChange={(e) => setEditVendaData({ ...editVendaData, compradorContato: e.target.value })}
            />
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Vendedor</label>
              <select
                value={editVendaData.vendedorId ?? ""}
                onChange={(e) => setEditVendaData({ ...editVendaData, vendedorId: parseInt(e.target.value) })}
                className="mobile-input appearance-none"
              >
                {alunos.map((a: Aluno) => (
                  <option key={a.id} value={a.id}>
                    {a.nome}
                  </option>
                ))}
              </select>
            </div>
            <MobileInput
              label="Valor (R$)"
              icon="attach_money"
              type="number"
              value={editVendaData.valor}
              onChange={(e) => setEditVendaData({ ...editVendaData, valor: e.target.value })}
            />
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Status</label>
              <select
                value={editVendaData.status}
                onChange={(e) => setEditVendaData({ ...editVendaData, status: e.target.value as any })}
                className="mobile-input appearance-none"
              >
                <option value="pendente">Pendente</option>
                <option value="pago">Pago</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <MobileButton
                variant="secondary"
                fullWidth
                onClick={() => {
                  editVendaSheet.close();
                  setTicketSelecionado(null);
                }}
              >
                Cancelar
              </MobileButton>
              <MobileButton variant="primary" fullWidth loading={editarVenda.isPending} onClick={handleUpdateVenda}>
                Salvar
              </MobileButton>
            </div>
            <MobileButton
              variant="danger"
              fullWidth
              icon="delete"
              loading={deletarVenda.isPending}
              onClick={() => {
                if (confirm("Excluir venda?")) deletarVenda.mutate(ticketSelecionado.id);
              }}
            >
              Excluir Venda
            </MobileButton>
          </div>
        </BottomSheet>
      )}

      {/* Bottom Sheet: Confirmação de Sorteio */}
      {sorteioSelecionado && (
        <BottomSheet isOpen={sorteioSheet.isOpen} onClose={sorteioSheet.close} title="Realizar Sorteio">
          <div className="text-center space-y-4 py-2">
            <div className="size-20 rounded-full gradient-primary mx-auto flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-4xl">celebration</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{sorteioSelecionado.nome}</h3>
              <p className="text-sm text-slate-500 mt-1">Prêmio: {sorteioSelecionado.premio}</p>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Ao confirmar, um número será sorteado aleatoriamente entre os <strong>números vendidos</strong>.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <MobileButton variant="secondary" fullWidth onClick={sorteioSheet.close}>
                Cancelar
              </MobileButton>
              <MobileButton
                variant="primary"
                fullWidth
                icon="celebration"
                loading={sorteando === sorteioSelecionado.id}
                onClick={() => {
                  setSorteando(sorteioSelecionado.id);
                  sortear.mutate(sorteioSelecionado.id);
                }}
              >
                Sortear!
              </MobileButton>
            </div>
          </div>
        </BottomSheet>
      )}

      {/* Bottom Sheet: Resultado */}
      {numeroSorteado !== null && (
        <BottomSheet isOpen={resultSheet.isOpen} onClose={resultSheet.close} title="🎉 Resultado do Sorteio">
          <div ref={resultadoRef} className="text-center space-y-4 py-2">
            <div className="text-6xl font-black text-indigo-600 dark:text-indigo-400">
              {String(numeroSorteado).padStart(3, "0")}
            </div>
            <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">Número Sorteado</p>
            {vencedorInfo ? (
              <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-xl p-4">
                <p className="text-lg font-black text-emerald-800 dark:text-emerald-300">🏆 {vencedorInfo.compradorNome}</p>
                {vencedorInfo.compradorContato && (
                  <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">{vencedorInfo.compradorContato}</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-500">Número não vendido. Realize o resorteio.</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            <MobileButton variant="secondary" icon="download" fullWidth onClick={handleDownloadResultado}>
              Baixar
            </MobileButton>
            <MobileButton variant="primary" icon="share" fullWidth onClick={handleCompartilhar}>
              Compartilhar
            </MobileButton>
          </div>
        </BottomSheet>
      )}
    </MobileLayout>
  );
}
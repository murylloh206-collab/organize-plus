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

  const criarSheet    = useBottomSheet();
  const editSheet     = useBottomSheet();
  const vendaSheet    = useBottomSheet();
  const editVendaSheet = useBottomSheet();
  const sorteioSheet  = useBottomSheet();
  const resultSheet   = useBottomSheet();

  const [sorteioExpandido, setSorteioExpandido] = useState<number | null>(null);
  const [sorteioSelecionado, setSorteioSelecionado] = useState<Sorteio | null>(null);
  const [sorteioEditando, setSorteioEditando] = useState<Sorteio | null>(null);
  const [ticketSelecionado, setTicketSelecionado] = useState<Ticket | null>(null);
  const [vendaNumero, setVendaNumero] = useState<number | null>(null);
  const [numeroSorteado, setNumeroSorteado] = useState<number | null>(null);
  const [vencedorInfo, setVencedorInfo] = useState<Ticket | null>(null);
  const [sorteando, setSorteando] = useState<number | null>(null);
  const [error, setError] = useState("");

  // Criar sorteio
  const [nome, setNome] = useState("");
  const [premio, setPremio] = useState("");
  const [preco, setPreco] = useState("");
  const [totalNumeros, setTotalNumeros] = useState("200");
  const [dataSorteio, setDataSorteio] = useState("");

  // Editar sorteio
  const [editNome, setEditNome] = useState("");
  const [editPremio, setEditPremio] = useState("");
  const [editPreco, setEditPreco] = useState("");
  const [editTotalNumeros, setEditTotalNumeros] = useState("");
  const [editDataSorteio, setEditDataSorteio] = useState("");

  // Venda
  const [vendaCompradorNome, setVendaCompradorNome] = useState("");
  const [vendaCompradorContato, setVendaCompradorContato] = useState("");
  const [vendaVendedorId, setVendaVendedorId] = useState<number | null>(null);
  const [vendaValor, setVendaValor] = useState("");
  const [vendaError, setVendaError] = useState("");

  // Editar venda
  const [editVendaCompradorNome, setEditVendaCompradorNome] = useState("");
  const [editVendaCompradorContato, setEditVendaCompradorContato] = useState("");
  const [editVendaVendedorId, setEditVendaVendedorId] = useState<number | null>(null);
  const [editVendaValor, setEditVendaValor] = useState("");
  const [editVendaStatus, setEditVendaStatus] = useState<"pago" | "pendente" | "cancelado">("pendente");

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

  const criar = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/rifas", data),
    onSuccess: () => { refetchSorteios(); criarSheet.close(); resetCriarForm(); },
    onError: (e: any) => setError(e.message),
  });

  const editar = useMutation({
    mutationFn: ({ id, ...data }: any) => apiRequest("PUT", `/rifas/${id}`, data),
    onSuccess: () => { refetchSorteios(); editSheet.close(); setSorteioEditando(null); },
    onError: (e: any) => setError(e.message),
  });

  const deletar = useMutation({
    mutationFn: async (id: number) => {
      const r = await fetch(`/api/rifas/${id}`, { method: "DELETE", credentials: "include" });
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).message || "Erro ao deletar");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sorteios"] });
      if (sorteioExpandido) setSorteioExpandido(null);
    },
  });

  const criarVenda = useMutation({
    mutationFn: (data: any) => apiRequest("POST", `/rifas/${sorteioExpandido}/tickets`, data),
    onSuccess: () => { refetchTickets(); vendaSheet.close(); resetVendaForm(); },
    onError: (e: any) => setVendaError(e.message),
  });

  const editarVenda = useMutation({
    mutationFn: ({ id, ...data }: any) => apiRequest("PUT", `/rifas/tickets/${id}`, data),
    onSuccess: () => { refetchTickets(); editVendaSheet.close(); setTicketSelecionado(null); },
  });

  const deletarVenda = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/rifas/tickets/${id}`),
    onSuccess: () => { refetchTickets(); editVendaSheet.close(); setTicketSelecionado(null); },
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
    onError: (e: any) => { setSorteando(null); alert(e.message); },
  });

  const resetCriarForm = () => { setNome(""); setPremio(""); setPreco(""); setTotalNumeros("200"); setDataSorteio(""); setError(""); };
  const resetVendaForm = () => { setVendaCompradorNome(""); setVendaCompradorContato(""); setVendaVendedorId(null); setVendaValor(""); setVendaError(""); };

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

  const handleNumeroClick = (numero: number) => {
    const t = ticketsPorNumero[numero];
    if (t) {
      setTicketSelecionado(t);
      setEditVendaCompradorNome(t.compradorNome);
      setEditVendaCompradorContato(t.compradorContato || "");
      setEditVendaVendedorId(t.vendedorId);
      setEditVendaValor(t.valor.toString());
      setEditVendaStatus(t.status);
      editVendaSheet.open();
    } else {
      const s = sorteios.find((s: Sorteio) => s.id === sorteioExpandido);
      setVendaNumero(numero);
      setVendaValor(s?.preco?.toString() || "");
      vendaSheet.open();
    }
  };

  const handleDownloadResultado = async () => {
    if (!resultadoRef.current) return;
    try {
      const canvas = await html2canvas(resultadoRef.current, { scale: 2, backgroundColor: "#fff" });
      const link = document.createElement("a");
      link.download = `sorteio-${numeroSorteado}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch { alert("Erro ao gerar imagem."); }
  };

  const handleCompartilhar = async () => {
    if (!vencedorInfo || !numeroSorteado) return;
    const texto = `🎉 Resultado do Sorteio!\n\nNúmero: ${String(numeroSorteado).padStart(3, "0")}\nGanhador: ${vencedorInfo.compradorNome}`;
    if (navigator.share) {
      try { await navigator.share({ title: "Resultado do Sorteio", text: texto }); }
      catch { navigator.clipboard.writeText(texto); }
    } else {
      navigator.clipboard.writeText(texto);
      alert("Texto copiado!");
    }
  };

  const statusRifaColor: Record<string, string> = {
    ativa: "emerald", encerrada: "amber", sorteada: "purple",
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
          <div className="space-y-3">{[1, 2].map((i) => <Skeleton key={i} variant="card" />)}</div>
        ) : sorteios.length > 0 ? (
          sorteios.map((s: Sorteio) => {
            const stats = getEstatisticas(s);
            const isExpanded = sorteioExpandido === s.id;
            return (
              <div key={s.id} className="mobile-card overflow-hidden">
                {/* Header */}
                <div
                  className="p-4 flex items-center gap-3 cursor-pointer"
                  onClick={() => { setSorteioExpandido(isExpanded ? null : s.id); }}
                >
                  <div className="size-11 rounded-2xl bg-indigo-100 dark:bg-indigo-950/40 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-indigo-600 dark:text-indigo-400 text-xl">confirmation_number</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">{s.nome}</h4>
                      <MobileBadge variant={s.status === "ativa" ? "success" : s.status === "encerrada" ? "warning" : "danger"}>
  {s.status === "ativa" ? "Ativa" : s.status === "encerrada" ? "Encerrada" : "Sorteada"}
</MobileBadge>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">🎁 {s.premio} • {formatCurrency(s.preco)}/número</p>
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
                    <div className="h-full gradient-primary rounded-full transition-all duration-500" style={{ width: `${Math.min(stats.percentual, 100)}%` }} />
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
                      <MobileButton variant="secondary" size="sm" icon="edit" onClick={() => {
                        setSorteioEditando(s); setEditNome(s.nome); setEditPremio(s.premio);
                        setEditPreco(s.preco?.toString() || ""); setEditTotalNumeros(s.totalNumeros?.toString() || "200");
                        setEditDataSorteio(s.dataSorteio || ""); editSheet.open();
                      }}>Editar</MobileButton>
                      {s.status === "ativa" && (
                        <MobileButton variant="primary" size="sm" icon="celebration" loading={sorteando === s.id}
                          onClick={() => { setSorteioSelecionado(s); sorteioSheet.open(); }}>
                          Sortear
                        </MobileButton>
                      )}
                      <MobileButton variant="danger" size="sm" icon="delete"
                        onClick={() => { if (confirm("Excluir sorteio?")) deletar.mutate(s.id); }}>
                        Excluir
                      </MobileButton>
                    </div>

                    {/* Mapa de Números */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Mapa de Números</p>
                        <div className="flex gap-2 text-[10px] text-slate-400">
                          <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-emerald-500 inline-block" />Pago</span>
                          <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-amber-400 inline-block" />Pendente</span>
                        </div>
                      </div>
                      <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${Math.min(10, s.totalNumeros)}, 1fr)` }}>
                        {Array.from({ length: s.totalNumeros }, (_, i) => {
                          const n = i + 1;
                          const t = ticketsPorNumero[n];
                          const bg = t?.status === "pago" ? "bg-emerald-500 text-white" : t?.status === "pendente" ? "bg-amber-400 text-amber-900" : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400";
                          return (
                            <button key={i} onClick={() => handleNumeroClick(n)}
                              className={`aspect-square flex items-center justify-center rounded text-[9px] font-semibold transition-all active:scale-95 ${bg}`}>
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
            <span className="material-symbols-outlined text-slate-300 dark:text-slate-600 text-5xl">confirmation_number</span>
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
          <MobileInput label="Nome do Sorteio" icon="confirmation_number" placeholder="ex: Rifa de Natal" value={nome} onChange={(e) => setNome(e.target.value)} />
          <MobileInput label="Prêmio" icon="emoji_events" placeholder="ex: Smart TV 55&quot;" value={premio} onChange={(e) => setPremio(e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <MobileInput label="Preço/número (R$)" icon="attach_money" type="number" placeholder="0.00" value={preco} onChange={(e) => setPreco(e.target.value)} />
            <MobileInput label="Total de números" icon="numbers" type="number" placeholder="200" value={totalNumeros} onChange={(e) => setTotalNumeros(e.target.value)} />
          </div>
          <MobileInput label="Data do Sorteio" icon="event" type="date" value={dataSorteio} onChange={(e) => setDataSorteio(e.target.value)} />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <MobileButton variant="secondary" fullWidth onClick={criarSheet.close}>Cancelar</MobileButton>
            <MobileButton variant="primary" fullWidth loading={criar.isPending}
              onClick={() => criar.mutate({ nome, premio, preco: parseFloat(preco), totalNumeros: parseInt(totalNumeros), dataSorteio: dataSorteio || null, salaId: auth?.salaId, status: "ativa" })}>
              Criar
            </MobileButton>
          </div>
        </div>
      </BottomSheet>

      {/* Bottom Sheet: Editar Sorteio */}
      <BottomSheet isOpen={editSheet.isOpen} onClose={editSheet.close} title="Editar Sorteio">
        <div className="space-y-4">
          <MobileInput label="Nome" icon="confirmation_number" value={editNome} onChange={(e) => setEditNome(e.target.value)} />
          <MobileInput label="Prêmio" icon="emoji_events" value={editPremio} onChange={(e) => setEditPremio(e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <MobileInput label="Preço (R$)" icon="attach_money" type="number" value={editPreco} onChange={(e) => setEditPreco(e.target.value)} />
            <MobileInput label="Números" icon="numbers" type="number" value={editTotalNumeros} onChange={(e) => setEditTotalNumeros(e.target.value)} />
          </div>
          <MobileInput label="Data" icon="event" type="date" value={editDataSorteio} onChange={(e) => setEditDataSorteio(e.target.value)} />
          <div className="grid grid-cols-2 gap-3 pt-2">
            <MobileButton variant="secondary" fullWidth onClick={editSheet.close}>Cancelar</MobileButton>
            <MobileButton variant="primary" fullWidth loading={editar.isPending}
              onClick={() => editar.mutate({ id: sorteioEditando?.id, nome: editNome, premio: editPremio, preco: parseFloat(editPreco), totalNumeros: parseInt(editTotalNumeros), dataSorteio: editDataSorteio || null })}>
              Salvar
            </MobileButton>
          </div>
        </div>
      </BottomSheet>

      {/* Bottom Sheet: Nova Venda */}
      <BottomSheet isOpen={vendaSheet.isOpen} onClose={() => { vendaSheet.close(); resetVendaForm(); }} title={`Nº ${String(vendaNumero).padStart(3, "0")}`}>
        <div className="space-y-4">
          <MobileInput label="Nome do Comprador" icon="person" value={vendaCompradorNome} onChange={(e) => setVendaCompradorNome(e.target.value)} required />
          <MobileInput label="Contato" icon="phone" type="tel" value={vendaCompradorContato} onChange={(e) => setVendaCompradorContato(e.target.value)} />
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Vendedor (Aluno)</label>
            <select value={vendaVendedorId ?? ""} onChange={(e) => setVendaVendedorId(parseInt(e.target.value))} className="mobile-input appearance-none">
              <option value="">Selecionar vendedor...</option>
              {alunos.map((a: Aluno) => <option key={a.id} value={a.id}>{a.nome}</option>)}
            </select>
          </div>
          <MobileInput label="Valor (R$)" icon="attach_money" type="number" value={vendaValor} onChange={(e) => setVendaValor(e.target.value)} />
          {vendaError && <p className="text-sm text-red-500">{vendaError}</p>}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <MobileButton variant="secondary" fullWidth onClick={vendaSheet.close}>Cancelar</MobileButton>
            <MobileButton variant="primary" fullWidth loading={criarVenda.isPending}
              onClick={() => { if (!vendaCompradorNome || !vendaVendedorId || !vendaValor) { setVendaError("Preencha todos os campos"); return; } criarVenda.mutate({ numero: vendaNumero, compradorNome: vendaCompradorNome, compradorContato: vendaCompradorContato, vendedorId: vendaVendedorId, valor: parseFloat(vendaValor), status: "pendente" }); }}>
              Registrar
            </MobileButton>
          </div>
        </div>
      </BottomSheet>

      {/* Bottom Sheet: Editar Venda */}
      {ticketSelecionado && (
        <BottomSheet isOpen={editVendaSheet.isOpen} onClose={() => { editVendaSheet.close(); setTicketSelecionado(null); }} title={`Venda Nº ${String(ticketSelecionado.numero).padStart(3, "0")}`}>
          <div className="space-y-4">
            <MobileInput label="Comprador" icon="person" value={editVendaCompradorNome} onChange={(e) => setEditVendaCompradorNome(e.target.value)} />
            <MobileInput label="Contato" icon="phone" value={editVendaCompradorContato} onChange={(e) => setEditVendaCompradorContato(e.target.value)} />
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Vendedor</label>
              <select value={editVendaVendedorId ?? ""} onChange={(e) => setEditVendaVendedorId(parseInt(e.target.value))} className="mobile-input appearance-none">
                {alunos.map((a: Aluno) => <option key={a.id} value={a.id}>{a.nome}</option>)}
              </select>
            </div>
            <MobileInput label="Valor (R$)" icon="attach_money" type="number" value={editVendaValor} onChange={(e) => setEditVendaValor(e.target.value)} />
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Status</label>
              <select value={editVendaStatus} onChange={(e) => setEditVendaStatus(e.target.value as any)} className="mobile-input appearance-none">
                <option value="pendente">Pendente</option>
                <option value="pago">Pago</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <MobileButton variant="secondary" fullWidth onClick={() => { editVendaSheet.close(); setTicketSelecionado(null); }}>Cancelar</MobileButton>
              <MobileButton variant="primary" fullWidth loading={editarVenda.isPending}
                onClick={() => editarVenda.mutate({ id: ticketSelecionado.id, compradorNome: editVendaCompradorNome, compradorContato: editVendaCompradorContato, vendedorId: editVendaVendedorId, valor: parseFloat(editVendaValor), status: editVendaStatus })}>
                Salvar
              </MobileButton>
            </div>
            <MobileButton variant="danger" fullWidth icon="delete" loading={deletarVenda.isPending}
              onClick={() => { if (confirm("Excluir venda?")) deletarVenda.mutate(ticketSelecionado.id); }}>
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
              <MobileButton variant="secondary" fullWidth onClick={sorteioSheet.close}>Cancelar</MobileButton>
              <MobileButton variant="primary" fullWidth icon="celebration" loading={sorteando === sorteioSelecionado.id}
                onClick={() => { setSorteando(sorteioSelecionado.id); sortear.mutate(sorteioSelecionado.id); }}>
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
            <MobileButton variant="secondary" icon="download" fullWidth onClick={handleDownloadResultado}>Baixar</MobileButton>
            <MobileButton variant="primary" icon="share" fullWidth onClick={handleCompartilhar}>Compartilhar</MobileButton>
          </div>
        </BottomSheet>
      )}
    </MobileLayout>
  );
}
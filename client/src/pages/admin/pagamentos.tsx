import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import MobileLayout from "../../components/layout/MobileLayout";
import MobileHeader from "../../components/layout/MobileHeader";
import MobileAvatar from "../../components/ui/MobileAvatar";
import MobileBadge from "../../components/ui/MobileBadge";
import MobileButton from "../../components/ui/MobileButton";
import MobileInput from "../../components/ui/MobileInput";
import MobileCard from "../../components/ui/MobileCard";
import MobileMetricCard from "../../components/ui/MobileMetricCard";
import BottomSheet from "../../components/ui/BottomSheet";
import Skeleton from "../../components/ui/Skeleton";
import { useBottomSheet } from "../../hooks/useBottomSheet";
import { apiRequest } from "../../lib/queryClient";
import { formatCurrency } from "../../components/shared/CurrencyFormat";
import { formatDate } from "../../components/shared/DateFormat";

interface Pagamento {
  id: number;
  usuarioId: number;
  descricao: string;
  valor: number;
  status: "pago" | "pendente" | "atrasado";
  dataVencimento: string;
  dataPagamento?: string;
  formaPagamento?: string;
  comprovanteUrl?: string;
  statusComprovante?: string;
  motivoRejeicao?: string;
}

interface Aluno { id: number; nome: string; email: string; avatarUrl?: string; }

type FiltroStatus = "todos" | "pago" | "pendente" | "atrasado";
type TabPrincipal = "pagamentos" | "comprovantes";

export default function AdminPagamentos() {
  const qc = useQueryClient();
  const formSheet = useBottomSheet();
  const reciboSheet = useBottomSheet();
  const analiseSheet = useBottomSheet();

  const [tabPrincipal, setTabPrincipal] = useState<TabPrincipal>("pagamentos");
  const [pagSelecionado, setPagSelecionado] = useState<any>(null);
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>("todos");
  const [filtroNome, setFiltroNome] = useState("");
  const [error, setError] = useState("");
  const [motivoRejeicao, setMotivoRejeicao] = useState("");

  // Form state
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [usuarioId, setUsuarioId] = useState("");
  const [vencimento, setVencimento] = useState("");
  const [formaPagamento, setFormaPagamento] = useState("pix");

  const { data: pagamentosRaw = [], isLoading, refetch } = useQuery({
    queryKey: ["pagamentos"],
    queryFn: () => apiRequest("GET", "/pagamentos"),
  });

  const pagamentos: (Pagamento & { aluno?: Aluno })[] = pagamentosRaw.map((item: any) => ({
    ...item.pagamento,
    aluno: item.usuario,
  }));

  const { data: alunos = [] } = useQuery<Aluno[]>({
    queryKey: ["alunos"],
    queryFn: () => apiRequest("GET", "/alunos"),
  });

  const { data: comprovantesRaw = [], refetch: refetchComp } = useQuery({
    queryKey: ["comprovantes-pendentes"],
    queryFn: () => apiRequest("GET", "/pagamentos/comprovantes-pendentes"),
  });

  const comprovantes: (Pagamento & { aluno?: Aluno })[] = comprovantesRaw.map((item: any) => ({
    ...item.pagamento,
    aluno: item.usuario,
  }));

  const criar = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/pagamentos", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pagamentos"] });
      formSheet.close();
      setDescricao(""); setValor(""); setUsuarioId(""); setVencimento(""); setFormaPagamento("pix");
      refetch();
    },
    onError: (e: any) => setError(e.message),
  });

  const atualizar = useMutation({
    mutationFn: ({ id, ...data }: any) => apiRequest("PATCH", `/pagamentos/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pagamentos"] });
      refetch();
    },
  });

  const deletar = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/pagamentos/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pagamentos"] });
      reciboSheet.close();
      setPagSelecionado(null);
      refetch();
    },
  });

  const aprovar = useMutation({
    mutationFn: (id: number) => apiRequest("POST", `/pagamentos/${id}/aprovar`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pagamentos"] });
      qc.invalidateQueries({ queryKey: ["comprovantes-pendentes"] });
      analiseSheet.close();
      setPagSelecionado(null);
      refetchComp();
    },
  });

  const rejeitar = useMutation({
    mutationFn: ({ id, motivo }: { id: number; motivo: string }) =>
      apiRequest("POST", `/pagamentos/${id}/rejeitar`, { motivo }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pagamentos"] });
      qc.invalidateQueries({ queryKey: ["comprovantes-pendentes"] });
      analiseSheet.close();
      setPagSelecionado(null);
      setMotivoRejeicao("");
      refetchComp();
    },
  });

  // Stats
  const stats = useMemo(() => {
    const pagos    = pagamentos.filter((p) => p.status === "pago");
    const pendentes= pagamentos.filter((p) => p.status === "pendente");
    const hoje = new Date();
    const atrasados = pagamentos.filter(
      (p) => p.status !== "pago" && p.dataVencimento && new Date(p.dataVencimento) < hoje
    );
    return {
      totalArrecadado: pagos.reduce((a, p) => a + p.valor, 0),
      qtdPagos: pagos.length,
      totalPendente: pendentes.reduce((a, p) => a + p.valor, 0),
      qtdAtrasados: atrasados.length,
    };
  }, [pagamentos]);

  const filtrados = pagamentos.filter((p) => {
    const aluno = alunos.find((a: Aluno) => a.id === p.usuarioId);
    const matchNome = !filtroNome || aluno?.nome?.toLowerCase().includes(filtroNome.toLowerCase());
    const matchStatus = filtroStatus === "todos" || p.status === filtroStatus;
    return matchNome && matchStatus;
  });

  const statusTabs: { key: FiltroStatus; label: string }[] = [
    { key: "todos",    label: "Todos" },
    { key: "pendente", label: "Pendentes" },
    { key: "pago",     label: "Pagos" },
    { key: "atrasado", label: "Atrasados" },
  ];

  const formaLabel: Record<string, string> = {
    pix: "Pix", cartao: "Cartão", boleto: "Boleto", dinheiro: "Dinheiro",
  };

  return (
    <MobileLayout role="admin">
      <MobileHeader
        title="Pagamentos"
        subtitle="Gestão financeira"
        gradient
        actions={[{ icon: "add_circle", onClick: formSheet.open, label: "Novo" }]}
      />

      <div className="px-4 py-4 space-y-4">
        {/* Stats 2x2 */}
        <div className="grid grid-cols-2 gap-3">
          <MobileMetricCard title="Arrecadado" value={formatCurrency(stats.totalArrecadado)} icon="payments" color="green" subtitle={`${stats.qtdPagos} pagtos`} />
          <MobileMetricCard title="Pendentes"  value={formatCurrency(stats.totalPendente)}  icon="pending_actions" color="amber" />
          <MobileMetricCard title="Atrasados"  value={String(stats.qtdAtrasados)} icon="warning" color="rose" subtitle="boletos" />
          <MobileMetricCard title="Total"      value={String(pagamentos.length)} icon="receipt_long" color="primary" subtitle="registros" />
        </div>

        {/* Seletor de aba principal */}
        <div className="flex bg-slate-100 dark:bg-slate-800 rounded-2xl p-1 gap-1">
          <button
            onClick={() => setTabPrincipal("pagamentos")}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${tabPrincipal === "pagamentos" ? "bg-white dark:bg-slate-700 text-primary shadow-sm" : "text-slate-500"}`}
          >
            Pagamentos
          </button>
          <button
            onClick={() => setTabPrincipal("comprovantes")}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${tabPrincipal === "comprovantes" ? "bg-white dark:bg-slate-700 text-primary shadow-sm" : "text-slate-500"}`}
          >
            Comprovantes
            {comprovantes.length > 0 && (
              <span className="inline-flex items-center justify-center h-4 min-w-[1rem] px-1 rounded-full bg-rose-500 text-white text-[9px] font-black">
                {comprovantes.length}
              </span>
            )}
          </button>
        </div>

        {tabPrincipal === "comprovantes" ? (
          /* Aba Comprovantes */
          comprovantes.length === 0 ? (
            <MobileCard className="text-center py-12">
              <span className="material-symbols-outlined text-slate-300 dark:text-slate-600 text-5xl">task_alt</span>
              <p className="text-slate-500 mt-3 text-sm">Nenhum comprovante pendente</p>
              <p className="text-xs text-slate-400 mt-1">Todos os comprovantes foram analisados</p>
            </MobileCard>
          ) : (
            <div className="space-y-3">
              {comprovantes.map((c) => (
                <MobileCard key={c.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <MobileAvatar name={c.aluno?.nome} src={(c.aluno as any)?.avatarUrl ?? undefined} size="md" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{c.aluno?.nome || "Aluno"}</p>
                      <p className="text-xs text-slate-500 truncate">{c.descricao}</p>
                      <p className="text-base font-black text-slate-900 dark:text-white mt-1">{formatCurrency(c.valor)}</p>
                      {c.comprovanteUrl && (
                        <a href={`/${c.comprovanteUrl}`} target="_blank" rel="noopener noreferrer" className="inline-block mt-2">
                          <img src={`/${c.comprovanteUrl}`} alt="Comprovante" className="w-24 h-16 object-cover rounded-lg border border-slate-200 dark:border-slate-700" />
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <MobileButton
                      variant="secondary"
                      fullWidth
                      size="sm"
                      icon="cancel"
                      onClick={() => { setPagSelecionado(c); setMotivoRejeicao(""); analiseSheet.open(); }}
                    >
                      Rejeitar
                    </MobileButton>
                    <MobileButton
                      variant="primary"
                      fullWidth
                      size="sm"
                      icon="check_circle"
                      loading={aprovar.isPending}
                      onClick={() => aprovar.mutate(c.id)}
                    >
                      Aprovar
                    </MobileButton>
                  </div>
                </MobileCard>
              ))}
            </div>
          )
        ) : (
          <>
            {/* Filter */}
            <MobileInput icon="search" placeholder="Buscar por aluno..." value={filtroNome} onChange={(e) => setFiltroNome(e.target.value)} />

            <div className="mobile-tab-bar">
              {statusTabs.map((t) => (
                <button key={t.key} className={`mobile-tab-item ${filtroStatus === t.key ? "active" : ""}`} onClick={() => setFiltroStatus(t.key)}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* List */}
            {isLoading ? (
              <div className="space-y-2">{[1,2,3].map((i) => <Skeleton key={i} variant="card" />)}</div>
            ) : filtrados.length > 0 ? (
              <div className="space-y-2">
                {filtrados.map((pag) => {
                  const aluno = alunos.find((a: Aluno) => a.id === pag.usuarioId);
                  const hoje = new Date();
                  const venc = pag.dataVencimento ? new Date(pag.dataVencimento) : null;
                  const isAtrasado = pag.status !== "pago" && venc && venc < hoje;
                  const statusBadge = isAtrasado ? "atrasado" : pag.status as any;

                  return (
                    <MobileCard key={pag.id} className="p-4">
                      <div className="flex items-start gap-3">
                        <MobileAvatar name={aluno?.nome} src={aluno?.avatarUrl ?? undefined} size="md" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{aluno?.nome || "Aluno"}</p>
                            <MobileBadge variant={statusBadge === "pago" ? "success" : statusBadge === "pendente" ? "warning" : "danger"} />
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">{pag.descricao}</p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-base font-black text-slate-900 dark:text-white">{formatCurrency(pag.valor)}</span>
                            <span className="text-xs text-slate-400">
                              Venc: {formatDate(pag.dataVencimento)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                            <span className="text-xs text-slate-400">{formaLabel[pag.formaPagamento || "pix"] || "Pix"}</span>
                            {pag.status !== "pago" ? (
                              <button
                                onClick={() => atualizar.mutate({ id: pag.id, status: "pago", dataPagamento: new Date().toISOString(), formaPagamento: pag.formaPagamento || "pix" })}
                                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                              >
                                Marcar Pago
                              </button>
                            ) : (
                              <button
                                onClick={() => { setPagSelecionado(pag); reciboSheet.open(); }}
                                className="text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors"
                              >
                                Ver Recibo
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </MobileCard>
                  );
                })}
              </div>
            ) : (
              <MobileCard className="text-center py-12">
                <span className="material-symbols-outlined text-slate-300 dark:text-slate-600 text-5xl">receipt_long</span>
                <p className="text-slate-500 mt-3 text-sm">Nenhum pagamento encontrado</p>
                <MobileButton variant="ghost" size="sm" icon="add_circle" className="mt-3" onClick={formSheet.open}>
                  Registrar pagamento
                </MobileButton>
              </MobileCard>
            )}
          </>
        )}
      </div>

      {/* Bottom Sheet: Análise de Comprovante */}
      {pagSelecionado && analiseSheet.isOpen && (
        <BottomSheet isOpen={analiseSheet.isOpen} onClose={() => { analiseSheet.close(); setPagSelecionado(null); setMotivoRejeicao(""); }} title="Analisar Comprovante">
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <MobileAvatar name={pagSelecionado.aluno?.nome} src={pagSelecionado.aluno?.avatarUrl ?? undefined} size="md" />
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">{pagSelecionado.aluno?.nome}</p>
                <p className="text-xs text-slate-500">{pagSelecionado.descricao} · {formatCurrency(pagSelecionado.valor)}</p>
              </div>
            </div>
            {pagSelecionado.comprovanteUrl && (
              <a href={`/${pagSelecionado.comprovanteUrl}`} target="_blank" rel="noopener noreferrer">
                <img src={`/${pagSelecionado.comprovanteUrl}`} alt="Comprovante" className="w-full rounded-xl object-cover max-h-64 border border-slate-200 dark:border-slate-700" />
              </a>
            )}
            <MobileInput
              label="Motivo da Rejeição (obrigatório)"
              icon="edit_note"
              placeholder="Ex: imagem ilegível, valor incorreto..."
              value={motivoRejeicao}
              onChange={(e) => setMotivoRejeicao(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-3 pt-1">
              <MobileButton variant="secondary" fullWidth onClick={() => { analiseSheet.close(); setPagSelecionado(null); setMotivoRejeicao(""); }}>Cancelar</MobileButton>
              <MobileButton
                variant="danger"
                fullWidth
                loading={rejeitar.isPending}
                disabled={!motivoRejeicao.trim()}
                onClick={() => {
                  if (!motivoRejeicao.trim()) return;
                  rejeitar.mutate({ id: pagSelecionado.id, motivo: motivoRejeicao });
                }}
              >
                Rejeitar
              </MobileButton>
            </div>
          </div>
        </BottomSheet>
      )}


      <BottomSheet isOpen={formSheet.isOpen} onClose={formSheet.close} title="Novo Pagamento">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Aluno</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xl pointer-events-none">person</span>
              <select value={usuarioId} onChange={(e) => setUsuarioId(e.target.value)} className="mobile-input pl-11 appearance-none">
                <option value="">Selecionar aluno...</option>
                {alunos.map((a: Aluno) => <option key={a.id} value={a.id}>{a.nome}</option>)}
              </select>
            </div>
          </div>
          <MobileInput label="Descrição" icon="description" placeholder="ex: Mensalidade Março" value={descricao} onChange={(e) => setDescricao(e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <MobileInput label="Valor (R$)" icon="attach_money" type="number" step="0.01" placeholder="0,00" value={valor} onChange={(e) => setValor(e.target.value)} />
            <MobileInput label="Vencimento" icon="event" type="date" value={vencimento} onChange={(e) => setVencimento(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Forma de Pagamento</label>
            <select value={formaPagamento} onChange={(e) => setFormaPagamento(e.target.value)} className="mobile-input appearance-none">
              <option value="pix">Pix</option>
              <option value="cartao">Cartão</option>
              <option value="boleto">Boleto</option>
              <option value="dinheiro">Dinheiro</option>
            </select>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <MobileButton variant="secondary" fullWidth onClick={formSheet.close}>Cancelar</MobileButton>
            <MobileButton variant="primary" fullWidth loading={criar.isPending}
              onClick={() => criar.mutate({ descricao, valor: parseFloat(valor), usuarioId: parseInt(usuarioId), dataVencimento: vencimento, formaPagamento, status: "pendente" })}>
              Salvar
            </MobileButton>
          </div>
        </div>
      </BottomSheet>

      {/* Bottom Sheet: Recibo */}
      {pagSelecionado && (
        <BottomSheet isOpen={reciboSheet.isOpen} onClose={() => { reciboSheet.close(); setPagSelecionado(null); }} title="Recibo de Pagamento">
          <div className="space-y-3">
            {[
              { label: "Aluno", value: alunos.find((a: Aluno) => a.id === pagSelecionado.usuarioId)?.nome || "—" },
              { label: "Descrição", value: pagSelecionado.descricao },
              { label: "Valor", value: formatCurrency(pagSelecionado.valor) },
              { label: "Forma", value: formaLabel[pagSelecionado.formaPagamento] || "—" },
              { label: "Data Pagamento", value: formatDate(pagSelecionado.dataPagamento) },
            ].map((r) => (
              <div key={r.label} className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-sm text-slate-500">{r.label}</span>
                <span className="text-sm font-semibold text-slate-900 dark:text-white">{r.value}</span>
              </div>
            ))}
            <MobileButton variant="danger" fullWidth icon="delete" loading={deletar.isPending}
              className="mt-4" onClick={() => { if (confirm("Excluir pagamento?")) deletar.mutate(pagSelecionado.id); }}>
              Excluir Pagamento
            </MobileButton>
          </div>
        </BottomSheet>
      )}
    </MobileLayout>
  );
}
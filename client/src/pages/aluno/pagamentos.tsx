import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import MobileLayout from "../../components/layout/MobileLayout";
import MobileHeader from "../../components/layout/MobileHeader";
import MobileMetricCard from "../../components/ui/MobileMetricCard";
import MobileCard from "../../components/ui/MobileCard";
import MobileButton from "../../components/ui/MobileButton";
import MobileInput from "../../components/ui/MobileInput";
import BottomSheet from "../../components/ui/BottomSheet";
import Skeleton from "../../components/ui/Skeleton";
import { useBottomSheet } from "../../hooks/useBottomSheet";
import { apiRequest } from "../../lib/queryClient";
import { useAuth } from "../../hooks/useAuth";
import { formatCurrency } from "../../components/shared/CurrencyFormat";
import { formatDate } from "../../components/shared/DateFormat";

interface Pagamento {
  id: number;
  descricao: string;
  valor: string;
  status: "pago" | "pendente" | "atrasado";
  dataVencimento: string | null;
  dataPagamento: string | null;
  formaPagamento: string | null;
  comprovanteUrl: string | null;
  statusComprovante?: string | null;
  motivoRejeicao?: string | null;
}

const CHAVE_PIX = "00020126360014br.gov.bcb.pix0114+5521999999999520400005303986540.005802BR5913OrganizePlus6008Cidade62070503***6304E2C8";

function buildQrUrl(valor: string) {
  const data = CHAVE_PIX + `&valor=${parseFloat(valor).toFixed(2)}`;
  return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(data)}`;
}

type FiltroStatus = "todos" | "pagos" | "pendentes";

export default function AlunoPagamentos() {
  const { auth } = useAuth();
  const qc = useQueryClient();
  const pixSheet = useBottomSheet();

  const [selectedPag, setSelectedPag] = useState<Pagamento | null>(null);
  const [comprovante, setComprovante] = useState<File | null>(null);
  const [descricaoPagamento, setDescricaoPagamento] = useState("");
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<FiltroStatus>("todos");
  const [debouncedBusca, setDebouncedBusca] = useState("");

  // Debounce para busca
  const handleBuscaChange = (value: string) => {
    setBusca(value);
    const timeout = setTimeout(() => setDebouncedBusca(value), 300);
    return () => clearTimeout(timeout);
  };

  const { data: pagamentos = [], isLoading } = useQuery<Pagamento[]>({
    queryKey: ["meus-pagamentos"],
    queryFn: () => apiRequest("GET", "/pagamentos/meus"),
    enabled: !!auth,
    refetchInterval: 30000,
  });

  // Filtros e busca
  const pagamentosFiltrados = useMemo(() => {
    let result = [...pagamentos];

    // Filtro por status
    if (filtro === "pagos") {
      result = result.filter((p) => p.status === "pago");
    } else if (filtro === "pendentes") {
      result = result.filter((p) => p.status !== "pago");
    }

    // Busca por descrição
    if (debouncedBusca.trim()) {
      const termo = debouncedBusca.toLowerCase();
      result = result.filter((p) => p.descricao.toLowerCase().includes(termo));
    }

    return result;
  }, [pagamentos, filtro, debouncedBusca]);

  // Resumo
  const total = pagamentos.reduce((s, p) => s + parseFloat(p.valor || "0"), 0);
  const pago = pagamentos.filter((p) => p.status === "pago").reduce((s, p) => s + parseFloat(p.valor || "0"), 0);
  const pendente = total - pago;

  // Próximo vencimento
  const proximoVencimento = pagamentos
    .filter((p) => p.status !== "pago" && p.dataVencimento)
    .sort((a, b) => new Date(a.dataVencimento!).getTime() - new Date(b.dataVencimento!).getTime())[0];

  const confirmarMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      setUploadStatus("uploading");
      return apiRequest("POST", "/pagamentos/confirmar-comprovante", formData);
    },
    onSuccess: () => {
      setUploadStatus("success");
      setTimeout(() => {
        pixSheet.close();
        setComprovante(null);
        setDescricaoPagamento("");
        setUploadStatus("idle");
        qc.invalidateQueries({ queryKey: ["meus-pagamentos"] });
      }, 2000);
    },
    onError: () => {
      setUploadStatus("error");
      setTimeout(() => setUploadStatus("idle"), 3000);
    },
  });

  const handleUpload = () => {
    if (!comprovante || !selectedPag) return;
    const fd = new FormData();
    fd.append("comprovante", comprovante);
    fd.append("pagamentoId", selectedPag.id.toString());
    fd.append("descricaoPagamento", descricaoPagamento);
    confirmarMutation.mutate(fd);
  };

  const openModal = (p: Pagamento) => {
    setSelectedPag(p);
    setComprovante(null);
    setDescricaoPagamento("");
    setUploadStatus("idle");
    pixSheet.open();
  };

  const isAtrasado = (p: Pagamento) =>
    p.status !== "pago" && p.dataVencimento && new Date(p.dataVencimento) < new Date(new Date().setHours(0, 0, 0, 0));

  return (
    <MobileLayout role="aluno">
      <MobileHeader title="Pagamentos" subtitle="Minhas faturas e PIX" gradient showAvatar />

      <div className="px-4 py-4 space-y-4">
        {/* Resumo */}
        <div className="grid grid-cols-2 gap-3">
          <MobileMetricCard title="Total Pago" value={formatCurrency(pago)} icon="check_circle" color="green" />
          <MobileMetricCard title="A Pagar" value={formatCurrency(pendente)} icon="schedule" color="amber" />
        </div>

        {/* Próximo vencimento */}
        {proximoVencimento && (
          <MobileCard className="p-3 bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-500 text-lg">event</span>
              <div>
                <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase tracking-widest">
                  Próximo Vencimento
                </p>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {proximoVencimento.descricao} — {formatDate(proximoVencimento.dataVencimento, "short")}
                </p>
              </div>
            </div>
          </MobileCard>
        )}

        {/* Barra de busca e filtros */}
        <div className="space-y-3">
          <MobileInput
            icon="search"
            placeholder="Buscar por descrição..."
            value={busca}
            onChange={(e) => handleBuscaChange(e.target.value)}
          />

          {/* Filtros de status */}
          <div className="flex gap-2">
            {([
              { key: "todos" as FiltroStatus, label: "Todos" },
              { key: "pagos" as FiltroStatus, label: "Pagos" },
              { key: "pendentes" as FiltroStatus, label: "Pendentes" },
            ]).map((f) => (
              <button
                key={f.key}
                onClick={() => setFiltro(f.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filtro === f.key
                    ? "bg-primary text-white shadow-sm"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Lista de faturas */}
        <div>
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3 px-1">
            Histórico de Faturas ({pagamentosFiltrados.length})
          </h3>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} variant="card" />
              ))}
            </div>
          ) : pagamentosFiltrados.length === 0 ? (
            <MobileCard className="text-center py-12">
              <span className="material-symbols-outlined text-slate-300 dark:text-slate-600 text-5xl">
                receipt_long
              </span>
              <p className="text-slate-500 mt-3 text-sm">
                {busca || filtro !== "todos"
                  ? "Nenhum pagamento encontrado com os filtros aplicados"
                  : "Nenhum pagamento registrado"}
              </p>
            </MobileCard>
          ) : (
            <div className="space-y-3">
              {pagamentosFiltrados.map((p) => {
                const atrasado = isAtrasado(p);
                const isPaid = p.status === "pago";

                return (
                  <MobileCard key={p.id} className={`p-4 ${isPaid ? "opacity-75" : ""}`}>
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex gap-3 items-center">
                        <div
                          className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${
                            isPaid
                              ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600"
                              : atrasado
                              ? "bg-rose-100 dark:bg-rose-950/40 text-rose-600"
                              : "bg-amber-100 dark:bg-amber-950/40 text-amber-600"
                          }`}
                        >
                          <span className="material-symbols-outlined text-sm">
                            {isPaid ? "check" : atrasado ? "warning" : "schedule"}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">
                            {p.descricao}
                          </p>
                          <p className="text-xs text-slate-500">
                            {p.dataVencimento
                              ? `Venc: ${formatDate(p.dataVencimento, "short")}`
                              : "Sem vencimento"}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-base font-black text-slate-900 dark:text-white">
                          {formatCurrency(parseFloat(p.valor || "0"))}
                        </p>
                        {isPaid && p.dataPagamento && (
                          <p className="text-[10px] text-slate-400">
                            Pago: {formatDate(p.dataPagamento, "short")}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Ações baseadas no status */}
                    {isPaid ? (
                      p.comprovanteUrl ? (
                        <a
                          href={`/api/${p.comprovanteUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 block w-full"
                        >
                          <MobileButton variant="ghost" fullWidth size="sm" icon="receipt">
                            Ver Comprovante
                          </MobileButton>
                        </a>
                      ) : (
                        <div className="text-center mt-2 px-2 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-1">
                          <span className="material-symbols-outlined text-sm">verified</span> Pago
                        </div>
                      )
                    ) : p.statusComprovante === "pendente" ? (
                      <div className="mt-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 rounded-xl flex items-center gap-2">
                        <span className="material-symbols-outlined text-amber-500 text-sm animate-pulse">
                          schedule
                        </span>
                        <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                          Aguardando Análise
                        </span>
                      </div>
                    ) : p.statusComprovante === "rejeitado" ? (
                      <div className="mt-2 space-y-2">
                        <div className="px-3 py-2 bg-rose-50 dark:bg-rose-950/30 rounded-xl">
                          <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1 mb-1">
                            <span className="material-symbols-outlined text-sm">cancel</span> Comprovante
                            Rejeitado
                          </p>
                          {p.motivoRejeicao && (
                            <p className="text-xs text-rose-500 dark:text-rose-400">
                              {p.motivoRejeicao}
                            </p>
                          )}
                        </div>
                        <MobileButton
                          variant="danger"
                          fullWidth
                          size="sm"
                          icon="upload_file"
                          onClick={() => openModal(p)}
                        >
                          Reenviar Comprovante
                        </MobileButton>
                      </div>
                    ) : (
                      <MobileButton
                        variant={atrasado ? "danger" : "primary"}
                        fullWidth
                        size="sm"
                        icon="qr_code_scanner"
                        onClick={() => openModal(p)}
                      >
                        Pagar com PIX
                      </MobileButton>
                    )}
                  </MobileCard>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Sheet - Pagamento via PIX */}
      <BottomSheet isOpen={pixSheet.isOpen} onClose={pixSheet.close} title="Pagamento via PIX">
        {selectedPag && (
          <div className="space-y-5">
            {uploadStatus === "success" ? (
              <div className="text-center py-8">
                <span className="material-symbols-outlined text-5xl text-emerald-500 mb-2">
                  check_circle
                </span>
                <p className="text-lg font-bold text-slate-900 dark:text-white">
                  Comprovante enviado!
                </p>
                <p className="text-sm text-slate-500 mt-1">Aguardando validação da comissão.</p>
              </div>
            ) : uploadStatus === "error" ? (
              <div className="text-center py-8">
                <span className="material-symbols-outlined text-5xl text-rose-500 mb-2">error</span>
                <p className="text-lg font-bold text-slate-900 dark:text-white">Erro ao enviar</p>
                <MobileButton variant="ghost" className="mt-4" onClick={() => setUploadStatus("idle")}>
                  Tentar novamente
                </MobileButton>
              </div>
            ) : (
              <>
                <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 text-center">
                  <img
                    src={buildQrUrl(selectedPag.valor)}
                    alt="QR Code PIX"
                    className="mx-auto rounded-xl w-48 h-48 mix-blend-multiply dark:mix-blend-normal"
                  />
                  <p className="text-lg font-black mt-3 text-slate-900 dark:text-white">
                    {formatCurrency(parseFloat(selectedPag.valor))}
                  </p>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 block">
                    PIX Copia e Cola
                  </label>
                  <div className="flex bg-slate-100 dark:bg-slate-800 p-3 rounded-xl gap-2 items-center">
                    <p className="text-[10px] font-mono text-slate-500 truncate flex-1">
                      {CHAVE_PIX}
                    </p>
                    <button
                      onClick={() => navigator.clipboard.writeText(CHAVE_PIX)}
                      className="p-2 text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg shrink-0"
                      aria-label="Copiar código PIX"
                    >
                      <span className="material-symbols-outlined text-sm">content_copy</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block">
                    Anexar Comprovante
                  </label>
                  <label
                    className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                      comprovante
                        ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20"
                        : "border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <span
                        className={`material-symbols-outlined text-2xl mb-1 ${
                          comprovante ? "text-emerald-500" : "text-slate-400"
                        }`}
                      >
                        {comprovante ? "task" : "upload_file"}
                      </span>
                      <p className="text-xs font-medium text-slate-500">
                        {comprovante ? comprovante.name : "Toque para escolher um arquivo"}
                      </p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*,application/pdf"
                      onChange={(e) => setComprovante(e.target.files?.[0] || null)}
                    />
                  </label>

                  <MobileInput
                    label="Observação (opcional)"
                    icon="note"
                    placeholder="Ex: Pago via app do banco"
                    value={descricaoPagamento}
                    onChange={(e) => setDescricaoPagamento(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <MobileButton variant="secondary" fullWidth onClick={pixSheet.close}>
                    Cancelar
                  </MobileButton>
                  <MobileButton
                    variant="primary"
                    fullWidth
                    loading={uploadStatus === "uploading"}
                    disabled={!comprovante}
                    onClick={handleUpload}
                  >
                    Enviar
                  </MobileButton>
                </div>
              </>
            )}
          </div>
        )}
      </BottomSheet>
    </MobileLayout>
  );
}

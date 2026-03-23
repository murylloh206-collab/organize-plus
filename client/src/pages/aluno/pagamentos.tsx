import { useState } from "react";
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
  comprovanteUrl: string | null;
}

const CHAVE_PIX = "00020126360014br.gov.bcb.pix0114+5521999999999520400005303986540.005802BR5913OrganizePlus6008Cidade62070503***6304E2C8";

function buildQrUrl(valor: string) {
  const data = CHAVE_PIX + `&valor=${parseFloat(valor).toFixed(2)}`;
  return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(data)}`;
}

export default function AlunoPagamentos() {
  const { auth } = useAuth();
  const qc = useQueryClient();
  const pixSheet = useBottomSheet();

  const [selectedPag, setSelectedPag] = useState<Pagamento | null>(null);
  const [comprovante, setComprovante] = useState<File | null>(null);
  const [descricaoPagamento, setDescricaoPagamento] = useState("");
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");

  const { data: pagamentos = [], isLoading } = useQuery<Pagamento[]>({
    queryKey: ["meus-pagamentos"],
    queryFn: () => apiRequest("GET", "/pagamentos/meus"),
    enabled: !!auth,
  });

  const total = pagamentos.reduce((s, p) => s + parseFloat(p.valor || "0"), 0);
  const pago = pagamentos.filter((p) => p.status === "pago").reduce((s, p) => s + parseFloat(p.valor || "0"), 0);
  const pendente = total - pago;

  const confirmarMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      setUploadStatus("uploading");
      return apiRequest("POST", "/pagamentos/confirmar-comprovante", formData);
    },
    onSuccess: () => {
      setUploadStatus("success");
      setTimeout(() => {
        pixSheet.close();
        setComprovante(null); setDescricaoPagamento(""); setUploadStatus("idle");
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
    setComprovante(null); setDescricaoPagamento(""); setUploadStatus("idle");
    pixSheet.open();
  };

  const isAtrasado = (p: Pagamento) => p.status !== "pago" && p.dataVencimento && new Date(p.dataVencimento) < new Date(new Date().setHours(0,0,0,0));

  return (
    <MobileLayout role="aluno">
      <MobileHeader title="Pagamentos" subtitle="Minhas faturas e PIX" gradient />

      <div className="px-4 py-4 space-y-4">
        {/* Resumo */}
        <div className="grid grid-cols-2 gap-3">
          <MobileMetricCard title="Pago" value={formatCurrency(pago)} icon="check_circle" color="green" />
          <MobileMetricCard title="A Pagar" value={formatCurrency(pendente)} icon="schedule" color="amber" />
        </div>

        {/* Faturas */}
        <div>
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3 px-1">Histórico de Faturas</h3>
          {isLoading ? (
            <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} variant="card" />)}</div>
          ) : pagamentos.length === 0 ? (
            <MobileCard className="text-center py-12">
              <span className="material-symbols-outlined text-slate-300 dark:text-slate-600 text-5xl">receipt_long</span>
              <p className="text-slate-500 mt-3 text-sm">Nenhum pagamento registrado</p>
            </MobileCard>
          ) : (
            <div className="space-y-3">
              {pagamentos.map((p) => {
                const atrasado = isAtrasado(p);
                const isPaid = p.status === "pago";

                return (
                  <MobileCard key={p.id} className={`p-4 ${isPaid ? "opacity-75" : ""}`}>
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex gap-3 items-center">
                        <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${isPaid ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600" : atrasado ? "bg-rose-100 dark:bg-rose-950/40 text-rose-600" : "bg-amber-100 dark:bg-amber-950/40 text-amber-600"}`}>
                          <span className="material-symbols-outlined text-sm">{isPaid ? "check" : atrasado ? "warning" : "schedule"}</span>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">{p.descricao}</p>
                          <p className="text-xs text-slate-500">
                            {p.dataVencimento ? `Venc: ${formatDate(p.dataVencimento)}` : "Sem vencimento"}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-base font-black text-slate-900 dark:text-white">{formatCurrency(parseFloat(p.valor || "0"))}</p>
                        {isPaid && p.dataPagamento && <p className="text-[10px] text-slate-400">Pago: {formatDate(p.dataPagamento)}</p>}
                      </div>
                    </div>

                    {!isPaid ? (
                      <MobileButton variant={atrasado ? "danger" : "primary"} fullWidth size="sm" icon="qr_code_scanner" onClick={() => openModal(p)}>
                        Pagar com PIX
                      </MobileButton>
                    ) : p.comprovanteUrl ? (
                      <a href={`/api/${p.comprovanteUrl}`} target="_blank" rel="noopener noreferrer" className="mt-2 block w-full">
                        <MobileButton variant="ghost" fullWidth size="sm" icon="receipt">Ver Comprovante</MobileButton>
                      </a>
                    ) : (
                      <div className="text-center mt-2 px-2 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-1">
                        <span className="material-symbols-outlined text-sm">verified</span> Pago
                      </div>
                    )}
                  </MobileCard>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <BottomSheet isOpen={pixSheet.isOpen} onClose={pixSheet.close} title="Pagamento via PIX">
        {selectedPag && (
          <div className="space-y-5">
            {uploadStatus === "success" ? (
              <div className="text-center py-8">
                <span className="material-symbols-outlined text-5xl text-emerald-500 mb-2">check_circle</span>
                <p className="text-lg font-bold text-slate-900 dark:text-white">Comprovante enviado!</p>
                <p className="text-sm text-slate-500 mt-1">Aguardando validação da comissão.</p>
              </div>
            ) : uploadStatus === "error" ? (
              <div className="text-center py-8">
                <span className="material-symbols-outlined text-5xl text-rose-500 mb-2">error</span>
                <p className="text-lg font-bold text-slate-900 dark:text-white">Erro ao enviar</p>
                <MobileButton variant="ghost" className="mt-4" onClick={() => setUploadStatus("idle")}>Tentar novamente</MobileButton>
              </div>
            ) : (
              <>
                <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 text-center">
                  <img src={buildQrUrl(selectedPag.valor)} alt="QR Code" className="mx-auto rounded-xl w-48 h-48 mix-blend-multiply dark:mix-blend-normal" />
                  <p className="text-lg font-black mt-3 text-slate-900 dark:text-white">{formatCurrency(parseFloat(selectedPag.valor))}</p>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 block">PIX Copia e Cola</label>
                  <div className="flex bg-slate-100 dark:bg-slate-800 p-3 rounded-xl gap-2 items-center">
                    <p className="text-[10px] font-mono text-slate-500 truncate flex-1">{CHAVE_PIX}</p>
                    <button onClick={() => navigator.clipboard.writeText(CHAVE_PIX)} className="p-2 text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg shrink-0">
                      <span className="material-symbols-outlined text-sm">content_copy</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block">Anexar Comprovante</label>
                  <label className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-xl cursor-pointer ${comprovante ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20" : "border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"}`}>
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <span className={`material-symbols-outlined text-2xl mb-1 ${comprovante ? "text-emerald-500" : "text-slate-400"}`}>
                        {comprovante ? "task" : "upload_file"}
                      </span>
                      <p className="text-xs font-medium text-slate-500">
                        {comprovante ? comprovante.name : "Toque para escolher um arquivo"}
                      </p>
                    </div>
                    <input type="file" className="hidden" accept="image/*,application/pdf" onChange={(e) => setComprovante(e.target.files?.[0] || null)} />
                  </label>
                  
                  <MobileInput label="Observação (opcional)" icon="note" placeholder="Ex: Pago via app do banco" value={descricaoPagamento} onChange={(e) => setDescricaoPagamento(e.target.value)} />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <MobileButton variant="secondary" fullWidth onClick={pixSheet.close}>Cancelar</MobileButton>
                  <MobileButton variant="primary" fullWidth loading={uploadStatus === "uploading"} disabled={!comprovante} onClick={handleUpload}>
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

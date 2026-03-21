import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Sidebar from "../../components/layout/Sidebar";
import { apiRequest } from "../../lib/queryClient";
import { useAuth } from "../../hooks/useAuth";

interface Pagamento {
  id: number;
  descricao: string;
  valor: string;
  status: "pago" | "pendente" | "atrasado";
  dataVencimento: string | null;
  dataPagamento: string | null;
  formaPagamento: string | null;
  comprovanteUrl: string | null;
  descricaoPagamento: string | null;
}

type UploadStatus = "idle" | "uploading" | "success" | "error";

// Chave PIX fictícia no formato EMV (você pode trocar para a real no .env depois)
const CHAVE_PIX =
  "00020126360014br.gov.bcb.pix0114+5521999999999520400005303986540.005802BR5913OrganizePlus6008Cidade62070503***6304E2C8";

function buildQrUrl(valor: string) {
  const data = CHAVE_PIX + `&valor=${parseFloat(valor).toFixed(2)}`;
  return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(data)}`;
}

function fmt(v: string | number) {
  return parseFloat(String(v || 0)).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function isAtrasado(dataVencimento: string | null, status: string) {
  if (!dataVencimento || status === "pago") return false;
  return new Date(dataVencimento) < new Date();
}

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR");
}

export default function AlunoPagamentos() {
  const { auth } = useAuth();
  const qc = useQueryClient();

  const [selectedPag, setSelectedPag] = useState<Pagamento | null>(null);
  const [comprovante, setComprovante] = useState<File | null>(null);
  const [descricaoPagamento, setDescricaoPagamento] = useState("");
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle");
  const [showModal, setShowModal] = useState(false);

  // Buscar SOMENTE os pagamentos do aluno logado
  const { data: pagamentos = [], isLoading } = useQuery<Pagamento[]>({
    queryKey: ["meus-pagamentos"],
    queryFn: () => apiRequest("GET", "/pagamentos/meus"),
    enabled: !!auth,
  });

  const total = pagamentos.reduce((s, p) => s + parseFloat(p.valor || "0"), 0);
  const pago = pagamentos
    .filter((p) => p.status === "pago")
    .reduce((s, p) => s + parseFloat(p.valor || "0"), 0);
  const pendente = total - pago;

  const confirmarMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      setUploadStatus("uploading");
      return apiRequest("POST", "/pagamentos/confirmar-comprovante", formData);
    },
    onSuccess: () => {
      setUploadStatus("success");
      setTimeout(() => {
        setShowModal(false);
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

  function handleUpload() {
    if (!comprovante || !selectedPag) return;
    const fd = new FormData();
    fd.append("comprovante", comprovante);
    fd.append("pagamentoId", selectedPag.id.toString());
    fd.append("descricaoPagamento", descricaoPagamento);
    confirmarMutation.mutate(fd);
  }

  function openModal(p: Pagamento) {
    setSelectedPag(p);
    setComprovante(null);
    setDescricaoPagamento("");
    setUploadStatus("idle");
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setUploadStatus("idle");
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar role="aluno" />

      <main className="flex-1 ml-64 p-8 space-y-6">
        {/* Cabeçalho */}
        <div>
          <h2 className="text-3xl font-black tracking-tight">Meus Pagamentos</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Acompanhe suas pendências e pague via PIX.
          </p>
        </div>

        {/* Cards de resumo */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total", value: fmt(total), icon: "payments", color: "text-slate-500" },
            { label: "Pago", value: fmt(pago), icon: "check_circle", color: "text-emerald-500" },
            { label: "Pendente", value: fmt(pendente), icon: "schedule", color: "text-amber-500" },
          ].map((s) => (
            <div key={s.label} className="card p-5">
              <div className="flex items-center gap-2 mb-2">
                <span className={`material-symbols-outlined ${s.color}`}>{s.icon}</span>
                <span className="text-xs font-bold uppercase text-slate-400">{s.label}</span>
              </div>
              <p className="text-2xl font-black">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Lista de pagamentos */}
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h4 className="font-bold">Histórico</h4>
            <span className="text-xs text-slate-400">{pagamentos.length} registro(s)</span>
          </div>

          {isLoading ? (
            <div className="px-6 py-12 text-center text-slate-400">
              <div className="size-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              Carregando...
            </div>
          ) : pagamentos.length === 0 ? (
            <div className="px-6 py-12 text-center text-slate-400">
              <span className="material-symbols-outlined text-4xl mb-2 block">check_circle</span>
              Nenhum pagamento registrado.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {pagamentos.map((p) => {
                const atrasado = isAtrasado(p.dataVencimento, p.status);
                const statusDisplay =
                  p.status === "pago" ? "Pago" : atrasado ? "Atrasado" : "Pendente";
                const statusClass =
                  p.status === "pago"
                    ? "badge-success"
                    : atrasado
                    ? "badge-danger"
                    : "badge-warning";

                return (
                  <div key={p.id} className="px-6 py-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1">
                      <div
                        className={`size-10 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          p.status === "pago"
                            ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20"
                            : atrasado
                            ? "border-rose-400 bg-rose-50 dark:bg-rose-900/20"
                            : "border-amber-400 bg-amber-50 dark:bg-amber-900/20"
                        }`}
                      >
                        <span
                          className={`material-symbols-outlined text-sm ${
                            p.status === "pago"
                              ? "text-emerald-500"
                              : atrasado
                              ? "text-rose-500"
                              : "text-amber-500"
                          }`}
                        >
                          {p.status === "pago" ? "check" : atrasado ? "warning" : "schedule"}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{p.descricao}</p>
                        <p className="text-xs text-slate-500">
                          {p.dataVencimento
                            ? `Venc.: ${formatDate(p.dataVencimento)}`
                            : "Sem vencimento"}
                          {p.dataPagamento && ` · Pago: ${formatDate(p.dataPagamento)}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-black">{fmt(p.valor)}</p>
                        <span className={statusClass}>{statusDisplay}</span>
                      </div>

                      {p.status !== "pago" ? (
                        <button
                          onClick={() => openModal(p)}
                          className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-1.5 transition-all"
                        >
                          <span className="material-symbols-outlined text-sm">qr_code_scanner</span>
                          Pagar PIX
                        </button>
                      ) : p.comprovanteUrl ? (
                        <a
                          href={`/api/uploads/${p.comprovanteUrl.replace("uploads/", "").replace("uploads\\", "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-sm">receipt</span>
                          Comprovante
                        </a>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Modal PIX */}
      {showModal && selectedPag && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-lg">Pagar via PIX</h3>
                <p className="text-xs text-slate-400">{selectedPag.descricao}</p>
              </div>
              <button
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="px-6 py-5">
              {uploadStatus === "success" ? (
                <div className="text-center py-8">
                  <span className="material-symbols-outlined text-6xl text-emerald-500 block mb-3">
                    check_circle
                  </span>
                  <p className="text-lg font-bold">Comprovante enviado!</p>
                  <p className="text-slate-500 text-sm mt-1">
                    Aguardando validação do administrador.
                  </p>
                </div>
              ) : uploadStatus === "error" ? (
                <div className="text-center py-8">
                  <span className="material-symbols-outlined text-6xl text-rose-500 block mb-3">
                    error
                  </span>
                  <p className="text-lg font-bold">Erro ao enviar</p>
                  <p className="text-slate-500 text-sm mt-1">Tente novamente em instantes.</p>
                  <button
                    onClick={() => setUploadStatus("idle")}
                    className="mt-4 text-primary text-sm hover:underline"
                  >
                    Tentar novamente
                  </button>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* QR Code */}
                  <div className="text-center bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
                    <img
                      src={buildQrUrl(selectedPag.valor)}
                      alt="QR Code PIX"
                      className="mx-auto rounded-lg"
                      width={220}
                      height={220}
                    />
                    <p className="text-sm font-bold mt-3 text-slate-700 dark:text-slate-300">
                      {fmt(selectedPag.valor)}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Escaneie com o app do seu banco
                    </p>
                  </div>

                  {/* Chave PIX copia-e-cola */}
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                      Copia e Cola
                    </p>
                    <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 flex items-start gap-2">
                      <code className="text-xs font-mono text-slate-600 dark:text-slate-300 break-all flex-1">
                        {CHAVE_PIX}
                      </code>
                      <button
                        onClick={() => navigator.clipboard.writeText(CHAVE_PIX)}
                        title="Copiar"
                        className="text-slate-400 hover:text-primary shrink-0 transition-colors"
                      >
                        <span className="material-symbols-outlined text-lg">content_copy</span>
                      </button>
                    </div>
                  </div>

                  {/* Upload comprovante */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                      Comprovante de Pagamento *
                    </label>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/jpg,application/pdf"
                      onChange={(e) => setComprovante(e.target.files?.[0] || null)}
                      className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary file:text-white file:font-semibold file:cursor-pointer hover:file:bg-primary/90 transition-all cursor-pointer"
                    />
                    {comprovante && (
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">check</span>
                        {comprovante.name}
                      </p>
                    )}
                    <p className="text-xs text-slate-400 mt-1">JPG, PNG ou PDF · máx. 5 MB</p>
                  </div>

                  {/* Descrição opcional */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                      Observação (opcional)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Pagamento da mensalidade de março"
                      value={descricaoPagamento}
                      onChange={(e) => setDescricaoPagamento(e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>

                  {/* Botões */}
                  <div className="flex gap-3 pt-1">
                    <button
                      onClick={handleUpload}
                      disabled={!comprovante || uploadStatus === "uploading"}
                      className="flex-1 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2"
                    >
                      {uploadStatus === "uploading" ? (
                        <>
                          <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-sm">upload</span>
                          Enviar Comprovante
                        </>
                      )}
                    </button>
                    <button
                      onClick={closeModal}
                      className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 py-2.5 rounded-lg text-sm font-bold transition-all"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

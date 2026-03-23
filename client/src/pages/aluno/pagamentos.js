import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
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
const CHAVE_PIX = "00020126360014br.gov.bcb.pix0114+5521999999999520400005303986540.005802BR5913OrganizePlus6008Cidade62070503***6304E2C8";
function buildQrUrl(valor) {
    const data = CHAVE_PIX + `&valor=${parseFloat(valor).toFixed(2)}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(data)}`;
}
export default function AlunoPagamentos() {
    const { auth } = useAuth();
    const qc = useQueryClient();
    const pixSheet = useBottomSheet();
    const [selectedPag, setSelectedPag] = useState(null);
    const [comprovante, setComprovante] = useState(null);
    const [descricaoPagamento, setDescricaoPagamento] = useState("");
    const [uploadStatus, setUploadStatus] = useState("idle");
    const { data: pagamentos = [], isLoading } = useQuery({
        queryKey: ["meus-pagamentos"],
        queryFn: () => apiRequest("GET", "/pagamentos/meus"),
        enabled: !!auth,
    });
    const total = pagamentos.reduce((s, p) => s + parseFloat(p.valor || "0"), 0);
    const pago = pagamentos.filter((p) => p.status === "pago").reduce((s, p) => s + parseFloat(p.valor || "0"), 0);
    const pendente = total - pago;
    const confirmarMutation = useMutation({
        mutationFn: async (formData) => {
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
        if (!comprovante || !selectedPag)
            return;
        const fd = new FormData();
        fd.append("comprovante", comprovante);
        fd.append("pagamentoId", selectedPag.id.toString());
        fd.append("descricaoPagamento", descricaoPagamento);
        confirmarMutation.mutate(fd);
    };
    const openModal = (p) => {
        setSelectedPag(p);
        setComprovante(null);
        setDescricaoPagamento("");
        setUploadStatus("idle");
        pixSheet.open();
    };
    const isAtrasado = (p) => p.status !== "pago" && p.dataVencimento && new Date(p.dataVencimento) < new Date(new Date().setHours(0, 0, 0, 0));
    return (_jsxs(MobileLayout, { role: "aluno", children: [_jsx(MobileHeader, { title: "Pagamentos", subtitle: "Minhas faturas e PIX", gradient: true }), _jsxs("div", { className: "px-4 py-4 space-y-4", children: [_jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsx(MobileMetricCard, { title: "Pago", value: formatCurrency(pago), icon: "check_circle", color: "green" }), _jsx(MobileMetricCard, { title: "A Pagar", value: formatCurrency(pendente), icon: "schedule", color: "amber" })] }), _jsxs("div", { children: [_jsx("h3", { className: "text-xs font-bold text-slate-500 uppercase tracking-wide mb-3 px-1", children: "Hist\u00F3rico de Faturas" }), isLoading ? (_jsx("div", { className: "space-y-3", children: [1, 2, 3].map(i => _jsx(Skeleton, { variant: "card" }, i)) })) : pagamentos.length === 0 ? (_jsxs(MobileCard, { className: "text-center py-12", children: [_jsx("span", { className: "material-symbols-outlined text-slate-300 dark:text-slate-600 text-5xl", children: "receipt_long" }), _jsx("p", { className: "text-slate-500 mt-3 text-sm", children: "Nenhum pagamento registrado" })] })) : (_jsx("div", { className: "space-y-3", children: pagamentos.map((p) => {
                                    const atrasado = isAtrasado(p);
                                    const isPaid = p.status === "pago";
                                    return (_jsxs(MobileCard, { className: `p-4 ${isPaid ? "opacity-75" : ""}`, children: [_jsxs("div", { className: "flex justify-between items-start mb-3", children: [_jsxs("div", { className: "flex gap-3 items-center", children: [_jsx("div", { className: `size-10 rounded-xl flex items-center justify-center shrink-0 ${isPaid ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600" : atrasado ? "bg-rose-100 dark:bg-rose-950/40 text-rose-600" : "bg-amber-100 dark:bg-amber-950/40 text-amber-600"}`, children: _jsx("span", { className: "material-symbols-outlined text-sm", children: isPaid ? "check" : atrasado ? "warning" : "schedule" }) }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-bold text-slate-900 dark:text-white", children: p.descricao }), _jsx("p", { className: "text-xs text-slate-500", children: p.dataVencimento ? `Venc: ${formatDate(p.dataVencimento)}` : "Sem vencimento" })] })] }), _jsxs("div", { className: "text-right", children: [_jsx("p", { className: "text-base font-black text-slate-900 dark:text-white", children: formatCurrency(parseFloat(p.valor || "0")) }), isPaid && p.dataPagamento && _jsxs("p", { className: "text-[10px] text-slate-400", children: ["Pago: ", formatDate(p.dataPagamento)] })] })] }), !isPaid ? (_jsx(MobileButton, { variant: atrasado ? "danger" : "primary", fullWidth: true, size: "sm", icon: "qr_code_scanner", onClick: () => openModal(p), children: "Pagar com PIX" })) : p.comprovanteUrl ? (_jsx("a", { href: `/api/${p.comprovanteUrl}`, target: "_blank", rel: "noopener noreferrer", className: "mt-2 block w-full", children: _jsx(MobileButton, { variant: "ghost", fullWidth: true, size: "sm", icon: "receipt", children: "Ver Comprovante" }) })) : (_jsxs("div", { className: "text-center mt-2 px-2 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-1", children: [_jsx("span", { className: "material-symbols-outlined text-sm", children: "verified" }), " Pago"] }))] }, p.id));
                                }) }))] })] }), _jsx(BottomSheet, { isOpen: pixSheet.isOpen, onClose: pixSheet.close, title: "Pagamento via PIX", children: selectedPag && (_jsx("div", { className: "space-y-5", children: uploadStatus === "success" ? (_jsxs("div", { className: "text-center py-8", children: [_jsx("span", { className: "material-symbols-outlined text-5xl text-emerald-500 mb-2", children: "check_circle" }), _jsx("p", { className: "text-lg font-bold text-slate-900 dark:text-white", children: "Comprovante enviado!" }), _jsx("p", { className: "text-sm text-slate-500 mt-1", children: "Aguardando valida\u00E7\u00E3o da comiss\u00E3o." })] })) : uploadStatus === "error" ? (_jsxs("div", { className: "text-center py-8", children: [_jsx("span", { className: "material-symbols-outlined text-5xl text-rose-500 mb-2", children: "error" }), _jsx("p", { className: "text-lg font-bold text-slate-900 dark:text-white", children: "Erro ao enviar" }), _jsx(MobileButton, { variant: "ghost", className: "mt-4", onClick: () => setUploadStatus("idle"), children: "Tentar novamente" })] })) : (_jsxs(_Fragment, { children: [_jsxs("div", { className: "bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 text-center", children: [_jsx("img", { src: buildQrUrl(selectedPag.valor), alt: "QR Code", className: "mx-auto rounded-xl w-48 h-48 mix-blend-multiply dark:mix-blend-normal" }), _jsx("p", { className: "text-lg font-black mt-3 text-slate-900 dark:text-white", children: formatCurrency(parseFloat(selectedPag.valor)) })] }), _jsxs("div", { children: [_jsx("label", { className: "text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 block", children: "PIX Copia e Cola" }), _jsxs("div", { className: "flex bg-slate-100 dark:bg-slate-800 p-3 rounded-xl gap-2 items-center", children: [_jsx("p", { className: "text-[10px] font-mono text-slate-500 truncate flex-1", children: CHAVE_PIX }), _jsx("button", { onClick: () => navigator.clipboard.writeText(CHAVE_PIX), className: "p-2 text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg shrink-0", children: _jsx("span", { className: "material-symbols-outlined text-sm", children: "content_copy" }) })] })] }), _jsxs("div", { className: "space-y-3", children: [_jsx("label", { className: "text-xs font-bold text-slate-500 uppercase tracking-widest block", children: "Anexar Comprovante" }), _jsxs("label", { className: `flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-xl cursor-pointer ${comprovante ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20" : "border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"}`, children: [_jsxs("div", { className: "flex flex-col items-center justify-center pt-5 pb-6", children: [_jsx("span", { className: `material-symbols-outlined text-2xl mb-1 ${comprovante ? "text-emerald-500" : "text-slate-400"}`, children: comprovante ? "task" : "upload_file" }), _jsx("p", { className: "text-xs font-medium text-slate-500", children: comprovante ? comprovante.name : "Toque para escolher um arquivo" })] }), _jsx("input", { type: "file", className: "hidden", accept: "image/*,application/pdf", onChange: (e) => setComprovante(e.target.files?.[0] || null) })] }), _jsx(MobileInput, { label: "Observa\u00E7\u00E3o (opcional)", icon: "note", placeholder: "Ex: Pago via app do banco", value: descricaoPagamento, onChange: (e) => setDescricaoPagamento(e.target.value) })] }), _jsxs("div", { className: "grid grid-cols-2 gap-3 pt-2", children: [_jsx(MobileButton, { variant: "secondary", fullWidth: true, onClick: pixSheet.close, children: "Cancelar" }), _jsx(MobileButton, { variant: "primary", fullWidth: true, loading: uploadStatus === "uploading", disabled: !comprovante, onClick: handleUpload, children: "Enviar" })] })] })) })) })] }));
}

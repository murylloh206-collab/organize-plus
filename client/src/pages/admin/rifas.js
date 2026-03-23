import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
export default function AdminRifas() {
    const qc = useQueryClient();
    const { auth } = useAuth();
    const resultadoRef = useRef(null);
    const criarSheet = useBottomSheet();
    const editSheet = useBottomSheet();
    const vendaSheet = useBottomSheet();
    const editVendaSheet = useBottomSheet();
    const sorteioSheet = useBottomSheet();
    const resultSheet = useBottomSheet();
    const [sorteioExpandido, setSorteioExpandido] = useState(null);
    const [sorteioSelecionado, setSorteioSelecionado] = useState(null);
    const [sorteioEditando, setSorteioEditando] = useState(null);
    const [ticketSelecionado, setTicketSelecionado] = useState(null);
    const [vendaNumero, setVendaNumero] = useState(null);
    const [numeroSorteado, setNumeroSorteado] = useState(null);
    const [vencedorInfo, setVencedorInfo] = useState(null);
    const [sorteando, setSorteando] = useState(null);
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
    const [vendaVendedorId, setVendaVendedorId] = useState(null);
    const [vendaValor, setVendaValor] = useState("");
    const [vendaError, setVendaError] = useState("");
    // Editar venda
    const [editVendaCompradorNome, setEditVendaCompradorNome] = useState("");
    const [editVendaCompradorContato, setEditVendaCompradorContato] = useState("");
    const [editVendaVendedorId, setEditVendaVendedorId] = useState(null);
    const [editVendaValor, setEditVendaValor] = useState("");
    const [editVendaStatus, setEditVendaStatus] = useState("pendente");
    const { data: sorteios = [], isLoading, refetch: refetchSorteios } = useQuery({
        queryKey: ["sorteios"],
        queryFn: () => apiRequest("GET", "/rifas"),
    });
    const { data: tickets = [], refetch: refetchTickets } = useQuery({
        queryKey: ["tickets", sorteioExpandido],
        queryFn: () => sorteioExpandido ? apiRequest("GET", `/rifas/${sorteioExpandido}/tickets`) : Promise.resolve([]),
        enabled: !!sorteioExpandido,
    });
    const { data: alunos = [] } = useQuery({
        queryKey: ["alunos", auth?.salaId],
        queryFn: () => apiRequest("GET", `/alunos?salaId=${auth?.salaId}`),
        enabled: !!auth?.salaId,
    });
    const ticketsPorNumero = tickets.reduce((acc, t) => {
        if (t.numero)
            acc[t.numero] = t;
        return acc;
    }, {});
    const criar = useMutation({
        mutationFn: (data) => apiRequest("POST", "/rifas", data),
        onSuccess: () => { refetchSorteios(); criarSheet.close(); resetCriarForm(); },
        onError: (e) => setError(e.message),
    });
    const editar = useMutation({
        mutationFn: ({ id, ...data }) => apiRequest("PUT", `/rifas/${id}`, data),
        onSuccess: () => { refetchSorteios(); editSheet.close(); setSorteioEditando(null); },
        onError: (e) => setError(e.message),
    });
    const deletar = useMutation({
        mutationFn: async (id) => {
            const r = await fetch(`/api/rifas/${id}`, { method: "DELETE", credentials: "include" });
            if (!r.ok)
                throw new Error((await r.json().catch(() => ({}))).message || "Erro ao deletar");
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["sorteios"] });
            if (sorteioExpandido)
                setSorteioExpandido(null);
        },
    });
    const criarVenda = useMutation({
        mutationFn: (data) => apiRequest("POST", `/rifas/${sorteioExpandido}/tickets`, data),
        onSuccess: () => { refetchTickets(); vendaSheet.close(); resetVendaForm(); },
        onError: (e) => setVendaError(e.message),
    });
    const editarVenda = useMutation({
        mutationFn: ({ id, ...data }) => apiRequest("PUT", `/rifas/tickets/${id}`, data),
        onSuccess: () => { refetchTickets(); editVendaSheet.close(); setTicketSelecionado(null); },
    });
    const deletarVenda = useMutation({
        mutationFn: (id) => apiRequest("DELETE", `/rifas/tickets/${id}`),
        onSuccess: () => { refetchTickets(); editVendaSheet.close(); setTicketSelecionado(null); },
    });
    const sortear = useMutation({
        mutationFn: (id) => apiRequest("POST", `/rifas/${id}/sortear`, {}),
        onSuccess: (data) => {
            refetchSorteios();
            setSorteando(null);
            setNumeroSorteado(data.numeroSorteado);
            setVencedorInfo(data.vencedor);
            sorteioSheet.close();
            resultSheet.open();
        },
        onError: (e) => { setSorteando(null); alert(e.message); },
    });
    const resetCriarForm = () => { setNome(""); setPremio(""); setPreco(""); setTotalNumeros("200"); setDataSorteio(""); setError(""); };
    const resetVendaForm = () => { setVendaCompradorNome(""); setVendaCompradorContato(""); setVendaVendedorId(null); setVendaValor(""); setVendaError(""); };
    const getEstatisticas = (s) => {
        const ts = tickets.filter((t) => t.rifaId === s.id);
        const pagos = ts.filter((t) => t.status === "pago");
        const pendentes = ts.filter((t) => t.status === "pendente");
        const totalNum = s.totalNumeros || 200;
        return {
            totalNumeros: totalNum,
            numerosVendidos: pagos.length,
            numerosReservados: pendentes.length,
            percentual: (pagos.length / totalNum) * 100,
            receitaTotal: pagos.reduce((a, t) => a + t.valor, 0),
        };
    };
    const handleNumeroClick = (numero) => {
        const t = ticketsPorNumero[numero];
        if (t) {
            setTicketSelecionado(t);
            setEditVendaCompradorNome(t.compradorNome);
            setEditVendaCompradorContato(t.compradorContato || "");
            setEditVendaVendedorId(t.vendedorId);
            setEditVendaValor(t.valor.toString());
            setEditVendaStatus(t.status);
            editVendaSheet.open();
        }
        else {
            const s = sorteios.find((s) => s.id === sorteioExpandido);
            setVendaNumero(numero);
            setVendaValor(s?.preco?.toString() || "");
            vendaSheet.open();
        }
    };
    const handleDownloadResultado = async () => {
        if (!resultadoRef.current)
            return;
        try {
            const canvas = await html2canvas(resultadoRef.current, { scale: 2, backgroundColor: "#fff" });
            const link = document.createElement("a");
            link.download = `sorteio-${numeroSorteado}.png`;
            link.href = canvas.toDataURL("image/png");
            link.click();
        }
        catch {
            alert("Erro ao gerar imagem.");
        }
    };
    const handleCompartilhar = async () => {
        if (!vencedorInfo || !numeroSorteado)
            return;
        const texto = `🎉 Resultado do Sorteio!\n\nNúmero: ${String(numeroSorteado).padStart(3, "0")}\nGanhador: ${vencedorInfo.compradorNome}`;
        if (navigator.share) {
            try {
                await navigator.share({ title: "Resultado do Sorteio", text: texto });
            }
            catch {
                navigator.clipboard.writeText(texto);
            }
        }
        else {
            navigator.clipboard.writeText(texto);
            alert("Texto copiado!");
        }
    };
    const statusRifaColor = {
        ativa: "emerald", encerrada: "amber", sorteada: "purple",
    };
    return (_jsxs(MobileLayout, { role: "admin", children: [_jsx(MobileHeader, { title: "Rifas", subtitle: `${sorteios.length} sorteios`, gradient: true, actions: [{ icon: "add_circle", onClick: criarSheet.open, label: "Nova rifa" }] }), _jsx("div", { className: "px-4 py-4 space-y-3", children: isLoading ? (_jsx("div", { className: "space-y-3", children: [1, 2].map((i) => _jsx(Skeleton, { variant: "card" }, i)) })) : sorteios.length > 0 ? (sorteios.map((s) => {
                    const stats = getEstatisticas(s);
                    const isExpanded = sorteioExpandido === s.id;
                    return (_jsxs("div", { className: "mobile-card overflow-hidden", children: [_jsxs("div", { className: "p-4 flex items-center gap-3 cursor-pointer", onClick: () => { setSorteioExpandido(isExpanded ? null : s.id); }, children: [_jsx("div", { className: "size-11 rounded-2xl bg-indigo-100 dark:bg-indigo-950/40 flex items-center justify-center flex-shrink-0", children: _jsx("span", { className: "material-symbols-outlined text-indigo-600 dark:text-indigo-400 text-xl", children: "confirmation_number" }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [_jsx("h4", { className: "text-sm font-bold text-slate-900 dark:text-white", children: s.nome }), _jsx(MobileBadge, { variant: s.status === "ativa" ? "success" : s.status === "encerrada" ? "warning" : "danger", children: s.status === "ativa" ? "Ativa" : s.status === "encerrada" ? "Encerrada" : "Sorteada" })] }), _jsxs("p", { className: "text-xs text-slate-500 mt-0.5", children: ["\uD83C\uDF81 ", s.premio, " \u2022 ", formatCurrency(s.preco), "/n\u00FAmero"] })] }), _jsx("span", { className: "material-symbols-outlined text-slate-400 flex-shrink-0", children: isExpanded ? "expand_less" : "expand_more" })] }), _jsxs("div", { className: "px-4 pb-3", children: [_jsxs("div", { className: "flex justify-between text-xs text-slate-500 mb-1", children: [_jsxs("span", { children: [stats.numerosVendidos, " pagos"] }), _jsxs("span", { children: [stats.percentual.toFixed(0), "%"] })] }), _jsx("div", { className: "h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden", children: _jsx("div", { className: "h-full gradient-primary rounded-full transition-all duration-500", style: { width: `${Math.min(stats.percentual, 100)}%` } }) })] }), isExpanded && (_jsxs("div", { className: "border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 p-4 space-y-4", children: [_jsxs("div", { className: "grid grid-cols-2 gap-2", children: [_jsx(MobileMetricCard, { title: "Vendidos", value: String(stats.numerosVendidos), icon: "check_circle", color: "green" }), _jsx(MobileMetricCard, { title: "Reservados", value: String(stats.numerosReservados), icon: "pending", color: "amber" }), _jsx(MobileMetricCard, { title: "Total", value: String(stats.totalNumeros), icon: "numbers", color: "primary" }), _jsx(MobileMetricCard, { title: "Receita", value: formatCurrency(stats.receitaTotal), icon: "payments", color: "purple" })] }), _jsxs("div", { className: "flex gap-2", children: [_jsx(MobileButton, { variant: "secondary", size: "sm", icon: "edit", onClick: () => {
                                                    setSorteioEditando(s);
                                                    setEditNome(s.nome);
                                                    setEditPremio(s.premio);
                                                    setEditPreco(s.preco?.toString() || "");
                                                    setEditTotalNumeros(s.totalNumeros?.toString() || "200");
                                                    setEditDataSorteio(s.dataSorteio || "");
                                                    editSheet.open();
                                                }, children: "Editar" }), s.status === "ativa" && (_jsx(MobileButton, { variant: "primary", size: "sm", icon: "celebration", loading: sorteando === s.id, onClick: () => { setSorteioSelecionado(s); sorteioSheet.open(); }, children: "Sortear" })), _jsx(MobileButton, { variant: "danger", size: "sm", icon: "delete", onClick: () => { if (confirm("Excluir sorteio?"))
                                                    deletar.mutate(s.id); }, children: "Excluir" })] }), _jsxs("div", { children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("p", { className: "text-xs font-bold text-slate-500 uppercase tracking-wide", children: "Mapa de N\u00FAmeros" }), _jsxs("div", { className: "flex gap-2 text-[10px] text-slate-400", children: [_jsxs("span", { className: "flex items-center gap-1", children: [_jsx("span", { className: "size-2 rounded-full bg-emerald-500 inline-block" }), "Pago"] }), _jsxs("span", { className: "flex items-center gap-1", children: [_jsx("span", { className: "size-2 rounded-full bg-amber-400 inline-block" }), "Pendente"] })] })] }), _jsx("div", { className: "grid gap-1.5", style: { gridTemplateColumns: `repeat(${Math.min(10, s.totalNumeros)}, 1fr)` }, children: Array.from({ length: s.totalNumeros }, (_, i) => {
                                                    const n = i + 1;
                                                    const t = ticketsPorNumero[n];
                                                    const bg = t?.status === "pago" ? "bg-emerald-500 text-white" : t?.status === "pendente" ? "bg-amber-400 text-amber-900" : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400";
                                                    return (_jsx("button", { onClick: () => handleNumeroClick(n), className: `aspect-square flex items-center justify-center rounded text-[9px] font-semibold transition-all active:scale-95 ${bg}`, children: n }, i));
                                                }) })] })] }))] }, s.id));
                })) : (_jsxs(MobileCard, { className: "text-center py-12", children: [_jsx("span", { className: "material-symbols-outlined text-slate-300 dark:text-slate-600 text-5xl", children: "confirmation_number" }), _jsx("p", { className: "text-slate-500 mt-3 text-sm", children: "Nenhum sorteio criado" }), _jsx(MobileButton, { variant: "ghost", size: "sm", icon: "add_circle", className: "mt-3", onClick: criarSheet.open, children: "Criar sorteio" })] })) }), _jsx(BottomSheet, { isOpen: criarSheet.isOpen, onClose: criarSheet.close, title: "Novo Sorteio", children: _jsxs("div", { className: "space-y-4", children: [_jsx(MobileInput, { label: "Nome do Sorteio", icon: "confirmation_number", placeholder: "ex: Rifa de Natal", value: nome, onChange: (e) => setNome(e.target.value) }), _jsx(MobileInput, { label: "Pr\u00EAmio", icon: "emoji_events", placeholder: "ex: Smart TV 55\"", value: premio, onChange: (e) => setPremio(e.target.value) }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsx(MobileInput, { label: "Pre\u00E7o/n\u00FAmero (R$)", icon: "attach_money", type: "number", placeholder: "0.00", value: preco, onChange: (e) => setPreco(e.target.value) }), _jsx(MobileInput, { label: "Total de n\u00FAmeros", icon: "numbers", type: "number", placeholder: "200", value: totalNumeros, onChange: (e) => setTotalNumeros(e.target.value) })] }), _jsx(MobileInput, { label: "Data do Sorteio", icon: "event", type: "date", value: dataSorteio, onChange: (e) => setDataSorteio(e.target.value) }), error && _jsx("p", { className: "text-sm text-red-500", children: error }), _jsxs("div", { className: "grid grid-cols-2 gap-3 pt-2", children: [_jsx(MobileButton, { variant: "secondary", fullWidth: true, onClick: criarSheet.close, children: "Cancelar" }), _jsx(MobileButton, { variant: "primary", fullWidth: true, loading: criar.isPending, onClick: () => criar.mutate({ nome, premio, preco: parseFloat(preco), totalNumeros: parseInt(totalNumeros), dataSorteio: dataSorteio || null, salaId: auth?.salaId, status: "ativa" }), children: "Criar" })] })] }) }), _jsx(BottomSheet, { isOpen: editSheet.isOpen, onClose: editSheet.close, title: "Editar Sorteio", children: _jsxs("div", { className: "space-y-4", children: [_jsx(MobileInput, { label: "Nome", icon: "confirmation_number", value: editNome, onChange: (e) => setEditNome(e.target.value) }), _jsx(MobileInput, { label: "Pr\u00EAmio", icon: "emoji_events", value: editPremio, onChange: (e) => setEditPremio(e.target.value) }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsx(MobileInput, { label: "Pre\u00E7o (R$)", icon: "attach_money", type: "number", value: editPreco, onChange: (e) => setEditPreco(e.target.value) }), _jsx(MobileInput, { label: "N\u00FAmeros", icon: "numbers", type: "number", value: editTotalNumeros, onChange: (e) => setEditTotalNumeros(e.target.value) })] }), _jsx(MobileInput, { label: "Data", icon: "event", type: "date", value: editDataSorteio, onChange: (e) => setEditDataSorteio(e.target.value) }), _jsxs("div", { className: "grid grid-cols-2 gap-3 pt-2", children: [_jsx(MobileButton, { variant: "secondary", fullWidth: true, onClick: editSheet.close, children: "Cancelar" }), _jsx(MobileButton, { variant: "primary", fullWidth: true, loading: editar.isPending, onClick: () => editar.mutate({ id: sorteioEditando?.id, nome: editNome, premio: editPremio, preco: parseFloat(editPreco), totalNumeros: parseInt(editTotalNumeros), dataSorteio: editDataSorteio || null }), children: "Salvar" })] })] }) }), _jsx(BottomSheet, { isOpen: vendaSheet.isOpen, onClose: () => { vendaSheet.close(); resetVendaForm(); }, title: `Nº ${String(vendaNumero).padStart(3, "0")}`, children: _jsxs("div", { className: "space-y-4", children: [_jsx(MobileInput, { label: "Nome do Comprador", icon: "person", value: vendaCompradorNome, onChange: (e) => setVendaCompradorNome(e.target.value), required: true }), _jsx(MobileInput, { label: "Contato", icon: "phone", type: "tel", value: vendaCompradorContato, onChange: (e) => setVendaCompradorContato(e.target.value) }), _jsxs("div", { className: "space-y-1.5", children: [_jsx("label", { className: "text-sm font-semibold text-slate-700 dark:text-slate-300", children: "Vendedor (Aluno)" }), _jsxs("select", { value: vendaVendedorId ?? "", onChange: (e) => setVendaVendedorId(parseInt(e.target.value)), className: "mobile-input appearance-none", children: [_jsx("option", { value: "", children: "Selecionar vendedor..." }), alunos.map((a) => _jsx("option", { value: a.id, children: a.nome }, a.id))] })] }), _jsx(MobileInput, { label: "Valor (R$)", icon: "attach_money", type: "number", value: vendaValor, onChange: (e) => setVendaValor(e.target.value) }), vendaError && _jsx("p", { className: "text-sm text-red-500", children: vendaError }), _jsxs("div", { className: "grid grid-cols-2 gap-3 pt-2", children: [_jsx(MobileButton, { variant: "secondary", fullWidth: true, onClick: vendaSheet.close, children: "Cancelar" }), _jsx(MobileButton, { variant: "primary", fullWidth: true, loading: criarVenda.isPending, onClick: () => { if (!vendaCompradorNome || !vendaVendedorId || !vendaValor) {
                                        setVendaError("Preencha todos os campos");
                                        return;
                                    } criarVenda.mutate({ numero: vendaNumero, compradorNome: vendaCompradorNome, compradorContato: vendaCompradorContato, vendedorId: vendaVendedorId, valor: parseFloat(vendaValor), status: "pendente" }); }, children: "Registrar" })] })] }) }), ticketSelecionado && (_jsx(BottomSheet, { isOpen: editVendaSheet.isOpen, onClose: () => { editVendaSheet.close(); setTicketSelecionado(null); }, title: `Venda Nº ${String(ticketSelecionado.numero).padStart(3, "0")}`, children: _jsxs("div", { className: "space-y-4", children: [_jsx(MobileInput, { label: "Comprador", icon: "person", value: editVendaCompradorNome, onChange: (e) => setEditVendaCompradorNome(e.target.value) }), _jsx(MobileInput, { label: "Contato", icon: "phone", value: editVendaCompradorContato, onChange: (e) => setEditVendaCompradorContato(e.target.value) }), _jsxs("div", { className: "space-y-1.5", children: [_jsx("label", { className: "text-sm font-semibold text-slate-700 dark:text-slate-300", children: "Vendedor" }), _jsx("select", { value: editVendaVendedorId ?? "", onChange: (e) => setEditVendaVendedorId(parseInt(e.target.value)), className: "mobile-input appearance-none", children: alunos.map((a) => _jsx("option", { value: a.id, children: a.nome }, a.id)) })] }), _jsx(MobileInput, { label: "Valor (R$)", icon: "attach_money", type: "number", value: editVendaValor, onChange: (e) => setEditVendaValor(e.target.value) }), _jsxs("div", { className: "space-y-1.5", children: [_jsx("label", { className: "text-sm font-semibold text-slate-700 dark:text-slate-300", children: "Status" }), _jsxs("select", { value: editVendaStatus, onChange: (e) => setEditVendaStatus(e.target.value), className: "mobile-input appearance-none", children: [_jsx("option", { value: "pendente", children: "Pendente" }), _jsx("option", { value: "pago", children: "Pago" }), _jsx("option", { value: "cancelado", children: "Cancelado" })] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-2 pt-2", children: [_jsx(MobileButton, { variant: "secondary", fullWidth: true, onClick: () => { editVendaSheet.close(); setTicketSelecionado(null); }, children: "Cancelar" }), _jsx(MobileButton, { variant: "primary", fullWidth: true, loading: editarVenda.isPending, onClick: () => editarVenda.mutate({ id: ticketSelecionado.id, compradorNome: editVendaCompradorNome, compradorContato: editVendaCompradorContato, vendedorId: editVendaVendedorId, valor: parseFloat(editVendaValor), status: editVendaStatus }), children: "Salvar" })] }), _jsx(MobileButton, { variant: "danger", fullWidth: true, icon: "delete", loading: deletarVenda.isPending, onClick: () => { if (confirm("Excluir venda?"))
                                deletarVenda.mutate(ticketSelecionado.id); }, children: "Excluir Venda" })] }) })), sorteioSelecionado && (_jsx(BottomSheet, { isOpen: sorteioSheet.isOpen, onClose: sorteioSheet.close, title: "Realizar Sorteio", children: _jsxs("div", { className: "text-center space-y-4 py-2", children: [_jsx("div", { className: "size-20 rounded-full gradient-primary mx-auto flex items-center justify-center", children: _jsx("span", { className: "material-symbols-outlined text-white text-4xl", children: "celebration" }) }), _jsxs("div", { children: [_jsx("h3", { className: "text-lg font-bold text-slate-900 dark:text-white", children: sorteioSelecionado.nome }), _jsxs("p", { className: "text-sm text-slate-500 mt-1", children: ["Pr\u00EAmio: ", sorteioSelecionado.premio] })] }), _jsxs("p", { className: "text-sm text-slate-600 dark:text-slate-400", children: ["Ao confirmar, um n\u00FAmero ser\u00E1 sorteado aleatoriamente entre os ", _jsx("strong", { children: "n\u00FAmeros vendidos" }), "."] }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsx(MobileButton, { variant: "secondary", fullWidth: true, onClick: sorteioSheet.close, children: "Cancelar" }), _jsx(MobileButton, { variant: "primary", fullWidth: true, icon: "celebration", loading: sorteando === sorteioSelecionado.id, onClick: () => { setSorteando(sorteioSelecionado.id); sortear.mutate(sorteioSelecionado.id); }, children: "Sortear!" })] })] }) })), numeroSorteado !== null && (_jsxs(BottomSheet, { isOpen: resultSheet.isOpen, onClose: resultSheet.close, title: "\uD83C\uDF89 Resultado do Sorteio", children: [_jsxs("div", { ref: resultadoRef, className: "text-center space-y-4 py-2", children: [_jsx("div", { className: "text-6xl font-black text-indigo-600 dark:text-indigo-400", children: String(numeroSorteado).padStart(3, "0") }), _jsx("p", { className: "text-xs text-slate-400 uppercase tracking-widest font-bold", children: "N\u00FAmero Sorteado" }), vencedorInfo ? (_jsxs("div", { className: "bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-xl p-4", children: [_jsxs("p", { className: "text-lg font-black text-emerald-800 dark:text-emerald-300", children: ["\uD83C\uDFC6 ", vencedorInfo.compradorNome] }), vencedorInfo.compradorContato && (_jsx("p", { className: "text-sm text-emerald-600 dark:text-emerald-400 mt-1", children: vencedorInfo.compradorContato }))] })) : (_jsx("p", { className: "text-sm text-slate-500", children: "N\u00FAmero n\u00E3o vendido. Realize o resorteio." }))] }), _jsxs("div", { className: "grid grid-cols-2 gap-2 mt-4", children: [_jsx(MobileButton, { variant: "secondary", icon: "download", fullWidth: true, onClick: handleDownloadResultado, children: "Baixar" }), _jsx(MobileButton, { variant: "primary", icon: "share", fullWidth: true, onClick: handleCompartilhar, children: "Compartilhar" })] })] }))] }));
}

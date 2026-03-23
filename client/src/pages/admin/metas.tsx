import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import MobileLayout from "../../components/layout/MobileLayout";
import MobileHeader from "../../components/layout/MobileHeader";
import MobileCard from "../../components/ui/MobileCard";
import MobileButton from "../../components/ui/MobileButton";
import MobileInput from "../../components/ui/MobileInput";
import MobileAvatar from "../../components/ui/MobileAvatar";
import BottomSheet from "../../components/ui/BottomSheet";
import ProgressCircle from "../../components/ui/ProgressCircle";
import Skeleton from "../../components/ui/Skeleton";
import { useBottomSheet } from "../../hooks/useBottomSheet";
import { apiRequest } from "../../lib/queryClient";
import { useAuth } from "../../hooks/useAuth";
import { formatCurrency } from "../../components/shared/CurrencyFormat";
import { formatDate } from "../../components/shared/DateFormat";

interface Meta {
  id: number;
  titulo: string;
  descricao: string;
  valorMeta: string;
  valorAtual: string;
  dataLimite?: string;
  salaId: number;
}

interface Contribuicao {
  id: number;
  metaId: number;
  alunoId: number;
  alunoNome: string;
  valor: number;
  descricao?: string;
  data: string;
}

interface Aluno { id: number; nome: string; }

export default function AdminMetas() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { auth } = useAuth();
  const { id } = useParams<{ id: string }>();

  const criarSheet       = useBottomSheet();
  const contribuirSheet  = useBottomSheet();
  const deletaMetaSheet  = useBottomSheet();

  const [metaParaExcluir, setMetaParaExcluir] = useState<number | null>(null);
  const [error, setError] = useState("");

  // Criar meta
  const [titulo,      setTitulo]      = useState("");
  const [descricao,   setDescricao]   = useState("");
  const [valorMeta,   setValorMeta]   = useState("");
  const [dataLimite,  setDataLimite]  = useState("");

  // Contribuição
  const [progressoValor,       setProgressoValor]       = useState("");
  const [progressoAlunoId,     setProgressoAlunoId]     = useState<number | null>(null);
  const [progressoDescricao,   setProgressoDescricao]   = useState("");
  const [metaSelecionadaId,    setMetaSelecionadaId]    = useState<number | null>(null);

  const { data: metas = [], isLoading } = useQuery<Meta[]>({
    queryKey: ["metas"],
    queryFn: () => apiRequest("GET", "/metas"),
  });

  const { data: metaDetalhe } = useQuery<Meta>({
    queryKey: ["meta", id],
    queryFn: () => apiRequest("GET", `/metas/${id}`),
    enabled: !!id,
  });

  const { data: contribuicoes = [] } = useQuery<Contribuicao[]>({
    queryKey: ["contribuicoes", id],
    queryFn: () => id ? apiRequest("GET", `/metas/${id}/contribuicoes`) : Promise.resolve([]),
    enabled: !!id,
  });

  const { data: alunos = [] } = useQuery<Aluno[]>({
    queryKey: ["alunos"],
    queryFn: () => apiRequest("GET", "/alunos"),
  });

  const criarMeta = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/metas", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["metas"] });
      criarSheet.close();
      setTitulo(""); setDescricao(""); setValorMeta(""); setDataLimite(""); setError("");
    },
    onError: (e: any) => setError(e.message),
  });

  const deletarMeta = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/metas/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["metas"] });
      deletaMetaSheet.close();
      setMetaParaExcluir(null);
      if (id) navigate("/admin/metas");
    },
  });

  const adicionarContribuicao = useMutation({
    mutationFn: (data: any) => apiRequest("POST", `/metas/${metaSelecionadaId || id}/contribuicoes`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["meta", id || String(metaSelecionadaId)] });
      qc.invalidateQueries({ queryKey: ["contribuicoes", id || String(metaSelecionadaId)] });
      qc.invalidateQueries({ queryKey: ["metas"] });
      contribuirSheet.close();
      setProgressoValor(""); setProgressoAlunoId(null); setProgressoDescricao("");
    },
    onError: (e: any) => setError(e.message),
  });

  const deletarContribuicao = useMutation({
    mutationFn: (cId: number) => apiRequest("DELETE", `/metas/contribuicoes/${cId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["meta", id] });
      qc.invalidateQueries({ queryKey: ["contribuicoes", id] });
      qc.invalidateQueries({ queryKey: ["metas"] });
    },
  });

  const calcDias = (data?: string) => {
    if (!data) return null;
    const diff = new Date(data).getTime() - new Date().setHours(0,0,0,0);
    return Math.ceil(diff / 86400000);
  };

  const diasBadge = (dias: number | null) => {
    if (dias === null) return null;
    const cls = dias < 0 ? "badge-error" : dias <= 7 ? "badge-warning" : "badge-success";
    const txt = dias < 0 ? `${Math.abs(dias)}d atraso` : dias === 0 ? "Hoje" : `${dias}d`;
    return <span className={cls}>{txt}</span>;
  };

  // Página de detalhe
  if (id && metaDetalhe) {
    const va = parseFloat(metaDetalhe.valorAtual) || 0;
    const vm = parseFloat(metaDetalhe.valorMeta) || 0;
    const pct = vm > 0 ? (va / vm) * 100 : 0;
    const dias = calcDias(metaDetalhe.dataLimite);

    return (
      <MobileLayout role="admin">
        <MobileHeader
          title={metaDetalhe.titulo}
          subtitle={`${pct.toFixed(0)}% da meta`}
          showBack
          gradient
          actions={[
            { icon: "add", onClick: () => { setMetaSelecionadaId(metaDetalhe.id); contribuirSheet.open(); }, label: "Contribuir" },
            { icon: "delete", onClick: () => { setMetaParaExcluir(metaDetalhe.id); deletaMetaSheet.open(); }, label: "Excluir" },
          ]}
        />

        <div className="px-4 py-4 space-y-4">
          {/* Progress Card */}
          <MobileCard variant="gradient" className="relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/70 font-medium">Arrecadado</p>
                <p className="text-3xl font-black text-white mt-1">{formatCurrency(va)}</p>
                <p className="text-sm text-white/60 mt-1">de {formatCurrency(vm)}</p>
                {dias !== null && (
                  <p className="text-xs text-white/60 mt-2 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">event</span>
                    {metaDetalhe.dataLimite ? formatDate(metaDetalhe.dataLimite) : "—"}
                    {" "}{dias < 0 ? `(${Math.abs(dias)}d atraso)` : dias === 0 ? "(Hoje)" : `(${dias}d)`}
                  </p>
                )}
              </div>
              <ProgressCircle value={pct} size={96} strokeWidth={8} color="white" />
            </div>
            <div className="mt-4 w-full bg-white/20 rounded-full h-2">
              <div className="h-2 bg-white rounded-full transition-all duration-700" style={{ width: `${Math.min(pct, 100)}%` }} />
            </div>
          </MobileCard>

          {/* Descrição */}
          {metaDetalhe.descricao && (
            <MobileCard>
              <p className="text-sm text-slate-600 dark:text-slate-400">{metaDetalhe.descricao}</p>
            </MobileCard>
          )}

          {/* Botão contribuir */}
          <MobileButton variant="primary" fullWidth icon="add" size="lg"
            onClick={() => { setMetaSelecionadaId(metaDetalhe.id); contribuirSheet.open(); }}>
            Adicionar Contribuição
          </MobileButton>

          {/* Contribuições */}
          <div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
              Contribuições ({contribuicoes.length})
            </p>
            {contribuicoes.length > 0 ? (
              <div className="space-y-2">
                {contribuicoes.map((c: Contribuicao) => (
                  <div key={c.id} className="mobile-list-item">
                    <MobileAvatar name={c.alunoNome} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{c.alunoNome}</p>
                      {c.descricao && <p className="text-xs text-slate-500 truncate">{c.descricao}</p>}
                      <p className="text-xs text-slate-400">{formatDate(c.data)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(c.valor)}</span>
                      <button onClick={() => { if (confirm("Remover contribuição?")) deletarContribuicao.mutate(c.id); }}
                        className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg transition-colors">
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <MobileCard className="text-center py-8">
                <span className="material-symbols-outlined text-slate-300 dark:text-slate-600 text-4xl">savings</span>
                <p className="text-sm text-slate-400 mt-2">Nenhuma contribuição ainda</p>
              </MobileCard>
            )}
          </div>
        </div>

        {/* BottomSheet: Contribuir */}
        <BottomSheet isOpen={contribuirSheet.isOpen} onClose={contribuirSheet.close} title="Adicionar Contribuição">
          <div className="space-y-4">
            <MobileInput label="Valor (R$)" icon="attach_money" type="number" placeholder="0.00" value={progressoValor} onChange={(e) => setProgressoValor(e.target.value)} />
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Aluno contribuinte</label>
              <select value={progressoAlunoId ?? ""} onChange={(e) => setProgressoAlunoId(parseInt(e.target.value))} className="mobile-input appearance-none">
                <option value="">Selecionar aluno...</option>
                {alunos.map((a: Aluno) => <option key={a.id} value={a.id}>{a.nome}</option>)}
              </select>
            </div>
            <MobileInput label="Descrição (opcional)" icon="note" placeholder="ex: Bingo da turma" value={progressoDescricao} onChange={(e) => setProgressoDescricao(e.target.value)} />
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <MobileButton variant="secondary" fullWidth onClick={contribuirSheet.close}>Cancelar</MobileButton>
              <MobileButton variant="primary" fullWidth loading={adicionarContribuicao.isPending}
                onClick={() => adicionarContribuicao.mutate({ valor: parseFloat(progressoValor), alunoId: progressoAlunoId, descricao: progressoDescricao, data: new Date().toISOString() })}>
                Salvar
              </MobileButton>
            </div>
          </div>
        </BottomSheet>

        {/* BottomSheet: Confirmar exclusão da meta */}
        <BottomSheet isOpen={deletaMetaSheet.isOpen} onClose={deletaMetaSheet.close} title="Excluir Meta">
          <div className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Todas as contribuições serão removidas. Esta ação não pode ser desfeita.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <MobileButton variant="secondary" fullWidth onClick={deletaMetaSheet.close}>Cancelar</MobileButton>
              <MobileButton variant="danger" fullWidth loading={deletarMeta.isPending}
                onClick={() => metaParaExcluir && deletarMeta.mutate(metaParaExcluir)}>
                Excluir
              </MobileButton>
            </div>
          </div>
        </BottomSheet>
      </MobileLayout>
    );
  }

  // Lista de metas
  return (
    <MobileLayout role="admin">
      <MobileHeader
        title="Metas"
        subtitle={`${metas.length} metas`}
        gradient
        actions={[{ icon: "add_circle", onClick: criarSheet.open, label: "Nova Meta" }]}
      />

      <div className="px-4 py-4 space-y-3">
        {isLoading ? (
          <div className="space-y-3">{[1,2].map((i) => <Skeleton key={i} variant="card" />)}</div>
        ) : metas.length > 0 ? (
          metas.map((m: Meta) => {
            const va = parseFloat(m.valorAtual) || 0;
            const vm = parseFloat(m.valorMeta) || 0;
            const pct = vm > 0 ? (va / vm) * 100 : 0;
            const dias = calcDias(m.dataLimite);
            const done = pct >= 100;
            return (
              <div key={m.id} className="mobile-card p-4 cursor-pointer" onClick={() => navigate(`/admin/metas/${m.id}`)}>
                <div className="flex items-start gap-3">
                  <div className={`size-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${done ? "bg-emerald-100 dark:bg-emerald-950/40" : "bg-amber-100 dark:bg-amber-950/40"}`}>
                    <span className={`material-symbols-outlined text-xl ${done ? "text-emerald-600" : "text-amber-600"}`}>{done ? "check_circle" : "stars"}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{m.titulo}</p>
                      {done && <span className="badge-success text-xs">Concluída</span>}
                      {diasBadge(dias)}
                    </div>
                    {m.descricao && <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{m.descricao}</p>}
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-slate-500 mb-1">
                        <span>{formatCurrency(va)}</span>
                        <span className="font-semibold text-indigo-600 dark:text-indigo-400">{pct.toFixed(0)}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-500 ${done ? "bg-emerald-500" : "gradient-primary"}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                      </div>
                      <p className="text-xs text-slate-400 mt-1 text-right">Meta: {formatCurrency(vm)}</p>
                    </div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); setMetaParaExcluir(m.id); deletaMetaSheet.open(); }}
                    className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg transition-colors flex-shrink-0">
                    <span className="material-symbols-outlined text-lg">delete</span>
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <MobileCard className="text-center py-12">
            <span className="material-symbols-outlined text-slate-300 dark:text-slate-600 text-5xl">flag</span>
            <p className="text-slate-500 mt-3 text-sm">Nenhuma meta criada</p>
            <MobileButton variant="ghost" size="sm" icon="add_circle" className="mt-3" onClick={criarSheet.open}>
              Criar meta
            </MobileButton>
          </MobileCard>
        )}
      </div>

      {/* BottomSheet: Nova Meta */}
      <BottomSheet isOpen={criarSheet.isOpen} onClose={criarSheet.close} title="Nova Meta">
        <div className="space-y-4">
          <MobileInput label="Título" icon="flag" placeholder="ex: Festa de Formatura" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Descrição</label>
            <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={3}
              placeholder="Descreva o objetivo..." className="mobile-input resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <MobileInput label="Valor (R$)" icon="attach_money" type="number" placeholder="0.00" value={valorMeta} onChange={(e) => setValorMeta(e.target.value)} />
            <MobileInput label="Data Limite" icon="event" type="date" value={dataLimite} onChange={(e) => setDataLimite(e.target.value)} />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <MobileButton variant="secondary" fullWidth onClick={criarSheet.close}>Cancelar</MobileButton>
            <MobileButton variant="primary" fullWidth loading={criarMeta.isPending}
              onClick={() => {
                if (dataLimite) {
                  apiRequest("POST", "/eventos", { titulo: `Fim da meta: ${titulo}`, descricao: `Data limite para a meta ${titulo}`, data: dataLimite, tipo: "meta", local: null, status: "planejado" }).catch(() => {});
                }
                criarMeta.mutate({ titulo, descricao, valorMeta, valorAtual: "0", dataLimite: dataLimite || null, salaId: auth?.salaId });
              }}>
              Criar Meta
            </MobileButton>
          </div>
        </div>
      </BottomSheet>

      {/* BottomSheet: Excluir Meta */}
      <BottomSheet isOpen={deletaMetaSheet.isOpen} onClose={() => { deletaMetaSheet.close(); setMetaParaExcluir(null); }} title="Excluir Meta">
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">Todas as contribuições serão removidas permanentemente.</p>
          <div className="grid grid-cols-2 gap-3">
            <MobileButton variant="secondary" fullWidth onClick={() => { deletaMetaSheet.close(); setMetaParaExcluir(null); }}>Cancelar</MobileButton>
            <MobileButton variant="danger" fullWidth loading={deletarMeta.isPending}
              onClick={() => metaParaExcluir && deletarMeta.mutate(metaParaExcluir)}>
              Excluir
            </MobileButton>
          </div>
        </div>
      </BottomSheet>
    </MobileLayout>
  );
}
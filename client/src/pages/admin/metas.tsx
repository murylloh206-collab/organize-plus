import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "../../components/layout/Sidebar";
import Header from "../../components/layout/Header";
import { apiRequest } from "../../lib/queryClient";
import { useAuth } from "../../hooks/useAuth";

interface Meta {
  id: number;
  titulo: string;
  descricao: string;
  valorMeta: string;
  valorAtual: string;
  dataLimite?: string;
  salaId: number;
  createdAt: string;
  updatedAt: string;
}

interface Contribuicao {
  id: number;
  metaId: number;
  alunoId: number;
  alunoNome: string;
  alunoAvatar?: string;
  valor: number;
  descricao?: string;
  data: string;
  createdAt: string;
}

interface Aluno {
  id: number;
  nome: string;
  email: string;
  avatarUrl?: string;
}

interface Historico {
  id: number;
  tipo: "create" | "edit" | "update";
  descricao: string;
  data: string;
  usuarioNome: string;
}

interface Evento {
  id: number;
  titulo: string;
  descricao: string;
  data: string;
  tipo: string;
  local?: string;
}

export default function AdminMetas() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { auth } = useAuth();
  const { id } = useParams<{ id: string }>();
  
  const [showForm, setShowForm] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeleteMetaModal, setShowDeleteMetaModal] = useState(false);
  const [metaParaExcluir, setMetaParaExcluir] = useState<number | null>(null);
  const [showEditContribModal, setShowEditContribModal] = useState(false);
  const [contribuicaoSelecionada, setContribuicaoSelecionada] = useState<Contribuicao | null>(null);
  const [editMode, setEditMode] = useState(false);
  
  // Estados do formulário
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [valorMeta, setValorMeta] = useState("");
  const [dataLimite, setDataLimite] = useState("");
  const [progressoValor, setProgressoValor] = useState("");
  const [progressoAlunoId, setProgressoAlunoId] = useState<number | null>(null);
  const [progressoDescricao, setProgressoDescricao] = useState("");
  const [error, setError] = useState("");

  // Estados para edição de contribuição
  const [editContribValor, setEditContribValor] = useState("");
  const [editContribDescricao, setEditContribDescricao] = useState("");
  const [editContribAlunoId, setEditContribAlunoId] = useState<number | null>(null);

  // Buscar todas as metas
  const { data: metas = [], isLoading: metasLoading } = useQuery<Meta[]>({
    queryKey: ["metas"],
    queryFn: () => apiRequest("GET", "/metas"),
  });

  // Buscar meta específica se estiver na página de detalhes
  const { data: metaDetalhe, isLoading: metaLoading } = useQuery<Meta>({
    queryKey: ["meta", id],
    queryFn: () => apiRequest("GET", `/metas/${id}`),
    enabled: !!id,
  });

  // Buscar contribuições da meta
  const { data: contribuicoes = [], refetch: refetchContribuicoes } = useQuery<Contribuicao[]>({
    queryKey: ["contribuicoes", id],
    queryFn: () => id ? apiRequest("GET", `/metas/${id}/contribuicoes`) : Promise.resolve([]),
    enabled: !!id,
  });

  // Buscar alunos para o select
  const { data: alunos = [] } = useQuery<Aluno[]>({
    queryKey: ["alunos"],
    queryFn: () => apiRequest("GET", "/alunos"),
  });

  // Buscar histórico da meta
  const { data: historico = [] } = useQuery<Historico[]>({
    queryKey: ["historico", id],
    queryFn: () => id ? apiRequest("GET", `/metas/${id}/historico`) : Promise.resolve([]),
    enabled: !!id,
  });

  // Buscar próximos eventos (incluindo metas)
  const { data: proximosEventos = [] } = useQuery<Evento[]>({
    queryKey: ["proximos-eventos"],
    queryFn: () => apiRequest("GET", "/eventos/proximos"),
  });

  const criarMeta = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/metas", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["metas"] });
      setShowForm(false);
      resetForm();
      navigate("/admin/metas");
    },
    onError: (e: any) => setError(e.message),
  });

  const atualizarMeta = useMutation({
    mutationFn: ({ id, ...data }: any) => apiRequest("PATCH", `/metas/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["metas"] });
      qc.invalidateQueries({ queryKey: ["meta", id] });
      qc.invalidateQueries({ queryKey: ["historico", id] });
      setEditMode(false);
    },
    onError: (e: any) => setError(e.message),
  });

  const deletarMeta = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/metas/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["metas"] });
      qc.invalidateQueries({ queryKey: ["proximos-eventos"] });
      setShowDeleteMetaModal(false);
      setMetaParaExcluir(null);
      navigate("/admin/metas");
    },
    onError: (e: any) => setError(e.message),
  });

  const adicionarContribuicao = useMutation({
    mutationFn: (data: any) => apiRequest("POST", `/metas/${id}/contribuicoes`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["meta", id] });
      qc.invalidateQueries({ queryKey: ["contribuicoes", id] });
      qc.invalidateQueries({ queryKey: ["historico", id] });
      qc.invalidateQueries({ queryKey: ["metas"] });
      setShowProgressModal(false);
      resetProgressoForm();
    },
    onError: (e: any) => setError(e.message),
  });

  const editarContribuicao = useMutation({
    mutationFn: ({ contribuicaoId, ...data }: any) => 
      apiRequest("PATCH", `/metas/contribuicoes/${contribuicaoId}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["meta", id] });
      qc.invalidateQueries({ queryKey: ["contribuicoes", id] });
      qc.invalidateQueries({ queryKey: ["historico", id] });
      qc.invalidateQueries({ queryKey: ["metas"] });
      setShowEditContribModal(false);
      setContribuicaoSelecionada(null);
    },
    onError: (e: any) => setError(e.message),
  });

  const deletarContribuicao = useMutation({
    mutationFn: (contribuicaoId: number) => 
      apiRequest("DELETE", `/metas/contribuicoes/${contribuicaoId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["meta", id] });
      qc.invalidateQueries({ queryKey: ["contribuicoes", id] });
      qc.invalidateQueries({ queryKey: ["historico", id] });
      qc.invalidateQueries({ queryKey: ["metas"] });
      setShowDeleteModal(false);
      setContribuicaoSelecionada(null);
    },
    onError: (e: any) => setError(e.message),
  });

  const resetForm = () => {
    setTitulo("");
    setDescricao("");
    setValorMeta("");
    setDataLimite("");
    setError("");
  };

  const resetProgressoForm = () => {
    setProgressoValor("");
    setProgressoAlunoId(null);
    setProgressoDescricao("");
    setError("");
  };

  const handleContribuicaoClick = (contrib: Contribuicao) => {
    setContribuicaoSelecionada(contrib);
    setEditContribValor(contrib.valor.toString());
    setEditContribDescricao(contrib.descricao || "");
    setEditContribAlunoId(contrib.alunoId);
    setShowEditContribModal(true);
  };

  // Calcular dias restantes
  const calcularDiasRestantes = (dataLimite?: string) => {
    if (!dataLimite) return null;
    
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    const dataFim = new Date(dataLimite);
    dataFim.setHours(0, 0, 0, 0);
    
    const diffTime = dataFim.getTime() - hoje.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  // Combinar metas com vencimento próximo e eventos
  const compromissosProximos = [
    // Metas com data limite
    ...metas
      .filter(meta => meta.dataLimite)
      .map(meta => ({
        id: `meta-${meta.id}`,
        titulo: `Fim da meta: ${meta.titulo}`,
        data: meta.dataLimite!,
        tipo: 'meta',
        diasRestantes: calcularDiasRestantes(meta.dataLimite)
      })),
    // Eventos existentes
    ...proximosEventos.map((evento: Evento) => ({
      id: `evento-${evento.id}`,
      titulo: evento.titulo,
      data: evento.data,
      tipo: evento.tipo,
      diasRestantes: calcularDiasRestantes(evento.data)
    }))
  ]
    .filter(item => item.diasRestantes !== null)
    .sort((a, b) => (a.diasRestantes || 0) - (b.diasRestantes || 0))
    .slice(0, 5);

  // Se estiver na página de lista de metas
  if (!id) {
    return (
      <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark">
        <Sidebar role="admin" />
        <main className="flex-1 flex flex-col overflow-y-auto ml-64">
          <Header title="Metas" />
          <div className="p-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Metas de Arrecadação</h3>
                <p className="text-sm text-slate-500 mt-1">Acompanhe o progresso das metas da sua sala</p>
              </div>
              <button
                onClick={() => setShowForm(true)}
                className="bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 shadow-sm"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                Nova Meta
              </button>
            </div>

            {/* Modal de Nova Meta */}
            {showForm && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white dark:bg-slate-900 rounded-xl p-6 max-w-md w-full shadow-xl">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-xl font-bold text-slate-900 dark:text-white">Nova Meta</h4>
                    <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
                      <span className="material-symbols-outlined">close</span>
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <input
                      className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-primary/20 focus:border-transparent"
                      placeholder="Título da meta"
                      value={titulo}
                      onChange={e => setTitulo(e.target.value)}
                    />
                    <textarea
                      className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-primary/20 focus:border-transparent"
                      placeholder="Descrição da meta"
                      value={descricao}
                      onChange={e => setDescricao(e.target.value)}
                      rows={3}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-primary/20 focus:border-transparent"
                        type="number"
                        placeholder="Valor da meta (R$)"
                        value={valorMeta}
                        onChange={e => setValorMeta(e.target.value)}
                      />
                      <input
                        className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-primary/20 focus:border-transparent"
                        type="date"
                        placeholder="Data limite"
                        value={dataLimite}
                        onChange={e => setDataLimite(e.target.value)}
                      />
                    </div>
                    
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    
                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={() => {
                          // Criar evento no calendário
                          if (dataLimite) {
                            apiRequest("POST", "/eventos", {
                              titulo: `Fim da meta: ${titulo}`,
                              descricao: `Data limite para atingir a meta de ${titulo}`,
                              data: dataLimite,
                              tipo: "meta",
                              local: null,
                              status: "planejado"
                            }).catch(console.error);
                          }
                          
                          criarMeta.mutate({
                            titulo,
                            descricao,
                            valorMeta: valorMeta,
                            valorAtual: "0",
                            dataLimite: dataLimite || null,
                            salaId: auth?.salaId
                          });
                        }}
                        disabled={criarMeta.isPending}
                        className="flex-1 bg-primary hover:bg-primary/90 text-white py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
                      >
                        {criarMeta.isPending ? "Criando..." : "Criar Meta"}
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

            <div className="flex gap-8">
              {/* Lista de Metas */}
              <div className="flex-1">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {metasLoading ? (
                    <div className="col-span-3 text-center py-12">Carregando...</div>
                  ) : metas.length > 0 ? (
                    metas.map((meta: Meta) => {
                      const valorMetaNum = parseFloat(meta.valorMeta) || 0;
                      const valorAtualNum = parseFloat(meta.valorAtual) || 0;
                      const percentual = valorMetaNum > 0 ? (valorAtualNum / valorMetaNum) * 100 : 0;
                      const diasRestantes = calcularDiasRestantes(meta.dataLimite);
                      
                      return (
                        <div
                          key={meta.id}
                          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4 hover:shadow-md transition-all relative group"
                        >
                          <div className="flex items-start justify-between">
                            <div 
                              onClick={() => navigate(`/admin/metas/${meta.id}`)}
                              className="flex-1 cursor-pointer"
                            >
                              <div className="size-12 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center mb-3">
                                <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-2xl">stars</span>
                              </div>
                              {percentual >= 100 && (
                                <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">Concluída</span>
                              )}
                              <h4 className="font-bold text-lg text-slate-900 dark:text-white mt-2">{meta.titulo}</h4>
                              <p className="text-sm text-slate-500 mt-1 line-clamp-2">{meta.descricao}</p>
                              
                              {meta.dataLimite && (
                                <div className="mt-3 flex items-center gap-2">
                                  <span className="material-symbols-outlined text-sm text-slate-400">event</span>
                                  <span className="text-xs text-slate-500">
                                    {new Date(meta.dataLimite).toLocaleDateString()}
                                  </span>
                                  {diasRestantes !== null && (
                                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                      diasRestantes < 0 ? 'bg-rose-100 text-rose-700' :
                                      diasRestantes <= 7 ? 'bg-amber-100 text-amber-700' :
                                      'bg-emerald-100 text-emerald-700'
                                    }`}>
                                      {diasRestantes < 0 ? `${Math.abs(diasRestantes)} dias atrasado` :
                                       diasRestantes === 0 ? 'Hoje' :
                                       diasRestantes === 1 ? 'Amanhã' :
                                       `${diasRestantes} dias`}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                            
                            <button
                              onClick={() => {
                                setMetaParaExcluir(meta.id);
                                setShowDeleteMetaModal(true);
                              }}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-400 hover:text-red-500"
                              title="Excluir meta"
                            >
                              <span className="material-symbols-outlined text-lg">delete</span>
                            </button>
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-600 dark:text-slate-400">Progresso</span>
                              <span className="font-bold text-primary">{percentual.toFixed(0)}%</span>
                            </div>
                            <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full transition-all duration-500"
                                style={{ width: `${percentual}%` }}
                              />
                            </div>
                            <div className="flex justify-between text-xs text-slate-500 mt-2">
                              <span>R$ {valorAtualNum.toFixed(2)}</span>
                              <span>R$ {valorMetaNum.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="col-span-3 text-center py-12 text-slate-400">
                      Nenhuma meta criada ainda.
                    </div>
                  )}
                </div>
              </div>

              {/* Sidebar de Próximos Compromissos */}
              <div className="w-80 space-y-6">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
                  <h4 className="text-lg font-bold flex items-center gap-2 mb-4 text-slate-900 dark:text-white">
                    <span className="material-symbols-outlined text-primary">upcoming</span>
                    Próximos Compromissos
                  </h4>
                  <div className="space-y-3">
                    {compromissosProximos.length > 0 ? (
                      compromissosProximos.map((item) => {
                        const dataEvento = new Date(item.data);
                        const diasRestantes = item.diasRestantes || 0;
                        
                        let badgeColor = "bg-emerald-100 text-emerald-700";
                        let statusText = "";
                        
                        if (diasRestantes < 0) {
                          badgeColor = "bg-rose-100 text-rose-700";
                          statusText = `${Math.abs(diasRestantes)} dias atrasado`;
                        } else if (diasRestantes === 0) {
                          badgeColor = "bg-amber-100 text-amber-700";
                          statusText = "Hoje";
                        } else if (diasRestantes === 1) {
                          badgeColor = "bg-amber-100 text-amber-700";
                          statusText = "Amanhã";
                        } else {
                          statusText = `Em ${diasRestantes} dias`;
                        }
                        
                        return (
                          <div key={item.id} className="flex gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
                            <div className={`size-12 rounded-lg flex flex-col items-center justify-center ${badgeColor} shrink-0`}>
                              <span className="text-lg font-bold">{dataEvento.getDate()}</span>
                              <span className="text-[8px] uppercase">
                                {dataEvento.toLocaleString('pt-BR', { month: 'short' })}
                              </span>
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-slate-900 dark:text-white">{item.titulo}</p>
                              <p className="text-xs text-slate-500">
                                {dataEvento.toLocaleDateString()} • {statusText}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-sm text-slate-500 text-center py-4">
                        Nenhum compromisso próximo
                      </p>
                    )}
                  </div>
                </div>

                {/* Resumo de Metas */}
                <div className="bg-gradient-to-br from-primary to-primary/80 rounded-xl p-6 text-white shadow-lg">
                  <h4 className="text-lg font-bold mb-2">Resumo de Metas</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Total de metas:</span>
                      <span className="font-bold">{metas.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Metas concluídas:</span>
                      <span className="font-bold">
                        {metas.filter(m => (parseFloat(m.valorAtual) / parseFloat(m.valorMeta)) >= 1).length}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Valor total:</span>
                      <span className="font-bold">
                        R$ {metas.reduce((acc, m) => acc + parseFloat(m.valorMeta), 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Próximo vencimento:</span>
                      <span className="font-bold">
                        {compromissosProximos[0]?.data 
                          ? new Date(compromissosProximos[0].data).toLocaleDateString() 
                          : '-'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Modal de Confirmar Exclusão de Meta */}
        {showDeleteMetaModal && metaParaExcluir && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-900 rounded-xl p-6 max-w-md w-full shadow-xl">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-xl font-bold text-slate-900 dark:text-white">Excluir Meta</h4>
                <button
                  onClick={() => {
                    setShowDeleteMetaModal(false);
                    setMetaParaExcluir(null);
                  }}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                Tem certeza que deseja excluir esta meta? Todas as contribuições associadas também serão removidas. Esta ação não pode ser desfeita.
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => deletarMeta.mutate(metaParaExcluir)}
                  disabled={deletarMeta.isPending}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
                >
                  {deletarMeta.isPending ? "Excluindo..." : "Excluir"}
                </button>
                <button
                  onClick={() => {
                    setShowDeleteMetaModal(false);
                    setMetaParaExcluir(null);
                  }}
                  className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 py-2.5 rounded-lg text-sm font-semibold transition-all"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Página de detalhes da meta
  if (metaLoading) {
    return (
      <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark">
        <Sidebar role="admin" />
        <main className="flex-1 flex flex-col overflow-y-auto ml-64">
          <Header title="Carregando..." />
          <div className="flex-1 flex items-center justify-center">
            <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        </main>
      </div>
    );
  }

  if (!metaDetalhe) {
    return (
      <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark">
        <Sidebar role="admin" />
        <main className="flex-1 flex flex-col overflow-y-auto ml-64">
          <Header title="Meta não encontrada" />
          <div className="p-8 text-center">
            <p className="text-slate-500">Meta não encontrada</p>
            <button
              onClick={() => navigate("/admin/metas")}
              className="mt-4 text-primary hover:underline"
            >
              Voltar para lista de metas
            </button>
          </div>
        </main>
      </div>
    );
  }

  const valorMetaNum = parseFloat(metaDetalhe.valorMeta) || 0;
  const valorAtualNum = parseFloat(metaDetalhe.valorAtual) || 0;
  const percentual = valorMetaNum > 0 ? (valorAtualNum / valorMetaNum) * 100 : 0;
  const restante = valorMetaNum - valorAtualNum;
  const diasRestantes = calcularDiasRestantes(metaDetalhe.dataLimite);

  return (
    <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark">
      <Sidebar role="admin" />
      <main className="flex-1 flex flex-col overflow-y-auto ml-64">
        <Header title="Metas" />
        
        {/* Breadcrumb */}
        <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10 px-8 py-4">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <a onClick={() => navigate("/admin")} className="hover:text-primary transition-colors cursor-pointer">Início</a>
              <span className="material-symbols-outlined text-xs">chevron_right</span>
              <a onClick={() => navigate("/admin/metas")} className="hover:text-primary transition-colors cursor-pointer">Metas</a>
              <span className="material-symbols-outlined text-xs">chevron_right</span>
              <span className="text-slate-900 dark:text-white font-medium">{metaDetalhe.titulo}</span>
            </div>
            <div className="flex items-center gap-4">
              <button className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                <span className="material-symbols-outlined">notifications</span>
              </button>
            </div>
          </div>
        </div>

        <div className="px-8 py-8 max-w-6xl mx-auto space-y-8">
          {/* Goal Overview Section */}
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            <div className="flex-1 space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  {editMode ? (
                    <div className="space-y-4">
                      <input
                        className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-2xl font-black"
                        value={titulo || metaDetalhe.titulo}
                        onChange={e => setTitulo(e.target.value)}
                        placeholder="Título da meta"
                      />
                      <textarea
                        className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm"
                        value={descricao || metaDetalhe.descricao}
                        onChange={e => setDescricao(e.target.value)}
                        placeholder="Descrição"
                        rows={3}
                      />
                    </div>
                  ) : (
                    <>
                      <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{metaDetalhe.titulo}</h2>
                      <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-xl">{metaDetalhe.descricao}</p>
                      
                      {diasRestantes !== null && (
                        <div className="mt-3">
                          <span className={`text-sm font-medium px-3 py-1.5 rounded-full inline-flex items-center gap-2 ${
                            diasRestantes < 0 ? 'bg-rose-100 text-rose-700' :
                            diasRestantes <= 7 ? 'bg-amber-100 text-amber-700' :
                            'bg-emerald-100 text-emerald-700'
                          }`}>
                            <span className="material-symbols-outlined text-sm">
                              {diasRestantes < 0 ? 'schedule' : 'event'}
                            </span>
                            {diasRestantes < 0 ? `${Math.abs(diasRestantes)} dias atrasado` :
                             diasRestantes === 0 ? 'Termina hoje' :
                             diasRestantes === 1 ? 'Termina amanhã' :
                             `${diasRestantes} dias restantes`}
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </div>
                <div className="flex gap-2">
                  {editMode ? (
                    <>
                      <button
                        onClick={() => {
                          atualizarMeta.mutate({
                            id: metaDetalhe.id,
                            titulo: titulo || metaDetalhe.titulo,
                            descricao: descricao || metaDetalhe.descricao,
                          });
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-bold text-sm hover:opacity-90 transition-opacity"
                      >
                        <span className="material-symbols-outlined text-lg">save</span>
                        Salvar
                      </button>
                      <button
                        onClick={() => {
                          setEditMode(false);
                          setTitulo("");
                          setDescricao("");
                        }}
                        className="flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        Cancelar
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setEditMode(true)}
                        className="flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        <span className="material-symbols-outlined text-lg">edit</span>
                        Editar
                      </button>
                      <button
                        onClick={() => setShowProgressModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-bold text-sm hover:opacity-90 transition-opacity"
                      >
                        <span className="material-symbols-outlined text-lg">add</span>
                        Adicionar Contribuição
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Mini Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Arrecadado</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                    R$ {valorAtualNum.toFixed(2)}
                  </p>
                  <p className="text-xs font-semibold text-emerald-600 flex items-center gap-1 mt-2">
                    <span className="material-symbols-outlined text-xs">trending_up</span>
                    +{((valorAtualNum / (valorMetaNum || 1)) * 100).toFixed(1)}% da meta
                  </p>
                </div>
                <div className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Objetivo Final</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                    R$ {valorMetaNum.toFixed(2)}
                  </p>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-4 overflow-hidden">
                    <div 
                      className="bg-primary h-full rounded-full transition-all duration-500" 
                      style={{ width: `${percentual}%` }}
                    />
                  </div>
                </div>
                <div className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Restante</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                    R$ {restante > 0 ? restante.toFixed(2) : "0,00"}
                  </p>
                  {metaDetalhe.dataLimite && (
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-2 italic">
                      Prazo: {new Date(metaDetalhe.dataLimite).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Circular Progress Chart */}
            <div className="w-full lg:w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 flex flex-col items-center justify-center shadow-sm">
              <div className="relative size-48">
                <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                  <circle
                    className="stroke-slate-100 dark:stroke-slate-800"
                    cx="18"
                    cy="18"
                    fill="none"
                    r="16"
                    strokeWidth="3"
                  />
                  <circle
                    className="stroke-primary transition-all duration-500"
                    cx="18"
                    cy="18"
                    fill="none"
                    r="16"
                    strokeDasharray={`${percentual}, 100`}
                    strokeLinecap="round"
                    strokeWidth="3"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-black text-slate-900 dark:text-white">{percentual.toFixed(0)}%</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Concluído</span>
                </div>
              </div>
              <p className="mt-6 text-sm font-medium text-slate-600 dark:text-slate-400 text-center">
                {percentual >= 100 
                  ? "Meta alcançada! 🎉" 
                  : `Faltam apenas ${(100 - percentual).toFixed(0)}% para o objetivo!`}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {/* Student Contributions List */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm flex flex-col">
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <h3 className="font-bold text-slate-900 dark:text-white">Contribuições de Estudantes</h3>
                <span className="text-sm text-slate-500">{contribuicoes.length} registros</span>
              </div>
              <div className="flex-1 overflow-auto max-h-[400px]">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 sticky top-0">
                    <tr>
                      <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Estudante</th>
                      <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Valor</th>
                      <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Descrição</th>
                      <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Data</th>
                      <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {contribuicoes.length > 0 ? (
                      contribuicoes.map((contrib) => (
                        <tr key={contrib.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="px-6 py-4 flex items-center gap-3">
                            {contrib.alunoAvatar ? (
                              <img className="size-8 rounded-full" src={contrib.alunoAvatar} alt={contrib.alunoNome} />
                            ) : (
                              <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="text-xs font-bold text-primary">
                                  {contrib.alunoNome?.split(' ').map(n => n[0]).join('').substring(0, 2) || '??'}
                                </span>
                              </div>
                            )}
                            <span className="text-sm font-medium">{contrib.alunoNome}</span>
                          </td>
                          <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-white">
                            R$ {contrib.valor.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-500 max-w-[150px] truncate">
                            {contrib.descricao || '-'}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-500">
                            {new Date(contrib.data).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleContribuicaoClick(contrib)}
                                className="p-1 text-slate-400 hover:text-primary transition-colors"
                                title="Editar contribuição"
                              >
                                <span className="material-symbols-outlined text-lg">edit</span>
                              </button>
                              <button
                                onClick={() => {
                                  setContribuicaoSelecionada(contrib);
                                  setShowDeleteModal(true);
                                }}
                                className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                                title="Excluir contribuição"
                              >
                                <span className="material-symbols-outlined text-lg">delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                          Nenhuma contribuição registrada ainda
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Update History Timeline */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm flex flex-col">
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <h3 className="font-bold text-slate-900 dark:text-white">Histórico de Atualizações</h3>
                <span className="text-sm text-slate-500">{historico.length} eventos</span>
              </div>
              <div className="p-6 space-y-6 flex-1 overflow-auto max-h-[400px]">
                {historico.length > 0 ? (
                  historico.map((item, index) => (
                    <div key={item.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`size-8 rounded-full flex items-center justify-center ${
                          item.tipo === "create" ? "bg-primary/10 text-primary" :
                          item.tipo === "edit" ? "bg-amber-500/10 text-amber-600" :
                          "bg-emerald-500/10 text-emerald-600"
                        }`}>
                          <span className="material-symbols-outlined text-sm">
                            {item.tipo === "create" ? "flag" : item.tipo === "edit" ? "edit" : "update"}
                          </span>
                        </div>
                        {index < historico.length - 1 && (
                          <div className="flex-1 w-0.5 bg-slate-100 dark:bg-slate-800 mt-2" />
                        )}
                      </div>
                      <div className={index < historico.length - 1 ? "pb-6" : ""}>
                        <p className="text-sm font-bold">
                          {item.tipo === "create" ? "Meta Criada" :
                           item.tipo === "edit" ? "Meta Editada" :
                           "Progresso Adicionado"}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">{item.descricao}</p>
                        <p className="text-[10px] text-slate-400 mt-2">
                          {new Date(item.data).toLocaleDateString()} • {item.usuarioNome}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-slate-400 py-8">Nenhum histórico disponível</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal de Adicionar Contribuição */}
        {showProgressModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-900 rounded-xl p-6 max-w-md w-full shadow-xl">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-xl font-bold text-slate-900 dark:text-white">Adicionar Contribuição</h4>
                <button
                  onClick={() => {
                    setShowProgressModal(false);
                    resetProgressoForm();
                  }}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Aluno *
                  </label>
                  <select
                    className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-primary/20 focus:border-transparent"
                    value={progressoAlunoId || ""}
                    onChange={e => setProgressoAlunoId(parseInt(e.target.value))}
                  >
                    <option value="">Selecione um aluno</option>
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
                    placeholder="0,00"
                    value={progressoValor}
                    onChange={e => setProgressoValor(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Descrição (opcional)
                  </label>
                  <input
                    className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-primary/20 focus:border-transparent"
                    placeholder="Ex: Doação para rifa, pagamento de parcela..."
                    value={progressoDescricao}
                    onChange={e => setProgressoDescricao(e.target.value)}
                  />
                </div>

                {error && <p className="text-red-500 text-sm">{error}</p>}
                
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      if (!progressoAlunoId) {
                        setError("Selecione um aluno");
                        return;
                      }
                      if (!progressoValor || parseFloat(progressoValor) <= 0) {
                        setError("Digite um valor válido");
                        return;
                      }
                      adicionarContribuicao.mutate({
                        alunoId: progressoAlunoId,
                        valor: parseFloat(progressoValor),
                        descricao: progressoDescricao || null
                      });
                    }}
                    disabled={adicionarContribuicao.isPending}
                    className="flex-1 bg-primary hover:bg-primary/90 text-white py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
                  >
                    {adicionarContribuicao.isPending ? "Adicionando..." : "Adicionar"}
                  </button>
                  <button
                    onClick={() => {
                      setShowProgressModal(false);
                      resetProgressoForm();
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

        {/* Modal de Editar Contribuição */}
        {showEditContribModal && contribuicaoSelecionada && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-900 rounded-xl p-6 max-w-md w-full shadow-xl">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-xl font-bold text-slate-900 dark:text-white">Editar Contribuição</h4>
                <button
                  onClick={() => {
                    setShowEditContribModal(false);
                    setContribuicaoSelecionada(null);
                  }}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Aluno *
                  </label>
                  <select
                    className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-primary/20 focus:border-transparent"
                    value={editContribAlunoId || ""}
                    onChange={e => setEditContribAlunoId(parseInt(e.target.value))}
                  >
                    <option value="">Selecione um aluno</option>
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
                    placeholder="0,00"
                    value={editContribValor}
                    onChange={e => setEditContribValor(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Descrição (opcional)
                  </label>
                  <input
                    className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-primary/20 focus:border-transparent"
                    placeholder="Ex: Doação para rifa, pagamento de parcela..."
                    value={editContribDescricao}
                    onChange={e => setEditContribDescricao(e.target.value)}
                  />
                </div>

                {error && <p className="text-red-500 text-sm">{error}</p>}
                
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      if (!editContribAlunoId) {
                        setError("Selecione um aluno");
                        return;
                      }
                      if (!editContribValor || parseFloat(editContribValor) <= 0) {
                        setError("Digite um valor válido");
                        return;
                      }
                      editarContribuicao.mutate({
                        contribuicaoId: contribuicaoSelecionada.id,
                        alunoId: editContribAlunoId,
                        valor: parseFloat(editContribValor),
                        descricao: editContribDescricao || null
                      });
                    }}
                    disabled={editarContribuicao.isPending}
                    className="flex-1 bg-primary hover:bg-primary/90 text-white py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
                  >
                    {editarContribuicao.isPending ? "Salvando..." : "Salvar"}
                  </button>
                  <button
                    onClick={() => {
                      setShowEditContribModal(false);
                      setContribuicaoSelecionada(null);
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

        {/* Modal de Confirmar Exclusão de Contribuição */}
        {showDeleteModal && contribuicaoSelecionada && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-900 rounded-xl p-6 max-w-md w-full shadow-xl">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-xl font-bold text-slate-900 dark:text-white">Confirmar Exclusão</h4>
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setContribuicaoSelecionada(null);
                  }}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                Tem certeza que deseja excluir a contribuição de <strong>{contribuicaoSelecionada.alunoNome}</strong> no valor de <strong>R$ {contribuicaoSelecionada.valor.toFixed(2)}</strong>?
                Esta ação não pode ser desfeita.
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => deletarContribuicao.mutate(contribuicaoSelecionada.id)}
                  disabled={deletarContribuicao.isPending}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
                >
                  {deletarContribuicao.isPending ? "Excluindo..." : "Excluir"}
                </button>
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setContribuicaoSelecionada(null);
                  }}
                  className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 py-2.5 rounded-lg text-sm font-semibold transition-all"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
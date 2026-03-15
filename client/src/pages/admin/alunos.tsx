import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Sidebar from "../../components/layout/Sidebar";
import Header from "../../components/layout/Header";
import { apiRequest } from "../../lib/queryClient";
import { useAuth } from "../../hooks/useAuth";

type StatusFiltro = "todos" | "completed" | "pending" | "overdue";

export default function AdminAlunos() {
  const qc = useQueryClient();
  const { auth } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAluno, setEditingAluno] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<StatusFiltro>("todos");
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 5;

  // Estados do formulário
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [celular, setCelular] = useState("");
  const [error, setError] = useState("");

  // Estados do formulário de edição
  const [editNome, setEditNome] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editCelular, setEditCelular] = useState("");

  // Buscar alunos
  const { data: alunos = [], isLoading } = useQuery({
    queryKey: ["alunos", auth?.salaId],
    queryFn: () => apiRequest("GET", `/alunos?salaId=${auth?.salaId}`),
    enabled: !!auth?.salaId,
  });

  // Buscar pagamentos
  const { data: pagamentos = [] } = useQuery({
    queryKey: ["pagamentos", auth?.salaId],
    queryFn: () => apiRequest("GET", `/pagamentos?salaId=${auth?.salaId}`),
    enabled: !!auth?.salaId,
  });

  // Mutação para criar aluno
  const criar = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/alunos", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["alunos"] });
      setShowForm(false);
      setNome("");
      setEmail("");
      setSenha("");
      setCelular("");
      setError("");
    },
    onError: (e: any) => setError(e.message),
  });

  // Mutação para editar aluno
  const editar = useMutation({
    mutationFn: ({ id, ...data }: any) => apiRequest("PUT", `/alunos/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["alunos"] });
      setShowEditModal(false);
      setEditingAluno(null);
    },
  });

  // Mutação para deletar aluno
  const deletar = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/alunos/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["alunos"] });
    },
  });

  // Função para obter status do aluno
  const getAlunoStatus = (alunoId: number) => {
    const pagamentosAluno = pagamentos.filter((p: any) => p.usuarioId === alunoId);
    
    if (pagamentosAluno.length === 0) return "pending";
    
    const temPendente = pagamentosAluno.some((p: any) => p.status === "pending");
    const temPago = pagamentosAluno.some((p: any) => p.status === "pago");
    
    if (temPago && !temPendente) return "completed";
    if (temPendente) return "pending";
    return "overdue";
  };

  // Função para calcular total pago
  const getTotalPago = (alunoId: number) => {
    return pagamentos
      .filter((p: any) => p.usuarioId === alunoId && p.status === "pago")
      .reduce((acc: number, p: any) => acc + p.valor, 0);
  };

  // Filtrar alunos
  const alunosFiltrados = alunos.filter((aluno: any) => {
    const matchesSearch = 
      aluno.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      aluno.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      aluno.celular?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const status = getAlunoStatus(aluno.id);
    const matchesStatus = filtroStatus === "todos" || status === filtroStatus;
    
    return matchesSearch && matchesStatus;
  });

  // Paginação
  const totalPaginas = Math.ceil(alunosFiltrados.length / itensPorPagina);
  const alunosPaginados = alunosFiltrados.slice(
    (paginaAtual - 1) * itensPorPagina,
    paginaAtual * itensPorPagina
  );

  const getStatusBadge = (status: string) => {
    const config = {
      completed: {
        bg: "bg-emerald-100",
        text: "text-emerald-800",
        dot: "bg-emerald-500",
        label: "Pago"
      },
      pending: {
        bg: "bg-amber-100",
        text: "text-amber-800",
        dot: "bg-amber-500",
        label: "Pendente"
      },
      overdue: {
        bg: "bg-rose-100",
        text: "text-rose-800",
        dot: "bg-rose-500",
        label: "Inadimplente"
      }
    };
    
    const style = config[status as keyof typeof config] || config.pending;
    
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
        <span className={`size-1.5 rounded-full ${style.dot}`}></span>
        {style.label}
      </span>
    );
  };

  const handleEdit = (aluno: any) => {
    setEditingAluno(aluno);
    setEditNome(aluno.nome);
    setEditEmail(aluno.email);
    setEditCelular(aluno.celular || "");
    setShowEditModal(true);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar role="admin" />
      <main className="flex-1 flex flex-col overflow-y-auto ml-64">
        <Header title="Alunos" />
        
        <div className="p-8 space-y-6">
          {/* Header com busca e botão */}
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Gerenciar Alunos</h3>
              <p className="text-sm text-slate-500 mt-1">{alunosFiltrados.length} alunos encontrados</p>
            </div>
            <div className="flex gap-4">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-primary/20 focus:border-transparent w-80"
                  placeholder="Buscar por nome, email ou telefone..."
                />
              </div>
              <button 
                onClick={() => setShowForm(true)} 
                className="bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 shadow-sm"
              >
                <span className="material-symbols-outlined text-sm">person_add</span> 
                Adicionar Aluno
              </button>
            </div>
          </div>

          {/* Filtros de status */}
          <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-4">
            {[
              { key: "todos", label: "Todos" },
              { key: "completed", label: "Pagos" },
              { key: "pending", label: "Pendentes" },
              { key: "overdue", label: "Inadimplentes" }
            ].map((filtro) => (
              <button
                key={filtro.key}
                onClick={() => setFiltroStatus(filtro.key as StatusFiltro)}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                  filtroStatus === filtro.key
                    ? "bg-primary text-white shadow-sm"
                    : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-primary/50 hover:text-primary"
                }`}
              >
                {filtro.label}
              </button>
            ))}
          </div>

          {/* Modal de Novo Aluno */}
          {showForm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-slate-900 rounded-xl p-6 max-w-md w-full shadow-xl">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-xl font-bold">Novo Aluno</h4>
                  <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>
                
                <div className="space-y-4">
                  <input
                    className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-primary/20 focus:border-transparent"
                    placeholder="Nome completo"
                    value={nome}
                    onChange={e => setNome(e.target.value)}
                  />
                  <input
                    className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-primary/20 focus:border-transparent"
                    type="email"
                    placeholder="E-mail"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                  <input
                    className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-primary/20 focus:border-transparent"
                    type="tel"
                    placeholder="Celular (com DDD)"
                    value={celular}
                    onChange={e => setCelular(e.target.value)}
                  />
                  <input
                    className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-primary/20 focus:border-transparent"
                    type="password"
                    placeholder="Senha temporária"
                    value={senha}
                    onChange={e => setSenha(e.target.value)}
                  />
                  {error && <p className="text-red-500 text-sm">{error}</p>}
                  
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => criar.mutate({ 
                        nome, 
                        email, 
                        senha, 
                        celular,
                        role: "aluno", 
                        salaId: auth?.salaId 
                      })}
                      disabled={criar.isPending}
                      className="flex-1 bg-primary hover:bg-primary/90 text-white py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
                    >
                      {criar.isPending ? "Salvando..." : "Salvar"}
                    </button>
                    <button 
                      onClick={() => setShowForm(false)} 
                      className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 py-2.5 rounded-lg text-sm font-semibold transition-all"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Modal de Edição */}
          {showEditModal && editingAluno && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-slate-900 rounded-xl p-6 max-w-md w-full shadow-xl">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-xl font-bold">Editar Aluno</h4>
                  <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600">
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>
                
                <div className="space-y-4">
                  <input
                    className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-primary/20 focus:border-transparent"
                    placeholder="Nome completo"
                    value={editNome}
                    onChange={e => setEditNome(e.target.value)}
                  />
                  <input
                    className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-primary/20 focus:border-transparent"
                    type="email"
                    placeholder="E-mail"
                    value={editEmail}
                    onChange={e => setEditEmail(e.target.value)}
                  />
                  <input
                    className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-primary/20 focus:border-transparent"
                    type="tel"
                    placeholder="Celular (com DDD)"
                    value={editCelular}
                    onChange={e => setEditCelular(e.target.value)}
                  />
                  
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => editar.mutate({ 
                        id: editingAluno.id,
                        nome: editNome, 
                        email: editEmail, 
                        celular: editCelular
                      })}
                      disabled={editar.isPending}
                      className="flex-1 bg-primary hover:bg-primary/90 text-white py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
                    >
                      {editar.isPending ? "Salvando..." : "Atualizar"}
                    </button>
                    <button 
                      onClick={() => setShowEditModal(false)} 
                      className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 py-2.5 rounded-lg text-sm font-semibold transition-all"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tabela de alunos */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Aluno</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Valor Pago</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {isLoading ? (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400">Carregando...</td></tr>
                ) : alunosPaginados.length > 0 ? (
                  alunosPaginados.map((aluno: any) => {
                    const status = getAlunoStatus(aluno.id);
                    const totalPago = getTotalPago(aluno.id);
                    
                    return (
                      <tr key={aluno.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="size-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                              {aluno.nome?.charAt(0)?.toUpperCase()}
                            </div>
                            <span className="font-medium text-sm">{aluno.nome}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{aluno.email}</td>
                        <td className="px-6 py-4">
                          {getStatusBadge(status)}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium">
                          {totalPago.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => handleEdit(aluno)}
                              className="p-1.5 text-slate-400 hover:text-primary transition-colors"
                            >
                              <span className="material-symbols-outlined text-lg">edit</span>
                            </button>
                            <button
                              onClick={() => deletar.mutate(aluno.id)}
                              className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                            >
                              <span className="material-symbols-outlined text-lg">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400">Nenhum aluno encontrado</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          {totalPaginas > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-slate-500">
                Mostrando {(paginaAtual - 1) * itensPorPagina + 1} a {Math.min(paginaAtual * itensPorPagina, alunosFiltrados.length)} de {alunosFiltrados.length} alunos
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPaginaAtual(1)}
                  disabled={paginaAtual === 1}
                  className="size-9 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                  <span className="material-symbols-outlined">first_page</span>
                </button>
                <button
                  onClick={() => setPaginaAtual(p => Math.max(1, p - 1))}
                  disabled={paginaAtual === 1}
                  className="size-9 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                  <span className="material-symbols-outlined">chevron_left</span>
                </button>
                
                {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                  let pageNum;
                  if (totalPaginas <= 5) {
                    pageNum = i + 1;
                  } else if (paginaAtual <= 3) {
                    pageNum = i + 1;
                  } else if (paginaAtual >= totalPaginas - 2) {
                    pageNum = totalPaginas - 4 + i;
                  } else {
                    pageNum = paginaAtual - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPaginaAtual(pageNum)}
                      className={`size-9 flex items-center justify-center rounded-lg text-sm font-medium transition-all ${
                        paginaAtual === pageNum
                          ? "bg-primary text-white shadow-sm"
                          : "border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => setPaginaAtual(p => Math.min(totalPaginas, p + 1))}
                  disabled={paginaAtual === totalPaginas}
                  className="size-9 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
                <button
                  onClick={() => setPaginaAtual(totalPaginas)}
                  disabled={paginaAtual === totalPaginas}
                  className="size-9 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                  <span className="material-symbols-outlined">last_page</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
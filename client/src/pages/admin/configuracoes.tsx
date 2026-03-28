import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import MobileLayout from "../../components/layout/MobileLayout";
import MobileHeader from "../../components/layout/MobileHeader";
import MobileCard from "../../components/ui/MobileCard";
import MobileButton from "../../components/ui/MobileButton";
import MobileInput from "../../components/ui/MobileInput";
import BottomSheet from "../../components/ui/BottomSheet";
import { useBottomSheet } from "../../hooks/useBottomSheet";
import { apiRequest } from "../../lib/queryClient";
import { useAuth } from "../../hooks/useAuth";

interface Sala {
  id: number;
  nome: string;
  codigo: string;
  metaValor: string;
}

export default function AdminConfiguracoes() {
  const qc = useQueryClient();
  const { auth, logout } = useAuth();
  const logoutSheet = useBottomSheet();
  const deleteSheet = useBottomSheet();

  const [formData, setFormData] = useState({ 
    nome: "", 
    metaAlunos: "", 
    novaSenha: "", 
    confirmarSenha: "" 
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const { data: sala } = useQuery<Sala>({
    queryKey: ["sala", auth?.salaId],
    queryFn: () => apiRequest("GET", `/salas/${auth?.salaId}`),
    enabled: !!auth?.salaId,
  });

  const atualizarSala = useMutation({
    mutationFn: (data: any) => apiRequest("PATCH", `/salas/${auth?.salaId}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sala", auth?.salaId] });
      showSuccess("Informações salvas com sucesso");
    },
    onError: (e: any) => showError(e.message),
  });

  const atualizarSenha = useMutation({
    mutationFn: (data: any) => apiRequest("PATCH", `/salas/${auth?.salaId}/senha`, data),
    onSuccess: () => { 
      showSuccess("Senha alterada com sucesso"); 
      setFormData((f) => ({ ...f, novaSenha: "", confirmarSenha: "" })); 
    },
    onError: (e: any) => showError(e.message),
  });

  const excluirTurma = useMutation({
    mutationFn: () => apiRequest("DELETE", `/salas/${auth?.salaId}`),
    onSuccess: () => { 
      deleteSheet.close(); 
      showSuccess("Turma excluída com sucesso"); 
      setTimeout(() => (window.location.href = "/"), 2000); 
    },
    onError: (e: any) => showError(e.message),
  });

  const handleLogout = async () => {
    try {
      await logout.mutateAsync();
      logoutSheet.close();
      window.location.href = "/";
    } catch (error) {
      showError("Erro ao sair da conta");
    }
  };

  const showSuccess = (msg: string) => { 
    setSuccess(msg); 
    setTimeout(() => setSuccess(""), 3000); 
  };
  
  const showError = (msg: string) => { 
    setError(msg);   
    setTimeout(() => setError(""), 3000); 
  };

  const handleSaveInfo = () => {
    if (!formData.nome && !formData.metaAlunos) return;
    atualizarSala.mutate({ 
      nome: formData.nome || sala?.nome, 
      metaValor: formData.metaAlunos ? parseFloat(formData.metaAlunos) * 100 : undefined 
    });
  };

  const handleUpdatePassword = () => {
    if (formData.novaSenha.length < 6) { 
      showError("A senha deve ter no mínimo 6 caracteres"); 
      return; 
    }
    if (formData.novaSenha !== formData.confirmarSenha) { 
      showError("As senhas não conferem"); 
      return; 
    }
    atualizarSenha.mutate({ senha: formData.novaSenha });
  };

  const Section = ({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) => (
    <MobileCard>
      <div className="flex items-center gap-3 mb-4">
        <span className="material-symbols-outlined text-primary text-xl">{icon}</span>
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h2>
      </div>
      {children}
    </MobileCard>
  );

  return (
    <MobileLayout role="admin">
      <MobileHeader title="Configurações" subtitle="Gerenciar turma e segurança" gradient />

      <div className="px-4 py-4 space-y-4">
        {/* Alertas */}
        {error && (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 flex items-center gap-3 text-sm text-red-600 dark:text-red-400">
            <span className="material-symbols-outlined text-lg">error_outline</span>
            <span className="flex-1">{error}</span>
          </div>
        )}
        {success && (
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex items-center gap-3 text-sm text-emerald-600 dark:text-emerald-400">
            <span className="material-symbols-outlined text-lg">check_circle</span>
            <span className="flex-1">{success}</span>
          </div>
        )}

        {/* Informações da Turma */}
        <Section icon="school" title="Informações da Turma">
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <span className="text-xs text-slate-500">Código da turma</span>
              <p className="font-mono font-semibold text-slate-800 dark:text-slate-200 mt-1">{sala?.codigo || "—"}</p>
            </div>
            <MobileInput 
              label="Nome da Turma" 
              icon="group" 
              placeholder={sala?.nome || "Digite o nome da turma"} 
              value={formData.nome}
              onChange={(e) => setFormData((f) => ({ ...f, nome: e.target.value }))} 
            />
            <MobileInput 
              label="Meta Financeira" 
              icon="flag" 
              type="number" 
              placeholder="Valor em reais (ex: 50000)"
              value={formData.metaAlunos} 
              onChange={(e) => setFormData((f) => ({ ...f, metaAlunos: e.target.value }))} 
            />
            <MobileButton variant="primary" fullWidth loading={atualizarSala.isPending} onClick={handleSaveInfo}>
              Salvar Alterações
            </MobileButton>
          </div>
        </Section>

        {/* Segurança */}
        <Section icon="lock" title="Segurança">
          <div className="space-y-4">
            <p className="text-xs text-slate-500">Esta senha é utilizada pelos alunos para acessar a turma.</p>
            <MobileInput 
              label="Nova Senha" 
              icon="key" 
              type="password" 
              placeholder="Digite a nova senha"
              value={formData.novaSenha} 
              onChange={(e) => setFormData((f) => ({ ...f, novaSenha: e.target.value }))} 
            />
            <MobileInput 
              label="Confirmar Senha" 
              icon="key" 
              type="password" 
              placeholder="Confirme a nova senha"
              value={formData.confirmarSenha} 
              onChange={(e) => setFormData((f) => ({ ...f, confirmarSenha: e.target.value }))} 
            />
            <MobileButton variant="secondary" fullWidth loading={atualizarSenha.isPending} onClick={handleUpdatePassword}>
              Atualizar Senha
            </MobileButton>
          </div>
        </Section>

        {/* Zona de Perigo */}
        <div className="border border-red-200 dark:border-red-800 rounded-2xl p-4 bg-red-50/30 dark:bg-red-950/10 space-y-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-red-500 text-xl">warning</span>
            <h2 className="text-sm font-semibold text-red-600 dark:text-red-400">Zona de Perigo</h2>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Esta ação é irreversível. Todos os dados da turma serão permanentemente removidos.
          </p>
          <MobileButton variant="danger" fullWidth icon="delete_forever" onClick={deleteSheet.open}>
            Excluir Turma
          </MobileButton>
        </div>

        {/* Sair da Conta */}
        <Section icon="logout" title="Sair da Conta">
          <div className="space-y-3">
            <p className="text-xs text-slate-500">Você será redirecionado para a página inicial.</p>
            <MobileButton variant="secondary" fullWidth icon="logout" onClick={logoutSheet.open}>
              Sair
            </MobileButton>
          </div>
        </Section>
      </div>

      {/* Modal de confirmação de logout */}
      <BottomSheet isOpen={logoutSheet.isOpen} onClose={logoutSheet.close} title="Sair da Conta">
        <div className="space-y-5 text-center">
          <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-slate-500 text-2xl">logout</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Deseja sair?</h3>
            <p className="text-sm text-slate-500 mt-1">Você precisará fazer login novamente para acessar sua conta.</p>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-2">
            <MobileButton variant="secondary" fullWidth onClick={logoutSheet.close}>
              Cancelar
            </MobileButton>
            <MobileButton variant="primary" fullWidth onClick={handleLogout}>
              Sair
            </MobileButton>
          </div>
        </div>
      </BottomSheet>

      {/* Modal de confirmação de exclusão da turma */}
      <BottomSheet isOpen={deleteSheet.isOpen} onClose={deleteSheet.close} title="Excluir Turma">
        <div className="space-y-5 text-center">
          <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-950/40 flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-red-500 text-2xl">delete_forever</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-red-600 dark:text-red-400">Ação Irreversível</h3>
            <p className="text-sm text-slate-500 mt-1">
              Tem certeza que deseja excluir permanentemente a turma 
              <strong className="block text-slate-700 dark:text-slate-300 mt-1">"{sala?.nome}"</strong>?
            </p>
            <p className="text-xs text-red-500 mt-3">
              Todos os dados serão perdidos: alunos, pagamentos, rifas, eventos e histórico.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-2">
            <MobileButton variant="secondary" fullWidth onClick={deleteSheet.close}>
              Cancelar
            </MobileButton>
            <MobileButton variant="danger" fullWidth loading={excluirTurma.isPending} onClick={() => excluirTurma.mutate()}>
              Excluir Permanentemente
            </MobileButton>
          </div>
        </div>
      </BottomSheet>
    </MobileLayout>
  );
}
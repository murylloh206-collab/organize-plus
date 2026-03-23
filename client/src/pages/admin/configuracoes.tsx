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
  const { auth } = useAuth();
  const archiveSheet = useBottomSheet();

  const [formData, setFormData] = useState({ nome: "", metaAlunos: "", novaSenha: "", confirmarSenha: "" });
  const [error,   setError]   = useState("");
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
      showSuccess("Informações salvas!");
    },
    onError: (e: any) => showError(e.message),
  });

  const atualizarSenha = useMutation({
    mutationFn: (data: any) => apiRequest("PATCH", `/salas/${auth?.salaId}/senha`, data),
    onSuccess: () => { showSuccess("Senha alterada!"); setFormData((f) => ({ ...f, novaSenha: "", confirmarSenha: "" })); },
    onError: (e: any) => showError(e.message),
  });

  const arquivarTurma = useMutation({
    mutationFn: () => apiRequest("PATCH", `/salas/${auth?.salaId}/arquivar`, {}),
    onSuccess: () => { archiveSheet.close(); showSuccess("Turma arquivada!"); setTimeout(() => (window.location.href = "/admin/dashboard"), 2000); },
    onError: (e: any) => showError(e.message),
  });

  const showSuccess = (msg: string) => { setSuccess(msg); setTimeout(() => setSuccess(""), 3000); };
  const showError   = (msg: string) => { setError(msg);   setTimeout(() => setError(""),   3000); };

  const handleSaveInfo = () => {
    if (!formData.nome && !formData.metaAlunos) return;
    atualizarSala.mutate({ nome: formData.nome || sala?.nome, metaValor: formData.metaAlunos ? parseFloat(formData.metaAlunos) * 100 : undefined });
  };

  const handleUpdatePassword = () => {
    if (formData.novaSenha.length < 6) { showError("Senha deve ter no mínimo 6 caracteres"); return; }
    if (formData.novaSenha !== formData.confirmarSenha) { showError("As senhas não conferem"); return; }
    atualizarSenha.mutate({ senha: formData.novaSenha });
  };

  const Section = ({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) => (
    <MobileCard>
      <div className="flex items-center gap-2 mb-4">
        <span className="material-symbols-outlined text-indigo-600 dark:text-indigo-400 text-xl">{icon}</span>
        <h2 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h2>
      </div>
      {children}
    </MobileCard>
  );

  return (
    <MobileLayout role="admin">
      <MobileHeader title="Configurações" subtitle="Turma e segurança" gradient />

      <div className="px-4 py-4 space-y-4">
        {/* Alerts */}
        {error && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
            <span className="material-symbols-outlined text-lg">error</span>{error}
          </div>
        )}
        {success && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
            <span className="material-symbols-outlined text-lg">check_circle</span>{success}
          </div>
        )}

        {/* Infos da turma */}
        <Section icon="school" title="Informações da Turma">
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs">
              <span className="text-slate-400">Código da turma: </span>
              <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{sala?.codigo || "—"}</span>
            </div>
            <MobileInput label="Nome da Turma" icon="group" placeholder={sala?.nome || "Nome..."} value={formData.nome}
              onChange={(e) => setFormData((f) => ({ ...f, nome: e.target.value }))} />
            <MobileInput label="Meta Financeira (R$)" icon="flag" type="number" placeholder="ex: 50000"
              value={formData.metaAlunos} onChange={(e) => setFormData((f) => ({ ...f, metaAlunos: e.target.value }))} />
            <MobileButton variant="primary" fullWidth loading={atualizarSala.isPending} onClick={handleSaveInfo}>
              Salvar Alterações
            </MobileButton>
          </div>
        </Section>

        {/* Segurança */}
        <Section icon="lock" title="Segurança — Senha da Turma">
          <div className="space-y-3">
            <p className="text-xs text-slate-500">Alunos usam essa senha para entrar na turma.</p>
            <MobileInput label="Nova Senha" icon="key" type="password" placeholder="••••••••"
              value={formData.novaSenha} onChange={(e) => setFormData((f) => ({ ...f, novaSenha: e.target.value }))} />
            <MobileInput label="Confirmar Senha" icon="key" type="password" placeholder="••••••••"
              value={formData.confirmarSenha} onChange={(e) => setFormData((f) => ({ ...f, confirmarSenha: e.target.value }))} />
            <MobileButton variant="secondary" fullWidth loading={atualizarSenha.isPending} onClick={handleUpdatePassword}>
              Atualizar Senha
            </MobileButton>
          </div>
        </Section>

        {/* Zona de Perigo */}
        <div className="border border-red-200 dark:border-red-900 rounded-2xl p-4 bg-red-50/50 dark:bg-red-950/20 space-y-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-red-600 text-xl">warning</span>
            <h2 className="text-sm font-bold text-red-700 dark:text-red-400">Zona de Perigo</h2>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Ao arquivar, a turma ficará inativa mas os dados históricos serão preservados.
          </p>
          <MobileButton variant="danger" fullWidth icon="archive" onClick={archiveSheet.open}>
            Arquivar Turma
          </MobileButton>
        </div>
      </div>

      {/* Confirmação de arquivamento */}
      <BottomSheet isOpen={archiveSheet.isOpen} onClose={archiveSheet.close} title="Confirmação">
        <div className="space-y-4 text-center">
          <div className="size-14 rounded-full bg-red-100 dark:bg-red-950/40 flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-red-500 text-2xl">warning</span>
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Arquivar "{sala?.nome}"?</h3>
            <p className="text-sm text-slate-500 mt-1">Esta ação remove a turma da visualização ativa.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <MobileButton variant="secondary" fullWidth onClick={archiveSheet.close}>Cancelar</MobileButton>
            <MobileButton variant="danger" fullWidth loading={arquivarTurma.isPending} onClick={() => arquivarTurma.mutate()}>
              Arquivar
            </MobileButton>
          </div>
        </div>
      </BottomSheet>
    </MobileLayout>
  );
}
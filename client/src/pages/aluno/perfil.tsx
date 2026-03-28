import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import MobileLayout from "../../components/layout/MobileLayout";
import MobileHeader from "../../components/layout/MobileHeader";
import MobileCard from "../../components/ui/MobileCard";
import MobileButton from "../../components/ui/MobileButton";
import MobileInput from "../../components/ui/MobileInput";
import MobileAvatar from "../../components/ui/MobileAvatar";
import BottomSheet from "../../components/ui/BottomSheet";
import { useBottomSheet } from "../../hooks/useBottomSheet";
import { apiRequest } from "../../lib/queryClient";
import { useAuth } from "../../hooks/useAuth";

export default function AlunoPerfil() {
  const qc = useQueryClient();
  const { auth, logout } = useAuth();
  
  const editSheet = useBottomSheet();
  const passSheet = useBottomSheet();
  const logoutSheet = useBottomSheet();

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [uploading, setUploading] = useState(false);

  const { data: me, refetch } = useQuery({
    queryKey: ["me"],
    queryFn: () => apiRequest("GET", "/alunos/me"),
    enabled: !!auth,
  });

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    
    if (strength <= 1) return { color: "text-red-500", bar: "bg-red-500", width: 25 };
    if (strength === 2) return { color: "text-amber-500", bar: "bg-amber-500", width: 50 };
    if (strength === 3) return { color: "text-blue-500", bar: "bg-blue-500", width: 75 };
    return { color: "text-emerald-500", bar: "bg-emerald-500", width: 100 };
  };

  const strength = novaSenha ? getPasswordStrength(novaSenha) : null;

  const showSuccess = (msg: string) => { setSuccess(msg); setTimeout(() => setSuccess(""), 3000); };
  const showError = (msg: string) => { setError(msg); setTimeout(() => setError(""), 3000); };

  const atualizarPerfil = useMutation({
    mutationFn: (data: any) => apiRequest("PATCH", "/alunos/me", data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["me"] }); editSheet.close(); showSuccess("Perfil atualizado!"); refetch(); },
    onError: (e: any) => showError(e.message),
  });

  const atualizarSenha = useMutation({
    mutationFn: (data: any) => apiRequest("PATCH", "/alunos/senha", data),
    onSuccess: () => { passSheet.close(); showSuccess("Senha alterada!"); setSenhaAtual(""); setNovaSenha(""); setConfirmarSenha(""); },
    onError: (e: any) => showError(e.message),
  });

  // Altere a mutation do avatar:
const atualizarAvatar = useMutation({
  mutationFn: (formData: FormData) => apiRequest("POST", "/alunos/me/avatar", formData, true),
  onSuccess: (data) => {
    showSuccess("Foto atualizada com sucesso!");
    refetch();
    setUploading(false);
  },
  onError: (e: any) => {
    showError(e.message);
    setUploading(false);
  },
});

  const handleSaveInfo = () => {
    const updateData: any = {};
    if (nome && nome !== me?.nome) updateData.nome = nome;
    if (telefone && telefone !== me?.celular) updateData.celular = telefone;
    if (Object.keys(updateData).length > 0) atualizarPerfil.mutate(updateData);
    else editSheet.close();
  };

  const handleUpdatePassword = () => {
    if (!senhaAtual || !novaSenha || !confirmarSenha) return showError("Preencha todos os campos");
    if (novaSenha.length < 6) return showError("A nova senha deve ter no mínimo 6 caracteres");
    if (novaSenha !== confirmarSenha) return showError("As senhas não conferem");
    atualizarSenha.mutate({ senhaAtual, novaSenha });
  };

  const handleFotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validar tamanho (2MB)
    if (file.size > 2 * 1024 * 1024) {
      showError("A imagem deve ter no máximo 2MB");
      return;
    }
    
    // Validar tipo
    if (!["image/jpeg", "image/png", "image/jpg"].includes(file.type)) {
      showError("Formato não permitido. Use JPG ou PNG.");
      return;
    }
    
    setUploading(true);
    
    const formData = new FormData();
    formData.append("avatar", file);
    
    try {
      await atualizarAvatar.mutateAsync(formData);
    } catch (error) {
      // Erro já tratado no mutation
    }
  };

  const openEdit = () => { setNome(me?.nome || ""); setTelefone(me?.celular || ""); editSheet.open(); };

  return (
    <MobileLayout role="aluno">
      <MobileHeader title="Perfil" subtitle="Gerencie sua conta" gradient />

      <div className="px-4 py-4 space-y-4">
        {error && <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-xl text-rose-600 text-sm flex items-center gap-2"><span className="material-symbols-outlined text-lg">error</span>{error}</div>}
        {success && <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-xl text-emerald-600 text-sm flex items-center gap-2"><span className="material-symbols-outlined text-lg">check_circle</span>{success}</div>}

        {/* Info Card */}
        <MobileCard className="overflow-hidden">
          <div className="flex flex-col items-center text-center pb-6 border-b border-slate-100 dark:border-slate-800">
            <div className="relative mb-3">
              <div className="size-24 rounded-full overflow-hidden border-4 border-indigo-50 dark:border-indigo-900/30 flex items-center justify-center bg-slate-100 dark:bg-slate-800">
                {me?.avatarUrl ? (
                  <img src={me.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <MobileAvatar name={me?.nome || "?"} size="lg" />
                )}
              </div>
              <label className="absolute bottom-0 right-0 size-8 bg-primary text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white dark:border-slate-900 cursor-pointer hover:bg-primary-dark transition-colors disabled:opacity-50">
                {uploading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                ) : (
                  <span className="material-symbols-outlined text-sm">photo_camera</span>
                )}
                <input 
                  type="file" 
                  accept="image/jpeg,image/png,image/jpg" 
                  onChange={handleFotoUpload} 
                  className="hidden" 
                  disabled={uploading}
                />
              </label>
            </div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">{me?.nome || "Carregando..."}</h2>
            <p className="text-sm text-slate-500">{me?.email}</p>
            <span className="mt-2 inline-block px-3 py-1 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold uppercase tracking-widest rounded-full">Aluno Ativo</span>
          </div>
          
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Celular</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5">{me?.celular || "Não informado"}</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Matrícula</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5">#{me?.id || "..."}</p>
              </div>
            </div>
          </div>
          <div className="px-4 pb-4">
            <MobileButton variant="ghost" fullWidth icon="edit" onClick={openEdit}>Editar Informações</MobileButton>
          </div>
        </MobileCard>

        {/* Segurança */}
        <MobileCard>
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-indigo-600 dark:text-indigo-400">lock</span>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Segurança</h3>
          </div>
          <p className="text-xs text-slate-500 mb-4">Mantenha sua conta segura atualizando sua senha regularmente.</p>
          <MobileButton variant="secondary" fullWidth icon="password" onClick={passSheet.open}>Alterar Senha</MobileButton>
        </MobileCard>

        {/* Logout */}
        <MobileButton variant="danger" fullWidth icon="logout" onClick={logoutSheet.open}>Sair da Conta</MobileButton>

        <div className="text-center pt-4 pb-8">
          <p className="text-xs text-slate-400">Precisa de ajuda? <a href="/suporte" className="text-primary font-bold hover:underline">Fale com o Suporte</a></p>
        </div>
      </div>

      {/* Edit Sheet */}
      <BottomSheet isOpen={editSheet.isOpen} onClose={editSheet.close} title="Editar Informações">
        <div className="space-y-4">
          <MobileInput label="Nome Completo" icon="person" value={nome} onChange={(e) => setNome(e.target.value)} />
          <MobileInput label="Celular" icon="call" placeholder="(11) 90000-0000" value={telefone} onChange={(e) => setTelefone(e.target.value)} />
          <div className="grid grid-cols-2 gap-3 pt-2">
            <MobileButton variant="secondary" fullWidth onClick={editSheet.close}>Cancelar</MobileButton>
            <MobileButton variant="primary" fullWidth loading={atualizarPerfil.isPending} onClick={handleSaveInfo}>Salvar</MobileButton>
          </div>
        </div>
      </BottomSheet>

      {/* Password Sheet */}
      <BottomSheet isOpen={passSheet.isOpen} onClose={passSheet.close} title="Alterar Senha">
        <div className="space-y-4">
          <MobileInput label="Senha Atual" type="password" icon="lock" placeholder="••••••••" value={senhaAtual} onChange={(e) => setSenhaAtual(e.target.value)} />
          <div>
            <MobileInput label="Nova Senha" type="password" icon="key" placeholder="Mínimo 6 caracteres" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} />
            {strength && (
              <div className="mt-2 flex gap-1 h-1 px-1">
                <div className={`flex-1 rounded-full ${strength.width >= 25 ? strength.bar : "bg-slate-200 dark:bg-slate-800"}`} />
                <div className={`flex-1 rounded-full ${strength.width >= 50 ? strength.bar : "bg-slate-200 dark:bg-slate-800"}`} />
                <div className={`flex-1 rounded-full ${strength.width >= 75 ? strength.bar : "bg-slate-200 dark:bg-slate-800"}`} />
                <div className={`flex-1 rounded-full ${strength.width >= 100 ? strength.bar : "bg-slate-200 dark:bg-slate-800"}`} />
              </div>
            )}
          </div>
          <MobileInput label="Confirmar Nova Senha" type="password" icon="check" placeholder="Repetir senha" value={confirmarSenha} onChange={(e) => setConfirmarSenha(e.target.value)} />
          <div className="grid grid-cols-2 gap-3 pt-2">
            <MobileButton variant="secondary" fullWidth onClick={passSheet.close}>Cancelar</MobileButton>
            <MobileButton variant="primary" fullWidth loading={atualizarSenha.isPending} onClick={handleUpdatePassword}>Atualizar</MobileButton>
          </div>
        </div>
      </BottomSheet>

      {/* Logout Sheet */}
      <BottomSheet isOpen={logoutSheet.isOpen} onClose={logoutSheet.close} title="Sair da Conta">
        <div className="text-center space-y-4">
          <div className="size-14 bg-rose-100 dark:bg-rose-950/40 rounded-full flex items-center justify-center mx-auto text-rose-500">
            <span className="material-symbols-outlined text-2xl">logout</span>
          </div>
          <div>
            <p className="text-base font-bold text-slate-900 dark:text-white">Deseja realmente sair?</p>
            <p className="text-sm text-slate-500 mt-1">Sua sessão será encerrada no dispositivo.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <MobileButton variant="secondary" fullWidth onClick={logoutSheet.close}>Cancelar</MobileButton>
            <MobileButton variant="danger" fullWidth onClick={() => logout.mutate()}>Sair</MobileButton>
          </div>
        </div>
      </BottomSheet>
    </MobileLayout>
  );
}
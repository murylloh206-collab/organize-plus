import { useNavigate } from "react-router-dom";
import BottomSheet from "../ui/BottomSheet";
import MobileButton from "../ui/MobileButton";
import { useNotifications, type Notificacao } from "../../hooks/useNotifications";
import { formatRelativeTime } from "../../lib/utils";

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const tipoConfig: Record<string, { icon: string; color: string; bgColor: string }> = {
  pagamento: {
    icon: "payments",
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/40",
  },
  rifa: {
    icon: "confirmation_number",
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-50 dark:bg-purple-950/40",
  },
  sistema: {
    icon: "info",
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-950/40",
  },
};

export default function NotificationModal({ isOpen, onClose }: NotificationModalProps) {
  const navigate = useNavigate();
  const { notificacoes, isLoading, marcarComoLida, marcarTodasLidas, naoLidas } = useNotifications();

  const handleNotificationClick = (notif: Notificacao) => {
    // Marcar como lida se ainda não foi lida
    if (!notif.lida) {
      marcarComoLida.mutate(notif.id);
    }

    // Redirecionar baseado no tipo
    if (notif.tipo === "pagamento") {
      navigate("/aluno/pagamentos");
    } else if (notif.tipo === "rifa") {
      navigate("/aluno/rifas");
    }

    onClose();
  };

  const handleMarcarTodasLidas = () => {
    if (naoLidas > 0) {
      marcarTodasLidas.mutate();
    }
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Notificações" maxHeight="80vh">
      <div className="space-y-4">
        {/* Header actions */}
        {naoLidas > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              {naoLidas} não {naoLidas === 1 ? "lida" : "lidas"}
            </span>
            <MobileButton
              variant="ghost"
              size="sm"
              icon="done_all"
              onClick={handleMarcarTodasLidas}
              disabled={marcarTodasLidas.isPending}
            >
              Marcar todas como lidas
            </MobileButton>
          </div>
        )}

        {/* Lista de notificações */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3 p-3">
                <div className="skeleton size-10 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-4 w-3/4" />
                  <div className="skeleton h-3 w-full" />
                  <div className="skeleton h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : notificacoes.length === 0 ? (
          <div className="text-center py-12">
            <span className="material-symbols-outlined text-5xl text-slate-300 dark:text-slate-600 block mb-3">
              notifications_off
            </span>
            <p className="text-sm text-slate-500 font-medium">Nenhuma notificação</p>
            <p className="text-xs text-slate-400 mt-1">Você será notificado quando houver novidades</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notificacoes.map((notif) => {
              const config = tipoConfig[notif.tipo] || tipoConfig.sistema;
              return (
                <button
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`w-full text-left p-3 rounded-xl transition-all active:scale-[0.98] ${
                    notif.lida
                      ? "bg-slate-50 dark:bg-slate-800/50 opacity-70"
                      : "bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700"
                  }`}
                  aria-label={`${notif.titulo}: ${notif.mensagem}`}
                >
                  <div className="flex gap-3">
                    {/* Ícone do tipo */}
                    <div
                      className={`size-10 rounded-full flex items-center justify-center shrink-0 ${config.bgColor}`}
                    >
                      <span className={`material-symbols-outlined text-[20px] ${config.color}`}>
                        {config.icon}
                      </span>
                    </div>

                    {/* Conteúdo */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={`text-sm font-bold truncate ${
                            notif.lida
                              ? "text-slate-500 dark:text-slate-400"
                              : "text-slate-900 dark:text-white"
                          }`}
                        >
                          {notif.titulo}
                        </p>
                        {!notif.lida && (
                          <span className="size-2 rounded-full bg-indigo-500 shrink-0 mt-1.5" />
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                        {notif.mensagem}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">
                        {formatRelativeTime(notif.createdAt)}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </BottomSheet>
  );
}

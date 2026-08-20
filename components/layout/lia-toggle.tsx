'use client';

import { HugeiconsIcon } from '@hugeicons/react';
import { PlayIcon, PauseIcon } from '@hugeicons/core-free-icons';
import { api } from '@/lib/trpc/client';

/**
 * Play/pause global de Lia. Pausada, o agente descarta em silêncio toda mensagem
 * que chega pelo WhatsApp — por isso o estado pausado é sinalizado com rótulo,
 * e não só com o ícone.
 */
export function LiaToggle() {
  const utils = api.useUtils();
  const { data: isActive, isPending, error } = api.lia.getStatus.useQuery(undefined, {
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
    retry: false,
  });

  const mutation = api.lia.setStatus.useMutation({
    onSuccess: (next) => utils.lia.getStatus.setData(undefined, next),
    // Falhou a escrita: o estado exibido pode ter ficado velho.
    onError: () => utils.lia.getStatus.invalidate(),
  });

  const paused = isActive === false;
  const busy = isPending || mutation.isPending;

  if (error) {
    return (
      <span
        role="status"
        title={error.message}
        className="flex items-center gap-1.5 px-2 py-1 text-xs text-muted-foreground"
      >
        <HugeiconsIcon icon={PauseIcon} size={16} strokeWidth={1.5} />
        Lia indisponível
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => mutation.mutate({ isActive: paused })}
      disabled={busy}
      aria-label="Pausar Lia"
      aria-pressed={paused}
      title={mutation.error?.message ?? (paused ? 'Lia pausada — retomar atendimento' : 'Pausar Lia')}
      className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-colors hover:bg-surface-2 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
        paused ? 'text-primary' : 'text-muted-foreground'
      }`}
    >
      <HugeiconsIcon icon={paused ? PlayIcon : PauseIcon} size={16} strokeWidth={1.5} />
      {paused && 'Lia pausada'}
    </button>
  );
}

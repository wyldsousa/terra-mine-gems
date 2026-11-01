import { Trophy, UserRound, Clock, ChevronDown } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { GAME_INFO } from "@/data/landGames";
import { useEurUsd } from "@/hooks/useEurUsd";
import { fmtCur } from "@/components/land/LandPages";
import { publicTotal, RANK_GAMES, type PublicRow, type PublicPeriod } from "@/lib/publicRanking";
import { LandRentIcon } from '@/components/land/LandRentIcon';

export function PublicProfile({ rows, userId, position, onClose }: { rows: PublicRow[]; userId: string | null; position: number | null; onClose: () => void }) {
  const fx = useEurUsd();
  const personal = rows.filter(r => r.user_id === userId);
  const profile = personal[0];
  const periods: [string, PublicPeriod][] = [["Diário", "daily_income"], ["Semanal", "weekly_income"], ["Mensal", "monthly_income"], ["Anual", "yearly_income"]];
  const monthly = publicTotal(rows, userId ?? '', 'monthly_income', fx.rate);
  const updated = personal.reduce((latest, r) => [latest, r.stats_updated_at, r.profile_updated_at].sort().at(-1) ?? latest, '');
  return <Dialog open={userId !== null} onOpenChange={open => { if (!open) onClose(); }}>
    <DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-lg p-4 sm:p-5">
      <div className="flex items-center gap-3 pr-6">
        {profile?.avatar_url ? <img src={profile.avatar_url} alt={`Foto de ${profile.display_name}`} width={48} height={48} className="h-12 w-12 shrink-0 rounded-md object-cover" /> : <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-secondary"><UserRound className="h-6 w-6 text-muted-foreground" /></div>}
        <div className="min-w-0"><DialogTitle className="break-words text-lg">{profile?.display_name ?? 'Perfil não disponibilizado'}</DialogTitle><DialogDescription className="mt-1 flex items-center gap-1 text-xs"><Trophy className="h-3 w-3 text-primary"/>{position ? `#${position} neste ranking` : 'Não disponibilizado neste ranking'}</DialogDescription></div>
      </div>
      {!profile ? <p className="text-sm text-muted-foreground">Perfil não disponibilizado.</p> : <>
        <div className="divide-y divide-border">
          {RANK_GAMES.map(game => {
            const info = GAME_INFO[game];
            const row = personal.find(r => r.game === game);
            const money = (value: number | null | undefined) => value == null ? 'Não disponibilizado' : fmtCur(Number(value), row?.currency === 'EUR' ? 'EUR' : 'USD');
            const unit = game === 'terramine' ? 'minas' : 'terrenos';
            return <details key={game} className="py-3 group">
              <summary className="flex cursor-pointer list-none items-center gap-2" aria-label={`Detalhes de ${info.name}`}>
                <span className="shrink-0">{game === 'land-rents' ? <LandRentIcon className="h-5 w-5"/> : info.emoji}</span>
                <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{info.name}</span><span className="block text-xs text-muted-foreground">{row?.units_count == null ? 'Não disponibilizado' : `${row.units_count} ${unit}`}</span></span>
                <span className="max-w-[45%] break-words text-right text-xs font-semibold num">{money(row?.monthly_income)}{row?.monthly_income != null && <span className="block font-normal text-muted-foreground">/mês{game === 'land-rents' ? ' · simulação' : ''}</span>}</span>
                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground group-open:rotate-180"/>
              </summary>
              <div className="mt-3 space-y-3 border-l-2 border-primary/30 pl-3 text-xs" aria-label={`Resumo de ${info.name}`}>
                <p>{row?.units_count == null ? 'Quantidade: Não disponibilizado' : `${row.units_count} ${unit}`}</p>
                <div className="grid grid-cols-2 gap-3">{periods.map(([label,key]) => <div key={key}><p className="text-muted-foreground">{label}</p><p className="num mt-1 break-words font-medium">{money(row?.[key])}</p></div>)}</div>
                {game === 'land-rents' && <><p>Emblemas: {row?.badges ?? 'Não disponibilizado'} · Boost: {row?.normal_multiplier == null ? 'Não disponibilizado' : `${row.normal_multiplier}×`} · Bônus: {row?.badge_percent == null ? 'Não disponibilizado' : `${row.badge_percent}%`}</p><p>Rent Rush: {row?.event_enabled == null ? 'Não disponibilizado' : row.event_enabled ? 'Ativado' : 'Desativado'}</p><p>Evento: {money(row?.event_total)} · Adicional: {money(row?.event_additional)}</p><p className="text-muted-foreground">Simulação · não sacável.</p></>}
              </div>
            </details>;
          })}
        </div>
        <div className="border-t border-border pt-3"><p className="text-xs text-muted-foreground">Total mensal estimado · USD · inclui simulações</p><p className="num mt-1 text-xl font-semibold text-primary">{monthly.value === null ? 'Não disponibilizado' : fmtCur(monthly.value, 'USD')}</p>{monthly.available < 4 && <p className="mt-1 text-xs text-muted-foreground">Total parcial{monthly.conversionMissing ? ' · cotação indisponível' : ''}.</p>}</div>
        <details className="text-xs"><summary className="cursor-pointer text-muted-foreground">Resumo geral por período</summary><div className="mt-3 grid grid-cols-2 gap-3">{periods.map(([label,key]) => {const total = publicTotal(rows,userId ?? '',key,fx.rate);return <div key={key}><p className="text-muted-foreground">{label}</p><p className="num mt-1">{total.value === null ? 'Não disponibilizado' : fmtCur(total.value,'USD')}</p></div>;})}</div></details>
        <p className="flex items-center gap-1 text-[11px] text-muted-foreground"><Clock className="h-3 w-3"/>{updated ? new Date(updated).toLocaleString('pt-BR') : 'Não disponibilizado'}</p>
      </>}
    </DialogContent>
  </Dialog>;
}

import { Trophy, UserRound, Clock } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { GAME_INFO } from "@/data/landGames";
import { useEurUsd } from "@/hooks/useEurUsd";
import { fmtCur } from "@/components/land/LandPages";
import { publicTotal, RANK_GAMES, type PublicRow, type PublicPeriod } from "@/lib/publicRanking";

export function PublicProfile({ rows, userId, position, onClose }: { rows: PublicRow[]; userId: string | null; position: number | null; onClose: () => void }) {
  const fx = useEurUsd();
  const personal = rows.filter((r) => r.user_id === userId);
  const profile = personal[0];
  const periods: [string, PublicPeriod][] = [["Diário", "daily_income"], ["Semanal", "weekly_income"], ["Mensal", "monthly_income"], ["Anual", "yearly_income"]];
  const monthly = publicTotal(rows, userId ?? "", "monthly_income", fx.rate);
  const updated = personal.reduce((latest, r) => [latest, r.stats_updated_at, r.profile_updated_at].sort().at(-1) ?? latest, "");
  return <Dialog open={userId !== null} onOpenChange={(open) => { if (!open) onClose(); }}>
    <DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto rounded-lg p-5 sm:p-7">
      <div className="flex items-center gap-4 pr-6">
        {profile?.avatar_url ? <img src={profile.avatar_url} alt={`Foto de ${profile.display_name}`} width={88} height={88} className="h-20 w-20 shrink-0 rounded-full object-cover ring-2 ring-primary/40" /> : <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-secondary"><UserRound className="h-9 w-9 text-muted-foreground" /></div>}
        <div className="min-w-0">
          <DialogTitle className="break-words text-2xl">{profile?.display_name ?? "Perfil não disponibilizado"}</DialogTitle>
          <DialogDescription className="mt-2 flex items-center gap-2"><Trophy className="h-4 w-4 text-primary" />{position ? `#${position} neste ranking` : "Não disponibilizado neste ranking"}</DialogDescription>
        </div>
      </div>
      {!profile ? <p className="text-muted-foreground">Este perfil não está mais disponível publicamente.</p> : <>
        <div className="grid gap-3 sm:grid-cols-3">
          {RANK_GAMES.map((game) => {
            const info = GAME_INFO[game];
            const r = personal.find((row) => row.game === game);
            return <div key={game} className="rounded-lg border border-border bg-card p-4">
              <p className="font-semibold">{info.emoji} {info.name}</p>
              <p className="num mt-3 break-words text-lg font-semibold">{r?.monthly_income != null ? fmtCur(Number(r.monthly_income), r.currency === "EUR" ? "EUR" : "USD") : "Não disponibilizado"}</p>
              <p className="text-xs text-muted-foreground">Rendimento mensal estimado</p>
              <p className="mt-3 text-sm text-muted-foreground">{r?.units_count != null ? `${r.units_count} ${info.units}` : "Quantidade: Não disponibilizado"}</p>
            </div>;
          })}
        </div>
        <div className="border-y border-border py-4">
          <p className="text-xs uppercase text-muted-foreground">Total mensal público · USD</p>
          <p className="num mt-1 text-3xl font-bold text-primary">{monthly.value === null ? "Não disponibilizado" : fmtCur(monthly.value, "USD")}</p>
          {monthly.available < 3 && <p className="mt-2 text-xs text-muted-foreground">Total parcial: somente rendimentos disponibilizados{monthly.conversionMissing ? "; aguardando cotação EUR→USD" : ""}.</p>}
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {periods.map(([label, key]) => {
            const total = publicTotal(rows, userId ?? "", key, fx.rate);
            return <div key={key}><p className="text-xs text-muted-foreground">{label} público</p><p className="num mt-1 break-words text-sm font-semibold">{total.value === null ? "Não disponibilizado" : fmtCur(total.value, "USD")}</p></div>;
          })}
        </div>
        {personal.some((r) => r.currency === "EUR" && r.monthly_income !== null) && <p className="text-xs text-muted-foreground">{fx.rate ? `1 € = US$ ${fx.rate.toFixed(4)}${fx.stale ? " · última cotação disponível" : ""}` : "Cotação EUR→USD indisponível; valores em euros não entram no total."}</p>}
        <p className="flex items-center gap-2 text-xs text-muted-foreground"><Clock className="h-3 w-3" />Informações atualizadas: {updated ? new Date(updated).toLocaleString("pt-BR") : "Não disponibilizado"}</p>
      </>}
    </DialogContent>
  </Dialog>;
}
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { MessageCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useAppState } from "@/hooks/useAppState";
import { useGameMode } from "@/hooks/useGameMode";
import { interpretChat, recordEarning } from "@/lib/chat.functions";
import { CURRENCY_BY_GAME, type ChatAction } from "@/lib/chatActions";

type Msg = { id: string; role: "user" | "assistant"; content: string; actions?: ChatAction[]; done?: boolean };
const GAME = { atlas: "Atlas Earth", fortune: "Fortune World", terramine: "TerraMine", "land-rents": "Land Rent" } as const;

function describe(a: ChatAction) {
  if (a.kind === "earning") return `Registrar ${a.amount} ${CURRENCY_BY_GAME[a.game]} (${GAME[a.game]}) · origem: ${a.source}`;
  const what = a.game === "terramine" ? `mina(s)${a.mineType ? ` ${a.mineType}` : ""}${a.level ? ` nível ${a.level}` : ""}` : a.game === "land-rents" ? "terreno(s)" : `${a.rarity}`;
  const verb = a.op === "add" ? "Adicionar" : a.op === "remove" ? "Remover" : "Definir total";
  return `${verb} ${a.quantity} ${what} · ${GAME[a.game]}`;
}

export function ChatAI() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const ask = useServerFn(interpretChat);
  const save = useServerFn(recordEarning);
  const { mines, addMines, removeMines } = useAppState();
  const { setLand, setLandRent, landRent } = useGameMode();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);

  const push = (m: Omit<Msg, "id">) => setMsgs((p) => [...p, { ...m, id: crypto.randomUUID() }]);

  const send = async () => {
    const content = text.trim();
    if (!content || busy) return;
    const history = [...msgs, { id: "", role: "user" as const, content }].slice(-12).map(({ role, content }) => ({ role, content }));
    push({ role: "user", content });
    setText(""); setBusy(true);
    try {
      const r = await ask({ data: { messages: history } });
      if (!r.ok) push({ role: "assistant", content: r.error });
      else push({ role: "assistant", content: r.question || r.reply, actions: r.question ? [] : r.actions });
    } catch (e) { console.error("chat request", e); push({ role: "assistant", content: `Falha ao contatar o servidor (${e instanceof Error ? e.message.slice(0, 120) : "erro desconhecido"}). Nada foi alterado.` }); }
    finally { setBusy(false); }
  };

  const apply = async (m: Msg) => {
    if (!m.actions?.length || m.done || busy) return;
    setBusy(true);
    const results: string[] = [];
    for (const [i, a] of m.actions.entries()) {
      try {
        if (a.kind === "earning") {
          const r = await save({ data: { dedupeKey: `${m.id}:${i}`, game: a.game, amount: a.amount, source: a.source } });
          results.push(r.ok ? `✅ ${describe(a)}` : `❌ Não salvo: ${describe(a)}`);
        } else if (a.game === "terramine") {
          if (a.op === "add") addMines(Array.from({ length: a.quantity }, () => ({ type: a.mineType!, level: a.level ?? 1 })));
          else {
            const pool = mines.filter((x) => !a.mineType || x.type === a.mineType);
            const n = a.op === "remove" ? a.quantity : Math.max(pool.length - a.quantity, 0);
            if (a.op === "set" && a.quantity > pool.length) { if (!a.mineType) { results.push("❌ Informe o tipo de mina para aumentar o total."); continue; } addMines(Array.from({ length: a.quantity - pool.length }, () => ({ type: a.mineType!, level: a.level ?? 1 }))); }
            else removeMines(pool.slice(-n).map((x) => x.id));
          }
          results.push(`✅ ${describe(a)}`);
        } else if (a.game === "land-rents") {
          const plots = Math.min(Math.max(a.op === "add" ? landRent.plots + a.quantity : a.op === "remove" ? landRent.plots - a.quantity : a.quantity, 0), 10000);
          setLandRent({ ...landRent, plots });
          results.push(`✅ ${describe(a)}`);
        } else {
          const id = a.rarity!;
          setLand(a.game, (s) => {
            const cur = Number(s.counts[id]) || 0;
            const next = Math.max(a.op === "add" ? cur + a.quantity : a.op === "remove" ? cur - a.quantity : a.quantity, 0);
            return { ...s, counts: { ...s.counts, [id]: next } };
          });
          results.push(`✅ ${describe(a)}`);
        }
      } catch { results.push(`❌ Falhou: ${describe(a)}`); }
    }
    setMsgs((p) => p.map((x) => (x.id === m.id ? { ...x, done: true } : x)));
    push({ role: "assistant", content: results.join("\n") });
    await qc.invalidateQueries({ queryKey: ["coin-earnings"] });
    setBusy(false);
  };

  return (
    <>
      <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => setOpen(true)}><MessageCircle className="h-4 w-4" /> Chat IA</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="flex max-h-[85vh] flex-col">
          <DialogHeader><DialogTitle>Chat IA</DialogTitle></DialogHeader>
          {!user ? (
            <p className="text-sm text-muted-foreground">Entre na sua conta para usar o Chat IA. <Link to="/auth" className="text-primary" onClick={() => setOpen(false)}>Entrar</Link></p>
          ) : (
            <>
              <div className="flex-1 space-y-2 overflow-y-auto text-sm" data-testid="chat-log">
                {!msgs.length && <p className="text-muted-foreground">Ex.: “Adicionei 3 terrenos raros no Atlas” ou “Ganhei 50 AB na roleta”.</p>}
                {msgs.map((m) => (
                  <div key={m.id} className={m.role === "user" ? "ml-8 rounded-lg bg-secondary p-2" : "mr-8 rounded-lg border border-border p-2"}>
                    <p className="whitespace-pre-line">{m.content}</p>
                    {!!m.actions?.length && (
                      <div className="mt-2 space-y-1 border-t border-border pt-2">
                        {m.actions.map((a, i) => <p key={i} className="text-xs">• {describe(a)}</p>)}
                        <Button size="sm" disabled={m.done || busy} onClick={() => apply(m)}>{m.done ? "Aplicado" : "Confirmar"}</Button>
                      </div>
                    )}
                  </div>
                ))}
                {busy && <p className="text-xs text-muted-foreground">Pensando…</p>}
              </div>
              <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); void send(); }}>
                <Input value={text} maxLength={1000} onChange={(e) => setText(e.target.value)} placeholder="Digite sua mensagem" aria-label="Mensagem" />
                <Button type="submit" size="icon" disabled={busy || !text.trim()} aria-label="Enviar"><Send className="h-4 w-4" /></Button>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

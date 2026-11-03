import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { CURRENCY_BY_GAME, chatResultSchema, validateActions } from "./chatActions";

const SYSTEM = `Você é o assistente do app de calculadoras (TerraMine, Atlas Earth, Fortune World, Land Rent). Entenda português informal, abreviações e erros de digitação.
Responda SOMENTE JSON: {"reply": string, "question": string|null, "actions": Action[]}.
Action de itens: {"kind":"items","game":"atlas"|"fortune"|"terramine"|"land-rents","op":"add"|"remove"|"set","quantity":int,"rarity":string|null,"mineType":"rock"|"coal"|"gold"|"diamond"|null,"level":int|null}
- Atlas raridades: common, rare, epic, legendary. Fortune: common, uncommon, rare, epic, legendary. "set" = definir total.
- TerraMine exige mineType (rock/pedra, coal/carvão, gold/ouro, diamond/diamante); level padrão 1 se não informado.
Action de ganho: {"kind":"earning","game":"atlas"|"fortune"|"terramine","amount":number,"source":string}
- AB/Atlas Bucks=atlas, FC/Fortune Coins=fortune, TB/Terra Bucks=terramine. source curto em português minúsculo (ex.: "pesquisa","roleta","mine games","arcade","outros").
Regras: só crie ações para fatos/pedidos reais e explícitos. Hipóteses, perguntas ("e se eu ganhar...") ou planos futuros NÃO geram ações. Se faltar raridade, tipo de mina, jogo, quantidade ou a intenção for ambígua, deixe actions vazio e faça a pergunta em "question". Nunca diga que salvou algo: o app confirma depois de salvar. "reply" curto descrevendo o que será feito.`;

const input = z.object({
  messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().min(1).max(1000) })).min(1).max(12),
});

export const interpretChat = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => input.parse(d))
  .handler(async ({ data }) => {
    const { generateChatCompletion, GatewayError, PaymentRequiredError, RateLimitError } = await import("@lovable.dev/ai-gateway");
    try {
      const res = await generateChatCompletion({
        model: "openai/gpt-6-astra",
        response_format: { type: "json_object" },
        messages: [{ role: "system", content: SYSTEM }, ...data.messages],
      });
      const text = res.choices?.[0]?.message?.content;
      const parsed = chatResultSchema.safeParse(JSON.parse(typeof text === "string" ? text : "{}"));
      if (!parsed.success) return { ok: false as const, error: "Não entendi a resposta da IA. Tente reformular." };
      return { ok: true as const, reply: parsed.data.reply, question: parsed.data.question ?? null, actions: validateActions(parsed.data.actions) };
    } catch (e) {
      if (e instanceof GatewayError) {
        console.error("chat gateway", e.code);
        if (e instanceof PaymentRequiredError) return { ok: false as const, error: "Créditos de IA esgotados no workspace." };
        if (e instanceof RateLimitError) return { ok: false as const, error: "Muitas mensagens agora. Aguarde um pouco." };
      } else console.error("chat error");
      return { ok: false as const, error: "A IA não respondeu. Tente novamente." };
    }
  });

const earningInput = z.object({
  dedupeKey: z.string().min(8).max(120),
  game: z.enum(["atlas", "fortune", "terramine"]),
  amount: z.number().positive().max(100000000),
  source: z.string().trim().min(1).max(60),
});

/** Records one coin earning for the signed-in user; resending the same key never duplicates. */
export const recordEarning = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => earningInput.parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("coin_earnings").upsert(
      { user_id: context.userId, dedupe_key: data.dedupeKey, game: data.game, currency: CURRENCY_BY_GAME[data.game], amount: data.amount, source: data.source.toLowerCase() },
      { onConflict: "user_id,dedupe_key", ignoreDuplicates: true },
    );
    if (error) { console.error("earning insert", error.code); return { ok: false as const }; }
    return { ok: true as const };
  });

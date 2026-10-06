import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Nova senha — TerraMine Calculator" },
      { name: "description", content: "Defina uma nova senha para sua conta." },
      { property: "og:title", content: "Nova senha — TerraMine Calculator" },
      { property: "og:description", content: "Defina uma nova senha para sua conta." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPage,
});

function ResetPage() {
  const navigate = useNavigate();
  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");
  const [busy, setBusy] = useState(false);
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (p1.length < 6) { toast.error("A senha precisa ter pelo menos 6 caracteres."); return; }
    if (p1 !== p2) { toast.error("As senhas não coincidem."); return; }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: p1 });
    setBusy(false);
    if (error) toast.error("Não foi possível alterar: link expirado ou inválido. Peça um novo.");
    else { toast.success("Senha alterada!"); navigate({ to: "/perfil" }); }
  };
  return (
    <form onSubmit={save} className="panel mx-auto max-w-md space-y-3 p-5">
      <h1 className="font-display text-2xl font-bold">🔑 Nova senha</h1>
      <div className="space-y-1"><Label htmlFor="a">Nova senha</Label><Input id="a" type="password" autoComplete="new-password" value={p1} onChange={(e) => setP1(e.target.value)} /></div>
      <div className="space-y-1"><Label htmlFor="b">Confirmar senha</Label><Input id="b" type="password" autoComplete="new-password" value={p2} onChange={(e) => setP2(e.target.value)} /></div>
      <Button type="submit" className="w-full" disabled={busy}>{busy ? "Salvando..." : "Salvar nova senha"}</Button>
    </form>
  );
}

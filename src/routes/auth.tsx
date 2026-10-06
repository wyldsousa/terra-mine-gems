import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — TerraMine Calculator" },
      { name: "description", content: "Entre ou crie sua conta com e-mail e senha para usar perfil e ranking." },
      { property: "og:title", content: "Entrar — TerraMine Calculator" },
      { property: "og:description", content: "Entre ou crie sua conta com e-mail e senha para usar perfil e ranking." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function translate(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("invalid login")) return "E-mail ou senha incorretos.";
  if (m.includes("already registered") || m.includes("already exists")) return "Este e-mail já está cadastrado. Faça login.";
  if (m.includes("email not confirmed")) return "Confirme seu e-mail antes de entrar (verifique sua caixa de entrada).";
  if (m.includes("invalid") && m.includes("email")) return "E-mail inválido.";
  if (m.includes("password") && (m.includes("weak") || m.includes("pwned") || m.includes("at least"))) return "Senha fraca: use pelo menos 6 caracteres, evitando senhas comuns.";
  if (m.includes("rate limit")) return "Muitas tentativas. Aguarde alguns minutos.";
  return "Erro: " + msg;
}

type Tab = "login" | "signup" | "forgot";

function AuthPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [pass2, setPass2] = useState("");
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => { if (user) navigate({ to: "/perfil" }); }, [user, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInfo(null);
    const em = email.trim();
    if (!EMAIL_RE.test(em)) return toast.error("E-mail inválido.");
    setBusy(true);
    try {
      if (tab === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email: em, password: pass });
        if (error) toast.error(translate(error.message));
        else { toast.success("Bem-vindo!"); navigate({ to: "/perfil" }); }
      } else if (tab === "signup") {
        if (!name.trim()) return toast.error("Informe o nome do jogador.");
        if (pass.length < 6) return toast.error("A senha precisa ter pelo menos 6 caracteres.");
        if (pass !== pass2) return toast.error("As senhas não coincidem.");
        const { data, error } = await supabase.auth.signUp({
          email: em, password: pass,
          options: { emailRedirectTo: window.location.origin + "/perfil", data: { full_name: name.trim().slice(0, 40) } },
        });
        if (error) toast.error(translate(error.message));
        else if (data.user && data.user.identities?.length === 0) toast.error("Este e-mail já está cadastrado. Faça login.");
        else if (!data.session) setInfo("Conta criada! Enviamos um link de confirmação para " + em + ". Abra-o para ativar sua conta e depois entre.");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(em, { redirectTo: window.location.origin + "/reset-password" });
        if (error) toast.error(translate(error.message));
        else setInfo("Se o e-mail estiver cadastrado, você receberá um link para criar nova senha.");
      }
    } finally { setBusy(false); }
  };

  return (
    <div className="mx-auto max-w-md space-y-5">
      <h1 className="font-display text-2xl font-bold">🔐 {tab === "login" ? "Entrar" : tab === "signup" ? "Criar conta" : "Esqueci minha senha"}</h1>
      <p className="text-sm text-muted-foreground">As calculadoras funcionam sem conta. A conta serve só para o perfil e o ranking.</p>
      <div className="flex gap-2">
        <Button variant={tab === "login" ? "default" : "outline"} onClick={() => { setTab("login"); setInfo(null); }}>Entrar</Button>
        <Button variant={tab === "signup" ? "default" : "outline"} onClick={() => { setTab("signup"); setInfo(null); }}>Criar conta</Button>
      </div>
      <form onSubmit={submit} className="panel space-y-3 p-5">
        {tab === "signup" && (
          <div className="space-y-1"><Label htmlFor="n">Nome do jogador</Label><Input id="n" maxLength={40} value={name} onChange={(e) => setName(e.target.value)} /></div>
        )}
        <div className="space-y-1"><Label htmlFor="e">E-mail</Label><Input id="e" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        {tab !== "forgot" && (
          <div className="space-y-1"><Label htmlFor="p">Senha</Label><Input id="p" type="password" autoComplete={tab === "login" ? "current-password" : "new-password"} value={pass} onChange={(e) => setPass(e.target.value)} /></div>
        )}
        {tab === "signup" && (
          <div className="space-y-1"><Label htmlFor="p2">Confirmar senha</Label><Input id="p2" type="password" autoComplete="new-password" value={pass2} onChange={(e) => setPass2(e.target.value)} /></div>
        )}
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? "Aguarde..." : tab === "login" ? "Entrar" : tab === "signup" ? "Criar conta" : "Enviar recuperação para o e-mail"}
        </Button>
        {info && <p className="rounded-md border border-border p-3 text-sm">{info}</p>}
        {tab === "login" && <button type="button" className="text-sm text-primary" onClick={() => { setTab("forgot"); setInfo(null); }}>Esqueci minha senha</button>}
        {tab === "forgot" && <button type="button" className="text-sm text-primary" onClick={() => setTab("login")}>Voltar para entrar</button>}
      </form>
    </div>
  );
}

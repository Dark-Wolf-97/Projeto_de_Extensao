import { useEffect, useState } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { UsuarioService } from "@/services/UsuarioService";
import { useAuth } from "@/context/AuthContext";
import { httpErrorMessage } from "@/services/http";
import { toast } from "sonner";
import { Check, KeyRound, User, X } from "lucide-react";

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Administrador",
  SECRETARIA: "Secretária",
  MEDICO: "Médico",
};

const ROLE_CLASS: Record<string, string> = {
  ADMIN: "bg-gold text-gold-foreground hover:bg-gold",
  SECRETARIA: "bg-primary text-primary-foreground hover:bg-primary",
  MEDICO: "bg-accent text-accent-foreground hover:bg-accent",
};

interface SenhaRequisito {
  label: string;
  ok: (s: string) => boolean;
}

const SENHA_REQUISITOS: SenhaRequisito[] = [
  { label: "Mínimo 6 caracteres", ok: (s) => s.length >= 6 },
  { label: "Letra maiúscula",     ok: (s) => /[A-Z]/.test(s) },
  { label: "Letra minúscula",     ok: (s) => /[a-z]/.test(s) },
  { label: "Número",              ok: (s) => /\d/.test(s) },
  { label: "Caractere especial",  ok: (s) => /[^a-zA-Z\d\s]/.test(s) },
];

function formatTelefone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length === 0) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

interface FormDados {
  nome: string;
  email: string;
  telefone: string;
  crm: string;
  especialidade: string;
}

interface FormSenha {
  novaSenha: string;
  confirmar: string;
}

export default function Configuracoes() {
  const { user: authUser, isMedico, updateUser } = useAuth();

  const [dados, setDados] = useState<FormDados>({
    nome: "", email: "", telefone: "", crm: "", especialidade: "",
  });
  const [senha, setSenha] = useState<FormSenha>({ novaSenha: "", confirmar: "" });
  const [role, setRole] = useState("");
  const [salvandoDados, setSalvandoDados] = useState(false);
  const [salvandoSenha, setSalvandoSenha] = useState(false);

  useEffect(() => {
    UsuarioService.me()
      .then((u) => {
        setRole(u.role);
        setDados({
          nome: u.nome ?? "",
          email: u.email ?? "",
          telefone: formatTelefone(u.telefone ?? ""),
          crm: u.crm ?? "",
          especialidade: u.especialidade ?? "",
        });
      })
      .catch(() => toast.error("Erro ao carregar dados do perfil"));
  }, []);

  const initials = dados.nome
    ? dados.nome.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "US";

  const set = <K extends keyof FormDados>(field: K, value: string) =>
    setDados((d) => ({ ...d, [field]: value }));

  const handleSalvarDados = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvandoDados(true);
    try {
      await UsuarioService.atualizarMe({
        nome: dados.nome.trim(),
        email: dados.email.trim(),
        telefone: dados.telefone || undefined,
        crm: dados.crm || undefined,
        especialidade: dados.especialidade || undefined,
      });
      updateUser({ nome: dados.nome.trim(), email: dados.email.trim() });
      toast.success("Dados atualizados com sucesso!");
    } catch (err) {
      const { detail } = httpErrorMessage(err);
      toast.error(detail || "Erro ao atualizar dados");
    } finally {
      setSalvandoDados(false);
    }
  };

  const handleSalvarSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!SENHA_REQUISITOS.every((r) => r.ok(senha.novaSenha))) {
      toast.error("A senha não atende a todos os requisitos");
      return;
    }
    if (senha.novaSenha !== senha.confirmar) {
      toast.error("As senhas não coincidem");
      return;
    }
    setSalvandoSenha(true);
    try {
      await UsuarioService.atualizarMe({ senha: senha.novaSenha });
      toast.success("Senha alterada com sucesso!");
      setSenha({ novaSenha: "", confirmar: "" });
    } catch (err) {
      const { detail } = httpErrorMessage(err);
      toast.error(detail || "Erro ao alterar senha");
    } finally {
      setSalvandoSenha(false);
    }
  };

  return (
    <PageShell title="Configurações" subtitle="Gerencie as informações da sua conta" centerTitle>
      <div className="flex justify-center">
        <div className="w-full max-w-2xl flex flex-col gap-6">

          {/* Perfil resumido */}
          <Card>
            <CardContent className="pt-6 flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col gap-1">
                <p className="text-lg font-semibold">{dados.nome || authUser?.nome}</p>
                <p className="text-sm text-muted-foreground">{dados.email || authUser?.email}</p>
                <Badge className={ROLE_CLASS[role] ?? ""}>
                  {ROLE_LABEL[role] ?? role}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Dados pessoais */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="h-4 w-4" />
                Dados Pessoais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSalvarDados} className="grid gap-4">

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="nome">Nome completo</Label>
                    <Input
                      id="nome"
                      value={dados.nome}
                      onChange={(e) => set("nome", e.target.value.replace(/[^a-zA-ZÀ-ÿ\s]/g, ""))}
                      placeholder="Nome completo"
                      required
                      maxLength={100}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      value={dados.email}
                      onChange={(e) => set("email", e.target.value)}
                      placeholder="email@exemplo.com"
                      required
                      maxLength={150}
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    value={dados.telefone}
                    onChange={(e) => set("telefone", formatTelefone(e.target.value))}
                    placeholder="(44) 99999-9999"
                    maxLength={16}
                  />
                </div>

                {isMedico() && (
                  <>
                    <Separator />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="crm">CRM</Label>
                        <Input
                          id="crm"
                          value={dados.crm}
                          onChange={(e) => set("crm", e.target.value)}
                          placeholder="CRM-PR-12345"
                          maxLength={20}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="especialidade">Especialidade</Label>
                        <Input
                          id="especialidade"
                          value={dados.especialidade}
                          onChange={(e) => set("especialidade", e.target.value)}
                          placeholder="Ex: Clínica Geral"
                          maxLength={100}
                        />
                      </div>
                    </div>
                  </>
                )}

                <div className="flex justify-end">
                  <Button type="submit" disabled={salvandoDados} className="bg-primary hover:bg-primary/90">
                    {salvandoDados ? "Salvando..." : "Salvar Dados"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Alterar senha */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <KeyRound className="h-4 w-4" />
                Alterar Senha
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSalvarSenha} className="grid gap-4">

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="novaSenha">Nova senha</Label>
                    <Input
                      id="novaSenha"
                      type="password"
                      value={senha.novaSenha}
                      onChange={(e) => setSenha((s) => ({ ...s, novaSenha: e.target.value }))}
                      placeholder="••••••••"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="confirmar">Confirmar nova senha</Label>
                    <Input
                      id="confirmar"
                      type="password"
                      value={senha.confirmar}
                      onChange={(e) => setSenha((s) => ({ ...s, confirmar: e.target.value }))}
                      placeholder="Repita a nova senha"
                    />
                  </div>
                </div>

                {senha.novaSenha && (
                  <ul className="grid grid-cols-2 gap-1">
                    {SENHA_REQUISITOS.map((r) => {
                      const ok = r.ok(senha.novaSenha);
                      return (
                        <li
                          key={r.label}
                          className={`flex items-center gap-1 text-xs ${ok ? "text-green-600" : "text-muted-foreground"}`}
                        >
                          {ok ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                          {r.label}
                        </li>
                      );
                    })}
                  </ul>
                )}

                <div className="flex justify-end">
                  <Button type="submit" disabled={salvandoSenha} variant="outline">
                    {salvandoSenha ? "Alterando..." : "Alterar Senha"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

        </div>
      </div>
    </PageShell>
  );
}

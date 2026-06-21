import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UsuarioService, Usuario, Role } from "@/services/UsuarioService";
import { toast } from "sonner";
import { Check, X } from "lucide-react";

interface SenhaRequisito {
  label: string;
  ok: (s: string) => boolean;
}

const SENHA_REQUISITOS: SenhaRequisito[] = [
  { label: "Mínimo 6 caracteres", ok: (s) => s.length >= 6 },
  { label: "Letra maiúscula", ok: (s) => /[A-Z]/.test(s) },
  { label: "Letra minúscula", ok: (s) => /[a-z]/.test(s) },
  { label: "Número", ok: (s) => /\d/.test(s) },
  { label: "Caractere especial", ok: (s) => /[^a-zA-Z\d\s]/.test(s) },
];

function formatTelefone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length === 0) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSaved?: () => void;
  usuario?: Usuario | null;
}

const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: "ADMIN", label: "Administrador" },
  { value: "SECRETARIA", label: "Secretária" },
  { value: "MEDICO", label: "Médico" },
];

const FORM_INICIAL: Omit<Usuario, "id" | "createdAt" | "updatedAt"> = {
  nome: "",
  email: "",
  senha: "",
  role: "SECRETARIA",
  crm: "",
  especialidade: "",
  telefone: "",
};

export function UsuarioModal({ open, onOpenChange, onSaved, usuario }: Props) {
  const [form, setForm] = useState(FORM_INICIAL);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;

    if (usuario) {
      setForm({
        nome: usuario.nome,
        email: usuario.email,
        senha: "",
        role: usuario.role,
        crm: usuario.crm ?? "",
        especialidade: usuario.especialidade ?? "",
        telefone: formatTelefone(usuario.telefone ?? ""),
      });
    } else {
      setForm(FORM_INICIAL);
    }
  }, [open, usuario]);

  const set = (field: keyof typeof form, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!usuario && !form.senha) {
      toast.error("Informe uma senha para o novo usuário");
      return;
    }

    if (form.senha && !SENHA_REQUISITOS.every((r) => r.ok(form.senha!))) {
      toast.error("A senha não atende a todos os requisitos");
      return;
    }

    setSaving(true);

    try {
      const payload: Partial<typeof form> = {
        nome: form.nome,
        email: form.email,
        role: form.role,
        telefone: form.telefone || undefined,
      };

      if (form.role === "MEDICO") {
        payload.crm = form.crm || undefined;
        payload.especialidade = form.especialidade || undefined;
      }

      if (form.senha) {
        payload.senha = form.senha;
      }

      if (usuario?.id) {
        await UsuarioService.atualizar(usuario.id, payload);
        toast.success("Usuário atualizado com sucesso!");
      } else {
        await UsuarioService.criar({ ...payload, senha: form.senha } as typeof form);
        toast.success("Usuário criado com sucesso!");
      }

      onSaved?.();
      onOpenChange(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("409")) {
        toast.error("E-mail já cadastrado para outro usuário");
      } else {
        toast.error("Erro ao salvar usuário");
      }
    } finally {
      setSaving(false);
    }
  };

  const isMedico = form.role === "MEDICO";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="text-primary">
            {usuario ? "Editar Usuário" : "Novo Usuário"}
          </DialogTitle>
          <DialogDescription>
            Preencha os dados de acesso do usuário.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="nome">Nome</Label>
            <Input
              id="nome"
              value={form.nome}
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
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="email@exemplo.com"
              required
              maxLength={150}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="senha">
              {usuario ? "Nova senha (deixe vazio para manter)" : "Senha"}
            </Label>
            <Input
              id="senha"
              type="password"
              value={form.senha ?? ""}
              onChange={(e) => set("senha", e.target.value)}
              placeholder={usuario ? "••••••••" : "Mínimo 6 caracteres"}
            />
            {form.senha && (
              <ul className="grid grid-cols-2 gap-1 mt-1">
                {SENHA_REQUISITOS.map((r) => {
                  const ok = r.ok(form.senha!);
                  return (
                    <li key={r.label} className={`flex items-center gap-1 text-xs ${ok ? "text-green-600" : "text-muted-foreground"}`}>
                      {ok ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                      {r.label}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="role">Perfil</Label>
            <select
              id="role"
              className="border rounded-md h-10 px-3 bg-background text-sm"
              value={form.role}
              onChange={(e) => set("role", e.target.value as Role)}
            >
              {ROLE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="telefone">Telefone</Label>
            <Input
              id="telefone"
              value={form.telefone ?? ""}
              onChange={(e) => set("telefone", formatTelefone(e.target.value))}
              placeholder="(11) 99999-9999"
              maxLength={16}
            />
          </div>

          {isMedico && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="crm">CRM</Label>
                <Input
                  id="crm"
                  value={form.crm ?? ""}
                  onChange={(e) => set("crm", e.target.value)}
                  placeholder="CRM-SP-12345"
                  maxLength={20}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="especialidade">Especialidade</Label>
                <Input
                  id="especialidade"
                  value={form.especialidade ?? ""}
                  onChange={(e) => set("especialidade", e.target.value)}
                  placeholder="Ex: Clínica Geral"
                  maxLength={100}
                  required
                />
              </div>
            </>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

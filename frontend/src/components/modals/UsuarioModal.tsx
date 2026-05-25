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

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSaved?: () => void;
  usuario?: Usuario | null;
}

export function UsuarioModal({ open, onOpenChange, onSaved, usuario }: Props) {
  const [form, setForm] = useState<Usuario>({
    name: "",
    email: "",
    password: "",
    role: "USER",
    active: true,
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && usuario) {
      setForm({
        id: usuario.id,
        name: usuario.name ?? "",
        email: usuario.email,
        password: "",
        role: usuario.role,
        active: usuario.active ?? true,
      });
    }

    if (open && !usuario) {
      setForm({
        name: "",
        email: "",
        password: "",
        role: "USER",
        active: true,
      });
    }
  }, [open, usuario]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!usuario && !form.password) {
      toast.error("Informe uma senha para o novo usuário");
      return;
    }

    setSaving(true);

    try {
      const payload: Partial<Usuario> = {
        name: form.name,
        email: form.email,
        role: form.role,
        active: form.active,
      };

      if (form.password) {
        payload.password = form.password;
      }

      if (usuario?.id) {
        await UsuarioService.atualizar(usuario.id, payload);
        toast.success("Usuário atualizado com sucesso!");
      } else {
        await UsuarioService.criar(payload as Usuario);
        toast.success("Usuário criado com sucesso!");
      }

      onSaved?.();
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao salvar usuário");
    } finally {
      setSaving(false);
    }
  };

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
            <Label>Nome</Label>
            <Input
              value={form.name ?? ""}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Nome do usuário"
            />
          </div>

          <div className="grid gap-2">
            <Label>E-mail</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="email@exemplo.com"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label>Senha</Label>
            <Input
              type="password"
              value={form.password ?? ""}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder={usuario ? "Deixe vazio para manter a senha" : "Senha"}
            />
          </div>

          <div className="grid gap-2">
            <Label>Perfil</Label>
            <select
              className="border rounded-md h-10 px-3 bg-background"
              value={form.role}
              onChange={(e) =>
                setForm({ ...form, role: e.target.value as Role })
              }
            >
              <option value="USER">Usuário</option>
              <option value="ADMIN">Administrador</option>
            </select>
          </div>

          <div className="grid gap-2">
            <Label>Status</Label>
            <select
              className="border rounded-md h-10 px-3 bg-background"
              value={form.active ? "true" : "false"}
              onChange={(e) =>
                setForm({ ...form, active: e.target.value === "true" })
              }
            >
              <option value="true">Ativo</option>
              <option value="false">Inativo</option>
            </select>
          </div>

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
import { useState, useEffect } from "react";
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
import { PacienteService, Paciente } from "@/services/PacienteService";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSaved?: () => void;
  paciente?: Paciente | null; // <- se vier, é edição
}

export function NovoPacienteModal({ open, onOpenChange, onSaved, paciente }: Props) {
  const [form, setForm] = useState<Paciente>({
    nome: "",
    cpf: "",
    telefone: "",
    email: "",
    dataNascimento: "",
  });

  const [saving, setSaving] = useState(false);

  // Preenche o form quando for edição
  useEffect(() => {
    if (paciente) {
      setForm(paciente);
    } else {
      setForm({
        nome: "",
        cpf: "",
        telefone: "",
        email: "",
        dataNascimento: "",
      });
    }
  }, [paciente, open]);

  const isEdit = !!paciente?.id;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (isEdit) {
        await PacienteService.atualizar(paciente!.id!, form);
        toast.success("Paciente atualizado com sucesso!");
      } else {
        await PacienteService.criar(form);
        toast.success("Paciente criado com sucesso!");
      }

      onSaved?.();
      onOpenChange(false);
    } catch {
      toast.error("Erro ao salvar paciente.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="text-primary">
            {isEdit ? "Editar Paciente" : "Novo Paciente"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Atualize os dados do paciente."
              : "Preencha os dados para cadastrar um paciente."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label>Nome</Label>
            <Input
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label>CPF</Label>
            <Input
              value={form.cpf}
              onChange={(e) => setForm({ ...form, cpf: e.target.value })}
              placeholder="000.000.000-00"
            />
          </div>

          <div className="grid gap-2">
            <Label>Telefone</Label>
            <Input
              value={form.telefone}
              onChange={(e) => setForm({ ...form, telefone: e.target.value })}
              placeholder="(00) 00000-0000"
            />
          </div>

          <div className="grid gap-2">
            <Label>Email</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>

          <div className="grid gap-2">
            <Label>Data de Nascimento</Label>
            <Input
              type="date"
              value={form.dataNascimento || ""}
              onChange={(e) =>
                setForm({ ...form, dataNascimento: e.target.value })
              }
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>

            <Button type="submit" disabled={saving} className="bg-primary hover:bg-primary/90">
              {saving
                ? "Salvando..."
                : isEdit
                ? "Atualizar"
                : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
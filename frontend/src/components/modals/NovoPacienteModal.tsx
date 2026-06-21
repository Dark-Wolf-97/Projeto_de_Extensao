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

function calcularDigito(digits: string, pesoInicial: number): number {
  let soma = 0;
  for (let i = 0; i < pesoInicial - 1; i++) {
    soma += parseInt(digits[i]) * (pesoInicial - i);
  }
  const resto = (soma * 10) % 11;
  return resto >= 10 ? 0 : resto;
}

function validarCpf(cpf: string): boolean {
  const d = cpf.replace(/\D/g, "");
  if (d.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(d)) return false;
  return (
    calcularDigito(d, 10) === parseInt(d[9]) &&
    calcularDigito(d, 11) === parseInt(d[10])
  );
}

function formatCpf(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

function formatTelefone(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length === 0) return "";
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSaved?: () => void;
  paciente?: Paciente | null;
}

const FORM_INICIAL = { nome: "", cpf: "", telefone: "", dataNascimento: "" };

function getDateLimits() {
  const today = new Date();
  const max = today.toISOString().split("T")[0];
  const min = new Date(today.getFullYear() - 120, today.getMonth(), today.getDate())
    .toISOString()
    .split("T")[0];
  return { min, max };
}

export function NovoPacienteModal({ open, onOpenChange, onSaved, paciente }: Props) {
  const [form, setForm] = useState(FORM_INICIAL);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (paciente) {
      setForm({
        nome: paciente.nome,
        cpf: formatCpf(paciente.cpf),
        telefone: formatTelefone(paciente.telefone),
        dataNascimento: paciente.dataNascimento
          ? paciente.dataNascimento.split("T")[0]
          : "",
      });
    } else {
      setForm(FORM_INICIAL);
    }
  }, [open, paciente]);

  const set = (field: keyof typeof form, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  const isEdit = !!paciente?.id;

  const cpfCompleto = form.cpf.replace(/\D/g, "").length === 11;
  const cpfInvalido = cpfCompleto && !validarCpf(form.cpf);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validarCpf(form.cpf)) {
      toast.error("CPF inválido");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        nome: form.nome,
        cpf: form.cpf,
        telefone: form.telefone,
        dataNascimento: form.dataNascimento || undefined,
      };

      if (isEdit) {
        await PacienteService.atualizar(paciente!.id!, payload);
        toast.success("Paciente atualizado com sucesso!");
      } else {
        await PacienteService.criar(payload);
        toast.success("Paciente cadastrado com sucesso!");
      }

      onSaved?.();
      onOpenChange(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("409")) {
        toast.error("CPF já cadastrado para outro paciente");
      } else {
        toast.error("Erro ao salvar paciente");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="text-primary">
            {isEdit ? "Editar Paciente" : "Novo Paciente"}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? "Atualize os dados do paciente." : "Preencha os dados para cadastrar um paciente."}
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
            <Label htmlFor="cpf">CPF</Label>
            <Input
              id="cpf"
              value={form.cpf}
              onChange={(e) => set("cpf", formatCpf(e.target.value))}
              placeholder="000.000.000-00"
              required
              maxLength={14}
              className={cpfInvalido ? "border-destructive focus-visible:ring-destructive" : ""}
            />
            {cpfInvalido && (
              <p className="text-xs text-destructive">CPF inválido</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="telefone">Telefone</Label>
            <Input
              id="telefone"
              value={form.telefone}
              onChange={(e) => set("telefone", formatTelefone(e.target.value))}
              placeholder="(11) 99999-9999"
              required
              maxLength={16}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="dataNascimento">Data de Nascimento</Label>
            <Input
              id="dataNascimento"
              type="date"
              value={form.dataNascimento}
              onChange={(e) => set("dataNascimento", e.target.value)}
              min={getDateLimits().min}
              max={getDateLimits().max}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={saving || cpfInvalido}
              className="bg-primary hover:bg-primary/90"
            >
              {saving ? "Salvando..." : isEdit ? "Atualizar" : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

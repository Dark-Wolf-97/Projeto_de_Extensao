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
import { httpErrorMessage } from "@/services/http";
import { toast } from "@/components/ui/sonner";

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

const FORM_INICIAL = { nome: "", cpf: "", telefone: "", dataNascimento: "", convenio: "" };

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
        cpf: formatCpf(paciente.cpf ?? ""),
        telefone: formatTelefone(paciente.telefone),
        dataNascimento: paciente.dataNascimento
          ? paciente.dataNascimento.split("T")[0]
          : "",
        convenio: paciente.convenio ?? "",
      });
    } else {
      setForm(FORM_INICIAL);
    }
  }, [open, paciente]);

  const set = (field: keyof typeof form, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  const isEdit = !!paciente?.id;

  const cpfPreenchido = form.cpf.replace(/\D/g, "").length > 0;
  const cpfInvalido = cpfPreenchido && !validarCpf(form.cpf);
  const telefoneValido = [10, 11].includes(form.telefone.replace(/\D/g, "").length);
  const telefoneInvalido = Boolean(form.telefone) && !telefoneValido;
  const canSubmit = Boolean(form.nome.trim()) && !cpfInvalido && telefoneValido;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (cpfInvalido) {
      toast.error("CPF inválido");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        nome: form.nome,
        cpf: form.cpf ? form.cpf : null,
        telefone: form.telefone,
        dataNascimento: form.dataNascimento || undefined,
        convenio: form.convenio ? form.convenio : null,
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
      const { status, detail } = httpErrorMessage(err);
      if (status === "409") {
        toast.error("CPF já cadastrado para outro paciente");
      } else if (status === "400" && detail) {
        toast.error(detail);
      } else {
        toast.error(err);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[720px]">
        <DialogHeader className="border-b pb-4 pr-8">
          <DialogTitle>
            {isEdit ? "Editar Paciente" : "Novo Paciente"}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? "Atualize os dados do paciente." : "Preencha os dados para cadastrar um paciente."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} autoComplete="off" className="grid gap-5 py-1">
          <p className="text-xs text-muted-foreground"><span className="text-destructive" aria-hidden="true">*</span> Campos obrigatórios</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="nome" className="after:ml-1 after:text-destructive after:content-['*']">Nome</Label>
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
              inputMode="numeric"
              maxLength={14}
              className={cpfInvalido ? "border-destructive focus-visible:ring-destructive" : ""}
            />
            {cpfInvalido && (
              <p className="text-xs text-destructive">CPF inválido</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="telefone" className="after:ml-1 after:text-destructive after:content-['*']">Telefone</Label>
            <Input
              id="telefone"
              value={form.telefone}
              onChange={(e) => set("telefone", formatTelefone(e.target.value))}
              placeholder="(11) 99999-9999"
              inputMode="tel"
              required
              maxLength={16}
              className={telefoneInvalido ? "border-destructive focus-visible:ring-destructive" : ""}
            />
            {telefoneInvalido && <p className="text-xs text-destructive">Informe um telefone válido</p>}
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

          <div className="grid gap-2">
            <Label htmlFor="convenio">Convênio</Label>
            <Input
              id="convenio"
              value={form.convenio}
              onChange={(e) => set("convenio", e.target.value)}
              placeholder="Ex: Unimed, Particular"
              maxLength={100}
            />
          </div>
          </div>

          <DialogFooter className="border-t pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={saving || !canSubmit}
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

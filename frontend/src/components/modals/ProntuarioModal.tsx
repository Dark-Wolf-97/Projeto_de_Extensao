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
import { Textarea } from "@/components/ui/textarea";
import { PacienteService, Paciente } from "@/services/PacienteService";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function ProntuarioModal({ open, onOpenChange }: Props) {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [form, setForm] = useState({
    paciente: "",
    data: new Date().toISOString().slice(0, 10),
    queixa: "",
    diagnostico: "",
    prescricao: "",
    observacoes: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) PacienteService.listar().then(setPacientes);
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Endpoint presumido /prontuarios — quando estiver pronto no backend,
      // basta criar ProntuarioService.criar(form).
      await new Promise((r) => setTimeout(r, 400));
      toast.success("Prontuário cadastrado!");
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-primary">Cadastrar Prontuário</DialogTitle>
          <DialogDescription>Registre os dados clínicos do atendimento.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="p-paciente">Paciente</Label>
              <Input
                id="p-paciente"
                list="lista-pacientes-prontuario"
                value={form.paciente}
                onChange={(e) => setForm({ ...form, paciente: e.target.value })}
                required
              />
              <datalist id="lista-pacientes-prontuario">
                {pacientes.map((p) => (
                  <option key={p.id} value={p.nome} />
                ))}
              </datalist>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="p-data">Data</Label>
              <Input
                id="p-data"
                type="date"
                value={form.data}
                onChange={(e) => setForm({ ...form, data: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="queixa">Queixa Principal</Label>
            <Textarea
              id="queixa"
              rows={2}
              value={form.queixa}
              onChange={(e) => setForm({ ...form, queixa: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="diag">Diagnóstico</Label>
            <Textarea
              id="diag"
              rows={2}
              value={form.diagnostico}
              onChange={(e) => setForm({ ...form, diagnostico: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="presc">Prescrição</Label>
            <Textarea
              id="presc"
              rows={3}
              value={form.prescricao}
              onChange={(e) => setForm({ ...form, prescricao: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="obs">Observações</Label>
            <Textarea
              id="obs"
              rows={2}
              value={form.observacoes}
              onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving} className="bg-primary hover:bg-primary/90">
              {saving ? "Salvando..." : "Cadastrar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

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
import { ConsultaService, Consulta } from "@/services/ConsultaService";
import { PacienteService, Paciente } from "@/services/PacienteService";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSaved?: () => void;
}

export function NovaConsultaModal({ open, onOpenChange, onSaved }: Props) {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [form, setForm] = useState<Consulta>({
    pacienteNome: "",
    data: new Date().toISOString().slice(0, 10),
    hora: "08:00",
    medico: "",
    observacoes: "",
    status: "Agendada",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) PacienteService.listar().then(setPacientes);
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await ConsultaService.criar(form);
      toast.success("Consulta criado com sucesso!");
      onSaved?.();
      onOpenChange(false);
    } catch {
      toast.error("Não foi possível salvar. Verifique a conexão com o backend.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="text-primary">Nova Consulta</DialogTitle>
          <DialogDescription>Preencha os dados para agendar uma consulta.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="paciente">Paciente</Label>
            <Input
              id="paciente"
              list="lista-pacientes"
              value={form.pacienteNome}
              onChange={(e) => setForm({ ...form, pacienteNome: e.target.value })}
              placeholder="Selecione ou digite o nome"
              required
            />
            <datalist id="lista-pacientes">
              {pacientes.map((p) => (
                <option key={p.id} value={p.nome} />
              ))}
            </datalist>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="data">Data</Label>
              <Input
                id="data"
                type="date"
                value={form.data}
                onChange={(e) => setForm({ ...form, data: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="hora">Hora</Label>
              <Input
                id="hora"
                type="time"
                value={form.hora}
                onChange={(e) => setForm({ ...form, hora: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="medico">Médico</Label>
            <Input
              id="medico"
              value={form.medico}
              onChange={(e) => setForm({ ...form, medico: e.target.value })}
              placeholder="Dr(a). Nome"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="obs">Observações</Label>
            <Textarea
              id="obs"
              value={form.observacoes}
              onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving} className="bg-primary hover:bg-primary/90">
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

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
import { Textarea } from "@/components/ui/textarea";
import { ConsultaService, Consulta } from "@/services/ConsultaService";
import { PacienteService, Paciente } from "@/services/PacienteService";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSaved?: () => void;
  consulta?: Consulta | null;
}

export function NovaConsultaModal({
  open,
  onOpenChange,
  onSaved,
  consulta,
}: Props) {
  const [busca, setBusca] = useState("");
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [pacienteSelecionado, setPacienteSelecionado] =
    useState<Paciente | null>(null);

  const [form, setForm] = useState<Consulta>({
    data: new Date().toISOString().slice(0, 10),
    hora: "08:00",
    medico: "",
    observacoes: "",
    status: "Agendada",
  });

  const [saving, setSaving] = useState(false);

  // 🔍 busca paciente
  useEffect(() => {
    if (busca.length < 2) {
      setPacientes([]);
      return;
    }

    const timer = setTimeout(() => {
      PacienteService.buscar(busca).then(setPacientes);
    }, 300);

    return () => clearTimeout(timer);
  }, [busca]);

  // 🧠 preencher no EDIT
  useEffect(() => {
    if (open && consulta) {
      setForm({
        data: consulta.data,
        hora: consulta.hora,
        medico: consulta.medico ?? "",
        observacoes: consulta.observacoes ?? "",
        status: consulta.status ?? "Agendada",
      });

      if (consulta.pacienteId && consulta.pacienteNome) {
        setPacienteSelecionado({
          id: consulta.pacienteId,
          nome: consulta.pacienteNome,
        });
        setBusca(consulta.pacienteNome);
      }
    }
  }, [open, consulta]);

  // reset no CREATE
  useEffect(() => {
    if (open && !consulta) {
      setBusca("");
      setPacientes([]);
      setPacienteSelecionado(null);
      setForm({
        data: new Date().toISOString().slice(0, 10),
        hora: "08:00",
        medico: "",
        observacoes: "",
        status: "Agendada",
      });
    }
  }, [open, consulta]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!pacienteSelecionado?.id) {
      toast.error("Selecione um paciente válido");
      return;
    }

    setSaving(true);

    try {
      const payload: Consulta = {
        pacienteId: Number(pacienteSelecionado.id),
        pacienteNome: pacienteSelecionado.nome,
        data: form.data,
        hora: form.hora,
        medico: form.medico,
        observacoes: form.observacoes,
        status: form.status,
      };

      if (consulta?.id) {
        await ConsultaService.atualizar(consulta.id, payload);
        toast.success("Consulta atualizada com sucesso!");
      } else {
        await ConsultaService.criar(payload);
        toast.success("Consulta criada com sucesso!");
      }

      onSaved?.();
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao salvar consulta");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="text-primary">
            {consulta ? "Editar Consulta" : "Nova Consulta"}
          </DialogTitle>
          <DialogDescription>
            Busque e selecione um paciente antes de agendar.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4 py-2">

          {/* PACIENTE */}
          <div className="grid gap-2">
            <Label>Paciente</Label>

            <Input
              value={busca}
              onChange={(e) => {
                setBusca(e.target.value);
                setPacienteSelecionado(null);
              }}
              placeholder="Digite nome ou CPF"
            />

            {pacientes.length > 0 && (
              <div className="border rounded-md max-h-40 overflow-auto">
                {pacientes.map((p) => (
                  <div
                    key={p.id}
                    className="p-2 hover:bg-muted cursor-pointer"
                    onClick={() => {
                      setPacienteSelecionado(p);
                      setBusca(`${p.nome} - ${p.cpf ?? ""}`);
                      setPacientes([]);
                    }}
                  >
                    <div className="font-medium">{p.nome}</div>
                    <div className="text-xs text-muted-foreground">
                      {p.cpf}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {pacienteSelecionado && (
              <div className="text-sm text-green-600">
                ✔ Selecionado: {pacienteSelecionado.nome}
              </div>
            )}
          </div>

          {/* DATA + HORA */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              type="date"
              value={form.data}
              onChange={(e) =>
                setForm({ ...form, data: e.target.value })
              }
              required
            />

            <Input
              type="time"
              value={form.hora}
              onChange={(e) =>
                setForm({ ...form, hora: e.target.value })
              }
              required
            />
          </div>

          {/* MÉDICO */}
          <Input
            placeholder="Médico"
            value={form.medico}
            onChange={(e) =>
              setForm({ ...form, medico: e.target.value })
            }
          />

          {/* STATUS */}
          <select
            className="w-full border rounded p-2"
            value={form.status}
            onChange={(e) =>
              setForm({
                ...form,
                status: e.target.value as Consulta["status"],
              })
            }
          >
            <option value="Agendada">Agendada</option>
            <option value="Confirmada">Confirmada</option>
            <option value="Realizada">Realizada</option>
            <option value="Cancelada">Cancelada</option>
          </select>

          {/* OBS */}
          <Textarea
            placeholder="Observações"
            value={form.observacoes}
            onChange={(e) =>
              setForm({ ...form, observacoes: e.target.value })
            }
          />

          {/* FOOTER */}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
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
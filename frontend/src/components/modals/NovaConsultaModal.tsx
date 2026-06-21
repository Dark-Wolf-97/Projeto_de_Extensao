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
import { ConsultaService, Consulta, StatusConsulta } from "@/services/ConsultaService";
import { PacienteService, Paciente } from "@/services/PacienteService";
import { UsuarioService, MedicoResumo } from "@/services/UsuarioService";
import { httpErrorMessage } from "@/services/http";
import { toast } from "sonner";

const STATUS_OPTIONS: { value: StatusConsulta; label: string }[] = [
  { value: "AGENDADA", label: "Agendada" },
  { value: "CONFIRMADA", label: "Confirmada" },
  { value: "REALIZADA", label: "Realizada" },
  { value: "CANCELADA", label: "Cancelada" },
];

const FORM_INICIAL = {
  medicoId: 0,
  data: new Date().toISOString().split("T")[0],
  hora: "08:00",
  status: "AGENDADA" as StatusConsulta,
  observacoes: "",
};

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSaved?: () => void;
  consulta?: Consulta | null;
}

function isFutureDateTime(data: string, hora: string): boolean {
  const dt = new Date(`${data}T${hora}:00`);
  return dt > new Date();
}

export function NovaConsultaModal({ open, onOpenChange, onSaved, consulta }: Props) {
  const [form, setForm] = useState(FORM_INICIAL);

  // Paciente
  const [buscaPaciente, setBuscaPaciente] = useState("");
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [pacienteSelecionado, setPacienteSelecionado] = useState<Paciente | null>(null);

  // Médico
  const [buscaMedico, setBuscaMedico] = useState("");
  const [todosMedicos, setTodosMedicos] = useState<MedicoResumo[]>([]);
  const [medicosFiltrados, setMedicosFiltrados] = useState<MedicoResumo[]>([]);
  const [medicoSelecionado, setMedicoSelecionado] = useState<MedicoResumo | null>(null);

  const [saving, setSaving] = useState(false);

  // Carrega médicos apenas quando o modal abre pela primeira vez
  useEffect(() => {
    if (!open || todosMedicos.length > 0) return;
    UsuarioService.listarMedicos()
      .then(setTodosMedicos)
      .catch(() => toast.error("Erro ao carregar médicos"));
  }, [open]);

  // Filtra médicos conforme busca
  useEffect(() => {
    if (buscaMedico.length < 2 || medicoSelecionado) {
      setMedicosFiltrados([]);
      return;
    }
    const termo = buscaMedico.toLowerCase();
    setMedicosFiltrados(
      todosMedicos.filter((m) => m.nome.toLowerCase().includes(termo))
    );
  }, [buscaMedico, todosMedicos, medicoSelecionado]);

  // Busca pacientes com debounce
  useEffect(() => {
    if (buscaPaciente.length < 2 || pacienteSelecionado) {
      setPacientes([]);
      return;
    }
    const timer = setTimeout(() => {
      PacienteService.buscar(buscaPaciente).then(setPacientes).catch(() => {});
    }, 300);
    return () => clearTimeout(timer);
  }, [buscaPaciente, pacienteSelecionado]);

  // Preenche no modo edição / limpa no modo criação
  useEffect(() => {
    if (!open) return;

    if (consulta) {
      setForm({
        medicoId: consulta.medicoId,
        data: consulta.data.split("T")[0],
        hora: consulta.hora,
        status: consulta.status,
        observacoes: consulta.observacoes ?? "",
      });
      if (consulta.paciente) {
        setPacienteSelecionado({ id: consulta.paciente.id, nome: consulta.paciente.nome, cpf: consulta.paciente.cpf });
        setBuscaPaciente(consulta.paciente.nome);
      }
      if (consulta.medico) {
        const m: MedicoResumo = { id: consulta.medico.id, nome: consulta.medico.nome, crm: consulta.medico.crm, especialidade: consulta.medico.especialidade };
        setMedicoSelecionado(m);
        setBuscaMedico(m.nome);
      }
    } else {
      setForm(FORM_INICIAL);
      setBuscaPaciente("");
      setPacientes([]);
      setPacienteSelecionado(null);
      setBuscaMedico("");
      setMedicosFiltrados([]);
      setMedicoSelecionado(null);
    }
  }, [open, consulta]);

  const set = <K extends keyof typeof form>(field: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [field]: value }));

  const today = new Date().toISOString().split("T")[0];
  const dataInvalida = form.data && form.hora && !isFutureDateTime(form.data, form.hora);

  const isEdit = !!consulta?.id;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!pacienteSelecionado?.id) {
      toast.error("Selecione um paciente válido");
      return;
    }
    if (!medicoSelecionado?.id) {
      toast.error("Selecione um médico válido");
      return;
    }
    if (!isFutureDateTime(form.data, form.hora)) {
      toast.error("A data e hora devem ser no futuro");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        pacienteId: Number(pacienteSelecionado.id),
        medicoId: medicoSelecionado.id,
        data: form.data,
        hora: form.hora,
        status: form.status,
        observacoes: form.observacoes || undefined,
      };

      if (isEdit) {
        await ConsultaService.atualizar(consulta!.id!, payload);
        toast.success("Consulta atualizada com sucesso!");
      } else {
        await ConsultaService.criar(payload);
        toast.success("Consulta criada com sucesso!");
      }

      onSaved?.();
      onOpenChange(false);
    } catch (err) {
      const { status, detail } = httpErrorMessage(err);
      if (status === "409" || status === "400") {
        toast.error(detail);
      } else {
        toast.error("Erro ao salvar consulta");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-primary">
            {isEdit ? "Editar Consulta" : "Nova Consulta"}
          </DialogTitle>
          <DialogDescription>
            Busque o paciente e o médico pelo nome para agendar a consulta.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4 py-2">

          {/* Paciente */}
          <div className="grid gap-2">
            <Label>Paciente</Label>
            <Input
              value={buscaPaciente}
              onChange={(e) => {
                setBuscaPaciente(e.target.value.replace(/[^a-zA-ZÀ-ÿ\s]/g, ""));
                setPacienteSelecionado(null);
              }}
              placeholder="Digite o nome do paciente"
            />
            {pacientes.length > 0 && !pacienteSelecionado && (
              <div className="border rounded-md max-h-40 overflow-auto shadow-sm">
                {pacientes.map((p) => (
                  <div
                    key={p.id}
                    className="p-2 hover:bg-muted cursor-pointer"
                    onClick={() => {
                      setPacienteSelecionado(p);
                      setBuscaPaciente(p.nome);
                      setPacientes([]);
                    }}
                  >
                    <div className="font-medium text-sm">{p.nome}</div>
                    <div className="text-xs text-muted-foreground">{p.cpf}</div>
                  </div>
                ))}
              </div>
            )}
            {pacienteSelecionado && (
              <p className="text-xs text-green-600">✔ {pacienteSelecionado.nome} — {pacienteSelecionado.cpf}</p>
            )}
          </div>

          {/* Médico */}
          <div className="grid gap-2">
            <Label>Médico</Label>
            <Input
              value={buscaMedico}
              onChange={(e) => {
                setBuscaMedico(e.target.value.replace(/[^a-zA-ZÀ-ÿ\s]/g, ""));
                setMedicoSelecionado(null);
              }}
              placeholder="Digite o nome do médico"
            />
            {medicosFiltrados.length > 0 && !medicoSelecionado && (
              <div className="border rounded-md max-h-40 overflow-auto shadow-sm">
                {medicosFiltrados.map((m) => (
                  <div
                    key={m.id}
                    className="p-2 hover:bg-muted cursor-pointer"
                    onClick={() => {
                      setMedicoSelecionado(m);
                      setForm((f) => ({ ...f, medicoId: m.id }));
                      setBuscaMedico(m.nome);
                      setMedicosFiltrados([]);
                    }}
                  >
                    <div className="font-medium text-sm">{m.nome}</div>
                    <div className="text-xs text-muted-foreground">
                      {m.crm && <span>CRM: {m.crm}</span>}
                      {m.crm && m.especialidade && <span> · </span>}
                      {m.especialidade && <span>{m.especialidade}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {medicoSelecionado && (
              <p className="text-xs text-green-600">
                ✔ {medicoSelecionado.nome}
                {medicoSelecionado.crm && ` — CRM: ${medicoSelecionado.crm}`}
              </p>
            )}
          </div>

          {/* Data e Hora */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="data">Data</Label>
              <Input
                id="data"
                type="date"
                value={form.data}
                min={today}
                onChange={(e) => set("data", e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="hora">Hora</Label>
              <Input
                id="hora"
                type="time"
                value={form.hora}
                onChange={(e) => set("hora", e.target.value)}
                required
              />
            </div>
          </div>
          {dataInvalida && (
            <p className="text-xs text-destructive -mt-2">
              Data e hora devem ser no futuro
            </p>
          )}

          {/* Status */}
          <div className="grid gap-2">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              className="border rounded-md h-10 px-3 bg-background text-sm"
              value={form.status}
              onChange={(e) => set("status", e.target.value as StatusConsulta)}
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Observações */}
          <div className="grid gap-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              placeholder="Observações sobre a consulta (opcional)"
              value={form.observacoes}
              onChange={(e) => set("observacoes", e.target.value)}
              maxLength={1000}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={saving || !!dataInvalida}
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

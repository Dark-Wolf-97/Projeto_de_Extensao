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
import { toast } from "@/components/ui/sonner";

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
      .catch((err) => toast.error(err));
  }, [open, todosMedicos.length]);

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
      PacienteService.buscar(buscaPaciente)
        .then(setPacientes)
        .catch((err) => toast.error(err));
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
        setPacienteSelecionado({
          id: consulta.paciente.id,
          nome: consulta.paciente.nome,
          cpf: consulta.paciente.cpf,
          telefone: consulta.paciente.telefone ?? "",
        });
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

  const isEdit = !!consulta?.id;
  const today = new Date().toISOString().split("T")[0];
  const horarioFoiAlterado = !isEdit || consulta?.data.split("T")[0] !== form.data || consulta?.hora !== form.hora;
  const dataInvalida = Boolean(
    form.data && form.hora && horarioFoiAlterado && !isFutureDateTime(form.data, form.hora),
  );
  const canSubmit = Boolean(pacienteSelecionado?.id) && Boolean(medicoSelecionado?.id) && Boolean(form.data) && Boolean(form.hora) && !dataInvalida;

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
        toast.error(detail || err);
      } else {
        toast.error(err);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[760px]">
        <DialogHeader className="border-b pb-4 pr-8">
          <DialogTitle>
            {isEdit ? "Editar Consulta" : "Nova Consulta"}
          </DialogTitle>
          <DialogDescription>
            Busque o paciente e o médico pelo nome para agendar a consulta.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} autoComplete="off" className="grid gap-5 py-1">
          <p className="text-xs text-muted-foreground"><span className="text-destructive" aria-hidden="true">*</span> Campos obrigatórios</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

          <div className="grid gap-2">
            <Label htmlFor="paciente" className="after:ml-1 after:text-destructive after:content-['*']">Paciente</Label>
            <Input
              id="paciente"
              value={buscaPaciente}
              onChange={(e) => {
                setBuscaPaciente(e.target.value.replace(/[^a-zA-ZÀ-ÿ\s]/g, ""));
                setPacienteSelecionado(null);
              }}
              placeholder="Digite o nome do paciente"
            />
            {pacientes.length > 0 && !pacienteSelecionado && (
              <div className="max-h-40 overflow-auto rounded-md border bg-popover p-1 shadow-sm" role="listbox" aria-label="Resultados de pacientes">
                {pacientes.map((p) => (
                  <button
                    type="button"
                    key={p.id}
                    className="w-full rounded px-2 py-2 text-left hover:bg-muted focus:bg-muted focus:outline-none"
                    onClick={() => {
                      setPacienteSelecionado(p);
                      setBuscaPaciente(p.nome);
                      setPacientes([]);
                    }}
                  >
                    <div className="font-medium text-sm">{p.nome}</div>
                    <div className="text-xs text-muted-foreground">{p.cpf}</div>
                  </button>
                ))}
              </div>
            )}
            {pacienteSelecionado && (
              <p className="text-xs text-emerald-700">Paciente selecionado: {pacienteSelecionado.nome} · {pacienteSelecionado.cpf}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="medico" className="after:ml-1 after:text-destructive after:content-['*']">Médico</Label>
            <Input
              id="medico"
              value={buscaMedico}
              onChange={(e) => {
                setBuscaMedico(e.target.value.replace(/[^a-zA-ZÀ-ÿ\s]/g, ""));
                setMedicoSelecionado(null);
              }}
              placeholder="Digite o nome do médico"
            />
            {medicosFiltrados.length > 0 && !medicoSelecionado && (
              <div className="max-h-40 overflow-auto rounded-md border bg-popover p-1 shadow-sm" role="listbox" aria-label="Resultados de médicos">
                {medicosFiltrados.map((m) => (
                  <button
                    type="button"
                    key={m.id}
                    className="w-full rounded px-2 py-2 text-left hover:bg-muted focus:bg-muted focus:outline-none"
                    onClick={() => {
                      setMedicoSelecionado(m);
                      setForm((f) => ({ ...f, medicoId: m.id }));
                      setBuscaMedico(m.nome);
                      setMedicosFiltrados([]);
                    }}
                  >
                    <div className="font-medium text-sm">{m.nome}</div>
                    <div className="text-xs text-muted-foreground">
                      {m.crm && <span>Registro: {m.crm}</span>}
                      {m.crm && m.especialidade && <span> · </span>}
                      {m.especialidade && <span>{m.especialidade}</span>}
                    </div>
                  </button>
                ))}
              </div>
            )}
            {medicoSelecionado && (
              <p className="text-xs text-emerald-700">
                Médico selecionado: {medicoSelecionado.nome}
                {medicoSelecionado.crm && ` — Registro: ${medicoSelecionado.crm}`}
              </p>
            )}
          </div>

          <div className="grid gap-2">
              <Label htmlFor="data" className="after:ml-1 after:text-destructive after:content-['*']">Data</Label>
              <Input
                id="data"
                type="date"
                value={form.data}
                min={isEdit ? undefined : today}
                onChange={(e) => set("data", e.target.value)}
                required
              />
          </div>
          <div className="grid gap-2">
              <Label htmlFor="hora" className="after:ml-1 after:text-destructive after:content-['*']">Hora</Label>
              <Input
                id="hora"
                type="time"
                value={form.hora}
                onChange={(e) => set("hora", e.target.value)}
                required
              />
          </div>
          {dataInvalida && (
            <p className="text-xs text-destructive -mt-2 sm:col-span-2">
              Data e hora devem ser no futuro
            </p>
          )}

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

          <div className="grid gap-2 sm:col-span-2">
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

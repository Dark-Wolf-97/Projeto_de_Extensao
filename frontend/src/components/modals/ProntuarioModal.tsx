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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ProntuarioService, Prontuario } from "@/services/ProntuarioService";
import { Consulta } from "@/services/ConsultaService";
import { httpErrorMessage } from "@/services/http";
import { useAuth } from "@/context/AuthContext";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { toast } from "sonner";

const STATUS_LABEL: Record<string, string> = {
  AGENDADA: "Agendada",
  CONFIRMADA: "Confirmada",
  REALIZADA: "Realizada",
  CANCELADA: "Cancelada",
};

const STATUS_CLASS: Record<string, string> = {
  AGENDADA: "bg-blue-100 text-blue-800 border-blue-200",
  CONFIRMADA: "bg-green-100 text-green-800 border-green-200",
  REALIZADA: "bg-gray-100 text-gray-800 border-gray-200",
  CANCELADA: "bg-red-100 text-red-800 border-red-200",
};

function formatData(iso: string) {
  return new Date(iso.split("T")[0] + "T12:00:00").toLocaleDateString("pt-BR");
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  consulta: Consulta | null;
  onSaved?: () => void;
}

interface FormState {
  anamnese: string;
  diagnostico: string;
  prescricao: string;
  observacoes: string;
}

const FORM_VAZIO: FormState = {
  anamnese: "",
  diagnostico: "",
  prescricao: "",
  observacoes: "",
};

export function ProntuarioModal({ open, onOpenChange, consulta, onSaved }: Props) {
  const { user, isAdmin, isMedico } = useAuth();

  const [prontuario, setProntuario] = useState<Prontuario | null>(null);
  const [form, setForm] = useState<FormState>(FORM_VAZIO);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmarExcluir, setConfirmarExcluir] = useState(false);

  const canEdit = isAdmin() || (isMedico() && consulta?.medicoId === user?.id);
  const isCreate = canEdit && !prontuario;

  useEffect(() => {
    if (!open || !consulta?.id) {
      setProntuario(null);
      setForm(FORM_VAZIO);
      return;
    }

    setLoading(true);
    ProntuarioService.buscarPorConsulta(consulta.id)
      .then((p) => {
        setProntuario(p);
        setForm(
          p
            ? {
                anamnese: p.anamnese ?? "",
                diagnostico: p.diagnostico ?? "",
                prescricao: p.prescricao ?? "",
                observacoes: p.observacoes ?? "",
              }
            : FORM_VAZIO,
        );
      })
      .catch(() => toast.error("Erro ao carregar prontuário"))
      .finally(() => setLoading(false));
  }, [open, consulta?.id]);

  const set = <K extends keyof FormState>(field: K, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  const handleExcluir = async () => {
    if (!prontuario?.id) return;
    setDeleting(true);
    try {
      await ProntuarioService.deletar(prontuario.id);
      toast.success("Prontuário excluído com sucesso!");
      onSaved?.();
      onOpenChange(false);
    } catch (err) {
      const { detail } = httpErrorMessage(err);
      toast.error(detail || "Erro ao excluir prontuário");
    } finally {
      setDeleting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consulta?.id) return;

    setSaving(true);
    try {
      const payload = {
        anamnese: form.anamnese || undefined,
        diagnostico: form.diagnostico || undefined,
        prescricao: form.prescricao || undefined,
        observacoes: form.observacoes || undefined,
      };

      if (prontuario?.id) {
        await ProntuarioService.atualizar(prontuario.id, payload);
        toast.success("Prontuário atualizado com sucesso!");
      } else {
        await ProntuarioService.criar({ consultaId: consulta.id, ...payload });
        toast.success("Prontuário criado com sucesso!");
      }

      onSaved?.();
      onOpenChange(false);
    } catch (err) {
      const { status, detail } = httpErrorMessage(err);
      if (status === "403" || status === "409") {
        toast.error(detail);
      } else {
        toast.error("Erro ao salvar prontuário");
      }
    } finally {
      setSaving(false);
    }
  };

  const title = isCreate
    ? "Novo Prontuário"
    : canEdit
      ? "Editar Prontuário"
      : "Visualizar Prontuário";

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-primary">{title}</DialogTitle>
          {consulta && (
            <DialogDescription asChild>
              <div className="flex flex-wrap items-center gap-2 mt-1 text-sm">
                <span>
                  <strong>Paciente:</strong> {consulta.paciente?.nome ?? "—"}
                </span>
                <span>·</span>
                <span>
                  <strong>Médico:</strong> {consulta.medico?.nome ?? "—"}
                </span>
                <span>·</span>
                <span>
                  <strong>Data:</strong> {formatData(consulta.data)} às {consulta.hora}
                </span>
                <Badge variant="outline" className={STATUS_CLASS[consulta.status] ?? ""}>
                  {STATUS_LABEL[consulta.status] ?? consulta.status}
                </Badge>
              </div>
            </DialogDescription>
          )}
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center text-muted-foreground text-sm">
            Carregando prontuário...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="anamnese">Anamnese</Label>
              <Textarea
                id="anamnese"
                placeholder={canEdit ? "Histórico clínico do paciente..." : "—"}
                value={form.anamnese}
                onChange={(e) => set("anamnese", e.target.value)}
                readOnly={!canEdit}
                maxLength={5000}
                rows={4}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="diagnostico">Diagnóstico</Label>
              <Textarea
                id="diagnostico"
                placeholder={canEdit ? "Hipótese diagnóstica..." : "—"}
                value={form.diagnostico}
                onChange={(e) => set("diagnostico", e.target.value)}
                readOnly={!canEdit}
                maxLength={5000}
                rows={4}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="prescricao">Prescrição</Label>
              <Textarea
                id="prescricao"
                placeholder={canEdit ? "Medicamentos e orientações..." : "—"}
                value={form.prescricao}
                onChange={(e) => set("prescricao", e.target.value)}
                readOnly={!canEdit}
                maxLength={5000}
                rows={4}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="obs">Observações</Label>
              <Textarea
                id="obs"
                placeholder={canEdit ? "Observações adicionais..." : "—"}
                value={form.observacoes}
                onChange={(e) => set("observacoes", e.target.value)}
                readOnly={!canEdit}
                maxLength={5000}
                rows={3}
              />
            </div>

            <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-between">
              <div>
                {canEdit && prontuario?.id && (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={deleting}
                    onClick={() => setConfirmarExcluir(true)}
                    className="text-destructive hover:text-destructive/90 gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    {deleting ? "Excluindo..." : "Excluir"}
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  {canEdit ? "Cancelar" : "Fechar"}
                </Button>
                {canEdit && (
                  <Button
                    type="submit"
                    disabled={saving}
                    className="bg-primary hover:bg-primary/90"
                  >
                    {saving ? "Salvando..." : isCreate ? "Criar Prontuário" : "Salvar"}
                  </Button>
                )}
              </div>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>

    <ConfirmDialog
      open={confirmarExcluir}
      onOpenChange={setConfirmarExcluir}
      titulo="Excluir Prontuário"
      descricao="Deseja excluir este prontuário? Esta ação não pode ser desfeita."
      labelConfirmar="Excluir"
      carregando={deleting}
      onConfirmar={handleExcluir}
    />
    </>
  );
}

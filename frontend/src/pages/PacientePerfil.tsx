import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PageShell } from "@/components/layout/PageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { PacienteService, PacientePerfil as IPacientePerfil } from "@/services/PacienteService";
import { ArrowLeft, FileText, User } from "lucide-react";
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

function formatData(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso.split("T")[0] + "T12:00:00").toLocaleDateString("pt-BR");
}

export default function PacientePerfil() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [perfil, setPerfil] = useState<IPacientePerfil | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    PacienteService.buscarPerfil(Number(id))
      .then(setPerfil)
      .catch(() => toast.error("Paciente não encontrado"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <PageShell title="Carregando..." subtitle="">
        <p className="text-muted-foreground">Carregando dados do paciente...</p>
      </PageShell>
    );
  }

  if (!perfil) {
    return (
      <PageShell title="Paciente não encontrado" subtitle="">
        <Button onClick={() => navigate("/pacientes")} variant="outline" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
      </PageShell>
    );
  }

  return (
    <PageShell
      title={perfil.nome}
      subtitle="Perfil do paciente"
      actions={
        <Button onClick={() => navigate("/pacientes")} variant="outline" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
      }
    >
      <div className="grid gap-6">
        {/* Dados do paciente */}
        <Card className="shadow-card border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-4 w-4 text-primary" />
              Dados Pessoais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <dt className="text-xs text-muted-foreground uppercase tracking-wide">CPF</dt>
                <dd className="font-medium mt-1">{perfil.cpf}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground uppercase tracking-wide">Telefone</dt>
                <dd className="font-medium mt-1">{perfil.telefone}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground uppercase tracking-wide">Nascimento</dt>
                <dd className="font-medium mt-1">{formatData(perfil.dataNascimento)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground uppercase tracking-wide">Consultas</dt>
                <dd className="font-medium mt-1">{perfil.consultas.length}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {/* Histórico de consultas */}
        <Card className="shadow-card border-border/60 overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4 text-primary" />
              Histórico de Consultas
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-muted">
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Hora</TableHead>
                  <TableHead>Médico</TableHead>
                  <TableHead>Especialidade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Prontuário</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {perfil.consultas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      Nenhuma consulta registrada
                    </TableCell>
                  </TableRow>
                ) : (
                  perfil.consultas.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>{formatData(c.data)}</TableCell>
                      <TableCell>{c.hora}</TableCell>
                      <TableCell className="font-medium">{c.medico.nome}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {c.medico.especialidade ?? "—"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={STATUS_CLASS[c.status] ?? ""}
                        >
                          {STATUS_LABEL[c.status] ?? c.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {c.prontuario ? (
                          <Badge className="bg-primary text-primary-foreground">
                            Disponível
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}

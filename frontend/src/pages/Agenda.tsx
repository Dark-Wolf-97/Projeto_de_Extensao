import { useEffect, useState } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConsultaService, Consulta } from "@/services/ConsultaService";
import { NovaAgendaModal } from "@/components/modals/NovaAgendaModal";
import { CalendarPlus } from "lucide-react";

export default function Agenda() {
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [open, setOpen] = useState(false);

  const carregar = async () => setConsultas(await ConsultaService.listar());

  useEffect(() => {
    carregar();
  }, []);

  return (
    <PageShell
      title="Agenda"
      subtitle="Todos os agendamentos"
      actions={
        <Button onClick={() => setOpen(true)} className="bg-primary hover:bg-primary/90 gap-2">
          <CalendarPlus className="h-4 w-4" />
          Nova Agenda
        </Button>
      }
    >
      <Card className="shadow-card border-border/60 overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted">
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Hora</TableHead>
                <TableHead>Paciente</TableHead>
                <TableHead>Médico</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {consultas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Nenhum agendamento
                  </TableCell>
                </TableRow>
              ) : (
                consultas.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="text-primary font-semibold">
                      {new Date(c.data + "T00:00:00").toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell className="font-mono">{c.hora}</TableCell>
                    <TableCell className="font-medium">{c.pacienteNome}</TableCell>
                    <TableCell className="text-muted-foreground">{c.medico}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          c.status === "Confirmada"
                            ? "border-accent text-accent"
                            : c.status === "Cancelada"
                              ? "border-destructive text-destructive"
                              : "border-gold text-gold"
                        }
                      >
                        {c.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <NovaAgendaModal open={open} onOpenChange={setOpen} onSaved={carregar} />
    </PageShell>
  );
}

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
import { NovaConsultaModal } from "@/components/modals/NovaConsultaModal";
import { CalendarPlus, Edit, Trash2 } from "lucide-react";

export default function Consultas() {
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [open, setOpen] = useState(false);
  const [consultaSelecionada, setConsultaSelecionada] = useState<Consulta | null>(null);

  const carregar = async () => setConsultas(await ConsultaService.listar());

  useEffect(() => {
    carregar();
  }, []);

  const handleEditar = (c: Consulta) => {
    setConsultaSelecionada(c);
    setOpen(true);
  };

  const handleDeletar = async (id: number | string) => {
    if (!confirm("Deseja realmente excluir esta consulta?")) return;

    await ConsultaService.deletar(id);
    carregar();
  };

  return (
    <PageShell
      title="Consultas"
      subtitle="Todas as consultas"
      actions={
        <Button
          onClick={() => {
            setConsultaSelecionada(null);
            setOpen(true);
          }}
          className="bg-primary hover:bg-primary/90 gap-2"
        >
          <CalendarPlus className="h-4 w-4" />
          Nova Consulta
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
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {consultas.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    {new Date(c.data).toLocaleDateString("pt-BR")}
                  </TableCell>
                  <TableCell>{c.hora}</TableCell>
                  <TableCell>{c.pacienteNome}</TableCell>
                  <TableCell>{c.medico}</TableCell>

                  <TableCell>
                    <Badge variant="outline">{c.status}</Badge>
                  </TableCell>

                  <TableCell className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditar(c)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeletar(c.id!)}
                      className="text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <NovaConsultaModal
        open={open}
        onOpenChange={setOpen}
        onSaved={carregar}
        consulta={consultaSelecionada}
      />
    </PageShell>
  );
}
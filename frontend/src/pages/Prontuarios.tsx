import { useEffect, useState } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FileText } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

type Prontuario = {
  id: number;
  paciente: string;
  medico: string;
  dataHora: string;
  queixaPrincipal: string;
  diagnostico: string;
  prescricao: string;
  observacoes: string;
};

export default function Prontuarios() {
  const [lista, setLista] = useState<Prontuario[]>([]);
  const [modal, setModal] = useState<{ titulo: string; conteudo: string } | null>(null);

  useEffect(() => {
    setLista([
      {
        id: 1,
        paciente: "João Silva",
        medico: "Dr. Carlos",
        dataHora: "2026-05-04T14:00:00",
        queixaPrincipal: "Dor intensa no peito há 2 dias, piora ao esforço físico.",
        diagnostico: "Possível angina estável, necessário exames complementares.",
        prescricao: "Dipirona 500mg, repouso e encaminhamento para cardiologista.",
        observacoes: "Paciente apresenta histórico familiar de doenças cardíacas.",
      },
    ]);
  }, []);

  const fmt = (iso: string) =>
    new Date(iso).toLocaleString("pt-BR");

  const truncate = (text: string, max = 30) =>
    text.length > max ? text.slice(0, max) + "..." : text;

  const abrirModal = (titulo: string, conteudo: string) => {
    setModal({ titulo, conteudo });
  };

  return (
    <PageShell title="Prontuários" subtitle="Registros clínicos dos pacientes">
      <Card className="shadow-card border-border/60 overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted">
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Paciente</TableHead>
                <TableHead>Médico</TableHead>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Queixa</TableHead>
                <TableHead>Diagnóstico</TableHead>
                <TableHead>Prescrição</TableHead>
                <TableHead>Observações</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {lista.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <div className="h-8 w-8 rounded-full bg-gold/20 text-gold flex items-center justify-center">
                      <FileText className="h-4 w-4" />
                    </div>
                  </TableCell>

                  <TableCell className="font-medium">{p.paciente}</TableCell>
                  <TableCell>{p.medico}</TableCell>
                  <TableCell className="text-primary">{fmt(p.dataHora)}</TableCell>

                  <TableCell
                    className="cursor-pointer hover:underline"
                    onClick={() => abrirModal("Queixa Principal", p.queixaPrincipal)}
                  >
                    {truncate(p.queixaPrincipal)}
                  </TableCell>

                  <TableCell
                    className="cursor-pointer hover:underline"
                    onClick={() => abrirModal("Diagnóstico", p.diagnostico)}
                  >
                    {truncate(p.diagnostico)}
                  </TableCell>

                  <TableCell
                    className="cursor-pointer hover:underline"
                    onClick={() => abrirModal("Prescrição", p.prescricao)}
                  >
                    {truncate(p.prescricao)}
                  </TableCell>

                  <TableCell
                    className="cursor-pointer hover:underline"
                    onClick={() => abrirModal("Observações", p.observacoes)}
                  >
                    {truncate(p.observacoes)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!modal} onOpenChange={() => setModal(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{modal?.titulo}</DialogTitle>
          </DialogHeader>

          <div className="text-sm text-muted-foreground whitespace-pre-wrap">
            {modal?.conteudo}
          </div>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
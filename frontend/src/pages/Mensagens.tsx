import { useEffect, useState } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { MensagemService, Mensagem } from "@/services/MensagemService";
import { CheckCircle2, Send, Inbox } from "lucide-react";
import { toast } from "sonner";

export default function Mensagens() {
  const [aValidar, setAValidar] = useState<Mensagem[]>([]);
  const [enviadas, setEnviadas] = useState<Mensagem[]>([]);

  const carregar = async () => {
    const [a, e] = await Promise.all([
      MensagemService.listarAValidar(),
      MensagemService.listarEnviadas(),
    ]);
    setAValidar(a);
    setEnviadas(e);
  };

  useEffect(() => {
    carregar();
  }, []);

  const handleValidar = async (id: number | string) => {
    try {
      await MensagemService.validar(id);
      toast.success("Mensagem validada e enviada");
    } catch {
      toast.success("Mensagem validada (mock)");
    }
    carregar();
  };

  const fmtData = (iso: string) =>
    new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

  return (
    <PageShell title="Mensagens" subtitle="Validação e histórico de envios">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <Card className="shadow-card border-border/60 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-gold to-gold/70 py-4">
            <CardTitle className="text-gold-foreground flex items-center gap-2 text-base">
              <Inbox className="h-5 w-5" />
              A Validar
              <Badge className="ml-auto bg-primary text-primary-foreground">{aValidar.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Destinatário</TableHead>
                  <TableHead>Assunto</TableHead>
                  <TableHead>Canal</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {aValidar.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      Nenhuma mensagem pendente
                    </TableCell>
                  </TableRow>
                ) : (
                  aValidar.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium">{m.destinatario}</TableCell>
                      <TableCell className="text-muted-foreground">{m.assunto}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-accent text-accent">
                          {m.canal}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          onClick={() => handleValidar(m.id!)}
                          className="bg-accent hover:bg-accent/90 text-accent-foreground gap-1"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Validar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="shadow-card border-border/60 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-primary to-accent py-4">
            <CardTitle className="text-primary-foreground flex items-center gap-2 text-base">
              <Send className="h-5 w-5" />
              Enviadas
              <Badge className="ml-auto bg-gold text-gold-foreground">{enviadas.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Destinatário</TableHead>
                  <TableHead>Assunto</TableHead>
                  <TableHead>Canal</TableHead>
                  <TableHead>Enviada em</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enviadas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      Nenhuma mensagem enviada
                    </TableCell>
                  </TableRow>
                ) : (
                  enviadas.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium">{m.destinatario}</TableCell>
                      <TableCell className="text-muted-foreground">{m.assunto}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-primary text-primary">
                          {m.canal}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {m.enviadaEm ? fmtData(m.enviadaEm) : "—"}
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

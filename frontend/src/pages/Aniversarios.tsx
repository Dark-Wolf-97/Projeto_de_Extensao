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
import { AniversarioService, Aniversariante } from "@/services/AniversarioService";
import { Button } from "@/components/ui/button";
import { Cake, MessageCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

function abrirWhatsApp(telefone: string, mensagem: string) {
  const numero = "55" + telefone.replace(/\D/g, "");
  window.open(`https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`, "_blank");
}

function isAniversarioHoje(dataNascimento: string): boolean {
  const hoje = new Date();
  const nasc = new Date(dataNascimento.split("T")[0] + "T12:00:00");
  return nasc.getDate() === hoje.getDate() && nasc.getMonth() === hoje.getMonth();
}

export default function Aniversarios() {
  const { isSecretaria } = useAuth();
  const [lista, setLista] = useState<Aniversariante[]>([]);
  useEffect(() => {
    AniversarioService.listar().then(setLista);
  }, []);

  const fmt = (iso?: string) => {
    if (!iso) return "";
    const date = new Date(iso.split("T")[0] + "T12:00:00");
    if (isNaN(date.getTime())) return "";
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "long" });
  };

  return (
    <PageShell title="Aniversários" subtitle="Aniversariantes cadastrados">
      <Card className="shadow-card border-border/60 overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted">
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Idade</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lista.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>
                    <div className="h-8 w-8 rounded-full bg-gold/20 text-gold flex items-center justify-center">
                      <Cake className="h-4 w-4" />
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{a.nome}</TableCell>
                  <TableCell className="text-primary font-semibold">{fmt(a.dataNascimento)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-gold text-gold">
                      {a.idade} anos
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{a.telefone}</TableCell>
                  <TableCell>
                    {isSecretaria() && a.telefone && isAniversarioHoje(a.dataNascimento) && (
                      <Button
                        variant="outline"
                        size="sm"
                        title="Enviar parabéns via WhatsApp"
                        className="text-green-600 hover:text-green-700 hover:border-green-300"
                        onClick={() =>
                          abrirWhatsApp(
                            a.telefone!,
                            `Ola, ${a.nome}!\n\nA equipe do Instituto de Saude de Guarapuava deseja um Feliz Aniversario!\n\nQue este dia seja repleto de alegria e saude. Muitas felicidades!`
                          )
                        }
                      >
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </PageShell>
  );
}

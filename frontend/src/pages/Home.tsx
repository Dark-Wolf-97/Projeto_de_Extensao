import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
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
import { CalendarPlus, MessageSquare, FileText, Cake, Clock } from "lucide-react";
import { ConsultaService, Consulta } from "@/services/ConsultaService";
import { AniversarioService, Aniversariante } from "@/services/AniversarioService";
import { NovaConsultaModal } from "@/components/modals/NovaConsultaModal";
import { ProntuarioModal } from "@/components/modals/ProntuarioModal";

export default function Home() {
  const navigate = useNavigate();
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [aniv, setAniv] = useState<Aniversariante[]>([]);
  const [openConsultas, setOpenConsultas] = useState(false);
  const [openProntuario, setOpenProntuario] = useState(false);

  const carregar = async () => {
    const hoje = new Date().toISOString().slice(0, 10);
    const [c, a] = await Promise.all([
      ConsultaService.listar(),
      AniversarioService.listarSemana(),
    ]);
    setConsultas(c.filter((x) => x.data === hoje));
    setAniv(a);
  };

  useEffect(() => {
    carregar();
  }, []);

  const formatData = (iso: string) => {
    if (!iso) return "";
    const d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  };

  return (
    <div className="h-[calc(100vh-4rem)] p-6 flex flex-col gap-5 overflow-hidden">
      {/* Botões de ação */}
      <div className="flex flex-wrap gap-3">
        <Button
          onClick={() => setOpenConsultas(true)}
          className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 h-11 px-5 shadow-sm"
        >
          <CalendarPlus className="h-4 w-4" />
          Nova Consulta
        </Button>
        <Button
          onClick={() => navigate("/mensagens")}
          className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2 h-11 px-5 shadow-sm"
        >
          <MessageSquare className="h-4 w-4" />
          Consultar Mensagens
        </Button>
        <Button
          onClick={() => setOpenProntuario(true)}
          className="bg-gold hover:bg-gold/90 text-gold-foreground gap-2 h-11 px-5 shadow-sm"
        >
          <FileText className="h-4 w-4" />
          Cadastrar Prontuário
        </Button>
      </div>

      {/* Tabelas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 flex-1 min-h-0">
        <Card className="flex flex-col shadow-card border-border/60 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-primary to-accent py-4">
            <CardTitle className="text-primary-foreground flex items-center gap-2 text-base">
              <Clock className="h-5 w-5" />
              Consultas do Dia
              <Badge className="ml-auto bg-gold text-gold-foreground hover:bg-gold">
                {consultas.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto p-0">
            <Table>
              <TableHeader className="sticky top-0 bg-muted">
                <TableRow>
                  <TableHead>Hora</TableHead>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Médico</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {consultas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      Nenhum Consulta para hoje
                    </TableCell>
                  </TableRow>
                ) : (
                  consultas.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono font-semibold text-primary">{c.hora}</TableCell>
                      <TableCell>{c.pacienteNome}</TableCell>
                      <TableCell className="text-muted-foreground">{c.medico}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            c.status === "Confirmada"
                              ? "border-accent text-accent"
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

        <Card className="flex flex-col shadow-card border-border/60 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-accent to-primary py-4">
            <CardTitle className="text-primary-foreground flex items-center gap-2 text-base">
              <Cake className="h-5 w-5" />
              Aniversariantes da Semana
              <Badge className="ml-auto bg-gold text-gold-foreground hover:bg-gold">
                {aniv.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto p-0">
            <Table>
              <TableHeader className="sticky top-0 bg-muted">
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Idade</TableHead>
                  <TableHead>Telefone</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {aniv.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      Nenhum aniversariante na semana
                    </TableCell>
                  </TableRow>
                ) : (
                  aniv.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-semibold text-primary">{formatData(a.dataNascimento)}</TableCell>
                      <TableCell>{a.nome}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-gold text-gold">
                          {a.idade} anos
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{a.telefone}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <NovaConsultaModal open={openConsultas} onOpenChange={setOpenConsultas} onSaved={carregar} />
      <ProntuarioModal open={openProntuario} onOpenChange={setOpenProntuario} />
    </div>
  );
}

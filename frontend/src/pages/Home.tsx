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
    try {
      const hoje = new Date().toISOString().slice(0, 10);

      const [consultasApi, aniversariosApi] = await Promise.all([
        ConsultaService.listar(),
        AniversarioService.listarSemana(),
      ]);

      const consultasHoje = consultasApi.filter((c) => {
        if (!c.data) return false;
        return c.data.slice(0, 10) === hoje;
      });

      setConsultas(consultasHoje);
      setAniv(aniversariosApi);
    } catch (err) {
      console.error("Erro ao carregar Home:", err);
      setConsultas([]);
      setAniv([]);
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  const formatData = (iso?: string) => {
    if (!iso) return "—";

    const date = new Date(iso);
    if (isNaN(date.getTime())) return "—";

    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
    });
  };

  return (
    <div className="h-[calc(100vh-4rem)] p-6 flex flex-col gap-5 overflow-hidden">

      {/* BOTÕES */}
      <div className="flex flex-wrap gap-3">
        <Button
          onClick={() => setOpenConsultas(true)}
          className="bg-primary hover:bg-primary/90 gap-2 h-11 px-5"
        >
          <CalendarPlus className="h-4 w-4" />
          Nova Consulta
        </Button>

        <Button
          onClick={() => navigate("/mensagens")}
          className="bg-accent hover:bg-accent/90 gap-2 h-11 px-5"
        >
          <MessageSquare className="h-4 w-4" />
          Consultar Mensagens
        </Button>

        <Button
          onClick={() => setOpenProntuario(true)}
          className="bg-gold hover:bg-gold/90 gap-2 h-11 px-5"
        >
          <FileText className="h-4 w-4" />
          Cadastrar Prontuário
        </Button>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 flex-1 min-h-0">

        {/* CONSULTAS HOJE */}
        <Card className="flex flex-col overflow-hidden">
          <CardHeader className="bg-primary">
            <CardTitle className="text-white flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Consultas do Dia
              <Badge className="ml-auto bg-gold text-black">
                {consultas.length}
              </Badge>
            </CardTitle>
          </CardHeader>

          <CardContent className="flex-1 overflow-auto p-0">
            <Table>
              <TableHeader>
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
                    <TableCell colSpan={4} className="text-center py-8">
                      Nenhuma consulta hoje
                    </TableCell>
                  </TableRow>
                ) : (
                  consultas.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono text-primary">
                        {c.hora}
                      </TableCell>
                      <TableCell>{c.pacienteNome}</TableCell>
                      <TableCell>{c.medico ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {c.status ?? "Agendada"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* ANIVERSÁRIOS */}
        <Card className="flex flex-col overflow-hidden">
          <CardHeader className="bg-accent">
            <CardTitle className="text-white flex items-center gap-2">
              <Cake className="h-5 w-5" />
              Aniversariantes da Semana
              <Badge className="ml-auto bg-gold text-black">
                {aniv.length}
              </Badge>
            </CardTitle>
          </CardHeader>

          <CardContent className="flex-1 overflow-auto p-0">
            <Table>
              <TableHeader>
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
                    <TableCell colSpan={4} className="text-center py-8">
                      Nenhum aniversariante na semana
                    </TableCell>
                  </TableRow>
                ) : (
                  aniv.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="text-primary font-medium">
                        {formatData(a.dataNascimento)}
                      </TableCell>
                      <TableCell>{a.nome}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {a.idade ?? 0} anos
                        </Badge>
                      </TableCell>
                      <TableCell>{a.telefone ?? "—"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

      </div>

      <NovaConsultaModal
        open={openConsultas}
        onOpenChange={setOpenConsultas}
        onSaved={carregar}
      />

      <ProntuarioModal
        open={openProntuario}
        onOpenChange={setOpenProntuario}
      />
    </div>
  );
}
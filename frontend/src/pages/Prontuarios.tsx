import { useEffect, useState } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileText, Search } from "lucide-react";
import { ProntuarioService, Prontuario } from "@/services/ProntuarioService";
import { ProntuarioModal } from "@/components/modals/ProntuarioModal";
import { Consulta } from "@/services/ConsultaService";
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

function truncate(text: string | undefined, max = 40) {
  if (!text) return <span className="text-muted-foreground italic">—</span>;
  return text.length > max ? text.slice(0, max) + "…" : text;
}

function prontuarioToConsulta(p: Prontuario): Consulta | null {
  if (!p.consulta) return null;
  return {
    id: p.consulta.id,
    pacienteId: p.consulta.paciente?.id ?? 0,
    medicoId: p.consulta.medico?.id ?? 0,
    paciente: p.consulta.paciente,
    medico: p.consulta.medico
      ? { id: p.consulta.medico.id, nome: p.consulta.medico.nome, especialidade: p.consulta.medico.especialidade }
      : undefined,
    data: p.consulta.data,
    hora: p.consulta.hora,
    status: p.consulta.status as Consulta["status"],
  };
}

export default function Prontuarios() {
  const [lista, setLista] = useState<Prontuario[]>([]);
  const [busca, setBusca] = useState("");
  const [dataFiltro, setDataFiltro] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [consultaSelecionada, setConsultaSelecionada] = useState<Consulta | null>(null);

  const carregar = async () => {
    try {
      setLista(await ProntuarioService.listar());
    } catch {
      toast.error("Erro ao carregar prontuários");
    }
  };

  useEffect(() => { carregar(); }, []);

  const listaFiltrada = lista.filter((p) => {
    const nomeOk = !busca || (p.consulta?.paciente?.nome ?? "").toLowerCase().includes(busca.toLowerCase());
    const dataOk = !dataFiltro || (p.consulta?.data ?? "").split("T")[0] === dataFiltro;
    return nomeOk && dataOk;
  });

  const handleVer = (p: Prontuario) => {
    const c = prontuarioToConsulta(p);
    if (c) {
      setConsultaSelecionada(c);
      setModalOpen(true);
    }
  };

  return (
    <PageShell title="Prontuários" subtitle="Registros clínicos dos atendimentos">
      {/* Barra de busca */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Buscar paciente..."
            value={busca}
            onChange={(e) => setBusca(e.target.value.replace(/[^a-zA-ZÀ-ÿ\s]/g, ""))}
          />
        </div>
        <Input
          type="date"
          className="w-44"
          value={dataFiltro}
          onChange={(e) => setDataFiltro(e.target.value)}
        />
        {(busca || dataFiltro) && (
          <Button variant="ghost" size="sm" onClick={() => { setBusca(""); setDataFiltro(""); }}>
            Limpar
          </Button>
        )}
      </div>

      <Card className="shadow-card border-border/60 overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted">
              <TableRow>
                <TableHead className="w-10"></TableHead>
                <TableHead>Paciente</TableHead>
                <TableHead>Médico</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Hora</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Prontuário</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {listaFiltrada.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    Nenhum prontuário encontrado
                  </TableCell>
                </TableRow>
              ) : (
                listaFiltrada.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                        <FileText className="h-4 w-4" />
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {p.consulta?.paciente?.nome ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {p.consulta?.medico?.nome ?? "—"}
                    </TableCell>
                    <TableCell>
                      {p.consulta?.data ? formatData(p.consulta.data) : "—"}
                    </TableCell>
                    <TableCell>{p.consulta?.hora ?? "—"}</TableCell>
                    <TableCell>
                      {p.consulta?.status && (
                        <Badge
                          variant="outline"
                          className={STATUS_CLASS[p.consulta.status] ?? ""}
                        >
                          {STATUS_LABEL[p.consulta.status] ?? p.consulta.status}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => handleVer(p)}>
                        <FileText className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ProntuarioModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        consulta={consultaSelecionada}
        onSaved={carregar}
      />
    </PageShell>
  );
}

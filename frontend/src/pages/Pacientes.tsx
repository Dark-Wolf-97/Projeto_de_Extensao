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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PacienteService, Paciente } from "@/services/PacienteService";
import { Edit, Search, Trash2 } from "lucide-react";
import { NovoPacienteModal } from "@/components/modals/NovoPacienteModal";

export default function Pacientes() {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [busca, setBusca] = useState("");
  const [open, setOpen] = useState(false);
  const [pacienteSelecionado, setPacienteSelecionado] = useState<Paciente | null>(null);

  const carregar = async () => setPacientes(await PacienteService.listar());

  useEffect(() => {
    carregar();
  }, []);

  const handleBuscar = async () => {
    if (!busca.trim()) return carregar();
    setPacientes(await PacienteService.buscar(busca));
  };

  const handleEditar = (p: Paciente) => {
    setPacienteSelecionado(p);
    setOpen(true);
  };

  const handleDeletar = async (p: Paciente) => {
    if (!confirm(`Deseja remover ${p.nome}?`)) return;

    try {
      await PacienteService.deletar(p.id!);
      await carregar();
    } catch {
      alert("Erro ao deletar paciente");
    }
  };

  return (
    <PageShell
      title="Pacientes"
      subtitle="Cadastro e busca de pacientes"
      actions={
        <div className="flex gap-2">
          <div className="flex gap-2">
            <Input
              placeholder="Buscar por nome..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleBuscar()}
              className="w-64"
            />
            <Button onClick={handleBuscar} className="bg-primary hover:bg-primary/90 gap-2">
              <Search className="h-4 w-4" />
              Buscar
            </Button>
          </div>
          <div className="pl-2 border-l border-border/60">
            <Button onClick={() => setOpen(true)} className="bg-primary hover:bg-primary/90 gap-2">
              Cadastrar
            </Button>
          </div>
        </div>
      }
    >
      <Card className="shadow-card border-border/60 overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted">
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>CPF</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Nascimento</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pacientes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Nenhum paciente encontrado
                  </TableCell>
                </TableRow>
              ) : (
                pacientes.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.nome}</TableCell>
                    <TableCell className="text-muted-foreground">{p.cpf}</TableCell>
                    <TableCell>{p.telefone}</TableCell>
                    <TableCell className="text-muted-foreground">{p.email}</TableCell>
                    <TableCell>
                      {p.dataNascimento
                        ? new Date(
                            p.dataNascimento.split("T")[0] + "T12:00:00"
                          ).toLocaleDateString("pt-BR")
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => handleEditar(p)} className="mr-2"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeletar(p)}
                        className="text-destructive hover:text-destructive/90"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <NovoPacienteModal open={open} onOpenChange={setOpen} onSaved={carregar} paciente={pacienteSelecionado} />
    </PageShell>
  );
}

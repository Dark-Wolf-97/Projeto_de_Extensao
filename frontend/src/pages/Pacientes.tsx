import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageShell } from "@/components/layout/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PacienteService, Paciente } from "@/services/PacienteService";
import { Edit, Search, Trash2, UserRound } from "lucide-react";
import { NovoPacienteModal } from "@/components/modals/NovoPacienteModal";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

function formatData(iso?: string) {
  if (!iso) return "—";
  return new Date(iso.split("T")[0] + "T12:00:00").toLocaleDateString("pt-BR");
}

export default function Pacientes() {
  const navigate = useNavigate();
  const { isAdmin, isSecretaria } = useAuth();
  const podeEditar = isAdmin() || isSecretaria();

  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [busca, setBusca] = useState("");
  const [open, setOpen] = useState(false);
  const [selecionado, setSelecionado] = useState<Paciente | null>(null);
  const [confirmar, setConfirmar] = useState<{ descricao: string; acao: () => Promise<void> } | null>(null);
  const [executando, setExecutando] = useState(false);

  const carregar = async () => {
    try {
      setPacientes(await PacienteService.listar());
    } catch {
      toast.error("Erro ao carregar pacientes");
    }
  };

  useEffect(() => { carregar(); }, []);

  const handleBuscar = async () => {
    if (!busca.trim()) return carregar();
    try {
      setPacientes(await PacienteService.buscar(busca));
    } catch {
      toast.error("Erro ao buscar pacientes");
    }
  };

  const handleNovo = () => { setSelecionado(null); setOpen(true); };
  const handleEditar = (p: Paciente) => { setSelecionado(p); setOpen(true); };

  const handleDeletar = (p: Paciente) => {
    setConfirmar({
      descricao: `Deseja remover o paciente ${p.nome}? Esta ação não pode ser desfeita.`,
      acao: async () => {
        try {
          await PacienteService.deletar(p.id!);
          toast.success("Paciente removido com sucesso!");
          await carregar();
        } catch {
          toast.error("Erro ao remover paciente");
        }
      },
    });
  };

  const executarConfirmado = async () => {
    if (!confirmar) return;
    setExecutando(true);
    try { await confirmar.acao(); }
    finally { setExecutando(false); setConfirmar(null); }
  };

  return (
    <PageShell
      title="Pacientes"
      subtitle="Cadastro e busca de pacientes"
      actions={
        <div className="flex gap-2">
          <Input
            placeholder="Buscar por nome..."
            value={busca}
            onChange={(e) => setBusca(e.target.value.replace(/[^a-zA-ZÀ-ÿ\s]/g, ""))}
            onKeyDown={(e) => e.key === "Enter" && handleBuscar()}
            className="w-64"
          />
          <Button onClick={handleBuscar} variant="outline" className="gap-2">
            <Search className="h-4 w-4" />
            Buscar
          </Button>
          {podeEditar && (
            <Button onClick={handleNovo} className="bg-primary hover:bg-primary/90 gap-2">
              <UserRound className="h-4 w-4" />
              Novo Paciente
            </Button>
          )}
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
                <TableHead>Nascimento</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pacientes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Nenhum paciente encontrado
                  </TableCell>
                </TableRow>
              ) : (
                pacientes.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <button
                        onClick={() => navigate(`/pacientes/${p.id}`)}
                        className="font-medium text-primary hover:underline text-left"
                      >
                        {p.nome}
                      </button>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{p.cpf}</TableCell>
                    <TableCell>{p.telefone}</TableCell>
                    <TableCell>{formatData(p.dataNascimento)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/pacientes/${p.id}`)}
                          title="Ver perfil"
                        >
                          <UserRound className="h-4 w-4" />
                        </Button>
                        {podeEditar && (
                          <>
                            <Button variant="outline" size="sm" onClick={() => handleEditar(p)}>
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
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <NovoPacienteModal
        open={open}
        onOpenChange={setOpen}
        onSaved={carregar}
        paciente={selecionado}
      />
      <ConfirmDialog
        open={!!confirmar}
        onOpenChange={(v) => !v && setConfirmar(null)}
        titulo="Remover Paciente"
        descricao={confirmar?.descricao ?? ""}
        labelConfirmar="Remover"
        carregando={executando}
        onConfirmar={executarConfirmado}
      />
    </PageShell>
  );
}

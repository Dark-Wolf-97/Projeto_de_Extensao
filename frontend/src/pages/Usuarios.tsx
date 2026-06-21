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
import { Input } from "@/components/ui/input";
import { UsuarioService, Usuario } from "@/services/UsuarioService";
import { UsuarioModal } from "@/components/modals/UsuarioModal";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Edit, Search, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Administrador",
  SECRETARIA: "Secretária",
  MEDICO: "Médico",
};

const ROLE_CLASS: Record<string, string> = {
  ADMIN: "bg-gold text-gold-foreground hover:bg-gold",
  SECRETARIA: "bg-primary text-primary-foreground hover:bg-primary",
  MEDICO: "bg-accent text-accent-foreground hover:bg-accent",
};

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [busca, setBusca] = useState("");
  const [open, setOpen] = useState(false);
  const [selecionado, setSelecionado] = useState<Usuario | null>(null);
  const [confirmar, setConfirmar] = useState<{ descricao: string; acao: () => Promise<void> } | null>(null);
  const [executando, setExecutando] = useState(false);

  const carregar = async () => {
    try {
      setUsuarios(await UsuarioService.listar());
    } catch {
      toast.error("Erro ao carregar usuários");
    }
  };

  useEffect(() => { carregar(); }, []);

  const handleBuscar = async () => {
    if (!busca.trim()) return carregar();
    try {
      setUsuarios(await UsuarioService.buscarPorNome(busca));
    } catch {
      toast.error("Erro ao buscar usuários");
    }
  };

  const handleNovo = () => { setSelecionado(null); setOpen(true); };
  const handleEditar = (usuario: Usuario) => { setSelecionado(usuario); setOpen(true); };

  const handleDeletar = (usuario: Usuario) => {
    setConfirmar({
      descricao: `Deseja remover o usuário ${usuario.nome}? Esta ação não pode ser desfeita.`,
      acao: async () => {
        try {
          await UsuarioService.deletar(usuario.id!);
          toast.success("Usuário removido com sucesso!");
          await carregar();
        } catch {
          toast.error("Erro ao remover usuário");
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
      title="Usuários"
      subtitle="Gerencie os acessos do sistema"
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
          <Button onClick={handleNovo} className="bg-primary hover:bg-primary/90 gap-2">
            <UserPlus className="h-4 w-4" />
            Novo Usuário
          </Button>
        </div>
      }
    >
      <Card className="shadow-card border-border/60 overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted">
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Perfil</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {usuarios.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Nenhum usuário encontrado
                  </TableCell>
                </TableRow>
              ) : (
                usuarios.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.nome}</TableCell>
                    <TableCell className="text-muted-foreground">{u.email}</TableCell>
                    <TableCell>
                      <Badge className={ROLE_CLASS[u.role] ?? ""}>
                        {ROLE_LABEL[u.role] ?? u.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {u.telefone ?? "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditar(u)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeletar(u)}
                          className="text-destructive hover:text-destructive/90"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <UsuarioModal
        open={open}
        onOpenChange={setOpen}
        onSaved={carregar}
        usuario={selecionado}
      />
      <ConfirmDialog
        open={!!confirmar}
        onOpenChange={(v) => !v && setConfirmar(null)}
        titulo="Remover Usuário"
        descricao={confirmar?.descricao ?? ""}
        labelConfirmar="Remover"
        carregando={executando}
        onConfirmar={executarConfirmado}
      />
    </PageShell>
  );
}

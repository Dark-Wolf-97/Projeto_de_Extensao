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
import { UsuarioService, Usuario } from "@/services/UsuarioService";
import { UsuarioModal } from "@/components/modals/UsuarioModal";
import { Edit, Trash2, UserPlus } from "lucide-react";

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [open, setOpen] = useState(false);
  const [usuarioSelecionado, setUsuarioSelecionado] = useState<Usuario | null>(null);

  const carregar = async () => {
    setUsuarios(await UsuarioService.listar());
  };

  useEffect(() => {
    carregar();
  }, []);

  const handleNovo = () => {
    setUsuarioSelecionado(null);
    setOpen(true);
  };

  const handleEditar = (usuario: Usuario) => {
    setUsuarioSelecionado(usuario);
    setOpen(true);
  };

  const handleDeletar = async (usuario: Usuario) => {
    if (!confirm(`Deseja remover ${usuario.name ?? usuario.email}?`)) return;

    try {
      await UsuarioService.deletar(usuario.id!);
      await carregar();
    } catch (err) {
      console.error(err);
      alert("Erro ao deletar usuário");
    }
  };

  const labelRole = (role: Usuario["role"]) => {
    return role === "ADMIN" ? "Administrador" : "Usuário";
  };

  return (
    <PageShell
      title="Usuários"
      subtitle="Gerencie os acessos do sistema"
      actions={
        <Button onClick={handleNovo} className="bg-primary hover:bg-primary/90 gap-2">
          <UserPlus className="h-4 w-4" />
          Novo Usuário
        </Button>
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
                <TableHead>Status</TableHead>
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
                    <TableCell className="font-medium">{u.name ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{u.email}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          u.role === "ADMIN"
                            ? "bg-gold text-gold-foreground hover:bg-gold"
                            : "bg-primary text-primary-foreground hover:bg-primary"
                        }
                      >
                        {labelRole(u.role)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          u.active
                            ? "border-accent text-accent"
                            : "border-destructive text-destructive"
                        }
                      >
                        {u.active ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditar(u)}
                        className="mr-2"
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
        usuario={usuarioSelecionado}
      />
    </PageShell>
  );
}
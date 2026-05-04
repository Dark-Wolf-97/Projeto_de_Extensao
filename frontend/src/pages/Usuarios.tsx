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
import { UsuarioService, Usuario } from "@/services/UsuarioService";

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  useEffect(() => {
    UsuarioService.listar().then(setUsuarios);
  }, []);

  return (
    <PageShell title="Usuários" subtitle="Gerencie os acessos do sistema">
      <Card className="shadow-card border-border/60 overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted">
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Perfil</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usuarios.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.nome}</TableCell>
                  <TableCell className="text-muted-foreground">{u.email}</TableCell>
                  <TableCell>
                    <Badge
                      className={
                        u.perfil === "Administrador"
                          ? "bg-gold text-gold-foreground hover:bg-gold"
                          : u.perfil === "Médico"
                            ? "bg-primary text-primary-foreground hover:bg-primary"
                            : "bg-accent text-accent-foreground hover:bg-accent"
                      }
                    >
                      {u.perfil}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={u.ativo ? "border-accent text-accent" : "border-destructive text-destructive"}>
                      {u.ativo ? "Ativo" : "Inativo"}
                    </Badge>
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

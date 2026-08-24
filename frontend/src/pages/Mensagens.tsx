import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageShell } from "@/components/layout/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ArrowLeft, Pencil, Send, XCircle } from "lucide-react";
import { MensagemService, Mensagem } from "@/services/MensagemService";
import { toast } from "@/components/ui/sonner";

const TIPO_LABEL: Record<Mensagem["tipo"], string> = {
  CONFIRMACAO: "Confirmação",
  LEMBRETE: "Lembrete",
  ANIVERSARIO: "Aniversário",
};

const STATUS_LABEL: Record<Mensagem["status"], string> = {
  PENDENTE: "Pendente",
  ENVIADA: "Enviada",
  CANCELADA: "Cancelada",
  FALHA: "Falha",
};

const STATUS_CLASS: Record<Mensagem["status"], string> = {
  PENDENTE: "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100",
  ENVIADA: "bg-green-100 text-green-800 border-green-200 hover:bg-green-100",
  CANCELADA: "bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-100",
  FALHA: "bg-red-100 text-red-800 border-red-200 hover:bg-red-100",
};

function formatDataHora(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export default function Mensagens() {
  const navigate = useNavigate();

  const [pendentes, setPendentes] = useState<Mensagem[]>([]);
  const [historico, setHistorico] = useState<Mensagem[]>([]);
  const [carregando, setCarregando] = useState(true);

  const [editando, setEditando] = useState<Mensagem | null>(null);
  const [conteudoEditado, setConteudoEditado] = useState("");
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);

  const [confirmar, setConfirmar] = useState<{
    titulo: string;
    descricao: string;
    labelConfirmar: string;
    variante?: "destructive" | "default";
    acao: () => Promise<void>;
  } | null>(null);
  const [executando, setExecutando] = useState(false);

  const carregar = async () => {
    try {
      const [listaPendentes, listaHistorico] = await Promise.all([
        MensagemService.listarPendentes(),
        MensagemService.listarHistorico(),
      ]);
      setPendentes(listaPendentes);
      setHistorico(listaHistorico);
    } catch (err) {
      toast.error(err);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  const abrirEdicao = (mensagem: Mensagem) => {
    setEditando(mensagem);
    setConteudoEditado(mensagem.conteudo);
  };

  const salvarEdicao = async () => {
    if (!editando) return;
    setSalvandoEdicao(true);
    try {
      await MensagemService.editar(editando.id, conteudoEditado);
      toast.success("Mensagem atualizada");
      setEditando(null);
      await carregar();
    } catch (err) {
      toast.error(err);
    } finally {
      setSalvandoEdicao(false);
    }
  };

  const executarConfirmado = async () => {
    if (!confirmar) return;
    setExecutando(true);
    try {
      await confirmar.acao();
    } finally {
      setExecutando(false);
      setConfirmar(null);
    }
  };

  const handleCancelar = (mensagem: Mensagem) => {
    setConfirmar({
      titulo: "Cancelar mensagem",
      descricao: `Deseja cancelar o envio desta mensagem de ${TIPO_LABEL[mensagem.tipo].toLowerCase()} para ${mensagem.paciente?.nome ?? "o paciente"}?`,
      labelConfirmar: "Cancelar mensagem",
      variante: "destructive",
      acao: async () => {
        try {
          await MensagemService.cancelar(mensagem.id);
          toast.success("Mensagem cancelada");
          await carregar();
        } catch (err) {
          toast.error(err);
        }
      },
    });
  };

  const handleEnviarAgora = (mensagem: Mensagem) => {
    setConfirmar({
      titulo: "Enviar agora",
      descricao: `Enviar esta mensagem para ${mensagem.paciente?.nome ?? "o paciente"} agora, sem esperar o horário programado?`,
      labelConfirmar: "Enviar agora",
      variante: "default",
      acao: async () => {
        try {
          await MensagemService.enviarAgora(mensagem.id);
          toast.success("Mensagem enviada");
          await carregar();
        } catch (err) {
          toast.error(err);
        }
      },
    });
  };

  return (
    <PageShell
      title="Mensagens"
      subtitle="Fila de envio e histórico de mensagens do WhatsApp"
      actions={
        <Button variant="outline" className="gap-2" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
      }
    >
      <Card className="shadow-card border-border/60">
        <CardContent className="pt-6">
          <Tabs defaultValue="pendentes">
            <TabsList>
              <TabsTrigger value="pendentes">Pendentes ({pendentes.length})</TabsTrigger>
              <TabsTrigger value="historico">Histórico</TabsTrigger>
            </TabsList>

            <TabsContent value="pendentes">
              <Table>
                <TableHeader className="bg-muted">
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Conteúdo</TableHead>
                    <TableHead>Agendado para</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!carregando && pendentes.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                        Nenhuma mensagem pendente no momento.
                      </TableCell>
                    </TableRow>
                  )}
                  {pendentes.map((mensagem) => (
                    <TableRow key={mensagem.id}>
                      <TableCell>{TIPO_LABEL[mensagem.tipo]}</TableCell>
                      <TableCell>{mensagem.paciente?.nome ?? "-"}</TableCell>
                      <TableCell className="max-w-xs truncate" title={mensagem.conteudo}>
                        {mensagem.conteudo}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDataHora(mensagem.agendadoPara)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Editar"
                            aria-label={`Editar mensagem de ${mensagem.paciente?.nome ?? "paciente"}`}
                            onClick={() => abrirEdicao(mensagem)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Enviar agora"
                            aria-label={`Enviar agora mensagem de ${mensagem.paciente?.nome ?? "paciente"}`}
                            onClick={() => handleEnviarAgora(mensagem)}
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Cancelar"
                            aria-label={`Cancelar mensagem de ${mensagem.paciente?.nome ?? "paciente"}`}
                            onClick={() => handleCancelar(mensagem)}
                          >
                            <XCircle className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="historico">
              <Table>
                <TableHeader className="bg-muted">
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Conteúdo</TableHead>
                    <TableHead>Atualizado em</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!carregando && historico.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                        Nenhuma mensagem no histórico ainda.
                      </TableCell>
                    </TableRow>
                  )}
                  {historico.map((mensagem) => (
                    <TableRow key={mensagem.id}>
                      <TableCell>{TIPO_LABEL[mensagem.tipo]}</TableCell>
                      <TableCell>{mensagem.paciente?.nome ?? "-"}</TableCell>
                      <TableCell>
                        <Badge className={STATUS_CLASS[mensagem.status]}>
                          {STATUS_LABEL[mensagem.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate" title={mensagem.conteudo}>
                        {mensagem.conteudo}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDataHora(mensagem.updatedAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={!!editando} onOpenChange={(v) => !v && setEditando(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar mensagem</DialogTitle>
          </DialogHeader>
          <Textarea
            value={conteudoEditado}
            onChange={(e) => setConteudoEditado(e.target.value)}
            rows={6}
            maxLength={2000}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditando(null)} disabled={salvandoEdicao}>
              Cancelar
            </Button>
            <Button onClick={salvarEdicao} disabled={salvandoEdicao || !conteudoEditado.trim()}>
              {salvandoEdicao ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!confirmar}
        onOpenChange={(v) => !v && setConfirmar(null)}
        titulo={confirmar?.titulo ?? ""}
        descricao={confirmar?.descricao ?? ""}
        labelConfirmar={confirmar?.labelConfirmar}
        variante={confirmar?.variante}
        carregando={executando}
        onConfirmar={executarConfirmado}
      />
    </PageShell>
  );
}

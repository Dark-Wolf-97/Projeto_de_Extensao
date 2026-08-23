import { type ComponentProps, type ReactNode, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageShell } from "@/components/layout/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConsultaService, Consulta } from "@/services/ConsultaService";
import { NovaConsultaModal } from "@/components/modals/NovaConsultaModal";
import { ProntuarioModal } from "@/components/modals/ProntuarioModal";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import {
  AlertTriangle,
  CalendarDays,
  CalendarPlus,
  CheckCircle2,
  Edit,
  ExternalLink,
  FileText,
  LoaderCircle,
  MessageCircle,
  Search,
  Trash2,
  XCircle,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { httpErrorMessage } from "@/services/http";
import { toast } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

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

function abrirWhatsApp(telefone: string, mensagem: string) {
  const numero = "55" + telefone.replace(/\D/g, "");
  window.open(`https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`, "_blank");
}

function horasPassadas(data: string, hora: string): number {
  const dt = new Date(`${data.split("T")[0]}T${hora}:00`);
  return (Date.now() - dt.getTime()) / (1000 * 60 * 60);
}

type IndicadorInfo = { cor: string; titulo: string };

function getIndicador(c: Consulta): IndicadorInfo {
  if (c.status !== "REALIZADA") {
    return {
      cor: "bg-white border border-gray-300",
      titulo: "Consulta não realizada",
    };
  }
  if (c.prontuario?.id) {
    return { cor: "bg-green-500", titulo: "Prontuário registrado" };
  }
  const horas = horasPassadas(c.data, c.hora);
  if (horas > 24) {
    return { cor: "bg-red-500", titulo: "Prontuário pendente há mais de 24h" };
  }
  return { cor: "bg-yellow-400", titulo: "Prontuário pendente" };
}

type AcaoConsultaButtonProps = Omit<ComponentProps<typeof Button>, "size" | "title"> & {
  label: string;
  children: ReactNode;
};

function AcaoConsultaButton({ label, children, className, ...props }: AcaoConsultaButtonProps) {
  return (
    <Button
      {...props}
      size="icon"
      title={label}
      aria-label={props["aria-label"] ?? label}
      className={cn(
        "group h-7 w-7 justify-start overflow-hidden px-1.5 transition-[width,padding] duration-200 hover:w-64 hover:px-2 focus-visible:w-64 focus-visible:px-2",
        className,
      )}
    >
      <span className="shrink-0">{children}</span>
      <span className="ml-0 max-w-0 overflow-hidden whitespace-nowrap text-xs opacity-0 transition-[max-width,margin,opacity] duration-200 group-hover:ml-1.5 group-hover:max-w-52 group-hover:opacity-100 group-focus-visible:ml-1.5 group-focus-visible:max-w-52 group-focus-visible:opacity-100">
        {label}
      </span>
    </Button>
  );
}

export default function Consultas() {
  const navigate = useNavigate();
  const { isAdmin, isSecretaria, isMedico } = useAuth();
  const podeGerenciar = isAdmin() || isSecretaria();
  const medicoView = isMedico();

  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [busca, setBusca] = useState("");
  const [dataFiltro, setDataFiltro] = useState("");
  const [open, setOpen] = useState(false);
  const [selecionada, setSelecionada] = useState<Consulta | null>(null);
  const [prontuarioOpen, setProntuarioOpen] = useState(false);
  const [consultaProntuario, setConsultaProntuario] = useState<Consulta | null>(null);
  const [confirmar, setConfirmar] = useState<{
    titulo: string;
    descricao: string;
    labelConfirmar: string;
    variante?: "destructive" | "default";
    acao: () => Promise<void>;
  } | null>(null);
  const [executando, setExecutando] = useState(false);
  const [sincronizandoId, setSincronizandoId] = useState<number | null>(null);
  const [abrindoAgenda, setAbrindoAgenda] = useState(false);

  const carregar = async () => {
    try {
      setConsultas(await ConsultaService.listar());
    } catch (err) {
      toast.error(err);
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  const consultasFiltradas = consultas.filter((c) => {
    const nomeOk = !busca || (c.paciente?.nome ?? "").toLowerCase().includes(busca.toLowerCase());
    const dataOk = !dataFiltro || c.data.split("T")[0] === dataFiltro;
    return nomeOk && dataOk;
  });

  const handleNova = () => {
    setSelecionada(null);
    setOpen(true);
  };
  const handleEditar = (c: Consulta) => {
    setSelecionada(c);
    setOpen(true);
  };
  const handleProntuario = (c: Consulta) => {
    setConsultaProntuario(c);
    setProntuarioOpen(true);
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

  const handleRealizar = (c: Consulta) => {
    setConfirmar({
      titulo: "Marcar como Realizada",
      descricao: `Confirma que a consulta de ${c.paciente?.nome} foi realizada?`,
      labelConfirmar: "Confirmar",
      variante: "default",
      acao: async () => {
        try {
          await ConsultaService.realizar(c.id!);
          toast.success("Consulta marcada como Realizada");
          await carregar();
        } catch (err) {
          toast.error(err);
        }
      },
    });
  };

  const handleDeletar = (c: Consulta) => {
    setConfirmar({
      titulo: "Remover Consulta",
      descricao: `Deseja remover a consulta de ${c.paciente?.nome}? Esta ação não pode ser desfeita.`,
      labelConfirmar: "Remover",
      variante: "destructive",
      acao: async () => {
        try {
          await ConsultaService.deletar(c.id!);
          toast.success("Consulta removida com sucesso!");
          await carregar();
        } catch (err) {
          const { detail } = httpErrorMessage(err);
          toast.error(detail || err);
        }
      },
    });
  };

  const handleAbrirAgenda = async () => {
    setAbrindoAgenda(true);
    try {
      const { link } = await ConsultaService.buscarLinkAgenda();
      window.open(link, "_blank", "noopener,noreferrer");
    } catch (err) {
      const { detail } = httpErrorMessage(err);
      toast.error(detail || "Não foi possível abrir o Google Agenda.");
    } finally {
      setAbrindoAgenda(false);
    }
  };

  const handleRecadastrarNaAgenda = async (c: Consulta) => {
    if (!c.id) return;
    setSincronizandoId(c.id);
    try {
      const atualizada = await ConsultaService.recadastrarNaAgenda(c.id);
      setConsultas((atuais) => atuais.map((item) => (item.id === atualizada.id ? atualizada : item)));
      toast.success("Consulta cadastrada no Google Agenda!");
    } catch (err) {
      const { detail } = httpErrorMessage(err);
      toast.error(detail || "Não foi possível cadastrar a consulta no Google Agenda.");
    } finally {
      setSincronizandoId(null);
    }
  };

  const qtdVermelhas = medicoView ? consultas.filter((c) => getIndicador(c).cor === "bg-red-500").length : 0;

  const totalCols = podeGerenciar ? 6 : medicoView ? 8 : 5;

  return (
    <PageShell
      title="Consultas"
      subtitle={medicoView ? "Suas consultas agendadas" : "Todas as consultas"}
      actions={
        podeGerenciar ? (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleAbrirAgenda} disabled={abrindoAgenda} className="gap-2">
              {abrindoAgenda ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CalendarDays className="h-4 w-4" />}
              {abrindoAgenda ? "Abrindo agenda..." : "Abrir Google Agenda"}
            </Button>
            <Button onClick={handleNova} className="bg-primary hover:bg-primary/90 gap-2">
              <CalendarPlus className="h-4 w-4" />
              Nova Consulta
            </Button>
          </div>
        ) : undefined
      }
    >
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
        <Input type="date" className="w-44" value={dataFiltro} onChange={(e) => setDataFiltro(e.target.value)} />
        {(busca || dataFiltro) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setBusca("");
              setDataFiltro("");
            }}
          >
            Limpar
          </Button>
        )}
        {qtdVermelhas > 0 && (
          <div className="ml-auto flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-sm text-red-700">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {qtdVermelhas === 1
              ? "1 consulta realizada sem prontuário há mais de 24h"
              : `${qtdVermelhas} consultas realizadas sem prontuário há mais de 24h`}
          </div>
        )}
      </div>

      <Card className="shadow-card border-border/60 overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted">
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Hora</TableHead>
                <TableHead>Paciente</TableHead>
                <TableHead>Médico</TableHead>
                <TableHead>Status</TableHead>
                {medicoView && <TableHead className="w-6"></TableHead>}
                {medicoView && <TableHead>Prontuário</TableHead>}
                {podeGerenciar && <TableHead>Ações</TableHead>}
              </TableRow>
            </TableHeader>

            <TableBody>
              {consultasFiltradas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={totalCols} className="text-center text-muted-foreground py-8">
                    Nenhuma consulta encontrada
                  </TableCell>
                </TableRow>
              ) : (
                consultasFiltradas.map((c) => {
                  const indicador = medicoView ? getIndicador(c) : null;
                  const googleCalendarEventLink = c.googleCalendarEventLink;
                  return (
                    <TableRow key={c.id}>
                      <TableCell>{formatData(c.data)}</TableCell>
                      <TableCell>{c.hora}</TableCell>
                      <TableCell>
                        <button
                          onClick={() => navigate(`/pacientes/${c.paciente?.id}`)}
                          className="font-medium text-primary hover:underline text-left"
                        >
                          {c.paciente?.nome ?? "—"}
                        </button>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {c.medico?.nome ?? "—"}
                        {c.medico?.especialidade && <span className="block text-xs">{c.medico.especialidade}</span>}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={STATUS_CLASS[c.status] ?? ""}>
                          {STATUS_LABEL[c.status] ?? c.status}
                        </Badge>
                      </TableCell>

                      {/* Indicador colorido — só MEDICO */}
                      {medicoView && indicador && (
                        <TableCell className="w-6 px-2">
                          <div className={`h-4 w-4 rounded-full ${indicador.cor}`} title={indicador.titulo} />
                        </TableCell>
                      )}

                      {/* Ações do MEDICO */}
                      {medicoView && (
                        <TableCell>
                          <div className="flex flex-wrap gap-2">
                            <AcaoConsultaButton
                              label="Ver / criar prontuário"
                              variant="outline"
                              onClick={() => handleProntuario(c)}
                            >
                              <FileText className="h-4 w-4" />
                            </AcaoConsultaButton>
                            {(c.status === "AGENDADA" || c.status === "CONFIRMADA") && (
                              <AcaoConsultaButton
                                label="Marcar como Realizada"
                                variant="outline"
                                onClick={() => handleRealizar(c)}
                                className="text-green-600 hover:text-green-700"
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </AcaoConsultaButton>
                            )}
                          </div>
                        </TableCell>
                      )}

                      {/* Ações do ADMIN / SECRETARIA */}
                      {podeGerenciar && (
                        <TableCell>
                          <div className="flex flex-wrap gap-1.5 items-center">
                            {isAdmin() && (
                              <AcaoConsultaButton
                                label="Ver / criar prontuário"
                                variant="outline"
                                aria-label={`Gerenciar prontuário de ${c.paciente?.nome ?? "paciente"}`}
                                onClick={() => handleProntuario(c)}
                              >
                                <FileText className="h-3.5 w-3.5" />
                              </AcaoConsultaButton>
                            )}
                            {isAdmin() && (c.status === "AGENDADA" || c.status === "CONFIRMADA") && (
                              <AcaoConsultaButton
                                label="Marcar como Realizada"
                                variant="outline"
                                className="text-green-600 hover:text-green-700"
                                aria-label={`Marcar consulta de ${c.paciente?.nome ?? "paciente"} como realizada`}
                                onClick={() => handleRealizar(c)}
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                              </AcaoConsultaButton>
                            )}
                            {googleCalendarEventLink && (
                              <AcaoConsultaButton
                                label="Abrir card"
                                variant="outline"
                                className="text-blue-700 hover:text-blue-800"
                                aria-label={`Abrir card da agenda de ${c.paciente?.nome ?? "paciente"}`}
                                onClick={() => window.open(googleCalendarEventLink, "_blank", "noopener,noreferrer")}
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                              </AcaoConsultaButton>
                            )}
                            <AcaoConsultaButton
                              label={sincronizandoId === c.id ? "Cadastrando..." : "Re-cadastrar na agenda"}
                              variant="outline"
                              disabled={sincronizandoId !== null}
                              onClick={() => handleRecadastrarNaAgenda(c)}
                            >
                              {sincronizandoId === c.id ? (
                                <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <CalendarPlus className="h-3.5 w-3.5" />
                              )}
                            </AcaoConsultaButton>
                            <AcaoConsultaButton
                              label="Editar consulta"
                              variant="outline"
                              aria-label={`Editar consulta de ${c.paciente?.nome ?? "paciente"}`}
                              onClick={() => handleEditar(c)}
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </AcaoConsultaButton>
                            <AcaoConsultaButton
                              label="Excluir consulta"
                              variant="outline"
                              className="text-destructive hover:text-destructive/90"
                              aria-label={`Excluir consulta de ${c.paciente?.nome ?? "paciente"}`}
                              onClick={() => handleDeletar(c)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </AcaoConsultaButton>
                            {isSecretaria() && (
                              <AcaoConsultaButton
                                label="Enviar confirmação via WhatsApp"
                                variant="outline"
                                className="text-green-600 hover:text-green-700 hover:border-green-300 disabled:opacity-50"
                                disabled={
                                  !c.paciente?.telefone || (c.status !== "AGENDADA" && c.status !== "CONFIRMADA")
                                }
                                onClick={() =>
                                  abrirWhatsApp(
                                    c.paciente!.telefone!,
                                    `Ola, ${c.paciente!.nome}!\n\nPassando para confirmar sua consulta agendada para o dia ${formatData(c.data)} as ${c.hora}h.\n\nPor favor, responda confirmando sua presenca ou nos avise caso precise remarcar.\n\nObrigado! - Instituto de Saude de Guarapuava`,
                                  )
                                }
                              >
                                <MessageCircle className="h-3.5 w-3.5" />
                              </AcaoConsultaButton>
                            )}
                            <AcaoConsultaButton
                              label="Marcar como Confirmada"
                              variant="outline"
                              className="text-green-600 hover:text-green-700 hover:border-green-300 disabled:opacity-50"
                              disabled={c.status !== "AGENDADA"}
                              onClick={() =>
                                setConfirmar({
                                  titulo: "Confirmar Consulta",
                                  descricao: `Deseja confirmar a consulta de ${c.paciente?.nome}?`,
                                  labelConfirmar: "Confirmar",
                                  variante: "default",
                                  acao: async () => {
                                    await ConsultaService.confirmar(c.id!);
                                    toast.success("Consulta confirmada!");
                                    await carregar();
                                  },
                                })
                              }
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            </AcaoConsultaButton>
                            <AcaoConsultaButton
                              label="Cancelar Consulta"
                              variant="outline"
                              className="text-orange-500 hover:text-orange-600 hover:border-orange-300 disabled:opacity-50"
                              disabled={c.status !== "AGENDADA" && c.status !== "CONFIRMADA"}
                              onClick={() =>
                                setConfirmar({
                                  titulo: "Cancelar Consulta",
                                  descricao: `Deseja cancelar a consulta de ${c.paciente?.nome}?`,
                                  labelConfirmar: "Cancelar Consulta",
                                  variante: "destructive",
                                  acao: async () => {
                                    await ConsultaService.cancelar(c.id!);
                                    toast.success("Consulta cancelada!");
                                    await carregar();
                                  },
                                })
                              }
                            >
                              <XCircle className="h-3.5 w-3.5" />
                            </AcaoConsultaButton>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {podeGerenciar && (
        <NovaConsultaModal open={open} onOpenChange={setOpen} onSaved={carregar} consulta={selecionada} />
      )}
      <ProntuarioModal
        open={prontuarioOpen}
        onOpenChange={setProntuarioOpen}
        consulta={consultaProntuario}
        onSaved={carregar}
      />
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

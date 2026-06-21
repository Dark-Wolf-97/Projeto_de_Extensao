import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  CalendarPlus, MessageSquare, FileText, Cake, Clock,
  CheckCircle2, AlertTriangle, CalendarCheck, CalendarClock,
  Users, TrendingUp, XCircle, Activity,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell, Tooltip as RechartsTooltip,
} from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { ConsultaService, Consulta } from "@/services/ConsultaService";
import { AniversarioService, Aniversariante } from "@/services/AniversarioService";
import { PacienteService } from "@/services/PacienteService";
import { NovaConsultaModal } from "@/components/modals/NovaConsultaModal";
import { ProntuarioModal } from "@/components/modals/ProntuarioModal";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

// ─── Helpers compartilhados ───────────────────────────────────────────────────

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

const STATUS_CORES: Record<string, string> = {
  AGENDADA: "#3b82f6",
  CONFIRMADA: "#22c55e",
  REALIZADA: "#6b7280",
  CANCELADA: "#ef4444",
};

function horasPassadas(data: string, hora: string): number {
  const dt = new Date(`${data.split("T")[0]}T${hora}:00`);
  return (Date.now() - dt.getTime()) / (1000 * 60 * 60);
}

type IndicadorInfo = { cor: string; titulo: string };

function getIndicador(c: Consulta): IndicadorInfo {
  if (c.status !== "REALIZADA") {
    return { cor: "bg-white border border-gray-300", titulo: "Consulta não realizada" };
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

function formatData(iso?: string) {
  if (!iso) return "—";
  const date = new Date(iso.split("T")[0] + "T12:00:00");
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

// ─── HOME ADMIN ───────────────────────────────────────────────────────────────

function HomeAdmin() {
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [totalPacientes, setTotalPacientes] = useState(0);

  useEffect(() => {
    Promise.all([ConsultaService.listar(), PacienteService.listar()])
      .then(([cons, pacs]) => {
        setConsultas(cons);
        setTotalPacientes(pacs.length);
      })
      .catch(() => toast.error("Erro ao carregar dados do dashboard"));
  }, []);

  const hoje = new Date();
  const mes = hoje.getMonth();
  const ano = hoje.getFullYear();
  const diaAtual = hoje.getDate();

  const consultasMes = consultas.filter((c) => {
    if (!c.data) return false;
    const d = new Date(c.data.split("T")[0] + "T12:00:00");
    return d.getMonth() === mes && d.getFullYear() === ano;
  });

  const totalMes = consultasMes.length;
  const realizadas = consultasMes.filter((c) => c.status === "REALIZADA").length;
  const canceladas = consultasMes.filter((c) => c.status === "CANCELADA").length;

  // Gráfico 1: consultas por dia do mês (do dia 1 até hoje)
  const porDia = Array.from({ length: diaAtual }, (_, i) => {
    const dia = i + 1;
    return {
      dia: String(dia),
      total: consultasMes.filter((c) => {
        const d = new Date(c.data.split("T")[0] + "T12:00:00");
        return d.getDate() === dia;
      }).length,
    };
  });

  // Gráfico 2: distribuição por status (donut)
  const porStatus = (["AGENDADA", "CONFIRMADA", "REALIZADA", "CANCELADA"] as const)
    .map((s) => ({
      name: STATUS_LABEL[s],
      value: consultasMes.filter((c) => c.status === s).length,
      fill: STATUS_CORES[s],
    }))
    .filter((s) => s.value > 0);

  // Gráfico 3: consultas por médico (horizontal)
  const medicoMap: Record<string, number> = {};
  consultasMes.forEach((c) => {
    const nome = c.medico?.nome ?? "Sem médico";
    medicoMap[nome] = (medicoMap[nome] || 0) + 1;
  });
  const porMedico = Object.entries(medicoMap)
    .map(([medico, total]) => ({ medico, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 7);

  // Gráfico 4: consultas por mês (últimos 6 meses)
  const porMesArray = Array.from({ length: 6 }, (_, i) => {
    const ref = new Date(hoje.getFullYear(), hoje.getMonth() - (5 - i), 1);
    const m = ref.getMonth();
    const a = ref.getFullYear();
    const label = ref.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
    const total = consultas.filter((c) => {
      if (!c.data) return false;
      const d = new Date(c.data.split("T")[0] + "T12:00:00");
      return d.getMonth() === m && d.getFullYear() === a;
    }).length;
    return { mes: label, total };
  });

  const nomeMes = hoje.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  return (
    <div className="p-6 flex flex-col gap-5">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-0.5 capitalize">Resumo de {nomeMes}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <Activity className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalMes}</p>
                <p className="text-xs text-muted-foreground">Consultas no mês</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-100 p-2">
                <CalendarCheck className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{realizadas}</p>
                <p className="text-xs text-muted-foreground">Realizadas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-red-100 p-2">
                <XCircle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-500">{canceladas}</p>
                <p className="text-xs text-muted-foreground">Canceladas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-accent/10 p-2">
                <Users className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalPacientes}</p>
                <p className="text-xs text-muted-foreground">Total de pacientes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos linha 1: Consultas por dia + Distribuição por status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Bar chart: consultas por dia */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-primary" />
              Consultas por Dia
            </CardTitle>
          </CardHeader>
          <CardContent>
            {porDia.length === 0 ? (
              <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">
                Nenhuma consulta no mês
              </div>
            ) : (
              <ChartContainer
                config={{ total: { label: "Consultas", color: "hsl(var(--primary))" } }}
                className="h-[220px]"
              >
                <BarChart data={porDia} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <XAxis dataKey="dia" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="total" fill="var(--color-total)" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Donut: distribuição por status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-4 w-4 text-primary" />
              Por Status
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-3">
            {porStatus.length === 0 ? (
              <div className="h-[160px] flex items-center justify-center text-muted-foreground text-sm">
                Sem dados
              </div>
            ) : (
              <ChartContainer
                config={Object.fromEntries(
                  porStatus.map((s) => [s.name, { label: s.name, color: s.fill }])
                )}
                className="h-[160px] w-full"
              >
                <PieChart>
                  <Pie
                    data={porStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    dataKey="value"
                    paddingAngle={2}
                  >
                    {porStatus.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    formatter={(value, name) => [`${value}`, `${name}`]}
                    contentStyle={{ fontSize: 12 }}
                  />
                </PieChart>
              </ChartContainer>
            )}
            {/* Legenda */}
            <ul className="w-full grid grid-cols-2 gap-x-3 gap-y-1">
              {porStatus.map((s) => (
                <li key={s.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="inline-block h-2.5 w-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: s.fill }} />
                  {s.name}: <span className="font-semibold text-foreground">{s.value}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos linha 2: por médico + por mês */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Gráfico 3: consultas por médico */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4 text-primary" />
              Consultas por Médico
            </CardTitle>
          </CardHeader>
          <CardContent>
            {porMedico.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                Nenhuma consulta no mês
              </div>
            ) : (
              <ChartContainer
                config={{ total: { label: "Consultas", color: "hsl(var(--accent))" } }}
                className="h-[200px]"
              >
                <BarChart
                  data={porMedico}
                  layout="vertical"
                  margin={{ top: 5, right: 20, left: 5, bottom: 5 }}
                >
                  <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
                  <YAxis
                    type="category"
                    dataKey="medico"
                    tick={{ fontSize: 11 }}
                    width={130}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="total" fill="var(--color-total)" radius={[0, 3, 3, 0]} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Gráfico 4: consultas por mês (últimos 6 meses) */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-primary" />
              Consultas por Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{ total: { label: "Consultas", color: "hsl(var(--primary))" } }}
              className="h-[200px]"
            >
              <BarChart data={porMesArray} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <XAxis dataKey="mes" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="total" fill="var(--color-total)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}

// ─── HOME MEDICO ──────────────────────────────────────────────────────────────

function HomeMedico() {
  const navigate = useNavigate();
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [todasConsultas, setTodasConsultas] = useState<Consulta[]>([]);
  const [prontuarioOpen, setProntuarioOpen] = useState(false);
  const [consultaSelecionada, setConsultaSelecionada] = useState<Consulta | null>(null);

  const carregar = async () => {
    try {
      const hoje = new Date().toISOString().slice(0, 10);
      const todas = await ConsultaService.listar();
      setTodasConsultas(todas);
      setConsultas(todas.filter((c) => c.data?.slice(0, 10) === hoje));
    } catch {
      toast.error("Erro ao carregar consultas");
    }
  };

  useEffect(() => { carregar(); }, []);

  const handleRealizar = async (c: Consulta) => {
    try {
      await ConsultaService.realizar(c.id!);
      toast.success("Consulta marcada como Realizada");
      await carregar();
    } catch {
      toast.error("Erro ao atualizar consulta");
    }
  };

  const handleProntuario = (c: Consulta) => {
    setConsultaSelecionada(c);
    setProntuarioOpen(true);
  };

  const agendadas = consultas.filter((c) => c.status === "AGENDADA").length;
  const realizadas = consultas.filter((c) => c.status === "REALIZADA").length;
  const semProntuarioHoje = consultas.filter(
    (c) => c.status === "REALIZADA" && !c.prontuario?.id
  ).length;
  const atrasados = todasConsultas.filter(
    (c) => getIndicador(c).cor === "bg-red-500"
  ).length;

  const hoje = new Date().toLocaleDateString("pt-BR", {
    weekday: "long", day: "2-digit", month: "long", year: "numeric",
  });

  return (
    <div className="p-6 flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground capitalize">{hoje}</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Resumo da sua agenda de hoje</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{consultas.length}</p>
                <p className="text-xs text-muted-foreground">Consultas de hoje</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-2">
                <CalendarClock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{agendadas}</p>
                <p className="text-xs text-muted-foreground">Consultas agendadas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-100 p-2">
                <CalendarCheck className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{realizadas}</p>
                <p className="text-xs text-muted-foreground">Consultas realizadas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={semProntuarioHoje > 0 ? "border-yellow-300 bg-yellow-50/40" : ""}>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className={`rounded-lg p-2 ${semProntuarioHoje > 0 ? "bg-yellow-100" : "bg-gray-100"}`}>
                <FileText className={`h-5 w-5 ${semProntuarioHoje > 0 ? "text-yellow-600" : "text-gray-400"}`} />
              </div>
              <div>
                <p className={`text-2xl font-bold ${semProntuarioHoje > 0 ? "text-yellow-600" : ""}`}>{semProntuarioHoje}</p>
                <p className="text-xs text-muted-foreground">Sem prontuário hoje</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={atrasados > 0 ? "border-red-200 bg-red-50/40" : ""}>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className={`rounded-lg p-2 ${atrasados > 0 ? "bg-red-100" : "bg-gray-100"}`}>
                <AlertTriangle className={`h-5 w-5 ${atrasados > 0 ? "text-red-600" : "text-gray-400"}`} />
              </div>
              <div>
                <p className={`text-2xl font-bold ${atrasados > 0 ? "text-red-600" : ""}`}>{atrasados}</p>
                <p className="text-xs text-muted-foreground">Prontuários atrasados</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-card border-border/60 overflow-hidden">
        <CardHeader className="bg-primary py-3 px-4">
          <CardTitle className="text-white flex items-center gap-2 text-base">
            <Clock className="h-4 w-4" />
            Consultas de Hoje
            <Badge className="ml-auto bg-white/20 text-white border-0">
              {consultas.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted">
              <TableRow>
                <TableHead>Hora</TableHead>
                <TableHead>Paciente</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-6"></TableHead>
                <TableHead>Prontuário</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {consultas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-10">
                    Nenhuma consulta agendada para hoje
                  </TableCell>
                </TableRow>
              ) : (
                consultas.map((c) => {
                  const indicador = getIndicador(c);
                  return (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono text-primary font-medium">{c.hora}</TableCell>
                      <TableCell>
                        <button
                          onClick={() => navigate(`/pacientes/${c.paciente?.id}`)}
                          className="font-medium text-primary hover:underline text-left"
                        >
                          {c.paciente?.nome ?? "—"}
                        </button>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={STATUS_CLASS[c.status] ?? ""}>
                          {STATUS_LABEL[c.status] ?? c.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="w-6 px-2">
                        <div
                          className={`h-4 w-4 rounded-full ${indicador.cor}`}
                          title={indicador.titulo}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleProntuario(c)}
                            title="Ver / criar prontuário"
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                          {c.status === "AGENDADA" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRealizar(c)}
                              title="Marcar como Realizada"
                              className="text-green-600 hover:text-green-700"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ProntuarioModal
        open={prontuarioOpen}
        onOpenChange={setProntuarioOpen}
        consulta={consultaSelecionada}
        onSaved={carregar}
      />
    </div>
  );
}

// ─── HOME SECRETARIA ──────────────────────────────────────────────────────────

function HomeGeral() {
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [aniv, setAniv] = useState<Aniversariante[]>([]);
  const [openConsultas, setOpenConsultas] = useState(false);
  const navigate = useNavigate();

  const carregar = async () => {
    try {
      const hoje = new Date().toISOString().slice(0, 10);
      const [consultasApi, aniversariosApi] = await Promise.all([
        ConsultaService.listar(),
        AniversarioService.listarSemana(),
      ]);
      setConsultas(consultasApi.filter((c) => c.data?.slice(0, 10) === hoje));
      setAniv(aniversariosApi);
    } catch {
      setConsultas([]);
      setAniv([]);
    }
  };

  useEffect(() => { carregar(); }, []);

  return (
    <div className="h-[calc(100vh-4rem)] p-6 flex flex-col gap-5 overflow-hidden">
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
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{consultas.length}</p>
                <p className="text-xs text-muted-foreground">Consultas hoje</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-2">
                <CalendarClock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {consultas.filter((c) => c.status === "CONFIRMADA").length}
                </p>
                <p className="text-xs text-muted-foreground">Confirmadas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-100 p-2">
                <CalendarCheck className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {consultas.filter((c) => c.status === "REALIZADA").length}
                </p>
                <p className="text-xs text-muted-foreground">Realizadas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-red-100 p-2">
                <XCircle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-500">
                  {consultas.filter((c) => c.status === "CANCELADA").length}
                </p>
                <p className="text-xs text-muted-foreground">Canceladas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 flex-1 min-h-0">
        <Card className="flex flex-col overflow-hidden">
          <CardHeader className="bg-primary">
            <CardTitle className="text-white flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Consultas do Dia
              <Badge className="ml-auto bg-gold text-black">{consultas.length}</Badge>
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
                      <TableCell className="font-mono text-primary">{c.hora}</TableCell>
                      <TableCell>{c.paciente?.nome ?? "—"}</TableCell>
                      <TableCell>{c.medico?.nome ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={STATUS_CLASS[c.status] ?? ""}>
                          {STATUS_LABEL[c.status] ?? c.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="flex flex-col overflow-hidden">
          <CardHeader className="bg-accent">
            <CardTitle className="text-white flex items-center gap-2">
              <Cake className="h-5 w-5" />
              Aniversariantes da Semana
              <Badge className="ml-auto bg-gold text-black">{aniv.length}</Badge>
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
                        <Badge variant="outline">{a.idade ?? 0} anos</Badge>
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
    </div>
  );
}

// ─── EXPORT ───────────────────────────────────────────────────────────────────

export default function Home() {
  const { isAdmin, isMedico } = useAuth();
  if (isAdmin()) return <HomeAdmin />;
  if (isMedico()) return <HomeMedico />;
  return <HomeGeral />;
}

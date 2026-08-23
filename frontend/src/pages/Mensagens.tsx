import { PageShell } from "@/components/layout/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock3, MessageCircleMore } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Mensagens() {
  const navigate = useNavigate();

  return (
    <PageShell
      title="Mensagens"
      subtitle="Integração em configuração"
      actions={
        <Button variant="outline" className="gap-2" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
      }
    >
      <Card className="shadow-card border-border/60">
        <CardContent className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center">
          <div className="relative rounded-full bg-muted p-5 text-primary">
            <MessageCircleMore className="h-10 w-10" />
            <Clock3 className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-card p-1 text-gold" />
          </div>
          <div className="max-w-xl space-y-2">
            <h2 className="text-xl font-semibold text-foreground">
              Mensageria ainda não disponível
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              A integração com o WhatsApp será configurada em uma próxima etapa. Até lá,
              o Portal ISG não envia, valida nem registra mensagens automaticamente.
            </p>
          </div>
        </CardContent>
      </Card>
    </PageShell>
  );
}

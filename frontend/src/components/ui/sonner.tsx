import { useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";
import { useTheme } from "next-themes";
import { Toaster as Sonner, toast as sonnerToast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type ToasterProps = React.ComponentProps<typeof Sonner>;

type ErrorListener = (message: string) => void;

let errorListener: ErrorListener | null = null;

function getErrorMessage(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);
  const match = raw.match(/(?:^|\s)\d{3}(?::\s*|\s+)(.+)$/);
  return match?.[1].trim() || raw;
}

function openErrorDetails(message: string) {
  errorListener?.(message);
}

function ErrorToast({ id, message }: { id: string | number; message: string }) {
  const resumo = message.length > 180 ? `${message.slice(0, 177)}...` : message;

  return (
    <button
      type="button"
      className="flex w-full items-start gap-3 rounded-lg border border-destructive/25 bg-background p-4 text-left text-foreground shadow-lg transition-colors hover:bg-destructive/5 focus:outline-none focus:ring-2 focus:ring-destructive focus:ring-offset-2"
      onClick={() => {
        openErrorDetails(message);
        sonnerToast.dismiss(id);
      }}
      aria-label="Ver detalhes do erro"
    >
      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" aria-hidden="true" />
      <span className="grid min-w-0 gap-1">
        <span className="font-semibold">Ocorreu um erro</span>
        <span className="break-words text-sm text-muted-foreground">{resumo}</span>
        <span className="text-xs font-medium text-primary">Clique para ver os detalhes</span>
      </span>
    </button>
  );
}

function showError(error: unknown) {
  const message = getErrorMessage(error);
  return sonnerToast.custom(
    (id) => <ErrorToast id={id} message={message} />,
    { duration: 8000 },
  );
}

const toast = {
  success: sonnerToast.success,
  error: showError,
};

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      duration={8000}
      pauseWhenPageIsHidden
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

function ErrorDetailsDialog() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    errorListener = setMessage;
    return () => {
      errorListener = null;
    };
  }, []);

  return (
    <Dialog open={message !== null} onOpenChange={(open) => !open && setMessage(null)}>
      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-[620px]">
        <DialogHeader className="border-b pb-4 pr-8">
          <DialogTitle>Detalhes do erro</DialogTitle>
          <DialogDescription>
            Confira a mensagem retornada antes de tentar novamente.
          </DialogDescription>
        </DialogHeader>
        <p className="whitespace-pre-wrap break-words rounded-md bg-muted p-4 font-mono text-sm leading-6 text-foreground">
          {message}
        </p>
        <DialogFooter className="border-t pt-4">
          <Button type="button" onClick={() => setMessage(null)}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { ErrorDetailsDialog, Toaster, toast };

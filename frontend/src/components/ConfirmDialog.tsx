import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  titulo: string;
  descricao: string;
  labelConfirmar?: string;
  variante?: "destructive" | "default";
  carregando?: boolean;
  onConfirmar: () => void;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  titulo,
  descricao,
  labelConfirmar = "Confirmar",
  variante = "destructive",
  carregando = false,
  onConfirmar,
}: Props) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{titulo}</AlertDialogTitle>
          <AlertDialogDescription>{descricao}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={carregando}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            disabled={carregando}
            onClick={onConfirmar}
            className={
              variante === "destructive"
                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                : ""
            }
          >
            {carregando ? "Aguarde..." : labelConfirmar}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

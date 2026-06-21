import { ReactNode } from "react";

interface Props {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  centerTitle?: boolean;
}

export function PageShell({ title, subtitle, actions, children, centerTitle }: Props) {
  return (
    <div className="p-6 flex flex-col gap-5 min-h-full">
      <div className={`flex items-center gap-4 flex-wrap ${centerTitle ? "justify-center" : "justify-between"}`}>
        <div className={centerTitle ? "text-center" : ""}>
          <h1 className="text-2xl font-bold text-primary">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
        </div>
        {actions && <div className="flex gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  );
}

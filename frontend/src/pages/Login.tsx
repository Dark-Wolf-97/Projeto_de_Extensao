import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { Stethoscope } from "lucide-react";
import logo from "../assets/images/logo-isg.png";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");


  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // sem lógica de auth — entra direto
    login();
    navigate("/home");
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "var(--gradient-brand)" }}
    >
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center gap-3 mb-6">
          <img src={logo} width={50} height={50} alt="Logo" className="rounded-2xl" />
          <h1 className="text-3xl font-bold text-primary-foreground">Portal ISG</h1>
        </div>

        <Card className="p-8 shadow-elevated border-0">
          <form onSubmit={handleLogin} className="grid gap-5">
            <div className="grid gap-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="senha">Senha</Label>
              <Input id="senha" type="password" placeholder="••••••••" />
            </div>
            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-11"
            >
              Entrar
            </Button>
            <a href="#" className="text-center text-sm text-accent hover:underline">
              Esqueci minha senha
            </a>
          </form>
        </Card>

        <p className="text-center mt-6 text-xs text-primary-foreground/70">
          © {new Date().getFullYear()} Portal ISG · Todos os direitos reservados
        </p>
      </div>
    </div>
  );
}

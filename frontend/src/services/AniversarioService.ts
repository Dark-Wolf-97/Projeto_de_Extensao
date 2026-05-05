import { http, safeRequest } from "./http";

export interface Aniversariante {
  id?: number | string;
  nome: string;
  dataNascimento: string; // yyyy-mm-dd
  telefone?: string;
  idade?: number;
}

function calcIdade(data: string): number {
  const nasc = new Date(data);
  const hoje = new Date();
  let idade = hoje.getFullYear() - nasc.getFullYear();
  const m = hoje.getMonth() - nasc.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
  return idade;
}

const ano = new Date().getFullYear();
const mockAniversariantes: Aniversariante[] = [
  { id: 1, nome: "Ana Souza", dataNascimento: "1990-05-12", telefone: "(11) 99999-1111" },
  { id: 2, nome: "Bruno Lima", dataNascimento: "1985-05-14", telefone: "(11) 98888-2222" },
  { id: 3, nome: "Carla Mendes", dataNascimento: "1992-05-15", telefone: "(11) 97777-3333" },
  { id: 4, nome: "Diego Rocha", dataNascimento: "1978-05-16", telefone: "(11) 96666-4444" },
  { id: 5, nome: "Eduarda Pinto", dataNascimento: `${ano - 30}-05-18`, telefone: "(11) 95555-5555" },
].map((a) => ({ ...a, idade: calcIdade(a.dataNascimento) }));

export const AniversarioService = {
  listar: () => safeRequest(() => http<Aniversariante[]>("/aniversarios"), mockAniversariantes),
  
  listarSemana: () =>
    safeRequest(() => http<Aniversariante[]>("/aniversarios/semana"), mockAniversariantes),
};

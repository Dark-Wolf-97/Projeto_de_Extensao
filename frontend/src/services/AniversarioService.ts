import { http } from "./http";

export interface Aniversariante {
  id?: number | string;
  nome: string;
  dataNascimento: string;
  telefone?: string;
  idade?: number;
}

function calcIdade(data?: string): number {
  if (!data) return 0;

  const nasc = new Date(data);
  if (isNaN(nasc.getTime())) return 0;

  const hoje = new Date();

  let idade = hoje.getFullYear() - nasc.getFullYear();
  const mes = hoje.getMonth() - nasc.getMonth();

  if (mes < 0 || (mes === 0 && hoje.getDate() < nasc.getDate())) {
    idade--;
  }

  return idade;
}

export const AniversarioService = {
  listar: async (): Promise<Aniversariante[]> => {
    const data = await http<Aniversariante[]>("/pacientes/aniversarios");

    return data.map((a) => ({
      ...a,
      idade: calcIdade(a.dataNascimento),
    }));
  },

  listarSemana: async (): Promise<Aniversariante[]> => {
    const data = await http<Aniversariante[]>("/pacientes/aniversarios");

    const hoje = new Date();
    const diaAtual = hoje.getDate();

    const filtrados = data.filter((p) => {
      if (!p.dataNascimento) return false;

      const d = new Date(p.dataNascimento);
      if (isNaN(d.getTime())) return false;

      const diffDias =
        Math.abs(d.getDate() - diaAtual);

      return diffDias <= 7;
    });

    return filtrados.map((a) => ({
      ...a,
      idade: calcIdade(a.dataNascimento),
    }));
  },
};
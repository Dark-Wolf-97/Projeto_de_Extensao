export class CreatePacienteDto {
  nome!: string;
  cpf!: string;
  telefone!: string;
  email?: string;
  dataNascimento?: string;
}
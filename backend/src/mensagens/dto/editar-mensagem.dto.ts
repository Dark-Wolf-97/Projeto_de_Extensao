import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class EditarMensagemDto {
  @IsNotEmpty({ message: 'Conteúdo obrigatório' })
  @IsString()
  @MaxLength(2000, { message: 'Conteúdo pode ter no máximo 2000 caracteres' })
  conteudo!: string;
}

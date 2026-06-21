import { IsInt, IsOptional, IsString, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProntuarioDto {
  @IsInt({ message: 'Consulta inválida' })
  @Type(() => Number)
  consultaId!: number;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  anamnese?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  diagnostico?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  prescricao?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  observacoes?: string;
}

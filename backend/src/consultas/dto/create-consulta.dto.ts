import { StatusConsulta } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Matches,
} from 'class-validator';

export class CreateConsultaDto {
  @IsInt({ message: 'Paciente inválido' })
  @Type(() => Number)
  pacienteId!: number;

  @IsInt({ message: 'Médico inválido' })
  @Type(() => Number)
  medicoId!: number;

  @IsDateString({}, { message: 'Data inválida' })
  data!: string;

  @IsNotEmpty({ message: 'Hora obrigatória' })
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'Hora deve estar no formato HH:mm' })
  hora!: string;

  @IsEnum(StatusConsulta, { message: 'Status inválido' })
  @IsOptional()
  status?: StatusConsulta;

  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'Observações podem ter no máximo 1000 caracteres' })
  observacoes?: string;
}

import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, IsString } from 'class-validator';

export class CreateConsultaDto {
  @IsDateString()
  data!: string;

  @IsString()
  hora!: string;

  @IsOptional()
  @IsString()
  medico?: string;

  @IsOptional()
  @IsString()
  observacoes?: string;

  @IsInt()
  @Type(() => Number)
  pacienteId!: number;

  @IsOptional()
  @IsString()
  status?: string;
}
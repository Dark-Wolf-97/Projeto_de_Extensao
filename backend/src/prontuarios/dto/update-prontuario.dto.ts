import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateProntuarioDto {
  @IsOptional() @IsString() @MaxLength(5000) anamnese?: string;
  @IsOptional() @IsString() @MaxLength(5000) diagnostico?: string;
  @IsOptional() @IsString() @MaxLength(5000) prescricao?: string;
  @IsOptional() @IsString() @MaxLength(5000) observacoes?: string;
}

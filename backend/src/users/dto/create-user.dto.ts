import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { Role } from '@prisma/client';

export class CreateUserDto {
  @IsNotEmpty({ message: 'Nome obrigatório' })
  @IsString()
  @MaxLength(100, { message: 'Nome pode ter no máximo 100 caracteres' })
  @Matches(/^[a-zA-ZÀ-ÿ\s]+$/, { message: 'Nome deve conter apenas letras' })
  nome!: string;

  @IsEmail({}, { message: 'E-mail inválido' })
  @MaxLength(150, { message: 'E-mail pode ter no máximo 150 caracteres' })
  email!: string;

  @IsNotEmpty({ message: 'Senha obrigatória' })
  @IsString()
  @MinLength(6, { message: 'Senha deve ter no mínimo 6 caracteres' })
  @MaxLength(255)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d\s]).+$/, {
    message:
      'A senha deve conter pelo menos uma letra maiúscula, uma minúscula, um número e um caractere especial',
  })
  senha!: string;

  @IsEnum(Role, { message: 'Perfil inválido' })
  role!: Role;

  @ValidateIf((o) => o.role === Role.MEDICO)
  @IsNotEmpty({ message: 'CRM é obrigatório para médicos' })
  @IsString()
  @MaxLength(20, { message: 'CRM pode ter no máximo 20 caracteres' })
  crm?: string;

  @ValidateIf((o) => o.role === Role.MEDICO)
  @IsNotEmpty({ message: 'Especialidade é obrigatória para médicos' })
  @IsString()
  @MaxLength(100, { message: 'Especialidade pode ter no máximo 100 caracteres' })
  especialidade?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20, { message: 'Telefone pode ter no máximo 20 caracteres' })
  telefone?: string;
}

import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

function calcularDigito(digits: string, pesoInicial: number): number {
  let soma = 0;
  for (let i = 0; i < pesoInicial - 1; i++) {
    soma += parseInt(digits[i]) * (pesoInicial - i);
  }
  const resto = (soma * 10) % 11;
  return resto >= 10 ? 0 : resto;
}

function CpfValido(options?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'cpfValido',
      target: (object as { constructor: Function }).constructor,
      propertyName,
      options: { message: 'CPF inválido', ...options },
      validator: {
        validate(value: unknown, _args: ValidationArguments) {
          if (!value || typeof value !== 'string') return true;
          const d = value.replace(/\D/g, '');
          if (d.length !== 11) return false;
          if (/^(\d)\1{10}$/.test(d)) return false;
          return (
            calcularDigito(d, 10) === parseInt(d[9]) &&
            calcularDigito(d, 11) === parseInt(d[10])
          );
        },
      },
    });
  };
}

function MaxIdadeAnos(maxAnos: number, options?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'maxIdadeAnos',
      target: (object as { constructor: Function }).constructor,
      propertyName,
      options: {
        message: `Idade máxima permitida é de ${maxAnos} anos`,
        ...options,
      },
      validator: {
        validate(value: unknown, _args: ValidationArguments) {
          if (!value || typeof value !== 'string') return true;
          const nascimento = new Date(value);
          if (isNaN(nascimento.getTime())) return true;
          const limite = new Date();
          limite.setFullYear(limite.getFullYear() - maxAnos);
          return nascimento >= limite;
        },
      },
    });
  };
}

export class CreatePacienteDto {
  @IsNotEmpty({ message: 'Nome obrigatório' })
  @IsString()
  @MaxLength(100, { message: 'Nome pode ter no máximo 100 caracteres' })
  @Matches(/^[a-zA-ZÀ-ÿ\s]+$/, { message: 'Nome deve conter apenas letras' })
  nome!: string;

  @IsNotEmpty({ message: 'CPF obrigatório' })
  @IsString()
  @MaxLength(14)
  @Matches(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, {
    message: 'CPF inválido. Use o formato 000.000.000-00',
  })
  @CpfValido()
  cpf!: string;

  @IsNotEmpty({ message: 'Telefone obrigatório' })
  @IsString()
  @MaxLength(20)
  telefone!: string;

  @IsOptional()
  @IsDateString({}, { message: 'Data de nascimento inválida' })
  @MaxIdadeAnos(120)
  dataNascimento?: string;
}

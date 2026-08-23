import 'dotenv/config';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from './prisma/prisma.service';
import { AdminBootstrapStore, bootstrapFirstAdmin } from './bootstrap-admin';

export interface SeedRoleUserData {
  nome?: string;
  email?: string;
  senha?: string;
  crm?: string;
  especialidade?: string;
  telefone?: string;
}

export interface SeedUserStore {
  findByEmail(email: string): Promise<{ role: Role } | null>;
  create(data: {
    nome: string;
    email: string;
    senha: string;
    role: Role;
    crm?: string;
    especialidade?: string;
    telefone?: string;
  }): Promise<void>;
}

type PasswordHasher = (password: string) => Promise<string>;

function trimmedOrUndefined(value: string | undefined): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function validarNome(nome: string, campo: string) {
  if (nome.length > 100 || !/^[a-zA-ZÀ-ÿ\s]+$/.test(nome)) {
    throw new Error(
      `${campo} deve ter no máximo 100 caracteres e conter apenas letras e espaços`,
    );
  }
}

function validarEmail(email: string, campo: string): string {
  const normalizado = email.toLowerCase();
  if (
    normalizado.length > 150 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizado)
  ) {
    throw new Error(`${campo} deve conter um e-mail válido`);
  }
  return normalizado;
}

function validarSenha(senha: string, campo: string) {
  if (senha.length < 12) {
    throw new Error(`${campo} deve ter pelo menos 12 caracteres`);
  }
  if (Buffer.byteLength(senha, 'utf8') > 72) {
    throw new Error(`${campo} deve ter no máximo 72 bytes`);
  }
}

/**
 * Cria um usuário SECRETARIA ou MEDICO a partir de variáveis de ambiente com
 * prefixo `${prefixo}_*`. Se nenhuma das variáveis do perfil estiver
 * definida, o perfil é ignorado (retorna 'skipped'). Se apenas parte delas
 * estiver definida, falha com mensagem indicando a variável ausente — o
 * mesmo comportamento já usado no bootstrap do ADMIN.
 */
export async function seedRoleUser(
  store: SeedUserStore,
  role: typeof Role.SECRETARIA | typeof Role.MEDICO,
  prefixo: string,
  dados: SeedRoleUserData,
  hashPassword: PasswordHasher = (password) => bcrypt.hash(password, 10),
): Promise<'created' | 'already-exists' | 'skipped'> {
  const nome = trimmedOrUndefined(dados.nome);
  const emailBruto = trimmedOrUndefined(dados.email);
  const senha = trimmedOrUndefined(dados.senha);

  if (!nome && !emailBruto && !senha) {
    return 'skipped';
  }

  if (!nome) throw new Error(`${prefixo}_NOME é obrigatória`);
  if (!emailBruto) throw new Error(`${prefixo}_EMAIL é obrigatória`);
  if (!senha) throw new Error(`${prefixo}_PASSWORD é obrigatória`);

  validarNome(nome, `${prefixo}_NOME`);
  const email = validarEmail(emailBruto, `${prefixo}_EMAIL`);
  validarSenha(senha, `${prefixo}_PASSWORD`);

  let crm: string | undefined;
  let especialidade: string | undefined;
  if (role === Role.MEDICO) {
    crm = trimmedOrUndefined(dados.crm);
    especialidade = trimmedOrUndefined(dados.especialidade);
    if (!crm) throw new Error(`${prefixo}_CRM é obrigatória`);
    if (!especialidade)
      throw new Error(`${prefixo}_ESPECIALIDADE é obrigatória`);
    if (crm.length > 20) {
      throw new Error(`${prefixo}_CRM pode ter no máximo 20 caracteres`);
    }
    if (especialidade.length > 100) {
      throw new Error(
        `${prefixo}_ESPECIALIDADE pode ter no máximo 100 caracteres`,
      );
    }
  }

  const telefone = trimmedOrUndefined(dados.telefone);
  if (telefone && telefone.length > 20) {
    throw new Error(`${prefixo}_TELEFONE pode ter no máximo 20 caracteres`);
  }

  const existente = await store.findByEmail(email);
  if (existente) {
    if (existente.role !== role) {
      throw new Error(
        `${prefixo}_EMAIL já pertence a um usuário com outro perfil`,
      );
    }
    return 'already-exists';
  }

  const senhaHash = await hashPassword(senha);
  await store.create({
    nome,
    email,
    senha: senhaHash,
    role,
    crm,
    especialidade,
    telefone,
  });
  return 'created';
}

async function run() {
  let prisma: PrismaService | undefined;

  try {
    const client = new PrismaService();
    prisma = client;
    await client.$connect();

    const adminStore: AdminBootstrapStore = {
      findByEmail: (email) =>
        client.user.findUnique({ where: { email }, select: { role: true } }),
      findAnyAdmin: () =>
        client.user.findFirst({
          where: { role: Role.ADMIN },
          select: { id: true },
        }),
      create: async (data) => {
        await client.user.create({ data, select: { id: true } });
      },
    };

    const userStore: SeedUserStore = {
      findByEmail: (email) =>
        client.user.findUnique({ where: { email }, select: { role: true } }),
      create: async (data) => {
        await client.user.create({ data, select: { id: true } });
      },
    };

    const temAdminEnv =
      trimmedOrUndefined(process.env.ADMIN_NOME) ||
      trimmedOrUndefined(process.env.ADMIN_EMAIL) ||
      trimmedOrUndefined(process.env.ADMIN_PASSWORD);

    if (temAdminEnv) {
      const resultadoAdmin = await bootstrapFirstAdmin(adminStore, process.env);
      console.log(
        resultadoAdmin === 'created'
          ? 'Usuário ADMIN criado com sucesso.'
          : 'Usuário ADMIN já existe. Nenhuma alteração foi realizada.',
      );
    } else {
      console.log(
        'Variáveis ADMIN_* não definidas. Usuário ADMIN não foi criado.',
      );
    }

    const resultadoSecretaria = await seedRoleUser(
      userStore,
      Role.SECRETARIA,
      'SECRETARIA',
      {
        nome: process.env.SECRETARIA_NOME,
        email: process.env.SECRETARIA_EMAIL,
        senha: process.env.SECRETARIA_PASSWORD,
        telefone: process.env.SECRETARIA_TELEFONE,
      },
    );
    console.log(
      {
        created: 'Usuário SECRETARIA criado com sucesso.',
        'already-exists':
          'Usuário SECRETARIA já existe. Nenhuma alteração foi realizada.',
        skipped:
          'Variáveis SECRETARIA_* não definidas. Usuário SECRETARIA não foi criado.',
      }[resultadoSecretaria],
    );

    const resultadoMedico = await seedRoleUser(
      userStore,
      Role.MEDICO,
      'MEDICO',
      {
        nome: process.env.MEDICO_NOME,
        email: process.env.MEDICO_EMAIL,
        senha: process.env.MEDICO_PASSWORD,
        crm: process.env.MEDICO_CRM,
        especialidade: process.env.MEDICO_ESPECIALIDADE,
        telefone: process.env.MEDICO_TELEFONE,
      },
    );
    console.log(
      {
        created: 'Usuário MEDICO criado com sucesso.',
        'already-exists':
          'Usuário MEDICO já existe. Nenhuma alteração foi realizada.',
        skipped:
          'Variáveis MEDICO_* não definidas. Usuário MEDICO não foi criado.',
      }[resultadoMedico],
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Erro desconhecido';
    console.error(`Falha no seed de usuários: ${message}`);
    process.exitCode = 1;
  } finally {
    await prisma?.$disconnect();
  }
}

if (require.main === module) {
  void run();
}

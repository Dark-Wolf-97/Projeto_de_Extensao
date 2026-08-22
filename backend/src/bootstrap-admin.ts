import 'dotenv/config';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from './prisma/prisma.service';

interface AdminBootstrapData {
  nome: string;
  email: string;
  senha: string;
  role: Role;
}

export interface AdminBootstrapStore {
  findByEmail(email: string): Promise<{ role: Role } | null>;
  findAnyAdmin(): Promise<{ id: number } | null>;
  create(data: AdminBootstrapData): Promise<void>;
}

export interface AdminBootstrapEnvironment {
  ADMIN_NOME?: string;
  ADMIN_EMAIL?: string;
  ADMIN_PASSWORD?: string;
}

type PasswordHasher = (password: string) => Promise<string>;

function required(value: string | undefined, variableName: string): string {
  const normalized = value?.trim();
  if (!normalized) {
    throw new Error(`${variableName} é obrigatória`);
  }
  return normalized;
}

function validateEnvironment(environment: AdminBootstrapEnvironment) {
  const nome = required(environment.ADMIN_NOME, 'ADMIN_NOME');
  const email = required(environment.ADMIN_EMAIL, 'ADMIN_EMAIL').toLowerCase();
  const password = required(environment.ADMIN_PASSWORD, 'ADMIN_PASSWORD');

  if (nome.length > 100 || !/^[a-zA-ZÀ-ÿ\s]+$/.test(nome)) {
    throw new Error(
      'ADMIN_NOME deve ter no máximo 100 caracteres e conter apenas letras e espaços',
    );
  }
  if (email.length > 150 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('ADMIN_EMAIL deve conter um e-mail válido');
  }
  if (password.length < 12) {
    throw new Error('ADMIN_PASSWORD deve ter pelo menos 12 caracteres');
  }
  if (Buffer.byteLength(password, 'utf8') > 72) {
    throw new Error('ADMIN_PASSWORD deve ter no máximo 72 bytes');
  }
  // if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d\s]).+$/.test(password)) {
  //   throw new Error(
  //     'ADMIN_PASSWORD deve conter letra maiúscula, letra minúscula, número e caractere especial',
  //   );
  // }

  return { nome, email, password };
}

export async function bootstrapFirstAdmin(
  store: AdminBootstrapStore,
  environment: AdminBootstrapEnvironment,
  hashPassword: PasswordHasher = (password) => bcrypt.hash(password, 10),
): Promise<'created' | 'already-exists'> {
  const { nome, email, password } = validateEnvironment(environment);
  const userWithEmail = await store.findByEmail(email);

  if (userWithEmail) {
    if (userWithEmail.role !== Role.ADMIN) {
      throw new Error(
        'ADMIN_EMAIL já pertence a um usuário que não é administrador',
      );
    }
    return 'already-exists';
  }

  if (await store.findAnyAdmin()) {
    return 'already-exists';
  }

  const senha = await hashPassword(password);
  await store.create({ nome, email, senha, role: Role.ADMIN });
  return 'created';
}

async function run() {
  let prisma: PrismaService | undefined;

  try {
    validateEnvironment(process.env);
    const client = new PrismaService();
    prisma = client;
    await client.$connect();

    const result = await bootstrapFirstAdmin(
      {
        findByEmail: (email) =>
          client.user.findUnique({
            where: { email },
            select: { role: true },
          }),
        findAnyAdmin: () =>
          client.user.findFirst({
            where: { role: Role.ADMIN },
            select: { id: true },
          }),
        create: async (data) => {
          await client.user.create({ data, select: { id: true } });
        },
      },
      process.env,
    );

    console.log(
      result === 'created'
        ? 'Primeiro administrador criado com sucesso.'
        : 'Já existe um administrador. Nenhuma alteração foi realizada.',
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Erro desconhecido';
    console.error(`Falha no bootstrap do administrador: ${message}`);
    process.exitCode = 1;
  } finally {
    await prisma?.$disconnect();
  }
}

if (require.main === module) {
  void run();
}

import { ConflictException, ServiceUnavailableException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { StatusConsulta, StatusMensagem, TipoMensagem } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { ConsultasService } from '../consultas/consultas.service';
import { MensagensService } from './mensagens.service';

const consulta = {
  id: 10,
  pacienteId: 1,
  medicoId: 2,
  data: new Date('2027-10-21T00:00:00.000Z'),
  hora: '14:30',
  status: StatusConsulta.AGENDADA,
  paciente: { nome: 'Maria Silva', telefone: '(42) 99999-0000' },
  medico: { nome: 'Dr. Carlos Souza' },
};

const mensagemPendente = {
  id: 5,
  tipo: TipoMensagem.CONFIRMACAO,
  status: StatusMensagem.PENDENTE,
  pacienteId: 1,
  consultaId: 10,
  telefone: '(42) 99999-0000',
  conteudo: 'Olá, Maria Silva! ...',
  agendadoPara: new Date(),
  enviadoEm: null,
  canceladoEm: null,
  whatsappMessageId: null,
  erro: null,
};

function createMockPrisma() {
  return {
    consulta: { findUnique: jest.fn(), findMany: jest.fn() },
    paciente: { findMany: jest.fn() },
    mensagem: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };
}

function createMockWhatsapp() {
  return { enviarTexto: jest.fn() };
}

function createMockConsultas() {
  return { confirmar: jest.fn() };
}

describe('MensagensService', () => {
  let service: MensagensService;
  let prisma: ReturnType<typeof createMockPrisma>;
  let whatsapp: ReturnType<typeof createMockWhatsapp>;
  let consultas: ReturnType<typeof createMockConsultas>;

  beforeEach(async () => {
    prisma = createMockPrisma();
    whatsapp = createMockWhatsapp();
    consultas = createMockConsultas();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MensagensService,
        { provide: PrismaService, useValue: prisma },
        { provide: WhatsappService, useValue: whatsapp },
        { provide: ConsultasService, useValue: consultas },
      ],
    }).compile();

    service = module.get(MensagensService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('agendarConfirmacao', () => {
    it('deve criar uma mensagem PENDENTE quando ainda não existe confirmação para a consulta', async () => {
      prisma.consulta.findUnique.mockResolvedValue(consulta);
      prisma.mensagem.findFirst.mockResolvedValue(null);

      await service.agendarConfirmacao(consulta.id);

      expect(prisma.mensagem.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tipo: TipoMensagem.CONFIRMACAO,
            consultaId: consulta.id,
            pacienteId: consulta.pacienteId,
            telefone: consulta.paciente.telefone,
          }),
        }),
      );
    });

    it('não deve duplicar a confirmação se já existir uma para a consulta', async () => {
      prisma.consulta.findUnique.mockResolvedValue(consulta);
      prisma.mensagem.findFirst.mockResolvedValue({ id: 99 });

      await service.agendarConfirmacao(consulta.id);

      expect(prisma.mensagem.create).not.toHaveBeenCalled();
    });

    it('não deve criar mensagem se o paciente não tiver telefone cadastrado', async () => {
      prisma.consulta.findUnique.mockResolvedValue({
        ...consulta,
        paciente: { ...consulta.paciente, telefone: '' },
      });

      await service.agendarConfirmacao(consulta.id);

      expect(prisma.mensagem.create).not.toHaveBeenCalled();
    });
  });

  describe('agendarLembretes', () => {
    it('não deve duplicar lembrete quando já existe um para a consulta', async () => {
      prisma.consulta.findMany.mockResolvedValue([consulta]);
      prisma.mensagem.findFirst.mockResolvedValue({ id: 1 });

      await service.agendarLembretes();

      expect(prisma.mensagem.create).not.toHaveBeenCalled();
    });

    it('deve criar lembrete quando a consulta é amanhã e ainda não tem lembrete', async () => {
      prisma.consulta.findMany.mockResolvedValue([consulta]);
      prisma.mensagem.findFirst.mockResolvedValue(null);

      await service.agendarLembretes();

      const hoje = new Date();
      const amanha = new Date(
        Date.UTC(
          hoje.getUTCFullYear(),
          hoje.getUTCMonth(),
          hoje.getUTCDate() + 1,
        ),
      );
      expect(prisma.consulta.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ data: amanha }),
        }),
      );
      expect(prisma.mensagem.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ tipo: TipoMensagem.LEMBRETE }),
        }),
      );
    });
  });

  describe('agendarAniversarios', () => {
    it('deve agendar mensagem só para pacientes aniversariantes hoje que ainda não a receberam este ano', async () => {
      const hoje = new Date();
      const aniversarianteHoje = {
        id: 1,
        nome: 'Ana Lima',
        telefone: '(42) 98888-0000',
        dataNascimento: new Date(
          Date.UTC(1990, hoje.getUTCMonth(), hoje.getUTCDate()),
        ),
      };
      const outroAniversario = {
        id: 2,
        nome: 'Beltrano',
        telefone: '(42) 97777-0000',
        dataNascimento: new Date(Date.UTC(1990, 0, 1)),
      };
      prisma.paciente.findMany.mockResolvedValue([
        aniversarianteHoje,
        outroAniversario,
      ]);
      prisma.mensagem.findFirst.mockResolvedValue(null);

      await service.agendarAniversarios();

      expect(prisma.mensagem.create).toHaveBeenCalledTimes(1);
      expect(prisma.mensagem.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tipo: TipoMensagem.ANIVERSARIO,
            pacienteId: aniversarianteHoje.id,
          }),
        }),
      );
    });
  });

  describe('enviarPendentesDevidos', () => {
    it('deve marcar como ENVIADA e salvar o id do whatsapp em caso de sucesso', async () => {
      prisma.mensagem.findMany.mockResolvedValue([mensagemPendente]);
      whatsapp.enviarTexto.mockResolvedValue({ whatsappMessageId: 'msg-1' });

      await service.enviarPendentesDevidos();

      expect(whatsapp.enviarTexto).toHaveBeenCalledWith(
        '5542999990000',
        mensagemPendente.conteudo,
      );
      expect(prisma.mensagem.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mensagemPendente.id },
          data: expect.objectContaining({
            status: StatusMensagem.ENVIADA,
            whatsappMessageId: 'msg-1',
          }),
        }),
      );
    }, 10000);

    it('deve deixar PENDENTE (sem marcar FALHA) quando o WhatsApp está desconectado', async () => {
      prisma.mensagem.findMany.mockResolvedValue([mensagemPendente]);
      whatsapp.enviarTexto.mockRejectedValue(
        new ServiceUnavailableException('desconectado'),
      );

      await service.enviarPendentesDevidos();

      expect(prisma.mensagem.update).not.toHaveBeenCalled();
    });

    it('deve marcar FALHA com mensagem segura quando o envio falha por outro motivo', async () => {
      prisma.mensagem.findMany.mockResolvedValue([mensagemPendente]);
      whatsapp.enviarTexto.mockRejectedValue(
        new Error('detalhe interno sensível do provedor'),
      );

      await service.enviarPendentesDevidos();

      expect(prisma.mensagem.update).toHaveBeenCalledWith({
        where: { id: mensagemPendente.id },
        data: {
          status: StatusMensagem.FALHA,
          erro: 'Falha ao enviar mensagem pelo WhatsApp.',
        },
      });
    });
  });

  describe('editarConteudo / cancelar / enviarAgora', () => {
    it('deve recusar editar mensagem que não está PENDENTE', async () => {
      prisma.mensagem.findUnique.mockResolvedValue({
        ...mensagemPendente,
        status: StatusMensagem.ENVIADA,
      });

      await expect(
        service.editarConteudo(mensagemPendente.id, 'novo texto'),
      ).rejects.toThrow(ConflictException);
    });

    it('deve editar o conteúdo de uma mensagem PENDENTE', async () => {
      prisma.mensagem.findUnique.mockResolvedValue(mensagemPendente);
      prisma.mensagem.update.mockResolvedValue({
        ...mensagemPendente,
        conteudo: 'novo texto',
      });

      await service.editarConteudo(mensagemPendente.id, 'novo texto');

      expect(prisma.mensagem.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mensagemPendente.id },
          data: { conteudo: 'novo texto' },
        }),
      );
    });

    it('deve cancelar uma mensagem PENDENTE', async () => {
      prisma.mensagem.findUnique.mockResolvedValue(mensagemPendente);
      prisma.mensagem.update.mockResolvedValue({
        ...mensagemPendente,
        status: StatusMensagem.CANCELADA,
      });

      await service.cancelar(mensagemPendente.id);

      expect(prisma.mensagem.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: StatusMensagem.CANCELADA }),
        }),
      );
    });

    it('enviarAgora deve propagar o erro quando o WhatsApp não está conectado', async () => {
      prisma.mensagem.findUnique.mockResolvedValue(mensagemPendente);
      whatsapp.enviarTexto.mockRejectedValue(
        new ServiceUnavailableException('desconectado'),
      );

      await expect(service.enviarAgora(mensagemPendente.id)).rejects.toThrow(
        ServiceUnavailableException,
      );
      expect(prisma.mensagem.update).not.toHaveBeenCalled();
    });

    it('enviarAgora deve enviar e retornar a mensagem atualizada quando conectado', async () => {
      prisma.mensagem.findUnique.mockResolvedValue(mensagemPendente);
      whatsapp.enviarTexto.mockResolvedValue({ whatsappMessageId: 'msg-2' });
      prisma.mensagem.findUniqueOrThrow.mockResolvedValue({
        ...mensagemPendente,
        status: StatusMensagem.ENVIADA,
      });

      const resultado = await service.enviarAgora(mensagemPendente.id);

      expect(resultado.status).toBe(StatusMensagem.ENVIADA);
    });
  });

  describe('processarMensagemRecebida', () => {
    it('deve ignorar mensagens de grupo', async () => {
      await service.processarMensagemRecebida('123-456@g.us', 'sim');

      expect(prisma.paciente.findMany).not.toHaveBeenCalled();
    });

    it('deve ignorar texto que não seja uma afirmação exata', async () => {
      await service.processarMensagemRecebida(
        '5542999990000@c.us',
        'sim, mas vou chegar atrasado',
      );

      expect(prisma.paciente.findMany).not.toHaveBeenCalled();
    });

    it('deve confirmar a consulta quando o telefone bate (com o 9º dígito) e a resposta é afirmativa', async () => {
      prisma.paciente.findMany.mockResolvedValue([
        { id: 1, telefone: '(42) 9999-0000' },
      ]);
      prisma.mensagem.findFirst.mockResolvedValue({
        id: 5,
        consultaId: 10,
      });

      await service.processarMensagemRecebida('5542999990000@c.us', 'Sim!');

      expect(consultas.confirmar).toHaveBeenCalledWith(10);
    });

    it('não deve confirmar quando não há mensagem enviada recente para aquele paciente', async () => {
      prisma.paciente.findMany.mockResolvedValue([
        { id: 1, telefone: '(42) 99999-0000' },
      ]);
      prisma.mensagem.findFirst.mockResolvedValue(null);

      await service.processarMensagemRecebida('5542999990000@c.us', 'sim');

      expect(consultas.confirmar).not.toHaveBeenCalled();
    });

    it('não deve confirmar quando nenhum paciente corresponde ao telefone remetente', async () => {
      prisma.paciente.findMany.mockResolvedValue([
        { id: 1, telefone: '(42) 91111-1111' },
      ]);

      await service.processarMensagemRecebida('5542999990000@c.us', 'sim');

      expect(consultas.confirmar).not.toHaveBeenCalled();
    });
  });
});

import { Injectable } from '@nestjs/common';

@Injectable()
export class PacientesService {
    private pacientes: any[] = [];

    listar() {
        return this.pacientes;
    }

    criar(paciente: any) {
        this.pacientes.push(paciente);
        return paciente;
    }

    atualizar(id: number, pacienteAtualizado: any) {
        this.pacientes[id] = pacienteAtualizado;
        return pacienteAtualizado;
    }

    remover(index: number) {
        this.pacientes.splice(index, 1);
        return { mensagem: 'Paciente removido com sucesso' };
    }

    buscar(nome: string) {
        return this.pacientes.filter(paciente =>
        paciente.nome.toLowerCase().includes(nome.toLowerCase())
        );
    }
}
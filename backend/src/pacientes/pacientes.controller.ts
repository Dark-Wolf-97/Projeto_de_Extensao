import { Controller, Get, Post, Put, Body, Delete, Param, Query } from '@nestjs/common';
import { PacientesService } from './pacientes.service';

@Controller('pacientes')
export class PacientesController {
    constructor(private readonly pacientesService: PacientesService) {}

    @Get()
    listar() {
        return this.pacientesService.listar();
    }

    @Post()
    criar(@Body() paciente) {
        return this.pacientesService.criar(paciente);
    }

    @Put(':id')
    atualizar(@Param('id') id: string, @Body() paciente: any) {
        return this.pacientesService.atualizar(Number(id), paciente);
    }

    @Delete(':id')
    remover(@Param('id') id: string) {
        return this.pacientesService.remover(Number(id));
    }

    @Get('buscar')
    buscar(@Query('nome') nome: string) {
        return this.pacientesService.buscar(nome);
    }
}
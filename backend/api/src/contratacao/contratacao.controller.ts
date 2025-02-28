// src/contratacao/contratacao.controller.ts
import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ContratacaoService } from './contratacao.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

@ApiTags('contratacoes')
@Controller('contratacoes')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ContratacaoController {
  constructor(private readonly contratacaoService: ContratacaoService) {}

  @Post()
  @ApiOperation({ summary: 'Criar nova contratação' })
  create(@Body() createContratacaoDto: any) {
    return this.contratacaoService.create(createContratacaoDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar contratações' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'empresaId', required: false, type: Number })
  @ApiQuery({ name: 'motoristaId', required: false, type: Number })
  findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('empresaId') empresaId?: string,
    @Query('motoristaId') motoristaId?: string,
  ) {
    return this.contratacaoService.findAll({
      page: +page,
      limit: +limit,
      empresaId: empresaId ? +empresaId : undefined,
      motoristaId: motoristaId ? +motoristaId : undefined,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter contratação pelo ID' })
  findOne(@Param('id') id: string) {
    return this.contratacaoService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar contratação' })
  update(@Param('id') id: string, @Body() updateContratacaoDto: any) {
    return this.contratacaoService.update(+id, updateContratacaoDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover contratação' })
  remove(@Param('id') id: string) {
    return this.contratacaoService.remove(+id);
  }
}
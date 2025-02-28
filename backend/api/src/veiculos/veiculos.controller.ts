// src/veiculos/veiculos.controller.ts
import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request } from '@nestjs/common';
import { VeiculosService } from './veiculos.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

@ApiTags('veiculos')
@Controller('veiculos')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class VeiculosController {
  constructor(private readonly veiculosService: VeiculosService) {}

  @Post()
  @ApiOperation({ summary: 'Criar novo veículo' })
  create(@Body() createVeiculoDto: any, @Request() req) {
    return this.veiculosService.create(createVeiculoDto, req.user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Listar veículos' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'proprietarioId', required: false, type: Number })
  findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('search') search = '',
    @Query('proprietarioId') proprietarioId?: string,
  ) {
    return this.veiculosService.findAll({
      page: +page,
      limit: +limit,
      search,
      proprietarioId: proprietarioId ? +proprietarioId : undefined,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter veículo pelo ID' })
  findOne(@Param('id') id: string) {
    return this.veiculosService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar veículo' })
  update(@Param('id') id: string, @Body() updateVeiculoDto: any) {
    return this.veiculosService.update(+id, updateVeiculoDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover veículo' })
  @Roles('ADMINISTRADOR')
  @UseGuards(RolesGuard)
  remove(@Param('id') id: string) {
    return this.veiculosService.remove(+id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Atualizar status de aprovação de um veículo' })
  @Roles('ANALISTA', 'ADMINISTRADOR')
  @UseGuards(RolesGuard)
  updateStatus(
    @Param('id') id: string,
    @Body('statusAprovacao') statusAprovacao: string,
    @Body('observacoes') observacoes: string,
  ) {
    return this.veiculosService.updateStatus(
      +id,
      statusAprovacao,
      observacoes,
    );
  }
}
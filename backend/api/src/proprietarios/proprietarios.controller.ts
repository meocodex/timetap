// src/proprietarios/proprietarios.controller.ts
import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request } from '@nestjs/common';
import { ProprietariosService } from './proprietarios.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

@ApiTags('proprietarios')
@Controller('proprietarios')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProprietariosController {
  constructor(private readonly proprietariosService: ProprietariosService) {}

  @Post()
  @ApiOperation({ summary: 'Criar novo proprietário' })
  create(@Body() createProprietarioDto: any, @Request() req) {
    return this.proprietariosService.create(createProprietarioDto, req.user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Listar proprietários' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'tipoPessoa', required: false, type: String })
  findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('search') search = '',
    @Query('tipoPessoa') tipoPessoa?: string,
  ) {
    return this.proprietariosService.findAll({
      page: +page,
      limit: +limit,
      search,
      tipoPessoa,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter proprietário pelo ID' })
  findOne(@Param('id') id: string) {
    return this.proprietariosService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar proprietário' })
  update(@Param('id') id: string, @Body() updateProprietarioDto: any) {
    return this.proprietariosService.update(+id, updateProprietarioDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover proprietário' })
  @Roles('ADMINISTRADOR')
  @UseGuards(RolesGuard)
  remove(@Param('id') id: string) {
    return this.proprietariosService.remove(+id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Atualizar status de aprovação de um proprietário' })
  @Roles('ANALISTA', 'ADMINISTRADOR')
  @UseGuards(RolesGuard)
  updateStatus(
    @Param('id') id: string,
    @Body('statusAprovacao') statusAprovacao: string,
    @Body('observacoes') observacoes: string,
  ) {
    return this.proprietariosService.updateStatus(
      +id,
      statusAprovacao,
      observacoes,
    );
  }
}
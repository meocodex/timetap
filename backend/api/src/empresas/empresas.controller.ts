// src/empresas/empresas.controller.ts
import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request } from '@nestjs/common';
import { EmpresasService } from './empresas.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

@ApiTags('empresas')
@Controller('empresas')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class EmpresasController {
  constructor(private readonly empresasService: EmpresasService) {}

  @Post()
  @ApiOperation({ summary: 'Criar nova empresa' })
  create(@Body() createEmpresaDto: any, @Request() req) {
    return this.empresasService.create(createEmpresaDto, req.user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Listar empresas' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('search') search = '',
  ) {
    return this.empresasService.findAll({
      page: +page,
      limit: +limit,
      search,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter empresa pelo ID' })
  findOne(@Param('id') id: string) {
    return this.empresasService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar empresa' })
  update(@Param('id') id: string, @Body() updateEmpresaDto: any) {
    return this.empresasService.update(+id, updateEmpresaDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover empresa' })
  @Roles('ADMINISTRADOR')
  @UseGuards(RolesGuard)
  remove(@Param('id') id: string) {
    return this.empresasService.remove(+id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Atualizar status de aprovação de uma empresa' })
  @Roles('ANALISTA', 'ADMINISTRADOR')
  @UseGuards(RolesGuard)
  updateStatus(
    @Param('id') id: string,
    @Body('statusAprovacao') statusAprovacao: string,
    @Body('observacoes') observacoes: string,
  ) {
    return this.empresasService.updateStatus(
      +id,
      statusAprovacao,
      observacoes,
    );
  }
}
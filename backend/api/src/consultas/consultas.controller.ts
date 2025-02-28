// src/consultas/consultas.controller.ts
import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ConsultasService } from './consultas.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

@ApiTags('consultas')
@Controller('consultas')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ConsultasController {
  constructor(private readonly consultasService: ConsultasService) {}

  @Post()
  @ApiOperation({ summary: 'Criar nova consulta' })
  create(@Body() createConsultaDto: any, @Request() req) {
    return this.consultasService.create(createConsultaDto, req.user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Listar consultas' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, type: String })
  findAll(
    @Request() req,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('status') status?: string,
  ) {
    return this.consultasService.findAll({
      page: +page,
      limit: +limit,
      status,
      userId: req.user.userId,
      perfil: req.user.perfil,
    });
  }

  @Get('recent')
  @ApiOperation({ summary: 'Obter consultas recentes' })
  getRecent() {
    return this.consultasService.getRecent();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter consulta pelo ID' })
  findOne(@Param('id') id: string) {
    return this.consultasService.findOne(+id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Atualizar status de uma consulta' })
  @Roles('ANALISTA', 'ADMINISTRADOR')
  @UseGuards(RolesGuard)
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @Body('observacoes') observacoes: string,
    @Request() req,
  ) {
    return this.consultasService.updateStatus(
      +id,
      status,
      observacoes,
      req.user.userId,
    );
  }
}
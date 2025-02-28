// backend/api/src/motoristas/motoristas.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Request,
} from '@nestjs/common';
import { MotoristasService } from './motoristas.service';
import { CreateMotoristaDto } from './dto/create-motorista.dto';
import { UpdateMotoristaDto } from './dto/update-motorista.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

@ApiTags('motoristas')
@Controller('motoristas')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MotoristasController {
  constructor(private readonly motoristasService: MotoristasService) {}

  @Post()
  @ApiOperation({ summary: 'Criar um novo motorista' })
  create(@Body() createMotoristaDto: CreateMotoristaDto, @Request() req) {
    return this.motoristasService.create(createMotoristaDto, req.user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos os motoristas' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('search') search = '',
  ) {
    return this.motoristasService.findAll({
      page: +page,
      limit: +limit,
      search,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter um motorista pelo ID' })
  findOne(@Param('id') id: string) {
    return this.motoristasService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar um motorista' })
  update(
    @Param('id') id: string,
    @Body() updateMotoristaDto: UpdateMotoristaDto,
    @Request() req,
  ) {
    return this.motoristasService.update(+id, updateMotoristaDto, req.user.userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover um motorista' })
  @Roles('ADMINISTRADOR')
  @UseGuards(RolesGuard)
  remove(@Param('id') id: string) {
    return this.motoristasService.remove(+id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Atualizar status de aprovação de um motorista' })
  @Roles('ANALISTA', 'ADMINISTRADOR')
  @UseGuards(RolesGuard)
  updateStatus(
    @Param('id') id: string,
    @Body('statusAprovacao') statusAprovacao: string,
    @Body('observacoes') observacoes: string,
    @Request() req,
  ) {
    return this.motoristasService.updateStatus(
      +id,
      statusAprovacao,
      observacoes,
      req.user.userId,
    );
  }
}
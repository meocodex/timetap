// src/anexos/anexos.controller.ts
import { Controller, Get, Post, Param, Delete, UseGuards, Body, Query, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AnexosService } from './anexos.service';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';

@ApiTags('anexos')
@Controller('anexos')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AnexosController {
  constructor(private readonly anexosService: AnexosService) {}

  @Get()
  @ApiOperation({ summary: 'Listar anexos' })
  findAll(
    @Query('entidadeId') entidadeId?: string,
    @Query('tipoEntidade') tipoEntidade?: string,
  ) {
    return this.anexosService.findAll({
      entidadeId: entidadeId ? +entidadeId : undefined,
      tipoEntidade,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter anexo pelo ID' })
  findOne(@Param('id') id: string) {
    return this.anexosService.findOne(+id);
  }

  @Post()
  @ApiOperation({ summary: 'Criar novo anexo' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('arquivo'))
  create(@Body() createAnexoDto: any, @UploadedFile() file: Express.Multer.File) {
    // Em produção, aqui você implementaria o upload para um serviço de armazenamento
    const anexoData = {
      ...createAnexoDto,
      nomeArquivo: file.originalname,
      caminhoArquivo: `/uploads/${file.originalname}`,
      tipoArquivo: file.mimetype,
      tamanhoBytes: file.size,
    };
    
    return this.anexosService.create(anexoData);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover anexo' })
  remove(@Param('id') id: string) {
    return this.anexosService.remove(+id);
  }
}
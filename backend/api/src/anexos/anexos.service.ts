// src/anexos/anexos.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';

@Injectable()
export class AnexosService {
  constructor(private prisma: PrismaService) {}

  async findAll(params: { entidadeId?: number; tipoEntidade?: string }) {
    const { entidadeId, tipoEntidade } = params;
    
    const where = {};
    
    if (entidadeId && tipoEntidade) {
      where[`${tipoEntidade.toLowerCase()}Id`] = entidadeId;
    }

    return this.prisma.anexo.findMany({
      where,
      orderBy: { criadoEm: 'desc' },
    });
  }

  async findOne(id: number) {
    const anexo = await this.prisma.anexo.findUnique({
      where: { id },
    });

    if (!anexo) {
      throw new NotFoundException(`Anexo com ID ${id} não encontrado`);
    }

    return anexo;
  }

  async create(data: any) {
    return this.prisma.anexo.create({
      data,
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    return this.prisma.anexo.delete({
      where: { id },
    });
  }
}
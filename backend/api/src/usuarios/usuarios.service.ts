// src/usuarios/usuarios.service.ts
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { Prisma, StatusUsuario } from '@prisma/client'; // Importa o enum StatusUsuario diretamente

@Injectable()
export class UsuariosService {
  constructor(private prisma: PrismaService) {}

  async create(createUsuarioDto: any) {
    // Verificar se já existe usuário com o mesmo email
    const existingUser = await this.prisma.usuario.findUnique({
      where: { email: createUsuarioDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email já cadastrado');
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(createUsuarioDto.senha, 10);

    return this.prisma.usuario.create({
      data: {
        ...createUsuarioDto,
        senha: hashedPassword,
      },
    });
  }

  async findAll(params: {
    page: number;
    limit: number;
    search: string;
    perfil?: string;
  }) {
    const { page, limit, search, perfil } = params;
    const skip = (page - 1) * limit;

    let where = {};
    
    if (search) {
      where = {
        OR: [
          { nome: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      };
    }
    
    if (perfil) {
      where = { ...where, perfil };
    }

    const [usuarios, total] = await Promise.all([
      this.prisma.usuario.findMany({
        skip,
        take: limit,
        where,
        select: {
          id: true,
          nome: true,
          email: true,
          perfil: true,
          status: true,
          ultimoLogin: true,
          criadoEm: true,
        },
        orderBy: { criadoEm: 'desc' },
      }),
      this.prisma.usuario.count({ where }),
    ]);

    return {
      data: usuarios,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id },
      select: {
        id: true,
        nome: true,
        email: true,
        perfil: true,
        status: true,
        ultimoLogin: true,
        criadoEm: true,
        atualizadoEm: true,
      },
    });

    if (!usuario) {
      throw new NotFoundException(`Usuário com ID ${id} não encontrado`);
    }

    return usuario;
  }

  async update(id: number, updateUsuarioDto: any) {
    const usuario = await this.findOne(id);

    // Se estiver atualizando o email, verificar se já existe
    if (updateUsuarioDto.email && updateUsuarioDto.email !== usuario.email) {
      const existingUser = await this.prisma.usuario.findUnique({
        where: { email: updateUsuarioDto.email },
      });

      if (existingUser) {
        throw new ConflictException('Email já cadastrado');
      }
    }

    // Se estiver atualizando a senha, fazer hash
    if (updateUsuarioDto.senha) {
      updateUsuarioDto.senha = await bcrypt.hash(updateUsuarioDto.senha, 10);
    }

    return this.prisma.usuario.update({
      where: { id },
      data: {
        ...updateUsuarioDto,
        atualizadoEm: new Date(),
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    return this.prisma.usuario.delete({
      where: { id },
    });
  }

  async updateStatus(id: number, status: string) {
    await this.findOne(id);

    // Converte a string para o valor do enum importado.
    const statusEnum = status as StatusUsuario;
    
    return this.prisma.usuario.update({
      where: { id },
      data: {
        status: statusEnum,
        atualizadoEm: new Date(),
      },
    });
  }
}

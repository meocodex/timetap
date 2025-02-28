// backend/api/src/prisma/prisma.service.ts
// src/prisma/prisma.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      log: ['query', 'info', 'warn', 'error'],
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  async cleanDatabase() {
    if (process.env.NODE_ENV === 'production') {
      return;
    }
    
    // Ordem correta para limpar todas as tabelas sem violar constraints
    const models = [
      'anexo',
      'contratacao',
      'consulta',
      'veiculo',
      'proprietario',
      'motorista',
      'empresa',
      'usuario',
    ];

    return Promise.all(
      models.map(async (model) => {
        try {
          return await this.$executeRawUnsafe(`TRUNCATE TABLE "${model}" CASCADE;`);
        } catch (error) {
          console.error(`Error truncating ${model}:`, error);
        }
      }),
    );
  }
}
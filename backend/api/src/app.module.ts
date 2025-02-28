// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '@prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { MotoristasModule } from './motoristas/motoristas.module';
import { VeiculosModule } from './veiculos/veiculos.module';
import { ProprietariosModule } from './proprietarios/proprietarios.module';
import { EmpresasModule } from './empresas/empresas.module';
import { ConsultasModule } from './consultas/consultas.module';
import { AnexosModule } from './anexos/anexos.module';
import { ContratacaoModule } from './contratacao/contratacao.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsuariosModule,
    MotoristasModule,
    VeiculosModule,
    ProprietariosModule,
    EmpresasModule,
    ConsultasModule,
    AnexosModule,
    ContratacaoModule
  ],
})
export class AppModule {}
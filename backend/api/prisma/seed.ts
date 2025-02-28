// backend/api/prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash('admin123', 10);
  const analistaPassword = await bcrypt.hash('analista123', 10);
  const clientePassword = await bcrypt.hash('cliente123', 10);

  // Criar usuários iniciais
  const admin = await prisma.usuario.upsert({
    where: { email: 'admin@spartakus.com' },
    update: {},
    create: {
      nome: 'Administrador',
      email: 'admin@spartakus.com',
      senha: adminPassword,
      perfil: 'ADMINISTRADOR',
    },
  });

  const analista = await prisma.usuario.upsert({
    where: { email: 'analista@spartakus.com' },
    update: {},
    create: {
      nome: 'Analista',
      email: 'analista@spartakus.com',
      senha: analistaPassword,
      perfil: 'ANALISTA',
    },
  });

  const cliente = await prisma.usuario.upsert({
    where: { email: 'cliente@email.com' },
    update: {},
    create: {
      nome: 'Cliente',
      email: 'cliente@email.com',
      senha: clientePassword,
      perfil: 'CLIENTE',
    },
  });

  console.log({ admin, analista, cliente });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
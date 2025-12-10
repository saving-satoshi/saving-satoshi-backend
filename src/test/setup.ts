import { PrismaClient } from '@prisma/client';
import express from 'express';
import { Server } from 'http';
import routes from 'routes/v1';
import cors from 'middleware/cors';

export const prisma = new PrismaClient();

export function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use(cors);
  app.use('/api/v1', routes);
  return app;
}

export let server: Server;
export let testApp: express.Application;

beforeAll(async () => {
  testApp = createTestApp();
  server = testApp.listen(0);

  await prisma.$connect();
});

afterEach(async () => {

  const tables = await prisma.$queryRaw<
    Array<{ tablename: string }>
  >`SELECT tablename FROM pg_tables WHERE schemaname='public'`;

  for (const { tablename } of tables) {
    if (tablename !== '_prisma_migrations') {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE "public"."${tablename}" CASCADE;`);
    }
  }
});

afterAll(async () => {
  await server.close();
  await prisma.$disconnect();
}); 
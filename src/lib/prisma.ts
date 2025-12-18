import { PrismaClient } from '@prisma/client'

export const prismaClient = new PrismaClient()

export async function disconnectFromDb() {
  await prismaClient.$disconnect()
}

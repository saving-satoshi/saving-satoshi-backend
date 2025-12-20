import { PrismaClient } from '@prisma/client'
import logger from './logger'

export const prismaClient = new PrismaClient()

export async function disconnectFromDb() {
  await prismaClient.$disconnect()
  logger.info('Successfully disconnected from database')
}

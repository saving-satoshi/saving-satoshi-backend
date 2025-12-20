import { PrismaClient } from '@prisma/client'
import logger from './logger'

export const prismaClient = new PrismaClient()

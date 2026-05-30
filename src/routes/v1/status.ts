import { Router } from 'express'
import { prismaClient } from 'lib/prisma'

const router = Router()

/**
 * Health check endpoint for ALB target group health checks
 * Verifies database connectivity to ensure the instance is ready to serve traffic
 */
router.get('/', async (req, res) => {
  try {
    // Verify database connectivity with a simple query
    await prismaClient.$queryRaw`SELECT 1`

    res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      checks: {
        database: 'healthy',
      },
    })
  } catch (error) {
    // Return 503 Service Unavailable if database is unreachable
    // This will cause the ALB to mark the target as unhealthy
    res.status(503).json({
      status: 'UNHEALTHY',
      timestamp: new Date().toISOString(),
      checks: {
        database: 'unhealthy',
      },
    })
  }
})

export default router

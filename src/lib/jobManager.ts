import type { Container } from 'dockerode'
import logger from './logger'

export class JobManager {
  private jobs: Map<
    string,
    {
      container: Container | null
      onKill: (() => Promise<void>) | null
      id?: string
      isRunning: boolean
    }
  >

  constructor() {
    this.jobs = new Map()
  }

  create(socketId: string, id?: string) {
    this.jobs.set(socketId, {
      container: null,
      onKill: null,
      id,
      isRunning: false,
    })
  }

  setRunning(socketId: string, isRunning: boolean) {
    const job = this.jobs.get(socketId)
    if (job) {
      job.isRunning = isRunning
      this.jobs.set(socketId, job)
    }
  }

  isRunning(socketId: string): boolean {
    return this.jobs.get(socketId)?.isRunning || false
  }

  get(socketId: string) {
    return this.jobs.get(socketId)
  }

  set(
    socketId: string,
    data: { container: Container; onKill: () => Promise<void>; id?: string }
  ) {
    const existing = this.jobs.get(socketId)
    this.jobs.set(socketId, {
      ...data,
      isRunning: existing?.isRunning || false,
    })
  }

  has(socketId: string): boolean {
    return this.jobs.has(socketId)
  }

  remove(socketId: string) {
    this.jobs.delete(socketId)
  }

  async cleanup(socketId: string) {
    try {
      const job = this.get(socketId)
      if (job && job.onKill && !job.isRunning) {
        await job.onKill()
      }
    } catch (error) {
      logger.error(`Failed to cleanup job for socket ${socketId}:`, error)
    } finally {
      this.remove(socketId)
    }
  }
}

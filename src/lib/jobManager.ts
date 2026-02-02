import type { Container } from 'dockerode'
import logger from './logger'

interface Job {
  container: Container | null
  onKill: (() => Promise<void>) | null
  id?: string
  socketId: string
  isRunning: boolean
}

export class JobManager {
  // Jobs are keyed by requestId (unique per code execution).
  private jobs: Map<string, Job>

  constructor() {
    this.jobs = new Map()
  }

  create(requestId: string, socketId: string, id?: string) {
    this.jobs.set(requestId, {
      container: null,
      onKill: null,
      id,
      socketId,
      isRunning: false,
    })
  }

  setRunning(requestId: string, isRunning: boolean) {
    const job = this.jobs.get(requestId)
    if (job) {
      job.isRunning = isRunning
      this.jobs.set(requestId, job)
    }
  }

  isRunning(requestId: string): boolean {
    return this.jobs.get(requestId)?.isRunning || false
  }

  get(requestId: string) {
    return this.jobs.get(requestId)
  }

  set(
    requestId: string,
    data: {
      container: Container
      onKill: () => Promise<void>
      id?: string
      socketId: string
    }
  ) {
    const existing = this.jobs.get(requestId)
    this.jobs.set(requestId, {
      ...data,
      isRunning: existing?.isRunning || false,
    })
  }

  has(requestId: string): boolean {
    return this.jobs.has(requestId)
  }

  remove(requestId: string) {
    this.jobs.delete(requestId)
  }

  async cleanup(requestId: string) {
    try {
      const job = this.get(requestId)
      if (!job) return

      // Only cleanup if the job is not running. If it's running, let the
      // container finish and clean up naturally.
      if (job.onKill && !job.isRunning) {
        await job.onKill()
        this.remove(requestId)
      }
      // If job is running, don't remove it - the container will clean up when done.
    } catch (error) {
      logger.error(`Failed to cleanup job ${requestId}:`, error)
      this.remove(requestId)
    }
  }

  // Cleanup all jobs associated with a given socketId (for WebSocket close).
  async cleanupBySocket(socketId: string) {
    const jobsToCleanup: string[] = []
    for (const [requestId, job] of this.jobs.entries()) {
      if (job.socketId === socketId) {
        jobsToCleanup.push(requestId)
      }
    }
    for (const requestId of jobsToCleanup) {
      await this.cleanup(requestId)
    }
  }

  hasJobsForSocket(socketId: string): boolean {
    for (const job of this.jobs.values()) {
      if (job.socketId === socketId) {
        return true
      }
    }
    return false
  }
}

